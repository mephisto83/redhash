import assert from 'assert';
import HashThread from './hashthread';
import * as HashThreadConst from './hashthread';
import HashEvent from './hashevent';
import HashMeta from './hashmeta';

import { strarse } from './testutil'

var person = 'person';
var otherperson = 'otherperson';
var self = 'self';

describe('HashThread', function () {


    describe('hashthread instance', function () {

        it('should create a hashthread', function () {
            var hashthread = HashThread.createThread(self);
            assert.ok(hashthread);
            assert.ok(hashthread.contributors.length);
            assert.ok(hashthread.eventIndex === 0)
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
            var hashevent = new HashEvent('message', null, hashthread.contributors);
            hashthread.sendEvent(hashevent);
            assert.ok(hashthread.eventIndex === 1)
            assert.ok(hashthread.eventList.length === 1, 'the list should be 1 event long');
            var evt = hashthread.eventList[0];
            console.log(evt.history)
            assert.ok(evt.history[self]);
        });

        it('when a event is sent, a handler will receive it', () => {
            var hashthread = HashThread.createThread(self);
            assert.ok(HashThreadConst.SENDEVENT, 'should be a const')
            var caught = false;
            hashthread.listen(HashThreadConst.SENDEVENT, () => {
                caught = true;
            });
            var hashevent = new HashEvent('message', null, [self]);
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
            var hashevent = new HashEvent('message', null, [self]);
            hashthread.sendEvent(hashevent);
            assert.ok(hashthread.eventHeads);
            assert.ok(hashthread.eventHeads[self]);
            assert.ok(caught);
        });

        it('when an event is received, a handler will handle it', () => {

            var hashthread = HashThread.createThread(self);
            assert.ok(HashThreadConst.RECEIVEEVENT, 'should be a const')
            var caught = false;
            hashthread.listen(HashThreadConst.RECEIVEEVENT, () => {
                caught = true;
            });
            var hashevent = new HashEvent('message', null, [self]);
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
            var hashevent = new HashEvent('message', null, [self]);
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
            var hashevent = new HashEvent('message', null, [self]);
            hashevent.stamp(self);
            hashthread.receiveEvent(hashevent, self);
            assert.ok(!hashthread.eventSeenByAll(hashevent), 'event should have not been seen by all ');
        });

        it('can say who hasnt see the event', () => {
            var hashthread = HashThread.createThread(self, [person, self]);
            var hashevent = new HashEvent('message', null, hashthread.contributors);
            hashevent.stamp(self);
            hashthread.receiveEvent(hashevent, person);
            assert.ok(hashthread.contributorsWhoHaventSeenEvent(hashevent)[0] === person, 'didnt say person');
        });

        it('can duplicate the event', () => {
            var hashevent = new HashEvent('message', null, [self]);
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
            hashthread.receiveEvent(HashEvent.requestAddContributor(person, [self]), self);
            assert.ok(gotevent);
        });

        it('can reply to an add contributor request', () => {
            var hashthread = HashThread.createThread(self);
            var request = HashEvent.requestAddContributor(person, [self]);
            hashthread.sendEvent(request);
            hashthread.sendEvent(HashEvent.replyToAddContributor(request, true, [self]))
            assert.ok(hashthread.eventList.length === 2);
            var event = hashthread.eventList[0];
            assert.ok(event);
            assert.ok(event.meta.length === 1, 'there should be only a single number here');
            assert.ok(event.meta[0] === 1, 'the sender should automatically say they have received the message');
        });

        function setup() {
            var hashthread = HashThread.createThread(self);
            var request = HashEvent.requestAddContributor(person, [self]);
            hashthread.sendEvent(request);
            hashthread.sendEvent(HashEvent.replyToAddContributor(request, true, [self]))
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
            var request = new HashEvent('message', 'sometype', [...hashthread.contributors]);
            hashthread.sendEvent(request);
            var evnts = hashthread.getCompletedEvents();
            assert.ok(evnts);
            assert.ok(evnts.length === 0, `events should have been 2 but were ${evnts.length}`);
        });

        it('know when not everyone has seen the message', () => {
            var hashthread = setupTwoContributors();
            var request = new HashEvent('message', 'sometype', [...hashthread.contributors]);
            hashthread.sendEvent(request);
            var contribs = hashthread.getContributorsWhoHaventSeenTheMessage(hashthread.getListEvent(0));
            assert.ok(contribs);
            assert.ok(contribs.length === 1, `events should have been 1 but were ${contribs.length}`);
            assert.ok(contribs[0] === person, ' should have been the person who hasnt see the message');
        });

        it('should get contributors who have seen the message', () => {
            var hashthread = setupTwoContributors();
            var request = new HashEvent('message', 'sometype', [...hashthread.contributors]);
            hashthread.sendEvent(request);
            var contribs = hashthread.getContributorsSeenBy(hashthread.getListEvent(0));
            assert.ok(contribs);
            assert.ok(contribs.length === 1, `events should have been 1 but were ${contribs.length}`);
            assert.ok(contribs[0] === self, ' should have been the self who has see the message');
        });

    });

    describe('two hashthreads communicating', () => {
        afterEach(() => {
            HashEvent.timeService = null;
        })
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
            s1.sendEvent(new HashEvent("asndfasdf", null, s1.contributors));
            p1.receiveEvent(strarse(sentEvent), self);
            var processedEvent = p1.eventList[0];
            console.log(processedEvent);
            console.log(sentEvent);
            s1.sentEventSuccessfully(processedEvent);
            assert.ok(sentEvent);
            assert.ok(sentEvent.meta);
            HashMeta.print(sentEvent.meta, 2)
            assert.ok(sentEvent.meta[0] === 9, `'meta data should be 9 ' ${sentEvent.meta[0]}`);
            // Sent successfully
            s1.sentEventSuccessfully(processedEvent);

            assert.ok(processedEvent);
            assert.ok(processedEvent.meta);
            assert.ok(processedEvent.meta[0] === 9, `'processed event meta data shouldnt be ' ${sentEvent.meta[0]}`);
            assert.ok(sentEvent.meta[0] === 9, `'sendt meta data should be 9 ' ${sentEvent.meta[0]}`);

            assert.ok(s1.eventHeads);
            assert.ok(s1.eventHeads[self]);
            assert.ok(s1.eventHeads[person] === undefined);

            assert.ok(p1.eventHeads, 'p1 event heads is null or something');
            assert.ok(p1.eventHeads[self], 'p1 self event heads is null or something');
            assert.ok(p1.eventHeads[person] === undefined);

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
            console.log(s1.contributors);
            s1.sendEvent(new HashEvent("asndfasdf", null, s1.contributors));
            var receivedEvent = p1.receiveEvent(strarse(s1.eventList[0]), self);
            HashMeta.print(s1.eventList[0].meta, 3);
            s1.sentEventSuccessfully(receivedEvent);
            HashMeta.print(s1.eventList[0].meta, 3);

            assert.ok(sentEvent);
            assert.ok(sentEvent.meta);

            // Sent successfully
            s1.sentEventSuccessfully(receivedEvent);
            HashMeta.print(s1.eventList[0].meta, 3);

            var processedEvent = p1.eventList[0];
            assert.ok(processedEvent);
            assert.ok(processedEvent.meta);

            assert.ok(processedEvent.meta[0] === 272, `'meta data shouldnt be ' ${sentEvent.meta[0]}`);
            assert.ok(sentEvent.meta[0] === 272, `'meta data should be 272 ' ${sentEvent.meta[0]}`);

            var consensus = s1.getCompletedEvents();
            assert.ok(consensus);
            assert.ok(consensus.length === 0);

            consensus = p1.getCompletedEvents();
            assert.ok(consensus);
            assert.ok(consensus.length === 0);

            consensus = p2.getCompletedEvents();
            assert.ok(consensus);
            assert.ok(consensus.length === 0);


            receivedEvent = p2.receiveEvent(strarse(p1.eventList[0]), person);
            p1.sentEventSuccessfully(receivedEvent);


            consensus = p2.getConsensusEvents();
            HashMeta.print(p2.eventList[0].meta, 3);
            assert.ok(consensus);
            assert.ok(consensus.length === 1, 'this should have reached consensus, but not complete knowledge.');

            HashMeta.print(p2.eventList[0].meta, 3);
            var p2_dest = p2.getNextPossibleDestinationsFor(p2.eventList[0].id);
            console.log(p2_dest);
            assert.ok(p2_dest, 'p2_dest has no value');
            assert.ok(p2_dest.length === 0, 'next destination is not correct');
            var evet = s1.receiveEvent(strarse(p2.eventList[0]), otherperson);
            p2.sentEventSuccessfully(evet);
            console.log('**********************')

            HashMeta.print(s1.eventList[0].meta, 3);
            HashMeta.print(p1.eventList[0].meta, 3);
            HashMeta.print(p2.eventList[0].meta, 3);


            assert.ok(s1.eventHeads);
            assert.ok(s1.eventHeads[self]);
            assert.ok(s1.eventHeads[person] === undefined);
            assert.ok(s1.eventHeads[otherperson] === undefined);
            console.log(s1.eventHeads)
            console.log(p2.eventList[0]);

            assert.ok(s1.eventHeads[self] === 1, `'is self not right' ${s1.eventHeads[self]}`);

        });

        it('event dispersion from thread 0 to thread 1 ', () => {
            var _thread_count_ = 10;
            var threads = setupThreads(_thread_count_);
            var sentEvent;

            threads[0].listen(HashThreadConst.SENDEVENT, evt => {
                sentEvent = evt;
            });
            console.log(threads[0].contributors);
            threads[0].sendEvent(new HashEvent("asndfasdf", null, threads[0].contributors));
            HashMeta.print(threads[0].eventList[0].meta, _thread_count_);
            var eve = threads[1].receiveEvent(strarse(sentEvent), threads[0].self);
            threads[0].sentEventSuccessfully(eve);
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
            threads[0].sendEvent(new HashEvent("asndfasdf", null, threads[0].contributors));

            var destinations = threads[0].getNextPossibleDestinationsFor(sentEvent.id);
            var count = 0
            while (destinations.length && count < 12) {
                console.log(destinations);
                var tempThread = threads.find(t => t.self === destinations[0]);
                assert.ok(tempThread, 'should find a thread');
                var res = tempThread.receiveEvent(strarse(sentEvent), threads[0].self);
                threads[0].sentEventSuccessfully(res);

                count++;
                destinations = threads[0].getNextPossibleDestinationsFor(sentEvent.id);
            }
            assert.ok(count === 9);
            HashMeta.print(threads[0].eventList[0].meta, _thread_count_);
            HashMeta.print(threads[8].eventList[0].meta, _thread_count_);


            assert.ok(threads[0].eventHeads);
            assert.ok(threads[0].eventHeads[threads[0].self]);
            assert.ok(threads[0].eventHeads[threads[0].self] === 1, 'is otherpersion not right ' + threads[0].eventHeads[threads[0].id]);
        });

        describe('event timing', () => {
            it('get event to send', () => {
                var _thread_count_ = 4;
                var threads = setupThreads(_thread_count_);
                var time = 100;
                HashEvent.timeService = {
                    now: () => {
                        var _t = time;
                        time += 100;
                        return _t;
                    }
                }
                threads.map(thread => {
                    [].interpolate(0, 3, function (i) {
                        thread.sendEvent(new HashEvent(`${i}`, null, [...threads[0].contributors]));
                    });
                });

                threads.map(thread => {
                    [].interpolate(0, 3, function (i) {
                        var evntToSend = thread.getEventsToSend();
                        if (evntToSend && evntToSend.length) {
                            var sentEvent = evntToSend[0];
                            var destinations = thread.getNextPossibleDestinationsFor(sentEvent.id);
                            var tempThread = threads.find(t => t.self === destinations[0]);
                            if (tempThread) {
                                var evt = tempThread.receiveEvent(strarse(sentEvent), thread.self);
                                thread.sentEventSuccessfully(evt);

                                evntToSend = thread.getEventsToSend();
                                thread.printEvents();
                                console.log('-----------------------------');
                            }
                        }
                    });
                });
            });

            it('event timing', () => {
                var _thread_count_ = 2;
                var threads = setupThreads(_thread_count_);
                var sentEvent;

                threads[0].listen(HashThreadConst.SENDEVENT, evt => {
                    sentEvent = evt;
                });
                //Puts event into the "system";
                var time = 100;
                HashEvent.timeService = {
                    now: () => {
                        var _t = time;
                        time += 100;
                        return _t;
                    }
                }
                threads[0].sendEvent(new HashEvent("asndfasdf", null, threads[0].contributors));
                threads[1].sendEvent(new HashEvent("asndfasdf", null, threads[0].contributors));

                var destinations = threads[0].getNextPossibleDestinationsFor(sentEvent.id);
                var count = 0;
                while (destinations.length && count < 12) {
                    console.log(destinations);
                    var tempThread = threads.find(t => t.self === destinations[0]);
                    assert.ok(tempThread, 'should find a thread');
                    var evet = tempThread.receiveEvent(strarse(sentEvent), threads[0].self);
                    threads[0].sentEventSuccessfully(evet);

                    count++;
                    destinations = threads[0].getNextPossibleDestinationsFor(sentEvent.id);
                }
            });

        });

        describe('producing a list of events for consumption', () => {
            var steptime = 0;
            it('s1 sends a message, and produce a list of all events, and completed events', () => {
                var { s1, p1, p2 } = setup3CommunicatingContributors();
                assert.ok(s1);
                assert.ok(p1);
                var sentEvent;
                s1.listen(HashThreadConst.SENDEVENT, evt => {
                    sentEvent = evt;
                });
                console.log(s1.contributors);

                s1.sendEvent(new HashEvent("asndfasdf", null, s1.contributors));
                // assert.ok(sentEvent.meta[0] === parseInt('110110000', 2), `'meta data should be ${parseInt('110110000', 2)} ' ${sentEvent.meta[0]}`);
                var receivedEvent = p1.receiveEvent(strarse(sentEvent), self);
                s1.sentEventSuccessfully(receivedEvent);

                var events = s1.getCompletedEvents();
                assert.ok(events.length === 0, 'there should be 0 completed events at this point');


                receivedEvent = p2.receiveEvent(strarse(sentEvent), self);
                s1.sentEventSuccessfully(receivedEvent);

                var events = s1.getCompletedEvents();
                assert.ok(events.length === 1, 'there should be 1 completed event');
            });

            beforeEach(() => {
                steptime = 1;
                HashEvent.timeService = {
                    now: () => {
                        return steptime++
                    }
                }
            })

            it('s1 sends messages, and produce a list of all events, and completed events', () => {
                var { s1, p1, p2 } = setup3CommunicatingContributors();
                assert.ok(s1);
                assert.ok(p1);
                var sentEvent;
                s1.listen(HashThreadConst.SENDEVENT, evt => {
                    sentEvent = evt;
                });
                console.log(s1.contributors);

                sentEvent = s1.sendEvent(new HashEvent("asndfasdf", null, s1.contributors));
                console.log('sent event')
                console.log(sentEvent.meta);

                var receivedEvent = p1.receiveEvent(strarse(sentEvent), self);
                s1.sentEventSuccessfully(receivedEvent);
                sentEvent = s1.eventList[0];

                var events = s1.getCompletedEvents();
                assert.ok(events.length === 0, 'there should be 0 completed events at this point');

                receivedEvent = p2.receiveEvent(strarse(sentEvent), self);

                s1.sentEventSuccessfully(receivedEvent);

                var events = s1.getCompletedEvents();

                assert.ok(events.length === 1, `'there should be 1 completed event' ${events.length}`);

                s1.sendEvent(new HashEvent("asndfasdf", null, s1.contributors));
                receivedEvent = p1.receiveEvent(strarse(sentEvent), self);
                s1.sentEventSuccessfully(receivedEvent);

                events = s1.getCompletedEvents();
                assert.ok(events.length === 1, `'there should be 1 completed event ${events.length}'`);

                events = s1.getEvents();
                assert.ok(events.length === 2, 'there should be 2 total events');

            });

            it('s1 event order when reception order effects timing', () => {
                var { s1, p1, p2 } = setup3CommunicatingContributors();
                assert.ok(s1);
                assert.ok(p1);
                var sentEvent;
                console.log(s1.contributors);

                var sentEvent1 = s1.sendEvent(new HashEvent("asndfasdf", null, s1.contributors));
                var sentEvent2 = s1.sendEvent(new HashEvent("asndfasdf", null, s1.contributors));

                assert(sentEvent1.time < sentEvent2.time, 'the other of the events is wrong');
                var receivedEvent = p1.receiveEvent(strarse(sentEvent2), self);
                s1.sentEventSuccessfully(receivedEvent);

                receivedEvent = p2.receiveEvent(strarse(sentEvent2), self);
                s1.sentEventSuccessfully(receivedEvent);

                receivedEvent = p1.receiveEvent(strarse(sentEvent1), self);
                s1.sentEventSuccessfully(receivedEvent);


                receivedEvent = p2.receiveEvent(strarse(sentEvent1), self);
                s1.sentEventSuccessfully(receivedEvent);

                assert(sentEvent1.time > sentEvent2.time, 'the other of the events is wrong');
                console.log([sentEvent1.time, sentEvent2.time])
                console.log(s1.eventList.map(t => t.time))
            });

        });
    });
});
