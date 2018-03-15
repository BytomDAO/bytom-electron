const {app, BrowserWindow} = require('electron')

const url = require('url')
const path = require('path')

let win

function createWindow () {
  // 创建浏览器窗口。
  win = new BrowserWindow({
    width: 1024 + 208,
    height: 768,
    'webPreferences': {'webSecurity': false}})

  const startUrl = process.env.DEV_URL ||
    url.format({
      pathname: path.join(__dirname, '/public/index.html'),
      protocol: 'file:',
      slashes: true
    })
  win.loadURL(startUrl)


  win.on('closed', () => {
    win = null
  })
}

app.on('ready', createWindow)

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
