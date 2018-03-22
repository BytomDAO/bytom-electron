const {app, BrowserWindow} = require('electron')
const autoUpdater = require('./auto-updater')
const exec = require('child_process').exec
const glob = require('glob')
const fs = require('fs')
const i18n = require('./main-process/i18n.js')
const url = require('url')
const path = require('path')

let win, bytomdInit, bytomdMining

global.i18n = i18n

function initialize () {
  // const shouldQuit = makeSingleInstance()
  // if (shouldQuit) return app.quit()

  loadMenu()

  function createWindow() {
    // 创建浏览器窗口。
    win = new BrowserWindow({
      width: 1024 + 208,
      height: 768,
      'webPreferences': {
        'webSecurity': !process.env.DEV_URL,
        'preload': path.join(__dirname, '/main-process/preload.js')
      }
    })


    const startUrl = process.env.DEV_URL ||
      url.format({
        pathname: path.join(__dirname, '/public/index.html'),
        protocol: 'file:',
        slashes: true
      })
    win.loadURL(startUrl)

    win.webContents.openDevTools()

    win.on('closed', () => {
      win = null
      quitApp('closed')
    })

  }

  app.on('ready', () => {
    fs.stat('$GOPATH/src/github.com/bytom/cmd/bytomd/.bytomd/genesis.json', function(err) {
      if(err == null) {
        console.log('File exists')
      } else if(err.code == 'ENOENT') {
        // file does not exist
        bytomdInit = exec('cd $GOPATH/src/github.com/bytom/cmd/bytomd/ && ./bytomd init --chain_id mainnet' ,
          (error, stdout, stderr) => {
            if (error) {
              console.error(`bytomd init exec error: ${error}`)
              return
            }
            console.log(`bytomd init stdout: ${stdout}`)
            console.log(`bytomd init stderr: ${stderr}`)
          })
      } else {
        console.log('Some other error: ', err.code)
      }
    })


    bytomdMining = exec('cd $GOPATH/src/github.com/bytom/cmd/bytomd/ && ./bytomd node --mining' ,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`bytomd mining exec error: ${error}`)
          return
        }
        console.log(`bytomd mining stdout: ${stdout}`)
        console.log(`bytomd mining stderr: ${stderr}`)
      })

    createWindow()
    autoUpdater.initialize()
  })

  app.on('before-quit',() => {
    if(bytomdInit != null){
      bytomdInit.kill()
    }
    bytomdMining.kill()
  })


// 当全部窗口关闭时退出。
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      quitApp('window-all-closed')
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
function loadMenu () {
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


function quitApp (type) {
  if(bytomdInit != null){
    bytomdInit.kill()
  }
  bytomdMining.kill()
  app.quit()
}