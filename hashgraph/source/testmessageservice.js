import * as util from './util';
import { IMessageService } from './interfaces';
import { strarse } from './testutil';
import * as HThread from './hashthread';
import ET from './eventtypes';
export default class TestMessageService extends IMessageService {
    constructor(id) {
        super();
        if (!id) {
            throw 'no id set';
        }
        this.id = id;
        services.push(this);
        this.lines = {};
        this.sendingMessagePromise = Promise.resolve();
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
    sendMessagesFor(to, from) {
        var messages = [];
        var me = this;
        Object.keys(me.lines).map(t => {
            messages = [...messages, ...me.lines[t].getMessageToSendTo(to)];
        });

        return Promise.all(messages.map(t => {
            return me.send(t, to, from).then(res => {
                var service = services.find(t => t.id === from);
                if (service) {
                    service.sentEventSuccessfully(to, res);
                }
            })
        }));
    }

    sendMessages(from) {
        var messages = [];
        var me = this;
        var promises = [];
        Object.keys(me.lines).map(t => {
            var line = me.lines[t];
            messages = line.getMessageToSend() || [];
            (messages.map(t => {
                (line.getNextPossibleDestinationsFor(t).map(dests => {
                    console.log(dests);
                    ([dests].map(to => {
                        promises.push(me.send(t, to, from).then(res => {
                            var service = services.find(t => t.id === from);
                            if (service) {
                                service.sentEventSuccessfully(to, res);
                            }
                        }));
                    }));
                }));
            }));
        });
        return Promise.all(promises);
    }
    onmessage(handler) {
        this.messageHandler = handler;
    }
    onmessagesent(handler) {
        this.messageSentHandler = handler;
    }
    sentEventSuccessfully(to, evt) {
        if (this.messageSentHandler) {
            this.messageSentHandler(to, evt);
        }
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
        var me = this;
        this.onmessage((message, to, from) => {
            var mess = strarse(message);
            return line.receiveEvent(mess, from);
        });

        this.onmessagesent((to, evt) => {
            line.sentEventSuccessfully(to, evt);
        });

        line.listen(HThread.SENDEVENT, (event) => {

        });
        line.listen(ET.SEND_MESSAGE, message => {
            if (message && message.from && message.to) {
                this.sendingMessagePromise = this.sendingMessagePromise.then(() => {
                    return me.send(message, message.to, message.from);
                }).catch(e => {
                    console.log(e);
                })
            }
        });

        this.lines[id] = line;
    }

}

var pipeline = [];
var services = [];