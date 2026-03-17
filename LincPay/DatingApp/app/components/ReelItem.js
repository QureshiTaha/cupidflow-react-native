import React, {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as FileSystem from "expo-file-system";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Image,
  Text,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  Share,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesomeIcons from "@expo/vector-icons/FontAwesome";
import { usePathname, useRouter } from "expo-router";
import axios from "axios";
import { useToast } from "react-native-toast-notifications";
import GiftCoinPopup from "./GiftCoinPopup";
import { ActivityIndicator } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
const { width, height } = Dimensions.get("window");
import { useSocket } from "../services/SocketContext";
import { useUserTotalCoins } from "../api/coinApi";
const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://api-dating-app.iceweb.in";
const MAX_CACHE_FILES = 2;

// , currentUserID, currentUser
const ReelItem = React.memo(
  ({ item, shouldPlay, currentIndex, index, currentUser, isLastItem }) => {
    const REELS_CACHE_DIR = FileSystem.cacheDirectory + "reels/";
    const router = useRouter();
    const pathname = usePathname();
    const [localUri, setLocalUri] = useState(null);
    const [loading, setLoading] = useState(true);
    const videoRef = useRef(null);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const { socket, isConnected, setReload } = useSocket();
    const toast = useToast();

    const {
      data: coinsData,
      isLoading: isLoadingCoins,
      isError: isErrorCoins,
    } = useUserTotalCoins(currentUser?.userID);

    const totalCoins = Number(coinsData?.totalCoins ?? 0);
    // State variables
    const [status, setStatus] = useState(null);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [isLiked, setIsLiked] = useState(false);
    const [videoComments, setVideoComments] = useState([]);
    const [isCommentLoaded, setIsCommentLoaded] = useState(false);
    const [deleteCommentID, setDeleteCommentID] = useState(null);
    const [haveMoreComments, setHaveMoreComments] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [totalLikes, setTotalLikes] = useState(item.likes || 0);
    const [showGiftPopup, setShowGiftPopup] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [itemUserID, setItemUserID] = useState(item?.userID || "");
    const [isPlaying, setIsPlaying] = useState(true);
    const [showMoreOptionsModal, setShowMoreOptionsModal] = useState(false);
    const [showCommentsOptionsModal, setShowCommentsOptionsModal] =
      useState(false);
    const [isReport, setIsReport] = useState(false);
    const videoUrl = useMemo(
      () => `${BASE_URL}/reels${item.filepath}`,
      [item.filepath]
    );
    const currentUserID = useMemo(() => currentUser.userID, [currentUser]);
    const [activeChatID, setActiveChatID] = useState(null);
    const token = useSelector((state) => state.auth.token);

    const createOrGetChat = async () => {
      try {
        const response = await axios.post(
          `${BASE_URL}/api/v1/chats/new-chat`,
          {
            chatType: "private",
            createdBy: currentUserID,
            chatWith: item.userID,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const chatData = response.data.success
          ? response.data.data[0]
          : response.data.data?.[0];

        setActiveChatID(chatData.chatID);
        return chatData.chatID;
      } catch (err) {
        console.error(
          "❌ createOrGetChat error:",
          err?.response?.data || err.message
        );
        return null;
      }
    };

    const handleSendCoin = async (amount) => {
      if (totalCoins < amount) {
        toast.show("Insufficient coins to send", { type: "danger" });
        return;
      }
      try {
        // Step 1: Ensure chat exists
        let chatID = activeChatID;
        if (!chatID) {
          console.log("⚠️ No active chat, creating one...");
          chatID = await createOrGetChat();
        }
        if (!chatID) {
          console.error("❌ Cannot send coin: chatID missing");
          return;
        }

        // Step 2: Send to coins API
        try {
          const res = await axios.post(
            `${BASE_URL}/api/v1/coins/send-coin`,
            {
              senderId: currentUserID,
              receiverId: item.userID,
              count: amount,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log("💰 Coin send response:", res.data);
        } catch (err) {
          console.error(
            "❌ Coin API failed:",
            err.response?.data || err.message
          );
          return;
        }

        // Step 3: Emit socket message
        if (!socket || !isConnected) {
          console.error("❌ Socket not connected, cannot emit message");
          return;
        }

        socket.emit("sendMessage", {
          chatID,
          senderID: currentUserID,
          receiverID: item.userID,
          message: JSON.stringify({ type: "coin", amount }),
          messageType: "coin",
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Unexpected error sending coin:", err);
      }
    };

    // useEffect(() => {
    // console.log("Hitting ThisHere =>", videoUrl);
    // }, [videoUrl]);

    useEffect(() => {
      let isCancelled = false;
      const filename = item.filepath.replace(/\//g, "_");
      const fileUri = `${REELS_CACHE_DIR}${filename}`;
      const remoteUri = videoUrl;

      const manageCache = async () => {
        try {
          await FileSystem.makeDirectoryAsync(REELS_CACHE_DIR, {
            intermediates: true,
          });

          const fileInfo = await FileSystem.getInfoAsync(fileUri);

          if (!fileInfo.exists) {
            console.log("🔽 Waiting For Caching:", filename);
            await FileSystem.downloadAsync(remoteUri, fileUri);
          } else {
            console.log("✅✅ Already cached:", filename);
          }

          if (!isCancelled) {
            setLocalUri(fileUri);
            setLoading(false);
          }

          // Manage cache files
          // const allFiles = await FileSystem.readDirectoryAsync(REELS_CACHE_DIR);
          // if (allFiles.length > MAX_CACHE_FILES) {
          //     const fileStats = await Promise.all(
          //         allFiles.map(async (file) => {
          //             const info = await FileSystem.getInfoAsync(`${REELS_CACHE_DIR}${file}`);
          //             return { file, mtime: info.modificationTime || 0 };
          //         })
          //     );

          //     // Sort by modification time (oldest first)
          //     const sorted = fileStats.sort((a, b) => a.mtime - b.mtime);

          //     // Delete extra files
          //     const excessFiles = sorted.slice(0, allFiles.length - MAX_CACHE_FILES);
          //     for (const f of excessFiles) {
          //         await FileSystem.deleteAsync(`${REELS_CACHE_DIR}${f.file}`, { idempotent: true });
          //         console.log('🗑️ Removed old cached video:', f.file);
          //     }
          // }
        } catch (err) {
          console.error("❌ Cache error:", err);
        }
      };

      manageCache();

      return () => {
        isCancelled = true;
      };
    }, [videoUrl]);

    // Handle video playback based on current index
    useEffect(() => {
      console.log("currentIndex", currentIndex, "index", index);

      if (videoRef.current) {
        if (currentIndex === index) {
          videoRef.current.playAsync();
        } else {
          videoRef.current.pauseAsync();
        }
      }
      return () => {
        if (videoRef?.current?.unloadAsync) {
          console.log("Unloading video...");

          videoRef.current.unloadAsync().catch(() => {});
        }
      };
    }, [currentIndex, index]);

    // Cleanup video on unmount or pathname change
    useEffect(() => {
      return () => {
        if (videoRef.current) {
          videoRef.current.pauseAsync();
          videoRef.current.setPositionAsync(0);
        }
      };
    }, [pathname]);

    // Animate overlay based on playback status
    useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: status?.isPlaying ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [status?.isPlaying]);

    // Toggle video playback
    const togglePlayback = useCallback(async () => {
      if (!videoRef.current) return;
      try {
        if (status?.isPlaying) {
          setIsPlaying(false);
          await videoRef.current.pauseAsync();
        } else {
          setIsPlaying(true);
          await videoRef.current.playAsync();
        }
      } catch (error) {
        console.error("Error toggling video:", error);
      }
    }, [status]);

    // Debounced status update
    const handlePlaybackStatusUpdate = useCallback(
      debounce((status) => setStatus(status), 200),
      []
    );

    // Share video
    const openShareOptions = async () => {
      try {
        const url = videoUrl;
        await Share.share({
          message: `Check out this cool video! ${url}`,
        });
      } catch (error) {
        console.error(error);
      }
    };

    // Check like status when item or user changes
    useEffect(() => {
      const checkLikeStatus = async () => {
        if (!currentUserID || !item.reelId) return;
        try {
          const response = await axios.get(
            `${BASE_URL}/api/v1/reels/interaction-status/${item.reelId}/${currentUserID}`
          );
          setIsLiked(response.data.data.isLiked);
          setTotalLikes(item.likes || 0);
        } catch (error) {
          console.error("Error checking like status:", error);
        }
      };
      checkLikeStatus();
    }, [item.reelId, currentUserID]);

    // Fetch comments
    const fetchComments = useCallback(
      async (page = 1) => {
        setShowCommentModal(true);
        if (page === 1) {
          setVideoComments([]);
          setIsCommentLoaded(false);
        }
        try {
          const response = await axios.get(
            `${BASE_URL}/api/v1/reels/get-all-comments/${item.reelId}?page=${page}&limit=10`
          );
          const comments = response.data.data;
          setVideoComments((prev) => {
            const existingIds = new Set(prev.map((c) => c.commentId));
            return [
              ...prev,
              ...comments.filter((c) => !existingIds.has(c.commentId)),
            ];
          });
          setHaveMoreComments(comments[comments.length - 1]?.haveMore || false);
        } catch (err) {
          console.log("Error fetching comments:", err);
        } finally {
          setIsCommentLoaded(true);
        }
      },
      [item.reelId]
    );

    // Like / Dislike functions
    const handleLike = useCallback(async () => {
      if (!currentUserID || !item.reelId) return;
      setIsLiked(true);
      setTotalLikes((prev) => prev + 1);
      try {
        await axios.post(`${BASE_URL}/api/v1/reels/like`, {
          userID: currentUserID,
          reelId: item.reelId,
        });
      } catch (err) {
        // Revert on error
        setIsLiked(false);
        setTotalLikes((prev) => Math.max(0, prev - 1));
      }
    }, [currentUserID, item.reelId]);

    const dislikeReel = useCallback(async () => {
      if (!currentUserID || !item.reelId) return;
      setIsLiked(false);
      setTotalLikes((prev) => Math.max(0, prev - 1));
      try {
        await axios.post(`${BASE_URL}/api/v1/reels/dislike`, {
          userID: currentUserID,
          reelId: item.reelId,
        });
      } catch (err) {
        // Revert on error
        setIsLiked(true);
        setTotalLikes((prev) => prev + 1);
      }
    }, [currentUserID, item.reelId]);

    // Delete reel
    const deleteReel = useCallback(async () => {
      try {
        await axios.delete(`${BASE_URL}/api/v1/reels/delete/${item.reelId}`);
        setShowMoreOptionsModal(false);
        Alert.alert("Deleted Successfully", "Your Post Deleted Successfully");
        router.replace("../pages/profile");
      } catch (err) {
        console.error("Error deleting reel:", err);
      }
    }, [item.reelId, router]);

    // Helper: get comment time
    const getCommentTime = useCallback((timestamp) => {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "";
      const now = new Date();
      const seconds = Math.floor((now - date) / 1000);
      if (seconds < 60) return "Just now";
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h`;
      const days = Math.floor(hours / 24);
      return `${days}d`;
    }, []);

    // Send comment
    const sendComment = useCallback(async () => {
      if (newComment.trim() === "" || !currentUserID) return;
      const now = new Date();
      const rawTimestamp = now.toISOString();
      const formattedTime = getCommentTime(now);
      try {
        const data = {
          commentid: Date.now(),
          reelId: item.reelId,
          userID: currentUserID,
          commentText: newComment,
          commentedAt: rawTimestamp,
        };
        await axios.post(`${BASE_URL}/api/v1/reels/add-comment`, data, {
          headers: { "Content-Type": "application/json" },
        });
        const commentObj = {
          ...currentUser,
          commentId: data.commentid,
          reelId: item.reelId,
          commentText: newComment,
          commentedAt: formattedTime,
          userFirstName: "You", // Replace if available
        };
        setVideoComments((prev) => [commentObj, ...prev]);
        setNewComment("");
      } catch (err) {
        console.log("Error commenting:", err);
      }
    }, [newComment, currentUserID, item.reelId, getCommentTime]);

    // Delete comment
    const deleteComment = useCallback(async () => {
      if (!showDeleteCommentModal || deleteCommentID === null) return;
      try {
        const response = await axios.post(
          `${BASE_URL}/api/v1/reels/delete-comment`,
          { commentId: deleteCommentID },
          { headers: { "Content-Type": "application/json" } }
        );
        if (response.data.status) {
          setVideoComments((prev) =>
            prev.filter((c) => c.commentId !== deleteCommentID)
          );
        }
      } catch (err) {
        console.error("Error deleting comment:", err);
      } finally {
        setDeleteCommentID(null);
        setShowDeleteCommentModal(false);
      }
    }, [showDeleteCommentModal, deleteCommentID]);

    // Load more comments
    const handleEndPage = useCallback(async () => {
      if (haveMoreComments) {
        await fetchComments(pageNumber + 1);
        setPageNumber((prev) => prev + 1);
      }
    }, [haveMoreComments, fetchComments, pageNumber]);

    // Toggle modal for more options
    const showMoreOptions = useCallback(() => {
      setShowMoreOptionsModal(true);
    }, []);

    const closeMoreOptions = useCallback(() => {
      setShowMoreOptionsModal(false);
    }, []);

    // Render comments list
    const showFetchedComments = async ({ pageNumber }) => {
      setShowCommentModal(true);

      if (pageNumber === 1) {
        setVideoComments([]); // clear existing comments on first page load
        setIsCommentLoaded(false); // optionally show shimmer/loading again
      }
      try {
        const response = await axios.get(
          `${BASE_URL}/api/v1/reels/get-all-comments/${item.reelId}?page=${pageNumber}&limit=10`
        );

        // Remove duplicates using commentId if needed
        const newComments = response.data.data;
        setVideoComments((prev) => {
          const existingIds = new Set(prev.map((c) => c.commentId));
          const filtered = newComments.filter(
            (c) => !existingIds.has(c.commentId)
          );
          return [...prev, ...filtered];
        });

        const lastJson = newComments[newComments.length - 1];
        setHaveMoreComments(lastJson?.haveMore || false);
      } catch (error) {
        console.log("Error fetching comments:", error);
      }

      setIsCommentLoaded(true);
    };

    return (
      <View
        style={[styles.videoContainer, isLastItem && styles.lastVideoContainer]}
      >
        {loading || !videoUrl ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : (
          <Pressable onPress={togglePlayback} style={styles.videoContainer}>
            <Video
              ref={videoRef}
              source={{ uri: localUri }}
              resizeMode="cover"
              style={styles.video}
              isLooping
              shouldPlay={shouldPlay}
              useNativeControls={false}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              // onLoadStart={() => console.log("Loading started")}
              // onLoad={() => console.log("Video loaded")}
              // onProgress={(progress) => console.log("Video progress:", progress)}
              // onEnd={() => console.log("Video ended")}
              // onBuffer={() => console.log("Video buffering")}
              // onReadyForDisplay={() => console.log("Video ready for display")}
              onPlaybackError={(err) =>
                console.error("🎥 Playback error:", err)
              }
              onError={(err) => {
                console.error("🎥 Video error:", err);
                // reload the current video;
                setLocalUri(videoUrl);
              }}
            />
            {!isPlaying && (
              <View style={styles.playButtonOverlay}>
                <MaterialIcons
                  name="play-arrow"
                  size={90}
                  color="rgba(255,255,255,0.7)"
                />
              </View>
            )}
          </Pressable>
        )}
        {/* Overlay icons */}
        <View style={styles.overlay}>
          <View style={styles.iconContainer}>
            <Pressable style={styles.iconWrapper} onPress={openShareOptions}>
              <MaterialCommunityIcons
                name="share-outline"
                size={25}
                color="white"
              />
              <Text style={styles.iconText}>Share</Text>
            </Pressable>

            <Pressable
              style={styles.iconWrapper}
              onPress={() => {
                if (!currentUserID) return;
                isLiked
                  ? dislikeReel(currentUserID, item.reelId)
                  : handleLike(currentUserID, item.reelId);
              }}
            >
              <FontAwesome
                name={isLiked ? "heart" : "heart-o"}
                size={25}
                color={isLiked ? "red" : "white"}
              />
              <Text style={styles.iconText}>{totalLikes}</Text>
            </Pressable>

            <Pressable
              style={styles.iconWrapper}
              onPress={() => showFetchedComments({ pageNumber: 1 })}
            >
              <MaterialIcons name="comment" size={25} color="white" />
              <Text style={styles.iconText}>Comments</Text>
            </Pressable>

            {currentUserID && currentUserID !== item.userID && (
              <>
                <TouchableOpacity
                  style={styles.giftButton}
                  onPress={() => {
                    setShowGiftPopup(true);
                  }}
                >
                  <Text style={styles.giftButtonText}>🎁 Send Gift </Text>
                </TouchableOpacity>

                <GiftCoinPopup
                  visible={showGiftPopup}
                  onClose={() => setShowGiftPopup(false)}
                  onSend={({ amount }) => {
                    handleSendCoin(amount);
                    setShowGiftPopup(false);
                  }}
                  receiverId={item.userID}
                />
              </>
            )}

            <TouchableOpacity
              style={styles.iconWrapper}
              onPress={() => showMoreOptions()}
            >
              {currentUserID !== "" && currentUserID === itemUserID && (
                <Entypo name="dots-three-vertical" size={23} color="white" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.profileContainer}>
            <TouchableOpacity onPress={() => router.push("../pages/profile")}>
              <Image
                source={
                  item.profilePic
                    ? {
                        uri: `${BASE_URL}${item.profilePic}`,
                      }
                    : item.userGender === 2
                    ? require("../../assets/images/profile-female.jpg")
                    : require("../../assets/images/profile.jpg")
                }
                style={styles.profileImage}
              />
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={[styles.username, { color: "#fff" }]}>
                {item?.userName || item?.userFirstName || "Default Text"}
              </Text>
              <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                <Text
                  style={styles.truncatedDescription}
                  numberOfLines={expanded ? 0 : 2}
                >
                  <Text style={styles.momentDsc}>
                    {!expanded && item.description.length > 30 ? (
                      <>
                        {item.description.slice(0, 20)}
                        <Text style={styles.desc}> Read more...</Text>
                      </>
                    ) : (
                      item.description
                    )}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Overlay icons and profile info */}
        {/* You can keep your existing JSX here, refactored for clarity if needed */}

        {/* Comments Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showCommentModal}
          onRequestClose={() => setShowCommentModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowCommentModal(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.commentModal}>
                  <Text style={styles.commentHeader}>Comments</Text>
                  {/* {renderComments()} */}
                  {/* Comment Input */}
                  <View style={styles.commentInputContainer}>
                    <Image
                      source={
                        currentUser.profilePic
                          ? { uri: `${BASE_URL}${currentUser.profilePic}` }
                          : currentUser.userGender === 2
                          ? require("../../assets/images/profile-female.jpg")
                          : require("../../assets/images/profile.jpg")
                      }
                      style={styles.profilePic}
                    />
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Add a comments..."
                      value={newComment}
                      onChangeText={setNewComment}
                    />
                    <TouchableOpacity
                      style={styles.commentButton}
                      onPress={sendComment}
                    >
                      <FontAwesomeIcons name="send" size={25} color="#e91e63" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Options Modal for comments (report/delete) */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showCommentModal}
          onRequestClose={() => setShowCommentModal(false)}
          showFetchedComments
        >
          <TouchableWithoutFeedback onPress={() => setShowCommentModal(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.commentModal}>
                  <Text style={styles.commentHeader}>Comments</Text>

                  {isCommentLoaded ? (
                    videoComments.length > 0 ? (
                      <FlatList
                        keyExtractor={(item) => item.commentId.toString()}
                        data={videoComments}
                        renderItem={({ item }) => {
                          return (
                            <TouchableOpacity
                              onPress={() => {
                                if (currentUserID === item.userID) {
                                  setDeleteCommentID(item.commentId);
                                  setShowCommentsOptionsModal(true);
                                  setIsReport(false);
                                } else {
                                  setShowCommentsOptionsModal(true);
                                  setIsReport(true);
                                }
                              }}
                            >
                              <View style={styles.commentItem}>
                                <Image
                                  source={
                                    item.profilePic
                                      ? {
                                          uri: `${BASE_URL}${item.profilePic}`,
                                        }
                                      : item.userGender == 2
                                      ? require("../../assets/images/profile-female.jpg")
                                      : require("../../assets/images/profile.jpg")
                                  }
                                  style={styles.profilePic}
                                />
                                <View style={{ flex: 1 }}>
                                  <View style={styles.commentHeaderRow}>
                                    <Text style={styles.commentUser}>
                                      {currentUserID === item.userID
                                        ? "You"
                                        : item.userFirstName +
                                          " " +
                                          item.userSurname}
                                    </Text>
                                    <Text style={styles.commentTime}>
                                      {getCommentTime(item.commentedAt)}
                                    </Text>
                                  </View>
                                  <Text style={styles.commentText}>
                                    {item.commentText}
                                  </Text>
                                  <View style={styles.divider} />
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        }}
                        contentContainerStyle={{ paddingBottom: 0 }}
                        onEndReached={handleEndPage}
                        onEndReachedThreshold={0.5}
                      />
                    ) : (
                      <View style={styles.noCommentContainer}>
                        <Text style={styles.noCommentText}>
                          No comments yet
                        </Text>
                      </View>
                    )
                  ) : (
                    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
                      <View key={item} style={styles.commentItem}>
                        <View style={styles.profilePicShimer}></View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.commentHeaderRow}>
                            <Text style={styles.commentUserShimer}>
                              "username"
                            </Text>
                            <Text style={styles.commentTime}>"time"</Text>
                          </View>
                          <Text style={styles.commentTextShimer}>
                            {"comment"}
                          </Text>
                          <View style={styles.divider} />
                        </View>
                      </View>
                    ))
                  )}

                  <View style={styles.commentInputContainer}>
                    <Image
                      source={
                        currentUser.profilePic
                          ? { uri: `${BASE_URL}${currentUser.profilePic}` }
                          : currentUser.userGender == 2
                          ? require("../../assets/images/profile-female.jpg")
                          : require("../../assets/images/profile.jpg")
                      }
                      style={styles.profilePic}
                    />
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Add a comment..."
                      value={newComment}
                      onChangeText={setNewComment}
                      placeholderTextColor="#aaa"
                    />
                    <TouchableOpacity
                      style={styles.commentButton}
                      onPress={() =>
                        sendComment(
                          item.commentId,
                          item.reelId,
                          currentUserID,
                          newComment,
                          getCommentTime(item.commentedAt)
                        )
                      }
                    >
                      <FontAwesomeIcons name="send" size={25} color="#e91e63" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Delete Comment Confirmation */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showDeleteCommentModal}
          onRequestClose={() => {
            setShowDeleteCommentModal(false);
            setDeleteCommentID(null);
          }}
        >
          <TouchableWithoutFeedback
            onPress={() => setShowDeleteCommentModal(false)}
          >
            <View style={styles.deletedOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.deleteCommentModal}>
                  <Text style={styles.commentHeader}>Delete Comment</Text>
                  <Text style={styles.commentDescription}>
                    Are you sure you want to delete this comment?
                  </Text>
                  <View style={styles.commentDeleteContainer}>
                    <TouchableOpacity
                      onPress={() => {
                        setShowDeleteCommentModal(false);
                      }}
                    >
                      <Text style={styles.cancelButtons}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={deleteComment}>
                      <Text style={styles.deleteButton}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* More Options Modal */}
        <Modal
          visible={showMoreOptionsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={closeMoreOptions}
        >
          <Pressable style={styles.modalOverlay} onPress={closeMoreOptions}>
            <View style={styles.modalContainer}>
              {/* Add other options as needed */}
              <View style={styles.modalOptionRow}>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={deleteReel}
                >
                  <MaterialCommunityIcons
                    name="delete-outline"
                    size={24}
                    color="red"
                  />
                  <Text style={styles.modalText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  },
  (prev, next) => {
    return (
      prev.item.filepath === next.item.filepath &&
      prev.shouldPlay === next.shouldPlay
    );
  }
);

// Utility debounce function
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export default ReelItem;

const styles = StyleSheet.create({
  videoContainer: {
    width,
    minHeight: height - height * 0.08,
    maxHeight: height - height * 0.06,
    height: "100vh",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
  },
  lastVideoContainer: {
    marginBottom: 80,
    height: height - height * 0.08 - 20,
  },
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  loader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 12,
    zIndex: 1,
  },
  overlay: {
    position: "absolute",
    width,
    bottom: 45,
    flex: 1,
    justifyContent: "space-between",
    padding: 0,
  },
  playButtonOverlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 50,
    borderColor: "#aaa",
    borderWidth: 2,
  },

  profileTextContainer: { marginLeft: 12 },
  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    borderColor: "#fff",
  },
  username: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 6,
  },
  profileInfo: {
    paddingLeft: 20,
    width: 250,
  },
  description: { color: "#eaeaea", fontSize: 13, marginTop: 6 },
  iconContainer: {
    position: "absolute",
    bottom: 15,
    right: 14,
    alignItems: "center",
    gap: 30,
  },
  profileContainer: {
    position: "absolute",
    bottom: 55,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: { alignItems: "center" },
  iconText: {
    color: "#fff",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  followButton: {
    marginLeft: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  followButtonText: {
    fontWeight: "600",
    color: "#000",
    fontSize: 13,
  },
  loaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  moreOptions: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    paddingVertical: 24,
    paddingHorizontal: 28,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 22,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  modalText: {
    fontSize: 19,
    color: "#222",
    fontWeight: "500",
  },
  modalOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 12,
  },
  momentDsc: {
    color: "#fff",
    fontSize: 14,
  },
  commentModal: {
    backgroundColor: "#fff",
    width: "100%",
    height: "90%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    position: "absolute",
    bottom: 0,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    textAlign: "center",
    fontSize: 18,
    marginBottom: 10,
  },
  commentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between", // pushes username left, time right
    alignItems: "center",
    marginBottom: 4,
    flex: 1,
  },
  commentItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 10,
    marginHorizontal: 16,
    borderRadius: 14,
    alignItems: "flex-start",
  },
  commentUser: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
  },
  commentUserShimer: {
    fontSize: 17,
    fontWeight: "700",
    backgroundColor: "#000",
    animationDuratin: "2s",
    animationName: "shimmer",
    background: "grey",
    background: "linear-gradient(to right, grey 0%, #fff 20%, grey 100%)",
  },
  commentTextShimer: {
    fontSize: 14,
    color: "pink",
    backgroundColor: "grey",
  },
  commentText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 18,
  },
  noCommentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20, // optional padding if you want some spacing
  },
  noCommentText: {
    fontSize: 24,
    color: "#333",
    lineHeight: 18,
    textAlign: "center",
  },

  commentTime: {
    flex: 1,
    textAlign: "left",
    left: 10,
    fontSize: 14,
    color: "#555",
    fontStyle: "italic",
  },
  commentTimeShimer: {
    flex: 1,
    textAlign: "left",
    left: 10,
    fontSize: 14,
    backgroundColor: "blue",
    fontStyle: "italic",
  },
  commentInputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 11,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    color: "#000",
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 30,
    marginRight: 8,
  },
  profilePicShimer: {
    width: 40,
    height: 40,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: "grey",
  },
  sendButtonText: {
    color: "#007aff",
    fontWeight: "600",
    fontSize: 16,
    paddingHorizontal: 10,
  },
  deletedOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Dimmed overlay
    justifyContent: "center",
    alignItems: "center",
  },
  deleteCommentModal: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 30,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  commentDeleteContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButtons: {
    backgroundColor: "#E0E0E0",
    color: "#333",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    fontSize: 16,
    fontWeight: "600",
    overflow: "hidden",
    textAlign: "center",
  },
  deleteButton: {
    backgroundColor: "#FF4C4C",
    color: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    fontSize: 16,
    fontWeight: "600",
    overflow: "hidden",
    textAlign: "center",
  },
  optionsOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  popupContainer: {
    width: 250,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  icon: {
    marginRight: 10,
  },
  optionText: {
    fontSize: 16,
  },
  giftButton: {
    backgroundColor: "#fe2146",
    padding: 10,
    borderRadius: 20,
    alignSelf: "center",
    marginVertical: 10,
  },
  giftButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    playPauseButton: {
      position: "absolute",
      top: "40%",
      left: "45%",
      zIndex: 10,
      borderRadius: 40,
      padding: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    truncatedDescription: {
      color: "#eaeaea",
      fontSize: 13,
      marginTop: 4,
    },
    commentDescription: {
      textAlign: "center",
      marginBottom: 10,
    },
  },
});
