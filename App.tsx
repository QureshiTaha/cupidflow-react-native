import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AppNavigator from './src/AppNavigator';
import { getData } from './src/hooks/useAsyncStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
      offlineAccess: false,
    });
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const userInfo = await GoogleSignin.getCurrentUser();
      const token = await getData('authToken');
      // ✅ If token exists or Google user found, mark as logged in
      if (token || userInfo) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch {
      setIsLoggedIn(false);
    }
  };

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = async () => {
    try {
      await GoogleSignin.signOut();
      await AsyncStorage.clear();
    } catch (e) {
      console.warn('Error signing out:', e);
    }
    setIsLoggedIn(false);
  };

  if (isLoggedIn === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0D0D1C',
        }}
      >
        <ActivityIndicator size="large" color="#FF5277" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppNavigator
        isLoggedIn={isLoggedIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    </SafeAreaProvider>
  );
};

export default App;
