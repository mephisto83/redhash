// var assert = require('assert');
// var distpath = '../distribution';
// var HashGraph = require(`${distpath}/index`).default;
// var HashThread = require(`${distpath}/hashthread`).default;
// var HashThreadConst = require(`${distpath}/hashthread`);
// var HashEvent = require(`${distpath}/hashevent`).default;
// var HashMeta = require(`${distpath}/hashmeta`).default;
// var TestMessageService = require(`${distpath}/testmessageservice`).default;
import assert from 'assert';
import HashGraph from './index';
import HashThread from './hashthread';
import * as HashThreadConst from './hashthread';
import HashEvent from './hashevent';
import HashMeta from './hashmeta';
import HashLine from './hashline';
import TestMessageService from './testmessageservice';

describe('Array', function () {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});

describe('HashGraph', function () {
  describe('hashgraph instance', function () {
    it('should create a hashgraph', function () {
      var hashgraph = new HashGraph();
      assert.ok(hashgraph);
    });
    it('should add a hashthread', function () {
      var hashgraph = new HashGraph();
      hashgraph.createLine('name', 'self');

      assert.ok(hashgraph.lines.length);
    });
  });
  describe('hash graph send and receive messages', function () {
    it('assign a message service type', () => {
      var hashgraph = new HashGraph();
      hashgraph.setMessageServiceType(function (id) { return new TestMessageService(id) });
      assert.ok(hashgraph.messageServiceType);
    });

    it('it can create a message service instance, with an id', () => {
      var hashgraph = new HashGraph();
      hashgraph.setMessageServiceType(function (id) {
        return new TestMessageService(id)
      });
      hashgraph.createMessageService();
      assert.ok(hashgraph.messageService)
    });

    it('can create a hashline', () => {
      var hashgraph = new HashGraph();
      hashgraph.createLine('name', 'self');
    });
    it('can get a line by name ', () => {
      var hashgraph = new HashGraph();
      var line = hashgraph.createLine('name','self').getLine('name');
      assert.ok(line);
    })
  });
});
var person = 'person';
var otherperson = 'otherperson';
var self = 'self';

describe('HashEvent', function () {
  describe('hashevent instance', function () {
    it('should create a hashevent instance', function () {
      var hashevent = new HashEvent('message');
      assert.ok(hashevent);
      assert.ok(hashevent.id);
      assert.ok(hashevent.history);
      assert.ok(hashevent.message === 'message', 'message is not message')
    });
  })
});

describe('HashMeta', function () {
  describe('hashmeta', function () {

    it('creates an array of 32-bit integers to contain all the information about the events known state', function () {
      var res = HashMeta.create(2);
      assert.ok(res.length === 1, 'should have been 1 number');
    });

    it('should create enough space for 32 contributors', function () {
      var res = HashMeta.create(32);
      assert.ok(res.length === 32, 'should have been 32  number');
    });

    it('should create enough space for 32 contributors', function () {
      var res = HashMeta.create(100);
      assert.ok(res.length === 313, `'should have been ${res.length}  number'`);
    });

    it('should set the bit correctly', () => {
      var res = HashMeta.create(2);
      var updated = HashMeta.set(res, 0, 0, 1, 2);
      assert.ok(updated);
      assert.ok(updated[0].toString(2) === '1');
    });

    it('should get a row from a hash', () => {

      var res = HashMeta.create(2);
      res = HashMeta.set(res, 0, 1, 1, 2);
      res = HashMeta.set(res, 1, 1, 1, 2);
      var row = HashMeta.row(res, 1, 2);
      assert.ok(row.length === 2, `the row should be 2 long instead of ${row}`);
      assert.ok(row[0] === 1);
      assert.ok(row[1] === 1);
    });

    it('should or a row', () => {
      var res = HashMeta.create(2);
      res = HashMeta.set(res, 1, 1, 1, 2);
      /*
         0 0
         0 1
        ----- [or]
         0 1
         0 1

         = 1010 => 10

         001110
         000100 [or]
         001110

         101110
         000100 [xor]
         101010
      */
      var result = HashMeta.rowOr(res, 0, 1, 2);
      assert.ok(result[0] === 10, `' it should be 10 and not ${result[0]}`);
    });

    it('should merge a meta message', () => {
      var res = HashMeta.create(2);
      assert.ok(res[0] === 0, 'should be equal to 1');
      //Person's meta
      var pMeta = HashMeta.set(res, 0, 0, 1, 2);
      assert.ok(pMeta[0] === 1, 'should be equal to 1');

      //Self's meta 
      var sMeta = HashMeta.set(res, 1, 1, 1, 2);
      assert.ok(sMeta[0] === 8, 'should be equal to 8');

      var psMeta = HashMeta.or(pMeta, sMeta);
      assert.ok(psMeta[0] === 9, 'should be equal to 9');

    })

    it('should set the bit correctly', () => {
      var res = HashMeta.create(2);
      var updated = HashMeta.set(res, 1, 1, 1, 2);
      assert.ok(updated);
      assert.ok(updated[0].toString(2) === '1000');
    });

    it('should set the bit correctly', () => {
      var res = HashMeta.create(2);
      var updated = HashMeta.set(res, 1, 1, 1, 3);
      assert.ok(updated);
      assert.ok(updated[0].toString(2) === '10000');
    });

    it('should set the bit correctly', () => {
      var res = HashMeta.create(2);
      var updated = HashMeta.set(res, 1, 0, 1, 3);
      assert.ok(updated);
      assert.ok(updated[0].toString(2) === '10');
    });

    it('can duplicate', () => {
      var res = HashMeta.create(2);
      var updated = HashMeta.set(res, 1, 0, 1, 3);
      var duplicate = HashMeta.copy(updated);
      assert.ok(duplicate);
    });

    it('should set the large bit correctly', () => {
      var updated = HashMeta.create(10);
      updated = HashMeta.set(updated, 1, 3, 1, 10);
      updated = HashMeta.set(updated, 2, 3, 1, 10);

      assert.ok(updated.filter((t, i) => t === [-2147483648, 1, 0, 0][i]))
      assert.ok(updated);
      // HashMeta.print(updated, 10);
    });
  })
});


describe('Messaging Harness', function () {

  describe('use test message service', () => {
    beforeEach(() => {
      TestMessageService.clear();
    });


    it('can create test message service', (done) => {
      var tms = new TestMessageService('1');
      var tms2 = new TestMessageService('2');
      let called = false;
      let notcalled = false;
      let sentmessagesuccessfully = false;
      tms.send('message', '2').then(res => {
        console.log('sent message successfully');
        sentmessagesuccessfully = true;
      }).catch(e => {
        assert(false, 'send failed during promise')
      }).then(() => {
        assert(sentmessagesuccessfully, 'failed to send message');
        done();
      });
      tms2.onmessage(function (msg, from, to) {
        called = true;
        assert(from === '1', 'message came from wrong person');
      });
      TestMessageService.globalStep();
      assert(called, 'tm2 didnt receive a message');
      assert(!notcalled, 'something failed in the service');
    });

    it('can create test message service and send and receive messages', (done) => {
      var tms = new TestMessageService('1');
      var tms2 = new TestMessageService('2');
      let called = false;
      let called2 = false;
      let notcalled = false;

      // Receive message setups
      tms2.onmessage(function (msg, from, to) {
        called = true;
        assert(from === '1', 'message came from wrong person');
      });

      tms.onmessage(function (msg, from, to) {
        called2 = true;
        assert(from === '2', 'message came from wrong person');
      });
      // Send mesages
      tms.send('message', '2').then(() => {
        console.log('sent message from tms');
        var res = tms2.send('reply', '1').then(() => {
          console.log('sent message from tms2');
          assert(called2, 'tms didnt receive a message');
          assert(!notcalled, 'something failed in the service');
          assert.equal(0, TestMessageService.getPipeline().length, 'wrong number of messages in pipeline should be 1');
          done();
        });
        TestMessageService.globalStep();
        return res;
      });
      assert.equal(1, TestMessageService.getPipeline().length, 'wrong number of messages in pipeline should be 1');
      TestMessageService.globalStep();
    });


  });

  describe('hash graph ', () => {
    it('create a hash graph in the test message service', () => {
      var hg = new HashGraph()
        .setMessageServiceType(TestMessageService)
        .createLine('1','self');

      assert(hg, 'should have a value');

      var thread = hg.getLine('1');
      assert(thread, 'should have a value');

    });
  });
});


function strarse(t) {
  return JSON.parse(JSON.stringify(t))
}