const {app, BrowserWindow} = require('electron')

let win

function createWindow () {
  // 创建浏览器窗口。
  win = new BrowserWindow({
    width: 1024,
    height: 768,
    'webPreferences': {'webSecurity': false}})

  win.loadURL('http://localhost:3000');


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
