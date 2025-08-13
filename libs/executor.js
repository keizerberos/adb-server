const { createCanvas, loadImage } = require('canvas')
let devicesActions = {};
let signalStop = false;
let androidPattern = {};
let eventNodes = [];
let events = {
	"send":[],
	"task.progress":[],
};
let nodeActions = null;

function genPlant(action){
	let text = [];
	let nodeActionsTest = JSON.parse(JSON.stringify(nodeActions));
	if (nodeActionsTest[action.start]==undefined) return "";
	//text.push(`[*]->${action.start}`);
	
	text.push({id:action.start});	//text.push({id:action.start,action:nodeActions[action.start]});
	let rc= (c,i)=>{let s ="";for(let ii=0;ii<i && ii<3;ii++)s+=c;return s;};
	let readNodes = (node,indexId)=> {
		let currentNode = nodeActionsTest[node];
		if(currentNode==undefined) return;
		if(currentNode.try>0) return;
		/*text.push(`${node}:${currentNode.desc}`);
		text.push(`${node}:pre:${Math.round(currentNode.preDelay/10)/100}s`);
		text.push(`${node}:post:${Math.round(currentNode.postDelay/10)/100}s`);*/
		currentNode.try++;
		currentNode.next.forEach((nameNode,i)=>{
			let nextNode = nodeActionsTest[nameNode];
			//console.log("nextNode,nameNode",nextNode,nameNode);
			//let dataNode = `${node}${rc("-",currentNode.next.length)}>${nameNode}`;
			if (text.find(t=>t.id==nameNode)==undefined)
				text.push({id:nameNode});//				text.push({id:nameNode,action:nextNode});
			//	text.push(dataNode);
			readNodes(nameNode,0);
			nextNode.try++;
		});
	};
	readNodes(action.start,0);
	//text.push(`${nodeActionsTest[action.end].name}->[*]`);
	//text.push({id:action.end,action:nodeActions[action.end]});
	//text.push(`@enduml`);		
	return text;
}
function replaceParams(params, str) {
	Object.keys(params).forEach(k => {
		if (!(typeof params[k] == 'object'))
			str = str.replace("{" + k + "}", params[k])
		else {
			//console.log("k",k);
			if (params[k].random) {
				//console.log("Math.round(params[k].data.length*Math.random())",Math.round(params[k].data.length*Math.random()));
				//console.log("str",str);
				str = str.replace("{" + k + "}", params[k].data[Math.round((params[k].data.length - 1) * Math.random())])
				//console.log("bstr",str);
			} else {
				if (params[k].index == undefined) params[k].index = 0;
				let strTemp = str;
				str = str.replace("{" + k + "}", params[k].data[params[k].index]);
				console.log("params[k].index", k, params[k].index);
				if (str != strTemp)
					params[k].index++;
				params[k].index = params[k].index >= params[k].data.length ? 0 : params[k].index;
			}
		}

	});
	return str;
}
function bwImage(ctx1, canvas1, ctx2, canvas2, umbral) {
	var imgData = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
	canvas2.width = canvas1.width;
	canvas2.height = canvas1.height;
	var d = imgData.data;
	for (var i = 0; i < d.length; i += 4) {
		var med = (d[i] + d[i + 1] + d[i + 2]) / 3;
		d[i] = d[i + 1] = d[i + 2] = med > umbral ? 0 : 255;
	}
	// redraw the new computed image
	ctx2.putImageData(imgData, 0, 0);
}
function pathPattern(d, i, w, h, pattern, cellsize) {
	_ss1 = pattern.patterns.length;
	_ox = pattern.patterns[0].x;
	_oy = pattern.patterns[0].y;
	_s1 = 0;
	for (ii = 0; ii < pattern.patterns.length; ii++) {
		//for(iii = 0 ; iii < pattern.patterns[ii].m.length; iii++){
		_off1 = i + ((pattern.patterns[ii].x - _ox - 1) + (pattern.patterns[ii].y - _oy - 1) * w) * 4;//0
		_off2 = i + ((pattern.patterns[ii].x - _ox + 2) + (pattern.patterns[ii].y - _oy - 1) * w) * 4;//2
		_off3 = i + ((pattern.patterns[ii].x - _ox + 1) + (pattern.patterns[ii].y - _oy + 1) * w) * 4;//4
		_off4 = i + ((pattern.patterns[ii].x - _ox - 1) + (pattern.patterns[ii].y - _oy) + 2 * w) * 4;//5
		_off5 = i + ((pattern.patterns[ii].x - _ox + 2) + (pattern.patterns[ii].y - _oy) + 2 * w) * 4;//7
		//if (d[_off1] == pattern.patterns[ii].m[iii]) _s1++;
		if (d[_off3] == pattern.patterns[ii].m[4]
			/*		 && d[_off1] == pattern.patterns[ii].m[0] 
					 && d[_off2] == pattern.patterns[ii].m[2] 
					 && d[_off4] == pattern.patterns[ii].m[5] 
					 && d[_off5] == pattern.patterns[ii].m[7] */
			//d[_off3] == pattern.patterns[ii].m[2] && */
			//d[_off4] == pattern.patterns[ii].m[3] 
		) _s1++;
		//else return -1;

		//_ss1++;
		//}			
	}
	//if (_s1 >0) console.log("equalp",pattern);
	//if (_s1 > 0 && _s1 == _ss1) return 1;
	/*for icons*/
	if (_s1 > 0 && _s1 >= _ss1) return _s1;
	/*for others*/
	//if (_s1 > 0 && _s1+pattern.cellSize >= _ss1 ) return _s1;
	return -1;
}
function findPattern(ctx, ctx1, canvas, pattern, first, crop) {

	ctx1.clearRect(0, 0, canvas.width, canvas.height);
	var id = ctx.getImageData(0, 0, canvas.width, canvas.height);
	if (crop == null) {
		id = ctx.getImageData(0, 0, canvas.width, canvas.height);
	} else {
		id = ctx.getImageData(crop[0], crop[1], crop[2], crop[3]);
	}
	var d = id.data;
	var jump = 0;
	var off = 0;
	let ww = -1;
	let hh = -1;
	if (crop == null) {
		ww = canvas.width;
		hh = canvas.height;
	} else {
		ww = crop[2];
		hh = crop[3];
	}
	var ofx = -1;
	var ofy = -1;
	var ow = -1;
	var oh = -1;
	var owm = -1;
	var ohm = -1;
	var finded = [];

	for (var i = 0; i < d.length; i += 4) {
		if (d[i] == 254) continue;
		if (first && ow > 0) { console.log("break"); break; }
		jump = pathPattern(d, i, ww, hh, pattern)
		if (jump > 0) {
			console.log("equal", jump, i);

			_ox = pattern.patterns[0].x;
			_oy = pattern.patterns[0].y;
			ofx = ((i / 4 - _ox) % ww);
			ofy = ((i / 4 - _ox) - ofx) / ww + 2;
			ow = pattern.pos[2];
			oh = pattern.pos[3];
			owm = Math.round(ow / 2);
			ohm = Math.round(oh / 2);
			for (ii = 2; ii < pattern.pos[3] + 2; ii++) {
				for (iii = 0; iii < pattern.pos[2]; iii++) {
					off = i + ((iii - _ox) + (ii - _oy) * ww) * 4;
					d[off] = 254;
				}
			}
		}/*else if (d[i]!=254){				
				d[i] = 0;
				d[i+1] = 0;
				d[i+2] = 0;
			}*/
	}
	for (var i = 0; i < d.length; i += 4)
		if (d[i] != 254) {
			d[i] = 0;
			d[i + 1] = 0;
			d[i + 2] = 0;
		}
	console.log("ok");
	if (crop == null) {
		ctx1.putImageData(id, 0, 0);
		return [ofx, ofy, ow, oh, owm, ohm]
	} else {
		ctx1.putImageData(id, crop[0], crop[1]);
		if (ofx == -1)
			return [ofx, ofy, ow, oh, owm, ohm]
		else
			return [crop[0] + ofx, crop[1] + ofy, ow, oh, owm, ohm]
	}
}
function executeNode(action, actionIndex, deviceId, params, cbSuccess, cbFail) {
	if (signalStop) return;
	if (action == null) { cbSuccess(); return; }
	if (action.next == null) { cbSuccess(); return; }
	let nodeAction = action.next[actionIndex];
	if (nodeAction == null) { cbSuccess(); return; }
	let currentAction = devicesActions[deviceId][nodeAction];
	if (currentAction == null) { cbFail(); return; }

	console.log("currentAction.preDelay", nodeAction, currentAction.preDelay);
	setTimeout(() => {
		
		devicesActions[deviceId]['progress']['completed'].push(nodeAction);
		devicesActions[deviceId]['progress']['current'] = actionIndex;
		events['task.progress'].forEach(fn=>fn(deviceId, devicesActions[deviceId]['progress']));
		//$(".act-" + deviceId).html(currentAction.name + "<br> " + currentAction.desc);
		if (currentAction.type == "static") {
			console.log("executeNode static loop", currentAction.loop,);
			if (currentAction.loop >= currentAction.maxLoop) {
				let beforeLoop = devicesActions[deviceId][currentAction.beforeLoop];
				console.log("executeNode is max loop", true);
				executeNode(beforeLoop, 0, deviceId, params, cbSuccess, cbFail);
				//executeNode(action,actionIndex+1,deviceId,params,cbSuccess,cbFail);
				return;
			}

			let command = JSON.parse(JSON.stringify(currentAction.command));
			//console.log("executeNode.cmd",JSON.stringify(currentAction.command));
			let tempParams = {
				deviceId: deviceId
			}

			command.devices = replaceParams(tempParams, command.devices);
			Object.keys(command.data).forEach(k => {
				command.data[k] = replaceParams(tempParams, command.data[k]);
			})
			Object.keys(command.data).forEach(k => {
				command.data[k] = replaceParams(params, command.data[k]);
			})

			console.log("executeNode.command", command);
			//myWebSocket.send(JSON.stringify(command));
			events['send'].forEach(fn=>fn(command));
			currentAction.loop++;
			console.log("currentAction.postDelay", currentAction.postDelay);
			setTimeout(() => {
				executeNode(currentAction, 0, deviceId, params,
					() => {
						cbSuccess();
					},
					() => {
						cbFail();
					}
				);
			}, currentAction.postDelay);
		} else if (currentAction.type == "pattern") {
			//console.log("executeNode.pattern", JSON.stringify(currentAction.command));
			/*console.log("executeNode pattern try",currentAction.try);	
			if (currentAction.try >= currentAction.maxTry){
				let beforeLoop = devicesActions[deviceId][currentAction.beforeLoop];
				executeNode(beforeLoop,0,deviceId,params,cbSuccess,cbFail);
				return;
			}
			if (currentAction.loop >= currentAction.maxLoop){
				let beforeLoop = devicesActions[deviceId][currentAction.beforeLoop];
				executeNode(beforeLoop,0,deviceId,params,cbSuccess,cbFail);
				return;
			}*/

			eventNodes.push({
				deviceId: deviceId,
				action: nodeAction,
				state: true,
				cbSuccess: (img) => {
					executeNode(currentAction.next[0], 0, deviceId, params, () => {
						currentAction.trigger.forEach(trigger => {
							const pattern = androidPattern[trigger.pattern];
							//console.log(pattern);
							let outputcanvas = createCanvas(750,1612);
							let outputcanvasP = createCanvas(750,1612);
							let outputcanvasF = createCanvas(750,1612);
							outputcanvas.width = 720;
							outputcanvas.height = 1606;
							outputcanvasP.width = 720;
							outputcanvasP.height = 1606;
							outputcanvasF.width = 720;
							outputcanvasF.height = 1606;
							let canvasctx = outputcanvas.getContext("2d");
							let canvasctxP = outputcanvasP.getContext("2d");
							let canvasctxF = outputcanvasF.getContext("2d");
							//console.log("img",img);
							//img.crossOrigin = "anonymous";
							canvasctx.drawImage(img, 0, 0);
							bwImage(canvasctx, outputcanvas, canvasctxP, outputcanvasP, pattern.umbral);
							let [ox, oy, ow, oh, owm, ohm] = findPattern(canvasctxP, canvasctxF, outputcanvasF, pattern, true, pattern.rectCrop);
							console.log("ox,oy,ow,oh,owm,ohm", [ox, oy, ow, oh, owm, ohm]);
							//if ((ox>0 && currentAction.condition)||(!currentAction.condition&&ox<0)){
							if (ox > 0) {

								console.log("executeNode.pattern true");
								let command = JSON.parse(JSON.stringify(currentAction.command));
								if (command != null) {
									let tempParams = {
										x: ox, y: oy, w: ow, h: oh, wm: owm + ox, hm: ohm + oy
										, deviceId: deviceId
									}
									command.devices = replaceParams(tempParams, command.devices);
									Object.keys(command.data).forEach(k => {
										command.data[k] = replaceParams(params, command.data[k]);
									})
									Object.keys(command.data).forEach(k => {
										command.data[k] = replaceParams(tempParams, command.data[k]);
									})
									console.log("executeNode.command", command);
//									myWebSocket.send(JSON.stringify(command));
									events['send'].forEach(fn=>fn(command));
								}
								currentAction.loop++;
								setTimeout(() => {
									executeNode(currentAction, 0, deviceId, params,
										() => {
											cbSuccess();
										},
										() => {
											cbFail();
										}
									);
								}, currentAction.postDelay);

							} else {
								console.log("executeNode.pattern false");
								currentAction.try++;
								setTimeout(() => {
									executeNode(action, actionIndex + 1, deviceId, params, cbSuccess, cbFail);
								}, currentAction.postDelay);
							}
						});


					}, cbFail);
				},
				cbFail: () => {

					let data = {
						"action": "Screen",
						"devices": deviceId,
						"data": {
							"savePath": "{screen_path}"
						}
					};
					events['send'].forEach(fn=>fn(command));
					//myWebSocket.send(JSON.stringify(data));
				},
			});
			setTimeout(() => {
				if (eventNodes.find(d => d.deviceId == deviceId) != undefined) {
					console.log("timeout for ", deviceId);
					let data = {
						"action": "Screen",
						"devices": deviceId,
						"data": {
							"savePath": "{screen_path}"
						}
					};
					events['send'].forEach(fn=>fn(data));
					//myWebSocket.send(JSON.stringify(data));
				}
			}, currentAction.timeout);

			let data = {
				"action": "Screen",
				"devices": deviceId,
				"data": {
					"savePath": "{screen_path}"
				}
			};
			events['send'].forEach(fn=>fn(data));
			//myWebSocket.send(JSON.stringify(data));
		}
	}, currentAction.preDelay);
}
function executeGraph(actionId, deviceId, ii, params, cbSuccess, cbFail) {
	//console.log("androidActions[actionId]",androidActions[actionId]);
	let action = devicesActions[deviceId][actionId];
	if (actionId == null) { cbSuccess(); return; }
	console.log("pre ejecutando comando ");
	console.log("executeGraph.action.preDelay", action.preDelay);
	setTimeout(() => {
		if (action.type == "static") {
			//$(".act-" + deviceId).html(action.name + "<br> " + action.desc);
			devicesActions[deviceId]['progress']['completed'].push(actionId);
			devicesActions[deviceId]['progress']['current'] = actionId;
			events['task.progress'].forEach(fn=>fn(deviceId, devicesActions[deviceId]['progress']));
			let command = JSON.parse(JSON.stringify(action.command));
			let tempParams = {
				deviceId: deviceId
			}

			command.devices = replaceParams(tempParams, command.devices);
			Object.keys(command.data).forEach(k => {
				command.data[k] = replaceParams(params, command.data[k]);
			});
			console.log("executeGraph.command", command);
			//myWebSocket.send(JSON.stringify(command));
			events['send'].forEach(fn=>fn(command));
		} else if (action.type == "pattern"){
			console.log("executeGraph.pattern test", JSON.stringify(action.command));			
		}
		console.log("executeGraph.action.postDelay", action.postDelay);
		setTimeout(() => {
			executeNode(action, 0, deviceId, params,
				() => {
					cbSuccess();
				},
				() => {
					cbFail();
				}
			)
		}, action.postDelay);
	}, action.preDelay + 2500 * ii + Math.random() * 5000);
}
function executeTask(devices, task) {
	let tasks = [];
	let params = {};

	task.paramsArray.forEach(param => {
		const paramLines = param.value.split('\n');
		if (paramLines.length<2){
			params[param.id] = param.value;
		}else
			params[param.id] = { random: false, index: 0, data: paramLines };
	});
	devicesActions = {};
	console.log("params", params);
	let countEnded = 0;
	devices.forEach((d, ii) => {
		devicesActions[d.serial] = JSON.parse(JSON.stringify(nodeActions));
		devicesActions[d.serial]['progress'] = {path:task.progressPath,completed:[],current:[tasks.start]};
		//$(".act-" + d.id).removeClass("d-none");
		executeGraph(task.start, d.serial, ii, params, () => {
			countEnded++;
			console.log("executeTask:executeGraph.ended")
			if (countEnded >= devices.length) {
				//$(".action-title").addClass("d-none");
				console.log("all ended")
				countEnded = 0;
				signalStop = false;
				//$(".bPlay").removeClass("d-none");
				//$(".bStop").addClass("d-none");
				//---refresh()
			}
		}, () => {
			console.log("executeTask:executeGraph.incomplete")
		});
	});
}
function executeTasks(tasks, callback) {

	let index = 0;
	let total = tasks.length;
	let executor = () => {
		if (tasks[index] == null) { callback(); return; }
		console.log("pre ejecutando comando ", index, tasks[index].data.cmd, tasks[index].data.preDelay);
		setTimeout(() => {
			tasks[index].thread(cb);
		}, tasks[index].data.preDelay);

	}
	let cb = () => {
		console.log("post ejecutando comando ", index, tasks[index].data.cmd, tasks[index].data.postDelay);
		setTimeout(() => {
			index++;
			if (index >= total) {
				callback();
				return;
			}
			executor();
		}, tasks[index].data.postDelay);
	};
	executor();
}
class Executor{
	constructor(){
			
	}
	screen(id,img){
		
		if(img.length>0){
			loadImage(img).then((img)=>{
				eventNodes.forEach((e,i)=>{
					if ( e.deviceId == id){
						console.log("event success",e);		
						e.cbSuccess(img);
						eventNodes.splice(i,1);
					}
				});
			});
		}else{
			let data = {
				"action": "Screen",
				"devices": id,
				"data": {
					"savePath": "{screen_path}"
				}
			};
			events['send'].forEach(fn=>fn(data));
		}
	}
	on(ev,fn){
		events[ev].push(fn);
	}
	stop(){
		signalStop = true;
	}
	setActions(_nodeActions){
		nodeActions = _nodeActions;
	}
	setPatterns(_patterns){
		androidPattern = _patterns;
	}
	startTask(devices,task){
		eventNodes = [];
		signalStop = false;
		executeTask(devices,task);
	}
}

module.exports = {Executor,genPlant,replaceParams, bwImage, pathPattern, findPattern, executeNode, executeGraph, executeTask, executeTasks}