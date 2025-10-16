const tesseract = require ("node-tesseract-ocr");
module.exports = class AdbOcr{
    constructor(){
        this.tasks = [];
        this.isRunning = false;
    }
    readFromBuffer(bufferImg){
        const me = this;
        const promiseCallback = (resolve, reject)=>{        
            const task = (cb) => {
                    tesseract.recognize(bufferImg, {							
                        lang: "eng",
                        oem: 1,
                        psm: 3,
                        //tessedit_char_whitelist: "0123456789X",
                    })
                    .then((text) => {
                        resolve(text);
                        cb();
                    })
                    .catch((error) => {
                        console.error("[reader]error:", error)
                        reject('');
                        cb();
                    })
            };
            me.tasks.push(task);
            me.run();
        };
        return new Promise(promiseCallback);
    }
    readFromPath(pathImage){
        const me = this;
        const promiseCallback = (resolve, reject)=>{        
            const task = (cb) => {
                    tesseract.recognize(pathImage, {							
                        lang: "eng",
                        oem: 1,
                        psm: 3,
                        //tessedit_char_whitelist: "0123456789X",
                    })
                    .then((text) => {
                        resolve(text);
                        cb();
                    })
                    .catch((error) => {
                        console.error("[reader]error:", error)
                        reject('');
                        cb();
                    })
            };
            me.tasks.push(task);
            me.run();
        };
        return new Promise(promiseCallback);
    }
    run(){
        const me = this;
        if(!me.isRunning){    
            me.isRunning = true;        
            let taskIndex = 0;
            let execute = ()=>{
                console.log("AdbOcr run execute taskIndex:",taskIndex);
                if (taskIndex>=me.tasks.length) { 
                    me.isRunning = false;
                    me.tasks=[];
                    return; }
                me.tasks[taskIndex]( ()=>{ 
                    taskIndex++; 
                    execute(); }); }
            execute();
        }
    }    
}
