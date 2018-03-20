const {BrowserWindow, Menu, app, shell, dialog} = require('electron')
const settings = require('electron-settings')
const url  = require('url')

let advNav = settings.get('browserSetting.app.navAdvancedState') || 'normal'
let btmAmountUnit = settings.get('browserSetting.core.btmAmountUnit') || 'BTM'

let template = [{
  label: 'Account',
  submenu: [{
    label: 'new Account',
    accelerator: 'CommandOrControl+N',
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        focusedWindow.webContents.send('redirect', '/accounts/create')
      }
    }
  }, {
    label: 'Toggle Full Screen',
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
  }, {
    label: 'Toggle Developer Tools',
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
  }]
}, {
  label: 'View',
  submenu: [{
    label: 'BTM Amount Unit',
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
    label: 'Advanced Navigation',
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
    label: 'Lanugage'
  }]
}, {
  label: 'Help',
  role: 'help',
  submenu: [{
    label: 'Troubleshooting and Help',
    click() {
      shell.openExternal('https://github.com/bytom/bytom/wiki')
    },
  }, {
    label: 'Report an issue on Github',
    click() {
      shell.openExternal('https://github.com/bytom/bytom/issues')
    },
  }]
}]

function addUpdateMenuItems (items, position) {
  if (process.mas) return

  const version = app.getVersion()
  let updateItems = [{
    label: `Version ${version}`,
    enabled: false
  }, {
    label: 'Checking for Update',
    enabled: false,
    key: 'checkingForUpdate'
  }, {
    label: 'Check for Update',
    visible: false,
    key: 'checkForUpdate',
    click: () => {
      require('electron').autoUpdater.checkForUpdates()
    }
  }, {
    label: 'Restart and Install Update',
    enabled: true,
    visible: false,
    key: 'restartToUpdate',
    click: () => {
      require('electron').autoUpdater.quitAndInstall()
    }
  }]

  items.splice.apply(items, [position, 0].concat(updateItems))
}

function findReopenMenuItem () {
  const menu = Menu.getApplicationMenu()
  if (!menu) return

  let reopenMenuItem
  menu.items.forEach(item => {
    if (item.submenu) {
      item.submenu.items.forEach(item => {
        if (item.key === 'reopenMenuItem') {
          reopenMenuItem = item
        }
      })
    }
  })
  return reopenMenuItem
}

if (process.platform === 'darwin') {
  const name = app.getName()
  template.unshift({
    label: name,
    submenu: [{
      label: `About ${name}`,
      role: 'about'
    }, {
      type: 'separator'
    }, {
      label: 'Services',
      role: 'services',
      submenu: []
    }, {
      type: 'separator'
    }, {
      label: `Hide ${name}`,
      accelerator: 'Command+H',
      role: 'hide'
    }, {
      label: 'Hide Others',
      accelerator: 'Command+Alt+H',
      role: 'hideothers'
    }, {
      label: 'Show All',
      role: 'unhide'
    }, {
      type: 'separator'
    }, {
      label: 'Quit',
      accelerator: 'Command+Q',
      click: () => {
        app.quit()
      }
    }]
  })


  addUpdateMenuItems(template[0].submenu, 1)
}

if (process.platform === 'win32') {
  const helpMenu = template[template.length - 1].submenu
  addUpdateMenuItems(helpMenu, 0)
}

app.on('ready', () => {
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  settings.watch('browserSetting.app.navAdvancedState', newValue => {
    advNav = newValue
    menu.items[2].submenu.items[1].checked = ( advNav === 'advance' )
  })

  settings.watch('browserSetting.core.btmAmountUnit', newValue => {
    btmAmountUnit = newValue
    menu.items[2].submenu.items[0].submenu.items[0].checked = ( btmAmountUnit === 'BTM' )
    menu.items[2].submenu.items[0].submenu.items[1].checked = ( btmAmountUnit === 'mBTM' )
    menu.items[2].submenu.items[0].submenu.items[2].checked = ( btmAmountUnit === 'NEU' )
  })

})

app.on('browser-window-created', () => {
  let reopenMenuItem = findReopenMenuItem()
  if (reopenMenuItem) reopenMenuItem.enabled = false
})

app.on('window-all-closed', () => {
  let reopenMenuItem = findReopenMenuItem()
  if (reopenMenuItem) reopenMenuItem.enabled = true
})
