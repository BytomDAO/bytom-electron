const {app, BrowserWindow} = require('electron')
const autoUpdater = require('./auto-updater')
const exec = require('child_process').exec
const glob = require('glob')
const i18n = require('./main-process/i18n.js')
const url = require('url')
const path = require('path')
const fs = require('fs')
const logger = require('./main-process/logger')
const log = logger.create('main')

let win, bytomdInit, bytomdMining

global.i18n = i18n


function initialize () {
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
    const logFolder = {logFolder: path.join(app.getPath('userData'), 'logs')}
    const loggerOptions = Object.assign(logFolder)
    logger.setup(loggerOptions)

    // callStat()
    fs.stat(`${process.env.GOPATH}/src/github.com/bytom/cmd/bytomd/.bytomd/genesis.json`, function(err) {
      if(err == null) {
        log.info('Genesis File exists')
        setBytomMining()
      } else if(err.code == 'ENOENT') {
        // file does not exist
        bytomdInit = exec('cd $GOPATH/src/github.com/bytom/cmd/bytomd/ && ./bytomd init --chain_id mainnet' ,
          (error, stdout, stderr) => {
            if (error) {
              log.error(`bytomd init exec error: ${error}`)
              return
            }
            // log.info(`bytomd init stdout: ${stdout}`)
            // log.info(`bytomd init stderr: ${stderr}`)
          })
        bytomdInit.stdout.on('data', function(data) {
          log.info(`bytomd init stdout: ${data}`)
        })
        bytomdInit.stderr.on('data', function(data) {
          log.info(`bytomd init stderr: ${data}`)
        })
        bytomdInit.on('exit', function (code) {
          setBytomMining()
          log.info('bytom init exited with code ' + code)
        })

      } else {
        log.error('Some other error: ', err.code)
      }

    })

    createWindow()
    // autoUpdater.initialize()
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

function setBytomMining() {
  bytomdMining = exec('cd $GOPATH/src/github.com/bytom/cmd/bytomd/ && ./bytomd node --mining' ,
    (error, stdout, stderr) => {
      if (error) {
        log.error(`bytomd mining exec error: ${error}`)
      }
      log.info(`bytomd mining stdout: ${stdout}`)
      log.info(`bytomd mining stderr: ${stderr}`)
      // createWindow()
    })

  bytomdMining.stdout.on('data', function(data) {
    log.info(`bytomd mining stdout: ${data}`)
  })

  bytomdMining.stderr.on('data', function(data) {

    log.info(`bytomd mining stderr: ${data}`)
  })

  bytomdMining.on('exit', function (code) {
    log.info('bytom Mining exited with code ' + code)
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


function quitApp () {
  if(bytomdInit != null){
    bytomdInit.kill()
  }
  bytomdMining.kill()
  app.quit()
}

