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
            "messageId": generateMessageID()
        },
        "payload": {
            "scope": {
                "type": "BearerToken",
                "token": "10c94b1af7e24392a23ac8aba5d2985d_N15Gt3qKL2dIwB54"
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
                "messageId": generateMessageID(),
                "correlationToken": "dFMb0z+PgpgdDmluhJ1LddFvSqZ/jCc8ptlAKulUj90jSqg=="
            },
            "endpoint": {
                "endpointId": "98029b8000ef4f7524d80450bf4e9a15",
                "scope": {
                    "type": "BearerToken",
                    "token": "10c94b1af7e24392a23ac8aba5d2985d_N15Gt3qKL2dIwB54"
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
skill.handler(RETRIEVE_CAMERA_URI, null, TEST_CALLBACK);
