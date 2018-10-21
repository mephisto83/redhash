import HashLine from './hashline';
import SocketMessageService from './socketmessageservice';
import NodeServer from './server/nodeserver';
import RedHashController from './server/redhashcontroller';
import MembershipStateMachine from './statemachines/membershipstatemachine';
import { EVENT_THREAD } from './hashline';
import * as Util from './util';
/*
    Hash graph will contain all lines that exist in this client.
*/
export default class HashGraph {
    constructor(_config) {
        this.lines = [];
        this._id = _config ? _config.id || null : null;
        this.messageServiceType = null;
        this.policy = null;
        this.graphServer = null;
        this.lineMessageServiceFactory = null;
        this.statemachines = [];
    }
    createMessageService() {
        if (this.messageServiceType) {
            this.messageService = this.messageServiceType(this.id);
        }
        return this;
    }
    start() {
        var me = this;
        return Promise.resolve().then(() => {
            return me.graphServerFactory().then((server) => {
                me.graphServer = server;
                return server;
            });
        })
    }
    stop() {
        var me = this;
        return Promise.resolve().then(() => {
            if (me.graphServer) {
                return me.graphServer.close();
            }
        })
    }
    addStateMachine(config) {
        if (!config || !config.name) {
            throw 'requires a name';
        }
        if (!config.create || typeof (config.create) !== 'function') {
            throw 'requires a create function';
        }

        this.statemachines = [...this.statemachines.filter(t => t.name !== config.name), config];

        return this;
    }
    sendEvent(line, message) {
        if (!line) {
            throw 'no line specified';
        }
        var _line = this.getLine(line);
        if (!_line) {
            throw 'no line found';
        }

        _line.sendEvent(message);
    }
    launch(stateMachineName, threadid) {
        threadid = threadid || stateMachineName;
        if (!stateMachineName) {
            throw 'no state machine name';
        }
        var machineConfig = this.statemachines.find(x => x.name === stateMachineName);

        if (!machineConfig) {
            throw 'no state machine by that name';
        }
        let me = this;

        return Promise.resolve().then(() => {

            // var line = new HashLine(me.id, me.id, [me.id]);
            me.createLine(stateMachineName, me.id);
            var line = me.getLine(stateMachineName);
            if (me.policy) {
                line.setPolicy(policy);
            }
            line.initialize(threadid);

            line.assignMachine(() => {
                return me.membershipConstructor([me.id]);
            });
            line.assignMachine(machineConfig.create, EVENT_THREAD);
            me.messageService = me.messageService || me.lineMessageServiceFactory(me.id);
            me.messageService.assignLine(line);

            return line;
        });
    }
    setLinePolicy(policy) {
        this.policy = policy;
    }
    static config(_config) {
        var hashGraph = new HashGraph(_config);
        hashGraph.membershipConstructor = function (contributors) {
            return new MembershipStateMachine({
                contributors
            });
        }
        if (_config) {
            if (_config.useProxyServer) {
                hashGraph.lineMessageServiceFactory = (lineName) => {
                    return new SocketMessageService(lineName);
                }
            }
            if (_config.useRedHashController) {
                hashGraph.controllerFactory = () => {
                    return new RedHashController();
                }
            }
            if (_config.useDefaultPolicy) {
                var policy = {
                    maximumUnfinishedEvents: 10
                };
                hashGraph.setLinePolicy(policy);
            }
            if (_config.useProxyServer) {
                hashGraph.graphServerFactory = () => {
                    return new Promise((resolve, fail) => {
                        try {
                            var _address = _config.proxyServer && _config.proxyServer.address ? _config.proxyServer.address : '127';
                            var _port = _config.proxyServer && _config.proxyServer.port ? _config.proxyServer.port : Math.floor(5000 + (Math.random() * 1000));
                            var address = NodeServer.getIpAddress(_address)[0];

                            var _server = NodeServer.createProxyHttpServer({
                                address: address.address,
                                port: _port
                            }, () => {
                                _server.addController(hashGraph.controllerFactory());
                                _server.proxy = true;

                                resolve(_server);
                            });
                        } catch (e) {
                            fail(e);
                        }
                    });
                };
            }
        }

        return hashGraph;
    }
    //Creates a new thread.
    createLine(name, self) {
        name = name || this.id;
        self = self || this.id;
        var newline = HashLine.createLine(name, self);
        this.lines.push(newline);
        return this;
    }
    getLine(name) {
        return (this.lines || []).find(v => v.name === name);
    }
    getState(name, thread = EVENT_THREAD) {
        var line = this.getLine(name);

        return line.getState( thread);
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

