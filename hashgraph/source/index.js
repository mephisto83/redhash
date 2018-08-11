import HashLine from './hashline';
import * as Util from './util';
/*
    Hash graph will contain all lines that exist in this client.
*/
export default class HashGraph {
    constructor() {
        this.lines = [];
        this.messageServiceType = null;
    }
    createMessageService() {
        if (this.messageServiceType) {
            this.messageService = this.messageServiceType(this.id);
        }
        return this;
    }
    //Creates a new thread.
    createLine(name, self) {
        var newline = HashLine.createLine(name, self);
        this.lines.push(newline);
        return this;
    }
    getLine(name) {
        return (this.lines || []).find(v => v.name === name);
    }
    setMessageServiceType(type) {
        this.messageServiceType = type;
        return this;
    }
    // A unique id for the client;
    get id() {
        if (!this._id) {
            this._id = Util.GUID();
        }
        return this._id;
    }
}

