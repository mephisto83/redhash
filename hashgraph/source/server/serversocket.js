import { GUID } from '../util';

let http = require('http');
var net = require('net');
export default class ServerSocket {
    constructor(obj) {
        var {
            server,
            address,
            callback,
            asServer,
            startServer,
            onReceived,
            connect,
            port,
            proxy,
            child
        } = obj;
        var me = this;
        this.connected = false;
        this.buffer = '';
        this.delimiter = '~^!@#';
        this.sendResponse = {};

        if (child) {
            return;
        }

        this.proxy = proxy;
        this.address = address;
        this.port = port;
        this.onReceived = onReceived;
        if (this.proxy) {
            console.log('is using a child proxy')
            this.childProxy = this.setupProxy(obj);
            return;
        }
        if (connect) {
            var socket = new net.Socket();
            this.setSocket(socket);
            this.connect(port, address, callback);
        }
        if (asServer) {
            console.log('build server')
            var server = net.createServer(function (socket) {
                console.log('---------------- create server -----------------')
                me.setSocket(socket);
                if (callback) {
                    callback();
                }
            });
            me.setServer(server);
            this.server = server;
            if (startServer) {
                this.listen();
            }
        }
        else {
            this.server = server;
        }
    }
    setupProxy(obj) {
        const cp = require('child_process');
        var me = this;
        const n = cp.fork(`${__dirname}/serverchild.js`);
        var {
            server,
            address,
            callback,
            asServer,
            startServer,
            onReceived,
            connect,
            port,
            proxy
        } = obj;

        n.on('message', (m) => {
            console.log('PARENT got message:', m);
            switch (m.func) {
                case 'setupChildProxy':
                    if (callback) {
                        callback();
                    }
                    break;
                case 'send':
                    if (me.sendResponse && me.sendResponse[m.id]) {
                        me.sendResponse[m.id]();
                        delete me.sendResponse[m.id];
                    }
                    break;
                case 'onReceived':
                    me.received(m.message);
                    break;
            }
        });

        n.send({
            setupChildProxy: {
                ...obj,
                proxy: false,
                onReceived: null,
                proxyChild: true
            }
        });

        return n;
    }
    setupChildProxy(obj) {
        var {
            server,
            address,
            callback,
            asServer,
            startServer,
            connect,
            port,
            proxy
        } = obj;

        var me = this;
        this.proxy = proxy;
        this.address = address;
        this.port = port;
        this.onReceived = onReceived;
        this.connected = false;

        if (connect) {
            var socket = new net.Socket();
            this.setSocket(socket);
            this.connect(port, address, callback);
        }
        if (asServer) {
            console.log('build server')
            var server = net.createServer(function (socket) {
                console.log('---------------- create server -----------------')
                me.setSocket(socket);
                if (callback) {
                    callback();
                }
            });
            me.setServer(server);
            this.server = server;
            if (startServer) {
                this.listen();
            }
        }
        else {
            this.server = server;
        }
    }
    listen() {
        var me = this;
        this.server.listen(this.port, this.address);
    }
    connect(port, address, callback) {
        var me = this;
        if (me.socket && me.socket.connect) {

            me.socket.connect(me.port || port, me.address || address, function () {

                me.connected = true;
                if (me.childProxy) {
                    me.childProxy.send({ id: GUID() }, () => {
                    });
                }
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

        if (this.childProxy) {
            this.childProxy.kill();
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
        if (this.childProxy) {
            return new Promise(resolve => {
                var id = GUID();
                me.childProxy.send({ send: message, id }, () => {
                    me.sendResponse[id] = resolve;
                });
            });
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
            console.log('server socket received');
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