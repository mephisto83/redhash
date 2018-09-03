import assert from 'assert';
import HashLine from './hashline';
import HashEvent from './hashevent';
import TestMessageService from './testmessageservice';
import * as HThread from './hashthread';
import ET from './eventtypes';
import { MEMBERSHIP_THREAD } from './hashline';
import IConnectionInfo from './statemachines/iconnectioninfo';
import * as MA from './statemachines/membershipactions';
import MembershipStateMachine from './statemachines/membershipstatemachine';
describe('HashLine', function () {
    it('can create a hash line', () => {
        var line = new HashLine('line', 'self');
        assert.ok(line);
    });
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


    it('process state machines', () => {
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

        line.sendEvent({
            type: MA.INITIALIZE_STATE
        }, ET.MEMBERSHIP);

        sendMesses();

        line.sendEvent({
            type: MA.REQUEST_CONTRIBUTOR_ADD,
            connectionInfo: new IConnectionInfo(person2, {
                thread: threadid
            })
        }, ET.MEMBERSHIP);

        sendMesses();


        line.sendEvent({
            type: MA.ACCEPT_CONTRIBUTOR_ADD,
            from: self,
            name: person2
        }, ET.MEMBERSHIP);
        sendMesses();

        line2.sendEvent({
            type: MA.ACCEPT_CONTRIBUTOR_ADD,
            from: person,
            name: person2
        }, ET.MEMBERSHIP);
        sendMesses();


        sendMesses();

        line.sendEvent({
            type: MA.ADD_CONTRIBUTOR,
            from: self,
            name: person2
        }, ET.MEMBERSHIP);

        sendMesses();

        var newstate = line.processState(MEMBERSHIP_THREAD)
        var newstate2 = line2.processState(MEMBERSHIP_THREAD)
        // console.log(line.membershipThread.eventList);
        assert.ok(newstate);
        assert.ok(newstate2);
        console.log(line.stateMatchines[MEMBERSHIP_THREAD].state);
        console.log(newstate2);
        assert.ok(newstate2.state === MA.ADD_CONTRIBUTOR);
        assert.ok(newstate.state === MA.ADD_CONTRIBUTOR);
    });
});