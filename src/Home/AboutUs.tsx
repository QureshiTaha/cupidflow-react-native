import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AboutUs = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#101031" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.title}>Welcome To Cupid Flow</Text>

        <Text style={styles.text}>
          Cupid Flow is the smartest way to get your partner to fall in love
          with you all over again or to use it just as a fun tool to play
          together on the Go. Connect with the Cupid Flow App and start having
          endless fun whenever you want to keep each other engaged. The Cupid
          Flow App turns moments with your partner into a game. It lets you
          interact with questions and discover little known secret about each
          other. Whether you are in a long car journey or just looking to pass
          time, Cupid Flow is here to bring fun, passion and laughter wherever
          you are! This app works as a personalised trivia app that will take
          your romantic moments to a whole new level. Cupid Flow was designed
          with you and your partner in mind to help spark new excitement and
          romance, and leave those mundane tasks behind. Cupid Flow is a fun way
          to share your interests. It will make you each feel less like
          strangers, and more like kindred spirits!
        </Text>

        <Text style={styles.quote}>
          "Netflx & Chill is Outdated,{'\n'}Cupid Flow & Chill is the new Trend
          :)"
        </Text>

        <Text style={styles.thankYou}>Thank You !!</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutUs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4F3',
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
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginBottom: 18,
  },
  text: {
    color: '#333',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'justify',
  },
  quote: {
    fontSize: 15,
    color: '#333',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  thankYou: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
});
