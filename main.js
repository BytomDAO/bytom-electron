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
const bytomdLog = logger.create('bytomd')
const Settings = require('./modules/settings')

const tcpPortUsed = require('tcp-port-used');

let win, bytomdInit, bytomdNode

global.fileExist = false
global.mining = {isMining: false}
let startnode = false

Settings.init()

function initialize () {

  function createWindow() {
    // Create browser Window

    const icon_path = path.join(__dirname, '/static/images/app-icon/png/app.png')
    win = new BrowserWindow({
      width: 1024 + 238,
      height: 768,
      titleBarStyle: 'hidden',
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

    bytomd()

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
    if(bytomdInit){
      bytomdInit.kill('SIGINT')
      log.info('Kill bytomd Init command...')
    }
    if(bytomdNode){
      bytomdNode.kill('SIGINT')
      const killTimeout = setTimeout(() => {
        bytomdNode.kill('SIGKILL')
      }, 8000 /* 8 seconds */)

      bytomdNode.once('close', () => {
        clearTimeout(killTimeout)
        bytomdNode = null
      })

      log.info('Kill bytomd Mining command...')
    }
  })
}

function setBytomNode(event) {
  bytomdNode = spawn( `${Settings.bytomdPath}`, ['node', '--web.closed'] )

  bytomdNode.stdout.on('data', function(data) {
    bytomdLog.info(`bytomd node: ${data}`)
  })

  bytomdNode.stderr.on('data', function(data) {
    bytomdNode.on('exit', function (code) {
      bytomdLog.info('bytom Node exited with code ' + code)
      app.quit()
    })
  })

  tcpPortUsed.waitUntilUsed(9888, 500, 20000)
    .then(function() {
      if (event) {
        event.sender.send('ConfiguredNetwork', 'startNode')
      }
      else {
        startnode = true
        win.webContents.send('ConfiguredNetwork', 'startNode')
      }
    }, function(err) {
      bytomdLog.info('Error:', err.message);
    });
}

function setBytomInit(event, bytomNetwork) {
  // Init bytomd
  bytomdInit = spawn(`${Settings.bytomdPath}`, ['init', '--chain_id',  `${bytomNetwork}`] )

  bytomdInit.stdout.on('data', function(data) {
    bytomdLog.info(`bytomd init: ${data}`)
  })

  bytomdInit.stderr.on('data', function(data) {
    bytomdLog.info(`bytomd init: ${data}`)
  })

  bytomdInit.on('exit', function (code) {
    event.sender.send('ConfiguredNetwork','init')
    setBytomNode(event)
    bytomdLog.info('bytom init exited with code ' + code)
  })

  bytomdInit.once('close', () => {
    bytomdInit = null
  })
}

function bytomd(){
  const filePath = path.join(`${Settings.bytomdDataPath}/config.toml`)
  if (fs.existsSync(filePath)) {
    log.info('Bytomd Network has been inited')
    global.fileExist = true
    setBytomNode()
  }else {
    log.info('Init Bytomd Network...')
    ipcMain.on('bytomdInitNetwork', (event, arg) => {
      setBytomInit( event,  arg )
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

