import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Footer from "../components/footer";
import Header from "../components/header";
import VideoCards from "../components/videoCards";

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
          chatWith: profileData.userID
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
        <ActivityIndicator size="large" color="#000" />
        <Text>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <>
      <Header />
      <View style={styles.container}>
        <View style={styles.profileContainer}>
          <Image
            source={
              profileData.profileImage.startsWith("set-default")
                ? profileData.profileImage === "set-default-2"
                  ? require("../../assets/images/profile-female.jpg")
                  : require("../../assets/images/profile.jpg")
                : { uri: profileData.profileImage }
            }
            style={[styles.profileImage, { borderColor: isFollowing ? "#00bb00" : "#bb0000", }]}
          />

          <View style={styles.statsContainer}>
            <TouchableOpacity>
              <Text style={styles.statsText}>
                {profileData.posts}
                {"\n"}Posts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "../pages/followers",
                  params: { userID: profileData.userID },
                })
              }
            >
              <Text style={styles.statsText}>
                {profileData.followers}
                {"\n"}Followers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "../pages/UserFollowing",
                  params: { userID: profileData.userID },
                })
              }
            >
              <Text style={styles.statsText}>
                {profileData.following}
                {"\n"}Following
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bioContainer}>
          <Text style={styles.username}>{profileData.username}</Text>
          <Text style={styles.bio}>{profileData.bio}</Text>
        </View>

        <View style={styles.profileButtonContainer}>
          <TouchableOpacity
            onPress={isFollowing ? unfollowUser : followUser}
            style={styles.followButton}
          >
            <Text style={styles.buttonText}>
              {isFollowing ? "Unfollow" : "Follow"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={createNewChat}
            style={styles.messageButton}
            disabled={creatingChat}
          >
            {creatingChat ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonTextt}>Message</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Posts</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.containerVideo}>
          <VideoCards userID={profileData.userID} />
        </View>
      </View>
      <Footer />
    </>
  );
}

const styles = StyleSheet.create({
  containerVideo: {
    // justifyContent: "center",
    // alignItems: "center",
    // height: "60%",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 20,
    borderWidth: 3,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flex: 1,
  },
  statsText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "left",
  },
  bioContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    marginTop: 10,
  },
  bio: {
    fontSize: 14,
    textAlign: "left",
    lineHeight: 20,
    marginTop: 4,
  },
  profileButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  followButton: {
    backgroundColor: "#e91e63",
    borderColor: "#e91e63",
    borderWidth: 2,
    padding: 10,
    borderRadius: 25,
    width: 150,
    alignItems: "center",
  },
  messageButton: {
    backgroundColor: "transparent",
    padding: 10,
    borderColor: "#e91e63",
    borderWidth: 2,
    borderRadius: 25,
    width: 150,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  buttonTextt: {
    color: "#e91e63",
    fontWeight: "bold",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "black",
  },
  dividerText: {
    width: 70,
    textAlign: "center",
  },
});