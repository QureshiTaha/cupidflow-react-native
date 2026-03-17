import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Footer from "../components/footer";
import Header from "../components/header";
import VideoCards from "../components/videoCards";
import { themeColors } from "../../app/const/color";

const { width } = Dimensions.get("window");

export default function OtherProfileScreen() {
  const router = useRouter();
  const UserItem = useLocalSearchParams();

  const [isFollowing, setIsFollowing] = useState(false);
  const [profileUserName, setProfileUserName] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [currentUserID, setCurrentUserID] = useState(null);
  const [userGender, setUserGender] = useState(null);
  const [creatingChat, setCreatingChat] = useState(false);

  const followToUserID =
    UserItem?.userID ||
    (UserItem?.userData && JSON.parse(UserItem.userData)?.userID);

  useEffect(() => {
    if (!followToUserID) return;

    const loadProfile = async () => {
      try {
        const user = await AsyncStorage.getItem("User");
        if (user) {
          const parsed = JSON.parse(user);
          setCurrentUserID(parsed.userID);
          setProfileUserName(`${parsed.userFirstName} ${parsed.userSurname}`);
          setUserGender(UserItem.gender || parsed.userGender);

          await fetchFollowStatus(parsed.userID, followToUserID);
        }

        const data =
          UserItem?.userData &&
          typeof UserItem.userData === "string" &&
          JSON.parse(UserItem.userData).totalFollowers
            ? JSON.parse(UserItem.userData)
            : await fetchUserFromAPI(followToUserID);
        if (data) {
          setProfileData({
            userID: data.userID,
            username: `${data.userFirstName} ${data.userSurname}`,
            profileImage: data.profilePic
              ? `${process.env.EXPO_PUBLIC_API_BASE_URL}${data.profilePic}`
              : `set-default-${data.userGender}`,
            posts: data.posts || 0,
            followers: data.totalFollowers || 0,
            following: data.followings || 0,
            bio: data.userBio || "✨ No bio available",
            userEmail: data.userEmail,
          });
        }
      } catch (err) {
        console.error("Profile load error:", err);
      }
    };

    loadProfile();
  }, []);

  const fetchUserFromAPI = async (userID) => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/users/by-userID/${userID}`
      );
      const json = await res.json();
      return json.data[0];
    } catch (err) {
      console.error("Fetch user API error:", err);
      return null;
    }
  };

  const fetchFollowStatus = async (fromID, toID) => {
    try {
      const { data } = await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/follow/checkFollow`,
        { followBy: fromID, followTo: toID }
      );
      setIsFollowing(data.isFollowing);
    } catch (err) {
      console.error("Check follow error:", err?.response?.data || err.message);
    }
  };

  const followUser = async () => {
    try {
      await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/follow/follow`,
        { followBy: currentUserID, followTo: followToUserID }
      );
      setIsFollowing(true);
    } catch (err) {
      console.error("Follow error:", err.response);
    }
  };

  const unfollowUser = async () => {
    try {
      await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/follow/unfollow`,
        { followBy: currentUserID, followTo: followToUserID }
      );
      setIsFollowing(false);
    } catch (err) {
      console.error("Unfollow error:", err.response);
    }
  };

  const createNewChat = async () => {
    try {
      setCreatingChat(true);
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/chats/new-chat`,
        {
          chatType: "private",
          createdBy: currentUserID,
          chatWith: profileData.userID,
        }
      );

      const chatData = response.data.success
        ? response.data.data[0]
        : response.data.data?.[0];

      router.push({
        pathname: "../pages/ChatsScreen",
        params: {
          chatID: chatData.chatID,
          receiverID: profileData.userID,
          receiverName: profileData.username,
          receiverProfilePic: profileData.profileImage,
          chatType: "private",
        },
      });
    } catch (error) {
      console.log("Error creating chat:", error);
      if (error.response?.data?.data) {
        router.push({
          pathname: "../pages/ChatsScreen",
          params: {
            chatID: error.response.data.data[0].chatID,
            receiverID: profileData.userID,
            receiverName: profileData.username,
            receiverProfilePic: profileData.profileImage,
            chatType: "private",
          },
        });
      }
    } finally {
      setCreatingChat(false);
    }
  };

  if (!profileData) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={themeColors.color2} />
        <Text style={styles.loaderText}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <>
      <Header />
      <LinearGradient
        colors={["#ffffff", "#fff5f7"]}
        style={styles.gradientContainer}
      >
        <View style={styles.container}>
          {/* Profile Header */}
          <View style={styles.profileContainer}>
            <Image
              source={
                profileData.profileImage.startsWith("set-default")
                  ? profileData.profileImage === "set-default-2"
                    ? require("../../assets/images/profile.jpg")
                    : require("../../assets/images/profile.jpg")
                  : { uri: profileData.profileImage }
              }
              style={[
                styles.profileImage,
                {
                  borderColor: isFollowing ? themeColors.color1 : themeColors.color2,
                },
              ]}
            />

            <View style={styles.statsContainer}>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statNumber}>{profileData.posts}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() =>
                  router.push({
                    pathname: "../pages/followers",
                    params: { userID: profileData.userID },
                  })
                }
              >
                <Text style={styles.statNumber}>{profileData.followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() =>
                  router.push({
                    pathname: "../pages/UserFollowing",
                    params: { userID: profileData.userID },
                  })
                }
              >
                <Text style={styles.statNumber}>{profileData.following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.bioContainer}>
            <Text style={styles.username}>{profileData.username}</Text>
            <Text style={styles.bio}>{profileData.bio}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.profileButtonContainer}>
            <TouchableOpacity
              onPress={isFollowing ? unfollowUser : followUser}
              style={styles.buttonWrapper}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  isFollowing
                    ? ["#ff6b6b", "#ee5a5a"] 
                    : [themeColors.color2, themeColors.color4]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.buttonText}>
                  {isFollowing ? "Unfollow" : "Follow"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={createNewChat}
              style={styles.buttonWrapper}
              disabled={creatingChat}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[themeColors.color1, themeColors.color2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                {creatingChat ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Message</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <LinearGradient
              colors={[themeColors.color1, themeColors.color2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dividerLine}
            />
            <Text style={styles.dividerText}>Posts</Text>
            <LinearGradient
              colors={[themeColors.color2, themeColors.color1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dividerLine}
            />
          </View>

          {/* Video Grid */}
          <View style={styles.containerVideo}>
            <VideoCards userID={profileData.userID} />
          </View>
        </View>
      </LinearGradient>
      <Footer />
    </>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loaderText: {
    marginTop: 10,
    color: themeColors.color2,
    fontSize: 16,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    marginRight: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flex: 1,
  },
  statItem: {
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 70,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  username: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  bioContainer: {
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  bio: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  profileButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 20,
  },
  buttonWrapper: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: themeColors.color4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  gradientButton: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    borderRadius: 2,
  },
  dividerText: {
    width: 70,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
  },
  containerVideo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
});