import assert from 'assert';
import NodeServer from './nodeserver';
import * as NS from './nodeserver';
import RedHashController from './redhashcontroller';
import * as RDH from './redhashcontroller';
let http = require('http');
describe('Node Server', function () {
    it('can red hash controller', () => {
        var controller = new RedHashController();
    });

    it('can set lines ', () => {
        var controller = new RedHashController();

        controller.setLines([{ id: 'line' }]);

        var lines = controller._getLines();
        assert.ok(lines);
        assert.ok(lines.length === 1);
    });

    it('can get add address book', () => {
        var controller = new RedHashController();
        var address = NodeServer.getIpAddress('127')[0];
        controller.addAddress({
            id: 'me',
            addresses: [{
                url: address.address,
                port: 9419
            }]
        });
        var addresses = controller._getAddresses();
        assert.ok(addresses);
        assert.ok(addresses.length === 1);

    });


    it('can get and add address book', () => {
        var controller = new RedHashController();
        var address = NodeServer.getIpAddress('127')[0];
        controller.addAddress({
            id: 'me',
            addresses: [{
                url: address.address,
                port: 9419
            }]
        });
        var addresses = controller._getAddress('me');
        assert.ok(addresses);
        assert.ok(addresses.id === 'me');
    });

    it('can get address book', () => {
        var controller = new RedHashController();
        var address = NodeServer.getIpAddress('127')[0];
        controller.addAddress({
            id: 'me',
            addresses: [{
                url: address.address,
                port: 9419
            }]
        });

        var addresses = controller._getAddressBook();
        assert.ok(addresses);
        assert.ok(addresses.length === 1, 'wrong number of address');
    })

    it('can create new endpoint for connecting', () => {
        var controller = new RedHashController();
        var address = NodeServer.getIpAddress('127')[0];

        controller._requestConnection({
            id: 'you',
            address: address.address,
            port: 14814,
            line: 'line'
        });

        assert.ok(controller.pendingRequests);
        assert.ok(controller.pendingRequests.filter(t => RDH.CONNECT_END_POINT).length === 1);
    });

}); 