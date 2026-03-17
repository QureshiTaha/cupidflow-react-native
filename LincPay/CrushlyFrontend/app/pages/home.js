import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import VideoCards from "../components/videoCards";
import Footer from "../components/footer";
import Header from "../components/header";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { themeColors } from "../const/color";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  return (
    <LinearGradient
      colors={["#fdf2f8", "#fff5f5", "#fef7ed"]}
      style={styles.gradient}
    >
      <Header />
      <View style={styles.container}>
        <VideoCards userID={null} />
      </View>
      <Footer />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  videoCallButton: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    zIndex: 10,
    borderRadius: 35,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#f38ea8",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  videoCallGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  iosHeader: {
    paddingTop: 50,
},
});