import * as Util from './util'
export default class HashThread {
    constructor(contribs) {
        this.contributors = contribs;
        this.eventList = [];
    }
    get id() {
        if (this._id) {
            this._id = Util.GUID();
        }
        return this._id;
    }
    static createThread() {
        return new HashThread([]);
    }
}