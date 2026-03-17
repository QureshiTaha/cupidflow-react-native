// components/CallManager.js
import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSocket } from '../services/SocketContext';
import { router } from 'expo-router';
import { Audio } from 'expo-av';

export default function CallManager({ currentUser }) {
    const { socket } = useSocket();
    const [incomingCall, setIncomingCall] = useState(null);
    const [fadeAnim] = useState(new Animated.Value(0));
    const ringtoneRef = useRef(null);

    const playRingtone = async () => {
        try {
            console.log('🔊 Playing ringtone...');
            const { sound } = await Audio.Sound.createAsync(
                require('../../assets/audio/ringtone.mp3'),
                { shouldPlay: true, isLooping: true }
            );
            ringtoneRef.current = sound;
            await sound.playAsync();
        } catch (error) {
            console.error('🔇 Error playing ringtone:', error);
        }
    };

    const stopRingtone = async () => {
        const sound = ringtoneRef.current;
        console.log('🔕 Stopping ringtone...', sound);
        if (sound) {
            try {
                await sound.stopAsync();
                await sound.unloadAsync();
            } catch (e) {
                console.warn('Failed to stop/unload ringtone:', e);
            }
            ringtoneRef.current = null;
        }
    };

    useEffect(() => {
        if (!socket || !currentUser) return;

        const handleIncomingCall = ({ from, chatID, userName }) => {
            setIncomingCall({ from, chatID, userName });
            playRingtone();
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        };

        const handleCallDisconnected = () => {
            console.log('INC Call disconnected');
            stopRingtone();
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setIncomingCall(null));

        };

        socket.on('incoming-call', handleIncomingCall);
        socket.on('incoming-call-disconnected', handleCallDisconnected);

        return () => {
            socket.off('incoming-call', handleIncomingCall);
            socket.off('incoming-call-disconnected', handleCallDisconnected);
        };
    }, [socket, currentUser, fadeAnim]);

    const acceptCall = () => {
        if (!incomingCall) return;
        socket.emit('accept-call', { to: incomingCall.from, from: currentUser.userID });
        router.push({
            pathname: '../pages/WebRTCComponent',
            params: {
                from_: currentUser.userID,
                to_: incomingCall.from,
                chatID: incomingCall.chatID,
                isCaller: false,
                currentUser_: JSON.stringify(currentUser),
                status_: 'ringing',
            },
        });
        stopRingtone();
        setIncomingCall(null);
    };

    const rejectCall = () => {
        if (!incomingCall) return;
        socket.emit('reject-call', { to: incomingCall.from });
        stopRingtone();
        setIncomingCall(null);
    };

    if (!incomingCall) return null;

    return (
        <Modal transparent visible animationType="fade">
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <View style={styles.card}>
                    <Text style={styles.title}>📞{incomingCall.userName}</Text>
                    <Text style={styles.caller}>Video Call Incoming</Text>
                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity style={styles.acceptButton} onPress={acceptCall}>
                            <Text style={styles.acceptText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.rejectButton} onPress={rejectCall}>
                            <Text style={styles.rejectText}>Reject</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: '#00000088',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 10,
        color: '#222',
    },
    caller: {
        fontSize: 18,
        color: '#555',
        marginBottom: 25,
    },
    buttonsContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-around',
    },
    acceptButton: {
        backgroundColor: '#34C759',
        paddingVertical: 14,
        paddingHorizontal: 25,
        borderRadius: 30,
        elevation: 3,
        shadowColor: '#000',
    },
    rejectButton: {
        backgroundColor: '#FF3B30',
        paddingVertical: 14,
        paddingHorizontal: 25,
        borderRadius: 30,
        elevation: 3,
        shadowColor: '#000',
    },
    acceptText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    rejectText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});