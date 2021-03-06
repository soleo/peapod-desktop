'use strict';
const electron = require('electron');
const {app, BrowserWindow} = require('electron');
const path = require('path');
const fs = require('fs');
const appMenu = require('./menu');
const tray = require('./tray');
const config = require('./config');

const PEAPOD_BASE_URL = 'https://www.peapod.com';
const PEAPOD_AUTH_URL = `${PEAPOD_BASE_URL}/shop/auth/`;
const isDevelopment = process.env.NODE_ENV !== 'production';

require('electron-debug')();
require('electron-dl')();
require('electron-context-menu')();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let isQuitting = false;

const isAlreadyRunning = app.makeSingleInstance(() => {
	if (mainWindow) {
		if (mainWindow.isMinimized()) {
			mainWindow.restore();
		}
		mainWindow.show();
	}
});

if (isAlreadyRunning) {
	app.quit();
}

function createMainWindow() {
	const lastWindowState = config.get('lastWindowState');
	const maxWindowInteger = 2147483647; // used to set max window width/height when toggling fullscreen
	const maxWidthValue = 850;
	// Create the browser window.
	mainWindow = new BrowserWindow({
		title: app.getName(),
		show: false,
		//titleBarStyle: 'hidden-inset',
		// Set the default background color of the window to match the CSS
	    // background color of the page, this prevents any white flickering
	    backgroundColor: "#f2f2f2",
		x: lastWindowState.x,
		y: lastWindowState.y,
		width: lastWindowState.width,
		height: lastWindowState.height,
		icon: process.platform === 'linux' && path.join(__static, '/Icon.png'),
		autoHideMenuBar: true,
		webPreferences: {
			preload: path.join(__static, '/browser.js'),
			plugins: true,
			nodeIntegration: false
		}
	});

	if (process.platform === 'darwin') {
		mainWindow.setSheetOffset(40);
	}

	if(isDevelopment) {
		mainWindow.openDevTools();
	}

	mainWindow.loadURL(PEAPOD_AUTH_URL);

	mainWindow.setTitle(app.getName());

	// Emitted when the window is closed.
	mainWindow.on('close', e => {
		if (!isQuitting) {
			e.preventDefault();

			if (process.platform === 'darwin') {
				app.hide();
			} else {
				mainWindow.hide();
			}
		}
	});

	mainWindow.on('page-title-updated', e => {
		e.preventDefault();
	});

	mainWindow.on('enter-full-screen', () => {
		mainWindow.setMaximumSize(maxWindowInteger, maxWindowInteger);
	});

	mainWindow.on('leave-full-screen', () => {
		mainWindow.setMaximumSize(maxWidthValue, maxWindowInteger);
	});

	return mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
	electron.Menu.setApplicationMenu(appMenu);
	mainWindow = createMainWindow();
	tray.create(mainWindow);

	const page = mainWindow.webContents;

	page.on('dom-ready', () => {
		page.insertCSS(fs.readFileSync(path.join(__static, '/browser.css'), 'utf8'));
		page.insertCSS(fs.readFileSync(path.join(__static, '/night-mode.css'), 'utf8'));
		mainWindow.show();
	});

	page.on('new-window', (e, url) => {
		e.preventDefault();
		electron.shell.openExternal(url);
	});
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	mainWindow.show();
});

app.on('before-quit', () => {
	isQuitting = true;

	if (!mainWindow.isFullScreen()) {
		config.set('lastWindowState', mainWindow.getBounds());
	}
});
