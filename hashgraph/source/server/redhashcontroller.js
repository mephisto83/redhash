
const GET = 'GET';
const POST = 'POST';
export default class RedHashController {
    constructor() {
        this.handlers = [];

        this.init();
    }

    init() {
        this.addHandler(GET, '/lines', this.getLines.bind(this))
    }

    getLines(res) {
        var { headers, method, url, request, response, addressInfo, filteredAddress, config } = res;
        res.header('Content-Type', 'application/json');
        response.write(JSON.stringify([], null, "\t"));
        response.end();
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