import { Ionicons } from "@expo/vector-icons";
import messaging from "@react-native-firebase/messaging";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import axios from "axios";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useDispatch } from "react-redux";
import { login } from "../Redux/authSlice";
import { API_AXIOS } from "../api/axiosInstance";
import { storeData } from "../hooks/useAsyncStorage";
import { myConsole } from "../utils/myConsole";

GoogleSignin.configure({
  webClientId: '242615216218-7oqfjrdn5tlvo5cd7bb78a38tu2d92f8.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
  offlineAccess: true,
});

export default function GoogleLogin() {
  const dispatch = useDispatch();
  const router = useRouter();

  const signIn = async () => {
    console.log('sngintrigger')
    try {
      const hasPlayServices = await GoogleSignin.hasPlayServices();
      if (!hasPlayServices) {
        throw new Error("Google Play Services not available");
      }

      await GoogleSignin.signOut(); // clear previous sessions
      const user = await GoogleSignin.signIn();

      if (user.type === "success" && user.data.user) {
        const fcmToken = await messaging().getToken();
        console.log("📲 Got FCM Token:", fcmToken);

        const Response = await axios.post(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/users/google-login`,
          {
            credential: user.data.idToken,
          }
        );
        myConsole('Responseeee',Response)

        if (Response?.data?.status === true) {
          const responseData = Response.data.data;
          const loggedInUser = responseData.userData.data;

          // Save auth & user
          dispatch(login(loggedInUser));
          await storeData("Authenticated", "true");
          await storeData("accessToken", responseData.accessToken);
          await storeData(
            "refreshToken",
            JSON.stringify(responseData.refreshToken)
          );
          await storeData("User", JSON.stringify(loggedInUser));

          // Step 3: Update FCM token separately
          if (fcmToken) {
            try {
              await API_AXIOS.post("/users/update-user", {
                userID: loggedInUser.userID,
                fcmToken,
              });
              await storeData("fcmToken", fcmToken);
              console.log("✅ FCM token updated after Google login:", fcmToken);
            } catch (err) {
              console.log("⚠️ Error updating FCM token:", err.message);
            }
          }

          // Step 4: Navigate
          setTimeout(() => {
            router.replace("./home");
          }, 500);
        }
      }
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("❌ Sign in cancelled");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("🔁 Sign in in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log("⚠️ Play Services not available");
      } else {
        console.error("❌ Error during Google login", error);
      }
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.socialButton}
        activeOpacity={0.7}
        onPress={signIn}
      >
        <Ionicons name="logo-google" size={30} color="#ec4899" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
