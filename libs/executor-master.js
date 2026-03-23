
const AdbOcr = require('./adb-ocr');
const os = require('os');
const fs = require('fs');
const { Worker } = require('worker_threads');
const Piscina = require('piscina');
const { BroadcastChannel } = require('worker_threads');
const { resolve } = require('path');
const bc = new BroadcastChannel('my_secret_channel');


const adbocr = new AdbOcr();		
const maxWorkers = os.cpus().length;
const piscina = new Piscina({
  filename: './libs/executor-slave.js',	
  //minThreads: 2,   // Always keep 2 workers ready
  //maxThreads: 16,  // Never grow beyond 16 workers
  maxQueue: 10, // Limit the queue size
  //useAtomics: false // Try setting this to false
});

let nodeActions = null;
let patterns = null;
let events = {};
function genPlant(action) {
	let text = [];
	let nodeActionsTest = JSON.parse(JSON.stringify(nodeActions));
	if (nodeActionsTest[action.start] == undefined) return "";
	text.push({ id: action.start });	//text.push({id:action.start,action:nodeActions[action.start]});
	let rc = (c, i) => { let s = ""; for (let ii = 0; ii < i && ii < 3; ii++)s += c; return s; };
	let readNodes = (node, indexId) => {
		let currentNode = nodeActionsTest[node];
		if (currentNode == undefined) return;
		if (currentNode.try > 0) return;
		currentNode.try++;
		currentNode.next.forEach((nameNode, i) => {
			let nextNode = nodeActionsTest[nameNode];
			if (text.find(t => t.id == nameNode) == undefined)
				text.push({ id: nameNode });
			readNodes(nameNode, 0);
			nextNode.try++;
		});
	};
	readNodes(action.start, 0);
	return text;
}
class Executor {
	constructor() {
		
	}
	async ocr(blob) {
		return await adbocr.readFromBuffer(blob);
	}
	async regScreen(id, img) {	
    bc.postMessage({			
			type: 'regScreen',
			payload: {
				id:id, 
				img:img
			}})
	}
	screen(id, bimg, reportCB) {		
    bc.postMessage({			
			type: 'screen',
			payload: {
				id: id,
				bimg: bimg
			}})
	}
	on(ev, fn) {
		if (events[ev]==null) events[ev] = [];
		events[ev].push(fn);
	}
	async stopAll() {		
		
    bc.postMessage({			
			type: 'stopAll',
			payload: null})
	}
	stopTask(devices) {		
    bc.postMessage({			
			type: 'stopTask',
			payload: {
				devices:devices
			}})
	}
	setActions(_nodeActions) {
		nodeActions = _nodeActions;
	}

	setPatterns(_patterns) {
		patterns = _patterns;
	}
	startTask(_devices, task) {
		piscina.run({ type:"startTask", patterns:patterns, actions:nodeActions, data_devices:_devices, data_task:task }).then(res=>{
			console.log("-WORKER --");
		});
		piscina.on('message', (message) => {
			if(message.type=="send"){
				events["send"].forEach(fn=>fn(message.payload.data));
			}
			if(message.type=="task.progress"){
				console.log("PROGRESS");
				events["task.progress"].forEach(fn=>fn(message.payload.deviceId, message.payload.progress));
			}
		});
	}
	startTaskBatch(_devices, task, cbEnd) {
		//const worker = new Worker('./worker.js');
		
		piscina.run({ type:"startTaskBatch", patterns:patterns, actions:nodeActions, data_devices:_devices, data_task:task }).then(res=>{
			console.log("-WORKER ENDED");
		});
		piscina.on('message', (message) => {
			if(message.type=="reportCB"){
				events["reportCB"].forEach(fn=>fn(message.payload.data));
			}
			if(message.type=="send"){
				events["send"].forEach(fn=>fn(message.payload.data));
			}
			if(message.type=="task.progress"){
				console.log("PROGRESS");
				events["task.progress"].forEach(fn=>fn(message.payload.deviceId, message.payload.progress));
			}
		});
		piscina.on('workerDestroy', () => {
			console.log('A physical worker thread was terminated and removed from the pool.');
		});
		piscina.on('error', () => {
			console.log('A physical worker thread was terminated and removed from the pool.');
		});

	}
	getWorkers(){
		return {current:piscina.threads.length,max:maxWorkers};
	}
	startTaskBatchEvents(_devices, task, cbEnd, preTasks, postTasks) {
		
	}
	startTaskSchedule(_devices, schedule) {
		
	}
	resumeTask(devices, task) {
		
	}
}

module.exports = { Executor, genPlant}