import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  SafeAreaView,
  StyleSheet, 
  ActivityIndicator,
  Alert,
  Animated
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/MaterialIcons";

const NewChatScreen = () => {
  const router = useRouter();
  const [followers, setFollowers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [haveMore, setHaveMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  // const [creatingChat, setCreatingChat] = useState(false);
  const [loadingFollowers, setLoadingFollowers] = useState({});
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchData = async () => {
      const userData = await AsyncStorage.getItem("User");
      const parsedUser = JSON.parse(userData);
      setUserId(parsedUser.userID);
      await fetchFollowers(parsedUser.userID, 1);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    };
    fetchData();
  }, []);

  const fetchFollowers = async (userID, pageNumber) => {
    try {
      if (pageNumber === 1) setLoading(true);
      
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/follow/getFollowersList/${userID}`,
        {
          params: {
            page: pageNumber,
            limit: 10
          }
        }
      );

      if (response.data && response.data.status) {
        const newFollowers = response.data.data || [];
        const paginationInfo = response.data.pagination || {}; // Assuming your API returns pagination separately

        const cleanedFollowers = newFollowers.map((item) => ({
          ...item,
          name: `${item.userFirstName} ${item.userSurname}`,
          profileImageSource: getProfileImageSource(item)
        }));

        if (pageNumber === 1) {
          setFollowers(cleanedFollowers);
        } else {
          // Filter out any duplicates before adding
          setFollowers(prev => {
            const existingIds = prev.map(f => f.userID);
            const uniqueNewFollowers = cleanedFollowers.filter(
              f => !existingIds.includes(f.userID)
            );
            return [...prev, ...uniqueNewFollowers];
          });
        }

        setTotalCount(paginationInfo.totalCount || 0);
        setHaveMore(paginationInfo.hasNextPage || false);
      }
    } catch (error) {
      console.error("Error fetching followers:", error);
      if (pageNumber === 1) {
        Alert.alert("Error", "Failed to load followers");
      }
      setHaveMore(false);
    } finally {
      if (pageNumber === 1) setLoading(false);
      setLoadingMore(false);
    }
  };
  const loadMore = () => {
    if (loadingMore || !haveMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFollowers(userId, nextPage);
  };

  const getProfileImageSource = (follower) => {
    console.log("Follower data:", follower.profilePic);
    if (!follower.profilePic || follower.profilePic === "") {
      return follower.userGender === "1" 
        ? require("../../assets/images/profile-female.jpg")
        : require("../../assets/images/profile.jpg");
    }
    if (follower.profilePic.startsWith("set-default")) {
      return follower.profilePic === "set-default-2"
        ? require("../../assets/images/profile-female.jpg")
        : require("../../assets/images/profile.jpg");
    }
    const fullUrl = follower.profilePic.startsWith("http")
      ? follower.profilePic
      : `${process.env.EXPO_PUBLIC_API_BASE_URL}${follower.profilePic}`;
    return { uri: fullUrl };
  };

const createNewChat = async (createdBy, chatWith) => {
  try {
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/chats/new-chat`,
      {
        chatType: "private",
        createdBy,
        chatWith
      }
    );

    if (response.data.success) {
      return response.data.data[0]; 
    }
    throw new Error(response.data.message || "Failed to create chat");
  } catch (error) {
    console.log("Error creating chat:", error);
    if (error.response?.data?.data) {
      return error.response.data.data[0];
    }
    throw error;
  }
};

const startNewChat = async (follower) => {
  console.log("Starting chat with:", follower);
  
  try {
    setLoadingFollowers(prev => ({ ...prev, [follower.userID]: true }));
    const chat = await createNewChat(userId, follower.userID);
    
    router.push({
      pathname: "../pages/ChatsScreen",
      params: {
        chatID: chat.chatID,
        receiverID: follower.userID,
        receiverName: `${follower.userFirstName} ${follower.userSurname}`,
        receiverProfilePic: follower.profilePic?.startsWith("http")
          ? follower.profilePic
          : follower.profilePic
            ? `${process.env.EXPO_PUBLIC_API_BASE_URL}${follower.profilePic}`
            : follower.userGender === "1"
              ? require("../../assets/images/profile-female.jpg")
              : require("../../assets/images/profile.jpg"),
        chatType: "private",
      },
    });
  } catch (error) {
    Alert.alert("Error", error.message || "Failed to start chat");
  } finally {
    setLoadingFollowers(prev => ({ ...prev, [follower.userID]: false }));
  }
};

const renderItem = ({ item }) => (
  <Animated.View style={{ opacity: fadeAnim }}>
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => startNewChat(item)}
      disabled={loadingFollowers[item.userID]}
    >
      <Image
        source={item.profileImageSource}
        style={styles.avatar}
        onError={(e) => {
          console.log("Image load error:", e.nativeEvent.error);
          item.profileImageSource = require("../../assets/images/profile.jpg");
          setFollowers([...followers]);
        }}
      />

      <View style={styles.textContainer}>
        <Text style={styles.contactName}>
          {item.userFirstName} {item.userSurname}
        </Text>
        {item.userEmail && (
          <Text style={styles.contactEmail}>{item.userEmail}</Text>
        )}
      </View>
      {loadingFollowers[item.userID] && (
        <ActivityIndicator size="small" color="#c62828" />
      )}
    </TouchableOpacity>
  </Animated.View>
);
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#c62828" />
      </View>
    );
  }

  return (
    <>
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>New Chat</Text>
          {/* <Text style={styles.totalFollowers}>
            Total Followers: {totalCount}
          </Text> */}
        </View>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.container}>
        <FlatList
          data={followers}
          keyExtractor={(item, index) => `${item.userID}-${index}`}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.noData}>You don't have any followers yet</Text>
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: 10 }}>
                <ActivityIndicator size="small" color="#c62828" />
              </View>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  totalFollowers: {
    fontSize: 14,
    marginTop: 4,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFF",
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  contactEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  noData: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
  },
});

export default NewChatScreen;