import React, { useEffect, useRef, useState } from 'react';
import { View, Button, StyleSheet, TouchableOpacity, Text, Alert, Platform, PermissionsAndroid } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSocket } from '../services/SocketContext';
import { router, useLocalSearchParams } from 'expo-router';
import { RTCView, RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, mediaDevices, MediaStream } from 'react-native-webrtc';
import { useToast } from 'react-native-toast-notifications';


const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

const VideoCallScreen = () => {
    const { socket } = useSocket();
    const { caller, receiver, chatID, isCaller, status_ } = useLocalSearchParams();
    const from = caller;
    const to = receiver;
    const [isCalling, setIsCalling] = useState(false);
    const [status, setStatus] = useState(status_ ? status_ : isCaller === 'true' ? 'Calling...' : 'Ringing...');
    const [isMuted, setIsMuted] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [localStreamURL, setLocalStreamURL] = useState(null);
    const [remoteStreamURL, setRemoteStreamURL] = useState(null);
    const pc = useRef(null);
    const [isInitCall, setIsInitCall] = useState(false);
    const [readyForOffer, setReadyForOffer] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(true);
    const toast = useToast();

    useEffect(() => {
        console.log("🎥 caller:", caller);
        console.log("🎥 receiver:", receiver);
        console.log("🎥 chatID:", chatID);
        console.log("🎥 isCaller:", isCaller)
        console.log("🎥 status:", status);
    }, [caller, receiver, chatID, isCaller, status_]);

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

    const createPeerConnection = (stream) => {
        pc.current = new RTCPeerConnection(iceServers);
        stream.getTracks().forEach(track => pc.current.addTrack(track, stream));

        pc.current.onicecandidate = ({ candidate }) => {
            if (candidate) socket.emit("icecandidate", { to, candidate });
        };

        pc.current.ontrack = (event) => {
            console.log("✅ ontrack", event);
            if (event.streams[0]) {
                const remote = event.streams[0];
                setRemoteStream(remote);
                setRemoteStreamURL(remote.toURL());
            }
        };
    };

    const startCall = async () => {
        const granted = await requestPermissions();
        if (!granted) return;

        const stream = await mediaDevices.getUserMedia({
            audio: true,
            video: {
                facingMode: 'user',
                width: 640,
                height: 480,
                frameRate: 30
            }
        });

        console.log('🎥 Got stream:', stream);
        console.log('🎥 Video tracks:', stream.getVideoTracks());

        const videoTrack = stream.getVideoTracks()[0];
        if (!videoTrack) {
            console.warn("❌ No video track received from getUserMedia!");
        } else {
            console.log("✅ Video track OK:", videoTrack);
            console.log("🎥 readyState:", videoTrack.readyState);
            console.log("🎥 muted:", videoTrack.muted);
            console.log("🎥 settings:", videoTrack.getSettings?.());
        }


        setLocalStream(stream);
        setLocalStreamURL(stream.toURL());

        createPeerConnection(stream);

        socket.emit("start-call", { from, to, chatID, userName: `${currentUser.userFirstName} ${currentUser.userSurname}` });

        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);
        socket.emit("send-offer", { from, to, offer });

        setIsCalling(true);
        setStatus('Calling...');
    };

    useEffect(() => {
        // socket.on("connect", () => {
        //     socket.emit("joinRoom", { chatID });
        //     socket.emit("joinChatList", { userID: from });
        // });

        // call-unavailable
        socket.on("call-unavailable", () => {
            toast.show('User is Offline', {
                type: 'danger',
                placement: 'top',
            });
            cleanup();
        });

        socket.on("offer", async ({ from: sender, offer }) => {
            const granted = await requestPermissions();
            if (!granted) return;

            const stream = await mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            setLocalStreamURL(stream.toURL());

            createPeerConnection(stream);
            await pc.current.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await pc.current.createAnswer();
            await pc.current.setLocalDescription(answer);
            socket.emit("answer", { from: to, to: sender, answer });
        });

        socket.on("answer", async ({ answer }) => {
            await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on("icecandidate", async (candidate) => {
            try {
                if (pc.current) {
                    await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (err) {
                console.error("❌ Failed to add ICE candidate", err);
            }
        });

        socket.on("call-rejected", cleanup);
        socket.on("user-video-call-disconnect", cleanup);
        socket.on("end-call", cleanup);

        return () => {
            socket.off("offer");
            socket.off("answer");
            socket.off("icecandidate");
            socket.off("call-rejected");
            socket.off("user-video-call-disconnect");
            socket.off("end-call");
        };
    }, []);

    useEffect(() => {
        const initCall = async () => {
            const granted = await requestPermissions();
            if (!granted) return null;
            if (isCaller) {
                console.log('Calling...');
                setStatus('Calling...');
                startCall();

            } else {
                console.log('Connected');
                setStatus('Connected');
            }

        };
        initCall();
        return () => cleanup();
    }, []);


    const cleanup = async () => {
        if (pc.current) {
            pc.current.close();
            pc.current = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        setLocalStream(null);
        setLocalStreamURL(null);
        setRemoteStream(null);
        setRemoteStreamURL(null);
        setIsCalling(false);
        if (router.canGoBack()) router.back();
    };

    const toggleMute = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const switchCamera = () => {
        const videoTrack = localStream?.getVideoTracks?.()[0];
        if (videoTrack && videoTrack._switchCamera) {
            videoTrack._switchCamera();
        }
    };

    const endCall = async () => {
        socket.emit("user-video-call-disconnect", { from, to });
        socket.emit("end-call", { to: isCaller === 'true' ? receiver : caller });
        await cleanup();

    };

    return (
        <View style={styles.container}>
            <Text style={styles.status}>{status}</Text>
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
    remoteVideoPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#222'
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