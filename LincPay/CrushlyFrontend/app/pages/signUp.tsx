import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import FontistoIcons from "react-native-vector-icons/Fontisto";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator } from "react-native-paper";
import { login } from "../Redux/authSlice";
import { useDispatch } from "react-redux";
import { useToast } from "react-native-toast-notifications";

// Theme colors
export const themeColors = {
  color1: "#f38ea8",
  color2: "#ef7cca",
  color3: "#f4b595",
  color4: "#8f6adf",
};

export default function SignUpScreen() {
  const router = useRouter();
  const [userFirstName, setFirstName] = useState("");
  const [userSurname, setSurname] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userConfirmPassword, setUserConfirmPassword] = useState("");
  const [userGenderID, setUserGenderID] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [userDateOfBirth, setUserDateOfBirth] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [shakeAnimation] = useState(new Animated.Value(0));
  const dispatch = useDispatch();
  const toast = useToast();

  useEffect(() => {
    if (selectedDay && selectedMonth !== null && selectedYear) {
      const formattedDate = `${selectedYear}-${(
        "0" +
        (selectedMonth + 1)
      ).slice(-2)}-${("0" + selectedDay).slice(-2)}`;
      setUserDateOfBirth(formattedDate);
    }
  }, [selectedDay, selectedMonth, selectedYear]);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSignUp = async () => {
    setIsValidating(true);
    const hasWhitespace = /\s/.test(userPassword);
    if (hasWhitespace) {
      setError("Password should not contain whitespace");
      triggerShake();
      setIsValidating(false);
      return;
    }

    if (
      !userFirstName ||
      !userSurname ||
      !userEmail ||
      !userPassword ||
      !userConfirmPassword
    ) {
      setError("All fields are required");
      triggerShake();
      setIsValidating(false);
      return;
    }
    if (!userEmail.includes("@")) {
      setError("Please enter a valid email address");
      triggerShake();
      setIsValidating(false);
      return;
    } else if (userPassword.length < 6) {
      setError("Password must be at least 6 characters");
      triggerShake();
      setIsValidating(false);
      return;
    } else if (userPassword !== userConfirmPassword) {
      setError("Passwords do not match");
      triggerShake();
      setIsValidating(false);
      return;
    } else if (!userDateOfBirth) {
      setError("Please select your date of birth");
      triggerShake();
      setIsValidating(false);
      return;
    } else if (!userGenderID) {
      setError("Please select your gender");
      triggerShake();
      setIsValidating(false);
      return;
    } else {
      setError("");
      setLoading(true);
    }

    try {
      let data = JSON.stringify({
        userFirstName,
        userSurname,
        userEmail,
        userPassword,
        userDateOfBirth,
        userGender: userGenderID === 1 ? "Male" : "Female",
        userRoleID: 1,
        userAccountApproved: 1,
      });

      await axios
        .post(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/users/signup`,
          data,
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        )
        .then(async (response) => {
          if (response.data.status === true) {
            toast.show(`🎉 Sign Up Successful!`, {
              type: "success",
              placement: "top",
            });
            await login_(userEmail, userPassword);
          }
        })
        .catch((error) => {
          console.log(error.response.data); // server ka error message
          console.log(error.response.status);
          console.log(error.config);
          if (error.response.data.msg) {
            console.log("errorsignup", error);
            toast.show(`❌ ${error.response.data.msg}`, {
              type: "danger",
              placement: "top",
            });
          } else if (error.response.data.data.message) {
            toast.show(`❌ ${error.response.data.message}`, {
              type: "danger",
              placement: "top",
            });
          } else {
            toast.show(`❌ ${error.toString()}`, {
              type: "danger",
              placement: "top",
            });
          }
          setIsValidating(false);
        });
    } catch (err) {
      console.log("Error:", err);
    }
    setIsValidating(false);
    setLoading(false);
  };

  const login_ = async (email, password) => {
    let data = JSON.stringify({ userEmail: email, userPassword: password });

    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/users/login`,
        data,
        { headers: { "Content-Type": "application/json" } },
      );

      if (response.data.status === true) {
        const { accessToken, refreshToken, UserData } = response.data.data;

        await AsyncStorage.setItem("Authenticated", "true");
        await AsyncStorage.setItem("accessToken", accessToken);
        await AsyncStorage.setItem("refreshToken", refreshToken);
        await AsyncStorage.setItem("User", JSON.stringify(UserData));

        dispatch(
          login({
            ...UserData,
            accessToken,
            refreshToken,
          }),
        );

        router.replace("./home");
      } else {
        toast.show(`❌ Login Failed!`, { type: "danger", placement: "top" });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsValidating(false);
    }
  };

  const getCurrentAge = () => {
    if (!selectedYear) return null;
    return new Date().getFullYear() - selectedYear;
  };

  useEffect(() => {
    // Reset selectedDay when month or year changes
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    if (selectedDay && selectedDay > daysInMonth) {
      setSelectedDay(null);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedDay && selectedMonth !== null && selectedYear) {
      const formattedDate = `${selectedYear}-${(
        "0" +
        (selectedMonth + 1)
      ).slice(-2)}-${("0" + selectedDay).slice(-2)}`;
      setUserDateOfBirth(formattedDate);
    }
  }, [selectedDay, selectedMonth, selectedYear]);

  return (
    <LinearGradient
      colors={["#fef7ed", "#fff5f5", "#fdf2f8"]}
      style={styles.container}
    >
      {/* Decorative circles */}
      <Animated.View
        style={[
          styles.circle,
          { backgroundColor: themeColors.color1, top: -30, right: -30 },
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          { backgroundColor: themeColors.color2, bottom: -40, left: -20 },
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          { backgroundColor: themeColors.color3, top: "30%", left: "10%" },
        ]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <StatusBar barStyle="dark-content" backgroundColor={"#fff"} />
          <Animated.View
            style={[
              styles.formBox,
              { transform: [{ translateX: shakeAnimation }] },
            ]}
          >
            <View style={styles.header}>
              <LinearGradient
                colors={[themeColors.color2, themeColors.color4]}
                style={styles.iconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <FontistoIcons name="person" size={28} color="#fff" />
              </LinearGradient>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join our community today</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.nameContainer}>
                <View
                  style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}
                >
                  <Text style={styles.inputLabel}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="John"
                    placeholderTextColor="#aaa"
                    value={userFirstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Doe"
                    placeholderTextColor="#aaa"
                    value={userSurname}
                    onChangeText={setSurname}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor="#aaa"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={userEmail}
                  onChangeText={setUserEmail}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder=""
                    placeholderTextColor="#aaa"
                    secureTextEntry={!showPassword}
                    value={userPassword}
                    onChangeText={(text) => setUserPassword(text.trim())}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#aaa"
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.passwordHint}>
                  Must be at least 6 characters
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder=""
                    placeholderTextColor="#aaa"
                    secureTextEntry={!showConfirmPassword}
                    value={userConfirmPassword}
                    onChangeText={(text) => setUserConfirmPassword(text.trim())}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#aaa"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <TouchableOpacity
                  onPress={() => setShowCalendar(true)}
                  style={styles.dateInput}
                >
                  <Text
                    style={
                      userDateOfBirth ? styles.dateText : styles.datePlaceholder
                    }
                  >
                    {userDateOfBirth || "YYYY-MM-dd"}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={themeColors.color4}
                  />
                </TouchableOpacity>
                {selectedYear && (
                  <Text style={styles.ageText}>
                    You'll be {getCurrentAge()} years old
                  </Text>
                )}
              </View>

              <View style={styles.genderContainer}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.genderButtons}>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      userGenderID === 1 && styles.genderButtonSelected,
                    ]}
                    onPress={() => setUserGenderID(1)}
                  >
                    <Ionicons
                      name="male"
                      size={24}
                      color={userGenderID === 1 ? "#fff" : themeColors.color2}
                    />
                    <Text
                      style={[
                        styles.genderButtonText,
                        userGenderID === 1 && styles.genderButtonTextSelected,
                      ]}
                    >
                      Male
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      userGenderID === 2 && styles.genderButtonSelected,
                    ]}
                    onPress={() => setUserGenderID(2)}
                  >
                    <Ionicons
                      name="female"
                      size={24}
                      color={userGenderID === 2 ? "#fff" : themeColors.color2}
                    />
                    <Text
                      style={[
                        styles.genderButtonText,
                        userGenderID === 2 && styles.genderButtonTextSelected,
                      ]}
                    >
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {err && (
                <View style={styles.errorContainer}>
                  <Ionicons name="warning" size={16} color="#dc2626" />
                  <Text style={styles.errorText}>{err}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.signUpButton,
                  (loading || isValidating) && styles.signUpButtonDisabled,
                ]}
                onPress={handleSignUp}
                disabled={loading || isValidating}
              >
                <LinearGradient
                  colors={[themeColors.color2, themeColors.color4]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading || isValidating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.signUpButtonText}>Create Account</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={() => router.push("../pages/login")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.loginLink}>Log in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Calendar Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCalendar}
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowCalendar(false)}
          />
          <View style={styles.modalContainer}>
            <View style={styles.calendarContainer}>
              <LinearGradient
                colors={[themeColors.color2, themeColors.color4]}
                style={styles.modalHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.modalTitle}>Select Date of Birth</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowCalendar(false)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </LinearGradient>

              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>Month</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.scrollItem,
                        selectedMonth === i && styles.selectedScrollItem,
                      ]}
                      onPress={() => setSelectedMonth(i)}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={
                          selectedMonth === i
                            ? [themeColors.color2, themeColors.color4]
                            : ["#f5f5f5", "#f5f5f5"]
                        }
                        style={styles.scrollItemGradient}
                      >
                        <Text
                          style={
                            selectedMonth === i
                              ? styles.selectedScrollText
                              : styles.scrollText
                          }
                        >
                          {new Date(2000, i, 1).toLocaleString("default", {
                            month: "short",
                          })}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>Year</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {Array.from({ length: 39 }).map((_, i) => {
                    const year = 2018 - i; // Start from 2018 and go backwards
                    if (year >= 1980) {
                      return (
                        <TouchableOpacity
                          key={year}
                          style={[
                            styles.scrollItem,
                            selectedYear === year && styles.selectedScrollItem,
                          ]}
                          onPress={() => setSelectedYear(year)}
                          activeOpacity={0.7}
                        >
                          <LinearGradient
                            colors={
                              selectedYear === year
                                ? [themeColors.color2, themeColors.color4]
                                : ["#f5f5f5", "#f5f5f5"]
                            }
                            style={styles.scrollItemGradient}
                          >
                            <Text
                              style={
                                selectedYear === year
                                  ? styles.selectedScrollText
                                  : styles.scrollText
                              }
                            >
                              {year}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      );
                    }
                    return null;
                  })}
                </ScrollView>
              </View>

              <View style={styles.daySection}>
                <Text style={styles.selectorLabel}>Day</Text>
                <View style={styles.calendarGrid}>
                  {Array.from({
                    length: new Date(
                      selectedYear,
                      selectedMonth + 1,
                      0,
                    ).getDate(),
                  }).map((_, i) => {
                    const day = i + 1;
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayButton,
                          selectedDay === day && styles.daySelected,
                        ]}
                        onPress={() => setSelectedDay(day)}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={
                            selectedDay === day
                              ? [themeColors.color2, themeColors.color4]
                              : ["#f0f0f0", "#fafafa"]
                          }
                          style={styles.dayButtonGradient}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              selectedDay === day && styles.selectedDayText,
                            ]}
                          >
                            {day}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setShowCalendar(false)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[themeColors.color2, themeColors.color4]}
                  style={styles.doneButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.modalDoneBtnText}>Confirm Date</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  circle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  formBox: {
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderRadius: 30,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: themeColors.color4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  formContainer: {
    gap: 16,
  },
  nameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 15,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: "#ffffff",
    color: "#111827",
  },
  dateInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 15,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: {
    color: "#111827",
    fontSize: 15,
  },
  datePlaceholder: {
    color: "#aaa",
    fontSize: 15,
  },
  ageText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    marginLeft: 4,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 15,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 4,
  },
  passwordHint: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    marginLeft: 4,
  },
  genderContainer: {
    marginBottom: 8,
  },
  genderButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  genderButtonSelected: {
    backgroundColor: themeColors.color2,
    borderColor: themeColors.color2,
  },
  genderButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: themeColors.color2,
  },
  genderButtonTextSelected: {
    color: "#ffffff",
  },
  errorContainer: {
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#fecaca",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "500",
  },
  signUpButton: {
    borderRadius: 15,
    overflow: "hidden",
    marginTop: 8,
    shadowColor: themeColors.color4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  signUpButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  loginText: {
    fontSize: 14,
    color: "#6b7280",
  },
  loginLink: {
    fontSize: 14,
    color: themeColors.color2,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "100%",
    maxHeight: "80%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  calendarContainer: {
    backgroundColor: "#ffffff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  selectorSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 8,
  },
  scrollItem: {
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  scrollItemGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 70,
    alignItems: "center",
    borderRadius: 12,
  },
  selectedScrollItem: {
    shadowColor: themeColors.color4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  selectedScrollText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
  },
  daySection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  dayButton: {
    width: "13%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  dayButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  daySelected: {
    shadowColor: themeColors.color4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  selectedDayText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  modalDoneBtn: {
    margin: 20,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: themeColors.color4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  doneButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  modalDoneBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
