let http = require('http');
var net = require('net');
let os = require('os');
import ServerSocket from './serversocket';

export default class NodeServer {

    constructor(config) {
        config = Object.assign({ port: 5123 }, config);
        this.sockets = [];
        this.socketServers = [];
        this.handlers = [];
        this.addDefaultHandler();
        this.createServers(config);
        this.poweredBy = 'red-hash';

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
                server.listen(config.port, addressInfo.address);
                return server;
            }
            catch (e) {
                return null;
            }
        }).filter(t => t);

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
    static createServer(config) {
        return new NodeServer(config);
    }
    createSocketServer(addressInfo, port, callback) {
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
        me.socketServers.push(serverSocket);
    }
    createSocket(address, port) {
        var me = this;
        var socket = net.createConnection(port, address);
        var serverSocket = new ServerSocket({
            address,
            port
        });
        serverSocket.setSocket(socket);
        me.socketServers.push(serverSocket);
    }
    static getIpAddress() {
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

        return result;
    }
}