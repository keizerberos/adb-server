const { Router } = require('express');
const { remote, attach } = require('webdriverio');
const hostDriver = '172.20.50.123';//'192.168.100.7';// '172.20.50.123';
const fs = require("fs");

const cookies_fb = JSON.parse(fs.readFileSync('./cookies_fb.json', 'utf8'));
cookies_fb.forEach(cookie=> {
	if (cookie['sameSite']!=undefined)
		cookie['sameSite'] = 'default';
});
const cookies_tk = JSON.parse(fs.readFileSync('./cookies_tk.json', 'utf8'));
cookies_tk.forEach(cookie=> {
	if (cookie['sameSite']!=undefined)
		cookie['sameSite'] = 'default';
});
//console.log("cookies",cookies);
class FBQueryClient {
	constructor() {
	}
	async url(urlText) {
		
	}
}

module.exports = { FBQueryClient };