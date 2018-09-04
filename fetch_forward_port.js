const rp = require('request-promise');

const fetchForwardPort = ({url = 'localhost', port = 4000, filter = data => data} = {}) => {
    return new Promise((resolve, reject) => {
        return rp('http://' + url + ':' + port + '/json')
            .then(data => {
                let result = JSON.parse(data);
                if (result) {
                    let json = filter(result);
                    if (json && json.length) {
                        return {json, port};
                    }
                }

                reject('http://' + url + ':' + port + '/json 没有返回有效的数据');

            })
            .then(ret => {
                return rp('http://' + url + ':' + port + '/json/version').then(data => {
                    ret.version = JSON.parse(data) || {};
                    resolve(ret);
                });
            })
            .catch(error => {
                reject(error);
            });
    });
};


module.exports = fetchForwardPort;