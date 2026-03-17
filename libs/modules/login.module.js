const { UserEntity } = require("../entitys/user.entity.js");
//require('events').EventEmitter.defaultMaxListeners = 15;
//const { createHash } = require ('crypto');
const jwt = require('jsonwebtoken');
const secretKey = 'd41d8cd98f00b204e9800998ecf8427e';

function CRP(){
	const newId = (new Date()).getTime().toString(36) + Math.random().toString(36).slice(2);
	return newId.replaceAll('-','');
}


function createToken(data) {
	const token = jwt.sign({ data: JSON.stringify(data) }, secretKey, {
		expiresIn: '24h',
	});
	return token;
}

function decodeJWT (token){
	try {
		const base64Url = token.split('.')[1];
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
				return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
		}).join(''));
		return JSON.parse(jsonPayload);
	} catch (e) {
		return null;
	}
};

class LoginModule {
	constructor(dbm) {
		this.users = this.loadUsers(dbm);
		this.dbm = dbm;
		this.tokens = {};
		this.events = {
			login: [],
		};
		this.fastServer = null;
		this.socket = null;
	}
	loadUsers(dbm) {
		const users = new UserEntity(dbm).all();
		return users;
	}
	on(ev, fn) {

		this.events[ev].push(fn);
	}
	when(ev, _data) {
		const self = this;
		if (ev == "startServer.init") {
			this.fastServer = _data.fastServer;
			this.clients = _data.clients;

			this.fastServer.get("/tokens", (req, res) => {
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify(self.tokens));
			});
		}
		if (ev == "io.connection") {
			const socket = _data.socket;
			const uuid = _data.uuid;
			const client = _data.client;
			//socket.emit("i", CRP(Date.now()));            
			//socket.removeAllListeners();

			socket.on("auth.login", (data) => {
				//console.log("auth", data);
				self.users = new UserEntity(self.dbm).all();
				const user = self.users.find(u => u.username == data.user && u.password == data.pass && u.enabled == 1);
				//console.log("user",user);
				if (user != undefined) {
					console.log("auth login");
					const tokenId = CRP(Date.now());
					//console.log("tokenId",tokenId);
					const token = createToken({id:user.id,username:user.username,fullname:user.fullname,roles:user.roles,enabled:user.enabled});
					self.tokens[tokenId] = { token: token, uuid: uuid, socket:socket, client: { type: client.type, devices: client.devices, uuid: client.uuid, features: client.features, address: client.address, windows: client.windows, parentUid: client.parentUid } };
					
					socket.emit("auth", { t: tokenId, i: token, n: user.fullname });
					client['login'] = { user: user, tokenId: tokenId }
					_data.configSocket();
				} else {
					if (data.i != undefined && data.t != undefined) {

						//console.log("auth test t i",data.t,data.i);
						//console.log("auth token", self.tokens[data.t]);
						if (self.tokens[data.t] != undefined) {
							//console.log("auth token mem");
							self.tokens[data.t].socket = socket;
							socket.emit("auth", { t: data.t, i: data.i, n: data.n });
							_data.configSocket();
						} else {
							//console.log("auth token resolve");
							try {
								const decoded = jwt.verify(data.i, secretKey);
								const tokenId = CRP(Date.now());
								//console.log("tokenId",tokenId);
								//console.log("decoded", decoded);
								const user = JSON.parse(decoded.data);
								const token = createToken(user);
								self.tokens[tokenId] = { token: token, uuid: uuid, socket:socket, client: { type: client.type, devices: client.devices, uuid: client.uuid, features: client.features, address: client.address, windows: client.windows, parentUid: client.parentUid } };
								socket.emit("auth", { t: tokenId, i: token, n: user.fullname });
								client['login'] = { user: user, tokenId: tokenId }
								_data.configSocket();
							} catch (e) {
								//console.log("auth.bad json", {});
								socket.emit("auth.bad", {});
							}
							//console.log("bad auth token");
						}
					} else {
						socket.emit("auth.bad", {});
						console.log("bad auth data");
					}

				}
			});
			socket.on("disconnect", (data) => {
				//socket.offAny();
				
			});
			socket.on("user.load", (data) => {
				//console.log("load users");
				const users = new UserEntity(self.dbm).all();
				socket.emit("user.load", users.map(u => { return {id:u.id, username:u.username, fullname:u.fullname, roles:u.roles, mail:u.mail, enabled:u.enabled}; }));
			});
			socket.on("user.create", (data) => {
				//console.log("user.create", data);

				const user = new UserEntity(self.dbm);
				user.setUsername(data.username);
				user.setFullname(data.fullname);
				user.setPassword(data.password);
				user.setRoles(data.roles);
				user.setMail(data.mail);
				user.setEnabled(1);
				//console.log("this._values",user._values);
				user.save();
			});
			socket.on("user.save", (data) => {
				console.log("user.save", data);
				const user = new UserEntity(self.dbm);
				user.set(data);
				console.log("[save] tokens", Object.keys(self.tokens).length);
				const tokensIds = Object.keys(self.tokens).filter(k=>{
					const token_data = JSON.parse(jwt.verify(self.tokens[k].token, secretKey).data);
					//console.log("token_data", token_data);
					return (token_data.id == data.id);
				});
				if (tokensIds.length>0){
					
					console.log("tokensIds", tokensIds);
					tokensIds.forEach(tokenId =>{
						const token = createToken({id:data.id,username:data.username,fullname:data.fullname,roles:data.roles,enabled:data.enabled});
						self.tokens[tokenId].token = token;
						console.log("sending", tokenId );
						self.tokens[tokenId].socket.emit("auth.refresh", { t: tokenId, i: token, n: data.fullname });
					});
					
				}
				socket.emit("user.save", user.save());
			});
			socket.on("user.save.pass", (data) => {
				console.log("user.save.pass", data);
				const user = new UserEntity(self.dbm);
				user.set(data);
				console.log("[save] tokens", Object.keys(self.tokens).length);
				const tokensIds = Object.keys(self.tokens).filter(k=>{
					const token_data = JSON.parse(jwt.verify(self.tokens[k].token, secretKey).data);
					//console.log("token_data", token_data);
					return (token_data.id == data.id);
				});
				if (tokensIds.length>0){
					
					console.log("tokensIds", tokensIds);
					tokensIds.forEach(tokenId =>{
						const token = createToken({id:data.id,username:data.username,fullname:data.fullname,roles:data.roles,enabled:data.enabled});
						self.tokens[tokenId].token = token;
						console.log("sending", tokenId );
						self.tokens[tokenId].socket.emit("auth.refresh", { t: tokenId, i: token, n: data.fullname });
					});
					
				}
				socket.emit("user.save", user.save());
			});
			socket.on("user.delete", (data) => {				
				console.log("user.delete", data);
				const user = new UserEntity(self.dbm);
				user.set(data)
				
				socket.emit("user.delete", user.delete());
			});
		}
	}
}
/**
 * 
const token = jwt.sign({ user: JSON.parse(JSON.stringify(user)) }, secretKey, {
expiresIn: '24h',
});

function verifyToken(req, res, next) {
		//const token = req.header('Authorization');
		const authHeader = req.headers['authorization'];
		const token = authHeader && authHeader.split(' ')[1];  // Bearer <token>
		if (!token) return res.status(401).json({ error: 'Access denied' });
		try {
				const decoded = jwt.verify(token, secretKey);
				//req.userId = decoded.userId;
				next();
		 } catch (error) {
				res.status(401).json({ error: 'Invalid token' });
		 }
};
 */

module.exports = { LoginModule };