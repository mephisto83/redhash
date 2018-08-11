import * as Util from './util';
import HashMeta from './hashmeta';
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
    updateMeta: {
        type: 'function',
        description: 'Updates the meta data'
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
    setMetaContributorReceived: {
        type: 'function',
        description: 'Sets the contributor as having received the event in the meta data on the event.'
    },
    setMetaEvidence: {
        type: 'function',
        description: 'Sets the meta evidence'
    }
}
export default class HashEvent {
    constructor(_message, type) {
        this.history = {};
        this.time = Infinity;
        this.message = _message;
        this.eventIndex = null;
        this._type = type;
        this.id = Util.GUID();
        this.threadId = null;
        this.meta = null;
    }
    get type() {
        return this._type;
    }

    static requestAddContributor(contributor) {
        return new HashEvent({ contributor }, ADD_CONTRIBUTOR);
    }

    static requestRemoveContributor(contributor) {
        return new HashEvent({ contributor }, REMOVE_CONTRIBUTOR);
    }

    static replyToAddContributor(request, reply) {
        return new HashEvent({ id: request.id, reply }, REPLY_TO_ADD_CONTRIBUTOR)
    }
    static documentation() {
        return _documentation;
    }
    static copy(hashEvent) {
        if (!hashEvent instanceof HashEvent) {
            throw 'hash event needs to be an object'
        }
        var duplicate = new HashEvent();
        duplicate.history = Object.assign(duplicate.history, hashEvent.history);
        duplicate.updateTime();
        duplicate.id = hashEvent.id;
        duplicate.threadId = hashEvent.threadId
        duplicate._type = hashEvent._type;
        duplicate.eventIndex = hashEvent.eventIndex;
        duplicate.message = hashEvent.message;
        duplicate.meta = HashMeta.copy(hashEvent.meta);

        return duplicate;
    }
    static create(_obj) {
        var hashEvent = new HashEvent(_obj.message, _obj.type);
        hashEvent.applyHistory(_obj.history);
        hashEvent._type = _obj._type;
        hashEvent.eventIndex = _obj.eventIndex;
        hashEvent.meta = HashMeta.copy(_obj.meta);
        hashEvent.threadId = _obj.threadId
        hashEvent.id = _obj.id;
        return hashEvent;
    }
    updateTime() {
        var me = this;
        var hist = Object.keys(me.history);
        var total = hist.reduce((previousValue, currentValue, currentIndex, array) => {
            return previousValue + me.history[currentValue];
        }, 0);
        if (hist.length) {
            this.time = total / hist.length;
        }

    }
    applyHistory(hist) {
        this.history = Object.assign({}, hist);
        this.updateTime();
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
        this.history = Object.assign({}, {
            [contributor]: this.getNow()
        }, this.history);

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
    setupMeta(numberOfContributors) {
        this.meta = HashMeta.create(numberOfContributors);
        return this;
    }
    setMetaContributorReceived(contributor, contributors) {
        var index = contributors.indexOf(contributor);
        if (index === -1) {
            throw 'invalid contributor index';
        }
        this.meta = HashMeta.set(this.meta, index, index, 1, contributors.length);
        // if (index === 0) {
        //     HashMeta.print(this.meta);
        // }
        return this;
    }
    setMetaEvidence(contributor, self, contributors) {
        var index = contributors.indexOf(contributor);
        var sindex = contributors.indexOf(self);
        if (index === -1) {
            throw 'invalid contributor index';
        }
        if (sindex === -1) {
            throw 'invalid contributor sindex';
        }

        this.meta = HashMeta.set(this.meta, index, sindex, 1, contributors.length);
        this.meta = HashMeta.set(this.meta, index, index, 1, contributors.length);
        this.meta = HashMeta.set(this.meta, sindex, index, 1, contributors.length);

        HashEvent.updateMeta(this, contributor, contributors, self);
        HashEvent.updateMeta(this, self, contributors, contributor);
        return this;
    }
    static combine(updated, original) {
        if (updated && original && updated.meta && original.meta)
            original.meta = HashMeta.or(updated.meta, original.meta);
        for (var i in updated.history) {

            if (!original.history[i]) {
                original.history[i] = updated.history[i];
            }
        }

        original.updateTime();

        return original;
    }
    static updateMeta(evnt, self, contributors, from) {
        if (evnt instanceof HashEvent) {
            var index = contributors.indexOf(self);

            evnt.setMetaContributorReceived(self, contributors);
            contributors.map((c, i) => {
                if (i !== index)
                    evnt.meta = HashMeta.rowOr(evnt.meta, index, i, contributors.length)
            });
        }
    }

    static hasReachedCompleted(evnt, size) {
        return HashMeta.consensus(evnt.meta, size);
    }
    static getUncontacted(evnt, contributors, self) {
        var index = contributors.indexOf(self);
        var column = HashMeta.column(evnt.meta, index, contributors.length);
        return column.map((t, i) => {
            if (!t) {
                return contributors[i];
            }
            return null;
        }).filter(t => t);
    }
    static hasReachedConsensus(evnt, contributors) {
        var rows = HashMeta.rows(evnt.meta, contributors.length);

        return rows.all((t, i) => {
            if (t[i]) {
                return true;
            }
            return false;
        })
    }
    static getContributorsNeedingUpdates(evnt, self, contributors) {
        if (evnt && evnt.meta) {
            var index = contributors.indexOf(self);
            var columnInfo = HashMeta.column(evnt.meta, index, contributors.length);

            return contributors.map((c, i) => {
                return columnInfo[i] ? c : null;
            }).filter(t => t);
        }
        return null;
    }

    static getUnnotifiedContributors(evnt, contributors) {
        var zeros = HashMeta.getDiagonal(evnt.meta, contributors.length);
        return zeros.map((t, i) => {
            return t ? null : contributors[i];
        }).filter(x => x);
    }
    static getNotifiedContributors(evnt, contributors) {
        var zeros = HashMeta.getDiagonal(evnt.meta, contributors.length);
        return zeros.map((t, i) => {
            return t ? contributors[i] : null;
        }).filter(x => x);
    }
}

export const ADD_CONTRIBUTOR = 'ADD_CONTRIBUTOR';
export const REMOVE_CONTRIBUTOR = 'REMOVE_CONTRIBUTOR'
export const REPLY_TO_ADD_CONTRIBUTOR = 'REPLY_TO_ADD_CONTRIBUTOR';