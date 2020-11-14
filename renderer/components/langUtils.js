/* global require */
import osLocale from 'os-locale'

const defaultLocale = 'en'
const defaultLocaleName = 'English'
const localeDir = '../../lang'

export const getMessages = (locale = null) => {
  const defaultMessages = require('../../lang/en.json')

  // TODO check if ${locale} is supported

  const localeMessages = require(`../../lang/${locale}.json`)
  const mergedMessages = Object.assign({}, defaultMessages, localeMessages)
  return mergedMessages

  // if (typeof window !== 'undefined' && window.OONITranslations) {
  //   supportedMessages = window.OONITranslations
  // }
  //
  // if (supportedMessages.hasOwnProperty(locale)) {
  //   const mergedMessages = Object.assign(
  //     {},
  //     process.env.INTL_USE_FALLBACK_EN ? supportedMessages[defaultLocale] : {},
  //     supportedMessages[locale])
  //   return mergedMessages
  // } else {
  //   return defaultMessages
  // }
}

export const getSupportedLanguages = () => {
  if (typeof window !== 'undefined' && window.OONITranslations) {
    const supportedLanguages = Object.keys(window.OONITranslations)
    return supportedLanguages
  } else {
    return [defaultLocale]
  }
}

export const getLocale = () => {
  // fallback to en
  let navigatorLang = defaultLocale

  // If available, use locale information provided by window.navigator (chrome)
  if (typeof window !== 'undefined') {
    navigatorLang = window.navigator.userLanguage || window.navigator.language
  }

  // If found, use os-locale to detect user's system locale
  navigatorLang = osLocale.sync() || navigatorLang

  return navigatorLang.split('-')[0].split('_')[0]
}
