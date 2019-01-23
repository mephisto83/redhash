import * as util from './util';
import MessageService from './messageservice';
import NodeServer from './server/nodeserver'; import { resolveCname } from 'dns';
;
export const CONNECTED = 'CONNECTED';
export default class SocketMessageService extends MessageService {
    constructor(id) {
        super(id);
        this.debug = true;
        this.listeners = [];
        this.connectionLib = {
            id: {},
            address: {}
        };

        this.init();
    }
    // allows a hashgraph  to be attached
    attach(hg) {
        this.hg = hg;
    }
    close() {
        var me = this;
        if (me.server) {
            me.server.close();
        }
    }
    init() {
        var me = this;
        var _server = NodeServer.proxyServer();

        this.server = _server;
        var onReceived = ((address, port, message) => {
            try {
                message = JSON.parse(message);
                var isReply = false;
                if (message['x-reply']) {
                    message = message.message;
                    if (me.debug)
                        console.log('reply received')
                    isReply = true;
                }
                if (me.debug) {
                    console.log(`'message received' from ${this.getName(address, port)}`);
                }
                var info = me.getConnectionId(address, port);
                if (info && info.id && me.lines[message.line]) {
                    var reply = me.lines[message.line].receiveEvent(message);
                    if (!isReply) {
                        me.send({ 'x-reply': true, message: reply }, info.id);
                        console.log('--------------------------------------------');
                        console.log('x-reply')
                        console.log('--------------------------------------------');
                    }
                }
                else {
                    if (me.debug) {
                        console.log('no maching line');
                        console.log('available lines -- ');
                        console.log(Object.keys(me.lines));
                    }
                }
            } catch (e) {
                console.error(e);
                if (me.debug)
                    console.log(e);
            }
        });
        this.server.onReceived = onReceived;
    }

    openListener(config) {
        var me = this;
        var { address, port, id } = config;
        var _address = NodeServer.getIpAddress(address);
        if (me.debug) {
            console.log(`'opting address ${_address[0].iface.address} ${port}`);
        }
        return new Promise((resolve) => {
            me.server.createServer(_address[0].iface.address, port, res => {
                me.connectedTo(_address[0].iface.address, port, id);
                console.log(me.connectionLib);
                if (me.debug) {
                    console.log('connection made');
                }
                me.raise(CONNECTED, { address: _address[0].iface.address, port, id });
                resolve({ address: _address[0].iface.address, port });
            });

        });
    }
    isOpen(args) {
        var me = this;
        console.log('wait for open');
        var { address, port, id } = args;
        return new Promise(resolve => {
            me.listen(CONNECTED, () => {
                console.log('open now');
                resolve();

            });
            if (me.isConnectedTo(id, address, port)) {
                resolve();
            }
            else {
                console.log('not open right away');
            }
        });
    }
    connectedTo(address, port, id) {
        console.log(`connected to  : ${address}, ${port}, ${id}`)
        this.connectionLib = {
            id: {
                ...this.connectionLib.id,
                [id]: {
                    address,
                    port,
                    id
                }
            },
            address: {
                ...this.connectionLib.address,
                [this.getName(address, port)]: {
                    address,
                    port,
                    id
                }
            }
        }

    }
    getName(address, port) {
        return `${address} ${port}`;
    }
    getConnectionId(address, port) {
        return this.connectionLib.address[this.getName(address, port)]
    }

    isConnectedTo(id, address, port) {
        console.log(this.connectionLib.id)
        console.log(this.connectionLib.address)
        return !!this.connectionLib.id[id] || !!this.connectionLib.address[this.getName(address, port)];
    }

    connect(config) {
        var me = this;
        var { address, port, id } = config;
        return new Promise((resolve) => {
            me.server.connectSocket(address, port, res => {
                if (me.debug) {
                    console.log('connected to socket');
                }
                me.connectedTo(address, port, id);
                me.raise(CONNECTED, { address: address, port, id });
                resolve();
                // _server.send(address[0].iface.address, port, { sending: 'a message' });
            });
        });
    }
    raise(evt, args) {
        var me = this;
        me.listeners.filter(t => t.type === evt).map(t => t.action(evt, args));
    }
    listen(evnt, action) {
        var me = this;
        me.listeners.push({ type: evnt, action });
    }
    send(message, to, from) {
        from = from || this.id;
        var me = this;

        if (!me.isConnectedTo(to)) {
            throw `not connected to ${to}`;
        }

        var { address, port, id } = me.connectionLib.id[to];
        return me.server.send(address, port, message);
    }

    onmessage(handler) {
        this.messageHandler = handler;
    }
    onmessagesent(handler) {
        this.messageSentHandler = handler;
    }

    sendMessages(from) {
        var messages = [];
        var me = this;
        var promises = [];
        Object.keys(me.lines).map(t => {
            var line = me.lines[t];
            messages = line.getMessageToSend() || [];
            if (!messages.length) {
                console.log('no messages to send for line ' + line.name);
            }
            (messages.map(message => {
                (line.getNextPossibleDestinationsFor(message).map(dests => {
                    ([dests].map(to => {
                        console.log('sending...')
                        promises.push(me.send(message, to, from).then(res => {
                        }));
                    }));
                }));
            }));
            promises.push(Promise.resolve().then(() => {
                return line.applyAllThreads();
            }))
        });
        return Promise.all(promises);
    }

    sentEventSuccessfully(evt) {
        if (this.messageSentHandler) {
            this.messageSentHandler(evt);
        }
    }

}