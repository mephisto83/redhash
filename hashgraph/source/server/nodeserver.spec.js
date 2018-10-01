import assert from 'assert';
import NodeServer from './nodeserver';
import * as NS from './nodeserver';
import RedHashController from './redhashcontroller';
let http = require('http');
describe('Node Server', function () {
    it('can get ip address', () => {
        var address = NodeServer.getIpAddress();
        console.log(address);
        assert.ok(address);
        console.log(address.filter(t => t.iface && t.iface.address.startsWith('192')))
    });

    it('can get and ip address starting with ', () => {
        var address = NodeServer.getIpAddress('192');
        console.log(address);
        assert.ok(address);
        assert.ok(address.length === 1)
    })

    it('can create and listen to the listen event', (done) => {
        var server = NodeServer.createServer();
        var called = 0;
        server.addListener(NS.LISTENING, (t) => {
            called++;
            console.log(t);
            console.log(called);
            console.log(server.serverCount);
            if (called === server.serverCount) {
                server.close();
                done();
            }
        })
    });

    it('can create socket server ', (done) => {
        var _server = NodeServer.createServer(null, true);
        var c = 0;
        var address = NodeServer.getIpAddress('192');

        var serverSocket = _server.createServer(address[0].address, 6323, () => {
            _server.close();

        });
        assert.ok(serverSocket);
        _server.close();
        serverSocket.close();
        done();
    });



    it('can listen to a socket', (done) => {

        var _server = NodeServer.createServer(null, true);
        var _server2 = NodeServer.createServer(null, true);
        var c = 0;
        var address = NodeServer.getIpAddress('192');


        _server2.createServer(address[0].address, 1423 + c);
        var serverSocket = _server.connectSocket(address[0].address, 1423 + c, (res) => {
            _server2.close();
            _server.close();
            done();
        });
        assert.ok(serverSocket);
    });

    it('can send messages over a socket', (done) => {
        var address = NodeServer.getIpAddress('192');

        var _server2 = NodeServer.createServer(null, true);
        var _server = NodeServer.createServer(null, true);
        var received = false;
        var onReceived = ((address, port, message) => {
            received = message;
            console.log(address)
            console.log(port);
            assert.ok(received);
            console.log(message);
            _server.close();
            _server2.close();
            done();
        });
        _server.onReceived = onReceived;
        _server2.onReceived = onReceived;
        console.log(address);
        var port = 1243;

        _server.createServer(address[0].iface.address, port, res => {
            console.log('created server')

        });
        var serverSocket = _server2.connectSocket(address[0].iface.address, port, res => {
            console.log('connected to socket')
            serverSocket.send({ sending: 'a message' });
        });
    });

    it('can send messages over a socket 2', (done) => {
        var address = NodeServer.getIpAddress('192');

        var _server2 = NodeServer.createServer(null, true);
        var _server = NodeServer.createServer(null, true);
        var received = false;
        var onReceived = ((address, port, message) => {
            received = message;
            console.log(address)
            console.log(port);
            assert.ok(received);
            console.log(message);
            _server.close();
            _server2.close();
            done();
        });
        _server.onReceived = onReceived;
        _server2.onReceived = onReceived;
        console.log(address);
        var port = 1243;

        _server.createServer(address[0].iface.address, port, res => {
            console.log('created server')

        });
        var serverSocket = _server2.connectSocket(address[0].iface.address, port, res => {
            console.log('connected to socket')
            _server2.send(address[0].iface.address, port, { sending: 'a message' });
        });
    });

    it('can send messages over a socket 3', (done) => {
        var address = NodeServer.getIpAddress('192');

        var _server2 = NodeServer.createServer(null, true);
        var _server = NodeServer.createServer(null, true);
        var received = false;
        var onReceived = ((address, port, message) => {
            received = message;
            console.log(address)
            console.log(port);
            assert.ok(received);
            console.log(message);
            _server.close();
            _server2.close();
            done();
        });
        _server.onReceived = onReceived;
        _server2.onReceived = onReceived;
        console.log(address);
        var port = 1244;

        var p = new Promise((resolve) => {

            _server.createServer(address[0].iface.address, port, res => {
                console.log('created server')
                resolve();
            });
        })
        var p2 = new Promise((resolve) => {
            _server2.connectSocket(address[0].iface.address, port, res => {
                console.log('connected to socket')

                resolve();
            });
        });
        Promise.all([p, p2]).then(() => {
            _server.send(address[0].iface.address, port, { sending: 'a message' });
        })
    });


    it('can use a child process to excute everything', (done) => {
        var address = NodeServer.getIpAddress('192');

        var _server2 = NodeServer.proxyServer();
        var _server = NodeServer.createServer(null, true);
        var received = false;
        var onReceived = ((address, port, message) => {
            received = message;
            console.log(address)
            console.log(port);
            assert.ok(received);
            console.log(message);
            _server.close();
            _server2.close();
            done();
        });
        _server.onReceived = onReceived;
        _server2.onReceived = onReceived;
        console.log(address);
        var port = 1243;

        _server.createServer(address[0].iface.address, port, res => {
            console.log('created server')

        });

        _server2.connectSocket(address[0].iface.address, port, res => {
            console.log('connected to socket')
            _server2.send(address[0].iface.address, port, { sending: 'a message' });
        });
    });

    it('can use a child process to excute everything 2', (done) => {
        var address = NodeServer.getIpAddress('192');

        var _server2 = NodeServer.createServer(null, true);
        var _server = NodeServer.proxyServer();
        var received = false;
        var onReceived = ((address, port, message) => {
            received = message;
            console.log(address)
            console.log(port);
            assert.ok(received);
            console.log(message);
            _server.close();
            _server2.close();
            done();
        });
        _server.onReceived = onReceived;
        _server2.onReceived = onReceived;
        console.log(address);
        var port = 1243;

        _server.createServer(address[0].iface.address, port, res => {
            console.log('created server')

        });

        _server2.connectSocket(address[0].iface.address, port, res => {
            console.log('connected to socket')
            _server2.send(address[0].iface.address, port, { sending: 'a message' });
        });
    });

    it('can create server', () => {
        var address = NodeServer.getIpAddress('192');
        var server = NodeServer.createHttpServer({
            address: address.address,
            port: 9142
        });

        assert.ok(server);

        server.close();
    });

    it('can accept a call', (done) => {
        var address = NodeServer.getIpAddress('192')[0];
        var port = 8812;
        console.log(address);
        var server = NodeServer.createHttpServer({
            address: address.address,
            port: port
        }, () => {
            console.log('listening')
            const postData = JSON.stringify({
                'msg': 'Hello World!'
            });

            const options = {
                hostname: address.address,
                port: port,
                path: '',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = http.request(options, (res) => {
                console.log(`STATUS: ${res.statusCode}`);
                console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    console.log(`BODY: ${chunk}`);
                });
                res.on('end', () => {
                    console.log('No more data in response.');
                    server.close();
                    done();
                });
            });

            req.on('error', (e) => {
                console.error(`problem with request: ${e.message}`);
            });

            // write data to request body
            req.write(postData);
            req.end();
        });

        assert.ok(server);

        // server.close();
    });

    it('can add a handler', (done) => {
        var address = NodeServer.getIpAddress('192')[0];
        var port = 8814;
        var handled = false;
        console.log(address);
        var path = '/get/lines';
        var server = NodeServer.createHttpServer({
            address: address.address,
            port: port
        }, () => {
            server.addHandler((headers, method, url) => {
                console.log('check handler')
                if (method === 'POST' && url === path) {
                    return true;
                }
                return false;
            }, () => {
                handled = true;
            });

            console.log('listening')
            const postData = JSON.stringify({
                'msg': 'Hello World!'
            });

            const options = {
                hostname: address.address,
                port: port,
                path: path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = http.request(options, (res) => {
                console.log(`STATUS: ${res.statusCode}`);
                console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    console.log(`BODY: ${chunk}`);
                });
                res.on('end', () => {
                    console.log('No more data in response.');
                    server.close();
                    assert.ok(handled);
                    done();
                });
            });

            req.on('error', (e) => {
                console.error(`problem with request: ${e.message}`);
            });

            // write data to request body
            req.write(postData);
            req.end();
        });

        assert.ok(server);

        // server.close();
    });


    it('add redhash controller', () => {
        var address = NodeServer.getIpAddress('192')[0];
        var server = NodeServer.createHttpServer({
            address: address.address,
            port: 14812
        });

        server.addController(new RedHashController());
        server.close();
    })

    it('can use a child process to excute everything 3', (done) => {
        var address = NodeServer.getIpAddress('192');

        var _server2 = NodeServer.proxyServer();
        var _server = NodeServer.proxyServer();
        var received = false;
        var onReceived = ((address, port, message) => {
            received = message;
            console.log(address)
            console.log(port);
            assert.ok(received);
            console.log(message);
            done();
        });
        var r1;
        var r2;
        var p1 = new Promise((resolve) => {
            r1 = resolve;
        });

        var p2 = new Promise((resolve) => {
            r2 = resolve;
        });

        _server.onReceived = (address, port, message) => {
            received = message;
            console.log(address)
            console.log(port);
            assert.ok(received);
            console.log(message);
            r1();
            // _server.close();
            // _server2.close();
            // done();
        };
        _server2.onReceived = (address, port, message) => {
            received = message;
            console.log(address)
            console.log(port);
            assert.ok(received);
            console.log(message);
            r2();
            // _server.close();
            // _server2.close();
            // done();
        };;

        Promise.all([r1, r2]).then(() => {

            _server.close();
            _server2.close();
            done();
        });
        console.log(address);
        var port = 1243;

        _server.createServer(address[0].iface.address, port, res => {
            console.log('created server')

        });

        _server2.connectSocket(address[0].iface.address, port, res => {
            console.log('connected to socket')
            _server2.send(address[0].iface.address, port, { sending: 'a message' });

            _server.send(address[0].iface.address, port, { sending: 'a message' });
        });
    });
});