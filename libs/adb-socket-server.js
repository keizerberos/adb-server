const  { createServer } = require ("http");
const  { Server } = require("socket.io");
let Log = null;
class AdbSocketServer{
    constructor(Log){                
        Log = Log;
        const httpServer = createServer();
        const io = new Server(httpServer, {            
        });

        io.on("connection", (socket) => {
            
        });

        httpServer.listen(7000,()=>{            
            Log.i("Server connected");
        });
    }
}
module.exports = {AdbSocketServer};