const { Logger } = require('atx-logger');
const { createCanvas, loadImage } = require('canvas');
const tesseract = require ("node-tesseract-ocr");
const fs = require('fs');
const e = require('cors');
let devicesActions = {};
let screensCache = {};
let signalStop = false;
let androidPattern = {};
let eventNodes = [];

let events = {
	"send": [],
	"task.progress": [],
};

let nodeActions = null;

function genPlant(action) {
	let text = [];
	let nodeActionsTest = JSON.parse(JSON.stringify(nodeActions));
	if (nodeActionsTest[action.start] == undefined) return "";
	//text.push(`[*]->${action.start}`);

	text.push({ id: action.start });	//text.push({id:action.start,action:nodeActions[action.start]});
	let rc = (c, i) => { let s = ""; for (let ii = 0; ii < i && ii < 3; ii++)s += c; return s; };
	let readNodes = (node, indexId) => {
		let currentNode = nodeActionsTest[node];
		if (currentNode == undefined) return;
		if (currentNode.try > 0) return;
		/*text.push(`${node}:${currentNode.desc}`);
		text.push(`${node}:pre:${Math.round(currentNode.preDelay/10)/100}s`);
		text.push(`${node}:post:${Math.round(currentNode.postDelay/10)/100}s`);*/
		currentNode.try++;
		currentNode.next.forEach((nameNode, i) => {
			let nextNode = nodeActionsTest[nameNode];
			//console.log("nextNode,nameNode",nextNode,nameNode);
			//let dataNode = `${node}${rc("-",currentNode.next.length)}>${nameNode}`;
			if (text.find(t => t.id == nameNode) == undefined)
				text.push({ id: nameNode });//				text.push({id:nameNode,action:nextNode});
			//	text.push(dataNode);
			readNodes(nameNode, 0);
			nextNode.try++;
		});
	};
	readNodes(action.start, 0);
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
			if (Array.isArray(params[k])) {
				//str = str.replace("{" + k + "}", "[]");
			}else if (params[k].random) {
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
	
	if (action == null) { cbSuccess(); return; }
	if (action.next == null) { cbSuccess(); return; }
	let nodeAction = action.next[actionIndex];
	if (nodeAction == null || nodeAction == undefined) { cbSuccess(); return; }
	let currentAction = devicesActions[deviceId][nodeAction];
	if (currentAction == null) { cbFail(); return; }

	if (signalStop || devicesActions[deviceId]['progress']['signalStop']) {		
		//devicesActions[deviceId]['progress']['completed'].push(nodeAction);
		devicesActions[deviceId]['progress']['current'] = nodeAction;	
		devicesActions[deviceId]['progress']['state'] = 'ended';
		events['task.progress'].forEach(fn => fn(deviceId, devicesActions[deviceId]['progress']));
		return;
	}

	console.log("executeNode currentAction.preDelay actionIndex", nodeAction, currentAction.preDelay, actionIndex);
	setTimeout(() => {

		devicesActions[deviceId]['progress']['completed'].push(nodeAction);
		devicesActions[deviceId]['progress']['current'] = nodeAction;
		events['task.progress'].forEach(fn => fn(deviceId, devicesActions[deviceId]['progress']));
		//$(".act-" + deviceId).html(currentAction.name + "<br> " + currentAction.desc);
		if (currentAction.type == "static") {
			console.log("executeNode static loop", currentAction.loop,);
			if (currentAction.loop >= currentAction.maxLoop) {
				let beforeLoop = devicesActions[deviceId][currentAction.beforeLoop];
				console.log("executeNode is max loop", true);
				if ( beforeLoop == undefined){
					cbFail();
				}else{							
					setTimeout(() => {
						executeNode(beforeLoop, 0, deviceId, params, cbSuccess, cbFail);
					}, currentAction.postDelay);					
					//executeNode(action,actionIndex+1,deviceId,params,cbSuccess,cbFail);
				}
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

			//console.log("executeNode.command", command);
			//myWebSocket.send(JSON.stringify(command));
			events['send'].forEach(fn => fn(command));
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

			console.log(deviceId +" new eventNodes");
			eventNodes.push({
				deviceId: deviceId,
				action: nodeAction,
				state: true,
				cbSuccess: (img) => {
					executeNode(currentAction.next[0], 0, deviceId, params, () => {
						currentAction.trigger.forEach(trigger => {
							const pattern = androidPattern[trigger.pattern];
							//console.log(pattern);
							let outputcanvas = createCanvas(720, 1612);
							let outputcanvasP = createCanvas(720, 1612);
							let outputcanvasF = createCanvas(720, 1612);
							outputcanvas.width = 720;
							outputcanvas.height = 1612;
							outputcanvasP.width = 720;
							outputcanvasP.height = 1612;
							outputcanvasF.width = 720;
							outputcanvasF.height = 1612;
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

								console.log(deviceId +" executeNode.pattern true");
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
									events['send'].forEach(fn => fn(command));
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
								console.log(deviceId +" executeNode.pattern false");
								currentAction.try++;
								setTimeout(() => {
									executeNode(action, actionIndex + 1, deviceId, params, () => {
											cbSuccess();
										},
										() => {
											cbFail();
										});
								}, currentAction.postDelay);
							}
						});


					}, cbFail);
				},
				cbFail: () => {
					//BAD SCREEN
					let data = {
						"action": "Screen",
						"devices": deviceId,
						"data": {
							"savePath": "{screen_path}"
						}
					};
					events['send'].forEach(fn => fn(command));
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
					events['send'].forEach(fn => fn(data));
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
			events['send'].forEach(fn => fn(data));
			//myWebSocket.send(JSON.stringify(data));
		}else if (currentAction.type == "reader") {
			console.log(deviceId +" new eventNodes[reader]");
			eventNodes.push({
				deviceId: deviceId,
				action: nodeAction,
				state: true,
				cbSuccess: async(img,bimg) => {
					console.log("reading");
					
					//console.log(textImg);
					const constStates = Object.keys(params).map(k=>k+" = params['"+k+"']");
					let resultGlobal = true;
					let x = -1;
					let y = -1;
					let xm = -1;
					let ym = -1;
					console.log("constStates:");
					console.log(constStates.join(";\n"));
					eval(constStates.join(";"));
					//currentAction.trigger.forEach(async (trigger,i) => {	
					for(let i = 0; i < currentAction.trigger.length;i++){
						const trigger = currentAction.trigger[i];
						let result = true;					
						xm = Math.round(trigger.crop[0]+trigger.crop[2]/2);
						ym = Math.round(trigger.crop[1]+trigger.crop[3]/2);
						const blobCrop = getBlobCrop(img,trigger.crop);
						const text = (await ocr(blobCrop)).trim();
						console.log("text",text);
						console.log("trigger.pre.join",trigger.pre.join(";"));
						eval(trigger.pre.join(";"));
						console.log("----x,y", x,y);
						result = eval(trigger.result);
						if ( !result )
							resultGlobal=false;
					}
					//});
					console.log("accounts",params);
					console.log("resultGlobal",resultGlobal);

					console.log("xm,ym", xm, ym);

					console.log("x,y", x, y);
					if (resultGlobal){						
						console.log(deviceId +" executeNode.reader true");

						let command = JSON.parse(JSON.stringify(currentAction.command));
						if (command != null) {
							let tempParams = {
								x: x, y: y, xm:xm, ym:ym
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
							events['send'].forEach(fn => fn(command));
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
					}else{
						console.log(deviceId +" executeNode.reader false");
						currentAction.try++;
							setTimeout(() => {
								executeNode(action, actionIndex + 1, deviceId, params, () => {
										cbSuccess();
									},
									() => {
										cbFail();
									});
							}, currentAction.postDelay);
					}

					
				},
				cbFail: () => {
					let data = {
						"action": "Screen",
						"devices": deviceId,
						"data": {
							"savePath": "{screen_path}"
						}
					};
					events['send'].forEach(fn => fn(command));
				}
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
					events['send'].forEach(fn => fn(data));
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
			events['send'].forEach(fn => fn(data));
		}
	}, currentAction.preDelay);
}
function ocr(blob){
	return new Promise((resolve,reject) =>{		
		tesseract.recognize(blob, {							
			lang: "eng",
			oem: 1,
			psm: 3,
			//tessedit_char_whitelist: "0123456789X",
		})
		.then((text) => {
			//console.log("triger " + i +" text:",text)
			resolve(text);
		})
		.catch((error) => {
			console.error("[reader]error:",error)
		})
	})
}
function getBlobCrop(img, crop){
		const x = crop[0];
		const y = crop[1];
		const w = crop[2];
		const h = crop[3];
		const outputcanvas = createCanvas(w,h);
		const canvasctx = outputcanvas.getContext("2d");
		outputcanvas.width = w;
		outputcanvas.height = h;
		canvasctx.drawImage(img, x, y, w, h, 0, 0, w, h);
		const image = canvasctx.getImageData(0, 0, w, h);
		return outputcanvas.toBuffer('image/png');
}
function executeGraph(config, actionId, deviceId, ii, params, offsetDelay=null, cbSuccess, cbFail) {
	//console.log("androidActions[actionId]",androidActions[actionId]);
	let action = devicesActions[deviceId][actionId];
	if (actionId == null) { cbSuccess(); return; }
	console.log("pre ejecutando comando ");
	console.log("executeGraph.action.actionId", actionId);
	console.log("executeGraph.action.preDelay", action.preDelay);

	let timeExecute = offsetDelay==null?action.preDelay + 2500 * ii + Math.random() * 5000:action.preDelay+offsetDelay;
	if (config != null){
		timeExecute = action.preDelay + (config.offset * 1000 * ii);
	}	
	
	setTimeout(() => {
		if (action.type == "static") {
			//$(".act-" + deviceId).html(action.name + "<br> " + action.desc);
			devicesActions[deviceId]['progress']['completed'].push(actionId);
			devicesActions[deviceId]['progress']['current'] = actionId;
			events['task.progress'].forEach(fn => fn(deviceId, devicesActions[deviceId]['progress']));
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
			events['send'].forEach(fn => fn(command));
		} else if (action.type == "pattern") {
			//never start with a pattern, but...
			console.log("executeGraph.pattern test", JSON.stringify(action.command));
		}
		console.log("executeGraph.action.postDelay", action.postDelay);
		setTimeout(() => {
			executeNode(action, 0, deviceId, params,
				() => {					
					devicesActions[deviceId]['progress']['state'] = 'ended';
					events['task.progress'].forEach(fn => fn(deviceId, devicesActions[deviceId]['progress']));
					cbSuccess();
				},
				() => {					
					devicesActions[deviceId]['progress']['state'] = 'ended';
					devicesActions[deviceId]['progress']['fail'] = true;
					events['task.progress'].forEach(fn => fn(deviceId, devicesActions[deviceId]['progress']));
					cbFail();
				}
			)
		}, action.postDelay);
	}, timeExecute);
}
function executeTask(devices, task) {
	let tasks = [];
	let params = {};

	task.paramsArray.forEach(param => {
		if(Array.isArray(param.value)){			
			params[param.id] = param.value;
			return;
		}
		const paramLines = param.value.split('\n');
		if (paramLines.length < 2) {
			params[param.id] = param.value;
		} else
			params[param.id] = { random: false, index: 0, data: paramLines };
	});
	devicesActions = {};
	console.log("params", params);
	let countEnded = 0;
	devices.forEach((d, ii) => {
		let batchIndex = -1;
		if (task.config!=null)
			if (task.config.isBatch)
				task.config.batch.groups.forEach((gd,gi)=>batchIndex=gd.find(gdd=>gdd.serial==d.serial)?gi:batchIndex);
		//if (devicesActions[d.serial] != undefined){			
			clearScreens(d.serial);
		//}
		devicesActions[d.serial] = JSON.parse(JSON.stringify(nodeActions));
		devicesActions[d.serial]['progress'] = {taskId:task.id, path: task.progressPath, state: 'progress', completed: [], screens:{}, current: [task.start], start: task.start, end: task.end,signalStop:false,fail:false,batchIndex:batchIndex };
		devicesActions[d.serial]['params'] = params;
		events['task.progress'].forEach(fn => fn(d.serial, devicesActions[d.serial]['progress']));
		executeGraph(task.config, task.start, d.serial, ii, params, null, () => {
			countEnded++;
			console.log("executeTask:executeGraph.ended")

			devicesActions[d.serial]['progress']['state'] = 'ended';
			events['task.progress'].forEach(fn => fn(d.serial, devicesActions[d.serial]['progress']));
			if (countEnded >= devices.length) {
				console.log("all ended")
				countEnded = 0;
				signalStop = false;
			}
		}, () => {
			console.log("executeTask:executeGraph.incomplete")
		});
	});
}
function executeTaskBatch(devices, params, task, cbEnd) {
	let tasks = [];

	
	devicesActions = {};
	console.log("params", params);
	let countEnded = 0;
	devices.forEach((d, ii) => {
		let batchIndex = -1;
		if (task.config!=null)
			if (task.config.isBatch)
				task.config.batch.groups.forEach((gd,gi)=>batchIndex=gd.find(gdd=>gdd.serial==d.serial)?gi:batchIndex);
		//if (devicesActions[d.serial] != undefined){			
			clearScreens(d.serial);
		//}
		devicesActions[d.serial] = JSON.parse(JSON.stringify(nodeActions));
		devicesActions[d.serial]['progress'] = {taskId:task.id, path: task.progressPath, state: 'progress', completed: [],screens:{}, current: [task.start], start: task.start, end: task.end,signalStop:false,fail:false,batchIndex:batchIndex };
		devicesActions[d.serial]['params'] = params;
		events['task.progress'].forEach(fn => fn(d.serial, devicesActions[d.serial]['progress']));
		executeGraph(task.config, task.start, d.serial, ii, params, null, () => {
			countEnded++;
			console.log("executeTaskBatch:executeGraph.ended countEnded",countEnded + "/" + devices.length)

			devicesActions[d.serial]['progress']['state'] = 'ended';
			events['task.progress'].forEach(fn => fn(d.serial, devicesActions[d.serial]['progress']));
			if (countEnded >= devices.length) {				
				console.log("all ended")
				countEnded = 0;
				signalStop = false;
				cbEnd();
			}
		}, () => {
			countEnded++;
			console.log("executeTask:executeGraph.incomplete")

			devicesActions[d.serial]['progress']['state'] = 'ended';
			events['task.progress'].forEach(fn => fn(d.serial, devicesActions[d.serial]['progress']));
			if (countEnded >= devices.length) {				
				console.log("all ended with fails")
				countEnded = 0;
				signalStop = false;
				cbEnd();
			}
		});
	});
}
function resumeTask(devices, task) {
	let tasks = [];
	let params = {};

	task.paramsArray.forEach(param => {
		if(Array.isArray(param.value)){			
			params[param.id] = param.value;
			return;
		}
		const paramLines = param.value.split('\n');
		if (paramLines.length < 2) {
			params[param.id] = param.value;
		} else
			params[param.id] = { random: false, index: 0, data: paramLines };
	});
	//devicesActions = {};
	console.log("params", params);
	let countEnded = 0;
	devices.forEach((d, ii) => {
		console.log("resumeTask:executeGraph.resuming")
		//devicesActions[d.serial] = JSON.parse(JSON.stringify(nodeActions));
		//devicesActions[d.serial]['progress'] = { path: task.progressPath, state: 'progress', completed: [], current: [task.start], start: task.start, end: task.end };
		//events['task.progress'].forEach(fn => fn(d.serial, devicesActions[d.serial]['progress']));
		let tempProgress = devicesActions[d.serial]['progress'];
		let tempParams = devicesActions[d.serial]['params'];
		devicesActions[d.serial] = JSON.parse(JSON.stringify(nodeActions));
		devicesActions[d.serial]['progress'] = tempProgress;
		devicesActions[d.serial]['params'] = tempParams;
		params = tempParams;
		devicesActions[d.serial]['progress']['state'] = 'progress';
		executeGraph(task.config, task.resume, d.serial, ii, params, 0, () => {
			countEnded++;
			console.log("executeTask:executeGraph.ended")

			devicesActions[d.serial]['progress']['state'] = 'ended';
			events['task.progress'].forEach(fn => fn(d.serial, devicesActions[d.serial]['progress']));
			if (countEnded >= devices.length) {
				console.log("all ended")
				countEnded = 0;
				signalStop = false;
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
function clearScreens(serialFullName){
    var files = [];
	const serial = serialFullName.replaceAll(":","_");
	const pathScreens = __dirname+"/../screens/";
	//console.log("clearScreens",__dirname+"/"+pathScreens);
    fs.readdir(pathScreens, function(err,list){
        if(err) throw err;
        for(var i=0; i<list.length; i++){
			//console.log("test",list[i]); 
            if(list[i].includes(serial)){
                //console.log("deleting",list[i]); 
                //files.push(list[i]);
				if(fs.existsSync(pathScreens+list[i]))
					fs.unlinkSync(pathScreens+list[i]);
            }
        }
    });
}
class Executor {
	constructor() {

	}
	/** Register Screen for progress */
	async regScreen(id,img){		
		const pathScreens = "screens/";
		const serial = id.replaceAll(":","_");
		if (devicesActions[id]==undefined) return;
		if (devicesActions[id]['progress']==undefined) return;
		
		const timestamp = Date.now();
		const screenUid = timestamp;
		const actionIdCurrent = devicesActions[id]['progress']['current'];		
		if (devicesActions[id]['progress']['screens'][actionIdCurrent]==undefined)
			devicesActions[id]['progress']['screens'][actionIdCurrent] = [];
		devicesActions[id]['progress']['screens'][actionIdCurrent].push(screenUid);
		//screensCache[screenUid] = img;
		ocr(img).then(text=>{
			fs.writeFileSync(pathScreens+serial+'-'+timestamp+'.txt', text);
		});
		fs.writeFileSync(pathScreens+serial+'-'+timestamp+'.png', img)
	}
	screen(id, bimg) {
		this.regScreen(id,bimg);
		if ( eventNodes.find(e=>e.deviceId == id )==undefined ) {
			return;
		}
		if (bimg.length > 0) {
			try {
				loadImage(bimg).then((img) => {
					eventNodes.forEach((e, i) => {
						if (e.deviceId == id) {
							console.log("event success", e);
							e.cbSuccess(img,bimg);
							eventNodes.splice(i, 1);
						}
					});
				});
			} catch (e) {
				console.log("executor.screen ERROR",e);
				let data = {
					"action": "Screen",
					"devices": id,
					"data": {
						"savePath": "{screen_path}"
					}
				};
				events['send'].forEach(fn => fn(data));
			}
		} else {
			console.log("executor.screen img.length = 0");
			let data = {
				"action": "Screen",
				"devices": id,
				"data": {
					"savePath": "{screen_path}"
				}
			};
			if ( eventNodes.find(e=>e.deviceId == id )!=undefined ) {
				events['send'].forEach(fn => fn(data));
			}
		}
	}
	on(ev, fn) {
		events[ev].push(fn);
	}
	stopAll() {
		signalStop = true;
	}
	stopTask(devices) {		
		devices.forEach(d=>{
			if (devicesActions[d.serial]!=null){			
				devicesActions[d.serial]['progress']['signalStop'] = true;
			}
		});
	}
	setActions(_nodeActions) {
		nodeActions = _nodeActions;
	}
	setPatterns(_patterns) {
		androidPattern = _patterns;
	}
	startTask(devices, task) {
		eventNodes = [];
		signalStop = false;
		executeTask(devices, task);
	}
	startTaskBatch(_devices, task) {
		eventNodes = [];
		signalStop = false;
		let batchs = [];
		let params = [];
		console.log("building batch");

		if (!task.config.isBatch){
			executeTask(_devices, task);
			return;
		}
		task.paramsArray.forEach(param => {
				
			if(Array.isArray(param.value)){			
				params[param.id] = param.value;
				return;
			}
			const paramLines = param.value.split('\n');
			if (paramLines.length < 2) {
				params[param.id] = param.value;
			} else
				params[param.id] = { random: false, index: 0, data: paramLines };
		});
		task.config.batch.groups.forEach(groupDevices=>{
			let batch = (cb)=>{
				setTimeout(()=>{
					executeTaskBatch(groupDevices, params, task, ()=>{
						cb();
					});
				},task.config.batch.offset*1000);
			};
			batchs.push(batch);
		});
		console.log("starting batch executor");
		let batchExecutor = (index)=>{
			if (batchs[index]==undefined) {console.log("ending batch");return};
			console.log("start batch " + index + " of " +batchs.length);
			batchs[index](()=>{
				console.log("ended batch " + index);
				batchExecutor(index+1);
			});
		};
		batchExecutor(0);
	}
	resumeTask(devices, task) {
		eventNodes = [];
		devices.forEach(d=>{
			devicesActions[d.serial]['progress']['signalStop'] = false;
		});
		resumeTask(devices, task);
	}
}

module.exports = { Executor, genPlant, replaceParams, bwImage, pathPattern, findPattern, executeNode, executeGraph, executeTask, executeTasks }