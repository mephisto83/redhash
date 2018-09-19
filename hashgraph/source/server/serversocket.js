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
        this.connected = false;
    }
    connect(port, address, callback) {
        var me = this;
        if (me.socket && me.socket.connect) {
            me.socket.connect(me.port || port, me.address || address, function () {
                console.log('Connected');
                me.connected = true;
                if (callback) {
                    callback(me);
                }
            });
        }
    }
    close() {
        var me = this;
        if (me.server && me.server.close) {
            me.server.close();
        }
        if (me.socket && me.socket.destroy) {
            me.socket.destroy();
        }
    }
    setServer(server) {
        var me = this;
        me.server = server;
    }
    setSocket(socket) {
        var me = this;
        me.socket = socket;
        var serverSocket = this;
        if (serverSocket instanceof ServerSocket) {
            socket.on('close', function (hadError) {
                serverSocket.connected = false;
                serverSocket.closed(hadError);
            });

            socket.on('data', function (res) {
                serverSocket.data(res);
            });

            socket.on('end', function (res) {
                serverSocket.connected = false;
                serverSocket.end(res);

            });

            socket.on('ready', function (res) {
                serverSocket.ready(res);
            });

            socket.on('timeout', function (res) {
                serverSocket.connected = false;
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