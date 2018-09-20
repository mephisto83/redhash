import assert from 'assert';
import NodeServer from './nodeserver';
import * as NS from './nodeserver';
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

        var serverSocket = _server.createServer('192.168.1.115', 1323, () => {
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

        _server2.createServer('192.168.1.115', 1423 + c);
        var serverSocket = _server.connectSocket('192.168.1.115', 1423 + c, (res) => {
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

        _server.createServer(address[0].iface.address, port, res => {
            console.log('created server')

        });
        
        _server2.connectSocket(address[0].iface.address, port, res => {
            console.log('connected to socket')
            _server.send(address[0].iface.address, port, { sending: 'a message' });
        });
    });
});