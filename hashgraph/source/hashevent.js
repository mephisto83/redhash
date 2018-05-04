import * as Util from './util';
import HashMeta from './hashmeta';
export default class HashEvent {
    constructor(_message, type) {
        this.history = {};
        this.message = _message;
        this._type = type;
        this.id = Util.GUID();
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
        duplicate.message = hashEvent.message;
        duplicate.meta = HashMeta.copy(hashEvent.meta);

        return duplicate;
    }
    static create(_obj) {
        var hashEvent = new HashEvent(_obj.message, _obj.type);
        hashEvent.applyHistory(_obj.history);
        this.id = _obj.id;
        return hashEvent;
    }
    applyHistory(hist) {
        this.history = Object.assign({}, hist);
    }
    getHistory() {
        return this.history;
    }
    stamp(contributor) {
        this.history = Object.assign({}, {
            [contributor]: Date.now()
        }, this.history);
        return this;
    }
    setupMeta(numberOfContributors) {
        this.meta = HashMeta.create(numberOfContributors);
        return this;
    }
    setMetaSelfReceived(self, contributors) {
        var index = contributors.indexOf(self);
        if (index === -1) {
            throw 'invalid contributor index';
        }

        this.meta = HashMeta.set(this.meta, index, index, 1, contributors.length);

        return this;
    }
    static hasReachedConsensus(evnt, size) {
        return HashMeta.consensus(evnt.meta, size);
    }
}

export const ADD_CONTRIBUTOR = 'ADD_CONTRIBUTOR';
export const REMOVE_CONTRIBUTOR = 'REMOVE_CONTRIBUTOR'
export const REPLY_TO_ADD_CONTRIBUTOR = 'REPLY_TO_ADD_CONTRIBUTOR';