const skill = require("./alexa_camera_skill.js");

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
};
function generateMessageID() {
    return '38A28869-DD5E-48CE-BBE5-' + randomString(12, 16); // Dummy
}

const DISCOVER_REQUEST = {
    "directive": {
        "header": {
            "namespace": "Alexa.Discovery",
            "name": "Discover",
            "payloadVersion": "3",
            "messageId": "38A28869-DD5E-48CE-BBE5-00000000"
        },
        "payload": {
            "scope": {
                "type": "BearerToken",
                "token": "123456"
            }
        }
    }
};

const RETRIEVE_CAMERA_URI_REQUEST =
    {
        "directive": {
            "header": {
                "namespace": "Alexa.CameraStreamController",
                "name": "InitializeCameraStreams",
                "payloadVersion": "3",
                "messageId": "38A28869-DD5E-48CE-BBE5-00000001",
                "correlationToken": "123456"
            },
            "endpoint": {
                "endpointId": "98029b8000ef4f7524d80450bf4e9a15",
                "scope": {
                    "type": "BearerToken",
                    "token": "123456"
                },
                "cookie": {}
            },
            "payload": {
                "cameraStreams": [{
                    "protocol": "RTSP",
                    "resolution": {
                        "width": 1920,
                        "height": 1080
                    },
                    "authorizationType": "BASIC",
                    "videoCodec": "H264",
                    "audioCodec": "AAC"
                }, {
                    "protocol": "RTSP",
                    "resolution": {
                        "width": 1280,
                        "height": 720
                    },
                    "authorizationType": "NONE",
                    "videoCodec": "MPEG2",
                    "audioCodec": "G711"
                }]
            }
        }
    };


const TEST_CALLBACK = function(arg0, response){
    console.log("response: " + JSON.stringify(response));
};

skill.handler(DISCOVER_REQUEST, null, TEST_CALLBACK);
skill.handler(RETRIEVE_CAMERA_URI_REQUEST, null, TEST_CALLBACK);
