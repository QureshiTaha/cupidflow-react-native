import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-notifications';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { myConsole } from '../utils/myConsole';

const API_BASE_URL = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1`;

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [coolDown, setCoolDown] = useState(0);
  const toastRef = useRef();
  const router = useRouter();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const getCooldownDuration = (attempts) => {
    if (attempts <= 3) return 0;
    if (attempts === 4) return 5 * 60;
    if (attempts === 5) return 10 * 60;
    return 30 * 60;
  };

  const handleSendOTP = async () => {
    if (!email.trim()) {
      toastRef.current?.show('Email is required', { type: 'danger' });
      return;
    }

    try {
      const now = Date.now();
      const lastAttempt = parseInt(await AsyncStorage.getItem('lastAttempt') || '0');
      const attemptCount = parseInt(await AsyncStorage.getItem('attemptCount') || '0');
      const timePassed = Math.floor((now - lastAttempt) / 1000);

      // Reset attempt count after 24h
      if (timePassed > 24 * 60 * 60) {
        await AsyncStorage.setItem('attemptCount', '0');
      }

      const cooldown = getCooldownDuration(attemptCount);

      if (timePassed < cooldown) {
        const remaining = cooldown - timePassed;
        setCoolDown(remaining);
        toastRef.current?.show(`Please wait ${Math.ceil(remaining / 60)} min(s) to retry`, { type: 'danger' });
        return;
      }

      setLoading(true);

      const response = await axios.post(`${API_BASE_URL}/users/forgot-password`, {
        userEmail: email
      });
myConsole('responseforgetpasss',response)
      if (response.data?.status) {
        toastRef.current?.show(response.data.msg || 'OTP sent successfully', { type: 'success' });

        const newAttemptCount = attemptCount + 1;
        await AsyncStorage.setItem('attemptCount', `${newAttemptCount}`);
        await AsyncStorage.setItem('lastAttempt', `${Date.now()}`);

        setTimeout(() => {
          router.push(`./otpScreen?userID=${response.data.userID}`);
        }, 1500);
      } else {
        toastRef.current?.show(response.data?.msg || 'Failed to send OTP', { type: 'danger' });
      }
    } catch (error) {
      console.error('OTP Error:', error);
      toastRef.current?.show(
        error.response?.data?.msg || 'Server error. Please try again.',
        { type: 'danger' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (coolDown > 0) {
      timer = setInterval(() => {
        setCoolDown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [coolDown]);

  return (
    <>
      <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
        <Icon name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Toast ref={toastRef} placement="top" />

        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your registered email address to receive an OTP.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#aaa"
        />

        <TouchableOpacity
          style={[styles.button, (loading || coolDown > 0) && { opacity: 0.6 }]}
          onPress={handleSendOTP}
          disabled={loading || coolDown > 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {coolDown > 0 ? `Wait ${formatTime(coolDown)}` : 'Send OTP'}
            </Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  backIcon: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#f472b6',
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ForgotPasswordScreen;
