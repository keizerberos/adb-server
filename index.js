const {AdbSocketServer} = require('./libs/adb-socket-server');
const {Logger} = require('atx-logger');
const {DBManager}  	= require("./libs/database/dbmanager.js");
const Log = new Logger();
const dbm = new DBManager();

const adbSocketServer = new AdbSocketServer(Log,dbm);


