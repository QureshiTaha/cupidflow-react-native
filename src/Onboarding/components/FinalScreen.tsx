import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import UsernameLoginBottom from '../../components/UsernameLoginBottom';
import { storeData, storeDataJson } from '../../hooks/useAsyncStorage';
const { width: screenWidth } = Dimensions.get('window');

interface FinalScreenProps {
  onPrev: () => void;
  onLogin: () => void;
}

const FinalScreen: React.FC<FinalScreenProps> = ({ onPrev, onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [showLoginBottom, setShowLoginBottom] = useState(false);
  console.log('reached');
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      // Ensure play services available
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Try sign-in
      const { data } = await GoogleSignin.signIn();

      // ✅ Dummy handling for now — no backend
      console.log('Google User Info:', data);
      Alert.alert(
        'Welcome!',
        `Hello ${data?.user.name || 'User'} 👋\nEmail: ${data?.user.email}`,
      );
      onLogin();
    } catch (error: any) {
      console.log('Google Sign-In Error:', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Cancelled', 'Google Sign-In was cancelled.');
      } else {
        Alert.alert('Error', 'Something went wrong during Google Sign-In.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // 🔑 from Firebase console
      offlineAccess: true,
    });
  }, []);

  return (
    <View style={[styles.darkScreen, { width: screenWidth }]}>
      <Text style={styles.logoDark}>
        Cu<Text style={styles.logoAccent}>pid</Text>
      </Text>

      <Image
        source={require('../../assets/images/onboarding3.png')}
        style={[styles.illustration, { marginTop: 40 }]}
        resizeMode="contain"
      />

      <View style={styles.footerBox}>
        <Text style={styles.footerText}>
          Made with <Text style={styles.pinkText}>Love</Text>,{'\n'}For Lovely{' '}
          <Text style={styles.pinkText}>Couples</Text>
        </Text>
        {/* Username & Password Login Button */}
        <TouchableOpacity
          style={styles.usernameBtn}
          onPress={() => setShowLoginBottom(true)}
        >
          <Text style={styles.usernameText}>Login with Credentials</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.googleBtn, loading && { opacity: 0.7 }]}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <AntDesign name="google" size={20} color="#fff" />
              <Text style={styles.googleText}>Continue With Google</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By continuing, you agree to our{' '}
          <Text style={styles.linkText}>Privacy Policy</Text> and{' '}
          <Text style={styles.linkText}>Terms & Conditions</Text>
        </Text>
      </View>

      {showLoginBottom && (
        <UsernameLoginBottom
          onClose={() => setShowLoginBottom(false)}
          onLogin={onLogin} // ✅ triggers main screen navigation
        />
      )}
    </View>
  );
};

export default FinalScreen;

const styles = StyleSheet.create({
  darkScreen: { backgroundColor: '#0D0D1C', alignItems: 'center', flex: 1 },
  logoDark: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginTop: 40,
  },
  logoAccent: { color: '#FF5277' },
  illustration: { width: '80%', height: 250 },
  footerBox: {
    backgroundColor: '#FFF2F3',
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 50,
    alignItems: 'center',
    paddingVertical: 20,
    position: 'absolute',
    gap: 20,
    bottom: 0,
  },
  footerText: {
    color: '#444',
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 28,
  },
  pinkText: { color: '#FF5277' },
  googleBtn: {
    backgroundColor: '#FF5277',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 35,
    marginTop: 25,
  },
  googleText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  termsText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    width: '80%',
  },
  linkText: { color: '#FF5277' },
  navRow: {
    flexDirection: 'row',
    width: '60%',
    justifyContent: 'center',
    marginTop: 40,
  },
  circleBtn: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 40,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  usernameBtn: {
    backgroundColor: '#101031',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 35,
    marginTop: 10,
  },
  usernameText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
