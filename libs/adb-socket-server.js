const  { FastServer } = require('./fast-server');
const  { createServer } = require ("http");
const  { Server } = require("socket.io");
const fs = require('fs');
let devicesData = JSON.parse(fs.readFileSync('./data/devices.json', 'utf8'));
let actionsData = JSON.parse(fs.readFileSync('./data/actions.json', 'utf8'));

let Log = null;
class AdbSocketServer{
    constructor(Logger){                
        Log = Logger;
		const clients = [];
		const devices = [];
		const clusters = [];
		this.startServer(clients,clusters);
		this.startServerCluster(clients,clusters); 
    }
	startServer(clients,clusters){
		const fastServer = new FastServer(Log,"7000", __dirname + '/public');		
		const httpServer = createServer(fastServer);
        const io = new Server(httpServer, {   
			cors: {
				origin: "*",
				methods: ["GET", "POST"],
				}         
        });
        io.on("connection", (socket) => {    
            Log.i("Socket connected");
            clients.push(socket);
  			socket.broadcast.emit("clusters", clusters);
			socket.on("disconnect", () => {
           		Log.i("socket disconnected");
				clients.slice(socket,1);
			});
        });
        httpServer.listen(7000,()=>{
            Log.i("Server connected");
        });		
	}
	startServerCluster(clients,clusters){
		const httpCluster = createServer();
		const ioCluster = new Server(httpCluster, {   
			cors: {
				origin: "*",
				methods: ["GET", "POST"],
				}         
        });
        ioCluster.on("connection", (socket) => {    
            Log.i("Cluster Socket connected");
            clusters.push(socket);
			socket.on("disconnect", () => {
           		Log.i("Cluster Socket disconnected");
				clusters.slice(socket,1);
			});
			socket.on("devices", (devices) => {
				Log.o(devices);
				/*socket.emit("adb",{"action": "adb",
							"devices": "NBA34BOAC5042652",
							"data": {
								"command": "am start -n com.zhiliaoapp.musically/com.ss.android.ugc.aweme.splash.SplashActivity"
							}});*/
			});
        });
		ioCluster.listen(9000,()=>{
            Log.i("Cluster Server connected");
        });
	}
}

module.exports = {AdbSocketServer};