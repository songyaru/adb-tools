const adb = require('adbkit');
const adbKit = require('./adb_kit');
const fetchForwardPort = require('./fetch_forward_port');
const readline = require('readline');
const path = require('path');


const chooseClientByUserChoice = async (devices) => {
    const rl = readline.createInterface(process.stdin, process.stdout);

    let info = '';
    devices.forEach((d, index) => {
        info += '[' + index + '] : ' + d.id + ' ';
    });
    return new Promise((resolve, reject) => {
        rl.question('请选择连接的设备  ' + info, function (answer) {
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
    let id;
    let devicesIndex = -1;
    let client = '';
    try {
        const chooseClient = async () => {
            if (!(client && 'device' === client.type.toLowerCase())) {
                const devices = await adbKit.listDevices();
                if (devices.length == 1) {
                    devicesIndex = 0
                } else if (devices.length > 1) {
                    if (client) {
                        devicesIndex = devices.findIndex((device) => device.id === client.id)
                    } else {
                        // 选择第 N 个设备
                        await chooseClientByUserChoice(devices).then((index) => {
                            devicesIndex = index;
                        });
                    }
                    if (devicesIndex < 0) {
                        throw new Error('choose android function not set');
                    }
                } else {
                    new Error('no android devices found');
                }
                client = devices[devicesIndex];
                if (client && client.type.toLowerCase() !== 'device') {
                    // todo 没有授权
                    // await chooseClient();
                    throw new Error('设备没有授权')
                }
            }
        };
        await chooseClient();
        if (client) {
            id = client.id;
        } else {
            throw new Error('no valid android device')
        }
    } catch (error) {
        throw error;
    }

    return id;
};

let _deviceId = null;
const setDeviceId = (id) => {
    if (id) {
        _deviceId = id;
        getDeviceId = () => {
            return new Promise((resolve, reject) => {
                resolve(id);
            });
        }
    }
};

const getForwardPortInfo = async (deviceId, ports, forwardPort, filter = d => d) => {
    let len = ports.length;
    if (len < 1) {
        throw new Error('小程序没有启动');
    }
    for (let i = 0; i < len; i++) {
        let port = ports[i];
        let info = await adbKit.forward(deviceId, 'tcp:' + forwardPort, 'localabstract:' + port)
            .then(() => fetchForwardPort({
                port: forwardPort,
                filter
            }).then(data => data, _ => false));
        if (info) {
            return info;
        }
    }
};

const adbWebViewInfo = ({forwardPort = 4000, prefix = 'webview', filter = d => d} = {}) => {

    let re = new RegExp('@(' + prefix + '_devtools_remote_(?:\\d+))', 'gi');

    return new Promise((resolve, reject) => {
        getDeviceId().then(function (deviceId) {
            adbKit.shell(deviceId, 'cat /proc/net/unix | grep --text  _devtools_remote')
                .then(adb.util.readAll)
                .then(output => {
                    let remotePorts = new Set();
                    output.toString().replace(re, (_, port) => {
                        remotePorts.add(port);
                    });
                    return remotePorts;
                })
                .then(remotePorts => getForwardPortInfo(deviceId, [...remotePorts], forwardPort, filter))
                .then(info => resolve(info))
                .catch(e => reject(e));
        });
    });

};


const reversePort = (remote, local) => {
    return new Promise((resolve, reject) => {
        getDeviceId().then(function (deviceId) {
            adbKit.reverse(deviceId, 'tcp:' + remote, 'tcp:' + local)
                .then(info => resolve(info))
                .catch(e => reject(e));
        });
    });
};

module.exports = {
    adbWebViewInfo,
    fetchForwardPort,
    reversePort,
    adbKit,
    setDeviceId,
    'adbPath': path.resolve(__dirname, './bin/' + (process.platform === 'darwin' ? 'adb-macos' : 'adb-win'))
};



