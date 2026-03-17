import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Feather';
import Toast from 'react-native-toast-notifications';

const API_BASE_URL = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1`;

const EnterOtpScreen = () => {
  const router = useRouter();
  const toastRef = useRef();
  const { userID } = useLocalSearchParams();

  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputRefs[index + 1].current.focus();
    }

    if (!text && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length !== 4) {
      toastRef.current?.show('Please enter all 4 digits', { type: 'danger' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/users/verify-otp`, {
        userID,
        otp: fullOtp,
      });

      if (response.data.status) {
        toastRef.current?.show('OTP verified successfully', { type: 'success' });
        setOtp(['', '', '', ''])
        inputRefs[0].current?.focus();
        router.push({ pathname: '../../pages/resetPassword', params: { userID } });
      } else {
        toastRef.current?.show(response.data.msg, { type: 'danger' });
      }
    } catch (error) {
      console.error(error);
      toastRef.current?.show('Server error. Please try again.', { type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Toast ref={toastRef} placement="top" />
      <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
        <Icon name="arrow-left" size={24} color="#000" />
      </TouchableOpacity>

      <Text style={styles.header}>Enter Verification Code</Text>
      <Text style={styles.description}>
        A 4-digit code has been sent to your email.
      </Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={inputRefs[index]}
            style={styles.otpBox}
            keyboardType="numeric"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            returnKeyType="next"
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.verifyButton, loading && { opacity: 0.6 }]}
        onPress={handleVerifyOtp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.verifyButtonText}>Verify</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

export default EnterOtpScreen;

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
    left: 24,
    padding: 8,
  },
  header: {
    fontSize: 26,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 30,
  },
  otpBox: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    color: '#000',
  },
  verifyButton: {
    backgroundColor: '#f472b6',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 10,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
