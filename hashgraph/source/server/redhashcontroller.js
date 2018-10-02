
const GET = 'GET';
const POST = 'POST';
export default class RedHashController {
    constructor() {
        this.handlers = [];
        this.lines = [];
        this.addresses = [];
        this.init();
    }

    init() {
        this.addHandler(GET, '/lines', this.getLines.bind(this))
    }

    setLines(lines) {
        this.lines = lines;
    }

    _getLines() {
        return [...this.lines];
    }

    getLines(res) {
        var { headers, method, url, request, response, addressInfo, filteredAddress, config } = res;
        res.header('Content-Type', 'application/json');
        response.write(JSON.stringify(this._getLines(), null, "\t"));
        response.end();
    }

    addAddress(address) {
        if (address && address.id && address.addresses) {
            this.addresses = [...this.addresses.filter(x => x.id !== address.id), address];
        }
    }
    _getAddress(id) {
        return this.addresses.find(t => t.id === id);
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