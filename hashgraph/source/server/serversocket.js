export default class ServerSocket {
    constructor(obj) {
        var {
            server,
            address,
            port
        } = obj;
        this.server = server;
        this.address = address;
        this.port = port;
        this.buffer = [];
    }
    setSocket(socket) {
        this.socket = socket;
        var serverSocket = this;
        if (serverSocket instanceof ServerSocket) {
            socket.on('close', function (hadError) {
                serverSocket.closed(hadError);
            });

            socket.on('data', function (res) {
                serverSocket.data(res);
            });
            
            socket.on('end', function (res) {
                serverSocket.end(res);
            });
            
            socket.on('ready', function (res) {
                serverSocket.ready(res);
            });

            socket.on('timeout', function (res) {
                serverSocket.timeout(res);
            });

            socket.on('error', function (res) {
                serverSocket.error(res);
            });

            socket.on('drain', function () {
                serverSocket.drain();

            });
        }
    }
    timeout() { }
    ready() { }
    error() { }
    end() { }
    drain() { }
    closed(hadError) {
        this.closed = true;
        this.closedWithError = hadError;
    }
    data(d) {
        this.buffer.push(d);
    }
}