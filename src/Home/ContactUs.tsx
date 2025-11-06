import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Linking,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ContactUs = () => {
  const navigation = useNavigation();

  const handleEmailPress = () => {
    Linking.openURL('mailto:contact@cupidflow.com');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#101031" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
      </View>

      {/* Content */}
      <View style={styles.body}>
        <Text style={styles.heading}>
          Get in touch if you{'\n'}need assistance.
        </Text>

        <Text style={styles.subText}>
          If you have any questions, concerns, feedback, please don't hesitate
          to get in touch with us. Our support team is available to assist you.
        </Text>

        <View style={styles.card}>
          <Feather
            name="mail"
            size={40}
            color="#A3A3A3"
            style={styles.mailIcon}
          />
          <Text style={styles.email}>contact@cupidflow.com</Text>

          <TouchableOpacity
            style={styles.emailBtn}
            onPress={handleEmailPress}
            activeOpacity={0.8}
          >
            <Text style={styles.emailBtnText}>Send Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ContactUs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#101031',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 15,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 50,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    lineHeight: 32,
  },
  subText: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 15,
    marginTop: 40,
    alignItems: 'center',
    paddingVertical: 35,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  mailIcon: {
    marginBottom: 15,
  },
  email: {
    fontSize: 15,
    color: '#111',
    fontWeight: '700',
    marginBottom: 20,
  },
  emailBtn: {
    backgroundColor: '#FF4F72',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  emailBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
