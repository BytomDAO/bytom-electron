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

  get bytomdPath() {
    return process.env.DEV?
      path.join(__dirname, '../bytomd/bytomd-darwin_amd64'):
      glob.sync( path.join(__dirname, '../../bytomd/bytomd*'))
  }

  get bytomdDataPath(){
    let bytomdDataPath
    switch (process.platform){
      case 'win32':
        bytomdDataPath = `${app.getPath('appData')}/Bytom-2`
        break
      case 'darwin':
        bytomdDataPath = `${app.getPath('home')}/Library/Application Support/Bytom-2`
        break
      case 'linux':
        bytomdDataPath = `${app.getPath('home')}/.bytom-2`
    }
    return bytomdDataPath
  }

  constructUserDataPath(filePath) {
    return path.join(this.userDataPath, filePath)
  }
}

module.exports = new Settings()
