import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";

export default function Followers() {
  const { userID } = useLocalSearchParams();

  const [followersData, setFollowersData] = useState([]);
  const [totalFollowers, setTotalFollowers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const User = await AsyncStorage.getItem("User");
      const parsedUser = JSON.parse(User);
      fetchFollowersData(parsedUser);
    };
    getUser();
  }, []);

  const fetchFollowersData = async (user) => {
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/follow/getFollowersList/${
          userID ? userID : user.userID
        }`
      );

      if (response.data.status === true) {
        const followerList = response.data.data;

        setFollowersData(followerList);

        if (
          followerList.length &&
          followerList[followerList.length - 1].totalCount
        ) {
          setTotalFollowers(followerList[followerList.length - 1].totalCount);
        }
      }
    } catch (error) {
      console.log("Error fetching followers:", error);
    } finally {
      setLoading(false);
    }
  };

  const openUserProfile = (item) => {
    router.push({
      pathname: "../pages/OtherProfile",
      params: { userData: JSON.stringify(item) },
    });
  };

  const renderFollower = ({ item }) => {
    if (!item.userID) return null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openUserProfile(item)}
      >
        <Image
          source={
            item.profilePic
              ? {
                  uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${item.profilePic}`,
                }
              : require("../../assets/images/profile.jpg")
          }
          style={styles.avatar}
        />

        <View style={styles.info}>
          <Text style={styles.name}>
            {item.userFirstName} {item.userSurname}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Followers</Text>

        <View style={{ width: 24 }} />
      </View>

      {/* Total Followers */}
      <Text style={styles.totalText}>{totalFollowers} Followers</Text>

      {/* Loading */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#e91e63" />
        </View>
      ) : followersData.length ? (
        <FlatList
          data={followersData}
          keyExtractor={(item, index) => `${item.userID}-${index}`}
          renderItem={renderFollower}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      ) : (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={50} color="#bbb" />
          <Text style={styles.emptyText}>No followers yet</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    paddingHorizontal: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },

  totalText: {
    textAlign: "center",
    marginBottom: 15,
    color: "#777",
    fontSize: 14,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },

  info: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    marginTop: 10,
    color: "#888",
    fontSize: 14,
  },
});