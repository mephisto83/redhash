import * as Util from './util';
import HashEvent from './hashevent';
import * as HE from './hashevent';
import HashSysEvent from './events/hashsysevent';
//Hash thread is a single hash graph structure, whose contributors are 
//is an mutable list

export default class HashThread {
    constructor(contribs, self) {
        //A list of contributors
        this.contributors = (contribs || []).sort();
        this.self = self;
        //List of events that have occurred, only contributors
        //may add to this list.
        this.eventList = [];
        this.listeners = [];

    }

    //Copy
    static copy(thread) {
        var duplicate = new HashThread([...(thread.contributors || [])], thread.self);
        duplicate.eventList = [...(thread.eventList || [])];
        duplicate.listeners = [...(thread.listeners || [])];
        duplicate._id = thread.id;
        return duplicate
    }

    //Creates a new instance of a thread.
    static createThread(self, contributors) {
        return new HashThread(contributors || [self], self);
    }

    //Listene to events
    listen(_onEvent, handler) {
        var id = Util.GUID();
        this.listeners.push({ _onEvent, handler, id });

        return id;
    }

    //Adds a contributor
    contributorAdd(contributor) {
        this.contributors = [...this.contributors, contributor].sort();
    }

    //Contributors can be removed from a thread.
    contributorRemove(contributor) {
        this.contributors = [...this.contributors.filter(t => t !== contributor)].sort();
    }
    getConsensusEvents() {
        var me = this;
        return me.eventList.filter(t => {
            return HashEvent.hasReachedConsensus(t, me.contributors.length)
        });
    }
    getListEvent(index) {
        var me = this;
        return me.eventList[index];
    }
    getContributorsWhoHaventSeenTheMessage(evnt) {
        return HashEvent.getUnnotifiedContributors(evnt, this.contributors);
    }
    getContributorsSeenBy(evnt){
        return HashEvent.getNotifiedContributors(evnt, this.contributors);
    }
    // A new event created by the local client.
    sendEvent(hashEvent) {
        if (hashEvent instanceof HashEvent) {
            var newevent = hashEvent
                .stamp(this.self)
                .setupMeta(this.contributors.length)
                .setMetaSelfReceived(this.self, this.contributors);

            this.eventList.push(newevent);
            this.raiseEvent(HashThread.SENDEVENT, newevent);
        }
    }

    // Raise Event 
    raiseEvent(evt, args) {
        this.listeners.filter(t => t._onEvent === evt).map(t => {
            t.handler(args);
        });
    }

    // An event received from the outside world.
    receiveEvent(hashEvent) {
        var _hashEvent = HashEvent.create(hashEvent);
        if (_hashEvent) {
            if (!this.eventList.find(t => t.id === hashEvent.id)) {
                var newevent = hashEvent.stamp(this.self);
                this.eventList.push(newevent);
                switch (hashEvent.type) {
                    case HE.ADD_CONTRIBUTOR:
                        this.raiseEvent(HashThread.SYSEVENT, newevent);
                        break;
                    default:
                        this.raiseEvent(HashThread.RECEIVEEVENT, newevent);
                        break;
                }

            }
        }
    }

    //Event seen by all
    eventSeenByAll(hashEvent) {
        var history = hashEvent.getHistory();
        return !this.contributors.find(t => {
            if (!history[t]) {
                return true
            }
            return false;
        });
    }

    //Contributors who havent seen event.
    contributorsWhoHaventSeenEvent(hashEvent) {
        var history = hashEvent.getHistory();
        return this.contributors.filter(t => {
            if (!history[t]) {
                return true
            }
            return false;
        });
    }

    //Add stamp listener
    addStampListener(func) {

    }

    // uniquely identifies the thread.
    get id() {
        if (this._id) {
            this._id = Util.GUID();
        }
        return this._id;
    }
}

HashThread.SENDEVENT = 'SENDEVENT';
HashThread.SYSEVENT = 'SYSEVENT';
HashThread.RECEIVEEVENT = 'RECEIVEEVENT';