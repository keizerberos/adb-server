const { FastServer } = require('./fast-server');
const { createServer } = require("http");
const { Server } = require("socket.io");

const {Executor,genPlant} = require("./executor.js");
const short = require('short-uuid');
const fs = require('fs');
let devicesData = JSON.parse(fs.readFileSync('./data/devices.json', 'utf8'));
let actionsData = JSON.parse(fs.readFileSync('./data/actions.json', 'utf8'));
let patternsData = JSON.parse(fs.readFileSync('./data/patterns.json', 'utf8'));

let tasks = {};
let actions = {};
const taskPath = "./data/tasks";
const actionsPath = "./data/actions";

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
function scanTasksFolfer() {
	fs.readdirSync(taskPath).forEach((file) => {
   		let base = taskPath + '/' + file;
		if (!fs.statSync(base).isDirectory()) {
			console.log("base",base);
			const content = fs.readFileSync(base, 'utf8');
			if (content=='') return;
			const task =  JSON.parse(content);
			Object.keys(task).forEach(k=>tasks[k] = task[k]);			
		}
	});
	fs.readdirSync(actionsPath).forEach((file) => {
   		let base = actionsPath + '/' + file;
		if (!fs.statSync(base).isDirectory()) {
			console.log("base",base);
			const content = fs.readFileSync(base, 'utf8');
			if (content=='') return;
			const action =  JSON.parse(content);
			Object.keys(action).forEach(k=>actions[k] = action[k]);	
		}
	});
	//console.log("tasks",tasks)
	//console.log("actions",actions)
}
class AdbSocketServer {
	constructor(Logger) {
		Log = Logger;
		this.executor = new Executor();
		const clients = [];
		const devices = [];
		const clusters = [];
		this.startServer(clients, clusters, devices);
		this.startServerCluster(clients, clusters, devices);
		scanTasksFolfer();
		this.executor.setActions(actions);
		this.executor.setPatterns(patternsData);
		this.drawProgressForm();		
	}
	//UI
	drawProgressForm(){		
		Object.keys(tasks).forEach(k => {
			tasks[k]['progressPath'] = genPlant(tasks[k]);
			console.log("progressPath",tasks[k]['progressPath']);
		});
	}
	startServer(clients, clusters, devices) {
		const fastServer = new FastServer(Log, "7000", __dirname + '/public');
		const httpServer = createServer(fastServer);
		const io = new Server(httpServer, {
				pingInterval: 1000, 
				pingTimeout: 1500,
			cors: {
				origin: "*",
				methods: ["GET", "POST"],
			}
		});
		this.executor.on('send',(data)=>{
			console.log(data);
			const device = dget(devices, 'serial', data.devices);
			if (device != null) {
				const cluster = dget(clusters, 'uuid', device.clusterId);
				
				cluster.socket.emit(data.action, data);
			}
		});
		this.executor.on('task.progress',(deviceId,progress)=>{
			Log.i("task.progress");
			Log.o(progress);
			const device = dget(devices, 'serial', deviceId);
			if (device != null) {							
				device['progress'] = progress;
				clients.forEach(client => client.socket.emit("task.progress", {serial:deviceId,data:progress}));
			}
		});
		io.on("connection", (socket) => {
			let uuid = short.generate();
			clients.push({ socket: socket, uuid: uuid });
			Log.i("Socket connected " + uuid);

			socket.emit("clusters", clusters.map(c => c.uuid));
			socket.emit("tasks", tasks);
			socket.emit("actions", actions);
			socket.emit("devices", devices);

			socket.on("disconnect", () => {
				Log.i("socket disconnected " + uuid);
				ddelete(clients, 'uuid', uuid);
			});
			socket.on("device.assign", (data) => {
				Log.i("device.assign ");
				Log.o(data);
				
			});
			socket.on("tasks.stop", (data) => {
				Log.i("tasks.stop ");
				Log.o(data);				
				this.executor.stop();
			});
			socket.on("adb.install.keyboard", (data) => {
				Log.i("adb.install.keyboard ");
				Log.o(data);				
				const device = dget(devices, 'serial', data.devices);
				if (device != null) {
					const cluster = dget(clusters, 'uuid', device.clusterId);
					cluster.socket.emit("install.keyboard", data);
				}
			});
			socket.on("adb.install.wifi", (data) => {
				Log.i("adb.install.wifi ");
				Log.o(data);				
				const device = dget(devices, 'serial', data.devices);
				if (device != null) {
					const cluster = dget(clusters, 'uuid', device.clusterId);
					cluster.socket.emit("install.wifi", data);
				}
			});
			socket.on("adb.install.gni", (data) => {
				Log.i("adb.install.gni ");
				Log.o(data);				
				const device = dget(devices, 'serial', data.devices);
				if (device != null) {
					const cluster = dget(clusters, 'uuid', device.clusterId);
					cluster.socket.emit("install.gni", data);
				}
			});
			socket.on("tethering.start", (data) => {
				Log.i("tethering.start");
				Log.o(data);				
				const device = dget(devices, 'serial', data.devices);
				if (device != null) {
					const cluster = dget(clusters, 'uuid', device.clusterId);
					cluster.socket.emit("tethering.start", data);
				}
			});
			socket.on("tethering.stop", (data) => {
				Log.i("tethering.stop");
				Log.o(data);				
				const device = dget(devices, 'serial', data.devices);
				if (device != null) {
					const cluster = dget(clusters, 'uuid', device.clusterId);
					cluster.socket.emit("tethering.stop", data);
				}
			});
			socket.on("tasks.execute", (data) => {
				Log.i("tasks.execute ");
				Log.o(data);
				this.executor.startTask(data.devices,data.task);
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
				if (data.action == 'Unlock') {
					const device = dget(devices, 'serial', data.devices);
					if (device != null) {
						const cluster = dget(clusters, 'uuid', device.clusterId);
						cluster.socket.emit("Unlock", data);
					}
				}
				if (data.action == 'Lock') {
					const device = dget(devices, 'serial', data.devices);
					if (device != null) {
						const cluster = dget(clusters, 'uuid', device.clusterId);
						cluster.socket.emit("Lock", data);
					}
				}
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
				console.log("delete devices", clusterDevices);
				clusterDevices.forEach(device => clients.forEach(client => client.socket.emit("device.disconnect", device)));
				clusterDevices.forEach(device => { ddelete(devices, 'serial', device.serial) });
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
				//console.log("device.capture",data);
				console.log("device.capture",data.data.length);
				this.executor.screen(data.serial,data.data);
				clients.forEach(client => client.socket.emit("device.capture", data));
			});
		});
		ioCluster.listen(9000, () => {
			Log.i("Cluster Server connected");
		});
	}
}

module.exports = { AdbSocketServer };