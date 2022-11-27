const { app, BrowserWindow, ipcMain, Notification } = require('electron')
const { initialize, enable } = require('@electron/remote/main')

const path = require('path')
const isDev = require('electron-is-dev')

initialize()

app.whenReady().then(() => {
    // Create the browser window.
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            nodeIntegrationInWorker: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    enable(window.webContents)

    //load the index.html from a url
    window.loadURL(isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../build/index.html')}`
    )
})

// display notifications
ipcMain.on('notify', (_, message) => new Notification({ title: 'Notification', body: message }).show())


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true