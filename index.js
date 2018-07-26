const adb = require('adbkit');
const adbKit = require('./adb_kit');
const fetchForwardPort = require('./fetch_forward_port');
const readline = require('readline');
const getPort = require('get-port');


const chooseClientByUserChoice = async (devices) => {
    const rl = readline.createInterface(process.stdin, process.stdout);

    let info = '';
    devices.forEach((device, index) => {
        info += '[' + index + '] : ' + device.id + ' ';
    });
    return new Promise((resolve, reject) => {
        rl.question('请选择连接的设备  ' + info, answer => {
            answer = answer | 0;
            if (answer > -1 && answer < devices.length) {
                resolve(answer);
            } else {
                reject('选择错误');
            }
            rl.close();
        });
    })
};

let getDeviceId = async () => {
    let devicesIndex = -1;
    let client;
    const chooseClient = async () => {
        if (!(client && 'device' === client.type.toLowerCase())) {
            const devices = await adbKit.listDevices();
            if (devices.length == 1) {
                devicesIndex = 0
            } else if (devices.length > 1) {
                if (client) {
                    devicesIndex = devices.findIndex(device => device.id === client.id)
                } else {
                    // 选择第 N 个设备
                    await chooseClientByUserChoice(devices).then(index => {
                        devicesIndex = index;
                    });
                }
                if (devicesIndex < 0) {
                    throw new Error('没有选中设备');
                }
            } else {
                throw new Error('没有找到设备');
            }
            client = devices[devicesIndex];
            if (client && client.type.toLowerCase() !== 'device') {
                // todo 没有授权
                // await chooseClient();
                throw new Error('设备没有授权');
            }
        }

    };

    try {
        await chooseClient();
        if (client) {
            return client.id;
        } else {
            throw new Error('设备不可调试')
        }
    } catch (e) {
        throw e;
    }

};

let _deviceId = null;
let oriGetDeviceId = getDeviceId;
const setDeviceId = (id) => {
    if (id) {
        _deviceId = id;
        getDeviceId = () => {
            return new Promise(resolve => {
                if (_deviceId) {
                    resolve(_deviceId);
                }
            });
        }
    } else {
        // 恢复
        _deviceId = null;
        getDeviceId = oriGetDeviceId;
    }
};

const getForwardPortInfo = async ({deviceId, ports, tcpPort, filter = d => d} = {}) => {
    let len = ports.length;
    let port = await getPort({port: tcpPort});
    let allInfo = [];
    for (let i = 0; i < len; i++) {
        let localPort = ports[i];
        let info = await adbKit.forward(deviceId, 'tcp:' + port, 'localabstract:' + localPort)
            .then(() => fetchForwardPort({port, filter}))
            .catch(_ => false);
        if (info) {
            if (i < len - 1) {
                port = await getPort({port: ++tcpPort});
            }
            info.localPort = localPort;
            allInfo.push(info);
        }
    }

    if (allInfo.length) {
        return allInfo;
    } else {
        throw new Error('没有找到有效的 webview 远程调试信息');
    }
};

const webviewInfo = ({tcpPort = 4000, prefix = 'webview', filter = d => d} = {}) => {

    if (prefix === '*') {
        prefix = '.+';
    }
    let re = new RegExp('@(' + prefix + '_devtools_remote(?:_\\d+)?)', 'gi');

    return getDeviceId().then(deviceId => {
        return adbKit.shell(deviceId, 'cat /proc/net/unix | grep --text  _devtools_remote')
            .then(adb.util.readAll)
            .then(output => {
                let remotePorts = new Set();
                output.toString().replace(re, (_, port) => {
                    remotePorts.add(port);
                });
                if (remotePorts.size) {
                    return [...remotePorts];
                } else {
                    throw new Error('没有启动 webview');
                }
            })
            .then(ports => getForwardPortInfo({deviceId, ports, tcpPort, filter}))
    });

};


const reversePort = (remote, local) => {
    return new Promise((resolve, reject) => {
        return getDeviceId()
            .then(deviceId => adbKit.reverse(deviceId, 'tcp:' + remote, 'tcp:' + local))
            .catch(e => reject(e));
    });
};


module.exports = {
    adbWebViewInfo: webviewInfo, //todo 废弃接口删除
    webviewInfo,
    fetchForwardPort,
    reversePort,
    adbKit,
    setDeviceId
};



