const rp = require('request-promise');

const fetchForwardPortJson = (port) => {
    return new Promise((resolve, reject) => {
        return rp('http://localhost:' + port + '/json').then(data => {
            let json = JSON.parse(data);
            if (json) {
                let result = json.filter(currentInfo => {
                    let description = JSON.parse(currentInfo['description'] || '""');
                    let isAttached = description['attached'];
                    return !!isAttached;
                });
                if (result.length) {
                    return resolve({json: json, port: port});
                }
            }

            return reject(port + ' 端口没有返回数据');

        }).catch((error) => {
            reject(error);
        });
    });
};


module.exports = fetchForwardPortJson;