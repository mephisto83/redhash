import * as Util from './util';
import HashEvent from './hashevent';
import * as HE from './hashevent';
export const _documentation = {
    id: {
        type: 'string',
        description: 'The unique id of the thread'
    },
    contributors: {
        type: 'array',
        description: 'an immutable list of entities that contribute to the thread'
    },
    threadId: {
        type: 'string',
        description: 'Is a unique id of the thread shared across contributors'
    },
    eventIndex: {
        type: 'number',
        description: 'A number representing the last event created from this client'
    },
    self: {
        type: 'string',
        description: 'The clients own thread contributor name/id'
    },
    eventHeads: {
        type: 'object',
        description: 'A dictionary of the last known events produced by contributors'
    },
    eventTails: {
        type: 'object',
        description: 'A dictionary of the earliest know events produced by a contributor'
    },
    eventList: {
        type: 'array',
        description: 'A list of events produced by the contributors, this is the thread'
    },
    sentEvents: {
        type: 'object',
        description: 'A dictionary that will remember which events were sent successfully to other contributors on the thread'
    },
    listeners: {
        type: 'array',
        description: 'A list of event handlers '
    },
    init: {
        type: 'function',
        description: 'Initializes the hash thread'
    },
    sortEvents: {
        type: 'function',
        description: 'Sorts the events into the order that they "occurred"'
    },
    copy: {
        type: 'function',
        description: 'creates a duplicate thread'
    },
    createThread: {
        type: 'function',
        description: 'Create a thread'
    },
    listen: {
        type: 'function',
        description: 'Adds a handler for specific events'
    },
    contributorAdd: {
        type: 'function',
        description: 'Adds a contributor.'
    },
    contributorRemove: {
        type: 'function',
        description: 'Removes a contributor'
    },
    getCompletedEvents: {
        type: 'function',
        description: 'Gets the completed events'
    },
    getConsensusEvents: {
        type: 'function',
        description: 'Gets events that have reached consensus'
    },
    getNonConsensusEvents: {
        type: 'function',
        description: 'Gets events that have not reached consensus'
    },
    printEvents: {
        type: 'function',
        description: 'Prints events to the console.'
    },
    getNextPossibleDestinationsFor: {
        type: 'function',
        description: 'Gets the next event to send to a contributor'
    },
    getEventsToSend: {
        type: 'function',
        description: 'gets events to send'
    },
    getEvent: {
        type: 'function',
        description: 'Gets event by id'
    },
    getListEvent: {
        type: 'function',
        description: 'Gets list of events'
    },
    getContributorsWhoHaventSeenTheMessage: {
        type: 'function',
        description: 'Gets contributors which are not known to have seen the message'
    },
    getContributorsSeenBy: {
        type: 'function',
        description: 'Gets contributors which have been known to have seen message'
    },
    sendEvent: {
        type: 'function',
        description: 'Send an event'
    },
    sentEventSuccessfully: {
        type: 'function',
        descriptions: 'Records that messages have been sent successfully'
    },
    raiseEvent: {
        type: 'function',
        description: 'Raise an event'
    },
    receiveEvent: {
        type: 'function',
        description: 'Receives an event'
    },
    eventSeenByAll: {
        type: 'function',
        description: 'Returns true if the event has been seen by all.'
    },
    contributorsWhoHaventSeenEvent: {
        type: 'function',
        description: 'Returns contributors who havent see the event'
    }
}
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
        // A dictionary of event heads from the contributors.
        this.eventHeads = {};
        // A dictionary of event tails from the contributors.
        // The olded events received from each contributor, still in the eventList.
        this.eventTails = {};
        //List of events that have occurred, only contributors
        //may add to this list.
        this.eventList = [];
        this.sentEvents = {

        };
        this.listeners = [];
        this.init();
    }
    init() {
        this.initTailEvents();
        this.listen(UPDATEEVENT, this.handleUpdateEvent.bind(this));
        this.listen(RECEIVEEVENT, this.handleReceivedEvent.bind(this));
        this.listen(EVENTUPDATED, this.handleUpdatedEvent.bind(this));
    }
    sortEvents() {
        this.eventList = [...this.eventList.sort((a, b) => {
            if (a.eventSource === b.eventSource) {
                return a.eventIndex - b.eventIndex;
            }
            if (a.time !== b.time)
                return a.time - b.time;
            return a.id.localeCompare(b.id);
        })]
    }
    handleUpdateEvent(evt) {
        var me = this;
        var { update, original, from } = evt;

        if (original && update) {
            HashEvent.combine(update, original);
            if (original instanceof HashEvent) {
                original.setMetaEvidence(from, this.self);
                this.eventHeads[from] = Math.max(this.eventHeads[from] || 0, original.eventIndex);
            }
            this.sortEvents();
        }
    }
    initTailEvents() {
        var me = this;
        this.contributors.map(t => {
            me.eventTails[t] = 0;
        })
    }
    handleReceivedEvent(args) {
        if (args) {
            var { event, from } = args;
            if (event instanceof HashEvent) {
                event.setMetaEvidence(from, this.self);
                this.raiseEvent(EVENTUPDATED, args);

                this.eventHeads[from] = Math.max(this.eventHeads[from] || 0, event.eventIndex);

            }
        }
    }
    handleUpdatedEvent(evt) {
        if (evt) {
            var { event } = evt;
            // var contributors = HashEvent.getContributorsNeedingUpdates(event, this.self, this.contributors);

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
    static createThread(self, contributors, threadid) {
        return new HashThread(contributors || [self], self, threadid);
    }

    applyThread() {
        var thread = this;
        var events = thread.eventList.filter(evt => {
            return !(HashEvent.hasReachedCompleted(evt, thread.contributors.length));
        });

        var result = thread.eventList.filter(t => {
            return events.indexOf(t) === -1;
        });

        var contributors = this.contributors;
        thread.eventTails = thread.extractEventTails(result, contributors);
        thread.setEventList(events);
    }

    static branchThread(thread, ops) {
        var { contributors, startTime } = ops;
        //Select events that will continue into the future.
        var events = thread.eventList.filter(evt => {
            return !(HashEvent.hasReachedCompleted(evt, thread.contributors.length) && evt.time <= startTime);
        }).map(evt => {
            return evt.applyContributors(contributors);
        });
        var result = thread.eventList.filter(t => {
            return events.indexOf(t) === -1;
        })

        thread.contributors = contributors;

        thread.setEventList(events);

        return result;
    }
    extractEventTails(events, contributors) {
        var tails = { ...this.eventTails };
        contributors.map(c => {
            if (!tails.hasOwnProperty(c)) {
                tails[c] = 0;
            }
        })
        events.map(evt => {
            if (tails.hasOwnProperty(evt.eventSource) && tails[evt.eventSource] < evt.eventIndex) {
                tails[evt.eventSource] = evt.eventIndex;
            }
        })
        return tails;
    }
    setEventList(events) {
        this.eventList = [...events];
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
        var found = false;
        var contribStreamIndexes = { ...me.eventTails };

        return me.eventList.filter(t => {
            var res = HashEvent.hasReachedCompleted(t);
            if (!res) {
                found = true;
            }
            if (contribStreamIndexes.hasOwnProperty(t.eventSource)) {
                if (contribStreamIndexes[t.eventSource] === t.eventIndex - 1) {
                    contribStreamIndexes[t.eventSource] = t.eventIndex;
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }
            return res && !found;
        });
    }
    getConsensusEvents() {
        var me = this;
        var found = false;

        return me.getCompletedEvents();
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

        return HashEvent.getUncontacted(evnt, me.self);
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
    getEvents() {
        return [...this.eventList];
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
                .setSource(this.self)
                .stamp(this.self, this.eventIndex, this.threadId);

            this.eventHeads[this.self] = Math.max(this.eventHeads[this.self] || 0, newevent.eventIndex);
            this.eventList.push(newevent);
            this.sortEvents();
            this.raiseEvent(SENDEVENT, newevent);
            return newevent;
        }
    }
    sendEventId(evt, person) {
    }
    sentEventSuccessfully( updateEvent) {
        var eventId = updateEvent.id;
        var evt = this.eventList.find(t => t.id === eventId);
        if (evt instanceof HashEvent) {
            // evt.setMetaEvidence(to, this.self, this.contributors);

            if (updateEvent && updateEvent.id === evt.id) {
                evt.applyHistory(updateEvent.history);
            }
            else {
                throw 'not applying history';
            }

            this.eventHeads[this.self] = Math.max(this.eventHeads[this.self], evt.eventIndex);
            this.sortEvents();
        }
        else {
            throw 'not a hash event'
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
            evnt = this.eventList.find(t => t.id === hashEvent.id);
            return evnt;
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
        if (!this._id) {
            this._id = Util.GUID();
        }
        return this._id;
    }
    // Get the l
    get time() {
        if (this.eventList && this.eventList.length) {
            return this.eventList[this.eventList.length - 1].time;
        }
        return null;
    }
}

export const SENDEVENT = 'SENDEVENT';
export const SYSEVENT = 'SYSEVENT';
export const RECEIVEEVENT = 'RECEIVEEVENT';
export const UPDATEEVENT = 'UPDATEEVENT';
export const EVENTUPDATED = 'EVENTUPDATED';