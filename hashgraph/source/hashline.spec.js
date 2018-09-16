import assert from 'assert';
import HashLine, { EVENT_THREAD } from './hashline';
import HashEvent from './hashevent';
import TestMessageService from './testmessageservice';
import * as HThread from './hashthread';
import ET from './eventtypes';
import { MEMBERSHIP_THREAD } from './hashline';
import IConnectionInfo from './statemachines/iconnectioninfo';
import * as MA from './statemachines/membershipactions';
import MembershipStateMachine from './statemachines/membershipstatemachine';
import CatStateMachine from './statemachines/catstatemachine';
import * as CSM from './statemachines/catstatemachine';
describe('HashLine', function () {
    it('can create a hash line', () => {
        var line = new HashLine('line', 'self');
        assert.ok(line);
    });
    var targetEvent;
    beforeEach(() => {
        var time = 100;
        HashEvent.timeService = {
            now: () => {
                var _t = time;
                time += 100;
                return _t;
            }
        }

        TestMessageService.clear();
    })
    it('can create initial has line setup', () => {
        //Two threads, membership thread, and a event thread.
        var tms = new TestMessageService('1');
        var line = new HashLine('line', 'self');
        line.initialize();
        tms.assignLine(line);
        assert.ok(line.membershipThread);
        assert.ok(line.eventThread);
        assert.ok(line.threads);
    });

    it('can be assigned a state machine to a thread ', () => {
        var self = 'self';
        var person = 'person';
        var contributors = [self, person];
        var line = new HashLine('line', self, [...contributors]);
        line.assignMachine(function () {
            return function () {
                //state machine
            }
        });
    });

    it('can assign the membership state machine', () => {
        var self = 'self';
        var person = 'person';
        var contributors = [self, person];
        var line = new HashLine('line', self, [...contributors]);
        line.assignMachine(function () {
            return new MembershipStateMachine({
                contributors
            });
        });
    });



    it('listens for send events', () => {
        var self = 'self';
        var person = 'person';
        var contributors = [self, person];
        var line = new HashLine('line', self, [...contributors]);
        var line2 = new HashLine('line', person, [...contributors]);
        line.initialize();
        line2.initialize();
        var tms = new TestMessageService(line.name);
        tms.assignLine(line);

        var tms2 = new TestMessageService(line2.name);
        tms2.assignLine(line2);

        var sent = false;
        line.listen(HThread.SENDEVENT, () => {
            sent = true;
        });

        assert.ok(line.membershipThread, 'there is no membership thread');
        line.sendEvent('event', ET.MEMBERSHIP);
        TestMessageService.globalStep();
        assert.ok(sent);

        var eventsToSend = line.getEventsToSend();
        assert.ok(eventsToSend);
        assert.ok(eventsToSend.length === 1, 'wrong number of expected events to send');
    });

    it('can get destinations for events to send ', () => {
        var self = 'self';
        var person = 'person';
        var contributors = [self, person];
        var line = new HashLine('line', self, [...contributors]);
        var line2 = new HashLine('line', person, [...contributors]);
        line.initialize();
        line2.initialize();
        var tms = new TestMessageService(line.name);
        tms.assignLine(line);

        var tms2 = new TestMessageService(line2.name);
        tms2.assignLine(line2);
        line.sendEvent('event', ET.MEMBERSHIP);
        TestMessageService.globalStep();

        var eventsToSend = line.getEventsToSend();

        var destinations = line.getNextPossibleDestinationsFor(eventsToSend[0]);
        assert.ok(destinations);
        assert.ok(destinations.length === 1, 'should expect one place to send to');
        assert.ok(destinations[0]);

    });

    it('can get messages to send to  a person', (done) => {
        var self = 'self';
        var person = 'person';
        var contributors = [self, person];
        var threadid = 'thread-1';
        var line = new HashLine(self, self, [...contributors]);
        var line2 = new HashLine(person, person, [...contributors]);
        line.initialize(threadid);
        line2.initialize(threadid);
        var tms = new TestMessageService(line.name);
        tms.assignLine(line);

        var tms2 = new TestMessageService(line2.name);
        tms2.assignLine(line2);
        line.sendEvent('event', ET.MEMBERSHIP);

        var eventsToSend = line.getEventsToSend();

        var messages = line.getMessageToSendTo(person);
        assert.ok(messages);
        assert.ok(messages.length === 1, 'should expect one place to send to');
        assert.ok(messages[0]);


        tms.sendMessagesFor(person, self).then(() => {
            assert.ok(received, 'didnt receive an event');
            done();
        }).catch(done);
        var received = false;
        line2.listen(HThread.RECEIVEEVENT, () => {
            received = true;
        });
        TestMessageService.globalStep();
    });


    it('can get messages to send to  a person', () => {
        var self = 'self';
        var person = 'person';
        var contributors = [self, person];
        var threadid = 'thread-1';
        var line = new HashLine(self, self, [...contributors]);
        var line2 = new HashLine(person, person, [...contributors]);
        line.initialize(threadid);
        line2.initialize(threadid);
        var tms = new TestMessageService(line.name);
        tms.assignLine(line);

        var tms2 = new TestMessageService(line2.name);
        tms2.assignLine(line2);
        line.sendEvent('event', ET.MEMBERSHIP);

        tms.sendMessagesFor(person, self).then(() => {
        });

        var received = false;
        line2.listen(HThread.RECEIVEEVENT, () => {
            received = true;
        });
        TestMessageService.globalStep();

        assert.ok(line2.eventThread.eventList.length === 0, 'should have no events')
        assert.ok(line2.membershipThread.eventList.length === 1, 'should have  events')
    });

    it('can get messages to send to  a person', () => {
        var self = 'self';
        var person = 'person';
        var contributors = [self, person];
        var threadid = 'thread-1';
        var line = new HashLine(self, self, [...contributors]);
        var line2 = new HashLine(person, person, [...contributors]);
        line.initialize(threadid);
        line2.initialize(threadid);
        var tms = new TestMessageService(line.name);
        tms.assignLine(line);

        var tms2 = new TestMessageService(line2.name);
        tms2.assignLine(line2);
        line.sendEvent('event', ET.MEMBERSHIP);
        line.sendEvent('event2', 'asdfasdf');

        tms.sendMessagesFor(person, self).then(() => {
        });

        var received = false;
        line2.listen(HThread.RECEIVEEVENT, () => {
            received = true;
        });
        TestMessageService.globalStep();
        assert.ok(received)

        assert.ok(line2.membershipThread.eventList.length === 1, 'membership thread should have 1 event, not ' + line2.membershipThread.eventList.length)
        assert.ok(line2.eventThread.eventList.length === 1, 'event  thread should have 1 event')
    });


    it('process state machines', (done) => {
        var self = 'self';
        var person = 'person';
        var person2 = 'person2';
        var contributors = [self, person];
        var threadid = 'thread-1';
        var line = new HashLine(self, self, [...contributors]);
        var line2 = new HashLine(person, person, [...contributors]);
        line.initialize(threadid);
        line2.initialize(threadid);
        var tms = new TestMessageService(line.name);
        var sendMesses = function () {
            tms.sendMessagesFor(person, self);
            tms2.sendMessagesFor(self, person);
            TestMessageService.globalStep();
        }
        var sendMesses = function () {
            var p = Promise.all([
                tms.sendMessages(self),
                tms2.sendMessages(person)
            ].filter(t => t));
            TestMessageService.globalStep();
            return p;
        }

        var msmConstructor = function () {
            return new MembershipStateMachine({
                contributors
            });
        }
        line.assignMachine(msmConstructor);
        line2.assignMachine(msmConstructor);
        var newstate2 = line2.processState(MEMBERSHIP_THREAD);

        tms.assignLine(line);

        var tms2 = new TestMessageService(line2.name);
        tms2.assignLine(line2);
        sendMesses().then(() => {
            line.sendEvent({
                type: MA.INITIALIZE_STATE
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.REQUEST_CONTRIBUTOR_ADD,
                connectionInfo: new IConnectionInfo(person2, {
                    thread: threadid,
                    threadType: EVENT_THREAD
                })
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {

            line.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {


            line2.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: person,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {

            line.sendEvent({
                type: MA.ADD_CONTRIBUTOR,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {

            var newstate = line.processState(MEMBERSHIP_THREAD)
            var newstate2 = line2.processState(MEMBERSHIP_THREAD)
            // console.log(line.membershipThread.eventList);
            assert.ok(newstate);
            assert.ok(newstate2);
            console.log(line.stateMatchines[MEMBERSHIP_THREAD].state);
            console.log(newstate2);
            assert.ok(newstate2.state.state === MA.ADD_CONTRIBUTOR);
            assert.ok(newstate.state.state === MA.ADD_CONTRIBUTOR);
        }).then(done);
    });


    it('process state machines , add contributor', (done) => {
        var self = 'self';
        var person = 'person';
        var person2 = 'person2';
        var contributors = [self, person];
        var threadid = 'thread-1';
        var line = new HashLine(self, self, [...contributors]);
        var line2 = new HashLine(person, person, [...contributors]);
        line.initialize(threadid);
        line2.initialize(threadid);
        var tms = new TestMessageService(line.name);

        var sendMesses = function () {
            var p = Promise.all([
                tms.sendMessages(self),
                tms2.sendMessages(person)
            ].filter(t => t));
            TestMessageService.globalStep();
            return p;
        }

        var msmConstructor = function () {
            return new MembershipStateMachine({
                contributors
            });
        }
        line.assignMachine(msmConstructor);
        line2.assignMachine(msmConstructor);
        var newstate2 = line2.processState(MEMBERSHIP_THREAD);

        tms.assignLine(line);

        var tms2 = new TestMessageService(line2.name);
        tms2.assignLine(line2);
        sendMesses().then(() => {

            line.sendEvent({
                type: MA.INITIALIZE_STATE
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.REQUEST_CONTRIBUTOR_ADD,
                connectionInfo: new IConnectionInfo(person2, {
                    thread: threadid,
                    threadType: EVENT_THREAD
                })
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {

            line.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line2.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: person,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {

            line.sendEvent({
                type: MA.ADD_CONTRIBUTOR,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.UPDATE_THREAD,
                from: self,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.THREAD_CUT_OFF,
                from: self,
                time: 0,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                from: self,
                time: 0,
                thread: threadid
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {
            line2.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                from: self,
                time: 0,
                thread: threadid
            }, ET.MEMBERSHIP);


        }).then(sendMesses).then(() => {
            var newstate = line.processState(MEMBERSHIP_THREAD)
            var newstate2 = line2.processState(MEMBERSHIP_THREAD)
            // console.log(line.membershipThread.eventList);
            assert.ok(newstate);
            assert.ok(newstate2);
            console.log(newstate2);
            assert.ok(newstate2.state.state === MA.THREAD_CUT_OFF, `${newstate2.state} !== ${MA.THREAD_CUT_APPROVAL}`);
            assert.ok(newstate.state.state === MA.THREAD_CUT_OFF);
        }).then(done);
    });


    it('process state machines , approved ', (done) => {
        var self = 'self';
        var person = 'person';
        var person2 = 'person2';
        var contributors = [self, person];
        var threadid = 'thread-1';
        var line = new HashLine(self, self, [...contributors]);
        var line2 = new HashLine(person, person, [...contributors]);
        line.initialize(threadid);
        line2.initialize(threadid);
        var tms = new TestMessageService(line.name);


        var sendMesses = function () {
            var p = Promise.all([
                tms.sendMessages(self),
                tms2.sendMessages(person)
            ].filter(t => t));
            TestMessageService.globalStep();
            return p;
        }

        var msmConstructor = function () {
            return new MembershipStateMachine({
                contributors
            });
        }
        line.assignMachine(msmConstructor);
        line2.assignMachine(msmConstructor);
        var newstate2 = line2.processState(MEMBERSHIP_THREAD);

        tms.assignLine(line);

        var tms2 = new TestMessageService(line2.name);
        tms2.assignLine(line2);

        sendMesses().then(() => {

            line.sendEvent({
                type: MA.INITIALIZE_STATE
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {



            line.sendEvent({
                type: MA.REQUEST_CONTRIBUTOR_ADD,
                connectionInfo: new IConnectionInfo(person2, {
                    thread: threadid,
                    threadType: EVENT_THREAD
                })
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {



            line.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {

            line2.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: person,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {

            line.sendEvent({
                type: MA.ADD_CONTRIBUTOR,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {

            line.sendEvent({
                type: MA.UPDATE_THREAD,
                from: self,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.THREAD_CUT_OFF,
                from: self,
                time: 0,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var range = line.getCutRanges(EVENT_THREAD);
            line.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                from: self,
                time: 0,
                range,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var range = line2.getCutRanges(EVENT_THREAD);
            line2.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                from: person,
                time: 0,
                range,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {


            var newstate = line.processState(MEMBERSHIP_THREAD)
            var newstate2 = line2.processState(MEMBERSHIP_THREAD)
            // console.log(line.membershipThread.eventList);
            assert.ok(newstate);
            assert.ok(newstate2);
            console.log(newstate);
            console.log(newstate2);
            assert.ok(newstate2.state.state === MA.THREAD_CUT_APPROVED, `${newstate2.state.state} !== ${MA.THREAD_CUT_APPROVAL}`);
            assert.ok(newstate.state.state === MA.THREAD_CUT_APPROVED);
        }).then(sendMesses).then(() => {
            done()
        });
    });


    it('process state machines , rejected ', (done) => {
        var self = 'self';
        var person = 'person';
        var person2 = 'person2';
        var contributors = [self, person];
        var threadid = 'thread-1';
        var line = new HashLine(self, self, [...contributors]);
        var line2 = new HashLine(person, person, [...contributors]);
        line.initialize(threadid);
        line2.initialize(threadid);
        var tms = new TestMessageService(line.name);

        var sendMesses = function () {
            var p = Promise.all([
                tms.sendMessages(self),
                tms2.sendMessages(person)
            ].filter(t => t));
            TestMessageService.globalStep();
            return p;
        }

        var msmConstructor = function () {
            return new MembershipStateMachine({
                contributors
            });
        }
        line.assignMachine(msmConstructor);
        line2.assignMachine(msmConstructor);
        var newstate2 = line2.processState(MEMBERSHIP_THREAD);

        tms.assignLine(line);

        var tms2 = new TestMessageService(line2.name);
        tms2.assignLine(line2);
        sendMesses().then(() => {
            line.sendEvent({
                type: MA.INITIALIZE_STATE
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {

            line.sendEvent({
                type: MA.REQUEST_CONTRIBUTOR_ADD,
                connectionInfo: new IConnectionInfo(person2, {
                    thread: threadid,
                    threadType: EVENT_THREAD
                })
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {

            line.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {

            line2.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: person,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {



            line.sendEvent({
                type: MA.ADD_CONTRIBUTOR,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {

            line.sendEvent({
                type: MA.UPDATE_THREAD,
                from: self,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.THREAD_CUT_OFF,
                from: self,
                time: 0,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var range = line.getCutRanges(EVENT_THREAD);
            line.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                from: self,
                range,
                time: 0,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var range = line2.getCutRanges(EVENT_THREAD);

            line2.sendEvent({
                type: MA.THREAD_CUT_REJECT,
                from: person,
                range,
                time: 0,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {


            var newstate = line.processState(MEMBERSHIP_THREAD)
            var newstate2 = line2.processState(MEMBERSHIP_THREAD)
            // console.log(line.membershipThread.eventList);
            assert.ok(newstate);
            assert.ok(newstate2);
            console.log(newstate);
            console.log(newstate2);
            assert.ok(newstate2.state.state === MA.THREAD_CUT_REJECTED, `${newstate2.state.state} !== ${MA.THREAD_CUT_APPROVAL}`);
            assert.ok(newstate.state.state === MA.THREAD_CUT_REJECTED);
            done();
        });
    });

    it('process state machines , rejected by all', (done) => {
        var self = 'self';
        var person = 'person';
        var person2 = 'person2';
        var contributors = [self, person];
        var threadid = 'thread-1';
        var line = new HashLine(self, self, [...contributors]);
        var line2 = new HashLine(person, person, [...contributors]);
        line.initialize(threadid);
        line2.initialize(threadid);
        var tms = new TestMessageService(line.name);

        var sendMesses = function () {
            var p = Promise.all([
                tms.sendMessages(self),
                tms2.sendMessages(person)
            ].filter(t => t));
            TestMessageService.globalStep();
            return p;
        }

        var msmConstructor = function () {
            return new MembershipStateMachine({
                contributors
            });
        }
        line.assignMachine(msmConstructor);
        line2.assignMachine(msmConstructor);
        var newstate2 = line2.processState(MEMBERSHIP_THREAD);

        tms.assignLine(line);

        var tms2 = new TestMessageService(line2.name);
        tms2.assignLine(line2);
        sendMesses().then(() => {


            line.sendEvent({
                type: MA.INITIALIZE_STATE
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {

            line.sendEvent({
                type: MA.REQUEST_CONTRIBUTOR_ADD,
                connectionInfo: new IConnectionInfo(person2, {
                    thread: threadid,
                    threadType: EVENT_THREAD
                })
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {


            line.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {

            line2.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: person,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.ADD_CONTRIBUTOR,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.UPDATE_THREAD,
                from: self,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {

            line.sendEvent({
                type: MA.THREAD_CUT_OFF,
                from: self,
                time: 0,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.THREAD_CUT_REJECT,
                from: self,
                time: 0,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {


            line2.sendEvent({
                type: MA.THREAD_CUT_REJECT,
                from: person,
                time: 0,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {


            var newstate = line.processState(MEMBERSHIP_THREAD)
            var newstate2 = line2.processState(MEMBERSHIP_THREAD)
            // console.log(line.membershipThread.eventList);
            assert.ok(newstate);
            assert.ok(newstate2);
            console.log(newstate);
            console.log(newstate2);
            assert.ok(newstate2.state.state === MA.THREAD_CUT_REJECTED, `${newstate2.state} !== ${MA.THREAD_CUT_APPROVAL}`);
            assert.ok(newstate.state.state === MA.THREAD_CUT_REJECTED);
        }).then(done);
    });

    it('process state machines , rejected by all, then approve next suggestion', (done) => {
        var self = 'self';
        var person = 'person';
        var person2 = 'person2';
        var contributors = [self, person];
        var threadid = 'thread-1';
        var line = new HashLine(self, self, [...contributors]);
        var line2 = new HashLine(person, person, [...contributors]);
        line.initialize(threadid);
        line2.initialize(threadid);
        var tms = new TestMessageService(line.name);

        var sendMesses = function () {
            var p = Promise.all([
                tms.sendMessages(self),
                tms2.sendMessages(person)
            ].filter(t => t));
            TestMessageService.globalStep();
            return p;
        }

        var msmConstructor = function () {
            return new MembershipStateMachine({
                contributors
            });
        }
        line.assignMachine(msmConstructor);
        line2.assignMachine(msmConstructor);
        var newstate2 = line2.processState(MEMBERSHIP_THREAD);

        tms.assignLine(line);

        var tms2 = new TestMessageService(line2.name);
        tms2.assignLine(line2);
        sendMesses().then(() => {
            line.sendEvent({
                type: MA.INITIALIZE_STATE
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.REQUEST_CONTRIBUTOR_ADD,
                connectionInfo: new IConnectionInfo(person2, {
                    thread: threadid,
                    threadType: EVENT_THREAD
                })
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {


            line.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {

            line2.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: person,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {

            line.sendEvent({
                type: MA.ADD_CONTRIBUTOR,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);


        }).then(sendMesses).then(() => {

            line.sendEvent({
                type: MA.UPDATE_THREAD,
                from: self,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var range = line2.getCutRanges(EVENT_THREAD);
            line.sendEvent({
                type: MA.THREAD_CUT_OFF,
                from: self,
                time: 0,
                range,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {

            line.sendEvent({
                type: MA.THREAD_CUT_REJECT,
                from: self,
                time: 0,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {


            line2.sendEvent({
                type: MA.THREAD_CUT_REJECT,
                from: person,
                time: 0,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.UPDATE_THREAD,
                from: self,
                thread: threadid
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {

            line.sendEvent({
                type: MA.THREAD_CUT_OFF,
                from: self,
                time: 0,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var range = line.getCutRanges(EVENT_THREAD);
            line.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                from: self,
                time: 1,
                range,
                thread: threadid
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {
            var range = line2.getCutRanges(EVENT_THREAD);
            line2.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                range,
                from: person,
                time: 1,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {

            var newstate = line.processState(MEMBERSHIP_THREAD)
            var newstate2 = line2.processState(MEMBERSHIP_THREAD)
            // console.log(line.membershipThread.eventList);
            assert.ok(newstate);
            assert.ok(newstate2);
            console.log(newstate);
            console.log(newstate2);
            assert.ok(newstate2.state.state === MA.THREAD_CUT_APPROVED, `${newstate2.state.state} !== ${MA.THREAD_CUT_APPROVAL}`);
            assert.ok(newstate.state.state === MA.THREAD_CUT_APPROVED);
        }).then(done);
    });


    it('process state machines , approved ', (done) => {
        var self = 'self';
        var person = 'person';
        var person2 = 'person2';
        var contributors = [self, person];
        var threadid = 'thread-1';
        var line = new HashLine(self, self, [...contributors]);
        var line2 = new HashLine(person, person, [...contributors]);
        line.initialize(threadid);
        line2.initialize(threadid);
        var tms = new TestMessageService(line.name);

        var sendMesses = function () {
            var p = Promise.all([
                tms.sendMessages(self),
                tms2.sendMessages(person)
            ].filter(t => t));
            TestMessageService.globalStep();
            return p;
        }

        var msmConstructor = function () {
            return new MembershipStateMachine({
                contributors
            });
        }
        line.assignMachine(msmConstructor);
        line2.assignMachine(msmConstructor);
        var newstate2 = line2.processState(MEMBERSHIP_THREAD);

        tms.assignLine(line);

        var tms2 = new TestMessageService(line2.name);
        tms2.assignLine(line2);

        sendMesses().then(() => {

            line.sendEvent({
                type: MA.INITIALIZE_STATE
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {

            line.sendEvent({
                type: MA.REQUEST_CONTRIBUTOR_ADD,
                connectionInfo: new IConnectionInfo(person2, {
                    thread: threadid,
                    threadType: EVENT_THREAD
                })
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {

            line.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {

            line2.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: person,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.ADD_CONTRIBUTOR,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {

            line.sendEvent('an event');

            line.sendEvent('an event 2');

            line.sendEvent('an event 3');

            line2.sendEvent('an event 4');

        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.UPDATE_THREAD,
                from: self,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {

            line.sendEvent({
                type: MA.THREAD_CUT_OFF,
                from: self,
                time: 0,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var range = line.getCutRanges(EVENT_THREAD);
            line.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                from: self,
                time: 0,
                range,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var range = line2.getCutRanges(EVENT_THREAD);
            line2.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                from: person,
                time: 0,
                range,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var newstate = line.processState(MEMBERSHIP_THREAD)
            var newstate2 = line2.processState(MEMBERSHIP_THREAD)
            console.log(line.eventThread.getCompletedEvents());
            assert.ok(newstate);
            assert.ok(newstate2);
            console.log(newstate);
            console.log(newstate2);
            assert.ok(newstate2.state.state === MA.THREAD_CUT_APPROVED, `${newstate2.state.state} !== ${MA.THREAD_CUT_APPROVAL}`);
            assert.ok(newstate.state.state === MA.THREAD_CUT_APPROVED);

            //Events should be filtered away, and the state should be updated.
            line.adjustContributors();

            assert.ok(line);
            assert.ok(line.threads[EVENT_THREAD].thread.eventList);

        }).then(done);
    });


    it('process state machines , approved, async ', (done) => {
        var self = 'self';
        var person = 'person';
        var person2 = 'person2';
        var contributors = [self, person];
        var threadid = 'thread-1';
        var line = new HashLine(self, self, [...contributors]);
        var line2 = new HashLine(person, person, [...contributors]);
        var line3;
        line.initialize(threadid);
        line2.initialize(threadid);
        var tms = new TestMessageService(line.name);
        var tms3;
        var sendMesses = function () {
            var p = Promise.all([
                tms.sendMessages(self),
                tms2.sendMessages(person),
                tms3 ? tms3.sendMessages(person2) : null
            ].filter(t => t));
            TestMessageService.globalStep();
            return p;
        }

        var msmConstructor = function () {
            return new MembershipStateMachine({
                contributors
            });
        }
        var csm = function () {
            return new CatStateMachine({
            });
        }
        line.assignMachine(msmConstructor);
        line.assignMachine(csm, EVENT_THREAD);

        line2.assignMachine(msmConstructor);
        line2.assignMachine(csm, EVENT_THREAD);

        var newstate2 = line2.processState(MEMBERSHIP_THREAD);

        tms.assignLine(line);

        var tms2 = new TestMessageService(line2.name);
        tms2.assignLine(line2);

        var EVENT = 'EVENT';



        Promise.resolve().then(() => {

            line.sendEvent({
                type: MA.INITIALIZE_STATE
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.REQUEST_CONTRIBUTOR_ADD,
                connectionInfo: new IConnectionInfo(person2, {
                    thread: threadid,
                    threadType: EVENT_THREAD
                })
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
        }).then(() => {
            line.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);
            console.log(line.threads[MEMBERSHIP_THREAD].thread.eventList[0])
        }).then(sendMesses).then(() => {
            line2.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: person,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.ADD_CONTRIBUTOR,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 1' });
            line.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 2' });
            line.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 3' });
            line.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 4' });
            line2.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 5' });
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.THREAD_CUT_OFF,
                from: self,
                time: 0,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.UPDATE_THREAD,
                from: self,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.THREAD_CUT_OFF,
                from: self,
                time: 2000,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var range = line.getCutRanges(EVENT_THREAD);
            line.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                from: self,
                range,
                time: 2000,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var range = line2.getCutRanges(EVENT_THREAD);
            line2.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                from: person,
                time: 2000,
                range,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var newstate = line.processState(MEMBERSHIP_THREAD);
            var newstate2 = line2.processState(MEMBERSHIP_THREAD);
            // console.log(line.membershipThread.eventList);
            assert.ok(newstate);
            assert.ok(newstate2);
            console.log(newstate);
            console.log(newstate2);
            assert.ok(newstate2.state.state === MA.THREAD_CUT_APPROVED, `${newstate2.state} !== ${MA.THREAD_CUT_APPROVAL}`);
            assert.ok(newstate.state.state === MA.THREAD_CUT_APPROVED);
        }).then(sendMesses).then(() => {
            line.adjustContributors();
            line2.adjustContributors();

            assert.ok(line);
            assert.ok(line.threads[EVENT_THREAD].thread.eventList);

            var eventstate = line.getThread(EVENT_THREAD).getEvents();
            var eventstate2 = line2.processState(EVENT_THREAD);
            console.log(eventstate);
            console.log(eventstate2);

            line3 = new HashLine(person2, person2, [...contributors, person2]);
            line3.initialize(threadid);
            line3.assignMachine(msmConstructor);
            line3.assignMachine(csm, EVENT_THREAD);
            tms3 = new TestMessageService(line3.name);
            tms3.assignLine(line3);
        }).then(() => {
            done();
        });





    });


    it('process state machines , ranges dont match ', (done) => {
        var self = 'self';
        var person = 'person';
        var person2 = 'person2';
        var contributors = [self, person];
        var threadid = 'thread-1';
        var line = new HashLine(self, self, [...contributors]);
        var line2 = new HashLine(person, person, [...contributors]);
        var line3;
        line.initialize(threadid);
        line2.initialize(threadid);
        var tms = new TestMessageService(line.name);
        var tms3;
        var sendMesses = function () {
            var p = Promise.all([
                tms.sendMessages(self),
                tms2.sendMessages(person),
                tms3 ? tms3.sendMessages(person2) : null
            ].filter(t => t));
            TestMessageService.globalStep();
            return p;
        }

        var msmConstructor = function () {
            return new MembershipStateMachine({
                contributors
            });
        }
        var csm = function () {
            return new CatStateMachine({
            });
        }
        line.assignMachine(msmConstructor);
        line.assignMachine(csm, EVENT_THREAD);

        line2.assignMachine(msmConstructor);
        line2.assignMachine(csm, EVENT_THREAD);

        var newstate2 = line2.processState(MEMBERSHIP_THREAD);

        tms.assignLine(line);

        var tms2 = new TestMessageService(line2.name);
        tms2.assignLine(line2);

        var EVENT = 'EVENT';



        sendMesses().then(() => {
            line.sendEvent({
                type: MA.INITIALIZE_STATE
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.REQUEST_CONTRIBUTOR_ADD,
                connectionInfo: new IConnectionInfo(person2, {
                    thread: threadid,
                    threadType: EVENT_THREAD
                })
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);
            console.log(line.threads[MEMBERSHIP_THREAD].thread.eventList[0])
        }).then(sendMesses).then(() => {
            line2.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: person,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.ADD_CONTRIBUTOR,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 1' });
            line.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 2' });
            line.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 3' });
            line.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 4' });
            line2.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 5' });
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.UPDATE_THREAD,
                from: self,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var { state, time } = line.processState(EVENT_THREAD);
            console.log(`############## ------------------ ${time}`)
            line.sendEvent({
                type: MA.THREAD_CUT_OFF,
                from: self,
                time: 2000,
                storedState: {
                    EVENT_THREAD: {
                        state,
                        time
                    }
                },
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var range = line.getCutRanges(EVENT_THREAD);
            line.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                from: self,
                time: 2000,
                range: { maximum: 1100, minimum: 110 },
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var range = line2.getCutRanges(EVENT_THREAD);
            line2.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                from: person,
                time: 2000,
                range: { maximum: 100, minimum: 10 },
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var newstate = line.processState(MEMBERSHIP_THREAD);
            var newstate2 = line2.processState(MEMBERSHIP_THREAD);
            // console.log(line.membershipThread.eventList);
            assert.ok(newstate);
            assert.ok(newstate2);
            console.log(newstate);
            console.log(newstate2);
            assert.ok(newstate2.state.state === MA.THREAD_CANT_CUT_NO_AGREEABLE_TIME, `${newstate2.state} !== ${MA.THREAD_CUT_APPROVAL}`);
            assert.ok(newstate.state.state === MA.THREAD_CANT_CUT_NO_AGREEABLE_TIME);
        }).then(() => {
            done();
        });
    });


    it('process state machines , approved, async, continue with 3rd line ', (done) => {
        var self = 'self';
        var person = 'person';
        var person2 = 'person2';
        var contributors = [self, person];
        var threadid = 'thread-1';
        var line = new HashLine(self, self, [...contributors]);
        var line2 = new HashLine(person, person, [...contributors]);
        var line3;
        line.initialize(threadid);
        line2.initialize(threadid);
        var tms = new TestMessageService(line.name);
        var tms3;
        var sendMesses = function () {
            if (tms3) {
                console.log('sending on tms3');
            }
            var p = Promise.all([
                tms.sendMessages(self),
                tms2.sendMessages(person),
                tms3 ? tms3.sendMessages(person2) : null
            ].filter(t => t));
            TestMessageService.globalStep();
            return p;
        }

        var msmConstructor = function () {
            return new MembershipStateMachine({
                contributors
            });
        }
        var csm = function () {
            return new CatStateMachine({
            });
        }
        line.assignMachine(msmConstructor);
        line.assignMachine(csm, EVENT_THREAD);

        line2.assignMachine(msmConstructor);
        line2.assignMachine(csm, EVENT_THREAD);

        var newstate2 = line2.processState(MEMBERSHIP_THREAD);

        tms.assignLine(line);

        var tms2 = new TestMessageService(line2.name);
        tms2.assignLine(line2);

        var EVENT = 'EVENT';



        sendMesses().then(() => {
            line.sendEvent({
                type: MA.INITIALIZE_STATE
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.REQUEST_CONTRIBUTOR_ADD,
                connectionInfo: new IConnectionInfo(person2, {
                    thread: threadid,
                    threadType: EVENT_THREAD
                })
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);
            console.log(line.threads[MEMBERSHIP_THREAD].thread.eventList[0])
        }).then(sendMesses).then(() => {
            line2.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: person,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.ADD_CONTRIBUTOR,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 1' });
            line.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 2' });
            line.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 3' });
            line.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 4' });
            line2.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 5' });
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.UPDATE_THREAD,
                from: self,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var { state, time } = line.processState(EVENT_THREAD);
            line.sendEvent({
                type: MA.THREAD_CUT_OFF,
                from: self,
                time: 2000,
                storedState: {
                    EVENT_THREAD: {
                        state,
                        time
                    }
                },
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var range = line.getCutRanges(EVENT_THREAD);
            line.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                from: self,
                time: 2000,
                range,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var range = line2.getCutRanges(EVENT_THREAD);
            line2.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                from: person,
                time: 2000,
                range,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var newstate = line.processState(MEMBERSHIP_THREAD);
            var newstate2 = line2.processState(MEMBERSHIP_THREAD);
            assert.ok(newstate);
            assert.ok(newstate2);
            console.log(newstate);
            console.log(newstate2);
            assert.ok(newstate2.state.state === MA.THREAD_CUT_APPROVED, `${newstate2.state} !== ${MA.THREAD_CUT_APPROVAL}`);
            assert.ok(newstate.state.state === MA.THREAD_CUT_APPROVED);
        }).then(sendMesses).then(() => {
            line.adjustContributors();
            line2.adjustContributors();
            assert.ok(!line2.eventThread.eventList.length);
            assert.ok(!line.eventThread.eventList.length);
            var _transferredState = line.getState(MEMBERSHIP_THREAD);
            var _transferredTails = line.getTails(EVENT_THREAD);
            assert.ok(line);
            assert.ok(line.threads[EVENT_THREAD].thread.eventList);

            var eventstate = line.processState(EVENT_THREAD);
            var eventstate2 = line2.processState(EVENT_THREAD);

            console.log(line2.eventThread.eventList);
            console.log(line2.stateMatchines[EVENT_THREAD]);

            //Next step
            //Setup the new line and pass the state.
            line3 = new HashLine(person2, person2, [...contributors, person2]);
            line3.initialize(threadid);
            line3.assignMachine(msmConstructor);
            line3.assignMachine(csm, EVENT_THREAD);

            line3.assignState(_transferredState.storedState, EVENT_THREAD);
            line3.assignTails(_transferredTails, EVENT_THREAD);

            tms3 = new TestMessageService(line3.name);
            tms3.assignLine(line3);

        }).then(sendMesses).then(() => {
            line2.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 5' }, EVENT_THREAD);
            line3.sendEvent({ type: CSM.UPDATE, name: 'LINE3', value: 'an event 3' }, EVENT_THREAD);
        }).then(sendMesses).then(() => {
        }).then(sendMesses).then(() => {
            var l3state = line3.getState(EVENT_THREAD);
            assert.ok(l3state);
            assert.ok(line3.eventThread.eventList.length);
            assert.ok(line2.eventThread.eventList.length);
            assert.ok(line.eventThread.eventList.length);

            console.log(line3.eventThread.eventTails);
            console.log(line2.eventThread.eventTails);
            console.log(line.eventThread.eventTails);


            line.applyThread(EVENT_THREAD);
            line2.applyThread(EVENT_THREAD);
            line3.applyThread(EVENT_THREAD);

            console.log(line.eventThread.eventList);
            console.log(line.contributors);
            console.log(line3.getState(EVENT_THREAD));
            console.log(line2.getState(EVENT_THREAD));
            console.log(line.getState(EVENT_THREAD));
            console.log(line2.eventThread.eventList);
            assert.ok(line2.eventThread.eventList.length === 0);
            assert.ok(line.eventThread.eventList.length === 0);
            assert.ok(line3.eventThread.eventList.length === 0);
        }).then(() => {
            done();
        });
    });


    it('process state machines , approved, async, continue with 3rd line , sent init to 3rd line', (done) => {
        var self = 'self';
        var person = 'person';
        var person2 = 'person2';
        var contributors = [self, person];
        var threadid = 'thread-1';
        var line = new HashLine(self, self, [...contributors]);
        var line2 = new HashLine(person, person, [...contributors]);
        var line3;
        line.initialize(threadid);
        line2.initialize(threadid);
        var tms = new TestMessageService(line.name);
        var tms3;
        var sendMesses = function () {
            if (tms3) {
                console.log('sending on tms3');
            }
            var p = Promise.all([
                tms.sendMessages(self),
                tms2.sendMessages(person),
                tms3 ? tms3.sendMessages(person2) : null
            ].filter(t => t));
            TestMessageService.globalStep();
            return p;
        }

        var msmConstructor = function () {
            return new MembershipStateMachine({
                contributors
            });
        }
        var csm = function () {
            return new CatStateMachine({
            });
        }
        line.assignMachine(msmConstructor);
        line.assignMachine(csm, EVENT_THREAD);

        line2.assignMachine(msmConstructor);
        line2.assignMachine(csm, EVENT_THREAD);

        var newstate2 = line2.processState(MEMBERSHIP_THREAD);

        tms.assignLine(line);

        var tms2 = new TestMessageService(line2.name);
        tms2.assignLine(line2);

        var EVENT = 'EVENT';

        sendMesses().then(() => {
            line.sendEvent({
                type: MA.INITIALIZE_STATE
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.REQUEST_CONTRIBUTOR_ADD,
                connectionInfo: new IConnectionInfo(person2, {
                    thread: threadid,
                    threadType: EVENT_THREAD
                })
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);
            console.log(line.threads[MEMBERSHIP_THREAD].thread.eventList[0])
        }).then(sendMesses).then(() => {
            line2.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: person,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.ADD_CONTRIBUTOR,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 1' });
            line.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 2' });
            line.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 3' });
            line.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 4' });
            line2.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 5' });
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.UPDATE_THREAD,
                from: self,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var { state, time } = line.processState(EVENT_THREAD);
            line.sendEvent({
                type: MA.THREAD_CUT_OFF,
                from: self,
                time: 2000,
                storedState: {
                    EVENT_THREAD: {
                        state,
                        time
                    }
                },
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var range = line.getCutRanges(EVENT_THREAD);
            line.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                from: self,
                time: 2000,
                range,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var range = line2.getCutRanges(EVENT_THREAD);
            line2.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                from: person,
                time: 2000,
                range,
                thread: threadid
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {
            var newstate = line.processState(MEMBERSHIP_THREAD);
            var newstate2 = line2.processState(MEMBERSHIP_THREAD);
            assert.ok(newstate);
            assert.ok(newstate2);
            console.log(newstate);
            console.log(newstate2);
            assert.ok(newstate2.state.state === MA.THREAD_CUT_APPROVED, `${newstate2.state} !== ${MA.THREAD_CUT_APPROVAL}`);
            assert.ok(newstate.state.state === MA.THREAD_CUT_APPROVED);

            //Next step
            //Setup the new line and pass the state.
            line3 = new HashLine(person2, person2, [...contributors, person2]);
            line3.initialize(threadid);
            line3.assignMachine(msmConstructor);
            line3.assignMachine(csm, EVENT_THREAD);
        }).then(sendMesses).then(() => {
            var newstate = line.processState(MEMBERSHIP_THREAD);
            line.adjustContributors();
            line2.adjustContributors();
            assert.ok(!line2.eventThread.eventList.length);
            assert.ok(!line.eventThread.eventList.length);
            assert.ok(line);
            assert.ok(line.threads[EVENT_THREAD].thread.eventList);

            var eventstate = line.processState(EVENT_THREAD);
            var eventstate2 = line2.processState(EVENT_THREAD);


            var _transferredState = line.getState(MEMBERSHIP_THREAD);
            var _transferredTails = line.getTails(EVENT_THREAD);

            line2.sendMessage({
                from: person,
                to: person2,
                message: {
                    type: ET.JOIN,
                    state: _transferredState.storedState,
                    thread: newstate.state.thread,
                    threadType: newstate.state.threadType,
                    tails: _transferredTails
                }
            })
            tms3 = new TestMessageService(line3.name);
            tms3.assignLine(line3);

        }).then(sendMesses).then(() => {
            line2.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 5' }, EVENT_THREAD);
            line3.sendEvent({ type: CSM.UPDATE, name: 'LINE3', value: 'an event 3' }, EVENT_THREAD);
        }).then(sendMesses).then(() => {
        }).then(sendMesses).then(() => {
            var l3state = line3.getState(EVENT_THREAD);
            assert.ok(l3state);
            console.log(l3state);
            console.log(line2.getState(EVENT_THREAD));
            assert.ok(l3state.EVENT)
            assert.ok(line3.eventThread.eventList.length);
            assert.ok(line2.eventThread.eventList.length);
            assert.ok(line.eventThread.eventList.length);

            line.applyThread(EVENT_THREAD);
            line2.applyThread(EVENT_THREAD);
            line3.applyThread(EVENT_THREAD);

            assert.ok(line2.eventThread.eventList.length === 0);
            assert.ok(line.eventThread.eventList.length === 0);
            assert.ok(line3.eventThread.eventList.length === 0);
        }).then(() => {
            done();
        });
    });


    it('process state machines , approved, async, continue with 3rd line , sent init to 3rd line, remove a person', (done) => {
        var self = 'self';
        var person = 'person';
        var person2 = 'person2';
        var contributors = [self, person];
        var threadid = 'thread-1';
        var line = new HashLine(self, self, [...contributors]);
        var line2 = new HashLine(person, person, [...contributors]);
        var line3;
        line.initialize(threadid);
        line2.initialize(threadid);
        var tms = new TestMessageService(line.name);
        var tms3;
        var sendMesses = function () {
            if (tms3) {
                console.log('sending on tms3');
            }
            var p = Promise.all([
                tms.sendMessages(self),
                tms2.sendMessages(person),
                tms3 ? tms3.sendMessages(person2) : null
            ].filter(t => t));
            TestMessageService.globalStep();
            return p;
        }

        var msmConstructor = function () {
            return new MembershipStateMachine({
                contributors
            });
        }
        var csm = function () {
            return new CatStateMachine({
            });
        }
        line.assignMachine(msmConstructor);
        line.assignMachine(csm, EVENT_THREAD);

        line2.assignMachine(msmConstructor);
        line2.assignMachine(csm, EVENT_THREAD);

        var newstate2 = line2.processState(MEMBERSHIP_THREAD);

        tms.assignLine(line);

        var tms2 = new TestMessageService(line2.name);
        tms2.assignLine(line2);

        var EVENT = 'EVENT';

        sendMesses().then(() => {
            line.sendEvent({
                type: MA.INITIALIZE_STATE
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.REQUEST_CONTRIBUTOR_ADD,
                connectionInfo: new IConnectionInfo(person2, {
                    thread: threadid,
                    threadType: EVENT_THREAD
                })
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);
            console.log(line.threads[MEMBERSHIP_THREAD].thread.eventList[0])
        }).then(sendMesses).then(() => {
            line2.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: person,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.ADD_CONTRIBUTOR,
                from: self,
                name: person2
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 1' });
            line.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 2' });
            line.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 3' });
            line.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 4' });
            line2.sendEvent({ type: CSM.UPDATE, name: EVENT, value: 'an event 5' });
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.UPDATE_THREAD,
                from: self,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var { state, time } = line.processState(EVENT_THREAD);
            line.sendEvent({
                type: MA.THREAD_CUT_OFF,
                from: self,
                time: 2000,
                storedState: {
                    EVENT_THREAD: {
                        state,
                        time
                    }
                },
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var range = line.getCutRanges(EVENT_THREAD);
            line.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                from: self,
                time: 2000,
                range,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var range = line2.getCutRanges(EVENT_THREAD);
            line2.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                from: person,
                time: 2000,
                range,
                thread: threadid
            }, ET.MEMBERSHIP);

        }).then(sendMesses).then(() => {
            var newstate = line.processState(MEMBERSHIP_THREAD);
            var newstate2 = line2.processState(MEMBERSHIP_THREAD);
            assert.ok(newstate);
            assert.ok(newstate2);

            assert.ok(newstate2.state.state === MA.THREAD_CUT_APPROVED, `${newstate2.state.state} !== ${MA.THREAD_CUT_APPROVAL}`);
            assert.ok(newstate.state.state === MA.THREAD_CUT_APPROVED);

            //Next step
            //Setup the new line and pass the state.
            line3 = new HashLine(person2, person2, [...contributors, person2]);
            line3.initialize(threadid);
            line3.assignMachine(msmConstructor);
            line3.assignMachine(csm, EVENT_THREAD);
        }).then(sendMesses).then(() => {
            var newstate = line.processState(MEMBERSHIP_THREAD);
            line.adjustContributors();
            line2.adjustContributors();
            assert.ok(!line2.eventThread.eventList.length);
            assert.ok(!line.eventThread.eventList.length);
            assert.ok(line);
            assert.ok(line.threads[EVENT_THREAD].thread.eventList);

            var eventstate = line.processState(EVENT_THREAD);
            var eventstate2 = line2.processState(EVENT_THREAD);


            var _transferredState = line.getState(MEMBERSHIP_THREAD);
            var _transferredTails = line.getTails(EVENT_THREAD);

            line2.sendMessage({
                from: person,
                to: person2,
                message: {
                    type: ET.JOIN,
                    thread: newstate.state.thread,
                    threadType: newstate.state.threadType,
                    tails: _transferredTails
                }
            })
            console.log({
                type: ET.JOIN,
                state: _transferredState.storedState,
                thread: newstate.state.thread,
                threadType: newstate.state.threadType,
                tails: _transferredTails
            })
console.log( {
    type: ET.JOIN,
    state: _transferredState.storedState,
    thread: newstate.state.thread,
    threadType: MEMBERSHIP_THREAD,
    tails: line.getTails(MEMBERSHIP_THREAD)
});
            line2.sendMessage({
                from: person,
                to: person2,
                message: {
                    type: ET.JOIN,
                    state: _transferredState.storedState,
                    thread: newstate.state.thread,
                    threadType: MEMBERSHIP_THREAD,
                    tails: line.getTails(MEMBERSHIP_THREAD)
                }
            });

            tms3 = new TestMessageService(line3.name);
            tms3.assignLine(line3);

        }).then(sendMesses).then(() => {
            line2.sendEvent({
                type: CSM.UPDATE,
                name: EVENT,
                value: 'an event 5'
            }, EVENT_THREAD);
            line3.sendEvent({ type: CSM.UPDATE, name: 'LINE3', value: 'an event 3' }, EVENT_THREAD);
        }).then(sendMesses).then(() => {
        }).then(sendMesses).then(() => {
            var l3state = line3.getState(EVENT_THREAD);
            assert.ok(l3state);
            console.log(l3state);
            console.log(line2.getState(EVENT_THREAD));
            assert.ok(l3state.EVENT)
            assert.ok(line3.eventThread.eventList.length);
            assert.ok(line2.eventThread.eventList.length);
            assert.ok(line.eventThread.eventList.length);

            line.applyThread(EVENT_THREAD);
            line2.applyThread(EVENT_THREAD);
            line3.applyThread(EVENT_THREAD);


            line.applyThread(MEMBERSHIP_THREAD);
            line2.applyThread(MEMBERSHIP_THREAD);
            line3.applyThread(MEMBERSHIP_THREAD);

            assert.ok(line2.eventThread.eventList.length === 0);
            assert.ok(line.eventThread.eventList.length === 0);
            assert.ok(line3.eventThread.eventList.length === 0);
        }).then(() => {
            line.sendEvent({
                type: MA.INITIALIZE_STATE
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.REQUEST_CONTRIBUTOR_REMOVE,
                thread: threadid,
                threadType: EVENT_THREAD,
                name: person
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var temp = line.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_REMOVE,
                from: self,
                name: person
            }, ET.MEMBERSHIP);
            var temp2 = line3.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_REMOVE,
                from: person2,
                name: person
            }, ET.MEMBERSHIP);
            console.log('line 3 sent message --------------- ^^^^^^^^^^ ')
            targetEvent = [temp, temp2];
        }).then(sendMesses).then(() => {
        }).then(sendMesses).then(() => {
            var newstate2 = line.processState(MEMBERSHIP_THREAD);
            console.log(newstate2.state);
            assert.equal(newstate2.state.state, MA.REMOVE_CONTRIBUTOR);
        }).then(sendMesses).then(() => {
            line.sendEvent({
                type: MA.UPDATE_THREAD,
                from: self,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var newstate2 = line.processState(MEMBERSHIP_THREAD);
            console.log('thread -cut -off - &&&&&&&&&&&&&&&&&')
            console.log(newstate2.state);
            assert.equal(newstate2.state.state, MA.UPDATE_THREAD);

            var { state, time } = line.processState(EVENT_THREAD);
            line.sendEvent({
                type: MA.THREAD_CUT_OFF,
                from: self,
                storedState: {
                    EVENT_THREAD: {
                        state,
                        time
                    }
                },
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var newstate2 = line.processState(MEMBERSHIP_THREAD);
            console.log(newstate2.state);
            assert.equal(newstate2.state.state, MA.THREAD_CUT_OFF);

            var range = line.getCutRanges(EVENT_THREAD);
            line.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                from: self,
                range,
                thread: threadid
            }, ET.MEMBERSHIP);
        }).then(sendMesses).then(() => {
            var newstate2 = line.processState(MEMBERSHIP_THREAD);
            console.log(newstate2.state);
            assert.equal(newstate2.state.state, MA.THREAD_CUT_OFF);

            var range = line3.getCutRanges(EVENT_THREAD);
            line3.sendEvent({
                type: MA.THREAD_CUT_APPROVAL,
                from: person2,
                range,
                thread: threadid
            }, ET.MEMBERSHIP);
            console.log(line3.getThread(MEMBERSHIP_THREAD).eventTails)
        }).then(sendMesses).then(() => {
        }).then(sendMesses).then(() => {
            var newstate = line.processState(MEMBERSHIP_THREAD);
            var newstate2 = line2.processState(MEMBERSHIP_THREAD);
            assert.ok(newstate);
            assert.ok(newstate2);

            console.log(line.getThread(MEMBERSHIP_THREAD).eventList.length);
            console.log(line.getThread(MEMBERSHIP_THREAD).getCompletedEvents().length);

            console.log(line3.getThread(MEMBERSHIP_THREAD).eventList.length);
            console.log(line3.getThread(MEMBERSHIP_THREAD).getCompletedEvents().length);

            console.log(newstate.state);
            console.log(newstate2.state);

            assert.ok(newstate2.state.state === MA.THREAD_CUT_APPROVED, `${newstate2.state.state} !== ${MA.THREAD_CUT_APPROVED}`);
            assert.ok(newstate.state.state === MA.THREAD_CUT_APPROVED);

        }).then(() => {
            done();
        });
    });
});