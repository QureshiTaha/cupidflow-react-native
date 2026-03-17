import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  Image,
  Button,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
  Alert,
  Modal,
  TextInput,
  PermissionsAndroid,
} from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { useRouter } from "expo-router";
import Header from "../components/header";
import VideoCards from "../components/videoCards";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { launchImageLibrary } from "react-native-image-picker";
import { launchCamera } from "react-native-image-picker";
import UploadReels from "../components/UploadReels";
import Ionicons from "react-native-vector-icons/Ionicons";
import { ScrollView } from "react-native";
import { Platform } from "react-native";
import { ActivityIndicator } from "react-native";
import Footer from "../components/footer";
import { useToast } from "react-native-toast-notifications";
import ProfileImagePreview from "../components/ProfileImagePreview";

// Theme colors
const themeColors = {
  color1: "#f38ea8",
  color2: "#ef7cca",
  color3: "#f4b595",
  color4: "#8f6adf",
};

export default function ProfileScreen() {
  const [selectedImage, setSelectedImage] = useState([""]);
  const [user, setUser] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("untitled");
  const [description, setDescription] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const { height } = Dimensions.get("window");
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({});
  const toast = useToast();

  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const User = await AsyncStorage.getItem("User");
      const CACHE_USER = JSON.parse(User);
      setUser(CACHE_USER);
      setProfileData({
        username: CACHE_USER
          ? CACHE_USER.userFirstName + " " + CACHE_USER.userSurname
          : "Loading...",
        profileImage: CACHE_USER.profilePic
          ? `${process.env.EXPO_PUBLIC_API_BASE_URL}${CACHE_USER.profilePic}`
          : `set-default-${CACHE_USER.userGender}`, // Replace with actual image URL
        posts: CACHE_USER.posts ? CACHE_USER.posts : 0,
        followers: CACHE_USER.followers ? CACHE_USER.totalFollowers : 0,
        following: CACHE_USER.followings ? CACHE_USER.followings : 0,
        bio: `${
          CACHE_USER.userBio ? CACHE_USER.userBio : "✨ No bio available"
        }`,
      });
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/users/by-userID/${CACHE_USER.userID}`,
        );
        const data = await response.json();
        const userData_ = data.data.length ? data.data[0] : {};
        setUser(userData_);
        setProfileData({
          username: userData_
            ? userData_.userFirstName + " " + userData_.userSurname
            : "Loading...",
          profileImage: userData_.profilePic
            ? `${process.env.EXPO_PUBLIC_API_BASE_URL}${userData_.profilePic}`
            : `set-default-${userData_.userGender}`, // Replace with actual image URL
          posts: userData_.posts ? userData_.posts : 0,
          followers: userData_.totalFollowers ? userData_.totalFollowers : 0,
          following: userData_.followings ? userData_.followings : 0,
          bio: `${
            userData_.userBio ? userData_.userBio : "✨ No bio available"
          }`,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
    // console.log("Total posts = ", profileData.posts);
  }, []);

  const openImagePicker = () => {
    const options = {
      mediaType: "video",
      includeBase64: false,
      videoQuality: "high", // Important
      quality: 1.0, // Force max quality
      durationLimit: 0, // No duration limit
    };
    launchImageLibrary(options, handleResponse);
  };

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Permission",
          message:
            "App needs access to your camera " + "so you can take pictures.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        },
      );
      console.log("Camera permission granted:", granted);

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        const options = {
          mediaType: "video",
          includeBase64: false,
          videoQuality: "high", // Important
          quality: 1.0, // Force max quality
          durationLimit: 0,
        };

        launchCamera(options, handleResponse);
      } else {
        // Request permission
        try {
          const options = {
            mediaType: "video",
            includeBase64: false,
            videoQuality: "high", // Important
            quality: 1.0, // Force max quality
            durationLimit: 0,
          };

          launchCamera(options, handleResponse);
        } catch (error) {
          console.log("Error launching camera:", error);
        }

        Alert.alert(
          "Camera permission denied",
          "You need to allow camera access to use this feature.",
        );
        console.log("Camera permission denied");
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleCameraLaunch = () => {
    requestCameraPermission();
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
    }
    Geolocation.getCurrentPosition(
      (pos) => setLocation(pos.coords),
      (error) => console.warn(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const showOptions = () => {
    setModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const hideOptions = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const handleResponse = (response) => {
    if (response.didCancel) {
      console.log("User cancelled image picker");
    } else if (response.errorCode) {
      console.log("Image picker error: ", response.errorMessage);
    } else {
      const asset = response.assets?.[0];
      if (asset) {
        const { uri, fileName, type } = asset;

        setSelectedImage(uri);

        // Show modal to enter title and description
        hideOptions();
        setShowModal(true);
      }
    }
  };

  const handleUpload = async () => {
    hideOptions();
    setLoading(true);
    if (description !== "" || description !== null) {
      setShowModal(false); // Close the modal

      await UploadReels(
        user.userID,
        { uri: selectedImage, name: "upload.mp4", type: "video/mp4" },
        title,
        description,
      );
      setLoading(false);
      router.replace("../pages/profile");
    } else {
      Alert.alert("Error", "Please provide a description.");
    }
  };

  return (
    <>
      <Header />
      <View style={styles.container}>
        {/* Profile Info */}
        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={() => setPreviewVisible(true)}>
            <Image
              source={
                profileData.profileImage &&
                profileData.profileImage.startsWith("set-default")
                  ? profileData.profileImage == "set-default-2"
                    ? require("../../assets/images/profile-female.jpg")
                    : require("../../assets/images/profile.jpg")
                  : { uri: profileData.profileImage }
              }
              style={styles.avatar}
            />
          </TouchableOpacity>
          <View style={styles.statsContainer}>
            {/* <TouchableOpacity> */}
            <Text style={styles.statsText}>
              {profileData.posts}
              {"\n"}Posts
            </Text>
            {/* </TouchableOpacity> */}
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "../pages/followers",
                  params: { userID: user.userID },
                })
              }
            >
              <Text style={styles.statsText}>
                {profileData.followers}
                {"\n"}Followers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "../pages/UserFollowing",
                  params: { userID: user.userID },
                })
              }
            >
              <Text style={styles.statsText}>
                {profileData.following}
                {"\n"}Following
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.bioContainer}>
          <Text style={styles.username}>{profileData.username}</Text>
          <Text style={styles.bio}>{profileData.bio}</Text>
          {/* <Text style={styles.website}>{profileData.website}</Text> */}
        </View>

        <View style={styles.profileButtonContainer}>
          <TouchableOpacity onPress={() => router.push("../pages/editProfile")}>
            <Text style={styles.uploadButton}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={showOptions}>
            <Text style={styles.addBtn}>Add Post</Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            //display: props.userID ? "flex" : "none",
            flexDirection: "row",
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <View
            style={{ flex: 1, height: 1, backgroundColor: themeColors.color3 }}
          />
          <View>
            <Text
              style={{
                ...styles.text,
                ...{
                  width: 70,
                  textAlign: "center",
                  color: themeColors.color4,
                },
              }}
            >
              Posts
            </Text>
          </View>
          <View
            style={{ flex: 1, height: 1, backgroundColor: themeColors.color3 }}
          />
        </View>
        <View style={styles.containerVideo}>
          <VideoCards userID={user.userID} />
        </View>

        <Modal transparent visible={modalVisible} animationType="none">
          <TouchableOpacity
            style={styles.overlay}
            onPress={hideOptions}
            activeOpacity={1}
          >
            <Animated.View
              style={[
                styles.bottomSheet,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              <TouchableOpacity
                style={styles.option}
                onPress={() => handleCameraLaunch()}
              >
                <Text style={styles.optionText}>Open Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.option}
                onPress={() => openImagePicker()}
              >
                <Text style={styles.optionText}>Choose from Device</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Modal>

        {loading ? (
          <View style={styles.loadingPanel}>
            <ActivityIndicator size={60} color={themeColors.color4} />
          </View>
        ) : (
          <></>
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={showModal}
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color={themeColors.color4} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Add Post</Text>

                <TouchableOpacity
                  onPress={() =>
                    description.length
                      ? handleUpload()
                      : toast.show("Please write a caption", {
                          type: "danger",
                          placement: "top",
                        })
                  }
                >
                  <Text style={styles.shareText}>Share</Text>
                </TouchableOpacity>
              </View>

              {/* Image row */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imageRow}
              >
                {[1].map((_, index) => (
                  <View key={index} style={styles.imagePreviewBox}>
                    <Image
                      source={{ uri: selectedImage }}
                      style={styles.imagePreview}
                    />
                  </View>
                ))}
              </ScrollView>

              {/* Caption input */}
              <TextInput
                style={styles.captionInput}
                placeholder="Write a caption..."
                placeholderTextColor="#888"
                value={description}
                onChangeText={setDescription}
                multiline={true}
              />
            </View>
          </View>
        </Modal>
      </View>
      <ProfileImagePreview
        visible={previewVisible}
        image={
          profileData.profileImage &&
          profileData.profileImage.startsWith("set-default")
            ? profileData.profileImage == "set-default-2"
              ? require("../../assets/images/profile-female.jpg")
              : require("../../assets/images/profile.jpg")
            : { uri: profileData.profileImage }
        }
        onClose={() => setPreviewVisible(false)}
      />

      <Footer />
    </>
  );
}

// Styles
const styles = StyleSheet.create({
  containerVideo: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    marginRight: 20,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: themeColors.color2,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flex: 1,
  },
  statsText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: themeColors.color4,
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "left",
    color: themeColors.color4,
  },
  bioContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20, // ensures space at bottom
    marginTop: 10,
    flexShrink: 1, // allows container to shrink if needed
  },

  bio: {
    fontSize: 14,
    textAlign: "left",
    lineHeight: 20, // improves readability and avoids clipping
    flexWrap: "wrap",
    marginTop: 4,
    color: "#333",
  },

  website: {
    fontSize: 14,
    color: "blue",
    textAlign: "left",
    marginBottom: 10,
  },
  postImage: {
    width: 100,
    height: 100,
    margin: 2,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    marginTop: 100,
    marginLeft: 20,
    marginRight: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 75,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: "bold",
    color: themeColors.color4,
  },
  input: {
    width: "100%",
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  profileButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },

  uploadButton: {
    fontSize: 16,
    padding: 10,
    width: 150,
    borderWidth: 2,
    borderColor: themeColors.color2,
    borderRadius: 25,
    textAlign: "center",
    backgroundColor: themeColors.color2,
    color: "#fff",
  },
  addBtn: {
    backgroundColor: "transparent",
    padding: 10,
    borderColor: themeColors.color2,
    borderWidth: 2,
    fontSize: 16,
    borderRadius: 25,
    textAlign: "center",
    color: themeColors.color2,
    width: 150,
  },
  overlay: {
    flex: 1,
    backgroundColor: "#00000077",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  option: {
    padding: 15,
    borderBottomColor: "#999",
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: themeColors.color4,
  },
  postCancelButton: {
    fontSize: 20,
    marginBottom: 10,
    padding: 10,
    borderRadius: 15,
    textAlign: "center",
    backgroundColor: themeColors.color2,
    color: "#000",
  },
  cancelText: {
    color: "white",
    fontSize: 20,
  },
  modalOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalView: {
    backgroundColor: "#fff",
    padding: 25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "80%", // You can reduce this
    height: "100%", // Add this line for fixed height
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // marginBottom: 0,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: themeColors.color4,
  },
  shareText: {
    color: themeColors.color4,
    fontWeight: "600",
    fontSize: 20,
  },
  imageRow: {
    flexDirection: "row",
    marginTop: 25,
  },
  imagePreviewBox: {
    marginRight: 10,
    marginBottom: 20,
    left: 50,
    padding: 10,
    justifyContent: "center",
  },
  imagePreview: {
    width: 250,
    height: 400,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  addMoreButton: {
    width: 150,
    height: 200,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  captionInput: {
    borderBottomWidth: 1,
    borderBottomColor: "#999",
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#999",
  },
  optionText: {
    fontSize: 16,
    marginLeft: 10,
    color: themeColors.color4,
  },
  loadingPanel: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    sizeMode: "cover",
    top: 10,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
