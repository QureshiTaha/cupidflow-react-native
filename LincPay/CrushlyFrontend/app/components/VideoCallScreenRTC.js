import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Alert
} from 'react-native';
import {
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    RTCView,
    mediaDevices,
    MediaStream
} from 'react-native-webrtc';
import { PermissionsAndroid, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSocket } from '../services/SocketContext';
import { router, useLocalSearchParams } from 'expo-router';


const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
};

const VideoCallScreen = () => {
    const { socket } = useSocket();
    const { caller, receiver, chatID, isCaller, status_ } = useLocalSearchParams();
    const [status, setStatus] = useState(status_ ? status_ : isCaller === 'true' ? 'Calling...' : 'Ringing...');
    const [isMuted, setIsMuted] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [localStreamURL, setLocalStreamURL] = useState(null);
    const [remoteStreamURL, setRemoteStreamURL] = useState(null);
    const pcRef = useRef(null);


    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const [isInitCall, setIsInitCall] = useState(false);
    const [readyForOffer, setReadyForOffer] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(true);
    const from = caller;
    const to = receiver;

    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.CAMERA,
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            ]);

            const allGranted = Object.values(granted).every(
                permission => permission === PermissionsAndroid.RESULTS.GRANTED
            );

            if (!allGranted) {
                Alert.alert('Permission Denied', 'Camera and microphone access is required.');
                return false;
            }
        }
        return true;
    };
    useEffect(() => {
        const initCall = async () => {
            const granted = await requestPermissions();
            if (!granted) return null;
            console.log('Caller:', caller);

            if (caller) {
                const stream = await mediaDevices.getUserMedia({
                    audio: true,
                    video: {
                        width: 640,
                        height: 480,
                        frameRate: 30
                    }
                });
                setLocalStream(stream);
                console.log('Local stream:', stream);

                setLocalStreamURL(stream.toURL());
                console.log('Starting call', {
                    to: receiver,
                    from: caller,
                    chatID: chatID
                });

                socket.emit('start-call', {
                    to: receiver,
                    from: caller,
                    chatID: chatID
                });

                setReadyForOffer(true);
                setIsInitCall(true);
            } else {
                alert("You are logged out");
                navigate("/");
            }
        };

        initCall();
    }, []);


    const PeerConnection = (function () {
        let peerConnection;

        const createPeerConnection = async () => {
            const config = {
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun2.1.google.com:19302" },
                ],
            };
            peerConnection = new RTCPeerConnection(config);

            localStream.getTracks().forEach((track) => {
                peerConnection.addTrack(track, localStream);
            });

            peerConnection.ontrack = (event) => {
                console.log("✅ ontrack event received:", event);

                if (event.streams && event.streams[0]) {
                    const inboundStream = event.streams[0];
                    setRemoteStream(inboundStream);
                    setRemoteStreamURL(inboundStream.toURL());
                    console.log("🎥 Remote stream set:", inboundStream.toURL());
                } else {
                    console.warn("⚠️ ontrack received without stream");
                }
            };


            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("icecandidate", {
                        candidate: event.candidate,
                        to: receiver,
                    });
                }
            };

            return peerConnection;
        };

        return {
            getInstance: async () => {
                if (!peerConnection) {
                    peerConnection = await createPeerConnection();
                }
                return peerConnection;
            },
        };
    })();


    useEffect(() => {
        if (isInitCall && readyForOffer) {
            const sendOffer = async () => {
                const pc = await PeerConnection.getInstance();
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit("offer", { from, to, offer: pc.localDescription });
            };

            sendOffer();
        }
    }, [readyForOffer, isInitCall, from, to]);

    useEffect(() => {
        if (isInitCall) {
            socket.on("offer", async ({ from, offer }) => {
                const pc = await PeerConnection.getInstance();
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                console.log("\n\nanswering from ", from, "to", to);

                socket.emit("answer", { from, to, answer: pc.localDescription });
            });

            socket.on("call-rejected", async () => {
                console.log("Call Declined");

                const pc = await PeerConnection.getInstance();
                pc.close();
                localStream.getTracks().forEach((track) => track.stop());
                setLocalStream(null);
                alert("Call Declined");
                if (router.canGoBack()) router.back();
            })

            socket.on("answer", async ({ answer }) => {
                const pc = await PeerConnection.getInstance();
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            });

            socket.on("icecandidate", async (candidate) => {
                const pc = await PeerConnection.getInstance();
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            });

            socket.on("error", (error) => {
                console.error("Socket error:", error.message);
                alert(`Socket error: ${error.message}`);
            });
            socket.on("user-video-call-disconnect", async () => {
                const pc = await PeerConnection.getInstance();
                pc.close();
                localStream.getTracks().forEach((track) => track.stop());
                setLocalStream(null);
                alert("Call Declined");
                router.canGoBack() && router.back();
            });
        }

        return () => {
            socket.off("offer");
            socket.off("answer");
            socket.off("icecandidate");
            socket.off("error");
            socket.off("user-video-call-disconnect");
        };
    }, [isInitCall]);


    const toggleMute = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
                console.log('Mic muted:', !audioTrack.enabled);
            }
        }
    };

    const switchCamera = () => {
        if (localStream.current) {
            const videoTrack = localStream.current.getVideoTracks()[0];
            if (videoTrack && videoTrack._switchCamera) {
                console.log('Switching camera');
                videoTrack._switchCamera();
            }
        }
    };

    const endCall = () => {
        console.log('Ending call');
        socket.emit("user-video-call-disconnect", { from, to });
        socket.emit('end-call', {
            to: isCaller === 'true' ? receiver : caller
        });
        // cleanup();
        if (router.canGoBack()) {
            router.back();
        }
    };

    useEffect(() => {
        if (remoteStream) {
            const url = remoteStream.toURL();
            setRemoteStreamURL(url);
            console.log("🎥 Remote stream URL set:", url);
        }
    }, [remoteStream]);

    useEffect(() => {
        if (localStream) {
            const url = localStream.toURL();
            setLocalStreamURL(url);
            console.log("📹 Local stream URL set:", url);
        }
    }, [localStream]);
    return (
        <View style={styles.container}>
            <Text style={styles.status}>{status}</Text>

            {/* {remoteStreamURL ? (
                <RTCView
                    streamURL={remoteStreamURL}
                    style={styles.remoteVideo}
                    objectFit="cover"
                    mirror={false}
                    zOrder={1}
                    onError={(e) => console.error('RTCView Error:', e.nativeEvent)}
                />
            ) : (
                <View style={styles.remoteVideoPlaceholder}>
                    <Text style={styles.text}>Waiting for remote video...</Text>
                </View>
            )} */}

            {remoteStreamURL ? (
                <RTCView
                    streamURL={remoteStreamURL}
                    style={styles.remoteVideo}
                    objectFit="cover"
                    mirror={false}
                    zOrder={1}
                />
            ) : (
                <View style={styles.remoteVideoPlaceholder}>
                    <Text style={styles.text}>🔄 Waiting for remote video...</Text>
                </View>
            )}


            {localStreamURL && (
                <RTCView
                    streamURL={localStreamURL}
                    style={styles.localVideo}
                    objectFit="cover"
                    mirror={true}
                    zOrder={2}
                />
            )}

            <View style={styles.controls}>
                <TouchableOpacity onPress={toggleMute} style={styles.controlButton}>
                    <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={32} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={switchCamera} style={styles.controlButton}>
                    <Ionicons name="camera-reverse" size={32} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={endCall} style={styles.controlButton}>
                    <Ionicons name="call" size={32} color="red" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center'
    },
    remoteVideo: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'red'
    },
    // remoteVideoPlaceholder: {
    //     flex: 1,
    //     justifyContent: 'center',
    //     alignItems: 'center',
    //     backgroundColor: 'black',
    //     width: '100%',
    //     height: '100%'
    // },
    remoteVideoPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#222',
    },
    localVideo: {
        position: 'absolute',
        width: 120,
        height: 160,
        bottom: 100,
        right: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'white'
    },
    controls: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 20
    },
    controlButton: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 15,
        borderRadius: 50
    },
    status: {
        position: 'absolute',
        top: 50,
        color: 'white',
        fontSize: 18,
        zIndex: 100
    },
    text: {
        color: 'white',
        fontSize: 16
    }
});

export default VideoCallScreen;