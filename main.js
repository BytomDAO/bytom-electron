const {app, BrowserWindow} = require('electron')
const autoUpdater = require('./auto-updater')
const glob = require('glob')
const i18n = require('./main-process/i18n.js')
const url = require('url')
const path = require('path')

let win

global.i18n = i18n

function initialize () {
  // const shouldQuit = makeSingleInstance()
  // if (shouldQuit) return app.quit()

  loadDemos()

  function createWindow() {
    // 创建浏览器窗口。
    win = new BrowserWindow({
      width: 1024 + 208,
      height: 768,
      'webPreferences': {
        'webSecurity': false,
        'preload': path.join(__dirname, '/main-process/preload.js')
      }
    })

    const startUrl = process.env.DEV_URL ||
      url.format({
        pathname: path.join(__dirname, '/public/index.html'),
        protocol: 'file:',
        slashes: true
      })
    // const startUrl = 'http://localhost:3000/'
    win.loadURL(startUrl)

    win.webContents.openDevTools()

    win.on('closed', () => {
      win = null
    })
  }

  // app.on('ready', createWindow)
  app.on('ready', () => {
    createWindow()
    autoUpdater.initialize()
  })

// 当全部窗口关闭时退出。
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (win === null) {
      createWindow()
    }
  })
}

function makeSingleInstance () {
  if (process.mas) return false

  return app.makeSingleInstance(() => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })
}

// Require each JS file in the main-process dir
function loadDemos () {
  const files = glob.sync(path.join(__dirname, 'main-process/menus/*.js'))
  files.forEach((file) => { require(file) })
  autoUpdater.updateMenu()
}

// Handle Squirrel on Windows startup events
switch (process.argv[1]) {
  case '--squirrel-install':
    autoUpdater.createShortcut(() => { app.quit() })
    break
  case '--squirrel-uninstall':
    autoUpdater.removeShortcut(() => { app.quit() })
    break
  case '--squirrel-obsolete':
  case '--squirrel-updated':
    app.quit()
    break
  default:
    initialize()
}
