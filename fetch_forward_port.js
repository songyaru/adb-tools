const rp = require('request-promise');

const fetchForwardPort = ({url = 'localhost', port = 4000} = {}) => {
    return new Promise((resolve, reject) => {
        return rp('http://' + url + ':' + port + '/json').then(data => {
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

            return reject('http://' + url + ':' + port + '/json 没有返回有效的数据');

        }).catch((error) => {
            reject(error);
        });
    });
};


module.exports = fetchForwardPort;