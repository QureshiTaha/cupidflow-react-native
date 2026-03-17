import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
  Dimensions,
  Animated,
  Easing,
  Text,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GiftCoinPopup from "./GiftCoinPopup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "react-native-image-picker";
import axios from "axios";
import { useToast } from "react-native-toast-notifications";
import ChatMediaModals from "./ChatMediaModals";
import { useUserTotalCoins } from "../api/coinApi";
import { themeColors } from "../const/color";

const { width } = Dimensions.get("window");

const mediaOptions = [
  { id: "1", icon: "image", name: "Gallery", component: Ionicons },
  { id: "2", icon: "camera", name: "Camera", component: Ionicons },
  { id: "3", icon: "videocam", name: "Video", component: Ionicons },
];

const ChatFooter = ({ sendMessage, receiverID, onAttachPress }) => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showGiftPopup, setShowGiftPopup] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const scaleAnim = new Animated.Value(1);
  const [senderId, setSenderId] = useState("");
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [mediaType, setMediaType] = useState("image");
  const [videoDuration, setVideoDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const toast = useToast();
  const [uploadToastId, setUploadToastId] = useState(null);
  const [uploadedVideos, setUploadedVideos] = useState({});

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await AsyncStorage.getItem("User");
        if (user) {
          const parsedUser = JSON.parse(user);
          setSenderId(parsedUser.userID);
        }
      } catch (error) {
        console.error("Error fetching user from AsyncStorage:", error);
      }
    };

    getUser();
  }, []);

  const {
    data: coinsData,
    isLoading: isLoadingCoins,
    isError: isErrorCoins,
  } = useUserTotalCoins(senderId);

  const totalCoins = Number(coinsData?.totalCoins ?? 0);
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setIsKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setIsKeyboardVisible(false),
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (isUploading && uploadToastId) {
      toast.update(
        uploadToastId,
        `Sending ${mediaType}... ${uploadProgress}%`,
        {
          type: "progress",
          data: { progress: uploadProgress },
        },
      );
    }
  }, [uploadProgress, isUploading]);

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage(message.trim());
      setMessage("");
      Keyboard.dismiss();
    }
  };

  const pulseAnimation = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const pickVideo = () => {
    setMediaModalVisible(false);
    ImagePicker.launchImageLibrary(
      {
        mediaType: "video",
        videoQuality: "high",
        selectionLimit: 1,
      },
      handleVideoResponse,
    );
  };

  const pickFromCamera = () => {
    setMediaModalVisible(false);
    ImagePicker.launchCamera(
      {
        mediaType: "photo",
        quality: 0.8,
        cameraType: "back",
        saveToPhotos: true,
      },
      handleImageResponse,
    );
  };

  const pickFromGallery = () => {
    setMediaModalVisible(false);
    ImagePicker.launchImageLibrary(
      {
        mediaType: "photo",
        quality: 0.8,
        selectionLimit: 1,
        includeExtra: true,
      },
      handleImageResponse,
    );
  };

  const handleImageResponse = (response) => {
    if (response.didCancel) return;
    if (response.errorCode) {
      console.log("ImagePicker Error:", response.errorMessage);
      toast.show(
        "Failed to access camera or gallery. Please check permissions.",
        { type: "danger" },
      );
      return;
    }

    if (response.assets && response.assets.length > 0) {
      const file = response.assets[0];
      setSelectedMedia(file.uri);
      setMediaType("image");
      setPreviewModalVisible(true); // Show preview for images
    }
  };

  const handleVideoResponse = (response) => {
    if (response.didCancel) return;
    if (response.errorCode) {
      console.log("ImagePicker Error:", response.errorMessage);
      toast.show("Failed to access videos. Please check permissions.", {
        type: "danger",
      });
      return;
    }

    if (response.assets && response.assets.length > 0) {
      const file = response.assets[0];
      setMediaType("video");

      if (file.duration) {
        setVideoDuration(Math.round(file.duration));
      }

      // Directly upload video without showing preview
      uploadAndSendFile(file.uri, "video", file.duration);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const uploadAndSendFile = async (
    fileUri,
    fileType = "image",
    duration = 0,
  ) => {
    setIsUploading(true);
    setUploadProgress(0);

    let thumbnailUri = null;
    if (fileType === "video") {
      thumbnailUri = fileUri;
    }

    const toastId = toast.show(`Sending ${fileType}... 0%`, {
      type: "progress",
      data: { progress: 0 },
      placement: "bottom",
      duration: 5000,
    });
    setUploadToastId(toastId);

    try {
      const formData: any = new FormData();
      formData.append("userID", senderId);
      formData.append("file", {
        uri: fileUri,
        type: fileType === "video" ? "video/mp4" : "image/jpeg",
        name: `${fileType}_${Date.now()}.${
          fileType === "video" ? "mp4" : "jpg"
        }`,
      });

      const res = await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/uploads/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.min(
              100,
              Math.round((progressEvent.loaded * 100) / progressEvent.total),
            );
            setUploadProgress(percentCompleted);
          },
        },
      );

      const uploadedPath = res.data.filePath.replace(/\\/g, "/");
      const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/$/, "");
      const fileUrl = `${baseUrl}/${uploadedPath.replace(/^\/+/, "")}`;

      console.log("Uploaded file URL:", fileUrl);

      if (fileType === "video") {
        setUploadedVideos((prev) => ({
          ...prev,
          [fileUrl]: {
            thumbnail: thumbnailUri,
            duration: duration,
          },
        }));
      }

      sendMessage(fileUrl, fileType, duration);

      toast.update(
        toastId,
        `${fileType === "video" ? "Video" : "Image"} sent successfully!`,
        {
          type: "success",
          duration: 2000,
        },
      );
    } catch (error) {
      console.error("Upload error:", error.response?.data || error.message);

      toast.update(
        toastId,
        "Upload Failed: Could not send the file. Please try again.",
        {
          type: "danger",
          duration: 3000,
        },
      );
    } finally {
      setIsUploading(false);
      setSelectedMedia(null);
      setVideoDuration(0);
      setUploadProgress(0);
      setUploadToastId(null);
      setPreviewModalVisible(false); // Ensure preview modal is closed
    }
  };

  const renderMediaOption = ({ item }) => {
    const IconComponent = item.component;
    return (
      <TouchableOpacity
        style={styles.mediaOption}
        onPress={
          item.id === "1"
            ? pickFromGallery
            : item.id === "2"
              ? pickFromCamera
              : pickVideo
        }
      >
        <IconComponent name={item.icon} size={24} color={themeColors.color3} />
        <Text style={styles.mediaOptionText}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const hasText = message.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Media Options Panel */}
      {showMediaOptions && (
        <FlatList
          data={mediaOptions}
          renderItem={renderMediaOption}
          keyExtractor={(item) => item.id}
          horizontal
          contentContainerStyle={styles.mediaOptionsContainer}
          showsHorizontalScrollIndicator={false}
        />
      )}

      {/* Main Input Bar */}
      <View style={styles.inputContainer}>
        {/* Media Button */}
        <TouchableOpacity
          style={styles.mediaButton}
          onPress={() => setMediaModalVisible(true)}
        >
          <Ionicons name="add" size={24} color={themeColors.color2} />
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor="#888"
          value={message}
          onChangeText={setMessage}
          multiline
        />

        {/* Right Action Buttons */}
        {hasText ? (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.rightButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setShowGiftPopup(true);
                pulseAnimation();
              }}
            >
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Ionicons name="gift" size={24} color={themeColors.color2} />
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setIsRecording(!isRecording)}
            >
              {/* Mic button commented out */}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ChatMediaModals
        mediaVisible={mediaModalVisible}
        onCloseMedia={() => setMediaModalVisible(false)}
        onPickCamera={pickFromCamera}
        onPickGallery={pickFromGallery}
        onPickVideo={pickVideo}
        previewVisible={previewModalVisible}
        mediaUri={selectedMedia}
        mediaType={mediaType as "image" | "video"}
        onCancelPreview={() => {
          setPreviewModalVisible(false);
          setSelectedMedia(null);
          setVideoDuration(0);
        }}
        onSendPreview={() => uploadAndSendFile(selectedMedia, mediaType)}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      <GiftCoinPopup
        visible={showGiftPopup}
        onClose={() => setShowGiftPopup(false)}
        receiverId={receiverID}
        onSuccess={({ amount, result }) => {
          if (!amount || amount <= 0) {
            toast.show("Enter a valid coin amount", { type: "danger" });
            return;
          }
          if (totalCoins < amount) {
            toast.show("Insufficient coins to send", { type: "danger" });
            return;
          }

          sendMessage(
            JSON.stringify({ type: "coin", amount, txId: result?.txId }),
            "coin",
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    // paddingBottom: Platform.OS === "ios" ? 6 : 4,
    borderTopWidth: 1,
    borderTopColor: themeColors.color1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  mediaButton: {
    padding: 8,
    marginRight: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    fontSize: 16,
    color: "#333",
    textAlignVertical: "center",
    includeFontPadding: false,
    borderWidth: 1,
    borderColor: themeColors.color3,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.color2,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  rightButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    // backgroundColor: "red",
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  mediaOptionsContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: themeColors.color3,
    backgroundColor: "#FFFFFF",
  },
  mediaOption: {
    alignItems: "center",
    width: width / 4,
    paddingHorizontal: 8,
  },
  mediaOptionText: {
    marginTop: 6,
    fontSize: 12,
    color: themeColors.color4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    minHeight: 250,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: themeColors.color4,
  },
  modalOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  modalOptionButton: {
    alignItems: "center",
    padding: 16,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  modalOptionText: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
  },
  // Preview Modal Styles
  previewModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  previewModalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 300,
  },
  previewActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
  },
  previewButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  previewCancelButton: {
    backgroundColor: "#ccc",
  },
  previewSendButton: {
    backgroundColor: themeColors.color2,
  },
  previewButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ChatFooter;
