import React from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import VideoCards from "../components/videoCards";
import Footer from "../components/footer";
import Header from "../components/header";

export default function HomeScreen() {


  return (
    <>
      <Header />
      <View style={styles.container}>
        <VideoCards userID={null} />
      </View>
      <Footer />
      <View style={styles.imageWrapper}>
        <TouchableOpacity onPress={() => console.log("Video call button pressed")}>
          {/* <Image
          source={require("../../assets/images/video-camera.png")}
          style={styles.Videoimage}
        /> */}
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  imageWrapper: {
    position: "absolute",
    bottom: 70,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  Videoimage: {
    width: 60,
    height: 60,
    borderRadius: 50,
  },
});
