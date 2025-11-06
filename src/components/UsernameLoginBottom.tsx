import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import CustomTextInput from './CustomTextInput';
import { API_AXIOS } from '../api/axiosInstance';
import { storeData, storeDataJson } from '../hooks/useAsyncStorage';

const schema = Yup.object({
  userEmail: Yup.string().email('Invalid Email').required('Email is required'),
  userPassword: Yup.string()
    .min(6, 'Min 6 chars')
    .required('Password required'),
});

const UsernameLoginBottom = ({ onClose, onLogin }: any) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('🟢 UsernameLoginBottom mounted');
  }, []);

  const handleSubmit = async (values: any) => {
    console.log('🟢 handleSubmit called with values:', values);
    try {
      setLoading(true);
      const res = await API_AXIOS.post('users/login', values);
      console.log('🟢 API Response:', res.data);

      if (res?.data?.data?.accessToken) {
        await storeData('authToken', res.data.data.accessToken);
        console.log('✅ Token stored:', res.data.data.accessToken);
      }

      if (res?.data?.data?.UserData) {
        await storeDataJson('userInfo', res.data.data.UserData);
        console.log('✅ User info stored:', res.data.data.UserData);
      }

      onLogin?.(); // ✅ set isLoggedIn(true) in App
      onClose();
    } catch (err: any) {
      console.log('❌ API Error:', err?.response?.data || err.message);
      Alert.alert('Error', err?.response?.data?.msg || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.sheet}>
      <Text style={styles.title}>Login</Text>
      <Formik
        initialValues={{
          userEmail: 'rushibhumkar11@gmail.com',
          userPassword: 'testing5',
        }}
        validationSchema={schema}
        onSubmit={handleSubmit}
      >
        {formik => (
          <>
            <CustomTextInput
              label="Email"
              name="userEmail"
              formik={formik}
              placeholder="Enter Email"
            />
            <CustomTextInput
              label="Password"
              name="userPassword"
              formik={formik}
              secureTextEntry
              placeholder="Enter Password"
            />
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => {
                console.log('🟡 Form submit clicked');
                formik.handleSubmit();
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginText}>Login</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </Formik>

      <TouchableOpacity onPress={onClose}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#FFF2F3',
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#101031',
    marginBottom: 20,
  },
  loginBtn: {
    backgroundColor: '#FF5277',
    borderRadius: 30,
    paddingVertical: 12,
    marginTop: 15,
    alignItems: 'center',
  },
  loginText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cancelText: {
    textAlign: 'center',
    color: '#101031',
    marginTop: 20,
    fontWeight: '500',
  },
});

export default UsernameLoginBottom;
