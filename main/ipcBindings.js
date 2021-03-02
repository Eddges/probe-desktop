const { app } = require('electron')
const log = require('electron-log')
const fs = require('fs-extra')
const { listResults } = require('./actions')
const { Runner } = require('./utils/ooni/run')
const onboard = require('./utils/ooni/onboard')
const store = require('./utils/store')

// BUG: The idea *was* to use these constants across main and renderer processes
// to wire up the IPC channels. But importing these directly from renderer
// scripts throws this error: https://github.com/sindresorhus/electron-util/issues/27
const inputFileRequest = 'fs.write.request'
const inputFileResponse = 'fs.write.response'
const lastResultRequest = 'results.last.request'
const lastResultResponse = 'results.last.response'

let testRunner = null
let stopRequested = false
let autorunPromptWaiting = false

const ipcBindingsForMain = (ipcMain) => {

  ipcMain.on(inputFileRequest, async (event, data) => {
    const tempDirectoryPath = app.getPath('temp')
    const tempFilename = `${tempDirectoryPath}/${Date.now()}`
    fs.writeFileSync(tempFilename, data.toString())

    // NOTE: We should watch out if this can cause UI/renderer process to block
    event.reply(inputFileResponse, {
      filename: tempFilename
    })
  })

  ipcMain.on(lastResultRequest, async (event, data) => {
    const { testGroupName } = data
    let lastTested = null
    const results = await listResults()
    if ('rows' in results && results.rows.length > 0) {
      const filteredRows = results.rows.filter(row =>
        testGroupName !== 'all' ? row.name === testGroupName : true
      )
      lastTested = filteredRows.length > 0
        ? filteredRows[filteredRows.length - 1].start_time
        : null
    }
    event.reply(lastResultResponse, {
      lastResult: lastTested
    })
  })

  ipcMain.on('ooniprobe.run', async (event, { testGroupToRun, inputFile }) => {
    const sender = event.sender
    // TODO: Should figure out a way to share this list between main and renderer
    // Cannot import `testGroups` as-is from 'renderer/components/nettests/index.js'
    const supportedTestGroups = ['websites', 'circumvention', 'im', 'middlebox', 'performance']
    // if testGroupToRun is `all` then iterate on a list of all runnable testGroups
    // instead of launching `ooniprobe all` to avoid the maxRuntimeTimer killing
    // tests other than `websites`
    const groupsToRun = testGroupToRun === 'all' ? (
      supportedTestGroups.filter(x => x !== 'default')
    ) : (
      [testGroupToRun]
    )

    // Reset any previous
    stopRequested = false
    for (const testGroup of groupsToRun) {
      if (stopRequested) {
        stopRequested = false
        break
      }
      testRunner = new Runner({
        testGroupName: testGroup,
        inputFile: inputFile
      })

      try {
        sender.send('ooniprobe.running-test', testGroup)
        await testRunner.run()
        sender.send('ooniprobe.done', testGroup)
      } catch (error) {
        sender.send('ooniprobe.error', error)
      }
    }
    sender.send('ooniprobe.completed')
    testRunner = null
  })

  ipcMain.on('ooniprobe.stop', async (event) => {
    if (!testRunner) {
      // if there is not test running, then tell renderer to move on
      stopRequested = false
      event.sender.send('ooniprobe.completed')
    } else {
      testRunner.kill()
      stopRequested = true
    }
  })

  ipcMain.handle('config.onboard', async (event, { optout = false }) => {
    await onboard({ optout })
  })

  ipcMain.handle('autorun.schedule', async () => {
    store.set('autorun.remind', false)
    store.set('autorun.enabled', true)
    const scheduleAutorun = require('./utils/autorun/schedule')
    await scheduleAutorun()
    log.debug('Autorun cancelled.')
  })

  ipcMain.on('autorun.cancel', async () => {
    store.set('autorun.remind', false)
    store.set('autorun.enabled', false)
    log.debug('Autorun cancelled.')
  })

  ipcMain.on('autorun.maybe-remind', async (event) => {
    // check if autorun is already cancelled or enabled in preferences, then skip the reminder
    const autorunPrefs = store.get('autorun')
    if (autorunPrefs.remind === false || autorunPrefs.enabled === true) {
      log.info('Skip reminding about autorun because it is already already enabled or explicitly cancelled.')
      return
    }
    if (!autorunPromptWaiting) {
      autorunPromptWaiting = true
      setTimeout(() => {
        event.sender.send('autorun.showPrompt')
        autorunPromptWaiting = false
      }, 10000)
    }
  })

  ipcMain.handle('list-results', async (event, resultID = null) => {
    const { listResults, listMeasurements } = require('./actions')
    if (resultID) {
      return listMeasurements(resultID)
    } else {
      return listResults()
    }
  })

  ipcMain.handle('prefs.save', async (event, { key, value }) => {
    return store.set(key, value)
  })

  ipcMain.handle('prefs.get', (event, key) => {
    return store.get(key)
  })
}

module.exports = {
  inputFileRequest,
  inputFileResponse,
  lastResultRequest,
  lastResultResponse,
  ipcBindingsForMain
}
