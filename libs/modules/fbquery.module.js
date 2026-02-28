const { Router } = require('express');
const { remote, attach } = require('webdriverio');

class FBQuery {
	constructor(){
		
		this.sessionId=null;
	}
	url(urlText) {
		return new Promise(async (res, rej) => {
				let browser = null;
				
			try {
				if (this.sessionId==null){
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
				}else					
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

				
				console.log("urlText",urlText);
				const handles0 = await browser.getWindowHandles();
				console.log("handles0.length",handles0.length);
				
				await browser.navigateTo(urlText)
				const domTitle = await browser.$('div[data-ad-rendering-role="profile_name"]');
				const title = await domTitle.getText();
				//console.log ("title",title);

				const domDesc = await browser.$('div[data-ad-rendering-role="story_message"]');
				const desc = await domDesc.getText();
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
				console.log("handles.length",handles.length);
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
				console.error("e",e);
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
}

/*
const fb = new FbQuery();
fb.url("https://www.facebook.com/story.php?story_fbid=pfbid0HcAg3z8pUChw3ocgUhTb21PdatPaa4TsK3f4NbvXYFztfYhXYU7HpjbQkiNL1ERPl&id=100066632755299&mibextid=ZbWKwL&_rdr").then( (res) => {
	console.log("---------res", res);
}).catch((e) => {
	console.error("---------err", e);
});
*/
module.exports = {FBQuery};