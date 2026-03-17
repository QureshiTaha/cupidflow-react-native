import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import { usePathname } from "expo-router";
import { Stack } from "expo-router/stack";
import React, { useEffect } from "react";
import { Alert, BackHandler, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "react-native-toast-notifications";
import { Provider } from "react-redux";
import CallManager from "../components/CallManager";
import store from "../Redux/store";
import { useSocket } from "../services/SocketContext";
import { color, themeColors } from "../const/color";

export default function Layout() {
  const pathName = usePathname();
  const [user, setUser] = React.useState(null);
  const REELS_CACHE_DIR = FileSystem.cacheDirectory + "reels/";
  const { isConnected, setReload } = useSocket();

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (pathName === "/pages/home") {
          Alert.alert("Hold on!", "Are you sure you want to exit the app?", [
            { text: "Cancel", style: "cancel" },
            { text: "YES", onPress: () => BackHandler.exitApp() },
          ]);
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, [pathName]),
  );

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

  const clearOldVideos = async () => {
    // Clear old videos log
    console.log("🗑️ Started Clearing old reels...");

    try {
      const dirInfo = await FileSystem.getInfoAsync(REELS_CACHE_DIR);
      if (!dirInfo.exists) {
        console.log("📁 Reels cache directory missing. Creating...");
        await FileSystem.makeDirectoryAsync(REELS_CACHE_DIR, {
          intermediates: true,
        });
        return; // Nothing to clear yet
      }

      const files = await FileSystem.readDirectoryAsync(REELS_CACHE_DIR);
      const now = Date.now();
      const THIRTY_MINUTES = 30 * 60 * 1000;

      for (const file of files) {
        const fileUri = `${REELS_CACHE_DIR}/${file}`;
        const info = await FileSystem.getInfoAsync(fileUri);

        const modifiedAt = (info as any).modificationTime;

        if (
          info.exists &&
          modifiedAt &&
          now - modifiedAt * 1000 > THIRTY_MINUTES
        ) {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
          console.log("🗑️ Deleted old reel:", file);
        }
      }
    } catch (error) {
      console.error("❌ Failed to clear old videos:", error);
    }
  };

  useEffect(() => {
    clearOldVideos();
  }, []);

  useEffect(() => {
    if (!isConnected) {
      setReload((prev: any) => !prev);
    }
  }, [isConnected]);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor={themeColors?.color4}
        translucent={false}
      />
      <CallManager currentUser={user} />
      <ToastProvider
        placement="top"
        duration={3000}
        animationType="slide-in"
        successColor="#4BB543"
        dangerColor="#FF3B30"
        warningColor="#FFA500"
        textStyle={{ fontSize: 16 }}
      >
        <Provider store={store}>
          <Stack screenOptions={{ headerShown: false }} />
        </Provider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
