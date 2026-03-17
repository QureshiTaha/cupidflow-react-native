import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Image,
  Modal,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import IoniconsIcons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { launchImageLibrary } from "react-native-image-picker";
import { launchCamera } from "react-native-image-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useToast } from "react-native-toast-notifications";
import { useDispatch } from "react-redux";
import { updateUserProfile } from "../Redux/authSlice";
import { themeColors } from "../../app/const/color";

const { height } = Dimensions.get("window");

export default function EditProfileScreen() {
  const [name, setName] = useState("Debangshu Das");
  const [currentUserFirstName, setCurrentUserFirstName] = useState("Testing");
  const [currentUserSurName, setCurrentUserSurName] = useState("Dev");
  const [userBio, setUserBio] = useState("");
  const [user, setUser] = useState({});
  const [gender, setGender] = useState("Male");
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUserID, setCurrentUserID] = useState(null);
  const [selectedImage, setSelectedImage] = useState(``);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(height)).current;
  const dispatch = useDispatch();

  useEffect(() => {
    const getUser = async () => {
      const User = await AsyncStorage.getItem("User");
      const current_User = JSON.parse(User);
      setUser(current_User);
      setSelectedImage(`${current_User.profilePic}`);
      setCurrentUserID(current_User.userID);
      setCurrentUserFirstName(current_User.userFirstName || "Testing");
      setUserBio(current_User.userBio || "");
      setGender(current_User.userGender || "Male");
    };
    getUser();
  }, []);

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

  const openImagePicker = () => {
    const options = {
      mediaType: "photo",
      includeBase64: false,
      quality: 1.0,
    };
    launchImageLibrary(options, handleResponse);
  };

  const handleCameraLaunch = () => {
    const options = {
      mediaType: "photo",
      includeBase64: false,
      quality: 1.0,
      durationLimit: 0,
    };
    launchCamera(options, handleResponse);
  };

  const handleResetNavigation = async () => {
    router.replace("../pages/home");
    setTimeout(() => {
      router.push("../pages/profile");
      setTimeout(() => {
        router.push("../pages/editProfile");
      }, 2);
    }, 1);
  };

  const handleResponse = async (response) => {
    if (response.didCancel) {
      console.log("User cancelled image picker");
    } else if (response.errorCode) {
      console.log("Image picker error: ", response.errorMessage);
    } else {
      const asset = response.assets?.[0];
      if (asset) {
        const { uri, fileName, type } = asset;

        try {
          if (!uri || !uri.startsWith("file://")) {
            Alert.alert("Invalid image", "Please pick a valid image again.");
            return;
          }

          setIsLoading(true);
          const formData = new FormData();
          formData.append("userID", currentUserID);
          formData.append("file", {
            uri: uri,
            name: "upload.jpg",
            type: "image/jpg",
          });

          const response = await axios.post(
            `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/uploads/upload`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              timeout: 10000,
            },
          );

          if (response.status === 200) {
            setSelectedImage(response.data.filePath);
            setTimeout(async () => {
              hideOptions();
              await axios.post(
                `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/users/update-user`,
                {
                  profilePic: `${response.data.filePath}`,
                  userID: `${currentUserID}`,
                },
                {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.accessToken}`,
                  },
                },
              );
              var ASYNC_USER = JSON.parse(await AsyncStorage.getItem("User"));
              ASYNC_USER.profilePic = response.data.filePath;
              await AsyncStorage.setItem("User", JSON.stringify(ASYNC_USER));
              setTimeout(() => {
                handleResetNavigation();
              }, 200);
            }, 50);
          } else {
            alert("Failed to upload image. Please try again.");
          }
        } catch (error) {
          console.log("Axios error object:", error);
          if (error.response) {
            console.log("Server responded with:", error.response.data);
          } else if (error.request) {
            console.log(
              "Request was made but no response received:",
              error.request,
            );
          } else {
            console.log(
              "Something happened in setting up the request:",
              error.message,
            );
          }
          alert("An error occurred while uploading the image.", error.message);
        } finally {
          setIsLoading(false);
        }
      }
    }
    setModalVisible(false);
  };

  const savingData = async () => {
    try {
      setIsLoading(true);

      const data = JSON.stringify({
        userID: currentUserID,
        userFirstName: currentUserFirstName,
        userBio: userBio,
        userGender: gender,
        profilePic: selectedImage,
      });

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/users/update-user`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.accessToken}`,
          },
        },
      );

      if (response.status === 200) {
        const profileData = {
          ...user,
          userFirstName: currentUserFirstName,
          userBio: userBio,
          userGender: gender,
          profilePic: selectedImage,
        };

        await AsyncStorage.setItem("User", JSON.stringify(profileData));
        dispatch(updateUserProfile(profileData));

        toast.show("Profile updated successfully!", {
          type: "success",
          placement: "top",
        });

        router.replace("../pages/profile");
      } else {
        toast.show("Failed to update profile. Please try again.", {
          type: "danger",
          placement: "top",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.show("Something went wrong. Please try again later.", {
        type: "danger",
        placement: "top",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBioChange = (text) => {
    if (text.length > 60) {
      toast.show("Bio cannot exceed 100 characters.", {
        type: "danger",
        placement: "bottom",
      });
      text = text.substring(0, 59);
    }
    setUserBio(text);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <LinearGradient colors={["#ffffff", "#fff5f7"]} style={{ flex: 1 }}>
          <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <IoniconsIcons
                  name="arrow-back"
                  size={24}
                  color={themeColors.color2}
                />
              </TouchableOpacity>
              <Text style={styles.title}>Edit Profile</Text>
              {isLoading && (
                <ActivityIndicator
                  size="small"
                  color={themeColors.color2}
                  style={styles.loadingIndicator}
                />
              )}
            </View>

            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={{
                    uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${selectedImage}`,
                  }}
                  style={styles.avatar}
                />
                <TouchableOpacity
                  style={styles.cameraIcon}
                  onPress={showOptions}
                >
                  <LinearGradient
                    colors={[themeColors.color2, themeColors.color4]}
                    style={styles.cameraGradient}
                  >
                    <IoniconsIcons name="camera" size={20} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={showOptions}>
                <Text style={styles.changePic}>Change profile picture</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={currentUserFirstName}
                  onChangeText={setCurrentUserFirstName}
                  placeholder="Enter your first name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  value={userBio}
                  onChangeText={handleBioChange}
                  placeholder="Tell us about yourself"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.genderContainer}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderButtons}>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      gender === "Male" && styles.genderButtonSelected,
                    ]}
                    onPress={() => setGender("Male")}
                  >
                    <IoniconsIcons
                      name="male"
                      size={24}
                      color={gender === "Male" ? "#fff" : themeColors.color2}
                    />
                    <Text
                      style={[
                        styles.genderButtonText,
                        gender === "Male" && styles.genderButtonTextSelected,
                      ]}
                    >
                      Male
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      gender === "Female" && styles.genderButtonSelected,
                    ]}
                    onPress={() => setGender("Female")}
                  >
                    <IoniconsIcons
                      name="female"
                      size={24}
                      color={gender === "Female" ? "#fff" : themeColors.color2}
                    />
                    <Text
                      style={[
                        styles.genderButtonText,
                        gender === "Female" && styles.genderButtonTextSelected,
                      ]}
                    >
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={savingData}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[themeColors.color2, themeColors.color4]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>

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
                <Text style={styles.bottomSheetTitle}>
                  Change Profile Photo
                </Text>
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleCameraLaunch()}
                >
                  <IoniconsIcons
                    name="camera"
                    size={20}
                    color={themeColors.color2}
                  />
                  <Text style={styles.optionText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => openImagePicker()}
                >
                  <IoniconsIcons
                    name="image"
                    size={20}
                    color={themeColors.color2}
                  />
                  <Text style={styles.optionText}>Choose from Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelOption}
                  onPress={hideOptions}
                >
                  <Text style={styles.cancelOptionText}>Cancel</Text>
                </TouchableOpacity>
              </Animated.View>
            </TouchableOpacity>
          </Modal>
        </LinearGradient>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    position: "relative",
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    color: "#333",
    textAlign: "center",
    flex: 1,
    marginRight: 40,
    fontWeight: "bold",
  },
  loadingIndicator: {
    position: "absolute",
    right: 0,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: themeColors.color2,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    borderRadius: 18,
    overflow: "hidden",
    width: 36,
    height: 36,
  },
  cameraGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  changePic: {
    marginTop: 10,
    color: themeColors.color2,
    fontWeight: "600",
    fontSize: 16,
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#555",
    marginBottom: 8,
    fontWeight: "500",
    fontSize: 14,
  },
  input: {
    backgroundColor: "#f5f5f5",
    color: "#333",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  bioInput: {
    height: 70,
    textAlignVertical: "top",
  },
  genderContainer: {
    marginBottom: 20,
  },
  genderButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  genderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: themeColors.color2,
    marginHorizontal: 5,
    backgroundColor: "#fff",
  },
  genderButtonSelected: {
    backgroundColor: themeColors.color2,
    borderColor: themeColors.color2,
  },
  genderButtonText: {
    marginLeft: 8,
    color: themeColors.color2,
    fontWeight: "500",
  },
  genderButtonTextSelected: {
    color: "#fff",
  },
  saveButton: {
    marginTop: 10,
    marginBottom: 30,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: themeColors.color4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  saveGradient: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  option: {
    padding: 15,
    borderBottomColor: "#f0f0f0",
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 15,
    color: "#333",
  },
  cancelOption: {
    padding: 15,
    marginTop: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 30,
    alignItems: "center",
  },
  cancelOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.color2,
  },
});
