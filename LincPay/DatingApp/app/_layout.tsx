import { Stack } from "expo-router/stack";
import { Provider } from "react-redux";
import { StyleSheet, Platform, StatusBar } from "react-native";
import store from "./Redux/store";
import { SafeAreaView } from "react-native-safe-area-context";
import { SocketProvider } from "./services/SocketContext";
import { PermissionsAndroid } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import messaging from "@react-native-firebase/messaging";
import { usePathname } from "expo-router";
const queryClient = new QueryClient();

export default function Layout() {
  const pathname = usePathname();
  useMemo(() => {
    if (Platform.OS === "android") {
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    } else if (Platform.OS === "ios") {
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    } else {
      console.log("No permission required for this platform");
    }

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log("Message handled in the background!", remoteMessage);
      // Optional: You can process the message data here,
      // but cannot update UI.
    });
    messaging().onMessage(async (remoteMessage) => {
      console.log("A new FCM message arrived!", remoteMessage);
      // You can update your UI here to show the notification
    });
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView style={styles.AndroidSafeArea}>
        <StatusBar
          style={pathname.includes("reels") ? "light" : "dark"}
          backgroundColor={pathname.includes("reels") ? "#000" : "#fff"}
          animated
        />
        <Provider store={store}>
          <SocketProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </SocketProvider>
        </Provider>
      </SafeAreaView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  AndroidSafeArea: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: Platform.OS === "android" ? 0 : 0,
  },
});
