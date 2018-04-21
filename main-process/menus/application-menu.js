const { Menu, app, shell, ipcMain, dialog } = require('electron')
const settings = require('electron-settings')
global.language = settings.get('browserSetting.core.lang') || app.getLocale()
const i18n = require('../i18n.js')
global.i18n = i18n
const path = require('path')
const logger = require('../logger')
const log = logger.create('menu')

let advNav = settings.get('browserSetting.app.navAdvancedState') || 'normal'
let btmAmountUnit = settings.get('browserSetting.core.btmAmountUnit') || 'BTM'
let menu = null

const logFolder = {logFolder: path.join(app.getPath('userData'), 'logs')}
const loggerOptions = Object.assign(logFolder)
logger.setup(loggerOptions)

let menuTempl = function () {
  const menu = []
  // APP
  const fileMenu = []
  const name = app.getName()

  if (process.platform === 'darwin') {
    fileMenu.push(
      {
        label: i18n.t('desktop.applicationMenu.app.about', { name }),
        role: 'about'
      },
      {
        type: 'separator',
      },
      {
        label: i18n.t('desktop.applicationMenu.app.services', { name }),
        role: 'services',
        submenu: [],
      },
      {
        type: 'separator',
      },
      {
        label: i18n.t('desktop.applicationMenu.app.hide', { name }),
        accelerator: 'Command+H',
        role: 'hide',
      },
      {
        label: i18n.t('desktop.applicationMenu.app.hideOthers', { name }),
        accelerator: 'Command+Alt+H',
        role: 'hideothers',
      },
      {
        label: i18n.t('desktop.applicationMenu.app.showAll', { name }),
        role: 'unhide',
      },
      {
        type: 'separator',
      }
    )
  }

  fileMenu.push({
    label: i18n.t('desktop.applicationMenu.app.quit', { name }),
    accelerator: 'CommandOrControl+Q',
    click() {
      app.quit()
    },
  })

  menu.push({
    label: i18n.t('desktop.applicationMenu.app.label', { name }),
    submenu: fileMenu,
  })


  // View Account
  menu.push({
    label: i18n.t('desktop.applicationMenu.account.label'),
    submenu: [{
      label:  i18n.t('desktop.applicationMenu.account.new'),
      accelerator: 'CommandOrControl+N',
      click: (item, focusedWindow) => {
        if (focusedWindow) {
          focusedWindow.webContents.send('redirect', '/accounts/create')
        }
      }
    }]
  })


  //EDIT
  menu.push({
    label: i18n.t('desktop.applicationMenu.edit.label'),
    submenu: [
      {
        label: i18n.t('desktop.applicationMenu.edit.undo'),
        accelerator: 'CommandOrControl+Z',
        role: 'undo',
      },
      {
        label: i18n.t('desktop.applicationMenu.edit.redo'),
        accelerator: 'Shift+CommandOrControl+Z',
        role: 'redo',
      },
      {
        type: 'separator',
      },
      {
        label: i18n.t('desktop.applicationMenu.edit.cut'),
        accelerator: 'CommandOrControl+X',
        role: 'cut',
      },
      {
        label: i18n.t('desktop.applicationMenu.edit.copy'),
        accelerator: 'CommandOrControl+C',
        role: 'copy',
      },
      {
        label: i18n.t('desktop.applicationMenu.edit.paste'),
        accelerator: 'CommandOrControl+V',
        role: 'paste',
      },
      {
        label: i18n.t('desktop.applicationMenu.edit.selectAll'),
        accelerator: 'CommandOrControl+A',
        role: 'selectall',
      },
    ],
  })


  // LANGUAGE (VIEW)
  const defaultLanguage = i18n.getBestMatchedLangCode(app.getLocale())
  let currentLanguage = settings.get('browserSetting.core.lang') || defaultLanguage
  const LanguageMenu = [{
    label: i18n.t('desktop.applicationMenu.view.default'),
    type: 'checkbox',
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        i18n.changeLanguage(defaultLanguage, (err, t) => {
          if (err) return log.error('something went wrong loading', err)
          focusedWindow.webContents.send('lang', defaultLanguage)
          createMenu()
        })
      }
    }
  },{
    type: 'separator'
  },{
    label: i18n.t('desktop.applicationMenu.view.langCodes.zh'),
    type: 'checkbox',
    checked: currentLanguage === 'zh',
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        i18n.changeLanguage('zh', (err, t) => {
          if (err) return log.error('something went wrong loading', err)
          focusedWindow.webContents.send('lang', 'zh')
          createMenu()
        })

      }
    }
  },{
    label: i18n.t('desktop.applicationMenu.view.langCodes.en'),
    type: 'checkbox',
    checked: currentLanguage === 'en',
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        i18n.changeLanguage('en', (err, t) => {
          if (err) return log.error('something went wrong loading', err)
          focusedWindow.webContents.send('lang', 'en')
          createMenu()
        })
      }
    }
  }]



  menu.push({
    label: i18n.t('desktop.applicationMenu.view.label'),
    submenu: [{
      label: i18n.t('desktop.applicationMenu.view.btmAmountUnit'),
      submenu:[{
        label: 'BTM',
        type: 'checkbox',
        checked: btmAmountUnit === 'BTM',
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            focusedWindow.webContents.send('btmAmountUnitState', 'BTM')
          }
        }
      },{
        label: 'mBTM',
        type: 'checkbox',
        checked: btmAmountUnit === 'mBTM',
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            focusedWindow.webContents.send('btmAmountUnitState', 'mBTM')
          }
        }
      },{
        label: 'NEU',
        type: 'checkbox',
        checked: btmAmountUnit === 'NEU',
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            focusedWindow.webContents.send('btmAmountUnitState', 'NEU')
          }
        }
      }]
    }, {
      label: i18n.t('desktop.applicationMenu.view.advNav'),
      type: 'checkbox',
      checked: advNav === 'advance',
      click: (item, focusedWindow) => {
        if (focusedWindow) {
          if(advNav === 'advance'){
            focusedWindow.webContents.send('toggleNavState', 'normal')
          }else{
            focusedWindow.webContents.send('toggleNavState', 'advance')
          }
        }
      }
    },{
      type: 'separator'
    },{
      label: i18n.t('desktop.applicationMenu.view.languages'),
      submenu: LanguageMenu
    }]
  })

  const devToolsMenu =[]
  devToolsMenu.push({
    label: i18n.t('desktop.applicationMenu.develop.devTools'),
    accelerator: (() => {
      if (process.platform === 'darwin') {
        return 'Alt+Command+I'
      } else {
        return 'Ctrl+Shift+I'
      }
    })(),
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.toggleDevTools()
      }
    }
  },{
    label: i18n.t('desktop.applicationMenu.develop.fullScreen'),
    accelerator: (() => {
      if (process.platform === 'darwin') {
        return 'Ctrl+Command+F'
      } else {
        return 'F11'
      }
    })(),
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
      }
    }
  },{
    label: i18n.t('desktop.applicationMenu.develop.logFiles'),
    click() {
      try {
        shell.showItemInFolder(path.join(app.getPath('userData'), 'logs', 'bytomd', 'bytomd.log'))
      } catch (error) {
        log.error(error)
      }
    },
  },{
    type: 'separator'
  },{
    label: (global.mining.isMining) ? i18n.t('desktop.applicationMenu.develop.stopMining') : i18n.t('desktop.applicationMenu.develop.startMining'),
    accelerator: 'CommandOrControl+Shift+M',
    enabled: true,
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        if (global.mining.isMining) {
          stopMining(focusedWindow)
        } else {
          startMining(focusedWindow)
        }
      }
    }
  })

  menu.push({
    label: i18n.t('desktop.applicationMenu.develop.label'),
    submenu: devToolsMenu,
  })

  // HELP
  const helpMenu = []

    if (process.platform === 'freebsd' || process.platform === 'linux' ||
      process.platform === 'sunos' || process.platform === 'win32') {
    helpMenu.push(
      {
        label: i18n.t('desktop.applicationMenu.app.about', { app: name }),
        click() {
          const options = {
            type: 'info',
            title: `${i18n.t('desktop.applicationMenu.app.about')} ${name}`,
            message: `${name} \n\n${i18n.t('desktop.applicationMenu.help.version')}: ${app.getVersion()}\nLicense: AGPL-3.0-only`,
            buttons: [i18n.t('desktop.global.ok')]
          }
          dialog.showMessageBox( options )
        },
      }
    )
  }

  helpMenu.push({
    label: i18n.t('desktop.applicationMenu.help.bytomWiki'),
    click() {
      shell.openExternal('https://github.com/bytom/bytom/wiki')
    },
  }, {
    label: i18n.t('desktop.applicationMenu.help.reportBug'),
    click() {
      shell.openExternal('https://github.com/bytom/bytom/issues')
    },
  })

  menu.push({
    label: i18n.t('desktop.applicationMenu.help.label'),
    role: 'help',
    submenu: helpMenu,
  })

  return menu
}

const startMining = (focusedWindow) => {
  focusedWindow.webContents.send('mining', 'true')
  global.mining.isMining = true
  createMenu()
}

const stopMining = (focusedWindow) => {
  focusedWindow.webContents.send('mining', 'false')
  global.mining.isMining = false
  createMenu()
}

const createMenu = function () {
  log.info('Create Menu')
  menu = Menu.buildFromTemplate(menuTempl())
  Menu.setApplicationMenu(menu)
}

settings.watch('browserSetting.app.navAdvancedState', newValue => {
  advNav = newValue
  menu.items[3].submenu.items[1].checked = ( advNav === 'advance' )
})

settings.watch('browserSetting.core.btmAmountUnit', newValue => {
  btmAmountUnit = newValue
  menu.items[3].submenu.items[0].submenu.items[0].checked = ( btmAmountUnit === 'BTM' )
  menu.items[3].submenu.items[0].submenu.items[1].checked = ( btmAmountUnit === 'mBTM' )
  menu.items[3].submenu.items[0].submenu.items[2].checked = ( btmAmountUnit === 'NEU' )
})

settings.watch('browserSetting.core.lang', newValue => {
  i18n.changeLanguage(newValue, (err, t) => {
    if (err) return log.error('i18n: something went wrong loading', err)
    createMenu()
  })
})

ipcMain.on('refresh-menu', function() {
  createMenu()
})

module.exports = createMenu()
