import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-notifications';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { myConsole } from '../utils/myConsole';

const API_BASE_URL = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1`;

export const themeColors = {
  color1: "#f38ea8",
  color2: "#ef7cca",
  color3: "#f4b595",
  color4: "#8f6adf",
};

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [coolDown, setCoolDown] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
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
      myConsole('responseforgetpasss', response);

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
        <Icon name="arrow-back" size={28} color={themeColors.color4} />
      </TouchableOpacity>

      <LinearGradient
        colors={['#fdf6f0', '#fff5f5', '#fef0f6']}
        style={styles.gradientBackground}
      >
        {/* Decorative circles */}
        <Animated.View style={[styles.circle, { backgroundColor: themeColors.color1, top: -30, right: -30 }]} />
        <Animated.View style={[styles.circle, { backgroundColor: themeColors.color2, bottom: -40, left: -20 }]} />
        <Animated.View style={[styles.circle, { backgroundColor: themeColors.color3, top: '40%', left: '10%' }]} />

        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Toast ref={toastRef} placement="top" />

          <View style={styles.formCard}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your registered email address to receive an OTP.
            </Text>

            <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
              <Icon
                name="email"
                size={22}
                color={isFocused ? themeColors.color2 : themeColors.color4}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#aaa"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, (loading || coolDown > 0) && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={loading || coolDown > 0}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[themeColors.color2, themeColors.color4]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {coolDown > 0 ? `Wait ${formatTime(coolDown)}` : 'Send OTP'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backIcon: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  circle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.1,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    color: '#2d2d2d',
    fontFamily: 'sans-serif-medium',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'sans-serif',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 15,
    paddingHorizontal: 16,
    marginBottom: 25,
    backgroundColor: '#fafafa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputWrapperFocused: {
    borderColor: themeColors.color2,
    shadowColor: themeColors.color2,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontFamily: 'sans-serif',
  },
  button: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: themeColors.color4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'sans-serif-medium',
  },
});

export default ForgotPasswordScreen;