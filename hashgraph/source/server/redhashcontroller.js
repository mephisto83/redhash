
const GET = 'GET';
const POST = 'POST';
export const CONNECT_END_POINT = 'CONNECT_END_POINT';
export const REQUEST_CONNECTION_PATH = '/req/connection';
export const REQUEST_LINES = '/lines';
export const REQUEST_ADDRESS_BOOK = '/address/book';
export const CONNECTION_REQUEST = '/connection_request';
export const JOIN_THREAD = '/join/thread';
export const GET_WHO_ARE_YOU = '/who/are/you';
export default class RedHashController {
    constructor(id) {
        this.handlers = [];
        this.lines = [];
        this.pendingRequests = [];
        this.listeners = [];
        this.addresses = [];
        this.id = id;
        this._handleConnectionRequest = null;
        this.init();
    }
    setHandleConnectionRequest(func) {
        this._handleConnectionRequest = func;
    }
    setJoinHandling(func) {
        this._handleJoinThread = func;
    }
    init() {
        this.addHandler(GET, REQUEST_LINES, this.getLines.bind(this));
        this.addHandler(POST, REQUEST_CONNECTION_PATH, this.requestConnection.bind(this));
        this.addHandler(GET, REQUEST_ADDRESS_BOOK, this.getAddressBook.bind(this));
        this.addHandler(POST, GET_WHO_ARE_YOU, this.getWhoYouAre.bind(this));
        this.addHandler(POST, CONNECTION_REQUEST, this.connectionRequest.bind(this));
        this.addHandler(POST, JOIN_THREAD, this.joinThread.bind(this));
    }

    setLines(lines) {
        this.lines = lines;
    }

    _getLines() {
        return [...this.lines];
    }
    addListener(type, handler) {
        this.listeners.push({ type, handler });
    }
    getLines(res) {
        var { headers, method, url, request, response, addressInfo, filteredAddress, config } = res;
        response.write(JSON.stringify(this._getLines(), null, "\t"));
    }
    getAddressBook(res) {
        var { response } = res;
        response.write(JSON.stringify(this._getAddressBook(), null, "\t"));
    }
    getWhoYouAre(res) {
        var { response } = res;
        response.write(JSON.stringify(this._getWhoYouAre(), null, "\t"));
    }
    connectionRequest(res) {
        var { response, body } = res;
        response.write(JSON.stringify(this._connectionRequest(JSON.parse(body)), null, "\t"));
    }
    joinThread(res) {
        var { response, body } = res;
        response.write(JSON.stringify(this._joinThread(JSON.parse(body)), null, "\t"));
    }
    requestConnection(res) {
        var { response, body } = res;
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
    _getAddressBook() {
        return [...this.addresses]
    }
    _getWhoYouAre() {
        return {
            id: this.id
        }
    }
    _connectionRequest(res) {
        if (this._handleConnectionRequest) {
            return this._handleConnectionRequest(res)
        }
        console.warn('there is no connection request handling, so this connection was rejected');
        return { accepted: false };
    }
    _joinThread(res) {
        if (this._handleJoinThread) {
            return this._handleJoinThread(res);
        }
        return { processing: false }
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