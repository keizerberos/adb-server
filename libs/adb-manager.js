const { WebSocketServer } = require('ws');
let Log = null;
class AdbManager{
    constructor(Log){                
        Log = Log;
		this.clusters = [];

		const myWebSocket = new WebSocket("ws://localhost:5000/");
		myWebSocket.onmessage = function (event) {
			this.clusters.push(event);
			//processMessage(event);
		};
		myWebSocket.onopen = function (evt) {
			//socketConnected(evt);
		};
		myWebSocket.onclose = function (evt) {
			//console.log("onclose.");		
			//setTimeout(()=>{ connectSocket(); },3000);	
		};
		myWebSocket.onerror = function (evt) {
			console.log("Error!");
			//connectSocket();
		};
    }
}
module.exports = {AdbManager};