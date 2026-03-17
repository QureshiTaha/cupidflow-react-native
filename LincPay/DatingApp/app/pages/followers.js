import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";

export default function Followers() {
  const { userID } = useLocalSearchParams();
  const [user, setUser] = useState({});
  const [followersData, setFollowersData] = useState([]);
  const [totalFollowers, setTotalFollowers] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const User = await AsyncStorage.getItem("User");
      setUser(JSON.parse(User));
      fetchFollowersData(JSON.parse(User), 1, true);
    };
    getUser();
  }, []);

  const fetchFollowersData = async (user, pageNum = 1, initialLoad = false) => {
    if (initialLoad) {
      setIsLoading(true);
    } else if (pageNum > 1) {
      setLoadingMore(true);
    }

    try {
      const response = await axios.get(
        `${
          process.env.EXPO_PUBLIC_API_BASE_URL
        }/api/v1/follow/getFollowersList/${
          userID ? userID : user.userID
        }?page=${pageNum}&limit=10`
      );

      if (response.data.status === true) {
        let userData = [];
        let metadata = { haveMore: false, totalCount: 0 };

        // Check if the last item contains metadata
        if (response.data.data.length > 0) {
          const possibleMeta =
            response.data.data[response.data.data.length - 1];

          if (
            possibleMeta &&
            typeof possibleMeta === "object" &&
            "haveMore" in possibleMeta &&
            "totalCount" in possibleMeta
          ) {
            metadata = {
              haveMore: possibleMeta.haveMore,
              totalCount: possibleMeta.totalCount,
            };
            userData = response.data.data; // only strip if it’s really metadata
          } else {
            userData = response.data.data; // keep all followers
          }
        }

        if (pageNum === 1) {
          setFollowersData(userData);
        } else {
          setFollowersData((prevData) => [...prevData, ...userData]);
        }

        if (metadata.totalCount > 0) {
          setTotalFollowers(metadata.totalCount);
        }

        setHasMore(metadata.haveMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching followers data:", error);
      setHasMore(false); // Stop trying to load more on error
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    setFollowersData([]);
    fetchFollowersData(user, 1, false);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore && !refreshing) {
      fetchFollowersData(user, page + 1, false);
    }
  };

  const filteredFollowers = followersData.filter((item) => {
    const fullName = `${item.userFirstName} ${item.userSurname}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const OpenUserProfile = (item) => {
    router.push({
      pathname: "../pages/OtherProfile",
      params: { userData: JSON.stringify(item) },
    });
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#e91e63" />
          <Text style={styles.footerText}>Loading more followers...</Text>
        </View>
      );
    }

    if (!hasMore && followersData.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <Text
            style={[styles.footerText, { color: "#333", fontWeight: "600" }]}
          >
            No more followers to load
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderFollowerItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.userCardTouch}
      onPress={() => OpenUserProfile(item)}
    >
      <View style={styles.userCard}>
        <View style={styles.avatarContainer}>
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
            style={[
              styles.avatar,
              { borderColor: item.isFollowing ? "#00bb00" : "#bb0000" },
            ]}
          />
        </View>

        <View style={styles.userInfo}>
          {item.isFollowing ? (
            <Text style={styles.followerText}>You Follow</Text>
          ) : null}
          <Text style={styles.username} numberOfLines={1}>
            {item.userFirstName +
              " " +
              (item.userSurname !== "undefined" ? item.userSurname : "")}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => createNewChat(item)}
          style={{ marginLeft: 10 }}
          disabled={creatingChat}
        >
          <View style={styles.actionButton}>
            {/* message */}
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={16}
              color="#000"
            />
            <Text style={styles.actionText}>Message</Text>
          </View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const createNewChat = async (item) => {
    try {
      setCreatingChat(true);
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/chats/new-chat`,
        {
          chatType: "private",
          createdBy: userID ? userID : user.userID,
          chatWith: item.userID,
        }
      );
      const chatData = response.data.success
        ? response.data.data[0]
        : response.data.data?.[0];
      router.push({
        pathname: "../pages/ChatsScreen",
        params: {
          chatID: chatData.chatID,
          receiverID: item.userID,
          receiverName: `${item.userFirstName} ${item.userSurname}`,
          receiverProfilePic: item.profilePic
            ? `${process.env.EXPO_PUBLIC_API_BASE_URL}${item.profilePic}`
            : null,
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
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Followers</Text>
          {totalFollowers > 0 && (
            <Text style={styles.followerCount}>{totalFollowers}</Text>
          )}
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#888"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search followers..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Followers List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e91e63" />
          <Text style={styles.loadingText}>Loading followers...</Text>
        </View>
      ) : filteredFollowers.length > 0 ? (
        <FlatList
          data={filteredFollowers}
          keyExtractor={(item, index) => `${item.userID}-${index}`}
          renderItem={renderFollowerItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#e91e63"]}
              tintColor="#e91e63"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="people-outline" size={48} color="#e0e0e0" />
          </View>
          <Text style={styles.emptyStateTitle}>No such followers found</Text>
          <Text style={styles.emptyStateText}>
            {searchQuery
              ? "No matches for your search"
              : "When someone follows you, they'll appear here"}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginRight: 8,
  },
  followerCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e91e63",
    backgroundColor: "#ffeef3",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  headerRight: {
    width: 32,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  userCardTouch: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 50,
    marginRight: 7,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#888",
    fontWeight: "600",
    fontSize: 18,
  },
  statusIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: "#333",
    fontSize: 17,
    fontWeight: "600",
  },
  followerText: {
    color: "#888",
    fontSize: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 12,
    color: "#888",
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  footerText: {
    marginLeft: 8,
    color: "#888",
    fontSize: 14,
  },
});
