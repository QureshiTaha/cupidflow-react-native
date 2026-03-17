// WebRTCComponent.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Button,
  StyleSheet,
  Text,
  Alert,
  Platform,
  PermissionsAndroid,
  TouchableOpacity,
} from "react-native";
import {
  RTCView,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
} from "react-native-webrtc";
import { useSocket } from "../services/SocketContext";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { useToast } from "react-native-toast-notifications";
const iceServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const WebRTCComponent = () => {
  const { socket } = useSocket();
  const { from_, to_, chatID, isCaller, status_, currentUser_ } =
    useLocalSearchParams();
  const isCallerBool = isCaller === true || String(isCaller) === "true";
  const currentUser = useMemo(
    () => JSON.parse(currentUser_ || "{}"),
    [currentUser_]
  );
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [status, setStatus] = useState(
    status_ ? status_ : isCallerBool ? "Calling..." : "Ringing..."
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [localStreamURL, setLocalStreamURL] = useState(null);
  const [remoteStreamURL, setRemoteStreamURL] = useState(null);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const pc = useRef(null);
  const [isCalling, setIsCalling] = useState(false);
  const toast = useToast();
  // const from = "0ddc7770-bb8f-4308-aad5-4e483770fd07";
  // const to = "5c7a9f53-fe61-4b11-afaf-0d465c7a6b04";

  // const to = "0ddc7770-bb8f-4308-aad5-4e483770fd07";
  // const from = "5c7a9f53-fe61-4b11-afaf-0d465c7a6b04";
  const from = from_;
  const to = to_;
  console.log("✅ ✅ to", to);
  console.log("✅ ✅ from", from);

  // const chatID = "036b2676-6e03-4b34-aedf-ae4efcd3ffca";

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
      const allGranted = Object.values(granted).every(
        (p) => p === PermissionsAndroid.RESULTS.GRANTED
      );
      if (!allGranted) {
        Alert.alert(
          "Permissions required",
          "Camera and Mic are needed for the call."
        );
        return false;
      }
    }
    return true;
  };

  const createPeerConnection = (stream) => {
    pc.current = new RTCPeerConnection(iceServers);
    stream.getTracks().forEach((track) => pc.current.addTrack(track, stream));

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
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: {
        facingMode: "user",
        width: 640,
        height: 480,
        frameRate: 30,
      },
    });

    setLocalStream(stream);
    setLocalStreamURL(stream.toURL());

    createPeerConnection(stream);
    console.log("dataSend", currentUser);

    socket.emit("start-call", {
      from,
      to,
      chatID,
      userName: `${currentUser.userFirstName} ${currentUser.userSurname}`,
    });

    setIsCalling(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log(
        "isCaller",
        isCaller,
        "isConnected",
        isConnected,
        "status",
        status
      );

      if (
        isCallerBool &&
        !isConnected &&
        status.toLowerCase() !== "connected"
      ) {
        toast.show("Call disconnected, Call Not Received", {
          type: "danger",
          placement: "top",
        });
        socket.emit("user-video-call-disconnect", { from, to });
        cleanup();
      }
    }, 30000); // 30 seconds

    return () => clearTimeout(timer); // Cleanup on unmount
  }, [isCallerBool, isConnected, status]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (status_ === "calling") {
      const id = setTimeout(startCall, 300);
      return () => clearTimeout(id);
    }
  }, [status_]);
  useEffect(() => {
    socket.on("connect", () => {
      socket.emit("joinRoom", { chatID });
      socket.emit("joinChatList", { userID: from });
    });
    socket.on("call-accepted", async () => {
      console.log("Call accepted");
      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);
      socket.emit("send-offer", { from, to, offer });
    });

    socket.on("call-unavailable", () => {
      toast.show("User is Offline", {
        type: "danger",
        placement: "top",
      });
      cleanup();
    });

    socket.on("offer", async ({ from, offer }) => {
      const granted = await requestPermissions();
      if (!granted) return;

      const stream = await mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          facingMode: "user",
          width: 640,
          height: 480,
          frameRate: 30,
        },
      });
      setLocalStream(stream);
      setLocalStreamURL(stream.toURL());

      createPeerConnection(stream);
      await pc.current.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);
      socket.emit("answer", { from: to, to: from, answer });
    });

    socket.on("answer", async ({ answer }) => {
      await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("icecandidate", async (candidate) => {
      try {
        if (pc.current) {
          await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
        setStatus("Connected");
        setIsConnected(true);
      } catch (err) {
        console.error("❌ Failed to add ICE candidate", err);
      }
    });

    socket.on("call-rejected", cleanup);
    socket.on("user-video-call-disconnect", cleanup);
    socket.on("end-call", cleanup);
    socket.on("call-ended", cleanup);
    socket.on("call-disconnected", cleanup);

    return () => {
      socket.off("connect");
      socket.off("offer");
      socket.off("answer");
      socket.off("icecandidate");
      socket.off("call-rejected");
      socket.off("user-video-call-disconnect");
      socket.off("end-call");
      socket.off("call-ended");
      socket.off("call-disconnected");
      socket.off("call-accepted");
    };
  }, []);

  const cleanup = async () => {
    try {
      if (pc.current) {
        pc.current.onicecandidate = null;
        pc.current.ontrack = null;
      }
    } catch {}
    try {
      // fully inactivate all transceivers
      pc.current?.getTransceivers?.()?.forEach((t) => {
        try {
          t.setDirection?.("inactive");
        } catch {}
        try {
          t.stop?.();
        } catch {}
      });
    } catch {}
    try {
      // stop & detach local tracks
      const senders = pc.current?.getSenders?.() || [];
      senders.forEach((s) => {
        try {
          s.replaceTrack?.(null);
        } catch {}
        try {
          s.track && s.track.stop();
        } catch {}
      });
    } catch {}
    try {
      // stop any remote tracks (iOS mic/cam indicator can linger if receiver track remains alive)
      remoteStream?.getTracks?.().forEach((t) => t.stop());
    } catch {}
    try {
      localStream?.getTracks?.().forEach((t) => t.stop());
    } catch {}
    try {
      pc.current?.close?.();
    } catch {}
    pc.current = null;

    setLocalStream(null);
    setLocalStreamURL(null);
    setRemoteStream(null);
    setRemoteStreamURL(null);
    setIsCalling(false);
    setStatus("Disconnected");
    if (router.canGoBack()) {
      router.back();
    }
  };

  const endCall = async () => {
    console.log("ending call");

    socket.emit("user-video-call-disconnect", { from, to });
    socket.emit("disconnect-call", { from, to });
    console.log("starting cleanup");

    await cleanup();
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

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoPaused(!videoTrack.enabled);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Call Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      {/* Remote Video */}
      {remoteStreamURL ? (
        <RTCView
          style={styles.remoteVideo}
          streamURL={remoteStreamURL}
          mirror={false}
          zOrder={1}
          objectFit="cover"
        />
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            Waiting for remote video...
          </Text>
        </View>
      )}

      {/* Local Video */}
      {localStreamURL && (
        <RTCView
          style={styles.localVideo}
          streamURL={localStreamURL}
          objectFit="cover"
          mirror={true}
          zOrder={2}
        />
      )}

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Mute */}
        <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
          <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color="#fff" />
        </TouchableOpacity>
        {/* Switch Camera */}
        <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
          <Ionicons name="camera-reverse" size={28} color="#fff" />
        </TouchableOpacity>
        {/* Toggle Video */}
        <TouchableOpacity style={styles.controlButton} onPress={toggleVideo}>
          <Ionicons
            name={isVideoPaused ? "videocam-off" : "videocam"}
            size={28}
            color="#fff"
          />
        </TouchableOpacity>
        {/* End Call */}
        <TouchableOpacity
          style={[styles.controlButton, styles.endButton]}
          onPress={endCall}
        >
          <Ionicons name="call" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  statusContainer: {
    position: "absolute",
    top: 40,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    zIndex: 10,
  },
  statusText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  remoteVideo: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#888",
    fontSize: 18,
  },
  localVideo: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  controlsContainer: {
    position: "absolute",
    bottom: 30,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },
  controlButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 14,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  endButton: {
    backgroundColor: "#e93e3e",
  },
});

export default WebRTCComponent;
