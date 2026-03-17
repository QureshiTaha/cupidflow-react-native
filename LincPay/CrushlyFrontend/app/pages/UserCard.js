import React, { useState, useEffect, useRef, useCallback, use } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "react-native-toast-notifications";
import Icon from "react-native-vector-icons/MaterialIcons";
import Footer from "../components/footer";
import Header from "../components/header";
import { useSelector } from "react-redux";
import FastImage from 'react-native-fast-image';
import { useSocket } from '../services/SocketContext';

const { width, height } = Dimensions.get("window");
const PRIMARY_COLOR = "#FF4D6D";

const UserCard = () => {
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [cachedNextUser, setCachedNextUser] = useState(null);
  const [token, setToken] = useState("");
  const [loggedInUserID, setLoggedInUserID] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const { socket, isConnected, setReload } = useSocket();
  const loggedInUser = useSelector((state) => state.auth?.user ?? null);
  const [page, setPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [enableButton, setEnableButton] = useState(false);

  // Animation refs
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-width * 0.7, 0, width * 0.7],
    outputRange: ["-8deg", "0deg", "8deg"],
    extrapolate: "clamp",
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, width / 4],
    outputRange: [0, 1],
  });
  const nopeOpacity = position.x.interpolate({
    inputRange: [-width / 4, 0],
    outputRange: [1, 0],
  });
  const nextCardOpacity = position.x.interpolate({
    inputRange: [-width * 0.5, -width * 0.2, width * 0.2, width * 0.5],
    outputRange: [1, 1, 1, 1],
  });
  const nextCardScale = position.x.interpolate({
    inputRange: [-width * 0.1, 0, width * 0.1],
    outputRange: [1, 1, 1],
    extrapolate: "clamp",
  });
  // Create a ref for ScrollView
  const scrollViewRef = useRef(null);

  // Pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only activate if the gesture is mostly horizontal
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 2);
    },
    onPanResponderMove: (evt, gestureState) => {
      position.setValue({ x: gestureState.dx, y: gestureState.dy });
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx > 120) {
        // Swiped right - follow user
        Animated.timing(position, {
          toValue: { x: width + 100, y: gestureState.dy },
          duration: 180,
          useNativeDriver: true,
        }).start(() => {
          nextUser();
          handleFollow();
        });
      } else if (gestureState.dx < -120) {
        // Swiped left - skip
        Animated.timing(position, {
          toValue: { x: -width - 100, y: gestureState.dy },
          duration: 180,
          useNativeDriver: true,
        }).start(nextUser);
      } else if (gestureState.dy < -120) {
        // Swiped up - skip
        Animated.timing(position, {
          toValue: { x: gestureState.dx - 500, y: gestureState.dy - 500 },
          duration: 180,
          useNativeDriver: true,
        }).start(nextUser);
      } else {
        Animated.timing(position, {
          toValue: { x: 0, y: 0 },
          duration: 150,
          useNativeDriver: true,
        }).start();
      }
    },
  });


  useEffect(() => {
    console.log("\n\nUpdate\n\n");

    socket?.on("status-received", (data) => {
      console.log("status-received data2", data, "currentUser.userID", currentUser?.userID);
      console.log("currentUser", currentUser.userID);

      if (data.onlineStatus == 1) {
        setEnableButton(true);
      } else {
        setEnableButton(false);
      }
    }, []);

    socket?.on("userOnline", (data) => {
      console.log("userOnline data", data, "currentUser.userID", currentUser?.userID);
      console.log("currentUser", currentUser.userID);

      if (data.onlineStatus == 1) {
        setEnableButton(true);
      } else {
        setEnableButton(false);
      }
    }, []);

    return () => {
      socket?.off("status-received");
      socket?.off("userOnline");
    };
  }, [socket, currentUser]);

  const fetchUsers = async (loadMore = false, initialLoad = false) => {
    console.log((!hasMoreUsers && loadMore), initialLoad);
    if (initialLoad || !loadMore) { setPage(1); } else if ((!hasMoreUsers && loadMore)) return;

    try {
      setLoading(true);
      const userToken = await AsyncStorage.getItem("accessToken");
      const userData = await AsyncStorage.getItem("User");

      if (!userToken || !userData) {
        throw new Error("Missing authentication data");
      }

      const parsedUser = JSON.parse(userData);
      setLoggedInUserID(parsedUser.userID);
      setToken(userToken);

      const currentPage = loadMore ? page + 1 : 1;

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/users/allUsers`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
          params: { page: currentPage, limit: 10 } // Add pagination params
        }
      );

      const filteredUsers = response.data.data.filter(
        user => user.userID !== parsedUser.userID &&
          user.userFirstName !== "undefined" &&
          user.userFirstName
      );
      const responseData = response.data.data;
      setHasMoreUsers(responseData.length ? responseData[responseData.length - 1].haveMore : false);

      if (loadMore) {
        setUsers(prevUsers => [...prevUsers, ...filteredUsers]);
        setPage(currentPage);
      } else {
        setUsers(filteredUsers);
        // Always set the first user if available
        setCurrentIndex(0);
        if (filteredUsers.length > 1) {
          setCurrentUser(filteredUsers[0]);
          setCachedNextUser(filteredUsers[1]);
          setTimeout(() => {
            socket?.emit("check-online", { userID: filteredUsers[0].userID, checkerUserID: parsedUser.userID });
          })
          // await checkFollowStatus(parsedUser.userID, filteredUsers[0].userID);
        } else if (filteredUsers.length > 0) setCurrentUser(filteredUsers[0]); else {
          setCurrentUser(null);
          setCachedNextUser(null);
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.show("Failed to load users", { type: "danger" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleVideoCall = async () => {
    if (!currentUser || !loggedInUser) {
      toast.show("Cannot initiate call - user data missing", { type: "danger" });
      return;
    }

    try {
      // First check if chat exists or create new one
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/chats/new-chat`,
        {
          chatType: "private",
          createdBy: loggedInUser.userID,
          chatWith: currentUser.userID
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Extract chat ID from response (works for both new and existing chats)
      const chatData = response.data.success
        ? response.data.data[0]
        : response.data.data?.[0];

      if (!chatData?.chatID) {
        throw new Error("Failed to get chat ID");
      }

      // Initiate the video call with the chat ID
      router.push({
        pathname: "../pages/WebRTCComponent",
        params: {
          currentUser_: JSON.stringify(loggedInUser),
          from_: loggedInUser.userID,
          to_: currentUser.userID,
          chatID: chatData.chatID,
          isCaller: true,
          status_: 'calling'
        },
      });

      // Notify the other user about the call
      if (socket && isConnected) {
        socket.emit("initiateCall", {
          callerId: loggedInUser.userID,
          receiverId: currentUser.userID,
          chatId: chatData.chatID,
          callType: 'video'
        });
      }

    } catch (error) {
      toast.show("Failed to start video call", { type: "danger" });

      // If there's an existing chat in the error response
      if (error.response?.data?.data) {
        const existingChat = error.response.data.data[0];
        router.push({
          pathname: "../pages/WebRTCComponent",
          params: {
            currentUser_: JSON.stringify(loggedInUser),
            from_: loggedInUser.userID,
            to_: currentUser.userID,
            chatID: existingChat.chatID,
            isCaller: true,
            status_: 'calling'
          },
        });
      }
    }
  };



  const handleFollow = async () => {
    if (!currentUser || !loggedInUserID) return;
    try {
      await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/follow/follow`,
        {
          followBy: loggedInUserID,
          followTo: currentUser.userID,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.show(`Followed ${currentUser.userFirstName}`, { type: "success" });
    } catch (err) {
      if (err.response.message) {
        toast.show(err.response.message, { type: "danger" });
      } else if (err.response.msg) {
        toast.show(err.response.msg, { type: "danger" });
      } else if (err.response) {
        console.log(err.response);
      } else {
        console.log("error", err);
      }
      // console.error("Follow error:", err.response);
      // toast.show("Failed to follow user", { type: "danger" });
    }
  };

  const createNewChat = async () => {
    if (!currentUser || !loggedInUserID) return;

    try {
      setCreatingChat(true);
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/chats/new-chat`,
        {
          chatType: "private",
          createdBy: loggedInUserID,
          chatWith: currentUser.userID,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const chatData = response.data.success
        ? response.data.data[0]
        : response.data.data?.[0];

      router.push({
        pathname: "../pages/ChatsScreen",
        params: {
          chatID: chatData.chatID,
          receiverID: currentUser.userID,
          receiverName: currentUser.userFirstName,
          receiverProfilePic: currentUser.profilePic?.startsWith("http")
            ? currentUser.profilePic
            : currentUser.profilePic
              ? `${process.env.EXPO_PUBLIC_API_BASE_URL}${currentUser.profilePic}`
              : currentUser.userGender === "1"
                ? require("../../assets/images/profile-female.jpg")
                : require("../../assets/images/profile.jpg"),
          chatType: "private",

        },
      });
    } catch (error) {
      console.log("Error creating chat:", error);
      if (error.response?.data?.data) {
        router.push({
          pathname: "/ChatsScreen",
          params: {
            chatID: error.response.data.data[0].chatID,
            receiverID: currentUser.userID,
            receiverName: currentUser.userFirstName,
            receiverProfilePic: currentUser.profilePic?.startsWith("http")
              ? currentUser.profilePic
              : currentUser.profilePic
                ? `${process.env.EXPO_PUBLIC_API_BASE_URL}${currentUser.profilePic}`
                : currentUser.userGender === "1"
                  ? require("../../assets/images/profile-female.jpg")
                  : require("../../assets/images/profile.jpg"),
            chatType: "private",
          },
        });
      }
    } finally {
      setCreatingChat(false);
    }
  };


  const nextUser = useCallback(() => {

    let startTime = new Date().getTime();
    if (users.length === 0) return;

    const newIndex = currentIndex + 1;
    if (newIndex >= users.length) {
      console.log("End of users");

      // Load more users if we're at the end
      if (hasMoreUsers) {
        fetchUsers(true); // Load more users
      }
      return;
    }

    console.log("Current Index & Total Users", currentIndex, newIndex);
    setCurrentIndex(newIndex);
    setCurrentUser(users[newIndex]);
    if (!isConnected) {
      setReload((prev) => !prev);
    }
    socket?.emit("check-online", { userID: users[newIndex].userID, checkerUserID: loggedInUserID });
    setCachedNextUser(users[newIndex + 1] || null);
    // Batch updates to reduce re-renders
    requestAnimationFrame(() => {
      position.setValue({ x: 0, y: 0 });
    });

    let endTime = new Date().getTime();
    // total Time in ms
    let totalTime = endTime - startTime;
    console.log("totalTime", totalTime);
  }, [currentIndex, users, hasMoreUsers, position]);


  useEffect(() => {
    if (hasMoreUsers && currentIndex + 1 >= users.length) {
      fetchUsers(true);
    }
  }, [hasMoreUsers, currentIndex, users]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers(false, true);
  };

  const renderCard = () => {
    if (!currentUser) return null;

    const profileImage = currentUser?.profilePic
      ? {
        uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${currentUser.profilePic}`,
      }
      : currentUser?.userGender === 2
        ? require("../../assets/images/profile-female.jpg")
        : require("../../assets/images/profile.jpg");

    return (
      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { rotate: rotate },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.parentContainer}>
          <View style={styles.profileImageContainer}>
            <FastImage
              source={profileImage}
              style={styles.profileImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          </View>

          <View style={styles.infoContainer}>
            <View>
              <View style={styles.nameContainer}>
                <Text
                  style={styles.name}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {currentUser.userFirstName} {currentUser.userSurname}
                </Text>
                {currentUser.userGender && (
                  <View style={styles.genderBadge}>
                    <Ionicons
                      name={
                        currentUser.userGender.toLowerCase() === "female"
                          ? "female"
                          : "male"
                      }
                      size={16}
                      color="#fff"
                    />
                  </View>
                )}
              </View>

              {currentUser.userBio && (
                <View style={styles.bioContainer}>
                  <Text
                    style={styles.bio}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {currentUser.userBio}
                  </Text>
                </View>
              )}
            </View>

            <View>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{currentUser.posts || 0}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {currentUser.totalFollowers || 0}
                  </Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {currentUser.followings || 0}
                  </Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.videoButton]}
              onPress={enableButton ? handleVideoCall : () => toast.show("User is offline", { type: "danger" })}
            >
              <Ionicons name="videocam" size={24} color="#fff" />
              <View style={{ ...styles.chatBadge, backgroundColor: enableButton ? '#4CAF50' : '#E74C3C' }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.chatButton]}
              onPress={createNewChat}
              disabled={creatingChat}
            >
              {creatingChat ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.profileButton]}
              onPress={() =>
                router.push({
                  pathname: "../pages/OtherProfile",
                  params: { userData: JSON.stringify(currentUser) },
                })
              }
            >
              <Ionicons name="person" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View style={[styles.likeLabel, { opacity: likeOpacity }]}>
          <Ionicons name="heart" size={48} color="#4CAF50" />
          <Text style={styles.likeText}>Follow</Text>
        </Animated.View>
        <Animated.View style={[styles.nopeLabel, { opacity: nopeOpacity }]}>
          <Ionicons name="close" size={48} color="#F44336" />
          <Text style={styles.nopeText}>Skip</Text>
        </Animated.View>
      </Animated.View>
    );
  };

  const NextUserCard = ({ user, opacity, scale }) => {
    const profileImage = user?.profilePic
      ? {
        uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${user.profilePic}`,
      }
      : user?.userGender === 2
        ? require("../../assets/images/profile-female.jpg")
        : require("../../assets/images/profile.jpg");

    return (
      <Animated.View
        style={[
          styles.nextCard,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={styles.parentContainer}>
          <View style={styles.profileImageContainer}>
            <FastImage
              source={profileImage}
              style={styles.profileImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          </View>

          <View style={styles.infoContainer}>
            <View>
              <View style={styles.nameContainer}>
                <Text
                  style={styles.name}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {user.userFirstName} {user.userSurname}
                </Text>
                {user.userGender && (
                  <View style={styles.genderBadge}>
                    <Ionicons
                      name={user.userGender.toLowerCase() === "female" ? "female" : "male"}
                      size={16}
                      color="#fff"
                    />
                  </View>
                )}
              </View>

              {user.userBio && (
                <View style={styles.bioContainer}>
                  <Text
                    style={styles.bio}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {user.userBio}
                  </Text>
                </View>
              )}
            </View>


            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user.posts || 0}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {user.totalFollowers || 0}
                </Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {user.followings || 0}
                </Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>

          <View style={[styles.buttonsContainer, { opacity: 0.9 }]}>
            <TouchableOpacity style={[styles.button, styles.videoButton, { backgroundColor: "#f2f2f2" }]}>
              <Ionicons name="videocam" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.chatButton, { backgroundColor: "#f2f2f2" }]}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.profileButton, { backgroundColor: "#f2f2f2" }]}>
              <Ionicons name="person" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const EndOfList = ({ onRefresh }) => (
    <View style={styles.endOfListContainer}>
      <Text style={styles.endOfListText}>
        You've reached the end
      </Text>
      <TouchableOpacity
        style={styles.loadMoreButton}
        onPress={onRefresh}
      >
        <Text style={styles.loadMoreButtonText}>Please refresh</Text>
      </TouchableOpacity>
    </View>
  );



  return (
    <View style={{ flex: 1 }}>
      <Header />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        </View>
      ) :
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY_COLOR]}
              tintColor={PRIMARY_COLOR}
            />
          }
          scrollEnabled={false}
        >
          <View style={styles.container}>
            {users.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No users found</Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={onRefresh}
                >
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {currentIndex < users.length - 1 && cachedNextUser && <NextUserCard
                  key={cachedNextUser.userID}
                  user={cachedNextUser}
                  opacity={nextCardOpacity}
                  scale={nextCardScale}
                />}

                {renderCard()}

                {currentIndex == users.length - 1 && (
                  EndOfList({ onRefresh })
                )}
              </>
            )}
          </View>
        </ScrollView>}
      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FD",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
   backgroundColor: "#F8F9FD",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginVertical: 10,
  },
  refreshButton: {
    padding: 15,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    marginTop: 20,
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
 card: {
  width: width * 0.9,
  height: "85%",
  backgroundColor: "#FFFFFF",
  borderRadius: 24,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.15,
  shadowRadius: 20,
  elevation: 10,
  position: "absolute",
  top: "3%",
  overflow: "hidden",
},
nextCard: {
  width: width * 0.9,
  height: "85%",
  backgroundColor: "#FFFFFF",
  borderRadius: 24,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.1,
  shadowRadius: 10,
  elevation: 5,
  position: "absolute",
  top: "3%",
  overflow: "hidden",
},
  parentContainer: {
    flex: 1,
  },
  profileImageContainer: {
    height: '55%',
    width: '100%',
    position: 'relative',
  },
profileImage: {
  width: "100%",
  height: "100%",
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
},
  FloatingLoader: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -25 }, { translateY: -25 }],
    zIndex: 99,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff76",
  },
  infoContainer: {
    padding: 20,
    flex: 1,
    justifyContent: "space-between",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  name: {
fontSize: 26,
fontWeight: "700",
color: "#1E1E1E",
letterSpacing: 0.5,
    maxWidth: '80%',
  },
  genderBadge: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 10,
    padding: 4,
    marginLeft: 8,
  },
  bioContainer: {
    minHeight: 10,
    justifyContent: 'center',
    marginBottom: 10,
  },
  bio: {
    color: "#7A7A7A",
fontSize: 14,
    textAlign: "center",
    lineHeight: 18,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statItem: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
   color: "#FF4D6D",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#A0A0A0"
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
   shadowColor: "#000",
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.2,
shadowRadius: 6,
    elevation: 3,
  },
  videoButton: {
     backgroundColor: "#6C63FF",
    position: "relative",
  },
  chatBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  chatButton: {
   backgroundColor: "#00C896",
  },
  profileButton: {
   backgroundColor: "#FF4D6D",
  },
  likeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    padding: 10,
    borderRadius: 5,
  },
  likeLabel: {
    borderStyle: "solid",
    borderWidth: 4,
   borderColor: "#00C896",
    position: "absolute",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    top: 50,
    left: 40,
    padding: 10,
    borderRadius: 5,
    transform: [{ rotate: "-30deg" }],
  },
  nopeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    padding: 10,
    borderRadius: 5,
  },
  nopeLabel: {
    borderStyle: "solid",
    borderWidth: 4,
   borderColor: "#FF4D6D",
    position: "absolute",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 50,
    right: 40,
    padding: 10,
    borderRadius: 5,
    transform: [{ rotate: "30deg" }],
  },
  endOfListContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#00000075",
    borderRadius: 10,
  },
  endOfListText: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 15,
    padding: 10,
    borderRadius: 5,
  },
  loadMoreButton: {
    padding: 15,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    width: 200,
    alignItems: "center",
  },
  loadMoreButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default UserCard;