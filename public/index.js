let localStream;
let remoteStream;
let peerConnection;
let APP_ID = 'd5168c0d1d104c27814cc73696167639' 
let uid = String(Math.floor(Math.random()* 10000))
let token = null ;
let client ;
let channel;



let queryString = window.location.search
let urlparams = new URLSearchParams(queryString)
let roomId = urlparams.get('room')

if(!roomId){
    // redirect to another page
}

// Default configuration - Change these if you have a different STUN or TURN server.
const servers = {
    iceServers:[
        {
            urls:['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
        }
    ]
}

let constraint = {
    video:{
        height:{min:640,ideal:1920,max:1920},
        hwidth:{min:480,ideal:1080,max:1080}
    },
    audio:false
    // audio:true
}

let init = async () => {
    // client = await AgoraRTM.createInstance(APP_ID)
    // await client.login({uid, token })

    // channel = client.createChannel(roomId)
    // await channel.join()


    // channel.on('MemberJoined', handleUserJoined)
    // client.on('MessageFromPeer', handleMessageFromPeer)
    // client.on('MessageLeft', handleUserLeft)

    localStream = await navigator.mediaDevices.getUserMedia(constraint)
    // localStream = await navigator.mediaDevices.getUserMedia({audio:false, video:true})
    document.getElementById('user-1').srcObject = localStream   
    document.getElementById('user-2').srcObject = localStream   
}

let handleUserJoined = async (MemberId)=>{
    console.log('A new user join the channel' , MemberId )
    createOffer(MemberId)


}

let  handleMessageFromPeer = async (message, MemberId) => {
    message = JSON.parse(message)
    if(message.type === 'offer'){
        createAnswer(MemberId, message.offer)
    }

    if(message.type === 'answer') {
        addAnswer(message.answer)
    }

    if(message.type === 'candidate') {
        if(peerConnection){
            peerConnection.addIceCandidate(message.candidate)
        }
    }
}

let handleUserLeft = async (MemberId) => {
    // remove user from dom
    // document.getElementById('user-2').style.display = 'none'
}

let createPeerConnection = async (MemberId)=> {

    peerConnection = new RTCPeerConnection(servers)

    remoteStream = new MediaStream()
    document.getElementById('user-2').srcObject = remoteStream

    if(!localStream){
        localStream = await navigator.mediaDevices.getUserMedia({audio:false,video:true})
        document.getElementById('user-1').srcObject = localStream  
    }

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
    })

    // add remote peer track 
    peerConnection.ontrack = async (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async (event)=>{
        if(event.candidate){
            console.log('NEW ICE CANDIDATE' , event.candidate)
            client.sendMessageToPeer({text:JSON.stringify({'type':'candidate', 'candidate':event.candidate})}, MemberId)
        }
    }
}


let createOffer = async (MemberId) => {
    await createPeerConnection(MemberId)
    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    client.sendMessageToPeer({text:JSON.stringify({'type':'offer', 'offer':offer})}, MemberId)

}

let createAnswer = async (MemberId, offer ) => {
    await createPeerConnection(MemberId)

    await peerConnection.setRemoteDescription(offer)

    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    client.sendMessageToPeer({text:JSON.stringify({'type':'answer', 'answer':answer})}, MemberId)
}


let addAnswer = async (answer) => {
    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer)
    }
}

// function to handle user leaving channel
let leaveChannel = async () => {
    await channel.leave()
    await channel.logout()
}


// audio, video and leave chat container 
let toggleCamera = async()=>{
    let videoTrack = localStream.getTracks().find(track => track.kind === 'video')

    if(videoTrack.enabled){
        videoTrack.enabled = false
        // style camera button 
        document.getElementById('camera-btn').style.backgroundColor = 'green'
    }
    else if(!videoTrack.enabled){
        videoTrack.enabled = true
        // style camera button 
        document.getElementById('camera-btn').style.backgroundColor = 'red'
    }
}


let toggleMic = async()=>{
    let audioTrack = localStream.getTracks().find(track => track.kind === 'audio')

    if(audioTrack.enabled){
        audioTrack.enabled = false
        // style camera button 
        document.getElementById('mic-btn').style.backgroundColor = 'green'
    }
    else if(!audioTrack.enabled){
        audioTrack.enabled = true
        // style camera button 
        document.getElementById('mic-btn').style.backgroundColor = 'red'
    }
}

window.addEventListener('beforeunload', leaveChannel )
init()