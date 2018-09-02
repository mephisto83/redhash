import assert from 'assert';
import HashLine from './hashline';
import TestMessageService from './testmessageservice';
import * as HThread from './hashthread';
import { MEMBERSHIP } from './eventtypes';
import MembershipStateMachine from './statemachines/membershipstatemachine';
describe('HashLine', function () {
    it('can create a hash line', () => {
        var line = new HashLine('line', 'self');
        assert.ok(line);
    });

    it('can create initial has line setup', () => {
        //Two threads, membership thread, and a event thread.
        var tms = new TestMessageService('1');
        var line = new HashLine('line', 'self');
        line.initialize();
        tms.assignLine(line);
        console.log(line.membershipThread);
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
        line.sendEvent('event', MEMBERSHIP);
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
        line.sendEvent('event', MEMBERSHIP);
        TestMessageService.globalStep();

        var eventsToSend = line.getEventsToSend();
        console.log(eventsToSend[0])
        var destinations = line.getNextPossibleDestinationsFor(eventsToSend[0]);
        assert.ok(destinations);
        assert.ok(destinations.length === 1, 'should expect one place to send to');
        assert.ok(destinations[0]);
        console.log(destinations[0]);
    });

    it.only('can get messages to send to  a person', (done) => {
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
        line.sendEvent('event', MEMBERSHIP);

        var eventsToSend = line.getEventsToSend();
        console.log(eventsToSend[0])
        var messages = line.getMessageToSendTo(person);
        assert.ok(messages);
        assert.ok(messages.length === 1, 'should expect one place to send to');
        assert.ok(messages[0]);
        console.log(messages[0]);

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
});