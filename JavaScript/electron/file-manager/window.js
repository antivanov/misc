// Enable imports relative to the ./app directory
require('module').globalPaths.push(__dirname + '/app');

const { promisify } = require('util');
const electron = require('electron');

const store = require('./app/state/store');
require('./app/main.js');

const currentWindow = electron.remote.getCurrentWindow();

store.dispatch('goToDirectory', currentWindow.directory);