const { Router } = require('express');
const { remote, attach } = require('webdriverio');

class FBQuery {
	constructor() {

		//this.sessionId = null;
		this.sessionId = "58a879bc471a1a02b5a2cc1337141011";
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
		return new Promise(async (res, rej) => {
			let browser = null;
			const type= "fbPost"
			try {
				if (this.sessionId == null) {
					browser = await remote({
						protocol: 'http',
						hostname: '172.20.50.123', // Or your grid's hostname
						port: 4444,
						capabilities: {
							browserName: 'chrome',
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
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
				console.log("browser.sessionId",browser.sessionId);

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
				if (this.sessionId == null) {
					browser = await remote({
						protocol: 'http',
						hostname: '172.20.50.123', // Or your grid's hostname
						port: 4444,
						capabilities: {
							browserName: 'chrome',
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
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
			
				console.log("browser.sessionId",browser.sessionId);

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
						duration: 200,  // Smoothness of the scroll
//						origin: await $('#mi-contenedor-scroll') // Optional: scroll relative to an element
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

		let videoId = urlText.match(/(?=video\/)*[0-9]{1,50}/g);
		if ( videoId.length == 0) return;
		videoId = videoId[0];
		console.log("videoId",videoId);
		return new Promise(async (res, rej) => {
			let browser = null;
			const type= "tk"

			try {
				if (this.sessionId == null) {
					browser = await remote({
						protocol: 'http',
						hostname: '172.20.50.123', // Or your grid's hostname
						port: 4444,
						capabilities: {
							browserName: 'chrome',
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
						},
						logLevel: 'error', // 'trace', 'debug', 'info', 'warn', 'error'
					});
			
				console.log("browser.sessionId",browser.sessionId);

				console.log("urlText", urlText);
				const handles0 = await browser.getWindowHandles();
				console.log("handles0.length", handles0.length);

				await browser.navigateTo(urlText)
				const title ="";
				let desc ="";
				let views = "";
				const srcImg ="";
				let textCount = [0,0,0,0,0,0];

				await browser.pause(3500+Math.random(2000)); // Waits for 2 seconds

				 desc = await browser.$(`span[data-e2e="desc-span-0_-1"]`).getText();


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


	url(urlText) {
		if (urlText.includes("post")) 
			return this.readFbPost(urlText);
		else if (urlText.includes("reel")) 
			return this.readFbReel(urlText);
		else if (urlText.includes("video") && urlText.includes("tiktok")) 
			return this.readTk(urlText);
		else 
		  return Promise((r,s)=>{
				r();
			});
	}
}

module.exports = { FBQuery };