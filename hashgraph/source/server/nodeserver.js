let http = require('http');
var net = require('net');
let os = require('os');
// import serverchild from './serverchild';
import ServerSocket from './serversocket';
import * as Util from '../util';
export const LISTENING = 'listening';
export default class NodeServer {

    constructor(config, skipCreate) {
        config = Object.assign({ port: 5123 }, config);
        this.sockets = [];
        this.socketServers = {};
        this.handlers = [];
        this.listeners = [];
        this.servers = [];
        this.promises = {}
        this.proxyServers = [];
        this.config = config;
        if (!skipCreate) {
            this.addDefaultHandler();
            this.createServers(config);
        } this.poweredBy = 'red-hash';

    }

    close() {
        var me = this;
        if (this.servers) {
            this.servers.map(server => {
                if (server.listening) {
                    server.close(function (t) {
                        console.log('closed server?')
                        console.log(t);
                    });
                }
                console.log('--- closing server')
                server.unref();
            })
        }

        if (this.socketServers) {
            Object.keys(this.socketServers).map(key => {
                var server = me.socketServers[key];
                server.close();
                console.log('--- closing socket server')
            })
        }

        if (this.proxyServers) {
            this.proxyServers.map(p => {
                p.proxy.send({ type: 'close' })
            });
        }
    }
    get serverCount() {
        return (this.servers || []).length;
    }
    createServers(config) {
        var me = this;
        var addresses = NodeServer.getIpAddress();
        var filteredAddress = addresses.filter(t => !t.iface.internal)
            .filter(t => NodeServer.validate(t.address)).filter(t => {
                if (config.filterOnFamily)
                    return config.listen.indexOf(t.iface.family) !== -1
                return true;
            });

        this.servers = filteredAddress.map((addressInfo, i) => {
            try {
                var server = http.createServer(function (req, res) {
                    me.handleRequest(req, res, addressInfo, filteredAddress, config);
                });

                server.listen(config.port, addressInfo.address, (res) => {
                    me.raiseEvent(LISTENING, { server, res })
                });
                server.on('error', (e) => {
                    if (e.code === 'EADDRINUSE') {
                        console.log('Address in use');
                        setTimeout(() => {
                            server.close();
                            // server.listen(PORT, HOST);
                        }, 1000);
                    }
                });
                return server;
            }
            catch (e) {
                return null;
            }
        }).filter(t => t);

    }
    raiseEvent(evt, args) {
        this.listeners.filter(t => t.type === evt).map(t => {
            t.action(evt, args);
        })
    }
    addListener(evt, handler) {
        this.listeners.push({ type: evt, action: handler });
    }
    addHandler(matchFunc, handler) {
        this.handlers.unshift({ match: matchFunc, handler })
    }
    addHandlerOn($method, $path, handler) {
        this.addHandler((headers, method, url) => {
            if (method === $method) {
                if (url.indexOf($path) !== -1) {
                    console.log('found link');
                    return true;
                }
            }
            return false;
        }, handler);
    }
    addDefaultHandler() {
        this.addHandler(function () { return true; }, this.defaultHandler.bind(this));
    }
    defaultHandler(res) {
        var me = this;
        var { headers, method, url, request, response, addressInfo, filteredAddress, config } = res;
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.write(`${Date.now()}<br />`);
        response.write(request.url);
        response.write(me.renderLinks(filteredAddress, config.port))
        response.write(JSON.stringify(addressInfo, null, "\t"));
        response.end();
    }
    getHandler(options) {
        var { headers, method, url, request, response, addressInfo, filteredAddress, config } = options;
        return this.handlers.find(t => t.match(headers, method, url));
    }
    handleRequest(request, response, addressInfo, filteredAddress, config) {
        var me = this;
        const { headers, method, url } = request;
        const userAgent = headers['user-agent'];
        console.log(`method : ${method}`);
        console.log(`url : ${url}`);
        console.log(`userAgent : ${userAgent}`);

        let body = [];
        request.on('error', (err) => {
            console.error(err);
        }).on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            body = Buffer.concat(body).toString();
            // BEGINNING OF NEW STUFF

            response.statusCode = 200;
            response.on('error', (err) => {
                // console.error(err);
                response.statusCode = 500;
            });

            response.setHeader('Content-Type', 'application/json');
            response.setHeader('Access-Control-Allow-Origin', '*');
            response.setHeader('Access-Control-Allow-Headers', '*');
            response.setHeader('X-Powered-By', me.poweredBy);
            // Note: the 2 lines above could be replaced with this next one:
            // response.writeHead(200, {'Content-Type': 'application/json'})

            const responseBody = { headers, method, url, body };
            let ops = { headers, method, url, request, response, addressInfo, filteredAddress, config, body };
            var res = me.getHandler(ops);

            if (res && res.handler && typeof res.handler === 'function') {
                res.handler(ops)
            }

            response.end();
        });

        return true;

    }

    renderLinks(addresses, port) {
        var res = `<script>function callpost(url){
            var data ={id:'addressofendpoint'};
            return fetch(url, {
                body: JSON.stringify(data), // must match 'Content-Type' header
                headers: {
                  'user-agent': 'Mozilla/4.0 MDN Example',
                  'content-type': 'application/json'
                },
                method: 'POST', // *GET, POST, PUT, DELETE, etc.
                mode: 'cors', // no-cors, cors, *same-origin
                redirect: 'follow', // manual, *follow, error
                referrer: 'no-referrer', // *client, no-referrer
              });
        }</script>`;
        addresses.map(t => {
            if (t.iface.family === 'IPv6') {
                res += `
                <button onclick="callpost('http://[${t.address}]:${port}/request/direct/link')">Post</button>
                <form action="http://[${t.address}]:${port}/patch" method="patch">
                    Patch <input type="submit" value="Submit">
                </form>

                <form action="http://[${t.address}]:${port}/get" method="get">
                    Get <input type="submit" value="Submit">
                </form>

                <form action="http://[${t.address}]:${port}/delete" method="delete">
                    Delete <input type="submit" value="Submit">
                </form>
                `;
            }
            else if (t.iface.family === 'IPv4') {
                res += `<div><a href="http://${t.address}:${port}">http://${t.address}:${port}</a></div>`;
            }
        });

        return res;
    }

    static validate(address) {
        //test ipv4
        var ok = false;
        if (/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/.test(address)) {
            ok = true;
        }

        //test ipv6  

        if (/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/.test(address)) {
            console.log(address);
            console.log(address.toLowerCase().indexOf('fe80'));
            if (address.toLowerCase().indexOf('fe80') !== 0) {
                ok = true;
                console.log(' ok');
            }
            else {
                ok = false;
                console.log('not ok');
            }
        }

        return ok;
    }

    static createHttpServer(config, callback) {
        var server = new NodeServer(null, true);

        server._createHttpServer(config, callback);

        return server;
    }
    static createProxyHttpServer(config, callback) {
        var server = new NodeServer(null, true);
        server.proxy = true;
        server._createHttpServer(config, callback);

        return server;
    }
    sendConnectionRequest(res) {
        if (this.server) {
            this.send({
                ...res
            })
        }
    }
    addController(controller) {
        var me = this;
        controller.server = this;
        controller.getHandlers().map(t => {
            me.addHandler(t.match, t.handler)
        });
    }
    _handleRequest(request, response, config) {
        var me = this;

        console.log('handle request');
        const { headers, method, url } = request;
        const userAgent = headers['user-agent'];

        let body = [];

        request.on('error', (err) => {
            console.error(err);
        }).on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            body = Buffer.concat(body).toString();
            // BEGINNING OF NEW STUFF

            response.statusCode = 200;
            response.on('error', (err) => {
                // console.error(err);
                response.statusCode = 500;
            });

            response.setHeader('Content-Type', 'application/json');
            response.setHeader('Access-Control-Allow-Origin', '*');
            response.setHeader('Access-Control-Allow-Headers', '*');
            response.setHeader('X-Powered-By', me.poweredBy);
            // Note: the 2 lines above could be replaced with this next one:
            // response.writeHead(200, {'Content-Type': 'application/json'})

            const responseBody = { headers, method, url, body };
            let ops = { headers, method, url, request, response, config, body };
            var res = me._getHandler(ops);

            if (res && res.handler && typeof res.handler === 'function') {
                res.handler(ops)
            }

            response.end();
        });
    }

    _getHandler(ops) {
        var { headers, method, url } = ops;
        console.log('check handlers')
        return this.handlers.find(t => {
            return t.match(headers, method, url)
        })
    }
    addProxyListeners(proxy, config, callback) {
        var me = this;
        proxy.on('message', message => {
            console.log(message);
            switch (message.type) {
                case 'request':
                    var { ops } = message;

                    console.log('//handle incoming messages;')
                    var res = me._getHandler(ops);
                    var returnValue = '';
                    if (res && res.handler && typeof res.handler === 'function') {
                        ops.response = {
                            write: (ret) => {
                                console.log(ret);
                                returnValue = ret;
                            }
                        }
                        res.handler(ops)
                    }
                    else {
                        console.log(res);
                        console.log('no handler found');
                    }
                    proxy.send({ type: 'reply', id: message.id, text: returnValue });
                    break;
                case 'reply':
                    if (this.promises[message.id]) {
                        this.promises[message.id]();
                        delete this.promises[message.id];
                    }
                    break;
                case 'error':
                    console.error(message);
                    break;
            }
        });
        this.proxyPromise({ type: 'createServer', poweredBy: this.poweredBy }, proxy).then(() => {
            this.proxyPromise({ type: 'listen', config }, proxy).then(() => {
                console.log('parent [listen on port] ' + config.port)
                me.raiseEvent(LISTENING, {})
                if (callback) {
                    callback();
                    callback = null;
                }
            });

        });
    }
    proxyPromise(message, proxy) {
        var id = Util.GUID();
        var resolve;
        var promise = new Promise((res) => {
            resolve = res;
        })
        this.promises[id] = resolve;
        proxy.send({ ...message, id: id });
        return promise;
    }
    _createHttpServer(config, callback) {
        var me = this;
        if (me.proxy) {
            const cp = require('child_process');
            var me = this;
            const n = cp.fork(`${__dirname}/serverhttpchild.js`);
            me.addProxyListeners(n, config, callback);
            me.proxyServers.push({
                proxy: n
            });
        }
        else {
            var server = http.createServer(function (req, res) {
                me._handleRequest(req, res, config);
            });

            server.listen(config.port, config.address, (res) => {
                console.log('listen on port ' + config.port)
                me.raiseEvent(LISTENING, { server, res })
                if (callback) {
                    callback();
                    callback = null;
                }
            });
            server.on('error', (e) => {
                if (e.code === 'EADDRINUSE') {
                    console.log('Address in use');
                    setTimeout(() => {
                        server.close();
                        // server.listen(PORT, HOST);
                    }, 1000);
                }
                console.log(e);
            });
            this.servers.push(server);
            return server
        }
    }

    static createServer(config, skip) {
        return new NodeServer(config, skip);
    }
    static proxyServer() {
        var server = new NodeServer(null, true);
        server.proxy = true;
        return server;
    }
    //Deprecated
    createSocketServer(addressInfo, port, callback) {
        return new Promise((resolve, fail) => {
            var me = this;
            var server = net.createServer(function (socket) {
                if (callback) {
                    callback(socket);
                    me.sockets.push(socket);
                    serverSocket.setSocket(socket);
                }
            });

            server.listen(port, addressInfo.address);
            var serverSocket = new ServerSocket({
                server,
                address: addressInfo.address,
                port
            });
            me.socketServers[`${addressInfo.address} ${port}`] = (serverSocket);
            return serverSocket;
        })
    }
    connectSocket(address, port, callback, error) {
        var me = this;
        console.log(`connect socket ${address}:${port}`);
        var props = {
            address,
            port,
            connect: true,
            error,
            onConnect: callback,
            // callback,
            proxy: this.proxy,
            onReceived: (message => {
                if (me.onReceived) {
                    me.onReceived(address, port, message);
                }
            })
        };
        var serverSocket = new ServerSocket(props);
        me.socketServers[`${address} ${port}`] = (serverSocket);
        if (this.proxy) {
            serverSocket.setupProxy(props).then(() => {
                if (callback)
                    callback();
            })
        }
        return serverSocket;
    }
    send(address, port, message) {
        if (this.socketServers && this.socketServers[`${address} ${port}`]) {
            var server = this.socketServers[`${address} ${port}`];
            return server.send(message);
        }
        return Promise.reject('no server by that address');
    }
    sendHttp(request) {
        return new Promise((resolve, fail) => {
            const postData = JSON.stringify(request.body);
            var { port, path, method, address } = request;
            const options = {
                hostname: address,
                port: port,
                path: path || '',
                method: method || 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            var _data = '';

            const req = http.request(options, (res) => {
                console.log(`STATUS: ${res.statusCode}`);
                console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    console.log(`BODY: ${chunk}`);
                    _data = _data + chunk;
                });
                res.on('end', () => {

                    try {
                        resolve(JSON.parse(_data));
                    } catch (e) {
                        resolve(_data);
                    }
                });
            });

            req.on('error', (e) => {
                console.error(`problem with request: ${e.message}`);
                fail(e);
            });

            // write data to request body
            req.write(postData);
            req.end();
        });
    }

    createServer(address, port, callback) {
        var me = this;
        console.log(`is proxy : ${this.proxy}`)
        var props = {
            address,
            port,
            asServer: true,
            proxy: this.proxy,
            startServer: false,
            //  callback,
            onReceived: (message => {
                if (me.onReceived) {
                    me.onReceived(address, port, message);
                }
            }),
            onListen: () => {
                if (callback) {
                    callback();
                }
            }
        };
        var serverSocket = new ServerSocket(props);
        console.log('create server')
        me.socketServers[`${address} ${port}`] = (serverSocket);
        if (this.proxy) {
            serverSocket.setupProxy(props).then(() => {
                console.log('start listening');
                serverSocket.startListen().then(() => {
                    console.log('listening');
                    if (callback)
                        callback();
                })
            });
        }
        else {
            serverSocket.startListen();
        }
        return serverSocket;
    }

    static childProcess(callback) {
        const cp = require('child_process');
        const n = cp.fork(`${__dirname}/serverchild.js`);

        n.on('message', (m) => {
            console.log('PARENT got message:');
            if (callback)
                callback();
        });

        n.send({ hello: 'world' });

        return n;
    }
    static getIpAddr(startsWith) {
        return NodeServer.getIpAddress(startsWith)[0];
    }
    static getIpAddress(startsWith) {
        var ifaces = os.networkInterfaces();
        var result = []
        Object.keys(ifaces).forEach(function (ifname) {
            var alias = 0;

            ifaces[ifname].forEach(function (iface) {

                if (alias >= 1) {
                    // this single interface has multiple ipv4 addresses
                    result.push({
                        address: iface.address,
                        iface,
                        ifname,
                        alias
                    });
                } else {
                    // this interface has only one ipv4 adress
                    result.push({
                        iface,
                        ifname,
                        address: iface.address
                    });
                }
                ++alias;
            });
        });
        if (startsWith) {
            result = result.filter(t => t.iface && t.iface.address && t.iface.address.startsWith(startsWith));
        }
        return result;
    }
}