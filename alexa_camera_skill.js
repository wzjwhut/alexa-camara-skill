'use strict';

/**  */
const URL_DEVICES = "https://raw.githubusercontent.com/wzjwhut/alexa-camara-skill/master/mock/devices.json";
const URL_RETRIEVE_URI = "";

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

function generateResponse(name, payload) {
    return {
        header: {
            messageId: generateMessageID(),
            name: name,
            namespace: 'Alexa.ConnectedHome.Control',
            payloadVersion: '2',
        },
        payload: payload,
    };
}

function mydevice2AlexDevice(list){
    let discoveredDevices = new Array();
    if(list == undefined || list == null){
        return discoveredDevices;
    }
    return list;
    // for(let device of list){
    //
    //     let d = {
    //         // This id needs to be unique across all devices discovered for a given manufacturer
    //         endpointId: device.id,
    //         // Company name that produces and sells the smart home device
    //         manufacturerName:'Eques',
    //         // the model name of the endpoint
    //         modelName:'VEIU',
    //         // The name given by the user in your application. Examples include 'Bedroom light' etc
    //         friendlyName:device.nick,
    //         // This value will be shown in the Alexa app
    //         description: 'Smart door camera from Eques Inc.',
    //         // Indicates the group name where the device should display in the Alexa app
    //         displayCategories: [ "CAMERA" ],
    //         // String name/value pairs that provide additional information about a device for use by the skill.
    //         cookie:{
    //
    //         },
    //         // An array of capability objects that represents actions particular device supports and can respond to.
    //         // A capability object can contain different fields depending on the type.
    //         capabilities:[]
    //     }
    //
    //     discoveredDevices.push(d);
    // }

    /*    for(let device of list){
            let d = {
            // This id needs to be unique across all devices discovered for a given manufacturer
            applianceId: device.id,
            // Company name that produces and sells the smart home device
            manufacturerName: 'Eques',
            // Model name of the device
            modelName: 'VEIU',
            // Version number of the product
            version: '1.0',
            // The name given by the user in your application. Examples include 'Bedroom light' etc
            friendlyName: device.nick,
            // Should describe the device type and the company/cloud provider.
            // This value will be shown in the Alexa app
            friendlyDescription: 'Smart door camera from Eques Inc.',
            // Boolean value to represent the status sof the device at time of discovery
            "isReachable": device.online?true:false,
            "actions": [
              "retrieveCameraStreamUri",
            ],
            "applianceTypes":[
                   "CAMERA"
            ],
            };
            discoveredDevices.push(d);

        }*/
    return discoveredDevices;
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

    let getDeviceListUrl = 'https://alexa-user.ecamzone.cc/eques/amazon/get-device-list-v3?access_token=' + userAccessToken;
    https.get(getDeviceListUrl, (res) => {
        var str = "";
        res.on('data', (d) => {
            str += d;
        });
        res.on('end', function () {
            console.log("get device list result: " + str);
            let result = JSON.parse(str);
            responseDiscovery(callback, mydevice2AlexDevice(result.list));
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

    /*  */
    rtspDownstreamUrl = "rtsp://alexa-rtsp.ecamzone.cc:443/downstream/" + rtspToken;

    responseRetrieveCameraUri(request, callback, 'Response', {
        cameraStreams:[
            {
                uri: rtspDownstreamUrl,
                // expirationTime: "2017-02-03T16:20:50.52Z",
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