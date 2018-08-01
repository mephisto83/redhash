import * as Util from './util';
import HashEvent from './hashevent';
import * as HE from './hashevent';
//Hash thread is a single hash graph structure, whose contributors are 
//is an mutable list

export default class HashThread {
    constructor(contribs, self, id) {
        this.threadId = id || Util.GUID();
        //A list of contributors
        this.contributors = (contribs || []).sort();
        // The event index
        // Used so that receivers know if they have received all the events.
        this.eventIndex = 0;
        this.self = self;
        this.name = null;
        // An array of event heads from the contributors.
        this.eventHeads = {};
        //List of events that have occurred, only contributors
        //may add to this list.
        this.eventList = [];
        this.sentEvents = {

        };
        this.listeners = [];
        this.init();
    }
    init() {
        this.listen(UPDATEEVENT, this.handleUpdateEvent.bind(this));
        this.listen(RECEIVEEVENT, this.handleReceivedEvent.bind(this));
        this.listen(EVENTUPDATED, this.handleUpdatedEvent.bind(this));
    }
    sortEvents() {
        this.eventList = [...this.eventList.sort((a, b) => {
            return a.time - b.time;
        })]
    }
    handleUpdateEvent(evt) {
        var me = this;
        var { update, original, from } = evt;

        if (original && update) {
            HashEvent.combine(update, original);
            if (original instanceof HashEvent) {
                original.setMetaEvidence(from, this.self, this.contributors);
                this.eventHeads[from] = Math.max(this.eventHeads[from] || 0, original.eventIndex);
            }
            this.sortEvents();
        }
    }
    handleReceivedEvent(args) {
        if (args) {
            var { event, from } = args;
            if (event instanceof HashEvent) {
                HashEvent.updateMeta(event, this.self, this.contributors, from);
                event.setMetaEvidence(from, this.self, this.contributors);
                this.raiseEvent(EVENTUPDATED, args);

                this.eventHeads[from] = Math.max(this.eventHeads[from] || 0, event.eventIndex);
            }
        }
    }
    handleUpdatedEvent(evt) {
        if (evt) {
            var { event } = evt;
            var contributors = HashEvent.getContributorsNeedingUpdates(event, this.self, this.contributors);

        }
    }
    //Copy
    static copy(thread) {
        var duplicate = new HashThread([...(thread.contributors || [])], thread.self);
        duplicate.eventList = [...(thread.eventList || [])];
        duplicate.sortEvents();
        duplicate.eventHeads = Object.assign({}, thread.eventHeads);
        duplicate.eventIndex = thread.eventIndex;
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
    getCompletedEvents() {
        var me = this;

        return me.eventList.filter(t => {
            return HashEvent.hasReachedCompleted(t, me.contributors.length)
        });
    }
    getConsensusEvents() {
        var me = this;
        return me.eventList.filter(t => {
            return HashEvent.hasReachedConsensus(t, me.contributors)
        });
    }
    getNonConsensusEvents() {
        var me = this;
        return me.eventList.filter(t => {
            return !HashEvent.hasReachedCompleted(t, me.contributors.length)
        });
    }
    printEvents() {
        var me = this;
        return me.eventList.map((t, i) => {
            console.log({
                id: t.id,
                index: i,
                consensus: HashEvent.hasReachedConsensus(t, me.contributors),
                completed: HashEvent.hasReachedCompleted(t, me.contributors.length)
            })
            t.print(me.contributors.length);
        })
    }
    getNextPossibleDestinationsFor(evntId) {
        var me = this;
        var evnt = me.getEvent(evntId);
        return HashEvent.getUncontacted(evnt, me.contributors, me.self);
    }
    _getTargeMinimum(dic) {
        var min = Infinity;
        var value = Object.keys(dic).reduce((prev, current) => {
            return Math.min(dic[prev], dic[current]);
        }, min);

        return value;
    }
    getEventsToSend() {
        var me = this;
        var evnts = me.getNonConsensusEvents();
        var res = evnts.sort((b, a) => {
            var _a = me.sentEvents[a.id] || {};
            var _b = me.sentEvents[b.id] || {};

            if (_a.count && _b.count) {
                if (_a.count === _b.count) {
                    var a_min = me._getTargeMinimum(_a.target);
                    var b_min = me._getTargeMinimum(_b.target);
                    return a_min - b_min;
                }
                return _a.count - _b.count;
            }
            else if (_a) {
                return 1;
            }
            else {
                return -1;
            }
        });
        return res;
    }
    getEvent(id) {
        var me = this;
        return me.eventList.find(t => t.id === id);
    }
    getListEvent(index) {
        var me = this;
        return me.eventList[index];
    }
    getContributorsWhoHaventSeenTheMessage(evnt) {
        return HashEvent.getUnnotifiedContributors(evnt, this.contributors);
    }
    getContributorsSeenBy(evnt) {
        return HashEvent.getNotifiedContributors(evnt, this.contributors);
    }
    // A new event created by the local client.
    sendEvent(hashEvent) {
        if (hashEvent instanceof HashEvent) {
            this.eventIndex++;
            var newevent = hashEvent
                .stamp(this.self, this.eventIndex, this.threadId)
                .setupMeta(this.contributors.length)
                .setMetaContributorReceived(this.self, this.contributors);

            this.eventHeads[this.self] = Math.max(this.eventHeads[this.self] || 0, newevent.eventIndex);
            this.eventList.push(newevent);
            this.sortEvents();
            this.raiseEvent(SENDEVENT, newevent);
        }
    }
    sendEventId(evt, person) {
    }
    sentEventSuccessfully(eventId, to) {
        var evt = this.eventList.find(t => t.id === eventId);
        if (evt instanceof HashEvent) {
            evt.setMetaEvidence(to, this.self, this.contributors);
            this.eventHeads[this.self] = Math.max(this.eventHeads[this.self], evt.eventIndex);
        }
    }

    // Raise Event 
    raiseEvent(evt, args) {
        this.listeners.filter(t => t._onEvent === evt).map(t => {
            t.handler(args);
        });
    }

    // An event received from the outside world.
    receiveEvent(_hashEvent, receivedFrom) {
        var hashEvent = HashEvent.create(_hashEvent);
        if (!receivedFrom) {
            throw 'required to have receivedFrom parameter'
        }
        if (hashEvent) {
            var evnt = this.eventList.find(t => t.id === hashEvent.id);
            if (!evnt) {
                var newevent = hashEvent.stamp(this.self);
                this.eventList.push(newevent);
                this.sortEvents();
                switch (newevent.type) {
                    case HE.ADD_CONTRIBUTOR:

                        this.raiseEvent(SYSEVENT, {
                            event: newevent,
                            from: receivedFrom
                        });
                        break;
                    default:
                        this.raiseEvent(RECEIVEEVENT, {
                            event: newevent,
                            from: receivedFrom
                        });
                        break;
                }
            }
            else {
                switch (hashEvent.type) {
                    default:
                        this.raiseEvent(UPDATEEVENT, {
                            update: hashEvent,
                            original: evnt,
                            from: receivedFrom
                        });
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

export const SENDEVENT = 'SENDEVENT';
export const SYSEVENT = 'SYSEVENT';
export const RECEIVEEVENT = 'RECEIVEEVENT';
export const UPDATEEVENT = 'UPDATEEVENT';
export const EVENTUPDATED = 'EVENTUPDATED';