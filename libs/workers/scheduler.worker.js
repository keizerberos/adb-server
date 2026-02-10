
const fs = require('fs');
const { parentPort, workerData } = require('node:worker_threads');

const { timerEach, schedulePath } = workerData;
let schedules = {};

function getToday(){
	const dateObject = new Date();
	const s = dateObject.getSeconds();
	return Math.floor(dateObject/1000)*1000 - s*1000;
}
function getDay(){
	const dateObject = new Date();
	return dateObject.getDay();
}
function DateToTimestamp(dateStr,hourStr){
	const dateString = dateStr+"T"+hourStr+":00";//"2024-01-15T10:00:00Z";
	const dateObject = new Date(dateString);
	//return dateObject.getTime()+14400000;
	return dateObject.getTime();
}
function TimestampToHourMinDelta(timestamp){
	/*const  dateObject = new Date(t+0);
	const h = dateObject.getHours();
	const m = dateObject.getMinutes();*/
	const t = timestamp/1000;
	const sec = ((t)%60);
	const min = ((t-sec)/60)%60;
	const hor = (((t-sec)/60)-min)/60;
	
	return hor+"h:"+min+"m:"+sec+"s";
}
function TimestampToDate(timestamp){
	const  dateObject = new Date(timestamp+0);
	const h = dateObject.getHours();
	const m = dateObject.getMinutes();
	const s = dateObject.getSeconds();
	const D = dateObject.getDate();
	const M = dateObject.getMonth()+1;
	const Y = dateObject.getFullYear();
	const Z = dateObject.getTimezoneOffset();
	return Y+"-"+(M+"").padStart(2, '0')+"-"+(D+"").padStart(2, '0');
	
	return hor+"h:"+min+"m:"+sec+"s";
}
function TimestampToDateHourMin(t){
	const  dateObject = new Date(t+0);
	const h = dateObject.getHours();
	const m = dateObject.getMinutes();
	const s = dateObject.getSeconds();
	const D = dateObject.getDate();
	const M = dateObject.getMonth()+1;
	const Y = dateObject.getFullYear();
	const Z = dateObject.getTimezoneOffset();
	return (D+"").padStart(2, '0')+"/"+(M+"").padStart(2, '0')+"/"+Y+" "+h+"h:"+m+"m:"+s+"s" + " Z"+ Z;
}
function pad(n){
	return (n+"").padStart(2, '0');
}
function TimestampToHourMin(t){
	const  dateObject = new Date(t+0);
	const h = dateObject.getHours();
	const m = dateObject.getMinutes();
	const s = dateObject.getSeconds();
	const D = dateObject.getDate();
	const M = dateObject.getMonth()+1;
	const Y = dateObject.getFullYear();
	const Z = dateObject.getTimezoneOffset();
	return pad(h)+":"+pad(m);
}
function scanScheduleFolder() {
	//schedules = {};
	const listSchdules = fs.readdirSync(schedulePath);
	for (let i = 0; i < listSchdules.length; i++) {
		const file = listSchdules[i];
		let base = schedulePath + '/' + file;
		let nameUid = file.replace("-schedule.json", "");
		if (!fs.statSync(base).isDirectory()) {
			const content = fs.readFileSync(base, 'utf8');
			if (content == '') return;
			const schedule = JSON.parse(content);
			if(schedules[nameUid]==null){
				schedules[nameUid] = schedule;
				schedules[nameUid]['id'] = nameUid;
			}else{
				Object.keys(schedule).forEach(k=>{
					schedules[nameUid][k] = schedule[k];
				});				
			}
		}
		parentPort.postMessage({command:"schedule.load",payload:schedules});
	}
	//console.log("schedules", schedules);
}
function updateSchedule(id){
	const schedule = schedules[id];
			return new Promise((res,rej)=>{
				fs.writeFile(`./data/schedules/${id}-schedule.json`,JSON.stringify(schedule, null, '\t'),'utf8', (err)=>{
					if (err) {
						console.error('schedule.new Error writing file:', err);
						rej();
						return;
					}
					console.log('schedule.new written successfully!');
					res();
				});
			})
}

scanScheduleFolder();

setInterval(() => {
	//parentPort.postMessage('Timer finished after '+timerEach+' seconds');
	console.log("schedules total:", Object.keys(schedules).length);
	const day = getDay();
	console.log("day:",day);
	const todayTime = getToday();
	const dayTime = TimestampToDate(todayTime);
	const hour = TimestampToHourMin(todayTime);
	console.log("hour:",hour);
	console.log("");
	Object.keys(schedules).forEach(k=>{
		const uid = k;
		const schedule = schedules[k];
		//console.log("schedule",schedule.schedule);
		// IS ENABLED
		if (schedule.enabled == false) return;	
		// HAVE'NT SCHEDULE
		if (schedule.scheduleTask.haveScheduleTask == false && !schedule.scheduleTask.executed) {			
			schedule['state'] = "running";
			schedule.scheduleTask['executed'] = true;
			console.log("SEND TYPE 1",k);
			parentPort.postMessage({command:"schedule.run",payload:schedule});
			updateSchedule(uid);
			return;
		};
				// HAVE SCHEDULE && WAS EXECUTED
		if (schedule.scheduleTask.haveScheduleTask == false && schedule.scheduleTask.executed) {			
			//console.log("schedule.id", k, "executed");
			
			//console.log("SEND TYPE 2");
			return;
		}
		
		/*console.log("todayTime",todayTime);
		console.log("startTime",startTime);
		console.log("almost",(startTime-todayTime));
		console.log("hoy",TimestampToDateHourMin(todayTime));
		console.log("inicia",TimestampToDateHourMin(startTime));*/
		// NO REPEAT ONLY SCHEDULE
		if (schedule.schedule.repeatDay==false && schedule.schedule.repeatHour==false && !schedule.scheduleTask.executed){
			const startTime = DateToTimestamp(schedule.schedule.startDate, schedule.schedule.startTime);
			console.log("schedule.id", k + " ["+schedule.schedule.startDate+" "+ schedule.schedule.startTime+"]");
			console.log("schedule.id", k);
			console.log("inicia",TimestampToDateHourMin(startTime));
			console.log("faltan",TimestampToHourMinDelta(startTime-todayTime)); 
			console.log("executed",schedule.scheduleTask.executed?true:false); 
			console.log("");
			
			if ((startTime-todayTime)<=0 && schedule.state!="running" ){
				schedule['state'] = "running";
			  schedule.scheduleTask['executed'] = true;
				console.log("SEND TYPE 3");
				parentPort.postMessage({command:"schedule.run",payload:schedule});
				updateSchedule(uid);
			}
		}else if (schedule.schedule.repeatDay==true && schedule.schedule.repeatHour==false ){
			if (!schedule.schedule.frequencyDay.includes(day)) return ;
			//if (!schedule.schedule.frequencyHour.includes(hour)) return ;
				
				const startTime = DateToTimestamp(dayTime, schedule.schedule.startTime);
				console.log("schedule.id", k );
				console.log("inicia",TimestampToDateHourMin(startTime));
				console.log("faltan",TimestampToHourMinDelta(startTime-todayTime)); 
				console.log("");
				
			if (startTime-todayTime<=0 && schedule.state!="running" && !schedule.scheduleTask.executed){
				schedule['state'] = "running";
			  schedule.scheduleTask['executed'] = true;
				console.log("SEND TYPE 4");
				parentPort.postMessage({command:"schedule.run",payload:schedule});
				updateSchedule(uid);
			}
		}else if (schedule.schedule.repeatDay==true && schedule.schedule.repeatHour==true ){
			if (!schedule.schedule.frequencyDay.includes(day)) return ;
			//if (!schedule.schedule.frequencyHour.includes(hour)) return ;
				const hours = schedule.schedule.frequencyHour.split(",");
				hours.forEach(hour=>{
							
						  const startTime = DateToTimestamp(dayTime, hour);
							console.log("schedule.id", k + " ["+dayTime+" "+ hour+"]");
							console.log("startTime",startTime);
							console.log("todayTime",todayTime);
							console.log("almost",(startTime-todayTime));
							console.log("inicia",TimestampToDateHourMin(startTime));
							console.log("faltan",TimestampToHourMinDelta(startTime-todayTime)); 
							console.log("");
							
						if (startTime-todayTime<=0 && schedule.state!="running" && !schedule.scheduleTask.executed){
							schedule['state'] = "running";
							schedule.scheduleTask['executed'] = true;
							console.log("SEND TYPE 5");
							parentPort.postMessage({command:"schedule.run",payload:schedule});
							updateSchedule(uid);
						}
				})				
		}
	});
}, timerEach);

parentPort.on("message", (message) => {
	if (message.command === 'schedule.loading') {
		scanScheduleFolder();
	}
});
//module.exports = { Scheduler }