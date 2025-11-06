import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = ({ onLogout }: any) => {
  const [roomCode, setRoomCode] = useState('');
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  const handleCreateRoom = () => {
    console.log('Room created!');
  };

  const handleJoinRoom = () => {
    console.log('Joined room:', roomCode);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#101031" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={{ position: 'absolute', left: 0 }} // ✅ keeps icon clickable but text centered
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Feather name="menu" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.logo}>
            Cu<Text style={styles.logoAccent}>pid</Text>
          </Text>
        </View>

        {/* Illustration */}
        <Image
          source={{
            uri: 'https://img.freepik.com/free-vector/boy-girl-with-chat-bubble-message_24877-53848.jpg?semt=ais_hybrid&w=740&q=80',
          }}
          resizeMode="contain"
          style={styles.image}
        />

        {/* Title */}
        <Text style={styles.title}>Connect with your Partner</Text>

        {/* Create Room Section */}
        <View style={styles.section}>
          <Text style={styles.subText}>*To Generate Room ID</Text>

          <TouchableOpacity
            style={styles.createRoomBtn}
            onPress={handleCreateRoom}
            activeOpacity={0.8}
          >
            <Text style={styles.createRoomText}>Create Room</Text>
          </TouchableOpacity>

          <View style={styles.orContainer}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line} />
          </View>

          {/* Room Input */}
          <TextInput
            value={roomCode}
            onChangeText={setRoomCode}
            placeholder="XXXXX"
            placeholderTextColor="#A5A5B5"
            style={styles.input}
            textAlign="center"
          />

          <TouchableOpacity
            style={styles.joinRoomBtn}
            onPress={handleJoinRoom}
            activeOpacity={0.8}
          >
            <Text style={styles.joinRoomText}>Join Room</Text>
          </TouchableOpacity>

          <Text style={styles.bottomText}>Enter Partner's Room ID</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#101031',
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },

  header: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // ✅ centers Cupid text
    marginTop: 10,
  },

  logo: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    alignSelf: 'center',
  },
  logoAccent: {
    color: '#FF4F72',
  },

  image: {
    width: '85%',
    height: 220,
    marginTop: 30,
  },

  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 25,
  },

  section: {
    marginTop: 40,
    width: '85%',
    alignItems: 'center',
  },

  subText: {
    color: '#BFBFD3',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },

  createRoomBtn: {
    width: '100%',
    backgroundColor: '#FF4F72',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createRoomText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
    width: '100%',
  },
  orText: {
    color: '#D9D9E3',
    fontSize: 12,
    marginHorizontal: 8,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#2E2E4E',
  },

  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#101031',
    paddingVertical: 12,
    marginBottom: 18,
  },

  joinRoomBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#FF4F72',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  joinRoomText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  bottomText: {
    color: '#A5A5B5',
    fontSize: 12,
    marginTop: 8,
  },
});
