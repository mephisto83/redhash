import HashThread from './hashthread';
import * as Util from './util';
import * as HThread from './hashthread';
import HashEvent from './hashevent';
import ET from './eventtypes';
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
    }
    assignMachine(stateMachineConstructor, thread) {
        thread = thread || MEMBERSHIP_THREAD;

        this.stateMatchines[thread] = stateMachineConstructor();
    }
    processState(threadId) {
        if (!threadId) {
            throw 'no thread id ';
        }
        var me = this;
        var thread = me.getThread(threadId);
        var sm = this.stateMatchines[threadId];
        var events = thread.getEvents() || [];
        var newstate = sm.action([...events.map(t => t.message)]);

        return newstate;
    }
    sendEvent(msg, type) {
        var me = this;
        if (me.membershipThread && type === ET.MEMBERSHIP) {
            me.membershipThread.sendEvent(new HashEvent(msg, type, this.contributors));
        }
        else if (me.eventThread) {
            me.eventThread.sendEvent(new HashEvent(msg, type, this.contributors));
        }
    }
    receiveEvent(msg, from) {
        var me = this;
        var reply = null;

        var hashmsg = HashEvent.create(msg);

        switch (msg._type) {
            case ET.MEMBERSHIP:
                reply = me.membershipThread.receiveEvent(hashmsg, from);
                break;
            default:
                reply = me.eventThread.receiveEvent(hashmsg, from);
                break;
        }
        return reply;
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