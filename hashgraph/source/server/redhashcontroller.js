
const GET = 'GET';
const POST = 'POST';
export const CONNECT_END_POINT = 'CONNECT_END_POINT';
export const REQUEST_CONNECTION_PATH = '/req/connection';
export default class RedHashController {
    constructor() {
        this.handlers = [];
        this.lines = [];
        this.pendingRequests = [];
        this.addresses = [];
        this.init();
    }

    init() {
        this.addHandler(GET, '/lines', this.getLines.bind(this));
        this.addHandler(POST, REQUEST_CONNECTION_PATH, this.requestConnection.bind(this));
    }

    setLines(lines) {
        this.lines = lines;
    }

    _getLines() {
        return [...this.lines];
    }

    getLines(res) {
        var { headers, method, url, request, response, addressInfo, filteredAddress, config } = res;
        response.write(JSON.stringify(this._getLines(), null, "\t"));
    }
    requestConnection(res) {
        var { headers, method, url, request, response, addressInfo, filteredAddress, config, body } = res;
        response.write(JSON.stringify(this._requestConnection(JSON.parse(body)), null, "\t"));
    }
    addAddress(address) {
        if (address && address.id && address.addresses) {
            this.addresses = [...this.addresses.filter(x => x.id !== address.id), address];
        }
    }
    processRequests() {
        var me = this;
        var promise = Promise.resolve();
        this.pendingRequests.map(t => {
            if (t.type === CONNECT_END_POINT) {
                promise = promise.then(() => {
                    return new Promise((r, f) => {
                        try {
                            console.log('calling :');
                            console.log(t);
                            me.server.connectSocket(t.address, t.port, () => {
                                me.pendingRequests = [...me.pendingRequests.filter(y => t !== y)];
                                r();
                            }, () => {
                                f();
                            })
                        } catch (e) {
                            f(e);
                        }
                    });
                });
            }
        })
        return promise;
    }
    sendHttp(req) {
        if (this.server) {
            console.log('send http request')
            return this.server.sendHttp(req);
        } return Promise.reject();
    }
    _getAddress(id) {
        return this.addresses.find(t => t.id === id);
    }
    _requestConnection(request) {
        if (request && request.id && request.address, request.port && request.line) {
            this.pendingRequests = [...this.pendingRequests, {
                line: request.line,
                type: CONNECT_END_POINT,
                id: request.id,
                address: request.address,
                port: request.port
            }];
            return {
                ok: true
            };
        }
        return {
            ok: false
        }
    }
    _getAddresses() {
        return [...this.addresses];
    }
    addHandler(_method, _path, handler) {
        var res = {
            match: (headers, method, url) => {
                return method === _method && _path === url;
            },
            handler
        }

        this.handlers.push(res);
    }
    getHandlers() {
        return [...this.handlers];
    }
}