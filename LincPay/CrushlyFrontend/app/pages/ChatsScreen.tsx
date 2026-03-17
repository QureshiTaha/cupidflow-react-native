import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import ChatFooter from "../components/ChatFooter";
import { useSocket } from "../services/SocketContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as VideoThumbnails from "expo-video-thumbnails";
import CustomText from "../components/CustomText";
import { DatabaseService } from "../services/database";
import MessageItem from "../components/MessageItem";
import { MessageService } from "../services/messageService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MediaPreviewModals from "../components/MediaPreviewModals";
import OptionItem from "../components/OptionItem";
import { myConsole } from "../utils/myConsole";
import { themeColors } from "../const/color";

const { width } = Dimensions.get("window");
const PAGE_LIMIT = 10;

export default function ChatsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { socket, isConnected, setNewNotification } = useSocket();

  const [showCallOptions, setShowCallOptions] = useState(false);
  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [messages, setMessages] = useState([]); // DESC (newest first)
  const [profileData, setProfileData] = useState({
    username: params.receiverName || "Unknown User",
    profileImage: params.receiverProfilePic || null,
    userGender: params.receiverGender || 1,
    status: "",
    userId: params.receiverID,
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [page, setPage] = useState(1);

  const [videoThumbnails, setVideoThumbnails] = useState({});
  const [videoDurations, setVideoDurations] = useState({}); // reserved if needed

  const flatListRef = useRef(null);
  const currentUserRef = useRef(null);
  const chatIDRef = useRef(params.chatID);

  // Guard against concurrent fetches
  const fetchingRef = useRef(false);

  // Initialize DB once
  useEffect(() => {
    (async () => {
      try {
        await DatabaseService.initDatabase();
        setIsDbReady(true);
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    })();
  }, []);

  // Load current user
  useEffect(() => {
    (async () => {
      try {
        const storedUser = await AsyncStorage.getItem("User");
        const parsed = storedUser ? JSON.parse(storedUser) : null;
        if (parsed?.userID) {
          currentUserRef.current = parsed;
          setCurrentUser(parsed);
          socket.emit("check-online", {
            userID: params.receiverID,
            checkerUserID: parsed.userID,
          });
        }
      } catch (err) {
        console.log("Error loading user:", err);
      }
    })();
  }, [socket, params.receiverID]);

  // Profile & status listeners
  useEffect(() => {
    setProfileData((prev) => ({
      ...prev,
      username: params.receiverName || "Unknown User",
      profileImage: params.receiverProfilePic || null,
      userGender: params.receiverGender || 1,
      userId: params.receiverID,
    }));

    const handleStatusUpdate = ({ userId, isOnline }) => {
      if (userId === params.receiverID) {
        setProfileData((prev) => ({
          ...prev,
          status: isOnline ? "Online" : "Offline",
        }));
      }
    };

    const statusReceived = (data) => {
      if (data.userID == params.receiverID) {
        setProfileData((prev) => ({
          ...prev,
          status: data.onlineStatus == 0 ? "Offline" : "Online",
        }));
      }
    };

    socket.on("userStatusUpdate", handleStatusUpdate);
    socket.on("status-received", statusReceived);

    return () => {
      socket.off("userStatusUpdate", handleStatusUpdate);
      socket.off("status-received", statusReceived);
    };
  }, [
    socket,
    params.receiverID,
    params.receiverName,
    params.receiverProfilePic,
    params.receiverGender,
  ]);

  // Helper: format duration for videos
  const formatDuration = useCallback((seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }, []);

  // Thumbnail generation (lazy)
  const getOrCreateThumbnail = useCallback(
    async (message) => {
      try {
        if (videoThumbnails[message.messageID])
          return videoThumbnails[message.messageID];
        if (message.thumbnailUri) return message.thumbnailUri;

        const { uri } = await VideoThumbnails.getThumbnailAsync(
          message.message,
          { time: 1000 },
        );
        await DatabaseService.updateMessageThumbnail(message.messageID, uri);
        return uri;
      } catch (error) {
        console.error("Thumbnail generation failed:", error);
        return null;
      }
    },
    [videoThumbnails],
  );

  useEffect(() => {
    (async () => {
      if (!messages.length) return;
      for (const msg of messages) {
        if (msg.messageType === "video" && !videoThumbnails[msg.messageID]) {
          const thumb = await getOrCreateThumbnail(msg);
          if (thumb) {
            setVideoThumbnails((prev) => ({ ...prev, [msg.messageID]: thumb }));
          }
        }
      }
    })();
  }, [messages, getOrCreateThumbnail, videoThumbnails]);

  // Fetch messages (DESC) — supports initial and pagination
  const fetchMessages = useCallback(
    async (pageNum = 1, initial = false) => {
      if (fetchingRef.current || !isDbReady || !params.chatID) return;
      fetchingRef.current = true;

      try {
        if (initial) setLoading(true);
        else setLoadingMore(true);

        const result = await MessageService.fetchMessages(
          params.chatID,
          pageNum,
          PAGE_LIMIT,
          initial,
          initial /* initialLoadComplete not needed now; handled by pageNum */,
        );

        if (result.error) {
          console.error("Error fetching messages:", result.error);
        }

        // We keep DESC order in state
        if (initial) {
          setMessages(result.messages);
          setPage(1);
        } else {
          setMessages((prev) => {
            // Append older chunk at the END (since DESC order: older = smaller timestamp)
            // Also de-dup by messageID
            const existing = new Map(prev.map((m) => [m.messageID, m]));
            for (const m of result.messages) existing.set(m.messageID, m);
            // resort DESC to be safe
            return [...existing.values()].sort(
              (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
            );
          });
        }

        setHasMoreMessages(result.hasMore);
      } catch (err) {
        console.error("Unexpected error in fetchMessages:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        fetchingRef.current = false;
      }
    },
    [isDbReady, params.chatID],
  );

  // Join room + initial fetch when ready
  useEffect(() => {
    if (!currentUser || !params.chatID) return;

    chatIDRef.current = params.chatID;

    socket.connect();
    socket.emit("joinRoom", { chatID: params.chatID });
    socket.emit("joinChatList", { userID: currentUser.userID });

    // Initial load
    fetchMessages(1, true);

    return () => {
      socket.emit("leaveRoom", { chatID: params.chatID });
      // keep connection if app uses global socket; do not disconnect here
    };
  }, [socket, currentUser, params.chatID, fetchMessages]);

  // Socket events (new message, typing, read receipts)
  useEffect(() => {
    const onNewMessage = async (message) => {
      if (message.chatID !== chatIDRef.current) return;

      const me = currentUserRef.current;
      // Persist locally
      await DatabaseService.saveMessage({
        messageID: message.messageID,
        senderID: message.senderID,
        receiverID:
          message.senderID === me?.userID ? params.receiverID : me?.userID,
        chatID: message.chatID,
        message: message.message,
        messageType: message.messageType,
        timestamp: message.timestamp,
        isRead: message.isRead,
        isSent: 1,
      });

      // Add to UI at the FRONT (DESC order => newest first)
      setMessages((prev) => {
        if (prev.some((m) => m.messageID === message.messageID)) return prev;
        const next = [message, ...prev];
        return next.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
        );
      });

      // Auto mark seen if it's from the other user
      if (message.senderID !== me?.userID) {
        await markMessageAsRead(message.messageID);
      }
      setTimeout(() => {
        setNewNotification(false);
      }, 500);
    };

    const onChatListUpdate = () => setNewNotification(false);

    const onTyping = ({ userID }) => {
      const me = currentUserRef.current;
      if (userID !== me?.userID) setIsTyping(true);
    };

    const onStopTyping = ({ userID }) => {
      const me = currentUserRef.current;
      if (userID !== me?.userID) setIsTyping(false);
    };

    const onMessageSeen = async ({ messageID }) => {
      await DatabaseService.updateMessageReadStatus(messageID, 1);

      setMessages((prev) =>
        prev.map((m) => (m.messageID === messageID ? { ...m, isRead: 1 } : m)),
      );
    };

    const onMessageReadAll = async ({ chatID }) => {
      if (chatID !== chatIDRef.current) return;
      setMessages((prev) => {
        const me = currentUserRef.current;
        const ids = prev
          .filter((m) => m.senderID === me?.userID)
          .map((m) => m.messageID);
        DatabaseService.markMessagesAsSeen(ids);
        return prev.map((m) =>
          m.senderID === me?.userID ? { ...m, isRead: 1 } : m,
        );
      });
    };

    socket.on("newMessage", onNewMessage);
    socket.on("chatListUpdate", onChatListUpdate);
    socket.on("typing", onTyping);
    socket.on("stopTyping", onStopTyping);
    socket.on("messageSeen", onMessageSeen);
    socket.on("messageReadAll", onMessageReadAll);

    return () => {
      socket.off("newMessage", onNewMessage);
      socket.off("chatListUpdate", onChatListUpdate);
      socket.off("typing", onTyping);
      socket.off("stopTyping", onStopTyping);
      socket.off("messageSeen", onMessageSeen);
      socket.off("messageReadAll", onMessageReadAll);
    };
  }, [socket, params.receiverID, setNewNotification]);

  // Mark all unread (from other user) as read whenever we have messages
  useEffect(() => {
    if (!currentUser || !params.chatID || messages.length === 0) return;

    const unreadFromOther = messages.some(
      (m) => m.senderID !== currentUser.userID && m.isRead === 0,
    );
    if (unreadFromOther) {
      markMessagesAsRead();
    }
  }, [messages, currentUser, params.chatID]);

  // Load older messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMoreMessages) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchMessages(nextPage, false);
  }, [loadingMore, hasMoreMessages, page, fetchMessages]);

  // Mark all messages as read for this chat
  const markMessagesAsRead = useCallback(async () => {
    if (!currentUser) return;
    try {
      const result = await MessageService.markMessagesAsRead(
        params.chatID,
        currentUser.userID,
      );
      if (result.success) {
        socket.emit("readMessage", {
          chatID: params.chatID,
          userID: currentUser.userID,
        });

        setMessages((prev) =>
          prev.map((m) =>
            m.senderID !== currentUser.userID ? { ...m, isRead: 1 } : m,
          ),
        );
      }
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  }, [socket, params.chatID, currentUser]);

  // Mark a single message as read
  const markMessageAsRead = useCallback(
    async (messageID) => {
      if (!currentUser) return;
      try {
        const result = await MessageService.markMessageAsRead(messageID);
        if (result.success) {
          socket.emit("seenThisMessage", {
            messageID,
            chatID: params.chatID,
            userID: currentUser.userID,
          });
          setMessages((prev) =>
            prev.map((m) =>
              m.messageID === messageID ? { ...m, isRead: 1 } : m,
            ),
          );
        }
      } catch (err) {
        console.error("Error in markMessageAsRead", err);
      }
    },
    [socket, params.chatID, currentUser],
  );

  // Send message handler
  const sendMessage = useCallback(
    async (messageText: any, messageType = "text") => {
      if (
        !currentUser ||
        !messageText ||
        (typeof messageText === "string" && !messageText.trim())
      ) {
        return;
      }
      try {
        let normalizedMessage = messageText;
        if (messageType === "coin") {
          const payload =
            typeof messageText === "string"
              ? (() => {
                  try {
                    return JSON.parse(messageText);
                  } catch {
                    return { amount: Number(messageText) || 0 };
                  }
                })()
              : messageText;
          normalizedMessage = JSON.stringify({
            type: "coin",
            amount: Number(payload?.amount) || 0,
            txId: payload?.txId,
          });
        }
        const messageData = {
          senderID: currentUser.userID,
          receiverID: params.receiverID,
          chatID: params.chatID,
          message: normalizedMessage,
          messageType,
        };

        // Optimistic local insert (temp ID)
        const tempID = `${Date.now()}`;
        const tempTimestamp = new Date().toISOString();

        await DatabaseService.saveMessage({
          messageID: tempID,
          ...messageData,
          timestamp: tempTimestamp,
          isRead: 0,
          isSent: 0,
          failed: 0,
        });

        // DESC order => add to FRONT
        const tempMessage = {
          ...messageData,
          messageID: tempID,
          timestamp: tempTimestamp,
          isRead: 0,
          senderName: `${currentUser.userFirstName || ""} ${
            currentUser.userSurname || ""
          }`.trim(),
        };
        setMessages((prev) =>
          [tempMessage, ...prev].sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
          ),
        );

        // Emit via socket
        socket.emit("sendMessage", messageData);

        // Listen for ack events (unique channels per temp ID if your backend supports it)
        socket.once(`messageSent_${tempID}`, async (realMessage) => {
          await DatabaseService.saveMessage({
            ...realMessage,
            isSent: 1,
            isRead: realMessage.senderID === currentUser.userID ? 1 : 0,
          });
          setMessages((prev) =>
            prev
              .map((m) => (m.messageID === tempID ? { ...realMessage } : m))
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
          );
        });

        socket.once(`messageFailed_${tempID}`, async () => {
          await DatabaseService.markMessageAsFailed(tempID);
          setMessages((prev) =>
            prev.map((m) => (m.messageID === tempID ? { ...m, failed: 1 } : m)),
          );
        });
      } catch (err) {
        console.error("Error sending message:", err);
        Alert.alert("Error", "Failed to send message");
      }
    },
    [socket, currentUser, params.chatID, params.receiverID],
  );

  // Typing indicators
  const handleTyping = useCallback(
    (typing) => {
      if (!currentUser) return;
      socket.emit(typing ? "typing" : "stopTyping", {
        chatID: params.chatID,
        userID: currentUser.userID,
      });
    },
    [socket, currentUser, params.chatID],
  );

  // Simple helpers to avoid undefined functions
  const pickFromCamera = () => Alert.alert("Camera", "Not implemented here.");
  const pickFromGallery = () => Alert.alert("Gallery", "Not implemented here.");

  const renderMessage = useCallback(
    ({ item }) => {
      const isCurrentUser = item.senderID === currentUser?.userID;
      return (
        <MessageItem
          item={item}
          isCurrentUser={isCurrentUser}
          profileData={profileData}
          videoThumbnails={videoThumbnails}
          videoDurations={videoDurations}
          setPreviewImage={setPreviewImage}
          setPreviewVideo={setPreviewVideo}
          formatDuration={formatDuration}
          currentUser={currentUser}
        />
      );
    },
    [currentUser, profileData, videoThumbnails, videoDurations, formatDuration],
  );

  const handleBackPress = () => router.back();
  const handleVideoCall = () => {
    router.push({
      pathname: "../pages/WebRTCComponent",
      params: {
        currentUser_: JSON.stringify(currentUser),
        from_: currentUser.userID,
        to_: params.receiverID,
        chatID: params.chatID,
        isCaller: true,
        status_: "calling",
      },
    });
  };

  if (loading && messages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7F50" />
      </View>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 24}
        >
          <View style={styles.innerContainer}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleBackPress}
                style={styles.backButton}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={themeColors.color4}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.profileInfo}
                onPress={() => setShowProfileOptions((s) => !s)}
              >
                <Image
                  source={
                    profileData?.profileImage
                      ? { uri: profileData.profileImage }
                      : profileData?.userGender === 2
                        ? require("../../assets/images/profile-female.jpg")
                        : require("../../assets/images/profile.jpg")
                  }
                  style={styles.profileImage}
                />
                <View>
                  <CustomText
                    style={[styles.profileName, { color: themeColors.color4 }]}
                    numberOfLines={1}
                  >
                    {profileData.username || "User"}
                  </CustomText>
                  <CustomText style={styles.profileStatus}>
                    {isTyping ? "Typing..." : profileData.status || "Offline"}
                  </CustomText>
                </View>
              </TouchableOpacity>

              <View style={styles.callIcons}>
                <TouchableOpacity
                  style={{ marginLeft: 16 }}
                  onPress={() => setShowCallOptions((s) => !s)}
                >
                  <Ionicons
                    name="videocam-outline"
                    size={24}
                    color={themeColors.color4}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              ref={flatListRef}
              data={messages} // DESC order
              inverted // latest at bottom visually; easier pagination
              keyExtractor={(item, index) =>
                item?.messageID?.toString() ?? `${index}`
              }
              renderItem={renderMessage}
              contentContainerStyle={styles.chatArea}
              onEndReached={loadMoreMessages} // in inverted list = loads older when you scroll up
              onEndReachedThreshold={0.2}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                // with inverted, footer sits at top visually = good for loader
                loadingMore ? (
                  <ActivityIndicator
                    size="small"
                    color="#FF7F50"
                    style={styles.loadMoreIndicator}
                  />
                ) : null
              }
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === "ios" ? "interactive" : "on-drag"
              }
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.emptyChatContainer}>
                    <Text style={styles.emptyChatText}>No messages yet</Text>
                    <Text style={styles.emptyChatSubtext}>
                      Start the conversation!
                    </Text>
                  </View>
                ) : null
              }
              initialNumToRender={20}
              maxToRenderPerBatch={10}
              windowSize={21}
            />
          </View>

          {/* Profile Options */}
          {showProfileOptions && (
            <>
              <Pressable
                style={styles.backdrop}
                onPress={() => setShowProfileOptions(false)}
              />
              <View style={styles.optionsContainer}>
                <OptionItem
                  icon="user"
                  text="View Profile"
                  onPress={() => {
                    setShowProfileOptions(false);
                    router.push({
                      pathname: "../pages/profile",
                      params: {
                        userId: profileData.userId,
                        username: profileData.username,
                        profileImage: profileData.profileImage,
                      },
                    });
                  }}
                />
                <OptionItem
                  icon="trash-2"
                  text="Delete Chat"
                  onPress={() => {
                    setShowProfileOptions(false);
                  }}
                />
              </View>
            </>
          )}

          {/* Call Options */}
          {showCallOptions && (
            <>
              <Pressable
                style={styles.backdrop}
                onPress={() => setShowCallOptions(false)}
              />
              <View style={styles.optionsContainer}>
                <OptionItem
                  onPress={handleVideoCall}
                  icon="video"
                  text="Premium video Call"
                  subtext={isConnected ? "" : "You are currently not connected"}
                  coinIcon
                  color={themeColors.color4}
                />
              </View>
            </>
          )}

          <ChatFooter
            sendMessage={sendMessage}
            receiverID={params.receiverID}
            onTyping={handleTyping}
            onAttachPress={() => {
              Alert.alert("Send Attachment", "Choose an option", [
                { text: "Camera", onPress: () => pickFromCamera() },
                { text: "Gallery", onPress: () => pickFromGallery() },
                { text: "Cancel", style: "cancel" },
              ]);
            }}
          />
        </KeyboardAvoidingView>

        <MediaPreviewModals
          imageUri={previewImage}
          onCloseImage={() => setPreviewImage(null)}
          videoUri={previewVideo}
          onCloseVideo={() => setPreviewVideo(null)}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 99,
  },
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  innerContainer: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.color1,
  },
  backButton: { marginRight: 15 },
  profileInfo: { flex: 1, flexDirection: "row", alignItems: "center" },
  profileImage: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  profileName: { fontSize: 16, fontWeight: "bold" },
  profileStatus: { fontSize: 12, color: themeColors.color1 },
  callIcons: { flexDirection: "row" },

  chatArea: {
    padding: 15,
    paddingBottom: 80,
    flexGrow: 1,
    justifyContent: "flex-end",
  },

  // Message bubble container
  messageBubble: { maxWidth: "80%", borderRadius: 12 },

  // Current user bubble
  currentUserBubble: {
    backgroundColor: "#df3f77ff",
    borderTopRightRadius: 0,
    padding: 12,
    borderRadius: 12,
  },

  textMessageContent: { flexDirection: "row", flexWrap: "wrap" },
  otherUserBubble: {
    borderTopLeftRadius: 0,
    borderRadius: 12,
    padding: 12,
  },
  imageBubble: { padding: 0, backgroundColor: "transparent" },

  messageText: { fontSize: 16, marginEnd: 8 },
  currentUserText: { color: "#FFFFFF" },
  otherUserText: { color: "#fff" },

  messageImage: {
    width: 200,
    height: 200,
    marginRight: 10,
    borderRadius: 10,
  },

  messageTime: {
    fontSize: 11,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  currentUserTime: { color: "rgba(255,255,255,0.7)" },
  otherUserTime: { color: "rgba(255,255,255,0.7)" },
  imageTime: { color: "#FFFFFF", fontSize: 10, marginRight: 2 },

  tickIcon: { marginLeft: 4 },

  optionsContainer: {
    position: "absolute",
    right: 15,
    top: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    // paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: themeColors.color2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 100,
    borderColor: themeColors.color2,
    borderWidth: 1,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 180,
  },
  optionIcon: { marginRight: 12 },
  optionTextContainer: { flex: 1 },
  optionText: { fontSize: 16 },
  subtextContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  coinIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e91e63",
    marginRight: 5,
  },
  subtext: { fontSize: 12, color: "#666" },

  emptyChatContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyChatText: { fontSize: 18, color: "#666", marginBottom: 5 },
  emptyChatSubtext: { fontSize: 14, color: "#999" },

  loadMoreIndicator: { paddingVertical: 10 },

  imageContainer: { position: "relative" },

  videoContainer: {
    maxWidth: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  videoPlayer: {
    width: 200,
    height: 200,
    borderRadius: 10,
    backgroundColor: "#000",
  },

  videoBubble: {
    width: 200,
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
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
  coinRow: {
    width: "100%",
    marginVertical: 6,
    paddingHorizontal: 10,
  },
  coinRowRight: { alignItems: "flex-end" },
  coinRowLeft: { alignItems: "flex-start" },
  coinCard: {
    minWidth: 150,
    maxWidth: "80%",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    elevation: 1,
  },
  coinCardOut: { backgroundColor: "#ef476f" }, // sent
  coinCardIn: { backgroundColor: "#06d6a0" }, // received
  coinText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
