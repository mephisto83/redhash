var assert = require('assert');
var distpath = '../distribution';
var HashGraph = require(`${distpath}/index`).default;
var HashThread = require(`${distpath}/hashthread`).default;
var HashEvent = require(`${distpath}/hashevent`).default;
var HashMeta = require(`${distpath}/hashmeta`).default;

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
      hashgraph.createThread();
      assert.ok(hashgraph.threads.length);
    });
  });
});

describe('HashThread', function () {
  var person = 'person';
  var self = 'self';

  describe('hashthread instance', function () {

    it('should create a hashthread', function () {
      var hashthread = HashThread.createThread(self);
      assert.ok(hashthread);
      assert.ok(hashthread.contributors.length);
      assert.ok(hashthread.self === self, 'is not equal to self');
    });

    it('can be copied', () => {
      var hashthread = HashThread.createThread(self);
      var duplicate = HashThread.copy(hashthread);
      assert.ok(duplicate);
      assert.ok(duplicate.contributors !== hashthread.contributors, 'should be a different instance');
      assert.ok(duplicate.contributors.length === hashthread.contributors.length, 'should have the same length of contents');
      assert.ok(duplicate.id === hashthread.id);
      assert.ok(duplicate.eventList !== hashthread.eventList);
      assert.ok(duplicate.eventList.length === hashthread.eventList.length);
    });

    it('should add a contributor', function () {
      var hashthread = HashThread.createThread(self);
      hashthread.contributorAdd(person);
      assert.ok(hashthread.contributors.length === 2);
    });

    it('sent hash events should add the contributor to the history and the time it was sent', () => {
      var hashthread = HashThread.createThread(self);
      var hashevent = new HashEvent('message');
      hashthread.sendEvent(hashevent);
      assert.ok(hashthread.eventList.length === 1, 'the list should be 1 event long');
      var evt = hashthread.eventList[0];
      assert.ok(evt.history[self]);
    });

    it('when a event is sent, a handler will receive it', () => {
      var hashthread = HashThread.createThread(self);
      assert.ok(HashThread.SENDEVENT, 'should be a const')
      var caught = false;
      hashthread.listen(HashThread.SENDEVENT, () => {
        caught = true;
      });
      var hashevent = new HashEvent('message');
      hashthread.sendEvent(hashevent);
      assert.ok(caught);
    });

    it('when a event is sent, a handler will receive it', () => {
      var hashthread = HashThread.createThread(self);
      assert.ok(HashThread.SENDEVENT, 'should be a const')
      var caught = false;
      hashthread.listen(HashThread.SENDEVENT, () => {
        caught = true;
      });
      var hashevent = new HashEvent('message');
      hashthread.sendEvent(hashevent);
      assert.ok(caught);
    });

    it('when an event is received, a handler will handle it', () => {

      var hashthread = HashThread.createThread(self);
      assert.ok(HashThread.RECEIVEEVENT, 'should be a const')
      var caught = false;
      hashthread.listen(HashThread.RECEIVEEVENT, () => {
        caught = true;
      });
      var hashevent = new HashEvent('message');
      hashevent.stamp(self);
      hashthread.receiveEvent(hashevent);
      assert.ok(caught);
    });

    it('receiving an event twice, will only add it once', () => {

      var hashthread = HashThread.createThread(self);
      assert.ok(HashThread.RECEIVEEVENT, 'should be a const')
      var caught = false;
      hashthread.listen(HashThread.RECEIVEEVENT, () => {
        caught = true;
      });
      var hashevent = new HashEvent('message');
      hashevent.stamp(self);
      hashthread.receiveEvent(hashevent);
      hashthread.receiveEvent(hashevent);
      assert.ok(hashthread.eventList.length === 1);
    });

    it('can remove contributor to a thread', () => {
      var hashthread = HashThread.createThread(self);
      hashthread.contributorAdd(person);
      assert.ok(hashthread.contributors.length === 2, 'did not add contributor correctly')
      hashthread.contributorRemove(person);
      assert.ok(hashthread.contributors.length === 1, 'did not remove contributor correctly')
    });

    it('can detect if a hash event has been seen by all contributors', () => {
      var hashthread = HashThread.createThread(self);
      hashthread.contributorAdd(person);
      var hashevent = new HashEvent('message');
      hashevent.stamp(self);
      hashthread.receiveEvent(hashevent);
      assert.ok(!hashthread.eventSeenByAll(hashevent), 'event should have not been seen by all ');
    });

    it('can say who hasnt see the event', () => {
      var hashthread = HashThread.createThread(self);
      hashthread.contributorAdd(person);
      var hashevent = new HashEvent('message');
      hashevent.stamp(self);
      hashthread.receiveEvent(hashevent);
      assert.ok(hashthread.contributorsWhoHaventSeenEvent(hashevent)[0] === person, 'didnt say person');
    });

    it('can duplicate the event', () => {
      var hashevent = new HashEvent('message');
      hashevent.stamp(self);
      var duplicate = HashEvent.copy(hashevent);
      assert.ok(duplicate);
      assert.ok(duplicate.history !== hashevent.history, 'should be a new instance of the history');
      assert.ok(duplicate.history[self] === hashevent.history[self], 'should have the same value');
      assert.ok(duplicate.history[self], 'should have a stamp ');
      assert.ok(duplicate.message === hashevent.message);
      assert.ok(duplicate.id === hashevent.id);
    });

  });

  describe('hashthread adding contributors', () => {
    it('can create an add contributor request', () => {

      var hashthread = HashThread.createThread(self);
      var gotevent = null;
      hashthread.listen(HashThread.SYSEVENT, (evt) => {
        gotevent = evt;
      });
      hashthread.receiveEvent(HashEvent.requestAddContributor(person));
      assert.ok(gotevent);
    });
    it('can reply to an add contributor request', () => {
      var hashthread = HashThread.createThread(self);
      var request = HashEvent.requestAddContributor(person);
      hashthread.sendEvent(request);
      hashthread.sendEvent(HashEvent.replyToAddContributor(request, true))
      assert.ok(hashthread.eventList.length === 2);
      var event = hashthread.eventList[0];
      assert.ok(event);
      assert.ok(event.meta.length === 1, 'there should be only a single number here');
      assert.ok(event.meta[0] === 1, 'the sender should automatically say they have received the message');
    });
    function setup() {
      var hashthread = HashThread.createThread(self);
      var request = HashEvent.requestAddContributor(person);
      hashthread.sendEvent(request);
      hashthread.sendEvent(HashEvent.replyToAddContributor(request, true))
      assert.ok(hashthread.eventList.length === 2);
      var event = hashthread.eventList[0];
      assert.ok(event);
      assert.ok(event.meta.length === 1, 'there should be only a single number here');
      assert.ok(event.meta[0] === 1, 'the sender should automatically say they have received the message');
      return hashthread;
    }
    function setupTwoContributors() {
      var hashthread = HashThread.createThread(self, [self, person]);
      return hashthread;
    }
    it('can reply to an add contributor request', () => {
      var hashthread = setup();
      var evnts = hashthread.getConsensusEvents();
      assert.ok(evnts);
      assert.ok(evnts.length === 2, `events should have been 2 but were ${evnts.length}`);
    });

    it('know when not everyone has seen the message', () => {
      var hashthread = setupTwoContributors();
      var request = new HashEvent('message', 'sometype');
      hashthread.sendEvent(request);
      var evnts = hashthread.getConsensusEvents();
      assert.ok(evnts);
      assert.ok(evnts.length === 0, `events should have been 2 but were ${evnts.length}`);
    });

    it('know when not everyone has seen the message', () => {
      var hashthread = setupTwoContributors();
      var request = new HashEvent('message', 'sometype');
      hashthread.sendEvent(request);
      var contribs = hashthread.getContributorsWhoHaventSeenTheMessage(hashthread.getListEvent(0));
      assert.ok(contribs);
      assert.ok(contribs.length === 1, `events should have been 1 but were ${contribs.length}`);
    });
  })
});

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
      assert.ok(res.length === 32, 'should have been 1 number');
    });

    it('should set the bit correctly', () => {
      var res = HashMeta.create(2);
      var updated = HashMeta.set(res, 0, 0, 1, 2);
      console.log(updated);
      assert.ok(updated);
      assert.ok(updated[0].toString(2) === '1');
    });

    it('should set the bit correctly', () => {
      var res = HashMeta.create(2);
      var updated = HashMeta.set(res, 1, 1, 1, 2);
      console.log(updated);
      assert.ok(updated);
      console.log(updated[0].toString(2));
      assert.ok(updated[0].toString(2) === '1000');
    });


    it('should set the bit correctly', () => {
      var res = HashMeta.create(2);
      var updated = HashMeta.set(res, 1, 1, 1, 3);
      console.log(updated);
      assert.ok(updated);
      console.log(updated[0].toString(2));
      assert.ok(updated[0].toString(2) === '10000');
    });

    it('should set the bit correctly', () => {
      var res = HashMeta.create(2);
      var updated = HashMeta.set(res, 1, 0, 1, 3);
      console.log(updated);
      assert.ok(updated);
      console.log(updated[0].toString(2));
      assert.ok(updated[0].toString(2) === '10');
    });

    it('can duplicate', () => {
      var res = HashMeta.create(2);
      var updated = HashMeta.set(res, 1, 0, 1, 3);
      var duplicate = HashMeta.copy(updated);
      assert.ok(duplicate);
    })
  })
});
