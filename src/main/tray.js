'use strict';
const path = require('path');
const electron = require('electron');

const app = electron.app;
let tray = null;

exports.create = win => {
	if (process.platform !== 'darwin' || tray) {
		return;
	}

	const iconPath = path.join(__static, '/IconTray.png');

	const toggleWin = () => {
		if (win.isVisible()) {
			win.hide();
		} else {
			win.show();
		}
	};

	const checkOutNow = () => {
		console.log('Check Out Shopping Cart');
	};

	const contextMenu = electron.Menu.buildFromTemplate([
		{
			label: 'Show/Hide Window',
			click() {
				toggleWin();
			}
		},
		{
			label: 'Checkout Cart',
			click() {
				checkOutNow();
			}
		},
		{
			type: 'separator'
		},
		{
			role: 'quit'
		}
	]);

	tray = new electron.Tray(iconPath);
	tray.setToolTip(`${app.getName()}`);
	tray.setContextMenu(contextMenu);
	tray.on('click', toggleWin);
};

exports.setBadge = shouldDisplayNoneEmptyCart => {
	if (process.platform !== 'darwin' || !tray) {
		return;
	}

	const icon = shouldDisplayNoneEmptyCart ? 'IconTrayNoneEmptyCart.png' : 'IconTray.png';
	const iconPath = path.join(__static, `/${icon}`);
	tray.setImage(iconPath);
};
