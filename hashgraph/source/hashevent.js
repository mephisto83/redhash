import * as Util from './util';
import HashMeta from './hashmeta';
export default class HashEvent {
    constructor(_message, type) {
        this.history = {};
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

    static copy(hashEvent) {
        if (!hashEvent instanceof HashEvent) {
            throw 'hash event needs to be an object'
        }
        var duplicate = new HashEvent();
        duplicate.history = Object.assign(duplicate.history, hashEvent.history);
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
    applyHistory(hist) {
        this.history = Object.assign({}, hist);
    }
    getHistory() {
        return this.history;
    }
    stamp(contributor, index, threadId) {
        this.history = Object.assign({}, {
            [contributor]: Date.now()
        }, this.history);
        if (index)
            this.eventIndex = index;
        if (threadId)
            this.threadId = threadId;
        return this;
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
        if (index === 0) {
            HashMeta.print(this.meta);
        }
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