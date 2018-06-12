let adbClient;


const adbKit = require('adbkit');
const path = require('path');
const adbPath = (() => {
    if (process.platform === 'darwin') {
        return path.join(__dirname, './bin/adb-macos/adb');
    } else {
        return path.join(__dirname, './bin/adb-win/adb.exe');
    }
})();


const getClient = function () {
    if (!adbClient) {
        adbClient = adbKit.createClient({bin: adbPath});
    }
    return adbClient;
};

const listDevices = function () {
    return new Promise((resolve, reject) => {
        getClient().listDevices().then((devices) => {
            resolve(devices);
        }).catch((error) => {
            reject(error);
        })
    })
};

const reverse = function (serial, remote, local) {
    return new Promise((resolve, reject) => {
        getClient().reverse(serial, remote, local).then((result) => {
            resolve(result);
        }).catch((error) => {
            reject(error);
        })
    })
};

const version = function () {
    return new Promise((resolve, reject) => {
        getClient().version().then((result) => {
            resolve(result);
        }).catch((error) => {
            reject(error);
        })
    })
};

const kill = function () {
    return new Promise((resolve, reject) => {
        if (adbClient) {
            getClient().kill().then((result) => {
                adbClient = null;
                resolve(result);
            }).catch((error) => {
                reject(error);
            })
        } else {
            resolve(true);
        }
    })
};


const shell = function (serial, command) {
    return new Promise((resolve, reject) => {
        getClient().shell(serial, command).then((result) => {
            resolve(result);
        }).catch((error) => {
            reject(error);
        })
    })


};


const forward = function (serial, local, remote) {
    return new Promise((resolve, reject) => {
        getClient().forward(serial, local, remote).then((result) => {
            resolve(result);
        }).catch((error) => {
            reject(error);
        })
    })


};


module.exports = {
    listDevices, reverse, version, kill, getClient, shell, forward
};