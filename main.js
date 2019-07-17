require('babel-register')
require('events').EventEmitter.defaultMaxListeners = 100
const {app, BrowserWindow, ipcMain, shell} = require('electron')
const spawn = require('child_process').spawn
const glob = require('glob')
const url = require('url')
const path = require('path')
const fs = require('fs')
const logger = require('./modules/logger')
const log = logger.create('main')
const vapordLog = logger.create('vapord')
const Settings = require('./modules/settings')

const net = require('net')

let win, vapordInit, vapordNode

global.fileExist = false
global.mining = {isMining: false}
let startnode = false

Settings.init()

function initialize () {

  function createWindow() {
    // Create browser Window

    const icon_path = path.join(__dirname, '/static/images/app-icon/png/app.png')
    win = new BrowserWindow({
      width: 1024 + 208,
      height: 768,
      'webPreferences': {
        'webSecurity': !process.env.DEV_URL,
        'preload': path.join(__dirname, '/modules/preload.js')
      },
      icon: icon_path
    })

    const startUrl = process.env.DEV_URL ||
      url.format({
        pathname: path.join(__dirname, '/public/index.html'),
        protocol: 'file:',
        slashes: true
      })
    win.loadURL(startUrl)

    if(process.env.DEV){
      win.webContents.openDevTools()
    }

    win.webContents.on('new-window', function(e, url) {
      e.preventDefault()
      shell.openExternal(url)
    })

    win.webContents.on('did-finish-load', function () {
      if(startnode){
        win.webContents.send('ConfiguredNetwork', 'startNode')
      }
    })

    win.on('closed', () => {
      win = null
      app.quit()
    })
  }

  app.on('ready', () => {

    loadMenu()

    setupConfigure()

    vapord()

    createWindow()
  })

//All window Closed
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

  app.on('before-quit', () => {
    if(vapordInit){
      vapordInit.kill('SIGINT')
      log.info('Kill vapord Init command...')
    }
    if(vapordNode){
      vapordNode.kill('SIGINT')
      const killTimeout = setTimeout(() => {
        vapordNode.kill('SIGKILL')
      }, 8000 /* 8 seconds */)

      vapordNode.once('close', () => {
        clearTimeout(killTimeout)
        vapordNode = null
      })

      log.info('Kill vapord Mining command...')
    }
  })
}

function setVaporNode(event) {
  vapordNode = spawn( `${Settings.vapordPath}`, ['node', '--web.closed'] )

  vapordNode.stdout.on('data', function(data) {
    vapordLog.info(`vapord node: ${data}`)
  })

  vapordNode.stderr.on('data', function(data) {
    vapordLog.info(`vapord node: ${data}`)
    if (data.includes('msg="start node')) {
      if (event) {
        event.sender.send('ConfiguredNetwork', 'startNode')
      }
      else {
        startnode = true
        win.webContents.send('ConfiguredNetwork', 'startNode')
      }
    }

    vapordNode.on('exit', function (code) {
      vapordLog.info('vapor Node exited with code ' + code)
      app.quit()
    })
  })
}

function setVaporInit(event, vaporNetwork) {
  // Init vapord
  vapordInit = spawn(`${Settings.vapordPath}`, ['init', '--chain_id',  `${vaporNetwork}`] )

  vapordInit.stdout.on('data', function(data) {
    vapordLog.info(`vapord init: ${data}`)
  })

  vapordInit.stderr.on('data', function(data) {
    vapordLog.info(`vapord init: ${data}`)
  })

  vapordInit.on('exit', function (code) {
    event.sender.send('ConfiguredNetwork','init')
    setVaporNode(event)
    vapordLog.info('vapor init exited with code ' + code)
  })

  vapordInit.once('close', () => {
    vapordInit = null
  })
}

function vapord(){
  const filePath = path.join(`${Settings.vapordDataPath}/config.toml`)
  if (fs.existsSync(filePath)) {
    log.info('Vapord Network has been inited')
    global.fileExist = true
    setVaporNode()
  }else {
    log.info('Init Vapord Network...')
    ipcMain.on('vapordInitNetwork', (event, arg) => {
      setVaporInit( event,  arg )
    })
  }
}

// Require each JS file in the main-process dir
function loadMenu () {
  const files = glob.sync(path.join(__dirname, 'modules/menus/*.js'))
  files.forEach((file) => { require(file) })
}

function setupConfigure(){
  const logFolder = {logFolder: path.join(app.getPath('userData'), 'logs')}
  const loggerOptions = Object.assign(logFolder)
  logger.setup(loggerOptions)
}


// Handle Squirrel on Windows startup events
switch (process.argv[1]) {
  case '--squirrel-install':
  case '--squirrel-uninstall':
  case '--squirrel-obsolete':
  case '--squirrel-updated':
    app.quit()
    break
  default:
    initialize()
}

