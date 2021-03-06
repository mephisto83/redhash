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
            onConnect,
            onListen,
            error,
            connect,
            port,
            proxy,
            child
        } = obj;
        var me = this;
        this.connected = false;
        this.onListen = onListen;
        this.buffer = '';
        this.delimiter = '~^!@#';
        this.sendResponse = {};
        this.promises = {};
        if (child) {
            return;
        }

        this.proxy = proxy;
        this.address = address;
        this.port = port;
        this.onReceived = onReceived;
        if (this.proxy) {
            console.log('is using a child proxy')
            return;
        }

        if (connect) {
            var socket = new net.Socket();
            this.setSocket(socket);
            this.connect(port, address, onConnect, error);
        }
        if (asServer) {
            console.log('build server')
            var server = net.createServer(function (socket) {
                console.log('---------------- create server -----------------')
                me.setSocket(socket);
                if (callback) {
                    callback();
                }
                console.log('on connected');
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
        var guid = GUID();
        return new Promise((resolve, fail) => {

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
                switch (m.func) {
                    case 'setupChildProxy':
                        if (m.guid === guid)
                            resolve();
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
                    case 'listening':
                        if (callback) {
                            callback(m.func);
                            callback = null;
                        }
                        break;
                    default:
                        if (m.guid) {
                            if (me.promises && me.promises[m.guid]) {
                                me.promises[m.guid].resolve();
                                delete me.promises[m.guid];
                            }
                        }
                        break;
                }
            });

            n.send({
                guid,
                setupChildProxy: {
                    ...obj,
                    proxy: false,
                    onReceived: null,
                    proxyChild: true
                }
            });
            this.childProxy = n;
        });
    }
    startListen() {
        var me = this;
        return new Promise((resolve, fail) => {
            if (me.childProxy) {
                var guid = GUID();
                me.promises[guid] = { resolve, fail };
                me.childProxy.send({ listen: 'listen', guid })
            }
            else {
                me.listen();
                resolve();
                if (me.onListen) {
                    me.onListen();
                }
            }
        });
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
    connect(port, address, callback, error) {
        var me = this;
        console.log('connecting ---- -')
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
        else {
            if (error) {
                error();
            }
            console.log('no socket to connect')
        }
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
            me.childProxy.send({ kill: true }, () => {
                me.childProxy.kill();
            });

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
            if (socket) {
                socket.write(message + me.delimiter, 'utf8', () => {
                    resolve();
                });
            }
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