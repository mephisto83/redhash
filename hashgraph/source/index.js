import HashThread from './hashthread';
export class HashGraph {
    constructor() {
        this.threads = [];
    }
    createThread() {
        var newthread = HashThread.createThread();
    }
}