const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const { app: expressApp, server } = require('../../app');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '..', '..', 'public', 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        server.close(() => {
            console.log('Express server closed');
            app.quit();
        });
    }
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});

// The Express server is now started in app.js
