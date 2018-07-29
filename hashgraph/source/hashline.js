import HashThread from './hashthread';
const MEMBERSHIP_THREAD = 'MEMBERSHIP_THREAD';
const EVENT_THREAD = 'EVENT_THREAD';
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
        this.name = name;
        this._self = self;
        this.contributors = contributors || [self];
    }
    static createLine(name, self) {
        return new HashLine(name, self);
    }
    initialize() {
        var me = this;
        if (!me.memberShipLine) {
            me.createThread(MEMBERSHIP_THREAD, me.contributors);
        }
        if(!me.eventThread){
            me.createThread(EVENT_THREAD, me.contributors);
        }
    }
    //Creates a new thread.
    createThread(name, contributors) {
        var newthread = HashThread.createThread(this.self, contributors);
        newthread.name = name;
        this.threads[name] = {
            thread: newthread
        };

        return this;
    }

    getThread(id) {
        return this.threads[id] || null;
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

    get eventThread(){
        return this.getThread(EVENT_THREAD);
    }
}