import * as Util from './util';
import HashMeta from './hashmeta';
import hashevent from '../../explorer/node_modules/redhashgraph/distribution/hashevent';
export const _documentation = {
    contructor: {
        type: 'constructor',
        description: 'create a hashevent object'
    },
    history: {
        type: 'object',
        description: 'a (key,value) pair dictionary, where the key is the id of the contributor and the value is the date/time the event has been seen by the contributors'
    },
    time: {
        type: 'number',
        description: 'The running average time of a received message',
    },
    message: {
        type: 'any',
        description: 'The message sent in the hash graph, to be communicated to all contributors'
    },
    eventIndex: {
        type: 'number?',
        description: 'A number representing the order of events put into on the HashGraph, these numbers are sequential from the producer.'
    },
    _type: {
        type: 'string',
        description: 'The type of the message, can be system/user defined'
    },
    id: {
        type: 'string',
        description: 'An unique id for the hashevent'
    },
    threadId: {
        type: 'string',
        description: 'The thread id which this event belongs'
    },
    meta: {
        type: 'number[]',
        description: 'This represents a 2d matrix describing who has seen the event'
    },
    requestAddContributor: {
        type: 'function',
        description: 'Creates an event to request adding a new contributor to the thread'
    },
    requestRemoveContributor: {
        type: 'function',
        description: 'Create an event to request removing a contributor from the thread'
    },
    replyToAddContributor: {
        type: 'function',
        description: 'Creates an event to reply to a contributor add request'
    },
    copy: {
        type: 'function',
        description: 'Create a copy of a HashEvent'
    },
    create: {
        type: 'function',
        description: 'Create a new Hash Event'
    },
    combine: {
        type: 'function',
        description: 'Combines an merges 2 events'
    },
    hasReachedCompleted: {
        type: 'function',
        description: 'Returns true is the event has reached the completed state.'
    },
    getUncontacted: {
        type: 'function',
        description: 'Returns contributors which have not received this event.'
    },
    hasReachedConsensus: {
        type: 'function',
        description: 'Returns true if the event has reached consensus, all nodes know that all other nodes have received the event'
    },
    getContributorsNeedingUpdates: {
        type: 'function',
        description: 'Gets list of contributors needing to be updated about the current state of the event'
    },
    getUnnotifiedContributors: {
        type: 'function',
        description: 'Gets a list of contributors who have not received this event'
    },
    getNotifiedContributors: {
        type: 'function',
        description: 'Gets a list of contributors which have been notified about the event'
    },
    updateTime: {
        type: 'function',
        description: 'Recalculates the average time for the known contributors',
        returns: 'number'
    },
    applyHistory: {
        type: 'function',
        description: 'Applys the new history to the current version'
    },
    getHistory: {
        type: 'function',
        description: 'Get the history of the event'
    },
    getNow: {
        type: 'function',
        description: 'Gets the current time'
    },
    stamp: {
        type: 'function',
        description: 'Stamps the current event, with the current time the contributor received the event'
    },
    print: {
        type: 'function',
        description: 'Prints the current hash event'
    },
    setupMeta: {
        type: 'function',
        description: 'Set up the meta data for the current number of contributors'
    },
    applyContributors: {
        type: 'function',
        description: 'Applies a new set of contributors to the event'
    }
}
export default class HashEvent {
    constructor(_message, type, contributors, line) {
        if (!contributors) {
            throw 'requires contributors to create hash event';
        }
        var me = this;
        me.history = {};
        contributors.map(t => {
            me.history[t] = me.history[t] || null
        });
        this.time = Infinity;
        this.line = line;
        this.contributors = [...contributors];
        this.message = _message;
        this.eventIndex = null;
        this.eventSource = null;
        this._type = type;
        this.id = Util.GUID();
        this.threadId = null;
    }
    get meta() {
        var me = this;
        var size = (this.contributors || []).length;
        var m = HashMeta.create(size);
        (this.contributors || []).map((t, i) => {
            if (me.history[t]) {
                m = HashMeta.set(m, i, i, 1, size)
            }
        });
        return m;
    }
    get type() {
        return this._type;
    }

    static requestAddContributor(contributor, contributors) {
        return new HashEvent({ contributor }, ADD_CONTRIBUTOR, contributors);
    }

    static requestRemoveContributor(contributor, contributors) {
        return new HashEvent({ contributor }, REMOVE_CONTRIBUTOR, contributors);
    }

    static replyToAddContributor(request, reply, contributors) {
        return new HashEvent({ id: request.id, reply }, REPLY_TO_ADD_CONTRIBUTOR, contributors)
    }
    static documentation() {
        return _documentation;
    }
    static copy(hashEvent) {
        if (!hashEvent instanceof HashEvent) {
            throw 'hash event needs to be an object'
        }
        var duplicate = new HashEvent(hashEvent.message, hashEvent.type, [...hashEvent.contributors]);
        var update = {};
        Object.keys(hashEvent.history).map(t => {
            if (hashEvent.history[t])
                update[t] = hashEvent.history[t];
        })
        duplicate.history = Object.assign(duplicate.history, update);
        duplicate.updateTime();
        duplicate.id = hashEvent.id;
        duplicate.line = hashEvent.line;
        duplicate.threadId = hashEvent.threadId
        duplicate._type = hashEvent._type;
        duplicate.eventSource = hashEvent.eventSource;
        duplicate.eventIndex = hashEvent.eventIndex;
        duplicate.message = hashEvent.message;
        // duplicate.meta = HashMeta.copy(hashEvent.meta);

        return duplicate;
    }
    static create(_obj) {
        var hashEvent = new HashEvent(_obj.message, _obj.type, _obj.contributors);
        hashEvent.applyHistory(Object.assign({}, _obj.history));
        hashEvent._type = _obj._type;
        hashEvent.eventIndex = _obj.eventIndex;
        hashEvent.eventSource = _obj.eventSource;
        // hashEvent.meta = HashMeta.copy(_obj.meta);
        hashEvent.threadId = _obj.threadId
        hashEvent.line = _obj.line;
        hashEvent.id = _obj.id;
        return hashEvent;
    }
    updateTime() {
        var me = this;
        var hist = Object.keys(me.history);
        var length = 0;
        var total = hist.reduce((previousValue, currentValue, currentIndex, array) => {
            if ((me.history[currentValue])) {
                length++;
            }
            return previousValue + (me.history[currentValue] || 0);
        }, 0);
        if (length) {
            this.time = total / length;
        }

    }
    setSource(src) {
        this.eventSource = src;
        return this;
    }
    applyHistory(hist) {
        var update = {};
        var me = this;
        if (hist)
            this.contributors.map(t => {
                if (hist[t] && !me.history[t]) {
                    update[t] = hist[t];
                }
            });
        this.history = Object.assign({}, this.history, update);
        this.updateTime();
    }
    applyContributors(contributors) {
        var me = this;
        console.log(contributors);
        contributors.map(c => {
            if (!me.history.hasOwnProperty(c)) {
                me.history[c] = null;
            }
        });
        var keys = Object.keys(me.history);
        console.log('checking keys');
        keys.map(key => {
            if (contributors.indexOf(key) === -1) {
                delete me.history[key];
            }
        });
        me.contributors = [...contributors];
        me.updateTime();
        return me;
    }
    getHistory() {
        return this.history;
    }
    getNow() {
        if (HashEvent.timeService && HashEvent.timeService.now) {
            return HashEvent.timeService.now();
        }
        return Date.now();
    }
    stamp(contributor, index, threadId) {
        var update = {
            [contributor]: this.getNow()
        };
        this.history = Object.assign({}, this.history, update);
        this.updateTime();

        if (index)
            this.eventIndex = index;
        if (threadId)
            this.threadId = threadId;
        return this;
    }
    print(size) {
        HashMeta.print(this.meta, size);
    }
    setupMeta() {
        return this;
    }
    
    static combine(updated, original) {
        // if (updated && original && updated.meta && original.meta)
        //     original.meta = HashMeta.or(updated.meta, original.meta);
        for (var i in updated.history) {
            if (!original.history[i] && updated.history[i]) {
                original.history[i] = updated.history[i];
            }
        }

        original.updateTime();

        return original;
    }

    static hasReachedCompleted(evnt) {
        var keys = Object.keys(evnt.history);
        return evnt.contributors.length === keys.length && keys.all(t => evnt.history[t] !== null)
    }

    static getUncontacted(evnt, self) {
        var keys = Object.keys(evnt.history);
        return keys.filter(t => {
            return t !== self && evnt.history[t] === null;
        });
    }

    static hasReachedConsensus(evnt) {
        return HashEvent.hasReachedCompleted(evnt);
    }
    static getContributorsNeedingUpdates(evnt, self) {
        if (evnt && evnt.meta) {
            var contributors = evnt.contributors;
            var index = contributors.indexOf(self);
            var columnInfo = HashMeta.column(evnt.meta, index, contributors.length);

            return contributors.map((c, i) => {
                return columnInfo[i] ? c : null;
            }).filter(t => t);
        }
        return null;
    }

    static getUnnotifiedContributors(evnt) {
        var keys = Object.keys(evnt.history);
        return keys.filter(t => {
            return evnt.history[t] === null;
        });
    }
    static getNotifiedContributors(evnt) {
        var keys = Object.keys(evnt.history);
        return keys.filter(t => {
            return evnt.history[t] !== null;
        });
    }
}

export const ADD_CONTRIBUTOR = 'ADD_CONTRIBUTOR';
export const REMOVE_CONTRIBUTOR = 'REMOVE_CONTRIBUTOR'
export const REPLY_TO_ADD_CONTRIBUTOR = 'REPLY_TO_ADD_CONTRIBUTOR';