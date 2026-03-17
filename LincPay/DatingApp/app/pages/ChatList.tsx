import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/MaterialIcons";
import { DatabaseService } from "../services/database";
// import NetInfo from "@react-native-community/netinfo";
import * as FileSystem from "expo-file-system";
import ChatListItem from "../components/ChatListItem";
import { useSocket } from "../services/SocketContext";
import { useSelector } from "react-redux";
import CustomText from "../components/CustomText";
import { myConsole } from "../utils/myConsole";
import { color } from "../const/color";

const ChatList = () => {
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const router = useRouter();
  const user = useSelector((state: any) => state.auth?.user ?? null);
  const { socket, setNewNotification } = useSocket();

  const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
  const dedupeChats = useCallback((list = []) => {
    const map = new Map();
    for (const chat of list) {
      if (!chat?.chatID) continue;
      const prev = map.get(chat.chatID);
      if (!prev) {
        map.set(chat.chatID, chat);
      } else {
        const prevTs = new Date(prev.recentMessageTimestamp || 0).getTime();
        const curTs = new Date(chat.recentMessageTimestamp || 0).getTime();
        if (curTs >= prevTs) map.set(chat.chatID, chat);
      }
    }
    return Array.from(map.values());
  }, []);

  useEffect(() => {
    let unsubscribe;

    const initApp = async () => {
      try {
        console.log("Initializing app...");
        await DatabaseService.clearOldCachedImages();

        setIsDbReady(true);
      } catch (error) {
        console.error("Initialization failed:", error);
        setIsDbReady(true);
      }
    };

    initApp();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isDbReady && user?.userID) {
      fetchChatList();
    }
  }, [isDbReady, user?.userID]);

  const fetchChatList = async () => {
    if (!user?.userID) {
      console.log("[fetchChatList] No user ID available, skipping fetch");
      return;
    }

    try {
      setLoading(true);
      const localChatsRaw = await DatabaseService.getChatList(user.userID);
      const localChats = dedupeChats(localChatsRaw);

      if (!isConnected) {
        console.log("[fetchChatList] Device is offline - showing local data");
        setChatList(localChats);
        return;
      }
      try {
        const response = await axios.get(
          `${BASE_URL}/api/v1/chats/get-chat-list/${user.userID}`,
          { timeout: 8000 }
        );

        if (response.data?.success) {
          console.log(
            "[fetchChatList] Server returned",
            response.data.data.length,
            "chats"
          );

          const imageCachingPromises = response.data.data
            .filter((chat) => chat.profilePic)
            .map((chat) => cacheProfileImage(chat.profilePic));

          await Promise.all(imageCachingPromises);

          const serverChatsRaw = response.data.data.map((chat) => ({
            chatID: chat.chatID,
            userID: user.userID,
            chatType: chat.chatType || "private",
            chatName: chat.chatName || "",
            receiverUserID: chat.receiverUserID || "",
            profilePic: chat.profilePic || "",
            recentMessage: chat.recentMessage || chat.lastMessage || "",
            recentMessageTimestamp:
              chat.recentMessageTimestamp ||
              chat.lastMessageTime ||
              new Date().toISOString(),
            chatMembers: chat.chatMembers || "",
            unreadCount: chat.unreadCount,
            chatWith: chat.receiverUserID || "",
            createdBy: user.userID,
            createdAt: chat.createdAt || new Date().toISOString(),
            lastMessage: chat.lastMessage || "",
            lastMessageTime: chat.lastMessageTime || new Date().toISOString(),
          }));
          const serverChats = dedupeChats(serverChatsRaw);
          try {
            await DatabaseService.saveChatList(serverChats, user.userID);
            setChatList(serverChats);
          } catch (saveError) {
            console.error(
              "[fetchChatList] Error saving chats to DB:",
              saveError.message
            );
            setChatList(serverChats);
          }
        } else {
          setChatList(localChats);
        }
      } catch (serverError) {
        setChatList(localChats);
      }
    } catch (error) {
      console.error("[fetchChatList] Critical error:", error.message || error);
      try {
        const fallbackChatsRaw = await DatabaseService.getChatList(user.userID);
        setChatList(dedupeChats(fallbackChatsRaw));
      } catch (dbError) {
        console.error("[fetchChatList] Fallback failed:", dbError.message);
        setChatList([]);
      }
    } finally {
      console.log("[fetchChatList] Fetch process completed");
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChatList();
  }, []);

  const cacheProfileImage = async (imageUrl) => {
    if (!imageUrl) return null;

    try {
      const fullUrl = `${BASE_URL}${imageUrl}`;
      const cachedPath = await DatabaseService.getCachedImage(fullUrl);

      if (cachedPath) {
        const fileInfo = await FileSystem.getInfoAsync(cachedPath);
        if (fileInfo.exists) {
          return cachedPath;
        }
      }

      const cacheDir = FileSystem.cacheDirectory + "cached_images/";
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }

      const downloadResumable = FileSystem.createDownloadResumable(
        fullUrl,
        cacheDir + `${Date.now()}_${imageUrl.split("/").pop()}`,
        {}
      );

      const result = await downloadResumable.downloadAsync();

      if (result?.uri) {
        await DatabaseService.cacheImage(fullUrl, result.uri);
        return result.uri;
      }

      return null;
    } catch (error) {
      console.error("Error caching profile image:", error);
      return null;
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log("Chat list focused");
      fetchChatList();
      if (socket && user?.userID) {
        const handlechatListUpdate = (message) => {
          console.log("New message received via socket:", message);
          fetchChatList();
          // Add new message to local DB
          DatabaseService.saveMessage(message).catch((err) => {
            console.error("Error saving incoming message to DB:", err);
          });
        };
        socket.on("chatListUpdate", handlechatListUpdate);
        return () => {
          socket.off("chatListUpdate", handlechatListUpdate);
        };
      }
    }, [socket, user?.userID])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <CustomText style={styles.title}>Chat List</CustomText>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        {loading && chatList.length === 0 ? (
          <ActivityIndicator
            size="large"
            color={color.PRIMARY_COLOR}
            style={styles.loader}
          />
        ) : chatList.length > 0 ? (
          <FlatList
            data={chatList}
            keyExtractor={(item) => item.chatID}
            renderItem={({ item }) => (
              <ChatListItem
                item={item}
                isConnected={isConnected}
                BASE_URL={BASE_URL}
                setNewNotification={setNewNotification}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#FF7F50"]}
                tintColor="#FF7F50"
              />
            }
            ListFooterComponent={<View style={styles.footerSpacer} />}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="chatbubbles-outline"
              size={80}
              color="#D3D3D3"
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>
              {isConnected ? "No messages yet" : "Offline - No cached messages"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isConnected
                ? "Start a conversation with your friends"
                : "Connect to view your latest messages"}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  container: {
    flex: 1,
  },
  loader: {
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
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
    top: -5,
    right: -5,
    backgroundColor: "red",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadText: {
    color: "white",
    fontSize: 12,
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
    backgroundColor: "#FF7F50",
    marginLeft: 5,
  },
  lastMessage: {
    color: "#666",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  footerSpacer: {
    height: 20,
  },
});

export default ChatList;
