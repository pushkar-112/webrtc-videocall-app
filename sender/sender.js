const webSocket = new WebSocket("ws://127.0.0.1:3000")

webSocket.onmessage = (event) => {
    handleSignallingData(JSON.parse(event.data))
}

function handleSignallingData(data) {
    switch (data.type) {
        case "answer":
            peerConn.setRemoteDescription(data.answer)
            break
        case "candidate":
            peerConn.addIceCandidate(data.candidate)
    }
}

function sendData(data) {

    data.username = username
    //since webSocket.send() requires a string parameter use JSON to convert to string
    webSocket.send(JSON.stringify(data))
}

let username
let localStream
let peerConn
function startCall() {

    //send username to socket server and the server will store the username
    sendUsername()

    //make video div visible
    document.getElementById("video-call-div").style.display = "inline"

    
    //get video stream from device for local video
    //Syntax : navigator.getUserMedia(constraints, successCallback, errorCallback);
    //for reference : https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getUserMedia
    navigator.getUserMedia({
        video: {
            frameRate: 24,
            width: {
                min: 480, ideal: 720, max: 1280
            },
            aspectRatio: 1.33333
        },
        audio: true
    }, (stream) => {
                //the getUserMedia() function recieves a call-back function as its 2nd parameter which gets the stream and shows it in the localVideo (here stream is parameter of callback function).
        localStream = stream
        document.getElementById("local-video").srcObject = localStream

        let configuration = {
            iceServers: [
                {
                    "urls": ["stun:stun.l.google.com:19302", 
                    "stun:stun1.l.google.com:19302", 
                    "stun:stun2.l.google.com:19302"]
                }
            ]
        }

        peerConn = new RTCPeerConnection(configuration)
        peerConn.addStream(localStream)

        peerConn.onaddstream = (e) => {
            document.getElementById("remote-video")
            .srcObject = e.stream
        }

        peerConn.onicecandidate = ((e) => {
            if (e.candidate == null)
                return
            sendData({
                type: "store_candidate",
                candidate: e.candidate
            })
        })

        createAndSendOffer()
    }, (error) => {
        console.log(error)
    })
}

function sendUsername() {

    username = document.getElementById("username-input").value
    //calling sendData() function which takes object parammeter
    sendData({
        type: "store_user"
    })
}

function createAndSendOffer() {
    peerConn.createOffer((offer) => {
        sendData({
            type: "store_offer",
            offer: offer
        })

        peerConn.setLocalDescription(offer)
    }, (error) => {
        console.log(error)
    })
}

let isAudio = true
function muteAudio() {
    isAudio = !isAudio
    localStream.getAudioTracks()[0].enabled = isAudio
}

let isVideo = true
function muteVideo() {
    isVideo = !isVideo
    localStream.getVideoTracks()[0].enabled = isVideo
}