let http = require('http');
var net = require('net');

var server = {};
function setupChildProxy(obj) {
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
    this.delimiter = '~^!@#';
    this.buffer = '';
    var me = this;
    this.proxy = proxy;
    this.address = address;
    this.port = port;
    this.connected = false;
    this.connect = _connect.bind(this);
    this.send = send.bind(this);
    this.drain = drain.bind(this);
    this.closed = closed.bind(this);
    this.end = end.bind(this);
    this.error = error.bind(this);
    this.ready = ready.bind(this);
    this.data = data.bind(this);
    this.timeout = timeout.bind(this);
    this.setSocket = setSocket.bind(this);
    this.received = received.bind(this);
    this.listen = listen.bind(this);
    console.log('server child');
    if (connect) {
        var socket = new net.Socket();
        this.socket = (socket);
        this.connect(port, address, callback);
        this.setSocket(this.socket);
    }
    if (asServer) {
        console.log('build server');
        var server = net.createServer(function (socket) {
            console.log('---------------- create server -----------------')
            me.setSocket(socket);
            if (callback) {
                callback();
            }
        });
        this.server = server;
        if (startServer) {
            this.listen();
        }
    }
    else {
        this.server = server;
    }



    function send(message) {
        var me = this;
        var { socket } = me;
        if (typeof message !== 'string') {
            message = JSON.stringify(message);
        }

        return new Promise((resolve, fail) => {
            console.log('sending message from server child');
            socket.write(message + me.delimiter, 'utf8', () => {
                resolve();
                console.log('sent message from server child');
            });
        });
    }
    function received(messages) {
        console.log('--received--')
        if (this.onReceived) {
            this.onReceived(messages);
        }
        else {
            console.log('received no handler')
        }
    }
    function data(d) {
        console.log('# data #')
        this.buffer = this.buffer + (d);
        var chunks = this.buffer.split(this.delimiter);
        if (chunks.length > 1) {
            for (var i = 0; i < chunks.length - 1; i++) {
                this.received(chunks[i]);
            }
            this.buffer = chunks[chunks.length - 1];
        }
    }

    function setSocket(socket) {
        var me = this;
        me.socket = socket;
        var serverSocket = this;
        if (serverSocket) {
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

}

function timeout() {
    console.log('child is timeout');
}

function ready() {

    console.log('child is ready');
}

function error() {
    console.log('child is erred');
}


function end() {
    console.log('child is ended');
}

function drain() {
    console.log('child is drained');
}

function closed(hadError) {
    this.closed = true;
    this.closedWithError = hadError;

    console.log('child is closed');
}


function listen() {
    var me = this;
    this.server.listen(this.port, this.address);
    console.log('child is listening');
}

function _connect(port, address, callback) {
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

process.on('message', (m) => {
    console.log('CHILD got message:', m);
    if (m) {
        Object.keys(m).filter(t => t !== 'id').map(t => {
            switch (t) {
                case 'setupChildProxy':
                    setupChildProxy.bind(server)({
                        ...m[t], callback: () => {
                            console.log('child proxy setup')
                            process.send({ func: t })
                        }
                    });
                    setupServerSocket(server);
                    break
                case 'send':
                    return server.send(m[t]).then(res => {
                        process.send({ func: t, id: m.id })
                    })
                    break;
                default:
                    if (server[t])
                        server[t](m[t]);
                    break;
            }
        });
    }
});

// process.send({ foo: 'bar' });

function setupServerSocket(server) {
    server.onReceived = (m) => {
        process.send({ func: 'onReceived', message: m })
    }
}