import * as util from './util';
import { IMessageService } from './interfaces';
import { strarse } from './testutil';
import * as HThread from './hashthread';

export default class TestMessageService extends IMessageService {
    constructor(id) {
        super();
        if (!id) {
            throw 'no id set';
        }
        this.id = id;
        services.push(this);
        this.lines = {};
    }
    // allows a hashgraph  to be attached
    attach(hg) {
        this.hg = hg;
    }
    static getPipeline() {
        return pipeline;
    }
    static globalStep(fail) {
        console.log('global step');
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
        console.log('global step');
        pipeline.filter(x => x.to === (id || me.id)).map(t => {
            console.log('steping - ------------')
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
    sendMessagesFor(to, from) {
        var messages = [];
        var me = this;
        Object.keys(me.lines).map(t => {
            messages = [...messages, ...me.lines[t].getMessageToSendTo(to)];
        });

        return Promise.all(messages.map(t => {
            return me.send(t, to, from)
        }));
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
    assignLine(line, id = null) {
        id = id || util.GUID();
        this.onmessage((message, to, from) => {
            var mess = strarse(message);
            return line.receiveEvent(mess, from);
        });
        line.listen(HThread.SENDEVENT, (event) => {

        });

        this.lines[id] = line;
    }

}

var pipeline = [];
var services = [];