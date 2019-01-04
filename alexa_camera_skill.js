'use strict';

/**  */
const URL_DEVICES = "https://raw.githubusercontent.com/wzjwhut/alexa-camara-skill/master/mock/devices.json";
const URL_RETRIEVE_URI = "https://raw.githubusercontent.com/wzjwhut/alexa-camara-skill/master/mock/camera-uri.json";

const https = require('https');
function log(title, msg) {
    console.log(`[${title}] ${msg}`);
}

/**
 *  Usage:
 *  randomString(8, 16), generate 8 length hex str
 *  randomString(8), generate 8 length alpha and number str
 */
function randomString(len, bits)
{
    bits = bits || 36;
    var outStr = "", newStr;
    while (outStr.length < len)
    {
        newStr = Math.random().toString(bits).slice(2);
        outStr += newStr.slice(0, Math.min(newStr.length, (len - outStr.length)));
    }
    return outStr.toUpperCase();
}

function generateMessageID() {
    return '38A28869-DD5E-48CE-BBE5-' + randomString(12, 16); // Dummy
}

function responseDiscovery(callback, discoveredDevices){
    const response = {
        event:{
            header: {
                messageId: generateMessageID(),
                name: 'Discover.Response',
                namespace: 'Alexa.Discovery',
                payloadVersion: '3',
            },
            payload: {
                endpoints: discoveredDevices,
            },
        }
    };
    log('DEBUG', `Discovery Response: ${JSON.stringify(response)}`);
    callback(null, response);
}

function handleDiscovery(request, callback) {
    log('DEBUG', `Discovery Request: ${JSON.stringify(request)}`);
    const userAccessToken = request.directive.payload.scope.token.trim();
    let getDeviceListUrl = URL_DEVICES + '?access_token=' + userAccessToken;
    https.get(getDeviceListUrl, (res) => {
        var str = "";
        res.on('data', (d) => {
            str += d;
        });
        res.on('end', function () {
            console.log("get device list result: " + str);
            let result = JSON.parse(str);
            responseDiscovery(callback, result);
        });
    }).on('error', (e) => {
        console.error(e);
        responseDiscovery(callback, []);
    });
}

function responseRetrieveCameraUri(request, callback, name, playload){
    const response = {
        event:{
            header: {
                namespace: 'Alexa.CameraStreamController',
                name: name,
                payloadVersion: '3',
                messageId: generateMessageID(),
                correlationToken: request.directive.header.correlationToken,
            },
            payload: playload,
        }
    };
    log('DEBUG', `Query Response: ${JSON.stringify(response)}`);
    callback(null, response);
}

function handleRetrieveCameraUri(request, callback){
    const userAccessToken = request.directive.endpoint.scope.token.trim();

    let deviceId = request.directive.endpoint.endpointId;
    let url = URL_RETRIEVE_URI + '?access_token=' + userAccessToken + "&deviceId=" + deviceId;
    https.get(url, (res) => {
        var str = "";
        res.on('data', (d) => {
            str += d;
        });
        res.on('end', function () {
            console.log("retrieve camera uri result: " + str);
            let result = JSON.parse(str);
            let rtspUri = result.uri;
            responseRetrieveCameraUri(request, callback, 'Response', {
                cameraStreams:[
                    {
                        uri: rtspUri,
                        idleTimeoutSeconds: 15,
                        protocol: "RTSP",
                        resolution: {
                            width: 640,
                            height: 480
                        },
                        authorizationType: "BASIC",
                        videoCodec: "H264",
                        audioCodec: "AAC"
                    }
                ],
            });
        });
    }).on('error', (e) => {
        console.error(e);
        responseDiscovery(callback, []);
    });
}

function handleQuery(request, callback){
    log('DEBUG', `Query Request: ${JSON.stringify(request)}`);
    switch (request.directive.header.name) {
        case 'InitializeCameraStreams': {
            handleRetrieveCameraUri(request, callback);
            break;
        }
        default:
            break;
    }
}

exports.handler = (request, context, callback) => {
    switch (request.directive.header.namespace) {
        case 'Alexa.Discovery':
            handleDiscovery(request, callback);
            break;
        case 'Alexa.CameraStreamController':
            handleQuery(request, callback);
            break;
        default: {
            const errorMessage = `No supported namespace: ${request.directive.header.namespace}`;
            log('ERROR', errorMessage);
            callback(new Error(errorMessage));
        }
    }
};