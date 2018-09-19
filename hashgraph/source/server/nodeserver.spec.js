import assert from 'assert';
import NodeServer from './nodeserver';
import * as NS from './nodeserver';
describe('Node Server', function () {
    it('can get ip address', () => {
        var address = NodeServer.getIpAddress();
        console.log(address);
        assert.ok(address);
    });


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
});