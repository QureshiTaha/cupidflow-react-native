import React from 'react';
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const { width: screenWidth } = Dimensions.get('window');

interface IntroScreenProps {
  onNext: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onNext }) => {
  return (
    <View style={{ width: screenWidth }}>
      <ImageBackground
        source={{
          uri: 'https://images.stockcake.com/public/0/c/6/0c66db9c-7066-496b-9c1b-9daa65d7e01f_large/silhouette-love-moment-stockcake.jpg',
        }}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <Text style={styles.logo}>
            Cu<Text style={styles.logoAccent}>pid</Text>
          </Text>
          <View
            style={{
              position: 'absolute',
              bottom: '20%',
              right: 16,
              alignItems: 'flex-end',
            }}
          >
            <Text style={styles.mainTitle}>SHARE EVERYTHING</Text>
            <Text style={styles.subTitle}>without saying</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
          <Feather name="arrow-right" size={28} color="#fff" />
        </TouchableOpacity>
      </ImageBackground>
    </View>
  );
};

export default IntroScreen;

const styles = StyleSheet.create({
  bgImage: { height: '100%', width: screenWidth, justifyContent: 'flex-end' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', padding: 20 },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  logoAccent: { color: '#FF5277' },
  mainTitle: {
    fontSize: 28,
    fontWeight: '500',
    letterSpacing: 1.2,
    color: '#fff',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 18,
    color: '#ffb3c1',
    letterSpacing: 1.1,
    marginTop: 8,
    textAlign: 'center',
  },
  nextBtn: {
    backgroundColor: '#FF5277',
    width: 55,
    height: 55,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 20,
    right: 22,
  },
});
