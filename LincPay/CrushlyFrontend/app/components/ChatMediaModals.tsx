import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { themeColors } from "../const/color";

type MediaType = "image" | "video";

type Props = {
  // Media chooser (bottom sheet)
  mediaVisible: boolean;
  onCloseMedia: () => void;
  onPickCamera: () => void;
  onPickGallery: () => void;
  onPickVideo: () => void;

  // Preview (centered card)
  previewVisible: boolean;
  mediaUri: string | null;
  mediaType: MediaType;
  onCancelPreview: () => void;
  onSendPreview: () => void;
  isUploading?: boolean;
  uploadProgress?: number; // 0 - 100
};

const ChatMediaModals: React.FC<Props> = ({
  mediaVisible,
  onCloseMedia,
  onPickCamera,
  onPickGallery,
  onPickVideo,

  previewVisible,
  mediaUri,
  mediaType,
  onCancelPreview,
  onSendPreview,
  isUploading = false,
  uploadProgress = 0,
}) => {
  return (
    <>
      {/* ---------- Media Picker (Bottom Sheet) ---------- */}
      <Modal
        visible={mediaVisible}
        transparent
        animationType="fade"
        onRequestClose={onCloseMedia}
      >
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onCloseMedia}>
          {/* Sheet (press-inside shouldn't close) */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Send Media</Text>
              <TouchableOpacity
                onPress={onCloseMedia}
                style={styles.iconBtn}
                hitSlop={10}
              >
                <Ionicons name="close" size={22} color={themeColors.color4} />
              </TouchableOpacity>
            </View>

            <View style={styles.optionRow}>
              <TouchableOpacity
                style={styles.optionCard}
                onPress={onPickCamera}
              >
                <View
                  style={[styles.optionIcon, { backgroundColor: "#E3F2FD" }]}
                >
                  <Ionicons name="camera" size={26} color="#1976D2" />
                </View>
                <Text style={styles.optionText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionCard}
                onPress={onPickGallery}
              >
                <View
                  style={[styles.optionIcon, { backgroundColor: "#F3E5F5" }]}
                >
                  <Ionicons name="images" size={26} color="#7B1FA2" />
                </View>
                <Text style={styles.optionText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionCard} onPress={onPickVideo}>
                <View
                  style={[styles.optionIcon, { backgroundColor: "#FFF3E0" }]}
                >
                  <Ionicons name="videocam" size={26} color="#E65100" />
                </View>
                <Text style={styles.optionText}>Video</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tipBox}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#6B7280"
              />
              <Text style={styles.tipText}>
                Large videos may take longer to upload.
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ---------- Preview (Centered Card) ---------- */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={onCancelPreview}
      >
        <Pressable style={styles.previewBackdrop} onPress={onCancelPreview}>
          <Pressable style={styles.previewCard} onPress={() => {}}>
            {/* Header */}
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>
                {mediaType === "image" ? "Image Preview" : "Preview"}
              </Text>
              <TouchableOpacity onPress={onCancelPreview} hitSlop={10}>
                <Ionicons name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.previewBody}>
              {mediaType === "image" && !!mediaUri ? (
                <Image
                  source={{ uri: mediaUri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.previewPlaceholder}>
                  <Ionicons name="image" size={36} color="#9CA3AF" />
                  <Text style={styles.placeholderText}>
                    No preview available
                  </Text>
                </View>
              )}
            </View>

            {/* Upload progress (if any) */}
            {isUploading && (
              <View style={styles.progressWrap}>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.max(0, Math.min(100, uploadProgress))}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(uploadProgress)}%
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.cancelBtn]}
                onPress={onCancelPreview}
                disabled={isUploading}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionText, styles.cancelText]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.sendBtn,
                  isUploading && styles.sendBtnDisabled,
                ]}
                onPress={onSendPreview}
                disabled={isUploading}
                activeOpacity={0.85}
              >
                {isUploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="send"
                      size={18}
                      color="#fff"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.actionText}>Send</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Backdrop (media picker)
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  // Bottom sheet
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: Platform.OS === "ios" ? 28 : 22,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: `${themeColors.color3}40`,
    marginBottom: 12,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingVertical: 4,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: themeColors.color4,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.04)",
  },

  optionRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  optionCard: {
    flex: 1,
    marginHorizontal: 6,
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: `${themeColors.color2}20`,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  optionIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  tipBox: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: `${themeColors.color3}20`,
  },
  tipText: {
    marginLeft: 8,
    color: "#6B7280",
    fontSize: 12,
  },

  // Backdrop (preview)
  previewBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },

  // Card
  previewCard: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  previewBody: {
    padding: 12,
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B0B0B",
  },
  previewImage: {
    width: "100%",
    height: 320,
    borderRadius: 10,
    backgroundColor: "#111",
  },
  previewPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    marginTop: 8,
    color: "#9CA3AF",
  },

  progressWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#E91E63",
  },
  progressText: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B7280",
    alignSelf: "flex-end",
  },

  previewActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: 12,
    paddingBottom: Platform.OS === "ios" ? 16 : 12,
    gap: 10,
    backgroundColor: "#FFFFFF",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelBtn: {
    backgroundColor: "#F3F4F6",
  },
  cancelText: {
    color: "#111827",
  },
  sendBtn: {
    backgroundColor: "#E91E63",
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});

export default ChatMediaModals;
