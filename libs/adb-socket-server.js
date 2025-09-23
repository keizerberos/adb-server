const { LoginModule } = require('./modules/login.module');
const { FastServer } = require('./fast-server');
const { createServer } = require("http");
const { Server } = require("socket.io");
const WebSocket	= require('ws');

const {Executor,genPlant} = require("./executor.js");
const short = require('short-uuid');
const fs = require('fs');
const path = require('path')
let devicesData = JSON.parse(fs.readFileSync('./data/devices.json', 'utf8'));
let actionsData = JSON.parse(fs.readFileSync('./data/actions.json', 'utf8'));
let patternsData = JSON.parse(fs.readFileSync('./data/patterns.json', 'utf8'));

let tasks = {};
let actions = {};
const taskPath = "./data/tasks";
const actionsPath = "./data/actions";
let saveProgrammed = false;

let Log = null;
let Dbm = null;

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
function scanTasksFolder() {
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
const ClientType = Object.freeze({
  PROGRESS: 0,
  DASHBOARD: 1,
  REMOTE: 2,
  EXECUTOR: 3,
  DEVICES: 4,
});
class AdbSocketServer {
	constructor(Logger,Dbm) {
		Log = Logger;
		Dbm = Dbm;
		this.executor = new Executor();
		const clients = [];
		const devices = [];
		const clusters = [];
		this.modules = [];
		this.loginModule = new LoginModule(Dbm);
		this.modules.push(this.loginModule);
		this.startServer(clients, clusters, devices);
		this.startServerCluster(clients, clusters, devices);
		scanTasksFolder();
		this.executor.setActions(actions);
		this.executor.setPatterns(patternsData);
		this.drawProgressForm();		
	}
	//UI
	drawProgressForm(){		
		Object.keys(tasks).forEach(k => {
			tasks[k]['progressPath'] = genPlant(tasks[k]);
			//console.log("progressPath",tasks[k]['progressPath']);
		});
	}
	saveDevices(){
		if(saveProgrammed) return;
		setTimeout(()=>{
			fs.writeFile('./data/devices.json',JSON.stringify(devicesData, null, '\t'),'utf8', (err)=>{
				saveProgrammed = false;
				if (err) {
					console.error('Error writing file:', err);
					return;
				}
				console.log('File written successfully!');
			});
		},5000);
		saveProgrammed=true;		
	}
	savePatterns(){		
		fs.writeFile('./data/patterns.json',JSON.stringify(patternsData, null, '\t'),'utf8', (err)=>{
			if (err) {
				console.error('patterns.new Error writing file:', err);
				return;
			}
			console.log('patterns.new written successfully!');
		});
	}
	startServer(clients, clusters, devices) {
		const self = this;
		const fastServer = new FastServer(Log, "7000", __dirname + '/public');
		const httpServer = createServer(fastServer);
		self.modules.forEach(m=>m.when("startServer.init", {fastServer:fastServer, clients:clients}));
		fastServer.get("/tasks",(req,res)=>{ 
			const task = tasks[req.query.id];
			res.setHeader('Content-Type', 'application/json');
			if (task==null){
				res.send(JSON.stringify(tasks));
			}else
				res.send(JSON.stringify(task));
		});
		fastServer.get("/actions",(req,res)=>{
			const task = tasks[req.query.taskId];
			const actionsData = {};
			task.progressPath.forEach(p=> actionsData[p.id] = actions[p.id]);
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(actionsData));
		});
		fastServer.get("/patterns",(req,res)=>{
			const task = tasks[req.query.taskId];
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(patternsData));
		});
		fastServer.get("/screens",(req,res)=>{
			console.log("req.query.screenId",req.query.screenId);
			const screenId = req.query.screenId;
			console.log("path",__dirname + '/../screens/'+screenId+'.png');
			const imagePath = path.join(__dirname, '/../screens/'+screenId+'.png');
			res.sendFile(imagePath);
		});
		fastServer.get("/devices",(req,res)=>{
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(devices));
		});
		fastServer.get("/clusters",(req,res)=>{
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(clusters));
		});
		fastServer.get("/clients",(req,res)=>{
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify(clients.map(c=>{ return {type:c.type,devices:c.devices,uuid:c.uuid,features:c.features,address:c.address,windows:c.windows,parentUid:c.parentUid,login:c.login,extra:c.extra}; } )));
		});
		fastServer.post("/adb",(req,res)=>{			
    		const data = req.body.data;
			Log.i("fastServer.post " );
			Log.o(data);
			if (data.action == 'adb') {
				const device = dget(devices, 'serial', data.devices);
				if (device != null) {
					const cluster = dget(clusters, 'uuid', device.clusterId);
					cluster.socket.emit("adb", data);
				}				
			}
			res.send(JSON.stringify('{"response":"ok}'));
		});		
		fastServer.post("/pattern.upload",(req,res)=>{			
    		const data = req.body.data;
			const name = req.body.name;
			Log.i("fastServer.post pattern_upload" );
			//Log.o(data);
			if (patternsData[name] !=undefined){
				res.send(JSON.stringify('{"response":"name exist}'));	
				return;
			}
			patternsData[name] = data;
			this.savePatterns(patternsData);
			res.send(JSON.stringify('{"response":"ok}'));
		});		
		
		const io = new Server(httpServer, {
			cors: {
				origin: "*",
				methods: ["GET", "POST"],
			}
		});
		this.executor.on('send', (data)=>{
			console.log('send', data);
			const device = dget(devices, 'serial', data.devices);
			if (device != null) {
				const cluster = dget(clusters, 'uuid', device.clusterId);				
				cluster.socket.emit(data.action, data);
			}
		});
		this.executor.on('task.progress',(deviceId,progress)=>{
			Log.i("task.progress");
			//Log.o(progress);
			const device = dget(devices, 'serial', deviceId);
			if (device != null) {							
				device['progress'] = progress;
				clients.filter(client=>client.features.progress).forEach(client => client.socket.emit("task.progress", {serial:deviceId,data:progress}));
			}
		});
		let getDeviceRemoteList = ()=>{
			let devicesList = {};
			let clientRemotes = clients.filter(c=>c.type==ClientType.REMOTE);
			clientRemotes.forEach(client=>{
				client.devices.forEach(deviceSerial => {
					if (devicesList[deviceSerial] == null){
						devicesList[deviceSerial] = {serial: deviceSerial,count: 0, clients:[]};
					}
					const c = client;
					devicesList[deviceSerial].count++;
					devicesList[deviceSerial].clients.push({type:c.type,uuid:c.uuid,features:c.features,address:c.address});
				});
			});		
			return devicesList;
		};
		let updateDevicesRemote = (devicesList)=>{
			devices.forEach(device=>{
				if (devicesList[device.serial]!=null)
					device['countRemotes'] = devicesList[device.serial].count;
				else
					device['countRemotes'] = 0;
			});
		};
					
		let wsLowQuality = (serial)=>{
			const device = devices.find(d=>d.serial == serial);
			if (device == null) return;
			const socket = new WebSocket('ws://' + device.clusterAddress + ':8000/?action=proxy-adb&remote=tcp%3A8886&udid=' + device.serial + '');
			console.log("ws trying connect to ", 'ws://' + device.clusterAddress + ':8000/?action=proxy-adb&remote=tcp%3A8886&udid=' + device.serial );
			
			socket.on('error', (er)=>console.log(er));
			socket.on('open',() => {				
				console.log("socket reducing quality");
				//socket.send(hexStringToUint8Array("6500020000000000050503840193000000000000000000ff000000000000000000000000"));
				//socket.send(Buffer.from("6500020000000000050500b40193000000000000000000ff0000000000000000000000174f4d582e676f6f676c652e683236342e656e636f646572", "hex"));
				const fps = "03";
				const fpsr = "03";
				const w = "0050";//"005A";
				const h = "00c0";//"00C9";
				const str = `6500020000000000${fps}${fpsr}${w}${h}000000000000000000ff0000000000000000000000174f4d582e676f6f676c652e683236342e656e636f646572`;
				console.log(str);
				socket.send(Buffer.from(str, "hex"));
				//setTimeout(() => socket.send(self.hexStringToUint8Array("0A00")), 200);
				setTimeout(() => { socket.close();  }, 600);
			});
			
		}
		let disconnectRemote = (clientDisconnected)=>{
			let devicesList = getDeviceRemoteList();
			updateDevicesRemote(devicesList);
			let devicesRemoteUnique = [];
			let devicesRemote = [];
			console.log("devicesList.after", devicesList);
			clientDisconnected.devices.forEach(deviceSerial => {
				if (devicesList[deviceSerial] !=undefined) {
					devicesList[deviceSerial].count = devicesList[deviceSerial].count - 1;
					if (devicesList[deviceSerial].count == 0)
						devicesRemoteUnique.push(devicesList[deviceSerial]);
					//else	// ONLY IF EXIST 1
					devicesRemote.push(devicesList[deviceSerial]);
				}
			});
			console.log("devicesList.before", devicesList);
			console.log("devicesRemoteUnique", devicesRemoteUnique);
			devicesRemoteUnique.forEach(device=>{
				clients.forEach(client => client.socket.emit("device.noremote", {serial:device.serial}));
				wsLowQuality(device.serial);
			});
			devicesRemote.forEach(device=>{
				clients.forEach(client => client.socket.emit("device.remote.leave", {serial:device.serial}));
			});
		}
		let disconnectRemoteWindows = (client)=>{
			if (client.type == ClientType.REMOTE || client.type == ClientType.DEVICES){
				const parentClient = clients.find(c=>client.parentUid==c.uuid);
				if (parentClient!=undefined){
					parentClient.socket.emit("window.close",{uuid:parentClient.uuid,type:client.type});
					if (parentClient["windows"]==undefined) return;
					const window = parentClient.windows.find(w=>w.uuid == client.uuid);
					if (window==undefined) return;
					parentClient.windows.splice(parentClient.windows.indexOf(window),1);
				}
			}
		};
		io.on("connection", (socket) => {
			let uuid = short.generate();
  			var address = socket.request.connection._peername;
			const client = { socket: socket,address:address.addresss,extra:{}, type:ClientType.DASHBOARD,devices:[], uuid: uuid, features:{'capture':true,'progress':true,'adb':true,'remote':false} };
			clients.push(client);
			Log.i("Socket connected " + uuid);
			socket.on("disconnect", () => {
				Log.i("socket disconnected " + uuid);		
				disconnectRemoteWindows(client);
				disconnectRemote(client);
				ddelete(clients, 'uuid', uuid);
				self.modules.forEach(m=>m.when("io.disconnect", {socket:socket}));
			});
			
			socket.emit("uuid", uuid);
			const configSocket = ()=>{
				console.log("setup socket");
				socket.emit("clusters", clusters.map(cluster => { return {uuid:cluster.uuid,devices:cluster.devices,network:cluster.address};}));
				socket.emit("tasks", tasks);
				socket.emit("actions", actions);
				socket.emit("devices", devices);

				socket.on("window.update", (data)=>{
					Log.i("window.update");
					Log.o(data);
					clients.forEach(client=>{
						client.socket.emit("window.update", data);
					});
				});
				socket.on("window.open", (data)=>{
					Log.i("window.open");
					Log.o(data);
					client["parentUid"] = data.parentUid;
					const clientParent = clients.find(c=>c.uuid == data.parentUid);
					if (clientParent != undefined){
						if(clientParent['windows']==undefined) clientParent['windows'] = [];
						clientParent['windows'].push({parentUid:data.cuid, type:data.type, uuid:uuid});
						clients.filter(c=>c.uuid==data.parentUid).forEach(client=>{
							client.socket.emit("window.open",data);
						});
					}
				});
				socket.on("device.assign", (data) => {
					Log.i("device.assign");				
					Log.o(data);
					devicesData.devicesAssign[data.serial] = {"number": data.number};
					this.saveDevices();				
					
					const deviceTemp = dget(devices, 'serial', data.serial);
					if (deviceTemp == null){
						devices.push(device);}
					if (devicesData.devicesAssign[data.serial] != null)
						deviceTemp['number'] = devicesData.devicesAssign[data.serial].number;
					else
						deviceTemp['number'] = -1;
					clients.forEach(client => client.socket.emit("device.update", deviceTemp));
				});
				socket.on("patterns", (data) => {
					Log.i("sending.patterns");
					socket.emit("patterns", patternsData);
				});
				socket.on("client.extra", (data) => {
					Log.i("client.extra");
					Log.o(data);
					client['extra']=data;
				});
				socket.on("client.type.progress", (data) => {
					Log.i("client.type.progress");
					Log.o(data);
					client.type = ClientType.PROGRESS;
				});
				socket.on("client.type.dashboard", (data) => {
					Log.i("client.type.dashboard");
					Log.o(data);
					client.type = ClientType.DASHBOARD;
				});
				socket.on("client.type.devices", (data) => {
					Log.i("client.type.devices");
					Log.o(data);
					client.type = ClientType.DEVICES;
				});
				socket.on("client.type.remote", (data) => {
					Log.i("client.type.remote");
					Log.o(data);
					client.type = ClientType.REMOTE;
				});
				socket.on("client.type.executor", (data) => {
					Log.i("client.type.executor");
					Log.o(data);
					client.type = ClientType.EXECUTOR;
				});
				socket.on("feature.capture.on", (data) => {
					Log.i("feature.capture");
					Log.o(data);
					client.features.capture = true;
				});
				socket.on("feature.capture.off", (data) => {
					Log.i("feature.capture");
					Log.o(data);
					client.features.capture = false;
				});
				socket.on("feature.progress.off", (data) => {
					Log.i("feature.progress");
					Log.o(data);
					client.features.progress = true;
				});
				socket.on("client.subscribe.devices", (data) => {
					Log.i("client.subscribe.devices");
					Log.o(data);
					if (Array.isArray(data))
						data.forEach(d=>client.devices.push(d));
					else
						client.devices.push(data)
					
					let devicesList = getDeviceRemoteList();
					updateDevicesRemote(devicesList);
					client.devices.forEach(deviceSerial=>{
						if (devicesList[deviceSerial] !=undefined)
							clients.forEach(client => client.socket.emit("device.remote.add", devicesList[deviceSerial]));
					});
				});
				socket.on("tasks.stop", (data) => {
					Log.i("tasks.stop ");
					Log.o(data);				
					this.executor.stopAll();
				});
				socket.on("tasks.stop.device", (data) => {
					Log.i("tasks.stop.device ");
					Log.o(data);				
					this.executor.stopTask(data.devices);
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
				socket.on("tasks.execute.batch", (data) => {
					Log.i("tasks.execute.batch");
					Log.o(data);
					this.executor.startTaskBatch(data.devices, data.task);
				});
				socket.on("tasks.resume", (data) => {
					Log.i("tasks.resume ");
					Log.o(data);
					this.executor.resumeTask(data.devices,data.task);
				});
				socket.on("device.network", (data) => {
					const device = dget(devices, 'serial', data.devices);
					if (device != null) {
						const cluster = dget(clusters, 'uuid', device.clusterId);
						cluster.socket.emit("network", data);
					}
				});
				socket.on("device.resolution", (data) => {
					const device = dget(devices, 'serial', data.devices);
					if (device != null) {
						const cluster = dget(clusters, 'uuid', device.clusterId);
						cluster.socket.emit("resolution", data);
					}
				});
				socket.on("device.adb", (data) => {
					//Log.i("device.adb data");
					//Log.o(data);
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
						Log.i("device.adb data.action == 'Screen'");
						const device = dget(devices, 'serial', data.devices);
						if (device != null) {
							const cluster = dget(clusters, 'uuid', device.clusterId);
							cluster.socket.emit("screen", data);
						}
					}
				});				
			};
			self.modules.forEach(m=>m.when("io.connection", {socket:socket,uuid:uuid,client:client,configSocket:configSocket}));
		});
		httpServer.listen(7000, () => {
			Log.i("Server connected");
		});
	}
	//CLUSTER
	startServerCluster(clients, clusters, devices) {
		const httpCluster = createServer();
		const ioCluster = new Server(httpCluster, {
			pingInterval: 4800, 
			pingTimeout: 8500,
			maxHttpBufferSize: 1e8 ,
			forceNew: true,
			cors: {
				origin: "*",
				methods: ["GET", "POST"],
			}
		});
		ioCluster.on("connection", (socket) => {
			let uuid = short.generate();
  			//var address = socket.handshake.address;
  			var address = socket.request.connection._peername;
			Log.i("Cluster Socket connected " + uuid + " " +address.address );
			const cluster = { socket: socket, devices: [], uuid, uuid,address:address };
			clusters.push(cluster);
			clients.forEach(client => client.socket.emit("cluster.connect", {uuid:cluster.uuid,devices:cluster.devices,network:cluster.address}));
			socket.on("disconnect", () => {				
				Log.i("Cluster Socket disconnected " + uuid + " " +address.address);
				let clusterDevices = devices.filter(d => d.clusterId == uuid);
				Log.i("delete devices disconnected " + clusterDevices.length);
				clusterDevices.forEach(device => clients.forEach(client => client.socket.emit("device.disconnect", device)));
				clusterDevices.forEach(device => { ddelete(devices, 'serial', device.serial) });
				ddelete(clusters, 'uuid', uuid);
				clients.forEach(client => client.socket.emit("cluster.disconnect", uuid));
			});
			socket.on("devices", (clusterDevices) => {
				Log.i("Devices received");
				//Log.o(clusterDevices);
				let changes = 0;
				clusterDevices.forEach(device => {
					const deviceTemp = dget(devices, 'serial', device.serial);
					if (deviceTemp == null){
						devices.push(device);changes++;}
					if (devicesData.devicesAssign[device.serial] != null){
						device['number'] = devicesData.devicesAssign[device.serial].number;						
						device['network'] = devicesData.devicesAssign[device.serial].network;
					}
					else{
						device['number'] = -1;
					}
					device['clusterId'] = uuid;
					device['clusterAddress'] = cluster.address?.address;
				});
				if(changes>0){
					console.log("changes",changes);
					clients.forEach(client => client.socket.emit("devices", devices));
				}
			});

			socket.on("device.connect", (device) => {
				console.log("device.connect", device)
				const createdDevice = dget(devices, 'serial', device.serial);

				if (createdDevice == null)
					devices.push(device);
				if (devicesData.devicesAssign[device.serial] != null){
					device['number'] = devicesData.devicesAssign[device.serial].number;				
					device['network'] = devicesData.devicesAssign[device.serial].network;
					device['resolution'] = devicesData.devicesAssign[device.serial].resolution;
				}else
					device['number'] = -1;
				device['clusterId'] = uuid;
				device['clusterAddress'] = cluster.address?.address;
				const data = {};
				clients.forEach(client => client.socket.emit("device.connect", device));
			});
			socket.on("device.disconnect", (device) => {
				console.log("devices.disconnect", device)
				ddelete(devices, 'serial', device.serial);
				clients.forEach(client => client.socket.emit("device.disconnect", device));
			});
			socket.on("device.capture", (data) => {
				//console.log("device.capture",data.data.length);
				this.executor.screen(data.serial,data.data);				
				clients.filter(client=>client.features.capture).forEach(client => client.socket.emit("device.capture", data));				
			});
			socket.on("device.network", (data) => {				
				clients.forEach(client => client.socket.emit("device.network", data));				
				
				if (devicesData.devicesAssign[data.serial] != null){
					if (devicesData.devicesAssign[data.serial]['network'] == null){
						devicesData.devicesAssign[data.serial]['network'] = data.data;						
						const device = devices.find(d=>d.serial==data.serial);
						device['network'] = data.data;
						this.saveDevices();
					}else{
						if (devicesData.devicesAssign[data.serial]['network']['ip'] != data.data.ip
							||devicesData.devicesAssign[data.serial]['network']['mac'] != data.data.mac
							||devicesData.devicesAssign[data.serial]['network']['ssid'] != data.data.ssid){
							devicesData.devicesAssign[data.serial]['network'] = data.data;
							const device = devices.find(d=>d.serial==data.serial);
							device['network'] = data.data;
							this.saveDevices();
						}
					}					
				}							
			});
			socket.on("device.resolution", (data) => {				
				clients.forEach(client => client.socket.emit("device.resolution", data));				
				
				if (devicesData.devicesAssign[data.serial] != null){
					if (devicesData.devicesAssign[data.serial]['resolution'] == undefined){
						devicesData.devicesAssign[data.serial]['resolution'] = data.data;		
						const device = devices.find(d=>d.serial==data.serial);
						device['resolution'] = data.data;						
						this.saveDevices();
					}else{
						if (devicesData.devicesAssign[data.serial]['resolution']['size'] != data.data.size){
							const device = devices.find(d=>d.serial==data.serial);
							device['resolution'] = data.data;						
							this.saveDevices();
						}
					}					
				}							
			});
		});
		httpCluster.listen(9000,'0.0.0.0', () => {
			Log.i("Cluster Server connected");
		});
	}
}

module.exports = { AdbSocketServer };