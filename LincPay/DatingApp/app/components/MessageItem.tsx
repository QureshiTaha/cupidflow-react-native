import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Video } from "expo-av";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { myConsole } from "../utils/myConsole";

const MessageItem = ({
  item,
  isCurrentUser,
  profileData,
  videoThumbnails,
  videoDurations,
  setPreviewImage,
  setPreviewVideo,
  formatDuration,
  currentUser,
  setVideoDurations = () => {},
}) => {
  const alignStyle = isCurrentUser ? styles.alignRight : styles.alignLeft;
  return (
    <View
      style={[
        styles.messageRow, // full-width row
        isCurrentUser ? styles.rowRight : styles.rowLeft,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          alignStyle,
          item.messageType === "image" && styles.imageBubble,
          item.messageType === "video" && styles.videoOuterBubble,
          item.messageType === "coin" && styles.messageBubbleWide,
        ]}
      >
        {item.messageType === "coin" ? (
          (() => {
            let amt: number | null = null;
            const raw =
              typeof item.message === "string"
                ? item.message
                : JSON.stringify(item.message ?? "");

            try {
              const p = JSON.parse(raw);
              if (p?.amount != null) amt = Number(p.amount);
            } catch {}

            if (amt == null && /^\d+$/.test(String(raw))) {
              amt = Number(raw);
            }

            return (
              <LinearGradient
                colors={
                  isCurrentUser
                    ? ["#e67e9fff", "#f30c59ff"]
                    : ["#e91e63", "#e5608aff"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.coinBubble,
                  isCurrentUser
                    ? styles.coinBubbleRight
                    : styles.coinBubbleLeft,
                ]}
              >
                <View style={styles.coinContent}>
                  <View style={styles.circle}>
                    <MaterialCommunityIcons
                      name="star-circle"
                      size={46}
                      color="#facc15"
                    />
                  </View>
                  <Text style={styles.coinAmountText}>{amt ?? "—"}</Text>
                </View>
                <View style={[styles.coinFooter]}>
                  <Text
                    style={[
                      styles.coinLabel,
                      { marginRight: 12, fontWeight: "bold" },
                    ]}
                  >
                    {isCurrentUser ? "You sent" : "You received"}
                  </Text>
                  <View style={[styles.coinFooterRight, { marginTop: 12 }]}>
                    <Text style={[styles.messageTime, styles.coinTime]}>
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    {isCurrentUser && (
                      <MaterialIcons
                        name={item.isRead ? "done-all" : "done"}
                        size={14}
                        color="rgba(0, 145, 255, 0.85)"
                        style={styles.tickIcon}
                      />
                    )}
                  </View>
                </View>
              </LinearGradient>
            );
          })()
        ) : item.messageType === "image" ? (
          <View style={styles.imageContainer}>
            <TouchableOpacity
              onPress={() => setPreviewImage(item.message)}
              activeOpacity={0.9}
            >
              <Image
                source={{
                  uri: item.message.startsWith("http")
                    ? item.message
                    : `${process.env.EXPO_PUBLIC_API_BASE_URL.replace(
                        /\/$/,
                        ""
                      )}/${item.message.replace(/^\/+/, "")}`,
                }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>

            <View style={[styles.messageFooter, styles.imageMessageFooter]}>
              <Text style={[styles.messageTime, styles.imageTime]}>
                {new Date(item.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              {isCurrentUser && (
                <MaterialIcons
                  name={item.isRead ? "done-all" : "done"}
                  size={14}
                  color="rgba(0, 145, 255, 0.85)"
                  style={styles.tickIcon}
                />
              )}
            </View>
          </View>
        ) : item.messageType === "video" ? (
          <TouchableOpacity
            style={styles.videoBubble}
            onPress={() => setPreviewVideo(item.message)}
            activeOpacity={0.85}
          >
            <Image
              source={{
                uri:
                  videoThumbnails[item.messageID] ||
                  "https://via.placeholder.com/150x150/333/fff?text=Video",
              }}
              style={styles.videoThumbnail}
            />

            {/* hidden player only to read duration if handler provided */}
            <Video
              source={{
                uri: item.message.startsWith("http")
                  ? item.message
                  : `${(process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(
                      /\/$/,
                      ""
                    )}/${(item.message || "").replace(/^\/+/, "")}`,
              }}
              style={{ width: 0, height: 0 }}
              onLoad={async (status) => {
                if (status?.isLoaded) {
                  const duration = status.durationMillis / 1000;
                  setVideoDurations((prev) => ({
                    ...prev,
                    [item.message]: duration,
                  }));
                }
              }}
              shouldPlay={false}
            />

            <View style={styles.videoOverlay} />

            <View style={styles.playButtonContainer}>
              <Ionicons
                name="play-circle"
                size={50}
                color="rgba(255,255,255,0.9)"
              />
            </View>

            <View style={styles.videoDurationContainer}>
              <Ionicons name="videocam" size={14} color="#fff" />
              <Text style={styles.videoDuration}>
                {formatDuration(videoDurations[item.message] || 0)}
              </Text>
            </View>

            <View style={styles.videoTimestampContainer}>
              <Text style={styles.videoTime}>
                {new Date(item.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              {isCurrentUser && (
                <MaterialIcons
                  name={item.isRead ? "done-all" : "done"}
                  size={14}
                  color="rgba(0, 145, 255, 0.85)"
                  style={styles.tickIcon}
                />
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <LinearGradient
            colors={["#f2f2f2", "#e5e5e5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.textMessageContent,
              isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isCurrentUser ? styles.currentUserText : styles.otherUserText,
              ]}
            >
              {item.message}
            </Text>

            <View style={styles.messageFooter}>
              <Text
                style={[
                  styles.messageTime,
                  isCurrentUser ? styles.currentUserTime : styles.otherUserTime,
                ]}
              >
                {new Date(item.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              {isCurrentUser && (
                <MaterialIcons
                  name={item.isRead ? "done-all" : "done"}
                  size={14}
                  color="rgba(0, 145, 255, 0.85)"
                  style={styles.tickIcon}
                />
              )}
            </View>
          </LinearGradient>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  /* row must span full width so justify/align works */
  messageRow: {
    width: "100%",
    flexDirection: "row",
    paddingVertical: 4,
  },
  rowRight: { justifyContent: "flex-end" },
  rowLeft: { justifyContent: "flex-start" },

  /* explicit bubble alignment for robustness */
  alignRight: { alignSelf: "flex-end", marginLeft: "20%" },
  alignLeft: { alignSelf: "flex-start", marginRight: "20%" },

  messageBubbleWide: {
    maxWidth: "92%",
  },

  /* text bubbles */
  currentUserBubble: {
    borderTopRightRadius: 0,
    padding: 12,
    borderRadius: 12,
  },
  otherUserBubble: {
    borderTopLeftRadius: 0,
    borderRadius: 12,
    padding: 12,
  },
  textMessageContent: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  /* image bubble overrides */
  imageBubble: {
    padding: 0,
    backgroundColor: "transparent",
  },

  messageText: {
    fontSize: 16,
    marginEnd: 8,
  },
  currentUserText: { color: "#000000ff" },
  otherUserText: { color: "#000000ff" },

  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  imageContainer: { position: "relative" },

  imageMessageFooter: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 30,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  messageFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  currentUserTime: { color: "rgba(6, 6, 6, 0.7)" },
  otherUserTime: { color: "rgba(0, 0, 0, 0.7)" },
  imageTime: { color: "#FFFFFF", fontSize: 10, marginRight: 2 },
  tickIcon: { marginLeft: 4 },

  /* video */
  videoOuterBubble: {
    backgroundColor: "transparent",
  },
  videoBubble: {
    width: 200,
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000",
  },
  videoThumbnail: { width: "100%", height: "100%" },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  playButtonContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  videoDurationContainer: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 50,
  },
  videoDuration: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  videoTimestampContainer: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 50,
  },
  videoTime: { color: "#fff", fontSize: 12, marginRight: 4 },
  giftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  giftLabel: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 6,
  },
  giftAmountText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },

  coinBubbleRight: {
    borderTopRightRadius: 0,
  },
  coinBubbleLeft: {
    borderTopLeftRadius: 0,
  },

  coinTime: {
    color: "rgba(255,255,255,0.8)",
  },
  coinContent: {
    alignItems: "center",
  },
  circle: {
    // height: 60,
    // width: 60,
    borderRadius: 40,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  coinLabel: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.95,
    marginTop: 8,
  },
  coinFooterRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  coinBubble: {
    padding: 16,
    alignItems: "stretch",
    borderRadius: 10,
  },
  coinFooter: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  coinAmountText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
});

export default MessageItem;
