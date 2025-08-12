const {AdbSocketServer} = require('./libs/adb-socket-server');
const {Logger} = require('atx-logger');
const Log = new Logger();

const adbSocketServer = new AdbSocketServer(Log);


