import { Stack } from "expo-router/stack";
import { Provider } from "react-redux";
import { StyleSheet, Platform, View } from "react-native";
import { StatusBar } from "expo-status-bar"; // import from expo-status-bar
import store from "./Redux/store";
import { SocketProvider } from "./services/SocketContext";
import { PermissionsAndroid } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import messaging from "@react-native-firebase/messaging";

const queryClient = new QueryClient();

export default function Layout() {
  useMemo(() => {
    if (Platform.OS === "android") {
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    } else if (Platform.OS === "ios") {
      // iOS handles permissions differently, but this line does nothing harmful
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    } else {
      console.log("No permission required for this platform");
    }

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log("Message handled in the background!", remoteMessage);
    });
    messaging().onMessage(async (remoteMessage) => {
      console.log("A new FCM message arrived!", remoteMessage);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* unified status bar */}
      <View style={{ flex: 1 }}>
        <Provider store={store}>
          <SocketProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </SocketProvider>
        </Provider>
      </View>
    </QueryClientProvider>
  );
}
