import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import Header from "../components/header";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Footer from "../components/footer";
import axios from "axios";
import { useRouter } from "expo-router";

export default function FollowingScreen() {
  const [user, setUser] = useState({});
  const [followingData, setFollowingData] = useState([]);
  const router = useRouter();
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [accessToken, setAccessToken] = useState(""); // if needed
  const [isLoading, setIsLoading] = useState(true);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(true);

  useMemo(() => {
    const getUser = async () => {
      const User = await AsyncStorage.getItem("User");
      const Token = await AsyncStorage.getItem("accessToken");

      const parsedUser = JSON.parse(User);
      setUser(parsedUser);
      setAccessToken(Token);
      showFollowers(parsedUser);

      // If no followers after fetch, then fetch suggestions
      setTimeout(() => {
        if (followingData.length === 0) {
          fetchSuggestedUsers(Token, parsedUser.userID);
        }
      }, 1000); // slight delay to ensure followingData is updated
    };

    getUser();
  }, []);

  const showFollowers = async (user) => {
    console.log("Fetching following data for user:", user.userID);
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/follow/getFollowingList/${user.userID}`
      );
      if (response.data.status === true) {
        setFollowingData(response.data.data);
        setIsLoading(false);
      } else {
        setFollowingData([]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching following data:", error.response.data);
    }
  };

  const OpenUserProfile = (item) => {
    router.push({
      pathname: "../pages/OtherProfile",
      params: { userData: JSON.stringify(item) },
    });
  };

  const fetchSuggestedUsers = async (token, currentUserID) => {
    setIsSuggestionsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/users/allUsers`,
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
      setShowSuggestions(true);
      setIsSuggestionsLoading(false);
    } catch (error) {
      console.log("Suggested user fetch error:", error);
    }
  };

  const VideoList = () => {
    return (
      <View>
        {/* My Followings Section */}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text>Loading Followings...</Text>
          </View>
        ) : followingData.length === 0 ? (
          <Text style={styles.textMsg}>You don't follow anyone</Text>
        ) : (
          <>
            <Text style={styles.textMsg}>My Followings</Text>
            <View style={styles.cardContainer}>
              <FlatList
                data={followingData}
                keyExtractor={(item) => item.id?.toString()}
                numColumns={3}
                renderItem={({ item }) => (
                  <View style={styles.card}>
                    <TouchableOpacity onPress={() => OpenUserProfile(item)}>
                      <Image
                        source={
                          item.profilePic
                            ? {
                                uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${item.profilePic}`,
                              }
                            : item.userGender == 2
                            ? require("../../assets/images/profile-female.jpg")
                            : require("../../assets/images/profile.jpg")
                        }
                        style={styles.profileImage} // ✅ use proper circular style
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          </>
        )}

        {/* Suggested Users Section */}
        {showSuggestions &&
          (isSuggestionsLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#000" />
              <Text>Loading Suggestions...</Text>
            </View>
          ) : suggestedUsers.length > 0 ? (
            <>
              <Text style={styles.textMsg}>Suggested Users</Text>
              <View style={styles.cardContainer}>
                <FlatList
                  data={suggestedUsers}
                  keyExtractor={(item) => item.id?.toString()}
                  numColumns={3}
                  renderItem={({ item }) => (
                    <View style={styles.card}>
                      <TouchableOpacity onPress={() => OpenUserProfile(item)}>
                        <Image
                          source={
                            item.profilePic
                              ? {
                                  uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${item.profilePic}`,
                                }
                              : item.userGender == 2
                              ? require("../../assets/images/profile-female.jpg")
                              : require("../../assets/images/profile.jpg")
                          }
                          style={styles.profileImage}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              </View>
            </>
          ) : null)}
      </View>
    );
  };

  return (
    <>
      <Header />
      <FlatList
        data={[{ key: "VideoList" }]} // Placeholder data
        renderItem={() => <VideoList />}
        keyExtractor={(item) => item.key}
      />
      <Footer />
    </>
  );
}

const styles = StyleSheet.create({
  containerTop: {
    flex: 1,
    backgroundColor: "#fff",
  },

  icon: {
    justifyContent: "center",
    alignItems: "center",
    fontSize: 100,
    paddingVertical: 20,
  },
  button: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  followingText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#222",
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 22,
    fontWeight: "600",
    color: "#111",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingBottom: 3,
    backgroundColor: "#f3f3f3",
  },
  card: {
    width: 120,
    height: 120,
    padding: 5,
    borderRadius: 10,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  textMsg: {
    fontSize: 20,
    fontWeight: "500",
    color: "#333",
    marginVertical: 30,
    marginLeft: 30,
  },
  loaderContainer: {
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
    color: "#000",
  },
  profileImage: {
  width: 100,
  height: 100,
  borderRadius: 50, // half of width/height
  resizeMode: "cover",
  alignSelf: "center",
  borderWidth: 2,
  borderColor: "#ddd",

},

});
