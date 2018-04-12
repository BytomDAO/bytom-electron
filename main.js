const {app, BrowserWindow, ipcMain} = require('electron')
const spawn = require('child_process').spawn
const glob = require('glob')
const url = require('url')
const path = require('path')
const fs = require('fs')
const logger = require('./main-process/logger')
const log = logger.create('main')
const bytomdLog = logger.create('bytomd')

let win, bytomdInit, bytomdMining

global.fileExist = false
global.mining = {isMining: false}

function initialize () {

  function createWindow() {
    // Create browser Window
    win = new BrowserWindow({
      width: 1024 + 208,
      height: 768,
      'webPreferences': {
        'webSecurity': !process.env.DEV_URL,
        'preload': path.join(__dirname, '/main-process/preload.js')
      }
    })

    if (process.platform === 'linux') {
      win.icon = path.join(__dirname, '/static/images/app-icon/png/app.png')
    }

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
    if(bytomdMining){
      bytomdMining.kill('SIGINT')
      const killTimeout = setTimeout(() => {
        bytomdMining.kill('SIGKILL')
      }, 8000 /* 8 seconds */)

      bytomdMining.once('close', () => {
        clearTimeout(killTimeout)
        bytomdMining = null
      })

      log.info('Kill bytomd Mining command...')
    }
  })
}
const bytomdPath = process.env.DEV?
  path.join(__dirname, '/bytomd/bytomd-darwin_amd64'):
  glob.sync( path.join(__dirname, '/bytomd/bytomd*').replace('app.asar', 'app.asar.unpacked'))

const bytomdDataPath = path.join(app.getPath('userData'), '/.bytomd')
function setBytomMining(event) {
  bytomdMining = spawn( `${bytomdPath}`, ['node', '--home' , `${bytomdDataPath}`, '--web.closed'] )

  bytomdMining.stdout.on('data', function(data) {
    bytomdLog.info(`bytomd mining stdout: ${data}`)
  })

  bytomdMining.stderr.on('data', function(data) {
    bytomdLog.info(`bytomd mining stderr: ${data}`)
    if(data.includes('msg="Started node"') && event){
      event.sender.send('ConfiguredNetwork','startNode')
    }
  })

  bytomdMining.on('exit', function (code) {
    bytomdLog.info('bytom Mining exited with code ' + code)
  })
}

function setBytomInit(event, bytomNetwork) {
  // Init bytomd
  bytomdInit = spawn(`${bytomdPath}`, ['init', '--chain_id',  `${bytomNetwork}`, '--home' , `${bytomdDataPath}`] )

  bytomdInit.stdout.on('data', function(data) {
    bytomdLog.info(`bytomd init stdout: ${data}`)
  })

  bytomdInit.stderr.on('data', function(data) {
    bytomdLog.info(`bytomd init stderr: ${data}`)
  })

  bytomdInit.on('exit', function (code) {
    event.sender.send('ConfiguredNetwork','init')
    setBytomMining(event)
    bytomdLog.info('bytom init exited with code ' + code)
  })
}

function bytomd(){
  const filePath = path.join(app.getPath('userData'), '/.bytomd/genesis.json')

  fs.stat(`${filePath}`, function(err) {
    if(err == null) {
      log.info('Genesis File exists')
      global.fileExist = true
      setBytomMining()

      let genesisFile = fs.readFileSync(filePath)
      genesisFile = JSON.parse(genesisFile)

      global.networkStatus = genesisFile.chain_id

    } else if(err.code == 'ENOENT') {
      //wait for the int network call
      ipcMain.on('bytomdInitNetwork', (event, arg) => {
        setBytomInit( event,  arg )
        global.networkStatus = arg
      })
    } else {
      log.error('Some other error: ', err.code)
    }
  })
}

// Require each JS file in the main-process dir
function loadMenu () {
  const files = glob.sync(path.join(__dirname, 'main-process/menus/*.js'))
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

