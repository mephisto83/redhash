import HashLine from './hashline';
import SocketMessageService from './socketmessageservice';
import NodeServer from './server/nodeserver';
import RedHashController from './server/redhashcontroller';
import * as RHC from './server/redhashcontroller';
import MembershipStateMachine from './statemachines/membershipstatemachine';
import * as MA from './statemachines/membershipactions';
import IConnectionInfo from './statemachines/iconnectioninfo';
import { EVENT_THREAD } from './hashline';
import MachineRunner from './machinerunner';
import * as Util from './util';
import * as HThread from './hashthread';
import ET from './eventtypes';
const PORT_OPENED = 'PORT_OPENED';
const OPENING_LISTENER = 'OPENING_LISTENER';
const JOINING_THREAD = 'JOINING_THREAD';
const JOIN_THREAD_PROCESSING = 'JOIN_THREAD_PROCESSING';
/*
    Hash graph will contain all lines that exist in this client.
*/
export default class HashGraph {
    constructor(_config) {
        this.lines = [];
        this._id = _config ? _config.id || null : null;
        this.messageServiceType = null;
        this.joinPromise = {};
        this.policy = null;
        this.config = _config;
        this.graphServer = null;
        this.ports = {};
        this.joiningThreads = {};
        //A list of who you are trying/maybe connected to.
        this.potentialParticipants = [];
        //A list of who you are connected to.
        this.connections = [];
        this.openListeners = {};
        this.messageService = null;
        this.machineRunner = null;
        this.lineMessageServiceFactory = null;
        this.connectingPromise = Promise.resolve();
        this.statemachines = [];
    }
    createMessageService() {
        if (this.messageServiceType) {
            this.messageService = this.messageServiceType(this.id);
        }
        return this;
    }
    addConnection(config) {
        console.log('---- add connection ----- ')
        console.log(config);
        this.connections.push(config);
    }
    getConnection(id) {
        return this.connections.find(x => x.id === id);
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
        }).then(() => {
            if (me.messageService) {
                me.messageService.close();
            }
        })
    }
    connect() {
        var me = this;
        return Promise.resolve().then(() => {
            var promise = Promise.resolve();
            //This could be parallelized, later;
            var pp = me.potentialParticipants;
            me.potentialParticipants = [];
            pp.map(t => {
                promise = promise.then(() => {
                    return me.connectToPotentialParticipant(t).catch((e) => {
                        console.error(e);
                        me.potentialParticipants.push(t);
                        return Promise.reject('connecting has failed');
                    });
                })
            });
            this.connectingPromise = this.connectingPromise.then(() => {
                return promise;
            })
            return this.connectingPromise;
        });
    }
    connectToPotentialParticipant(config) {
        var me = this;
        return me.getPotentialParticipantInformation(config).then((information) => {
            return me.createConnectionRequest(config, information).then(req => {
                return me.graphServer.sendHttp({
                    ...config,
                    method: 'POST',
                    path: RHC.CONNECTION_ANNOUCEMENT,
                    body: {
                        id: me.id,
                        ...me.getConnectionInfo()
                    }
                }).then(() => {

                    return me.graphServer.sendHttp({
                        ...config,
                        method: 'POST',
                        path: RHC.CONNECTION_REQUEST,
                        body: req
                    }).then(res => {
                        console.log('received reply for connection request');
                        console.log(`I am '${me.id}'`)
                        console.log(res);
                        console.log(config);
                        me.addConnection({ ...config, ...res });
                    });
                });
            });
        });
    }
    getPotentialParticipantInformation(config) {
        var me = this;
        return Promise.resolve().then(() => {
            return me.graphServer.sendHttp({
                ...config,
                path: RHC.GET_WHO_ARE_YOU,
                body: {},
                method: 'POST'
            }).catch(e => {
                console.log(e);
                return Promise.reject('failed to get potential participant information');
            })
        });
    }
    createConnectionRequest(potentialParticipant, informationAboutParticipant) {
        var me = this;
        var { socketPreferences } = me.config;
        if (!informationAboutParticipant || !informationAboutParticipant.id) {
            throw 'missing information about the potential participant';
        }
        var address;
        if (socketPreferences && socketPreferences.address) {
            address = socketPreferences.address;
        }
        else {
            address = '127';
        }

        var port = me.getAvailablePort();
        me.ports[port] = OPENING_LISTENER;
        var targetAdress = null;
        return me.messageService.openListener({
            address,
            port,
            id: informationAboutParticipant.id
        }).then((res) => {
            targetAdress = res.address;
            this.openListeners = { ...this.openListeners, [informationAboutParticipant.id]: res }
            me.ports[port] = PORT_OPENED;
        }).catch((e) => {
            me.ports[port] = ERRORED;
            console.error(e);
            return Promise.reject('an error occurred while opening a listener on port ' + port);
        }).then(() => {
            return {
                address: targetAdress,
                port,
                id: me.id
            }
        });
    }
    getAvailablePort() {
        var me = this;
        var { socketPreferences } = me.config;
        var port = null;
        if (socketPreferences && socketPreferences.port) {
            var notdone = true;
            port = socketPreferences.port;
            do {
                if (!me.ports[port]) {
                    notdone = false;
                }
                else {
                    port++;
                }
            } while (notdone);
        }
        return port;
    }
    addPotentialParticipant(config) {
        this.potentialParticipants.push(config);

        return this;
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
    isOpen(config) {
        if (!this.messageService) {
            throw 'message service isnt instantiated.'
        }
        return this.messageService.isOpen(config);
    }
    join(agent, threadId) {
        var me = this;
        if (!me.joiningThreads[threadId]) {
            me.joiningThreads[threadId] = JOINING_THREAD;
            return Promise.resolve().then(() => {
                var config = me.getConnection(agent);
                console.log('calling ' + config.id + ' to join thread ' + threadId);
                return me.graphServer.sendHttp({
                    ...config,
                    method: 'POST',
                    path: RHC.JOIN_THREAD,
                    body: {
                        threadId,
                        id: me.id
                    }
                }).then(res => {
                    console.log('received reply for join request');
                    console.log(res);
                    if (res.processing) {
                        me.joiningThreads[threadId] = JOIN_THREAD_PROCESSING;
                        return me._waitForJoin(agent, threadId);
                    }
                    else {
                        me.joiningThreads[threadId] = false;
                    }
                });
            });
        }
        return Promise.reject('already joining a thread');
    }
    _waitForJoin(agent, threadId) {
        var me = this;
        return new Promise((resolve, fail) => {
            me.joinPromise[`${agent}-${threadId}`] = () => {
                resolve();
            }
        })
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
            me.createLine(stateMachineName, me.id);
            var line = me.getLine(stateMachineName);
            if (me.policy) {
                line.setPolicy(policy);
            }
            line.initialize(threadid);

            line.assignMachine(() => {
                return me.membershipConstructor([me.id]);
            });
            line.listen(HThread.SENDEVENT, () => {
                console.log('sending messages');
                me.messageService.sendMessages(line.name);
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
    setConnectionInfo(value) {
        this._connectionInfo = value;
    }
    getConnectionInfo() {
        return this._connectionInfo;
    }
    static config(_config) {
        var hashGraph = new HashGraph(_config);
        hashGraph.membershipConstructor = function (contributors) {
            var msm = new MembershipStateMachine({
                contributors
            });
            hashGraph.machineRunner = MachineRunner.machine(msm)
            return msm;
        }
        if (_config) {
            if (_config.useProxyServer) {
                hashGraph.lineMessageServiceFactory = (lineName) => {
                    return new SocketMessageService(lineName);
                }
            }
            if (_config.useRedHashController) {
                hashGraph.controllerFactory = () => {
                    var controller = new RedHashController(hashGraph.id);
                    if (_config.useDefaultConnectionHandler) {
                        controller.setHandleConnectionRequest((body) => {
                            console.log('received connection request');
                            console.log('default behavior is to connect to anything.');
                            console.log(body);
                            hashGraph.messageService.connect(body);
                            // hashGraph.addConnection(body);
                            return {
                                accepted: true,
                                id: hashGraph.id
                            };
                        });
                        controller.setHandleConnectionAnnouncement((connectionInfo) => {
                            console.log('received connection info');
                            console.log(connectionInfo);
                            hashGraph.addConnection(connectionInfo);
                            return { ok: true };
                        })
                    }
                    if (_config.userDefaultJoinHandler) {
                        controller.setJoinHandling((body) => {
                            console.log('handling join request');
                            console.log('default behavior is to find the thread, and start joining');
                            console.log(body);
                            if (!body || !body.threadId || !body.id) {
                                return { processing: false }
                            }
                            hashGraph.defaultJoin(body)
                            return { processing: true }
                        })
                    }
                    return controller;
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
                            hashGraph.setConnectionInfo({
                                address: address.address,
                                port: _port
                            })
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
    defaultJoin(body) {
        var me = this;
        console.log('default join');
        var line = me.getLine(body.threadId);
        if (!line) {
            console.log('no line found by ' + body.threadId);
            return {
                processing: false,
                error: 'thread not found'
            };
        }
        if (!me.machineRunner) {
            throw 'no machine runner found';
        }
        me.machineRunner.when((a) => {
            console.log('check when');
            console.log(a);
            var { state } = a.state;
            console.log(`state: ${state}`);
            return a && [MA.INITIALIZE_STATE, null, undefined].indexOf(state) !== -1;
        }, () => {
            console.log('default joining a new agent to thread');
            line.sendEvent({
                type: MA.INITIALIZE_STATE
            }, ET.MEMBERSHIP);
            console.log('request contributor add');
            line.sendEvent({
                type: MA.REQUEST_CONTRIBUTOR_ADD,
                connectionInfo: new IConnectionInfo(body.id, {
                    thread: body.threadId,
                    threadType: EVENT_THREAD
                })
            }, ET.MEMBERSHIP);
            console.log('accept contributor add');
            line.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: me.id,
                name: body.id
            }, ET.MEMBERSHIP);
        }).when((a) => {
            console.log('check state');
            console.log(a.state);
            let { state } = a.state;
            console.log(`state: ${state}`);
            return state === MA.ACCEPT_CONTRIBUTOR_ADD
        }, () => {
            line.sendEvent({
                type: MA.ADD_CONTRIBUTOR,
                from: me.id,
                name: body.id
            }, ET.MEMBERSHIP);
        }).when((a) => {
            console.log('check state');
            console.log(a.state);
            let { state } = a.state;
            console.log(`state: ${state}`);
            return state === MA.ADD_CONTRIBUTOR
        }, () => {
            line.sendEvent({
                type: MA.ACCEPT_CONTRIBUTOR_ADD,
                from: me.id,
                name: body.id
            }, ET.MEMBERSHIP);

            // var range = line.getCutRanges(MEMBERSHIP_THREAD);
            // line.sendEvent({
            //     type: MA.THREAD_CUT_APPROVAL,
            //     from: me.id,
            //     range,
            //     thread: body.threadId,
            // }, ET.MEMBERSHIP);
        }).when((a) => {
            console.log('check state');
            console.log(a.state);
            let { state } = a.state;
            console.log(`state: ${state}`);
            return state === MA.ACCEPT_CONTRIBUTOR_ADD

        }, () => {
            line.sendEvent({
                type: MA.ADD_CONTRIBUTOR,
                from: me.id,
                name: body.id
            }, ET.MEMBERSHIP);

        }).when((a) => {
            console.log('check state add contributor');
            console.log(a.state);
            let { state } = a.state;
            console.log(`state: ${state}`);
            return state === MA.ADD_CONTRIBUTOR

        }, () => {
            line.sendEvent({
                type: MA.UPDATE_THREAD,
                from: me.id,
                name: body.id
            }, ET.MEMBERSHIP);

        }).kickOff();

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

        return line.getState(thread);
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

