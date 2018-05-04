import HashThread from './hashthread';
/*
    Hash graph will contain all threads that exist in this client.
*/
export default class HashGraph {
    constructor() {
        this.threads = [];
    }
    //Creates a new thread.
    createThread() {
        var newthread = HashThread.createThread(this.id);
        newthread._id = this.id;
        this.threads.push(newthread);
    }
    // A unique id for the client;
    get id() {
        if (this._id) {
            this._id = Util.GUID();
        }
        return this._id;
    }
}