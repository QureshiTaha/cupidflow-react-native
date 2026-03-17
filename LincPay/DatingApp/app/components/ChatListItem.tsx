import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { DatabaseService } from "../services/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomText from "./CustomText";
import { getRecentMessagePreview } from "../utils/commonFunctions";

const ChatListItem = ({ item, isConnected, BASE_URL, setNewNotification }) => {
  const [cachedImageUri, setCachedImageUri] = useState(null);
  const router = useRouter();
  const [user, setUser] = React.useState(null);
  useEffect(() => {
    const getUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("User");
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.log("Error loading user:", error);
      }
    };
    getUser();
  }, []);
  useEffect(() => {
    const loadCachedImage = async () => {
      if (item.profilePic) {
        const fullUrl = `${BASE_URL}${item.profilePic}`;
        const cachedPath = await DatabaseService.getCachedImage(fullUrl);
        if (cachedPath) {
          setCachedImageUri(cachedPath);
        }
      }
    };

    loadCachedImage();
  }, [item.profilePic]);

  const getCoinPreview = (raw) => {
    if (typeof raw !== "string") return null;
    try {
      const obj = JSON.parse(raw);
      if (obj?.type === "coin") {
        const amt = Number(obj?.amount) || 0;
        return `Coins • ${amt}`;
      }
    } catch {}
    return null;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  const previewText =
    getCoinPreview(item?.recentMessage) ??
    getRecentMessagePreview(item?.recentMessage);

  return (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={async () => {
        try {
          setNewNotification(false);
          if (user?.userID) {
            await DatabaseService.markChatMessagesAsRead(
              item.chatID,
              user.userID
            );
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (err) {
          console.log("Error marking messages as read:", err);
        }
        router.push({
          pathname: "../pages/ChatsScreen",
          params: {
            chatID: item.chatID,
            receiverID: item.receiverUserID || item.chatWith,
            receiverName: item.chatName,
            receiverProfilePic: item?.profilePic
              ? `${BASE_URL}${item.profilePic}`
              : null,
            receiverGender: item.userGender || 1,
            chatType: item.chatType,
          },
        });
      }}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={
            cachedImageUri
              ? { uri: cachedImageUri }
              : item.profilePic && isConnected
              ? { uri: `${BASE_URL}${item.profilePic}` }
              : item.userGender === 2
              ? require("../../assets/images/profile-female.jpg")
              : require("../../assets/images/profile.jpg")
          }
          style={styles.avatar}
        />

        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <CustomText style={styles.chatName} numberOfLines={1}>
            {item.chatName}
          </CustomText>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>
              {formatTime(item.recentMessageTimestamp)}
            </Text>
            {item.unreadCount > 0 && <View style={styles.unreadIndicator} />}
          </View>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {previewText}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chatItem: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  unreadBadge: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "green",
    borderRadius: 10,
    width: 30,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  chatContent: {
    flex: 1,
    justifyContent: "center",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  chatName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#181717ff",
    flex: 1,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    color: "#888",
    fontSize: 12,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff0000ff",
    marginLeft: 5,
  },
  lastMessage: {
    color: "#666",
    fontSize: 14,
  },
});

export default ChatListItem;
