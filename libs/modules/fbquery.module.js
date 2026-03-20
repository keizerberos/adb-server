const { Router } = require('express');
const { remote, attach } = require('webdriverio');
const hostDriver = '192.168.100.7';// '172.20.50.123';
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
class FBQuery {
	constructor() {

		this.sessionIdDesk = null;
		this.sessionIdMov = null;
		//this.sessionId  = "dbe42b99b96128b248dc416af97182e9";
		//this.sessionId = "58a879bc471a1a02b5a2cc1337141011";
		//this.sessionId = "769b73336510499ea535aaaedfca60c2";
	}
	readFbPostOld(urlText) {
		return new Promise(async (res, rej) => {
			let browser = null;
			try {
				if (this.sessionId == null) {
					browser = await remote({
						// For a Selenium Grid or local standalone server
						protocol: 'http',
						hostname: '172.20.50.123', // Or your grid's hostname
						port: 4444,
						capabilities: {
							browserName: 'chrome',
							//browserVersion: 'stable',
							// Add other capabilities as needed
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
					this.sessionId = browser.sessionId;
				} else
					browser = await attach({
						// For a Selenium Grid or local standalone server
						sessionId: this.sessionId,
						protocol: 'http',
						hostname: '172.20.50.123', // Or your grid's hostname
						port: 4444,
						capabilities: {
							browserName: 'chrome',
							//browserVersion: 'stable',
							// Add other capabilities as needed
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
				/*	const browser = await remote({ capabilities: 
						{  
							browserName: 'chrome',
							browserVersion: 'stable',
							acceptInsecureCerts: true,
							'goog:chromeOptions': {
									args: [
									'--disable-web-security',
									'--allow-file-access-from-files',
									'--allow-file-access',
									'--disable-infobars',
									'--ignore-certificate-errors',
									'--disable-gpu',
									'--window-size=1024x768',
									'--headless',
									],
							}, },
							logLevel: 'info',
							connectionRetryCount: 1,
					
					});*/


				console.log("urlText", urlText);
				const handles0 = await browser.getWindowHandles();
				console.log("handles0.length", handles0.length);

				await browser.navigateTo(urlText)
				const domTitle = await browser.$('div[data-ad-rendering-role="profile_name"]');
				const title = await domTitle.getText();
				//console.log ("title",title);

				const domDesc = await browser.$('div[data-ad-rendering-role="story_message"]');
				//console.log("domDesc", domDesc.error);
				let desc = "";
				if (!domDesc.error) desc = await domDesc.getText();
				//console.log ("desc",desc);

				const domCount = await browser.$('span[role="toolbar"]').parentElement().parentElement();
				const countText = await domCount.getText();
				const textCount = await countText.split("\n");
				//console.log ("countText",countText);
				//console.log ("textContent",textContent);
				const domImage = await browser.$('a[role="link"] img');
				const srcImg = await domImage.getAttribute("src");

				/*const domUrl = await browser.$('#_r_3_ a');
				//const domUrl2 = await browser.$$('a[role="link"][tabIndex="0"]');
				//console.log("domUrl2",domUrl2);
				const href = await domUrl.getAttribute("href");
				console.log("href",href);
				let shortHref = "";
				if(href!=null){
					if (href.split("?").length>1)
					shortHref = href.split("?")[0];
				}*/
				const handles = await browser.getWindowHandles();
				console.log("handles.length", handles.length);
				if (handles.length > 1) {//this.sessionId = null;
					const exit = await browser.closeWindow();
				}
				//await browser.quit();

				//await browser.deleteSession()
				//console.log ("url", url );
				
				res({
					title, desc, textCount, srcImg
				});
			} catch (e) {
				console.error("e", e);
				this.sessionId = null;
				/*if (browser!=null){
					const handles = await browser.getWindowHandles();
					console.log("handles.length",handles.length);
					if (handles.length > 1) {//this.sessionId = null;
						const exit = await browser.closeWindow();
					}
					if(handles.length==0){
						this.sessionId = null;
					}
				}*/
				rej(e)
			};
		});
	}
	readFbPost(urlText) {
		console.log("readFbPost",urlText);
		return new Promise(async (res, rej) => {
			let browser = null;
			const type= "fbPost"
			try {
				if (this.sessionIdDesk == null) {
					browser = await remote({
					//	protocol: 'http',
						hostname: hostDriver, // Or your grid's hostname
						
						port: 4444,
						capabilities: {
							browserName: 'chrome',
							  'goog:chromeOptions': {
										args: [
												//'--user-data-dir=D:\\Chrome\\User\\Data',
							//					'--user-data-dir=C:\\Users\\Z490X\\AppData\\Local\\Google\\Chrome\\User\ Data',
									//			'--profile-directory=Default',
                //'--user-data-dir=/Users/TuUsuario/Library/Application Support/Google/Chrome/',
                // Nombre de la carpeta del perfil específico (ej. "Default" o "Profile 1")
             //   '--profile-directory=Default',
                '--disable-web-security',
                '--allow-running-insecure-content',								
								'--window-size=1024,800', 
								'--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
												//'--user-data-dir="C:\\Users\\Z490X\\AppData\\Local\\Google\\Chrome\\User Data"',
											//	'--user-data-dir="C:\\Users\\Z490X\\AppData\\Local\\Google\\Chrome\\User Data\\Default"',
												//'--profile-directory=Default',
												//'--user-data-dir="C:\\Users\\Z490X\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\ojfebgpkimhlhcblbalbfjblapadhbol\\3.0.5_0"',
												// Optional: specify a specific profile within the directory
												//'--profile-directory=Profile 1' 
										]
								}
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
					this.sessionIdDesk = browser.sessionId;
					browser.setCookies(cookies_fb);
				} else
					browser = await attach({
						// For a Selenium Grid or local standalone server
						sessionId: this.sessionIdDesk,
						protocol: 'http',
						hostname: hostDriver, // Or your grid's hostname
						port: 4444,
						capabilities: {
							browserName: 'chrome',
							  'goog:chromeOptions': {
										args: [
												//'--user-data-dir=D:\\Chrome\\User\\Data',
							//					'--user-data-dir=C:\\Users\\Z490X\\AppData\\Local\\Google\\Chrome\\User\ Data',
									//			'--profile-directory=Default',
                //'--user-data-dir=/Users/TuUsuario/Library/Application Support/Google/Chrome/',
                // Nombre de la carpeta del perfil específico (ej. "Default" o "Profile 1")
               // '--profile-directory=Default',
                '--disable-web-security',
                '--allow-running-insecure-content',
								'--window-size=1024,800', 
								'--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
												//'--user-data-dir="C:\\Users\\Z490X\\AppData\\Local\\Google\\Chrome\\User Data\\Default"',
												//'--user-data-dir="C:\\Users\\Z490X\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\ojfebgpkimhlhcblbalbfjblapadhbol\\3.0.5_0"',
												// Optional: specify a specific profile within the directory
												//'--profile-directory=Profile 1' 
										]
								}
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
					
				console.log("sessionIdDesk browser.sessionId", await browser.sessionId);

				console.log("urlText", urlText);
				const handles0 = await browser.getWindowHandles();
				console.log("handles0.length", handles0.length);

				await browser.navigateTo(urlText)

				const domTitle = await browser.$('div[role="dialog"] div[data-ad-rendering-role="profile_name"]');
				const title = await domTitle.getText();
				//console.log ("title",title);

				const domDesc = await browser.$('div[role="dialog"]  div[data-ad-rendering-role="story_message"]');
				let desc = "";
				if (!domDesc.error) desc = await domDesc.getText();

				const domCount = await browser.$('div[role="dialog"] span[role="toolbar"]').parentElement().parentElement();
				const countText = await domCount.getText();
				const textCount = await countText.split("\n");
				
				const domImage = await browser.$('div[role="dialog"] a[role="link"] img');
				const srcImg = await domImage.getAttribute("src");

				const handles = await browser.getWindowHandles();
				console.log("handles.length", handles.length);
				if (handles.length > 1) {
					const exit = await browser.closeWindow();
				}
				res({
					title, desc, textCount, srcImg, type
				});
			} catch (e) {
				console.error("e", e);
				//this.sessionId = null;
				rej(e)
			};
		});
	}
	readFbReel(urlText) {

		let reelId = urlText.match(/(?=reel\/)*[0-9]{1,50}/g);
		if ( reelId.length == 0) return;
		reelId = reelId[0];
		console.log("reelId",reelId);
		return new Promise(async (res, rej) => {
			let browser = null;
			const type= "fbReel"

			try {
				if (this.sessionIdDesk == null) {
					browser = await remote({
						protocol: 'http',
						hostname: hostDriver, // Or your grid's hostname
						port: 4444,
						capabilities: {
							browserName: 'chrome',
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
					this.sessionIdDesk = browser.sessionId;
				  browser.setCookies(cookies_fb);
				} else
					browser = await attach({
						// For a Selenium Grid or local standalone server
						sessionId: this.sessionIdDesk,
						protocol: 'http',
						hostname: hostDriver, // Or your grid's hostname
						port: 4444,
						capabilities: {
							browserName: 'chrome',
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
			
				console.log("sessionIdDesk browser.sessionId",browser.sessionIdDesk);

				console.log("urlText", urlText);
				const handles0 = await browser.getWindowHandles();
				console.log("handles0.length", handles0.length);

				await browser.navigateTo(urlText)
				const title ="";
				let desc ="";
				const srcImg ="";
				let textCount = [0,0,0,0,0];
				let likes = await browser.$(`div[aria-label="Me gusta"]`).parentElement().parentElement().getText();
				if (likes == "") likes = 0;
				let comments = await browser.$(`div[aria-label="Comentar"]`).parentElement().parentElement().getText();
				if (comments == "") comments = 0;
				let share = await browser.$(`div[aria-label="Compartir"]`).parentElement().parentElement().getText();
				console.log("likes",likes);
				textCount[0]= likes;
				console.log("comments",comments);
				textCount[1]= comments;
				console.log("share",share);
				textCount[2]= share;

				const propLink = await browser.$(`a[aria-label="Ver perfil del propietario"`); 

				desc =  await propLink.parentElement().parentElement().parentElement().parentElement().parentElement().parentElement().parentElement().parentElement().parentElement().parentElement().parentElement().parentElement().parentElement().parentElement().parentElement().getText();
				
				const hrefProp = await propLink.getAttribute("href");
				console.log("hrefProp",hrefProp);
				const linkProfile = "https://www.facebook.com"+hrefProp;


				await browser.navigateTo(linkProfile)

				let trys = 0;
				let views = 0;
				let searching = true;
				while ( searching && trys < 30){
					//Array.from(document.querySelectorAll('a[aria-label="Vista previa del ícono de reel"]')).filter(a=>a.href.includes('1398046465430051'))[0].textContent
					

				await browser.action('wheel')
					.scroll({
						deltaX: 0,
						deltaY: 800,    // Positive = Down, Negative = Up
						duration: 200,  // Smoothness of the scrollv
					})
					.perform();
					await browser.pause(400+Math.random(1000)); // Waits for 2 seconds
					const reels = await browser.$$(`a[aria-label="Vista previa del ícono de reel"]`); 
					const reelshref = await reels.map(async r=> { return {content: await r.getText(), href:await r.getAttribute('href')}; } );
					//console.log("reelshref",reelshref);
					const findedReel= await reelshref.find(r=>r.href.includes(reelId));
					//console.log("reelshref",reelshref);
					//console.log("reels",reels);
					console.log("findedReel",findedReel);
					if (findedReel!=null){
						searching = false;
						views = findedReel.content;
						
						textCount[3]= views;
					}
					trys++;
				}

				const handles = await browser.getWindowHandles();
				console.log("handles.length", handles.length);
				if (handles.length > 1) {
					const exit = await browser.closeWindow();
				}
				res({
					title, desc, textCount, srcImg, type, views
				});
			} catch (e) {
				console.error("e", e);
				//this.sessionId = null;
				rej(e)
			};
		});
	}

	readTk(urlText) {

		let videoId = urlText.match(/video\/[0-9]{1,50}/g);
		if ( videoId.length == 0) return;
		videoId = videoId[0].replaceAll("video/","");
		console.log("videoId",videoId);
		return new Promise(async (res, rej) => {
			let browser = null;
			const type= "tk"

			try {
				if (this.sessionIdDesk == null) {
					browser = await remote({
						protocol: 'http',
						hostname: hostDriver, // Or your grid's hostname
						port: 4444,
						capabilities: {
							browserName: 'chrome',
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
					this.sessionIdDesk = browser.sessionId;
				  browser.setCookies(cookies_tk);
				} else
					browser = await attach({
						// For a Selenium Grid or local standalone server
						sessionId: this.sessionIdDesk,
						protocol: 'http',
						hostname: hostDriver, // Or your grid's hostname
						port: 4444,
						capabilities: {
							browserName: 'chrome',
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
			
				console.log("sessionIdDesk browser.sessionId",browser.sessionId);

				console.log("urlText", urlText);
				const handles0 = await browser.getWindowHandles();
				console.log("handles0.length", handles0.length);

				//browser.setCookies(cookies_tk);

				await browser.navigateTo(urlText)
				let title ="";
				let desc ="";
				let views = 0;
				const srcImg ="";
				let textCount = [0,0,0,0,0,0];

				await browser.pause(3500+Math.random(2000)); // Waits for 2 seconds

				 desc = await browser.$(`div[data-e2e="video-desc"]`).getText();


				let likes = await browser.$(`strong[data-e2e="like-count"]`).getText();
				if (likes == "") likes = 0;
				textCount[0] = likes;

				
				let comments = await browser.$(`strong[data-e2e="comment-count"]`).getText(); 
				if (comments == "") comments = 0;
				textCount[1] = comments;

				let fav = await browser.$(`strong[data-e2e="undefined-count"]`).getText(); 
				if (fav == "") fav = 0;
				textCount[5] = fav;

				let share = await browser.$(`strong[data-e2e="share-count"]`).getText(); 
				if (share == "") share = 0;
				textCount[3] = share;


				let mainHref = await browser.$(`#media-card-0 .link-a11y-focus`).getAttribute("href"); 
				//console.log("mainTitle", "https://www.tiktok.com"+mainHref);
				title = await mainHref;
				title = await title.replaceAll("/@","");
				await browser.navigateTo("https://www.tiktok.com"+mainHref);
				await browser.pause(2000+Math.random(1000)); // Waits for 2 seconds



				let trys = 0;
				let searching = true;
				while ( searching && trys < 30){
					await browser.action('wheel').scroll({deltaX: 0, deltaY: Math.round(800+ Math.random()*100) , duration: Math.round(400+ Math.random()*100),
								origin: await browser.$('#main-content-others_homepage') 
				  }).perform();

					const videos = await browser.$$(`div[data-e2e="user-post-item"] a`); 					
					const reelshref = await videos.map(async r=> { return {content: await r.getText(), href:await r.getAttribute('href')}; } );

					const findeVideo= await reelshref.find(r=>r.href.includes(videoId));
					if (findeVideo!=null){
						searching = false;
						views = findeVideo.content.replaceAll("Anclado","");
						
						textCount[3]= views;
					}
					trys++;
						//const reels = await browser.$$(`a[aria-label="Vista previa del ícono de reel"]`); 
				}

				textCount[4] = views;
				
				//document.querySelectorAll('#media-card-0 .link-a11y-focus');

				const handles = await browser.getWindowHandles();
				console.log("handles.length", handles.length);
				if (handles.length > 1) {
					const exit = await browser.closeWindow();
				}
				res({
					title, desc, textCount, srcImg, type, views
				});
			} catch (e) {
				console.error("e", e);
				//this.sessionId = null;
				rej(e)
			};
		});
	}

	readFbPhoto(urlText) {
		console.log("readFbphoto",urlText);
		urlText = urlText.replaceAll("www.facebook.com","m.facebook.com");
		return new Promise(async (res, rej) => {
			let browser = null;
			const type= "fbPhoto"
			try {
				if (this.sessionIdMov == null) {
					browser = await remote({
						hostname: hostDriver, // Or your grid's hostname
						
						port: 4444,
						capabilities: {
							browserName: 'chrome',
							  'goog:chromeOptions': {
										args: [
                '--disable-web-security',
                '--allow-running-insecure-content',
								'--window-size=390,844', 
								'--user-agent=Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36',
										]
								}
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
					this.sessionIdMov = browser.sessionId;
					browser.setCookies(cookies_fb);
				} else
					browser = await attach({
						// For a Selenium Grid or local standalone server
						sessionId: this.sessionIdMov,
						protocol: 'http',
						hostname: hostDriver, // Or your grid's hostname
						port: 4444,
						capabilities: {
							browserName: 'chrome',
							  'goog:chromeOptions': {
										args: [
                '--disable-web-security',
                '--allow-running-insecure-content',
								'--window-size=390,844', 
								'--user-agent=Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36',
										]
								}
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
					
				console.log("browser.sessionId", await browser.sessionId);

				console.log("urlText", urlText);
				const handles0 = await browser.getWindowHandles();
				console.log("handles0.length", handles0.length);

				await browser.navigateTo(urlText)
				const textsDom = await browser.$$(`[data-mcomponent="MContainer"] .native-text`);
				const texts = await textsDom.map(async r=>await r.getText());
				console.log("texts",texts);
				const title = texts[2];//await domTitle.getText();

				let desc = texts[4];
				//if (!domDesc.error) desc = await domDesc.getText();

				const domCount = await browser.$$('[data-mcomponent="ServerTextArea"][role="button"] .native-text');
				const textCount = await domCount.map(async r=>await r.getText()  );
				
				const domImage = await browser.$('[role="presentation"] img');
				const srcImg = await domImage.getAttribute("src");

				const handles = await browser.getWindowHandles();
				console.log("handles.length", handles.length);
				if (handles.length > 1) {
					const exit = await browser.closeWindow();
				}
				res({
					title, desc, textCount, srcImg, type
				});
			} catch (e) {
				console.error("e", e);
				//this.sessionId = null;
				rej(e)
			};
		});
	}

	readFbStory(urlText) {
		
		console.log("readFbStory",urlText);
		return new Promise(async (res, rej) => {
			let browser = null;
			const type= "fbStory"
			try {
				if (this.sessionIdDesk == null) {
					browser = await remote({
					//	protocol: 'http',
						hostname: hostDriver, // Or your grid's hostname
						
						port: 4444,
						capabilities: {
							browserName: 'chrome',
							  'goog:chromeOptions': {
										args: [
												//'--user-data-dir=D:\\Chrome\\User\\Data',
							//					'--user-data-dir=C:\\Users\\Z490X\\AppData\\Local\\Google\\Chrome\\User\ Data',
									//			'--profile-directory=Default',
                //'--user-data-dir=/Users/TuUsuario/Library/Application Support/Google/Chrome/',
                // Nombre de la carpeta del perfil específico (ej. "Default" o "Profile 1")
             //   '--profile-directory=Default',
								'--window-size=1024,800', 
								'--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
                '--disable-web-security',
                '--allow-running-insecure-content'
												//'--user-data-dir="C:\\Users\\Z490X\\AppData\\Local\\Google\\Chrome\\User Data"',
											//	'--user-data-dir="C:\\Users\\Z490X\\AppData\\Local\\Google\\Chrome\\User Data\\Default"',
												//'--profile-directory=Default',
												//'--user-data-dir="C:\\Users\\Z490X\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\ojfebgpkimhlhcblbalbfjblapadhbol\\3.0.5_0"',
												// Optional: specify a specific profile within the directory
												//'--profile-directory=Profile 1' 
										]
								}
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
					this.sessionIdDesk = browser.sessionId;
					browser.setCookies(cookies_fb);
				} else
					browser = await attach({
						// For a Selenium Grid or local standalone server
						sessionId: this.sessionIdDesk,
						protocol: 'http',
						hostname: hostDriver, // Or your grid's hostname
						port: 4444,
						capabilities: {
							browserName: 'chrome',
							  'goog:chromeOptions': {
										args: [
												//'--user-data-dir=D:\\Chrome\\User\\Data',
							//					'--user-data-dir=C:\\Users\\Z490X\\AppData\\Local\\Google\\Chrome\\User\ Data',
									//			'--profile-directory=Default',
                //'--user-data-dir=/Users/TuUsuario/Library/Application Support/Google/Chrome/',
                // Nombre de la carpeta del perfil específico (ej. "Default" o "Profile 1")
               // '--profile-directory=Default',
                '--disable-web-security',
                '--allow-running-insecure-content',
								'--window-size=1024,800', 
								'--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
												//'--user-data-dir="C:\\Users\\Z490X\\AppData\\Local\\Google\\Chrome\\User Data\\Default"',
												//'--user-data-dir="C:\\Users\\Z490X\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\ojfebgpkimhlhcblbalbfjblapadhbol\\3.0.5_0"',
												// Optional: specify a specific profile within the directory
												//'--profile-directory=Profile 1' 
										]
								}
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
					
				console.log("browser.sessionId", await browser.sessionId);

				console.log("urlText", urlText);
				const handles0 = await browser.getWindowHandles();
				console.log("handles0.length", handles0.length);

				await browser.navigateTo(urlText)

				const domTitle = await browser.$('div[role="dialog"] div[data-ad-rendering-role="profile_name"]');
				const title = await domTitle.getText();
				//console.log ("title",title);

				const domDesc = await browser.$('div[role="dialog"]  div[data-ad-rendering-role="story_message"]');
				let desc = "";
				if (!domDesc.error) desc = await domDesc.getText();

				const domCount = await browser.$('div[role="dialog"] span[role="toolbar"]').parentElement().parentElement();
				const countText = await domCount.getText();
				const textCount = await countText.split("\n");
				
				const domImage = await browser.$('div[role="dialog"] a[role="link"] img');
				const srcImg = await domImage.getAttribute("src");

				const handles = await browser.getWindowHandles();
				console.log("handles.length", handles.length);
				if (handles.length > 1) {
					const exit = await browser.closeWindow();
				}
				res({
					title, desc, textCount, srcImg, type
				});
			} catch (e) {
				console.error("e", e);
				//this.sessionId = null;
				rej(e)
			};
		});
	}


	readFbVideoOk(urlText) {
		console.log("readFbVideo",urlText);
		urlText = urlText.replaceAll("www.facebook.com","m.facebook.com");


		let videoId = urlText.match(/videos\/[0-9]{1,50}/g);
		if ( videoId.length == 0) return;
		videoId = videoId[0].replaceAll("videos/","");
		console.log("videoId",videoId);

		return new Promise(async (res, rej) => {
			let browser = null;
			const type= "fbVideo"
			try {
				if (this.sessionIdMov == null) {
					browser = await remote({
						hostname: hostDriver, // Or your grid's hostname
						
						port: 4444,
						capabilities: {
							browserName: 'chrome',
							  'goog:chromeOptions': {
										args: [
                '--disable-web-security',
                '--allow-running-insecure-content',
								'--window-size=390,1024', 
								'--user-agent=Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36',
										]
								}
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
					this.sessionIdMov = browser.sessionId;
					browser.setCookies(cookies_fb);
				} else
					browser = await attach({
						// For a Selenium Grid or local standalone server
						sessionId: this.sessionIdMov,
						protocol: 'http',
						hostname: hostDriver, // Or your grid's hostname
						port: 4444,
						capabilities: {
							browserName: 'chrome',
							  'goog:chromeOptions': {
										args: [
                '--disable-web-security',
                '--allow-running-insecure-content',
								'--window-size=390,844', 
								'--user-agent=Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36',
										]
								}
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
					
				console.log("sessionIdMov browser.sessionId", await browser.sessionId);

				console.log("urlText", urlText);
				const handles0 = await browser.getWindowHandles();
				console.log("handles0.length", handles0.length);

				await browser.navigateTo(urlText)
				const textsDom = await browser.$$(`div.fl.ac span.f3`);
				const aaa = await textsDom.map(async t=> await t.getText());
				//console.log("textsDom a ", aaa.map(a=>a.charCodeAt(0)));
				//const texts = await (await textsDom.filter(async r=>await r.getText()!=null)).filter(async r=>await r.includes(String.fromCharCode(56204)));
				//console.log("texts",await texts);
				//console.log("texts a ",await texts.map(t=>t.getText()));
				//const title = await texts[0].getText();//await domTitle.getText();
				const title = "";
				//let desc = texts[4];
				//if (!domDesc.error) desc = await domDesc.getText();
				let desc = "";
				let views = 0;
				const domCount = await browser.$$('[data-type="container"] div.native-text[dir="auto"]');
				const dd = await domCount.map(async a=>{ return {content:await a.parentElement().parentElement().parentElement().parentElement().getText(),aria: await a.parentElement().parentElement().parentElement().parentElement().getAttribute("aria-label")   } } );
				const nlike = dd.filter(a=> { if (a.aria!=null)  return a.aria.includes("e gusta,"); else false; }  );
				const ncoment = dd.filter(a=> { if (a.aria!=null)  return a.aria.includes("Comentario,"); else false; }  );
				const ncompart = dd.filter(a=> { if (a.aria!=null)  return a.aria.includes("compartido,"); else false; }  );
				console.log("nlike",nlike);
				console.log("ncoment",ncoment);
				console.log("ncompart",ncompart);
				// Array.from(document.querySelectorAll(' [data-type="container"] div.native-text[dir="auto"]')).filter(a=>a.parentNode.parentNode.parentNode.parentNode.ariaLabel?.includes("gusta"));
				
				//const textCount1 = await domCount.map(async r=> { return {content: await r.getText(), aria:await r.getAttribute('aria-label')}; } );				
				//console.log("textCount1",textCount1);
				//const c1 = await textCount1.filter(async a=>await a.aria?.includes("Me gusta"));
				const textCount = [await nlike[0].content.trim(),ncoment[0].content.trim(),ncompart[0].content.trim(),0,0];
				//const domImage = await browser.$('[role="presentation"] img');
				console.log("textCount",textCount);
				const srcImg = "";//await domImage.getAttribute("src");

				const btns = await browser.$$('[style="text-shadow:0.0px 1.0px rgba(0,0,0,0.61960787); color:#ffffff;"]');
				console.log("btns",await btns.map(async p=> await p.getText()));
				const btnTitle = await btns[1];
				await browser.execute((el) => el.click(), btnTitle);

					await browser.pause(2500+Math.random(1000)); 

				const currentUrl = await browser.getUrl();
				console.log("currentUrl",currentUrl);
/*
				let trys = 0;
				let searching = true;
				while ( searching && trys < 30){
					await browser.action('wheel').scroll({deltaX: 0, deltaY: Math.round(800+ Math.random()*100) , duration: Math.round(400+ Math.random()*100),
								//origin: await browser.$('#main-content-others_homepage') 
				  }).perform();
//Array.from(document.querySelectorAll('[data-image-id="1267016617820422125"]')).map(a=>a.parentNode.parentNode.parentNode.textContent);
					const videoElement = await browser.$(`[data-image-id="${videoId}"]`); 					
					if (videoElement.error==undefined){
						const findeVideo = await videoElement.parentElement().parentElement().parentElement().getText();

						searching = false;
						views = findeVideo.trim();
						
						textCount[3]= views;
					}
					trys++;
						//const reels = await browser.$$(`a[aria-label="Vista previa del ícono de reel"]`); 
				}
*/
				textCount[4] = views;




				const handles = await browser.getWindowHandles();
				console.log("handles.length", handles.length);
				if (handles.length > 1) {
					const exit = await browser.closeWindow();
				}
				res({
					title, desc, textCount, srcImg, type, views
				});
			} catch (e) {
				console.error("e", e);
				//this.sessionId = null;
				rej(e)
			};
		});
	}
	
	readFbVideo(urlText) {
		console.log("readFbVideo",urlText);

		let videoId = urlText.match(/videos\/[0-9]{1,50}/g);
		if ( videoId.length == 0) return;
		videoId = videoId[0].replaceAll("videos/","");
		console.log("videoId",videoId);

		return this.readFbReel("http://www.facebook.com/reel/"+videoId);
	}
	readFbWatch(urlText) {
		console.log("readFbWatch",urlText);

		let videoId = urlText.match(/\?v=[0-9]{1,50}/g);
		if ( videoId.length == 0) return;
		videoId = videoId[0].replaceAll("\?v=","");
		console.log("videoId",videoId);

		return this.readFbReel("http://www.facebook.com/reel/"+videoId);
	}
	readFbVideoX(urlText) {
		console.log("readFbVideo",urlText);
		urlText = urlText.replaceAll("www.facebook.com","m.facebook.com");
		return new Promise(async (res, rej) => {
			let browser = null;
			const type= "fbVideo"
			try {
				if (this.sessionIdDesk== null) {
					browser = await remote({
						hostname: hostDriver, // Or your grid's hostname
						
						port: 4444,
						capabilities: {
							browserName: 'chrome',
							  'goog:chromeOptions': {
										args: [
                '--disable-web-security',
                '--allow-running-insecure-content',
									'--window-size=1024,800', 
								'--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
										]
								}
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
					this.sessionIdDesk = browser.sessionId;
					browser.setCookies(cookies_fb);
				} else
					browser = await attach({
						// For a Selenium Grid or local standalone server
						sessionId: this.sessionIdDesk,
						protocol: 'http',
						hostname: hostDriver, // Or your grid's hostname
						port: 4444,
						capabilities: {
							browserName: 'chrome',
							  'goog:chromeOptions': {
										args: [
                '--disable-web-security',
                '--allow-running-insecure-content',
								'--window-size=1024,800', 
								'--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
										]
								}
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
					
				console.log("sessionIdDesk browser.sessionId", await browser.sessionId);

				console.log("urlText", urlText);


				const pivot1 = await browser.$$('[aria-label="Consulta quién reaccionó a esto"]');
				const map = await pivot1.map(async p=> await p.parentElement().parentElement().$("span"));
					console.log("map",map);


				const handles0 = await browser.getWindowHandles();
				console.log("handles0.length", handles0.length);

				await browser.navigateTo(urlText)
				const title="", desc="", textCount=[0,0,0,0,0,0], srcImg="";
				const handles = await browser.getWindowHandles();
				console.log("handles.length", handles.length);
				if (handles.length > 1) {
					const exit = await browser.closeWindow();
				}
				res({
					title, desc, textCount, srcImg, type
				});
			} catch (e) {
				console.error("e", e);
				//this.sessionId = null;
				rej(e)
			};
		});
	}
	redirect(urlText){
		
		return new Promise(async (res, rej) => {
			let browser = null;
			try {
				if (this.sessionIdDesk == null) {
					browser = await remote({
						hostname: hostDriver, 
						port: 4444,
						capabilities: {
							browserName: 'chrome',
							  'goog:chromeOptions': {
										args: [
                '--disable-web-security',
                '--allow-running-insecure-content',
								'--window-size=1024,800', 
								'--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
										]
								}
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
					this.sessionIdDesk = browser.sessionId;
					browser.setCookies(cookies_fb);
				} else
					browser = await attach({
						// For a Selenium Grid or local standalone server
						sessionId: this.sessionIdDesk,
						hostname: hostDriver, // Or your grid's hostname
						port: 4444,
						capabilities: {
							browserName: 'chrome',
							  'goog:chromeOptions': {
										args: [
                '--disable-web-security',
                '--allow-running-insecure-content',
								'--window-size=1024,800', 
								'--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
										]
								}
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
					
				console.log("sessionIdMov browser.sessionId", await browser.sessionId);

				console.log("urlText", urlText);
				await browser.navigateTo(urlText)
				
				await browser.pause(2500+Math.random(1000)); 

				const currentUrl = await browser.getUrl();
				console.log("currentUrl",currentUrl);

				res(this.url(currentUrl));
				}catch(e){
					console.error(e)
					res(urlText)
					};
			});		
	}

	url(urlText) {
		if (urlText.includes("post")) 
			return this.readFbPost(urlText);
		if (urlText.includes("story")) 
			return this.readFbPost(urlText);
		if (urlText.includes("photo")) 
			return this.readFbPhoto(urlText);
		else if (urlText.includes("reel")) 
			return this.readFbReel(urlText);
		else if (urlText.includes("video") && urlText.includes("tiktok")) 
			return this.readTk(urlText);
		else if (urlText.includes("video") && urlText.includes("facebook")) 
			return this.readFbVideo(urlText);
		else if (urlText.includes("watch") && urlText.includes("facebook")) 
			return this.readFbWatch(urlText);
		else if (urlText.includes("share") && urlText.includes("facebook")) 
			return this.redirect(urlText);
		else 
		  return new Promise((r,s)=>{
				r("--","--",[0,0,0,0,0],"","");
			});
	}
}

module.exports = { FBQuery };