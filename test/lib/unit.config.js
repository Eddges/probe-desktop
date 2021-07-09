module.exports = {
  rootDir: '../../',
  testPathIgnorePatterns: ['/.next/', '/node_modules/'],
  setupFilesAfterEnv: ['<rootDir>/test/lib/setupTests.js'],
  verbose: true,
  roots: ['<rootDir>/test', '<rootDir>/renderer', '<rootDir>/main'],
  testSequencer: '<rootDir>/test/lib/sequencer.js',
  moduleNameMapper: {
    'electron': '<rootDir>/test/mocks/electronMock.js',
    // '../../renderer/components/settings/useConfig.js': '<rootDir>/test/mocks/useConfigMock.js',
  },
}
