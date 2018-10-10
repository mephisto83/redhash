var nodeserver = require('../distribution/server/nodeserver').default;

var nd1 = nodeserver.createServer({ port: 5123 });
nd1.addHandler((headers, method, url) => {
    if (method === 'POST') {
        if (url.indexOf('/request/direct/link') !== -1) {
            console.log('found link');
            return true;
        }
    }
    return false;
}, (options) => {
    var { headers, method, url, request, response, addressInfo, filteredAddress, config, body } = options;
    console.log('---------------------------------------------------')
    console.log(headers);
    console.log(method);
    console.log(url);
    console.log(body);

    console.log('handling reqest direct link');
    try {
        var _body = JSON.parse(body);

        if (_body.address) {
            console.log(_body.address);
            console.log(_body.port);
            nd1.createSocket(_body.address, _body.port);
        }
    }
    catch (e) { console.log(e); }
});

var nd2 = nodeserver.createServer({
    port: 6100
});
nd2.addHandlerOn('POST', '/start/listener', (options) => {
    var { headers, method, url, request, response, addressInfo, filteredAddress, config, body } = options;
    console.log('start listener');
    console.log(body);
    var _body = JSON.parse(body);
    if (_body.port != null) {
        console.log('creating socket server')
        nd2.createSocketServer(addressInfo, _body.port, () => {
            console.log('created socket server at ' + _body.port);
        });
        console.log(nd2.socketServers);
    }
})
var renderLinks = (addresses, port) => {
    var res = `<script>function callpost(url, address, port){
        var data ={address: address, port: port};
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
            <button onclick="callpost('http://[${t.address}]:${port}/start/listener', 'http://[${t.address}]', '${9999}')">Start listener Post</button><br />
            <button onclick="callpost('http://[${t.address}]:${5123}/request/direct/link', 'http://[${t.address}]', '${9999}')">Reqest Direct Link Post</button><br />`;
        }
        else if (t.iface.family === 'IPv4') {
            res += `<div><a href="http://${t.address}:${port}">http://${t.address}:${port}</a></div>`;
        }
    });

    return res;
}

nd2.renderLinks = renderLinks;
nd1.renderLinks = renderLinks;