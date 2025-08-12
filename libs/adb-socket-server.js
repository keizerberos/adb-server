const { FastServer } = require('./fast-server');
const { createServer } = require("http");
const { Server } = require("socket.io");
const short = require('short-uuid');
const fs = require('fs');
let devicesData = JSON.parse(fs.readFileSync('./data/devices.json', 'utf8'));
let actionsData = JSON.parse(fs.readFileSync('./data/actions.json', 'utf8'));
let taskData 	= JSON.parse(fs.readFileSync('./data/task.json', 'utf8'));

let Log = null;

function generateUniqueId(str) {
	const hash = crypto.createHash('sha256'); // Ysou can choose a different hash algorithm if needed
	hash.update(str);
	return hash.digest('hex');
}
function dget(array, id, val) {
	const el = array.find(d => d[id] == val);
	return el;
}
function ddelete(array, id, val) {
	const el = array.find(d => d[id] == val);
	if (el != null)
		array.splice(array.indexOf(el), 1);
}
class AdbSocketServer {
	constructor(Logger) {
		Log = Logger;
		const clients = [];
		const devices = [];
		const clusters = [];
		this.startServer(clients, clusters, devices);
		this.startServerCluster(clients, clusters, devices);
	}
	//UI
	startServer(clients, clusters, devices) {
		const fastServer = new FastServer(Log, "7000", __dirname + '/public');
		const httpServer = createServer(fastServer);
		const io = new Server(httpServer, {
			cors: {
				origin: "*",
				methods: ["GET", "POST"],
			}
		});
		io.on("connection", (socket) => {
			let uuid = short.generate();
			clients.push({ socket: socket, uuid: uuid });
			Log.i("Socket connected " + uuid);

			socket.emit("clusters", clusters.map(c => c.uuid));
			socket.emit("devices", devices);

			socket.on("disconnect", () => {
				Log.i("socket disconnected " + uuid);
				ddelete(clients, 'uuid', uuid);
			});
			socket.on("device.assign", (data) => {
				Log.i("device.assign ");
				Log.o(data);
			});
			socket.on("device.adb", (data) => {
				Log.i("device.adb data");
				Log.o(data);
				if (data.action == 'adb') {
					const device = dget(devices, 'serial', data.devices);
					if (device != null) {
						const cluster = dget(clusters, 'uuid', device.clusterId);
						cluster.socket.emit("adb", data);
					}
				}
			});
			socket.on("device.adb", (data) => {
				Log.i("device.adb data");
				Log.o(data);
				if (data.action == 'Screen') {
					const device = dget(devices, 'serial', data.devices);
					if (device != null) {
						const cluster = dget(clusters, 'uuid', device.clusterId);
						cluster.socket.emit("screen", data);
					}
				}
			});

		});
		httpServer.listen(7000, () => {
			Log.i("Server connected");
		});
	}
	//CLUSTER
	startServerCluster(clients, clusters, devices) {
		const httpCluster = createServer();
		const ioCluster = new Server(httpCluster, {
			cors: {
				origin: "*",
				methods: ["GET", "POST"],
			}
		});
		ioCluster.on("connection", (socket) => {
			let uuid = short.generate();
			Log.i("Cluster Socket connected " + uuid);
			const cluster = { socket: socket, devices: [], uuid, uuid };
			clusters.push(cluster);
			clients.forEach(client => client.socket.emit("cluster.connect", uuid));
			socket.on("disconnect", () => {
				Log.i("Cluster Socket disconnected " + uuid);
				let clusterDevices = devices.filter(d => d.clusterId == uuid);			
				console.log("delete devices",clusterDevices);
				clusterDevices.forEach(device => clients.forEach(client => client.socket.emit("device.disconnect", device)));	
				clusterDevices.forEach(device => { ddelete(devices, 'serial', device.serial)});
				ddelete(clusters, 'uuid', uuid);
				clients.forEach(client => client.socket.emit("cluster.disconnect", uuid));
			});
			socket.on("devices", (clusterDevices) => {
				Log.i("Devices received");
				Log.o(clusterDevices);
				clusterDevices.forEach(device => {
					const deviceTemp = dget(devices, 'serial', device.serial);
					if (deviceTemp == null)
						devices.push(device);
					if (devicesData.devicesAssign[device.serial] != null)
						device['number'] = devicesData.devicesAssign[device.serial].number;
					else
						device['number'] = -1;
					device['clusterId'] = uuid;
				});
				clients.forEach(client => client.socket.emit("devices", devices));
			});

			socket.on("device.connect", (device) => {
				console.log("device.connect", device)				
				const createdDevice = dget(devices, 'serial', device.serial);
			
				if (createdDevice == null)
					devices.push(device);
				if (devicesData.devicesAssign[device.serial] != null)
					device['number'] = devicesData.devicesAssign[device.serial].number;
				else
					device['number'] = -1;
				device['clusterId'] = uuid;
				const data = {};
				clients.forEach(client => client.socket.emit("device.connect", device));
			});
			socket.on("device.disconnect", (device) => {
				console.log("devices.disconnect", device)
				ddelete(devices, 'serial', device.serial);
				clients.forEach(client => client.socket.emit("device.disconnect", device));
			});
			socket.on("device.capture", (data) => {
				clients.forEach(client => client.socket.emit("device.capture", data));
			});
		});
		ioCluster.listen(9000, () => {
			Log.i("Cluster Server connected");
		});
	}
}

module.exports = { AdbSocketServer };