var assert = require('assert');
var distpath = '../distribution';
var HashGraph = require(`${distpath}/index`).default;
var HashThread = require(`${distpath}/hashthread`).default;
var HashThreadConst = require(`${distpath}/hashthread`);
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
var person = 'person';
var otherperson = 'otherperson';
var self = 'self';
describe('HashThread', function () {


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
      assert.ok(HashThreadConst.SENDEVENT, 'should be a const')
      var caught = false;
      hashthread.listen(HashThreadConst.SENDEVENT, () => {
        caught = true;
      });
      var hashevent = new HashEvent('message');
      hashthread.sendEvent(hashevent);
      assert.ok(caught);
    });

    it('when a event is sent, a handler will receive it', () => {
      var hashthread = HashThread.createThread(self);
      assert.ok(HashThreadConst.SENDEVENT, 'should be a const')
      var caught = false;
      hashthread.listen(HashThreadConst.SENDEVENT, () => {
        caught = true;
      });
      var hashevent = new HashEvent('message');
      hashthread.sendEvent(hashevent);
      assert.ok(caught);
    });

    it('when an event is received, a handler will handle it', () => {

      var hashthread = HashThread.createThread(self);
      assert.ok(HashThreadConst.RECEIVEEVENT, 'should be a const')
      var caught = false;
      hashthread.listen(HashThreadConst.RECEIVEEVENT, () => {
        caught = true;
      });
      var hashevent = new HashEvent('message');
      hashevent.stamp(self);
      hashthread.receiveEvent(hashevent, self);
      assert.ok(caught);
    });

    it('receiving an event twice, will only add it once', () => {

      var hashthread = HashThread.createThread(self);
      assert.ok(HashThreadConst.RECEIVEEVENT, 'should be a const')
      var caught = false;
      hashthread.listen(HashThreadConst.RECEIVEEVENT, () => {
        caught = true;
      });
      var hashevent = new HashEvent('message');
      hashevent.stamp(self);
      hashthread.receiveEvent(hashevent, self);
      hashthread.receiveEvent(strarse(hashevent), self);
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
      hashthread.receiveEvent(hashevent, self);
      assert.ok(!hashthread.eventSeenByAll(hashevent), 'event should have not been seen by all ');
    });

    it('can say who hasnt see the event', () => {
      var hashthread = HashThread.createThread(self);
      hashthread.contributorAdd(person);
      var hashevent = new HashEvent('message');
      hashevent.stamp(self);
      hashthread.receiveEvent(hashevent, person);
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
      hashthread.listen(HashThreadConst.SYSEVENT, (evt) => {
        gotevent = evt;
      });
      hashthread.receiveEvent(HashEvent.requestAddContributor(person), self);
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
      var evnts = hashthread.getCompletedEvents();
      assert.ok(evnts);
      assert.ok(evnts.length === 2, `events should have been 2 but were ${evnts.length}`);
    });

    it('know when not everyone has seen the message', () => {
      var hashthread = setupTwoContributors();
      var request = new HashEvent('message', 'sometype');
      hashthread.sendEvent(request);
      var evnts = hashthread.getCompletedEvents();
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
      assert.ok(contribs[0] === person, ' should have been the person who hasnt see the message');
    });

    it('should get contributors who have seen the message', () => {
      var hashthread = setupTwoContributors();
      var request = new HashEvent('message', 'sometype');
      hashthread.sendEvent(request);
      var contribs = hashthread.getContributorsSeenBy(hashthread.getListEvent(0));
      assert.ok(contribs);
      assert.ok(contribs.length === 1, `events should have been 1 but were ${contribs.length}`);
      assert.ok(contribs[0] === self, ' should have been the self who has see the message');
    });

  });

  describe('two hashthreads communicating', () => {
    function setupTwoCommunicatingContributors() {
      var s1 = HashThread.createThread(self, [self, person]);
      var p1 = HashThread.createThread(person, [person, self]);
      return { s1, p1 };
    }
    function setup3CommunicatingContributors() {
      var s1 = HashThread.createThread(self, [self, person, otherperson]);
      var p1 = HashThread.createThread(person, [person, self, otherperson]);
      var p2 = HashThread.createThread(otherperson, [person, self, otherperson]);
      return { s1, p1, p2 };
    }
    function setupThreads(num) {
      var persons = [].interpolate(0, num, function (i) {
        return 'person-' + i;
      });

      return persons.map(p => {
        return HashThread.createThread(p, [...persons]);
      })
    }

    it('s1 sends a message, p1 will get and reply, meta data will be updated', () => {
      var { s1, p1 } = setupTwoCommunicatingContributors();
      assert.ok(s1);
      assert.ok(p1);
      var sentEvent;
      s1.listen(HashThreadConst.SENDEVENT, evt => {
        sentEvent = evt;
      })
      s1.sendEvent(new HashEvent("asndfasdf"));
      s1.sentEventSuccessfully(sentEvent.id, person);
      assert.ok(sentEvent);
      assert.ok(sentEvent.meta);

      assert.ok(sentEvent.meta[0] === 15, `'meta data should be 15 ' ${sentEvent.meta[0]}`);
      p1.receiveEvent(strarse(sentEvent), self);
      // Sent successfully
      s1.sentEventSuccessfully(s1.eventList[0].id, person);

      var processedEvent = p1.eventList[0];
      assert.ok(processedEvent);
      assert.ok(processedEvent.meta);
      assert.ok(processedEvent.meta[0] === 15, `'meta data shouldnt be ' ${sentEvent.meta[0]}`);
      assert.ok(sentEvent.meta[0] === 15, `'meta data should be 15 ' ${sentEvent.meta[0]}`);

      var consensus = s1.getCompletedEvents();
      assert.ok(consensus);
      assert.ok(consensus.length);

      consensus = p1.getCompletedEvents();
      assert.ok(consensus);
      assert.ok(consensus.length);

    });

    it('s1 sends a message, p1 will get and reply, meta data will be updated, but now with a third', () => {
      var { s1, p1, p2 } = setup3CommunicatingContributors();
      assert.ok(s1);
      assert.ok(p1);
      var sentEvent;
      s1.listen(HashThreadConst.SENDEVENT, evt => {
        sentEvent = evt;
      });

      s1.sendEvent(new HashEvent("asndfasdf"));
      HashMeta.print(s1.eventList[0].meta, 3);
      s1.sentEventSuccessfully(sentEvent.id, person);
      HashMeta.print(s1.eventList[0].meta, 3);
      assert.ok(sentEvent);
      assert.ok(sentEvent.meta);

      assert.ok(sentEvent.meta[0] === parseInt('110110000', 2), `'meta data should be ${parseInt('110110000', 2)} ' ${sentEvent.meta[0]}`);
      p1.receiveEvent(strarse(sentEvent), self);
      // Sent successfully
      s1.sentEventSuccessfully(s1.eventList[0].id, person);

      var processedEvent = p1.eventList[0];
      assert.ok(processedEvent);
      assert.ok(processedEvent.meta);

      assert.ok(processedEvent.meta[0] === parseInt('110110000', 2), `'meta data shouldnt be ' ${sentEvent.meta[0]}`);
      assert.ok(sentEvent.meta[0] === parseInt('110110000', 2), `'meta data should be 15 ' ${sentEvent.meta[0]}`);

      var consensus = s1.getCompletedEvents();
      assert.ok(consensus);
      assert.ok(consensus.length === 0);

      consensus = p1.getCompletedEvents();
      assert.ok(consensus);
      assert.ok(consensus.length === 0);

      consensus = p2.getCompletedEvents();
      assert.ok(consensus);
      assert.ok(consensus.length === 0);


      p1.sentEventSuccessfully(p1.eventList[0].id, otherperson);
      p2.receiveEvent(strarse(p1.eventList[0]), person);


      consensus = p2.getConsensusEvents();
      HashMeta.print(p2.eventList[0].meta, 3);
      assert.ok(consensus);
      assert.ok(consensus.length === 1, 'this should have reached consensus, but not complete knowledge.');

      var p2_dest = p2.getNextPossibleDestinationsFor(p2.eventList[0].id);
      console.log(p2_dest);
      assert.ok(p2_dest);
      assert.ok(p2_dest.length === 1);
      s1.receiveEvent(strarse(p2.eventList[0]), otherperson);
      p2.sentEventSuccessfully(p2.eventList[0].id, self);
      console.log('**********************')

      HashMeta.print(s1.eventList[0].meta, 3);
      HashMeta.print(p1.eventList[0].meta, 3);
      HashMeta.print(p2.eventList[0].meta, 3);
    });

    it('event dispersion from thread 0 to thread 1 ', () => {
      var _thread_count_ = 10;
      var threads = setupThreads(_thread_count_);
      var sentEvent;

      threads[0].listen(HashThreadConst.SENDEVENT, evt => {
        sentEvent = evt;
      });

      threads[0].sendEvent(new HashEvent("asndfasdf"));
      HashMeta.print(threads[0].eventList[0].meta, _thread_count_);
      threads[1].receiveEvent(strarse(sentEvent), threads[0].self);
      threads[0].sentEventSuccessfully(threads[0].eventList[0].id, threads[1].self);
      HashMeta.print(threads[0].eventList[0].meta, _thread_count_);
      HashMeta.print(threads[1].eventList[0].meta, _thread_count_);
    });


    it('event dispersion from thread 0 to thread 1..n', () => {
      var _thread_count_ = 10;
      var threads = setupThreads(_thread_count_);
      var sentEvent;

      threads[0].listen(HashThreadConst.SENDEVENT, evt => {
        sentEvent = evt;
      });
      //Puts event into the "system"
      threads[0].sendEvent(new HashEvent("asndfasdf"));

      var destinations = threads[0].getNextPossibleDestinationsFor(sentEvent.id);
      var count = 0
      while (destinations.length && count < 12) {
        console.log(destinations);
        var tempThread = threads.find(t => t.self === destinations[0]);
        assert.ok(tempThread, 'should find a thread');
        tempThread.receiveEvent(strarse(sentEvent), threads[0].self);
        threads[0].sentEventSuccessfully(threads[0].eventList[0].id, tempThread.self);

        count++;
        destinations = threads[0].getNextPossibleDestinationsFor(sentEvent.id);
      }
      assert.ok(count === 9);
      HashMeta.print(threads[0].eventList[0].meta, _thread_count_);
      HashMeta.print(threads[8].eventList[0].meta, _thread_count_);
    });
  });
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
  it('describes what a messaging service looks like', () => {

    var service = {
      send: (message, to) => {
        to = to || ['to', 'and', 'to2']

        return Promise.resolve().then(() => {
          var results = {
            'to': { success: true },
            'and': { success: false },
            'to2': { success: true }
          }
          return results;
        })
      },
      received: (message, from) => {
        HashGraph.receiveEvent(message, from);
      }
    };
  })
});
function strarse(t) {
  return JSON.parse(JSON.stringify(t))
}