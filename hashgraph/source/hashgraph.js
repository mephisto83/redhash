import HashLine from './hashline';
import SocketMessageService from './socketmessageservice';
import NodeServer from './server/nodeserver';
import RedHashController from './server/redhashcontroller';
import * as Util from './util';
/*
    Hash graph will contain all lines that exist in this client.
*/
export default class HashGraph {
    constructor() {
        this.lines = [];
        this.messageServiceType = null;
        this.graphServer = null;
        this.lineMessageServiceFactory = null;
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
    static config(_config) {
        var hashGraph = new HashGraph();

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
            if (_config.useProxyServer) {
                hashGraph.graphServerFactory = () => {
                    return new Promise((resolve, fail) => {
                        try {
                            var _address = _config.proxyServer && _config.proxyServer.address ? _config.proxyServer.address : '127';
                            var _port = _config.proxyServer && _config.proxyServer.port ? _config.proxyServer.port : Math.floor(5000 + (Math.random() * 1000));
                            var address = NodeServer.getIpAddress(_address)[0];

                            var _server = NodeServer.createHttpServer({
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

