import { useState } from "react";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import { login } from "../Redux/authSlice";
import { storeData } from "../hooks/useAsyncStorage";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import FontistoIcons from "react-native-vector-icons/Fontisto";
import { ActivityIndicator } from "react-native-paper";
import GoogleLogin from "../components/GoogleLogin";
import { useSocket } from "../services/SocketContext";
import messaging from "@react-native-firebase/messaging";
import { API_AXIOS } from "../api/axiosInstance";
import { color, themeColors } from "../const/color";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("testing@dev.com");
  const [password, setPassword] = useState("testing@dev.com");
  // const [email, setEmail] = useState("tttt@gmail.com");
  // const [password, setPassword] = useState("tttttttt");
  // const [email, setEmail] = useState("test@test");
  // const [password, setPassword] = useState("test@test");
  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState("");
  const { setReload } = useSocket();
  const [isFocused, setIsFocused] = useState({
    email: false,
    password: false,
  });
  const dispatch = useDispatch();

  const handleFocus = (field) => {
    setIsFocused({ ...isFocused, [field]: true });
  };

  const handleBlur = (field) => {
    setIsFocused({ ...isFocused, [field]: false });
  };

  const validateLogin = async () => {
    setIsValidating(true);
    Keyboard.dismiss();

    if (!email.includes("@")) {
      setError("Invalid email address");
      setIsValidating(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsValidating(false);
      return;
    }
    try {
      await login_(email, password);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Something went wrong. Please try again.");
      setIsValidating(false);
    }
  };

  const login_ = async (userEmail, userPassword) => {
    let data = JSON.stringify({
      userEmail: userEmail,
      userPassword: userPassword,
    });

    await axios
      .post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/users/login`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then(async function (response) {
        if (response?.data?.status === true) {
          const user = response.data.data.UserData;

          await storeData("Authenticated", "true");
          await storeData("accessToken", response.data.data.accessToken);
          await storeData(
            "refreshToken",
            JSON.stringify(response.data.data.refreshToken)
          );
          await storeData("User", JSON.stringify(user));

          dispatch(login(user));

          // 🔹 Immediately register FCM after login (no reload needed)
          try {
            const authStatus = await messaging().requestPermission();
            const enabled =
              authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
              authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
              const fcmToken = await messaging().getToken();
              if (fcmToken) {
                await API_AXIOS.post("/users/update-user", {
                  userID: user.userID,
                  fcmToken,
                });
                console.log("✅ FCM token updated on login:", fcmToken);
              }
            } else {
              console.log("❌ Notification permission not granted");
            }
          } catch (err) {
            console.log("⚠️ FCM setup error after login:", err);
          }

          setTimeout(() => {
            setReload((prev) => !prev);
            router.replace("./home");
          }, 500);
        }
        setIsValidating(false);
      })
      .catch(function (error) {
        console.log("errorrrr", error);
        if (error.response && error.response?.status === 400) {
          setError(error.response.data.msg);
        }
        setIsValidating(false);
      });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={[themeColors.color3, themeColors.color1, themeColors.color2]}
        style={styles.container}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
               <StatusBar barStyle="dark-content" backgroundColor={themeColors.color3} />
            <View style={styles.formBox}>
              {/* Header */}
              <View style={styles.header}>
                <LinearGradient
                  colors={[themeColors.color1, themeColors.color2]}
                  style={styles.iconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <FontistoIcons name="person" size={30} color="#fff" />
                </LinearGradient>
                <Text style={styles.welcomeText}>Welcome Back!</Text>
                <Text style={styles.title}>Sign in to your account</Text>
              </View>

              {/* Form Fields */}
              <View style={styles.formContainer}>
                {/* Email Input */}
                <View
                  style={[
                    styles.inputContainer,
                    isFocused.email && styles.inputContainerFocused,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={isFocused.email ? themeColors.color1 : "#aaa"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#aaa"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError("");
                    }}
                    onFocus={() => handleFocus("email")}
                    onBlur={() => handleBlur("email")}
                  />
                </View>

                {/* Password Input */}
                <View
                  style={[
                    styles.inputContainer,
                    isFocused.password && styles.inputContainerFocused,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={isFocused.password ? themeColors.color1 : "#aaa"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#aaa"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError("");
                    }}
                    onFocus={() => handleFocus("password")}
                    onBlur={() => handleBlur("password")}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={isFocused.password ? themeColors.color1 : "#aaa"}
                    />
                  </TouchableOpacity>
                </View>

                {/* Error Message */}
                {error ? (
                  <Animated.View
                    style={styles.errorContainer}
                    entering={Animated.spring(
                      { opacity: 1, translateY: 0 },
                      { useNativeDriver: true }
                    )}
                  >
                    <Ionicons name="alert-circle" size={18} color="#ff6b6b" />
                    <Text style={styles.errorText}>{error}</Text>
                  </Animated.View>
                ) : null}

                {/* Login Button */}
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    isValidating && styles.loginButtonDisabled,
                  ]}
                  onPress={validateLogin}
                  disabled={isValidating}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[themeColors.color1, themeColors.color2]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isValidating ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Sign In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Forgot Password */}
                <TouchableOpacity
                  style={styles.forgotContainer}
                  onPress={() => router.push("../pages/forgotPassword")}
                  activeOpacity={0.6}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social Login Buttons */}
                <View style={styles.socialContainer}>
                  <GoogleLogin />
                </View>

                {/* Sign Up Link */}
                <View style={styles.signUpContainer}>
                  <Text style={styles.signUpText}>Don't have an account? </Text>
                  <TouchableOpacity
                    onPress={() => router.push("./signUp")}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.signUpLink}>Create Account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  formBox: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: themeColors.color1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1e2a3a",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    color: "#666",
    fontWeight: "400",
  },
  formContainer: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: themeColors.color1,
    shadowColor: themeColors.color1,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1e2a3a",
    paddingVertical: 12,
  },
  eyeIcon: {
    padding: 6,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#ffcdd2",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  loginButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
    shadowColor: themeColors.color1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotContainer: {
    alignItems: "center",
    marginTop: 4,
  },
  forgotText: {
    fontSize: 15,
    color: themeColors.color1,
    fontWeight: "500",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  signUpText: {
    fontSize: 15,
    color: "#555",
  },
  signUpLink: {
    fontSize: 15,
    color: themeColors.color2,
    fontWeight: "600",
  },
});