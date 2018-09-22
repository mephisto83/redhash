import HashThread from './hashthread';
import * as Util from './util';
import * as HThread from './hashthread';
import HashEvent from './hashevent';
import ET from './eventtypes';
import * as MA from './statemachines/membershipactions';
export const MEMBERSHIP_THREAD = 'MEMBERSHIP_THREAD';
export const EVENT_THREAD = 'EVENT_THREAD';
export default class HashLine {
    constructor(name, self, contributors) {
        if (!name) {
            throw 'HashLine: name required';
        }
        if (!self) {
            //You have to give your self an identity;
            throw 'Hashline: self required';
        }
        this.threads = {};
        this.threadListeners = {};
        this.name = name;
        this._self = self;
        this.listeners = [];
        this.stateMatchines = {};
        this.contributors = contributors || [self];
        this.contributors.sort();
    }
    assignMachine(stateMachineConstructor, thread) {
        thread = thread || MEMBERSHIP_THREAD;

        this.stateMatchines[thread] = stateMachineConstructor();
    }
    assignState(state, thread) {
        if (this.stateMatchines && this.stateMatchines[thread] && state && state[thread] && state[thread].state) {
            this.stateMatchines[thread].applyState(state[thread].state);
        } else {
            console.warn('no state assigned');
        }
    }
    assignTails(tails, thread) {
        var _thread = this.getThread(thread);
        _thread.eventTails = tails;
    }
    applyThread(thread) {
        var { state, events } = this.processState(thread);
        this.assignState({ [thread]: { state } }, thread);
        this.getThread(thread).applyThread();
    }
    processStateEvents(threadId, events) {
        if (!threadId) {
            throw 'no thread id ';
        }
        var me = this;
        var thread = me.getThread(threadId);
        var sm = this.stateMatchines[threadId];
        if (sm) {
            var newstate = sm.action([...events.map(t => t.message)]);

            sm.applyState(newstate);
        }
    }
    getCutRanges(threadId) {
        if (!threadId) {
            throw 'no thread id ';
        }

        var me = this;
        var thread = me.getThread(threadId);
        var events = thread.getCompletedEvents() || [];

        if (events.length) {
            console.log(`events.length : ${events.length}`);
            console.log(events.map(t=>t.time))
            return {
                minimum: events[0].time,
                maximum: events[events.length - 1].time
            }
        }
        return {
            minimum: 0,
            maximum: 0
        }
    }

    sendEvent(msg, type) {
        var me = this;
        console.log('send event')
        if (me.membershipThread && type === ET.MEMBERSHIP) {
            console.log('send event membership')
            return me.membershipThread.sendEvent(new HashEvent(msg, type, this.contributors, this.name));
        }
        else if (me.eventThread) {
            console.log('send event event')
            return me.eventThread.sendEvent(new HashEvent(msg, type, this.contributors, this.name));
        }
    }
    getState(thread) {
        var newstate = this.processState(thread);
        return newstate.state;
    }
    getTails(thread) {
        return { ...this.getThread(thread).eventTails };
    }
    adjustContributors() {
        var newstate = this.processState(MEMBERSHIP_THREAD);
        if (newstate && newstate.state) {
            switch (newstate.state.state) {
                case MA.THREAD_CUT_APPROVED:
                    var { state, events, time } = newstate;
                    this.stateMatchines[MEMBERSHIP_THREAD].adjustContributors(state);

                    var thread = this.getThread(state.threadType);
                    if (thread.threadId === state.thread) {
                        var completedEvents = HashThread.branchThread(thread, {
                            contributors: [...state.proposed],
                            startTime: state.time
                        });
                        this.contributors = [...state.proposed];
                        this.contributors.sort();
                        thread.eventTails = thread.extractEventTails(completedEvents, state.proposed);
                        this.processStateEvents(state.threadType, completedEvents);
                        var membershipThread = this.getThread(MEMBERSHIP_THREAD);
                        membershipThread.eventTails = membershipThread.extractEventTails(events, state.proposed);
                    }
                    break;
            }
        }
    }

    processState(threadId) {
        if (!threadId) {
            throw 'no thread id ';
        }
        var me = this;
        var thread = me.getThread(threadId);
        var sm = this.stateMatchines[threadId];
        var events = thread.getCompletedEvents() || [];
        var newstate = sm.action([...events.map(t => t.message)]);

        return {
            state: newstate,
            events,
            time: events && events.length ? events[events.length - 1].time : null
        };
    }


    receiveEvent(msg, from) {
        var me = this;
        var reply = null;
        var hashmsg;

        switch (msg._type) {
            case ET.MEMBERSHIP:
                hashmsg = HashEvent.create(msg);
                reply = me.membershipThread.receiveEvent(hashmsg, from);
                break;
            case ET.SEND_MESSAGE:

                console.log('received - sent message -----------------------------------------------------------------');
                console.log(msg._type);
                reply = me.handleSentMessage(msg);
                break;
            default:
                hashmsg = HashEvent.create(msg);
                reply = me.eventThread.receiveEvent(hashmsg, from);
                break;
        }
        return reply;
    }
    handleSentMessage(msg) {
        if (msg && msg.message) {
            switch (msg.message.type) {
                case ET.JOIN:

                    var {
                        state,
                        thread,
                        threadType,
                        tails
                    } = msg.message;
console.log('JOIN FOUND ------------------')
                    this.assignState(state, threadType);
                    this.assignTails(tails, threadType);
                    break;
            }
        }
    }
    sentEventSuccessfully(evnt) {
        var me = this;
        var hashmsg = HashEvent.create(evnt);

        switch (hashmsg._type) {
            case ET.MEMBERSHIP:
                me.membershipThread.sentEventSuccessfully(hashmsg);
                break;
            default:
                me.eventThread.sentEventSuccessfully(hashmsg);
                break;
        }
    }
    getEventsToSend() {
        var me = this;
        var mt = me.membershipThread;
        var et = me.eventThread;
        var res = [];
        if (mt) {
            res = [...res, ...mt.getEventsToSend()];
        }

        if (et) {
            res = [...res, ...et.getEventsToSend()];
        }

        return res;
    }
    getMessageToSendTo(destination) {
        var me = this;
        return me.getEventsToSend().filter(t => me.getNextPossibleDestinationsFor(t).indexOf(destination) !== -1);
    }

    getMessageToSend() {
        var me = this;
        return me.getEventsToSend();
    }
    getNextPossibleDestinationsFor(evt) {
        var thread = null;
        switch (evt.type) {
            case ET.MEMBERSHIP:
                thread = this.membershipThread;
                break;
            default:
                thread = this.eventThread;
                break;
        }
        if (thread)
            return thread.getNextPossibleDestinationsFor(evt.id);
        return [];
    }

    static createLine(name, self) {
        return new HashLine(name, self);
    }

    initialize(threadid) {
        var me = this;
        if (!me.membershipThread) {
            me.createThread(MEMBERSHIP_THREAD, me.contributors, threadid);

        }
        if (!me.eventThread) {
            me.createThread(EVENT_THREAD, me.contributors, threadid);
        }
        return this;
    }


    //Creates a new thread.
    createThread(name, contributors, threadid) {
        var me = this;
        var newthread = HashThread.createThread(this.self, contributors, threadid);
        newthread.name = name;
        this.threads[name] = {
            thread: newthread
        };
        this.threadListeners[name] = [];
        var p = newthread.listen(HThread.SENDEVENT, (event) => {
            me.raiseEvent(HThread.SENDEVENT, event);
        });
        this.threadListeners[name].push(p);
        p = newthread.listen(HThread.RECEIVEEVENT, evt => {
            me.raiseEvent(HThread.RECEIVEEVENT, evt);
        });
        this.threadListeners[name].push(p);
        return this;
    }

    //Listene to events
    listen(_onEvent, handler) {
        var id = Util.GUID();
        this.listeners.push({ _onEvent, handler, id });

        return id;
    }

    // Raise Event 
    raiseEvent(evt, args) {
        this.listeners.filter(t => t._onEvent === evt).map(t => {
            t.handler(args);
        });
    }

    sendMessage(message) {
        message._type = ET.SEND_MESSAGE;
        message.line = this.name;
        this.raiseEvent(ET.SEND_MESSAGE, message);
    }

    getThread(id) {
        if (this.threads && this.threads[id])
            return this.threads[id].thread;
        return null;
    }

    // A unique id for the client;
    get self() {
        if (!this._self) {
            this._self = Util.GUID();
        }
        return this._self;
    }

    get membershipThread() {
        return this.getThread(MEMBERSHIP_THREAD);
    }

    get eventThread() {
        return this.getThread(EVENT_THREAD);
    }
}