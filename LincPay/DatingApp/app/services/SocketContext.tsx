// SocketContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import { DatabaseService } from "../services/database";
import { myConsole } from "../utils/myConsole";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [reload, setReload] = useState(false);
  const [newNotification, setNewNotification] = useState(false);
  const user = useSelector((state) => state.auth.user ?? null);

  useCallback(async () => {
    await DatabaseService.initDatabase();
  }, []);

  // const [currentUser, setCurrentUser] = useState(user ?? null);

  // useEffect(() => {
  //   const loadUser = async () => {
  //     try {
  //       const storedUser = await AsyncStorage.getItem("User");
  //       const parsed = JSON.parse(storedUser);
  //       setCurrentUser(parsed);
  //     } catch (err) {
  //       console.log("Error loading user:", err);
  //     }
  //   };
  //   loadUser();
  // }, []);

  useEffect(() => {
    console.log("Reloaded");

    if (!user) {
      console.log("No user");
      return;
    }
    // myConsole("With user", user);
    // Check if already connected
    if (socketRef.current && socketRef.current.connected) return;
    console.log("Connecting...");

    socketRef.current = io(process.env.EXPO_PUBLIC_API_SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      transports: ["websocket"],
    });
    // socketRef.current.on ANY
    // socketRef.current.onAny((eventName, ...args) => {
    //   console.log(eventName, args);
    // });

    socketRef.current.on("chatListUpdate", async (data) => {
      const {
        chatID,
        isRead,
        messageID,
        message,
        messageType,
        senderID,
        receiverID,
        timestamp,
      } = data;

      const localChats = await DatabaseService.getChatList(user.userID);
      const chat = localChats.find((chat) => chat.chatID === chatID);
      const updateChat = {
        ...chat,
        lastMessage: message,
        chatType: messageType,
        lastMessageTime: timestamp,
        isRead: isRead,
      };
      await DatabaseService.saveChat(updateChat);
      DatabaseService.saveMessage(data).catch((err) => {
        console.error("Error saving incoming message to DB:", err);
      });

      await DatabaseService.saveMessage({
        messageID: messageID,
        senderID: senderID,
        receiverID: receiverID,
        chatID: chatID,
        message: message,
        messageType: messageType,
        timestamp: timestamp,
        isRead: isRead,
        isSent: 1,
      });
      setNewNotification(true);
      console.log("makingrtrueesocket");
    });
    socketRef.current.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to server", user.userID);
    });
    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
      setIsOnline(false);
    });

    return () => {
      socketRef.current.off("connect");
      socketRef.current.off("disconnect");
      socketRef.current.off("chatListUpdate");
      socketRef.current.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  useEffect(() => {
    console.log(
      "Checking online status...",
      user?.userID,
      !isOnline,
      isConnected
    );

    if (user?.userID && !isOnline && isConnected) {
      // Set online status
      console.log("Emmiting Online with User ID:", user.userID);
      socketRef.current.emit("set-online", { userID: user.userID });
      setIsOnline(true);
    } else {
      setIsOnline(false);
    }
  }, [user, isConnected]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        currentUser: user,
        newNotification,
        setNewNotification,
        setReload,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};

export default { SocketContext, SocketProvider, useSocket };
