import React from "react";
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ImageViewer from "react-native-image-zoom-viewer";
import { Video } from "expo-av";

type Props = {
  imageUri: string | null;
  onCloseImage: () => void;
  videoUri: string | null;
  onCloseVideo: () => void;
};

const MediaPreviewModals: React.FC<Props> = ({
  imageUri,
  onCloseImage,
  videoUri,
  onCloseVideo,
}) => {
  return (
    <>
      {/* Image Preview */}
      <Modal
        visible={!!imageUri}
        transparent
        presentationStyle="overFullScreen"
        animationType="fade"
        onRequestClose={onCloseImage}
      >
        {/* Backdrop – tap to close */}
        <Pressable style={styles.backdrop} onPress={onCloseImage}>
          {/* Content – pressable with noop to avoid closing when tapping inside */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            {imageUri ? (
              <View style={styles.viewerWrap} pointerEvents="box-none">
                <ImageViewer
                  imageUrls={[
                    {
                      url: imageUri.startsWith("http")
                        ? imageUri
                        : `${(
                            process.env.EXPO_PUBLIC_API_BASE_URL || ""
                          ).replace(/\/$/, "")}/${imageUri.replace(
                            /^\/+/,
                            ""
                          )}`,
                    },
                  ]}
                  backgroundColor="transparent"
                  enableSwipeDown
                  onSwipeDown={onCloseImage}
                  saveToLocalByLongPress={false}
                />

                <TouchableOpacity
                  onPress={onCloseImage}
                  activeOpacity={0.8}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={26} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Video Preview */}
      <Modal
        visible={!!videoUri}
        transparent
        presentationStyle="overFullScreen"
        animationType="fade"
        onRequestClose={onCloseVideo}
      >
        {/* Backdrop – tap to close */}
        <Pressable style={styles.backdrop} onPress={onCloseVideo}>
          {/* Content – pressable with noop to avoid closing when tapping inside */}
          <Pressable style={styles.videoSheet} onPress={() => {}}>
            {videoUri ? (
              <View style={styles.videoWrap}>
                <Video
                  source={{
                    uri: videoUri.startsWith("http")
                      ? videoUri
                      : `${
                          (process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(
                            /\/$/,
                            ""
                          ) || ""
                        }/${videoUri.replace(/^\/+/, "")}`,
                  }}
                  style={styles.video}
                  useNativeControls
                  resizeMode="contain"
                  shouldPlay
                />

                <TouchableOpacity
                  onPress={onCloseVideo}
                  activeOpacity={0.8}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={26} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Image sheet container (leave margins so tapping outside is possible)
  sheet: {
    width: "92%",
    height: "80%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "transparent",
  },

  // The ImageViewer fills this wrapper
  viewerWrap: {
    flex: 1,
    backgroundColor: "transparent",
  },

  // Video sheet container
  videoSheet: {
    width: "92%",
    height: Platform.OS === "ios" ? "75%" : "78%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },

  videoWrap: {
    flex: 1,
    backgroundColor: "#000",
  },

  video: {
    flex: 1,
    backgroundColor: "#000",
  },

  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 8,
  },
});

export default MediaPreviewModals;
