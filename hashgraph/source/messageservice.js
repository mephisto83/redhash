import * as util from './util';
import { IMessageService } from './interfaces';
import { strarse } from './testutil';
import * as HThread from './hashthread';
import ET from './eventtypes';
export default class MessageService extends IMessageService {
    constructor(id) {
        super();
        if (!id) {
            throw 'no id set';
        }
        this.id = id;
        // services.push(this);
        this.lines = {};
        this.sendingMessagePromise = Promise.resolve();
    }
    // allows a hashgraph  to be attached
    attach(hg) {
        this.hg = hg;
    }

    send(message, to, from) {
        from = from || this.id;
        console.log('sending message service message');
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
    onmessagesent(handler) {
        this.messageSentHandler = handler;
    }
    sentEventSuccessfully(evt) {
        if (this.messageSentHandler) {
            this.messageSentHandler(evt);
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
        id = line.name || id || util.GUID();
        var me = this;
        this.onmessage((message, to, from) => {
            var mess = strarse(message);
            return line.receiveEvent(mess, from);
        });

        this.onmessagesent((evt) => {
            line.sentEventSuccessfully(evt);
        });

        line.listen(HThread.SENDEVENT, (event) => {

        });
        line.listen(ET.SEND_MESSAGE, message => {
            if (message && message.from && message.to) {
                //this.sendingMessagePromise = this.sendingMessagePromise.then(() => {
                me.send(message, message.to, message.from);
                //}).catch(e => {
                //  console.log(e);
                // })
            }
            else {
                throw 'not sending message'
            }
        });

        this.lines[id] = line;
    }

}