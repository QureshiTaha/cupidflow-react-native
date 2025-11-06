import React from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

interface RoundScreenProps {
  roundNumber: number;
  imageUri: any;
  leftText?: string;
  rightText?: string;
  onPrev: () => void;
  onNext: () => void;
}

const RoundScreen: React.FC<RoundScreenProps> = ({
  roundNumber,
  imageUri,
  leftText,
  rightText,
  onPrev,
  onNext,
}) => {
  return (
    <SafeAreaView
      style={[styles.darkScreen, { width: screenWidth }]}
      edges={['top']}
    >
      {/* Round Number */}
      <Text style={styles.roundText}>
        Round<Text style={styles.roundAccent}> {roundNumber}</Text>
      </Text>

      {/* Illustration */}
      <Image
        source={typeof imageUri === 'string' ? { uri: imageUri } : imageUri}
        style={styles.illustration}
        resizeMode="contain"
      />
      {/* Left & Right Text */}
      {leftText && <Text style={styles.leftText}>{leftText}</Text>}
      {rightText && <Text style={styles.rightText}>{rightText}</Text>}

      {/* Navigation Buttons */}
      <TouchableOpacity style={styles.leftArrow} onPress={onPrev}>
        <Feather name="chevron-left" size={28} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.rightArrow} onPress={onNext}>
        <Feather name="chevron-right" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default RoundScreen;

const styles = StyleSheet.create({
  darkScreen: {
    flex: 1,
    backgroundColor: '#0D0D1C',
    alignItems: 'center',
  },
  roundText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    marginTop: 60,
  },
  roundAccent: { color: '#FF5277' },
  illustration: {
    width: '80%',
    height: 250,
    marginTop: 50,
  },

  /** Positioning text */
  leftText: {
    position: 'absolute',
    bottom: '27%',
    left: 16,
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
  },
  rightText: {
    position: 'absolute',
    bottom: '22%',
    right: 16,
    color: '#FF5277',
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'right',
  },

  /** Navigation arrows */
  leftArrow: {
    position: 'absolute',
    bottom: 20,
    left: 22,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 40,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightArrow: {
    position: 'absolute',
    bottom: 20,
    right: 22,
    backgroundColor: '#FF5277',
    borderRadius: 40,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
