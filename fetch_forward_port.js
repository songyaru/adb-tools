const rp = require('request-promise');

const fetchForwardPortJson = (port) => {
    return new Promise((resolve, reject) => {
        return rp('http://localhost:' + port + '/json').then(data => {
            let json = JSON.parse(data);
            if (json && json.length) {
                resolve({json: json, port: port});
            } else {
                reject(port + ' 端口没有返回数据');
            }
        }).catch((error) => {
            reject(error);
        });
    });
};


module.exports = fetchForwardPortJson;