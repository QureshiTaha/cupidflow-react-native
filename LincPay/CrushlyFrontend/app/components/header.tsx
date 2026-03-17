import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import EntypoIcons from "react-native-vector-icons/Entypo";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useRouter, usePathname } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../Redux/authSlice";
import { useSocket } from "../services/SocketContext";
import {
  fetchUserCoins,
  completeRefresh,
  setInitialized,
} from "../Redux/coinSlice";
import { DatabaseService } from "../services/database";
import { useUserTotalCoins } from "../api/coinApi";
import { useQueryClient } from "@tanstack/react-query";
import { formatCoins } from "../utils/commonFunctions";
import { useUserTotalFollowers } from "../api/followersApi";
import { useToast } from "react-native-toast-notifications";
import { myConsole } from "../utils/myConsole";
import { LinearGradient } from "expo-linear-gradient";

const screenWidth = Dimensions.get("window").width;

// Theme colors
const themeColors = {
  color1: "#f38ea8",
  color2: "#ef7cca",
  color3: "#f4b595",
  color4: "#8f6adf",
};

export default function Header({ isTransparent = false }) {
  // UI State
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [error, setError] = useState(null);

  // Refs for animations
  const translateX = useRef(new Animated.Value(-screenWidth)).current;
  const translateZ = useRef(new Animated.Value(screenWidth)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Redux state
  const dispatch = useDispatch();
  const shouldRefresh = useSelector(
    (state) => state.coins?.shouldRefresh ?? false,
  );
  const user = useSelector((state) => state.auth?.user ?? null);
  const coinsStatus = useSelector((state) => state.coins?.status ?? "idle");
  const fetchedOnce = useRef(false);
  // const coinsStatus = useSelector((state) => state.coins?.status ?? 'idle');
  const isInitialized = useSelector((state) => state.coins?.isInitialized);
  // Router
  const router = useRouter();
  const pathname = usePathname();
  const { newNotification, socket, setNewNotification } = useSocket();
  const queryClient = useQueryClient();
  const toast = useToast();

  const isActive = (route) => pathname === route;

  const {
    data: coinsData,
    isLoading: isLoadingCoins,
    isError: isErrorCoins,
  } = useUserTotalCoins(user?.userID, 1, 10);

  const totalCoins = Number(coinsData?.totalCoins ?? 0);

  const { data: followersCount = 0 } = useUserTotalFollowers(user?.userID);

  const toggleMenu = () => {
    if (menuOpen) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -screenWidth,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setMenuOpen(false));
    } else {
      setMenuOpen(true);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const toggleNotification = () => {
    Animated.timing(translateZ, {
      toValue: notificationOpen ? screenWidth : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setNotificationOpen(!notificationOpen);
  };

  // Initial load
  useEffect(() => {
    if (fetchedOnce.current || isInitialized) return;
    fetchedOnce.current = true;

    const loadInitialData = async () => {
      try {
        let currentUser =
          user || JSON.parse(await AsyncStorage.getItem("User"));
        if (currentUser?.userID) {
          await dispatch(fetchUserCoins(currentUser.userID));
          dispatch(setInitialized());
        }
      } catch (e) {
        console.error("Initial load error:", e);
      }
    };

    loadInitialData();
  }, [isInitialized]);

  // Refresh when shouldRefresh changes
  useEffect(() => {
    if (shouldRefresh && shouldRefresh === true && user?.userID) {
      console.log("Refreshing coins...");
      dispatch(fetchUserCoins(user.userID));
      dispatch(completeRefresh());
    }
  }, [shouldRefresh]);

  return (
    <>
      {/* Header */}

      <LinearGradient
        colors={[themeColors.color4, themeColors.color2, themeColors.color1]}
        style={[
          styles.header,
          isTransparent ? styles.headerTransparent : null,
          Platform.OS === "ios" ? styles.iosHeader : null,
        ]}
      >
        <View style={styles.leftSection}>
          {/* Profile Image (Click to open menu) */}
          <TouchableOpacity
            onPress={toggleMenu}
            style={styles.profileContainer}
            activeOpacity={0.7}
          >
            {user?.profilePic ? (
              <Image
                source={{
                  uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${user.profilePic}`,
                }}
                style={styles.profileImage}
              />
            ) : (
              <Image
                source={require("../../assets/images/profile.jpg")}
                style={styles.profileImage}
              />
            )}
          </TouchableOpacity>

          {totalCoins !== null && (
            <TouchableOpacity
              style={styles.coinButton}
              onPress={() => router.push("./CoinMainScreen")}
              //  onPress={() => router.push("./coinScreen")}
              activeOpacity={0.7}
            >
              <View style={styles.coinContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.coinText}>{formatCoins(totalCoins)}</Text>
                <View style={styles.plusIconContainer}>
                  <Ionicons name="add" size={14} color="#333" />
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.chatIcon}
          onPress={() => {
            setNewNotification(false);
            router.push("../pages/ChatList");
          }}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="chat-bubble-outline"
            size={24}
            color={isTransparent ? "#fff" : "#fff"}
          />
          {newNotification && <View style={styles.chatBadge} />}
          {/* <View style={styles.chatBadge} /> */}
        </TouchableOpacity>
      </LinearGradient>

      {/* Overlay when menu is open */}
      {menuOpen && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            onPress={toggleMenu}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      {/* Sidebar Menu */}
      <Animated.View style={[styles.menu, { transform: [{ translateX }] }]}>
        <View style={styles.profileSection}>
          <View style={styles.profileRowContainer}>
            <View style={styles.profileRow}>
              {user?.profilePic ? (
                <TouchableOpacity
                  onPress={() => {
                    toggleMenu();
                    router.push("../pages/profile");
                  }}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{
                      uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${user.profilePic}`,
                    }}
                    style={styles.profileImageLarge}
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    toggleMenu();
                    router.push("../pages/profile");
                  }}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require("../../assets/images/profile.jpg")}
                    style={styles.profileImageLarge}
                  />
                </TouchableOpacity>
              )}
              <View style={styles.profileInfoContainer}>
                <Text
                  style={styles.profileName}
                  numberOfLines={1}
                  onPress={() => {
                    toggleMenu();
                    router.push("../pages/profile");
                  }}
                >
                  {user?.userFirstName + " " + user?.userSurname}
                </Text>

                <View style={styles.statsRow}>
                  {/* Followers */}
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons
                      name="account-group-outline"
                      size={16}
                      color={themeColors.color4}
                    />
                    <Text style={styles.statsText}>{followersCount || 0}</Text>
                  </View>

                  {/* Coins */}
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons
                      name="crown-outline"
                      size={16}
                      color={themeColors.color2}
                    />
                    <Text style={styles.statsText}>
                      {formatCoins(totalCoins) || 0}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={{
                  alignSelf: "flex-start",
                  marginLeft: 8,
                }}
                onPress={toggleMenu}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={28} color={themeColors.color4} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.menuItemsContainer}>
          {/* <TouchableOpacity
            style={styles.menuItem}
            // onPress={() => {
            //   toggleMenu();
            //   router.push("../pages/agency");
            // }}
            onPress={() => null}
            activeOpacity={0.7}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="briefcase-outline" size={22} color={themeColors.color4} />
            </View>
            <Text style={styles.menuText}>Agency Program</Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              toggleMenu();
              router.push("../pages/followers");
            }}
            activeOpacity={0.7}
          >
            <View style={styles.menuIcon}>
              <Ionicons
                name="heart-outline"
                size={22}
                color={themeColors.color4}
              />
            </View>
            <Text style={styles.menuText}>My Followers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              toggleMenu();
              router.push("../pages/PurchaseCoin");
            }}
            activeOpacity={0.7}
          >
            <View style={styles.menuIcon}>
              <Ionicons
                name="card-outline"
                size={22}
                color={themeColors.color4}
              />
            </View>
            <Text style={styles.menuText}>Blush Coin Offers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => {
              toast.show("Coming Soon", { type: "warning" });
            }}
          >
            <View style={styles.menuIcon}>
              <Ionicons
                name="game-controller-outline"
                size={22}
                color={themeColors.color4}
              />
            </View>
            <Text style={styles.menuText}>Social Games</Text>
          </TouchableOpacity>
        </View>

        {/* <View style={styles.divider} /> */}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            Animated.timing(translateX, {
              toValue: -screenWidth,
              duration: 300,
              useNativeDriver: true,
            }).start(async () => {
              setMenuOpen(false);
              try {
                await socket?.disconnect();
              } catch (error) {
                console.log(error);
              }
              try {
                await DatabaseService.resetDatabase();
              } catch {}
              AsyncStorage.removeItem("Authenticated");
              AsyncStorage.removeItem("User");
              queryClient.clear();
              dispatch(logout());
              router.navigate("../pages/login");
            });
          }}
          activeOpacity={0.7}
        >
          <View style={styles.menuIcon}>
            <Ionicons
              name="log-out-outline"
              size={22}
              color={themeColors.color2}
            />
          </View>
          <Text style={[styles.menuText, { color: themeColors.color2 }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Notification Panel */}
      <Animated.View
        style={[
          styles.notificationPanel,
          { transform: [{ translateX: translateZ }] },
        ]}
      >
        <View style={styles.notificationHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={toggleNotification}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.notificationTitle}>Notifications</Text>
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationItem}>
            <Image
              source={
                user?.profilePic
                  ? {
                      uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${user.profilePic}`,
                    }
                  : require("../../assets/images/profile.jpg")
              }
              style={styles.notificationProfileImage}
            />
            <View style={styles.notificationTextContainer}>
              <Text style={styles.notificationMessage}>
                You have new followers
              </Text>
              <Text style={styles.notificationTime}>2 hours ago</Text>
            </View>
            <EntypoIcons
              name="chevron-right"
              size={20}
              color={themeColors.color3}
            />
          </View>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: `${themeColors.color2}30`, // 30 = 19% opacity
    ...Platform.select({
      ios: {
        shadowColor: themeColors.color4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerTransparent: {
    backgroundColor: "transparent",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  iosHeader: {
    paddingTop: 50, // Extra padding for iOS status bar
  },

  // Left Section
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  // Coin Button
  coinButton: {
    marginLeft: 12,
  },
  coinContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${themeColors.color3}20`, // 20 = 12% opacity
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fff",
  },
  coinText: {
    color: themeColors.color4,
    marginLeft: 6,
    marginRight: 4,
    fontSize: 14,
    fontWeight: "600",
  },
  plusIconContainer: {
    backgroundColor: "#FFF",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },

  // Chat Icon
  chatIcon: {
    padding: 8,
    position: "relative",
  },
  chatBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: themeColors.color2,
  },

  // Overlay
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 1,
  },
  overlayTouchable: {
    flex: 1,
  },

  // Menu Styles
  menu: {
    position: "absolute",
    top: 0,
    left: 0,
    width: screenWidth * 0.85,
    height: "100%",
    backgroundColor: "#FFF",
    paddingTop: 60,
    paddingHorizontal: 20,
    zIndex: 3,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  backButton: {
    padding: 8,
    position: "absolute",
  },

  // Profile Section
  profileSection: {
    marginBottom: 20,
  },
  profileRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    // backgroundColor: "red",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileImageLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: themeColors.color2,
  },
  profileInfoContainer: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    color: themeColors.color4,
    fontSize: 18,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statsText: {
    color: themeColors.color1,
    marginLeft: 4,
    fontSize: 14,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: `${themeColors.color2}30`, // 30 = 19% opacity
    marginVertical: 16,
  },

  // Menu Items
  menuItemsContainer: {
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  menuIcon: {
    width: 24,
    alignItems: "center",
    marginRight: 12,
  },
  menuText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
  },

  // Logout Button
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  // Notification Panel
  notificationPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#1A1A1A",
    paddingTop: 60,
    zIndex: 3,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.color2,
    backgroundColor: themeColors.color4,
  },
  notificationTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 20,
  },
  notificationContent: {
    padding: 20,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${themeColors.color2}50`, // 50 = 31% opacity
  },
  notificationProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: themeColors.color2,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationMessage: {
    color: "#FFF",
    fontSize: 16,
    marginBottom: 4,
  },
  notificationTime: {
    color: themeColors.color3,
    fontSize: 12,
  },
});
