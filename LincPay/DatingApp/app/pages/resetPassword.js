import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/Feather';
import Toast from 'react-native-toast-notifications';
import axios from 'axios';

const API_BASE_URL = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1`;

const ResetPasswordScreen = () => {
  const router = useRouter();
  const toastRef = useRef();
  const { userID } = useLocalSearchParams();

  const [password, setPassword] = useState('');
  const [secureEntry, setSecureEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const toggleSecureEntry = () => setSecureEntry(!secureEntry);

  const handleResetPassword = async () => {
    if (!password) {
      toastRef.current?.show('Please enter your new password', { type: 'danger' });
      return;
    }

    if (password.length < 6) {
      toastRef.current?.show('Password must be at least 6 characters long', { type: 'danger' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/users/reset-password`, {
        userID,
        password,
      });

      if (response.data.status) {
        setSuccessModalVisible(true); 
      } else {
        toastRef.current?.show(`❌ ${response.data.msg}`, { type: 'danger' });
      }
    } catch (error) {
      console.error(error);
      toastRef.current?.show('Server error. Please try again.', { type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setSuccessModalVisible(false);
    router.replace('../pages/login'); // or '/login'
  };

  return (
    <>
      <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
        <Icon name="arrow-left" size={24} color="#000" />
      </TouchableOpacity>

      <View style={styles.container}>
        <Toast ref={toastRef} placement="top" />
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Set a new password for your account</Text>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Enter new password"
            secureTextEntry={secureEntry}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity onPress={toggleSecureEntry} style={styles.eyeIcon}>
            <Icon name={secureEntry ? 'eye-off' : 'eye'} size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Reset Password</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thank You!</Text>
            <Text style={styles.modalMessage}>Your password has been successfully updated.</Text>
            <TouchableOpacity onPress={handleModalClose} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default ResetPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
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
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
