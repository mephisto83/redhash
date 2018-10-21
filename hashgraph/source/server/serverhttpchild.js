let http = require('http');
var net = require('net');
let poweredBy;
process.on('message', (message) => {
    switch (message.type) {
        case 'createServer':
            createServer(message);
            break;
        case 'listen':
            var server = service.servers[message.name || 'default'];
            var { config } = message;
            server.listen(config.port, config.address, (res) => {
                console.log('listen on port ' + config.port);
                process.send({
                    type: 'reply',
                    res,
                    id: message.id
                });
            });
            break;
        case 'close':
            Object.keys(service.servers).map(t => {
                service.servers[t].close();
                service.servers[t].unref();
            })
            process.exit(0);
            break;
        case 'reply':
            if (service.promises[message.id]) {
                service.promises[message.id].promise(message);
                delete service.promises[message.id];
            }
            break;
    }
});

var service = {
    servers: {},
    promises: {}
};
function createServer(message) {
    var { name, id } = message;
    name = name || 'default';
    poweredBy = message.poweredBy;
    var server = http.createServer(function (req, _response) {
        _handleRequest(req, _response).then((ops) => {
            var {
                headers,
                method,
                url,
                body
            } = ops;

            var req_id = GUID();
            var resolve;
            var promise = new Promise((_res, fail) => {
                resolve = _res;
            });
            service.promises[req_id] = { promise: resolve };
            console.log('sending request to parent for processing');

            promise.then(reps => {
                var { text } = reps;
                console.log('writing response');
                _response.write(text);
                _response.end();
                console.log('end response');
            });
            process.send({
                type: 'request',
                ops: { headers, method, url, body },
                id: req_id
            });
        });

    });

    service.servers[name] = server;

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
    process.send({ type: 'reply', id: id })
}

function GUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


function _handleRequest(request, response) {
    return new Promise((resolve, fail) => {

        var me = this;

        console.log('handling request');
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
            console.log('body received');
            response.statusCode = 200;
            response.on('error', (err) => {
                // console.error(err);
                response.statusCode = 500;
            });

            response.setHeader('Content-Type', 'application/json');
            response.setHeader('Access-Control-Allow-Origin', '*');
            response.setHeader('Access-Control-Allow-Headers', '*');
            response.setHeader('X-Powered-By', poweredBy);
            // Note: the 2 lines above could be replaced with this next one:
            // response.writeHead(200, {'Content-Type': 'application/json'})

            const responseBody = { headers, method, url, body };
            let ops = { headers, method, url };

            console.log('resolve promise');
            resolve({
                response,
                headers,
                method,
                url,
                body
            });
        });
    });
}
