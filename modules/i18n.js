/**
The i18n module, loads the language files and initializes i18next

@module i18n
*/
const i18n = require('i18next')
const extend = require('lodash/extend')

const LanguageDetector = require('i18next-browser-languagedetector')


const supported_languages = ['en', 'zh']

const resources = {
  dev: { translations: require('./interface/i18n/desktop.en.i18n.json') },
}

// add supported languages
supported_languages.forEach((lang) => {
  const desktopTranslations = require(`./interface/i18n/desktop.${lang}.i18n.json`)
  const uiTranslations = require(`./interface/locales/${lang}/translation.json`)
  resources[lang] = { translations: extend(desktopTranslations, uiTranslations) }
})

/**
* Given a language code, get best matched code from supported languages.
*
* > getBestMatchedLangCode('en-US')
* 'en'
* > getBestMatchedLangCode('zh-TW')
* 'zh-TW'
* > getBestMatchedLangCode('no-such-code')
* 'en'
*/
i18n.getBestMatchedLangCode = (langCode) => {
  const codeList = Object.keys(resources)
  let bestMatchedCode = langCode
  if (codeList.indexOf(langCode) === -1) {
    if (codeList.indexOf(langCode.substr(0, 2)) > -1) {
      bestMatchedCode = langCode.substr(0, 2)
    } else {
      bestMatchedCode = 'en'
    }
  }
  return bestMatchedCode
}

i18n.use(LanguageDetector).init({
  lng:   global.language,
  fallbackLng:  'en',
  resources,
  interpolation: {
    escapeValue: false, // not needed for react!!
    prefix: '__',
    suffix: '__'
  },
  debug: false,

  ns: ['translations'],
  defaultNS: 'translations',

  detection: {
    // order and from where user language should be detected
    order: ['localStorage', 'querystring', 'cookie',  'navigator', 'htmlTag', 'path', 'subdomain']
  },

  react: {
    wait: true,
    bindStore: false
  }
})

module.exports = i18n
