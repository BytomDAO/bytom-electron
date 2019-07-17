const { app } = require('electron')
const path = require('path')
const glob = require('glob')

// import logger from './logger'

let instance = null

class Settings {
  constructor() {
    if (!instance) {
      instance = this
    }

    return instance
  }

  init() {
    // const logLevel = { logLevel: 'info' }
    // const logFolder = { logFolder: path.join(this.userDataPath, 'logs') }
    // const loggerOptions = Object.assign('info', logLevel, logFolder)
    // logger.setup(loggerOptions)
  }

  get userDataPath() {
    return app.getPath('userData')
  }

  get appDataPath() {
    // Application Support/
    return app.getPath('appData')
  }

  get userHomePath() {
    return app.getPath('home')
  }

  get vapordPath() {
    return process.env.DEV?
      path.join(__dirname, '../vapord/vapord-darwin_amd64'):
      glob.sync( path.join(__dirname, '../../vapord/vapord*'))
  }

  get vapordDataPath(){
    let vapordDataPath
    switch (process.platform){
      case 'win32':
        vapordDataPath = `${app.getPath('appData')}/Vapor`
        break
      case 'darwin':
        vapordDataPath = `${app.getPath('home')}/Library/Application Support/Vapor`
        break
      case 'linux':
        vapordDataPath = `${app.getPath('home')}/.bytom`
    }
    return bytomdDataPath
  }

  constructUserDataPath(filePath) {
    return path.join(this.userDataPath, filePath)
  }
}

module.exports = new Settings()
