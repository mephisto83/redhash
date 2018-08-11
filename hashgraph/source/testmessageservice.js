import * as util from './util';
import { IMessageService } from './interfaces';
export default class TestMessageService extends IMessageService {
    constructor(id) {
        super();
        if (!id) {
            throw 'no id set';
        }
        this.id = id;
        services.push(this);
    }
    // allows a hashgraph  to be attached
    attach(hg) {
        this.hg = hg;
    }
    static getPipeline() {
        return pipeline;
    }
    static globalStep(fail) {
        services.map(service => {
            service.step(fail, service.id);
        });
    }
    static clear() {
        pipeline = [];
        services = [];
    }

    // cause messages in the pipeline to be delivered.
    step(fail, id) {
        var me = this;
        let received = [];
        pipeline.filter(x => x.to === (id || me.id)).map(t => {
            var res = me.received(t.message, t.to, t.from)
            if (fail) {
                t.error(false);
            }
            else {
                t.callback(res || true);
            }
            received.push(t.id);
        });

        pipeline = [...pipeline.filter(t => received.indexOf(t.id) === -1)];
    }

    send(message, to, from) {
        from = from || this.id;
        return new Promise((resolve, fail) => {
            var res = {
                to,
                message,
                id: util.GUID(),
                from,
                callback: (e) => {
                    resolve(e);
                },
                error: (e) => {
                    fail(e);
                }
            };
            pipeline.push(res);
        });
    }
    onmessage(handler) {
        this.messageHandler = handler;
    }
    received(message, to, from) {
        var res = null;
        if (this.messageHandler) {
            res = this.messageHandler(message, to, from);
        }
        if (this.hg) {
            res = res || this.hg.receiveEvent(message, from);
        }

        return res;
    }

}

var pipeline = [];
var services = [];