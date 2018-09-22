export default class ServerSocket {
    constructor(obj) {
        var {
            server,
            address,
            port
        } = obj;
        this.server = server;
        this.delimiter = '~^!@#';
        this.address = address;
        this.port = port;
        this.buffer = '';
        this.connected = false;
    }
    connect(port, address, callback) {
        var me = this;
        if (me.socket && me.socket.connect) {

            me.socket.connect(me.port || port, me.address || address, function () {

                me.connected = true;
                if (callback) {
                    callback(me);
                }
            });
        }
        else { console.log('no socket to connect') }
    }
    close() {
        var me = this;
        if (me.server && me.server.close) {
            console.log('me.server.close');
            me.server.close();
            me.server.unref();
        }
        if (me.socket && me.socket.destroy) {
            console.log('me.server.destroy');
            me.socket.destroy();
        }
    }
    setServer(server) {
        var me = this;
        me.server = server;
    }

    send(message) {
        var me = this;
        var { socket } = me;
        if (typeof message !== 'string') {
            message = JSON.stringify(message);
        }
        return new Promise((resolve, fail) => {
            socket.write(message + me.delimiter, 'utf8', () => {
                resolve();
            });
        });
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
    received(messages) {
        if (this.onReceived) {

            this.onReceived(messages);
        }
        else {
            console.log('received no handler')
        }
    }
    data(d) {

        this.buffer = this.buffer + (d);
        var chunks = this.buffer.split(this.delimiter);
        if (chunks.length > 1) {
            for (var i = 0; i < chunks.length - 1; i++) {
                this.received(chunks[i]);
            }
            this.buffer = chunks[chunks.length - 1];
        }
    }
}