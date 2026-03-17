import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Keyboard,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/header";
import Footer from "../components/footer";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { myConsole } from "../utils/myConsole";

const { width } = Dimensions.get("window");

// Theme colors (same as footer for consistency)
const themeColors = {
  color1: "#f38ea8",
  color2: "#ef7cca",
  color3: "#f4b595",
  color4: "#8f6adf",
};

export default function ExploreScreen() {
  const [searchText, setSearchText] = useState("");
  const [database, setDatabase] = useState([]);
  const [currentUserID, setCurrentUserID] = useState(null);
  const [accessToken, setAccessToken] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const debounceTimeout = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const User = await AsyncStorage.getItem("User");
      const Token = await AsyncStorage.getItem("accessToken");

      const parsedUser = JSON.parse(User);
      setCurrentUserID(parsedUser.userID);
      setAccessToken(Token);

      // Simulate followers check; you may replace this with actual logic
      const followingData = []; // Assume no followers
      if (followingData.length === 0) {
        fetchSuggestedUsers(Token, parsedUser.userID);
      }
    };

    getUser();
  }, []);

  const fetchUsers = async (searchTerm) => {
    if (!searchTerm) {
      setShowSearch(false);
      setDatabase([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/users/allUsers?search=${searchTerm}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const users = response.data.data.filter(
        (user) => user.userID !== currentUserID
      );
      setDatabase(users);
      setShowSearch(true);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (text) => {
    setSearchText(text);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      if (text.length >= 1) {
        fetchUsers(text);
      } else {
        setShowSearch(false);
        setDatabase([]);
      }
    }, 500);
  };

  const clearSearch = () => {
    setSearchText("");
    setShowSearch(false);
    setDatabase([]);
    Keyboard.dismiss();
  };

  const openUserProfile = (item) => {
    router.push({
      pathname: "../pages/OtherProfile",
      params: { userData: JSON.stringify(item) },
    });
  };

  const fetchSuggestedUsers = async (token, currentUserID) => {
    setIsSuggestionsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/users/allUsers?page=1&limit=10&sort=latest`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const allUsers = response.data.data;
      const filtered = allUsers.filter((item) => item.userID !== currentUserID);

      setSuggestedUsers(filtered);
    } catch (error) {
      console.log("Suggested user fetch error:", error);
    } finally {
      setIsSuggestionsLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#ffffff", "#fff5f7"]} // subtle gradient from white to light pink
        style={styles.gradientContainer}
      >
        <View style={styles.container}>
          <Header />
          <View style={styles.mainContent}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color={themeColors.color2}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by username"
                  placeholderTextColor="#aaa"
                  value={searchText}
                  onChangeText={handleSearchChange}
                />
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={20} color={themeColors.color2} />
                  </TouchableOpacity>
                )}
              </View>
              {loading && (
                <ActivityIndicator size="small" color={themeColors.color2} style={styles.loading} />
              )}
            </View>

            {/* Content */}
            <View style={styles.content}>
              {showSearch ? (
                <FlatList
                  data={database}
                  keyExtractor={(item) => item.id || item.userID.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => openUserProfile(item)}
                      style={styles.searchItem}
                      activeOpacity={0.7}
                    >
                      <View style={styles.searchItemContent}>
                        <Image
                          source={
                            item.profilePic
                              ? { uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${item.profilePic}` }
                              : item.userGender == 2
                              ? require("../../assets/images/profile-female.jpg")
                              : require("../../assets/images/profile.jpg")
                          }
                          style={styles.searchAvatar}
                        />
                        <View style={styles.searchTextContainer}>
                          <Text style={styles.searchName}>
                            {item.userFirstName} {item.userSurname}
                          </Text>
                          <Text style={styles.searchUsername}>@{item.username || "user"}</Text>
                        </View>
                      </View>
                      <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc" />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    loading ? (
                      <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={themeColors.color2} />
                      </View>
                    ) : (
                      <View style={styles.noResultsContainer}>
                        <Ionicons name="search" size={50} color="#ccc" />
                        <Text style={styles.noResultsText}>No users found</Text>
                        <Text style={styles.noResultsSubText}>Try a different search term</Text>
                      </View>
                    )
                  }
                  contentContainerStyle={database.length === 0 && { flex: 1 }}
                />
              ) : (
                <ScrollView
                  style={styles.suggestionsScrollView}
                  contentContainerStyle={styles.suggestionsContent}
                  showsVerticalScrollIndicator={false}
                >
                  {isSuggestionsLoading ? (
                    <View style={styles.loaderContainer}>
                      <ActivityIndicator size="large" color={themeColors.color2} />
                      <Text style={styles.loadingText}>Loading suggestions...</Text>
                    </View>
                  ) : (
                    <View style={styles.suggestionsContainer}>
                      <LinearGradient
                        colors={[themeColors.color2, themeColors.color4]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.titleGradient}
                      >
                        <Text style={styles.sectionTitle}>Discover People</Text>
                      </LinearGradient>
                      <Text style={styles.sectionSubtitle}>
                        Connect with people you may know
                      </Text>

                      <View style={styles.cardContainer}>
                        {suggestedUsers.map((item) => (
                          <TouchableOpacity
                            key={item.userID}
                            style={styles.userCard}
                            onPress={() => openUserProfile(item)}
                            activeOpacity={0.8}
                          >
                            <Image
                              source={
                                item.profilePic
                                  ? { uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${item.profilePic}` }
                                  : item.userGender == 2
                                  ? require("../../assets/images/profile-female.jpg")
                                  : require("../../assets/images/profile.jpg")
                              }
                              style={styles.userImage}
                            />
                            <Text style={styles.userName} numberOfLines={1}>
                              {item.userFirstName} {item.userSurname}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </View>

          {/* Footer - hidden when keyboard is visible */}
          {!isKeyboardVisible && <Footer />}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff", // fallback
  },
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent", // make container transparent to show gradient
  },
  mainContent: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    marginTop: 20,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(239, 124, 202, 0.2)", // light border matching theme
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 0,
  },
  clearButton: {
    padding: 5,
  },
  loading: {
    marginLeft: 10,
  },
  searchItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  searchItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: themeColors.color2,
  },
  searchTextContainer: {
    marginLeft: 15,
  },
  searchName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  searchUsername: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    flex: 1,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#555",
    marginTop: 15,
  },
  noResultsSubText: {
    fontSize: 14,
    color: "#888",
    marginTop: 5,
  },
  suggestionsContainer: {
    padding: 20,
    paddingBottom: 80, // extra space for footer
  },
  suggestionsContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  suggestionsScrollView: {
    flex: 1,
  },
  titleGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignSelf: "center",
    marginBottom: 10,
    shadowColor: themeColors.color4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  userCard: {
    width: width / 2 - 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(239, 124, 202, 0.1)",
  },
  userImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: themeColors.color2,
    marginBottom: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 2,
  },
  loaderContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    flex: 1,
  },
  loadingText: {
    marginTop: 10,
    color: "#888",
  },
});