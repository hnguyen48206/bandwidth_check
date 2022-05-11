const os = require("os");
const { exec } = require("child_process");
const axios = require('axios').default;
const FormData = require('form-data');
const EventEmitter = require('events');
const FastSpeedtest = require("fast-speedtest-api");
const cloudFlare = require('speed-cloudflare-cli');
const puppeteer = require('puppeteer');
const { isNumberObject } = require("util/types");
const imageAddr = 'downloadFileByFileID/627485144dee070016d23bb8';
const downloadSize = 10506316;
var startTime = null;
var endTime = null;
var imgAfterDownloaded = null
var currentDownloadUsage = null
var currentUploadUsage = null
var currentRecieve = null
var currentSend = null
// const baseURL = 'https://fstack2.herokuapp.com/'
const baseURL = 'https://fstack-56kn7cliwq-as.a.run.app/'
var currentTotalDownloadSpeed = null;
var currentTotalUploadSpeed = null;
var usageNotifier = new EventEmitter();
const fastToken = 'YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm';
var currentCheckIntervalSetup = null
var currentNotiIntervalSetup = null
var speedtest = new FastSpeedtest({
    token: fastToken, // required
    verbose: false, // default: false
    timeout: 10000, // default: 5000
    https: true, // default: true
    urlCount: 5, // default: 5
    bufferSize: 8, // default: 8
    unit: FastSpeedtest.UNITS.Mbps
});
var config = {
    IP: null,
    notificationInterval: 1000,
    testType: 'self'
}
function initUsageNotification() {
    getDataUsage().then(res => {      
        if (os.platform() == 'win32') {
            let usage = extractRXTXWin(res);
            if (currentRecieve == null) {
                currentRecieve = Number(usage[0]);
                currentSend = Number(usage[1]);
            }
            else {
                if(Number(usage[0]) - currentRecieve>0)
                currentDownloadUsage = Number(usage[0]) - currentRecieve;
                else
                currentDownloadUsage = 0
                if(currentUploadUsage = Number(usage[1]) - currentSend>0)
                currentUploadUsage = Number(usage[1]) - currentSend;
                else
                currentUploadUsage = 0
                currentRecieve = Number(usage[0]);
                currentSend = Number(usage[1]);
            }
        }
        else {
            let usage = extractRXTXLinux_Alpine(res);
            let down;
            let up;
            if (config.IP != null) {
                for (let i = 0; i < usage.networkInterface.length; ++i) {
                    if (usage.networkInterface[i].includes(config.IP)) {
                        console.log(config.IP);
                        down = usage.speedArray[i * 2];
                        up = usage.speedArray[i * 2 + 1];
                        break;
                    }
                }
            }
            else {
                console.log(config.IP);
                down = usage.speedArray[0];
                up = usage.speedArray[1];
            }
    
            if (currentRecieve == null) {
                currentRecieve = Number(down);
                currentSend = Number(up);
            }
            else {
                if(Number(usage[0]) - currentRecieve>0)
                currentDownloadUsage = Number(usage[0]) - currentRecieve;
                else
                currentDownloadUsage = 0
                if(currentUploadUsage = Number(usage[1]) - currentSend>0)
                currentUploadUsage = Number(usage[1]) - currentSend;
                else
                currentUploadUsage = 0
                currentRecieve = Number(usage[0]);
                currentSend = Number(usage[1]);
            }
        }
    });
}
async function initNetworkCheck(configuration) {
    if (configuration != null) {
        if (configuration.IP != null)
            config.IP = configuration.IP
        if (configuration.notificationInterval != null && !isNaN(configuration.notificationInterval))
            config.notificationInterval = configuration.notificationInterval
        if (configuration.testType != null)
            config.testType = configuration.testType
    }

    if (currentCheckIntervalSetup != null)
        clearInterval(currentCheckIntervalSetup);
    if(currentNotiIntervalSetup != null)
        clearInterval(currentNotiIntervalSetup);

    try {
        if (config.testType == 'self') {
            currentTotalDownloadSpeed = await getDownloadSpeed();
            currentTotalUploadSpeed = await getUploadSpeed();
        }
        else if (config.testType == 'fast') {
            currentTotalDownloadSpeed = await speedtest.getSpeed();
            currentTotalDownloadSpeed = currentTotalDownloadSpeed.toFixed(2);
            currentTotalUploadSpeed = await getUploadSpeed();
        }
        else if (config.testType == 'cloudflare') {
            cloudFlare().then(res => {
                currentTotalDownloadSpeed = res.downloadSpeed;
                currentTotalUploadSpeed = res.uploadSpeed;
            }).catch(err => {
                throw err;
            })
        }
        else if (config.testType == 'speedtest') {
            let browser = await puppeteer.launch({
                headless: true,
                args: ['--single-process', '--no-zygote', '--no-sandbox']
            })
            try {
                let page = await browser.newPage();
                page.setDefaultNavigationTimeout(0);
                await page.setCacheEnabled(false);
                await page.goto('https://www.speedtest.net/');
                let startTestBtn = await page.$x("//*[@class='start-text']");
                await startTestBtn[0].click();
                await page.waitForNavigation({ waitUntil: 'networkidle2' });
                let resultID = await page.$(".result-item-id .result-data a");
                let innerHTML = await page.evaluate(el => el.innerHTML, resultID)
                await page.goto('https://www.speedtest.net/result/' + innerHTML);
                let downloadItem = await page.$(".result-item-download .result-data span");
                let downloadSpeed = await page.evaluate(el => el.innerHTML, downloadItem)
                let uploadItem = await page.$(".result-item-upload .result-data span");
                let uploadSpeed = await page.evaluate(el => el.innerHTML, uploadItem)
                currentTotalDownloadSpeed = downloadSpeed;
                currentTotalUploadSpeed = uploadSpeed;
                browser.close();
            } catch (error) {
                browser.close();
                throw error;
            }
        }
        currentCheckIntervalSetup = setInterval(function () {
            if (currentTotalDownloadSpeed != null && currentTotalUploadSpeed != null)
                initUsageNotification();
        }, 1000);
        console.log('Interval hiện tại', config.notificationInterval)
        currentNotiIntervalSetup = setInterval(() => {
            if(currentDownloadUsage!=null && currentUploadUsage!=null)
            usageNotifier.emit('network_usage', {
                downloadBandwidth: currentTotalDownloadSpeed + ' Mbps',
                uploadBandwidth: currentTotalUploadSpeed + ' Mbps',
                currentDownloadUsage: ((currentDownloadUsage / 1000 / 1000) * 8).toFixed(2) + ' Mbps',
                currentUploadUsage: ((currentUploadUsage / 1000 / 1000) * 8).toFixed(2) + ' Mbps'
            })
        }, config.notificationInterval);
        return true;
    } catch (error) {
        // console.log(error)
        return false;
    }
}
function getDataUsage() {
    return new Promise((resolve, reject) => {
        let command = ''
        if (os.platform() == 'win32')
            command = "netstat -e";
        else
            command = "ifconfig"

        exec(command, (error, stdout, stderr) => {
            if (error) {
                // console.log(error);
                reject(null);
            }
            if (stderr) {
                // console.log(stderr);
                reject(null);
            }
            // console.log(stdout.toString());
            resolve(stdout.toString());
        });
    });
}
function extractRXTXLinux_Alpine(srcStr) {
    let ipStart = indexes(srcStr, 'mtu');
    let ipEnd = indexes(srcStr, 'collisions');
    let networkInterface = [];
    if (ipStart.length == ipEnd.length) {
        for (let i = 0; i < ipStart.length; ++i) {
            let subString = srcStr.substring(ipStart[i], ipEnd[i]);
            networkInterface.push(subString)
        }
    }

    let startRes = indexes(srcStr, 'bytes');
    let endRes = indexes(srcStr, 'B)');
    let result = []
    if (startRes.length == endRes.length) {
        for (let i = 0; i < startRes.length; ++i) {
            let subString = srcStr.substring(startRes[i], endRes[i]);
            let splitArr = subString.split(' ')
            if (splitArr.length > 2)
                result.push(splitArr[1]);
        }
    }
    return {
        speedArray: result,
        networkInterface: networkInterface
    }
}
function extractRXTXLinux_Ubuntu(srcStr) {
    let startRes = indexes(srcStr, 'bytes');
    let endRes = indexes(srcStr, ' (');
    let result = []
    if (startRes.length == endRes.length) {
        for (let i = 0; i < startRes.length; ++i) {
            result.push(srcStr.substring(startRes[i], endRes[i]).replace('bytes:', ''))
        }
    }
    return result
}
function extractRXTXWin(srcStr) {
    let startRes = indexes(srcStr, 'Bytes');
    let endRes = indexes(srcStr, `Unicast`);
    let result = []
    if (startRes.length == endRes.length) {
        for (let i = 0; i < startRes.length; ++i) {
            result.push(srcStr.substring(startRes[i], endRes[i] + 2))
        }
    }
    let temp = [];
    if (result.length > 0) {
        result[0] = result[0].replace('Bytes                    ', '');
        result[0] = result[0].replace(`\r\nUn`, '');
        temp = result[0].replace(/  +/g, '|').split('|')
    }
    return temp;
}
function indexes(source, find) {
    var result = [];
    for (i = 0; i < source.length; ++i) {
        if (source.substring(i, i + find.length) == find) {
            result.push(i);
        }
    }
    return result;
}
function indexes(source, find) {
    var result = [];
    for (i = 0; i < source.length; ++i) {
        if (source.substring(i, i + find.length) == find) {
            result.push(i);
        }
    }
    return result;
}
async function getDownloadSpeed() {
    startTime = (new Date()).getTime();
    let cacheBuster = '?nnn=' + startTime;
    imgAfterDownloaded = await axios.get(baseURL + imageAddr + cacheBuster, { responseType: "blob" })
    // console.log('Done testing download')
    endTime = (new Date()).getTime();
    const duration = (endTime - startTime) / 1000;
    const bitsLoaded = downloadSize * 8;
    const speedBps = (bitsLoaded / duration).toFixed(2);
    const speedKbps = (speedBps / 1024).toFixed(2);
    const speedMbps = (speedKbps / 1024).toFixed(2);
    return Number(speedMbps);
}
async function getUploadSpeed() {
    startTime = (new Date()).getTime();
    let cacheBuster = '?nnn=' + startTime;
    const response = await axios.get(baseURL + imageAddr + cacheBuster, { responseType: 'stream' });
    const form = new FormData();
    form.append('image', response.data, startTime.toLocaleString() + '.jpg');
    try {
        let res = await axios({
            method: "post",
            url: baseURL + 'uploadfile',
            data: form,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            headers: { 'Content-Type': 'multipart/form-data;boundary=' + form.getBoundary() }
        })
        endTime = (new Date()).getTime();
        // console.log('Done testing upload')

        if (res) {
            delFileAfterDoneUploading(res.data.data.fileName);
        }
        const duration = (endTime - startTime) / 1000;
        const bitsLoaded = downloadSize * 8;
        const speedBps = (bitsLoaded / duration).toFixed(2);
        const speedKbps = (speedBps / 1024).toFixed(2);
        const speedMbps = (speedKbps / 1024).toFixed(2);
        return Number(speedMbps);
    } catch (error) {
        // console.log(error)
        return null;
    }
}
async function delFileAfterDoneUploading(fileName) {
    let res = await axios.get(baseURL + 'deleteFileByFileName/' + fileName);
    // console.log(res)
}
module.exports = {
    "initNetworkCheck": initNetworkCheck,
    "usageNotifier": usageNotifier
}



