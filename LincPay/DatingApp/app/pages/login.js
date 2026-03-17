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
  Image,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Linking,
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

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("testing2@dev.com");
  const [password, setPassword] = useState("123456");
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
        console.log("error", error);

        if (error.response && error.response?.status === 400) {
          setError(error.response.data.msg);
        }
        setIsValidating(false);
      });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={["#fdf2f8", "#ffffff", "#fef7ed"]}
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
            <View style={styles.formBox}>
              {/* Header */}
              <View style={styles.header}>
                <Animated.View style={styles.iconContainer}>
                  <FontistoIcons name="person" size={40} color="#fff" />
                </Animated.View>
                <Text style={styles.welcomeText}>Welcome Back!</Text>
                <Text style={styles.title}>Sign In</Text>
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
                    name="mail"
                    size={20}
                    color={isFocused.email ? "#ec4899" : "#f472b6"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#9ca3af"
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
                    name="key"
                    size={20}
                    color={isFocused.password ? "#ec4899" : "#f472b6"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#9ca3af"
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
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color={isFocused.password ? "#ec4899" : "#9ca3af"}
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
                    <Ionicons name="alert-circle" size={16} color="#dc2626" />
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
                    colors={["#f472b6", "#ec4899"]}
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
                  {/* <TouchableOpacity
                    style={styles.socialButton}
                    activeOpacity={0.7}
                    onPress={() => Linking.openURL("https://api-dating-app.iceweb.in/api/v1/users/google-login")}
                  >
                    <Ionicons name="logo-google" size={30} color="#ea4335" />
                    
                  </TouchableOpacity> */}

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
    paddingVertical: 40,
  },
  formBox: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f472b6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#f472b6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeText: {
    fontSize: 18,
    color: "#6b7280",
    marginBottom: 4,
    textAlign: "center",
    fontFamily: "sans-serif-medium",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 8,
    textAlign: "center",
    fontFamily: "sans-serif-medium",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    fontFamily: "sans-serif",
  },
  formContainer: {
    gap: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderWidth: 2,
    borderColor: "#fce7f3",
    borderRadius: 28,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    transitionProperty: "border-color",
    transitionDuration: "300ms",
  },
  inputContainerFocused: {
    borderColor: "#ec4899",
    shadowColor: "#ec4899",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    fontFamily: "sans-serif",
  },
  eyeIcon: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#fecaca",
    gap: 8,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
    fontFamily: "sans-serif-medium",
  },
  loginButton: {
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#f472b6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "sans-serif-medium",
  },
  forgotContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  forgotText: {
    fontSize: 16,
    color: "#f472b6",
    fontWeight: "600",
    fontFamily: "sans-serif-medium",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "500",
    fontFamily: "sans-serif-medium",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 26,
    marginBottom: 24,
  },
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signUpText: {
    fontSize: 16,
    color: "#6b7280",
    fontFamily: "sans-serif",
  },
  signUpLink: {
    fontSize: 16,
    color: "#f472b6",
    fontWeight: "600",
    fontFamily: "sans-serif-medium",
  },
});
