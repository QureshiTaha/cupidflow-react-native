import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  View,
  Dimensions,
  FlatList,
  StyleSheet,
  Pressable,
  Image,
  Text,
  Modal,
  TextInput,
  Button,
  Share,
  ActivityIndicator,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Keyboard,
  Animated,
  Alert,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesomeIcons from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname, useRouter } from "expo-router";
import axios from "axios";
import { useToast } from 'react-native-toast-notifications'; 
import GiftCoinPopup from "./GiftCoinPopup";


const { width, height } = Dimensions.get("window");
export default function ReelsComponent(props) {
  const [currentUserID, setCurrentUserID] = useState("");
  const pathname = usePathname();
  const [currentViewableItemIndex, setCurrentViewableItemIndex] = useState(0);
  const [Database, setDatabase] = useState([]);
  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 80 };
  const [itemUserID, setItemUserID] = useState("");

  const [isSaved, setIsSaved] = useState(false);
  const video = useRef(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [haveMoreReels, setHaveMoreReels] = useState(false);
  const [userPic, setUserPic] = useState(null);


  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await AsyncStorage.getItem("User");
        // console.log("getUser called = ", user);

        if (user) {
          const parsedUser = JSON.parse(user);
          const userID = parsedUser.userID;
          setCurrentUserID(userID);
          setUserPic(parsedUser?.profilePic);
          // console.log("Current User ID = ", userID);
        }
      } catch (err) {
        console.error("Error parsing user from AsyncStorage", err);
      }
    };

    getUser();
    setIsSaved(false);
  }, []);

  useEffect(() => {
    if (props.reel) {
      setDatabase([props.reel]);
    }
  }, [props]);

  const fetchReels = async ({ pageNumber }) => {
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/reels/get-latest?page=${pageNumber}&limit=10`
      );
      const fetchedReels = response.data.data;
      const lastJson = fetchedReels[fetchedReels.length - 1];
      setHaveMoreReels(lastJson?.haveMore ?? false);

      setDatabase((prev) => [...prev, ...fetchedReels]);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchReels({ pageNumber: 1 });
  }, []);

  const CheckLastReel = async () => {
    if (haveMoreReels) {
      setPageNumber((prev) => prev + 1);
      await fetchReels({ pageNumber: pageNumber + 1 });
    } else {
      console.log("No more reels");
    }
  };

  const ReelItem = ({ item, shouldPlay, openShareOptions }) => {
    
    const toast = useToast(); 

    const fadeAnim = useRef(new Animated.Value(1)).current;

    const router = useRouter();
    const [currentUserID, setCurrentUserID] = useState("");
    const [currentUser, setCurrentUser] = useState({});
    const [reelUserProfilePic, setReelUserProfilePic] = useState(null);
    const [status, setStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [isLiked, setIsLiked] = useState(false);
    const [showMoreOptionsModal, setShowMoreOptionsModal] = useState(false);
    const [showCommentsOptionsModal, setShowCommentsOptionsModal] =
      useState(false);
    const [videoComments, setVideoComments] = useState([]);
    const [isCommented, setIsCommented] = useState(false);
    const [isCommentLoaded, setIsCommentLoaded] = useState(false);
    const [deleteCommentID, setDeleteCommentID] = useState(null);
    const [haveMoreComments, setHaveMoreComments] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [commentUserFirstName, setCommentUserFirstName] = useState("");
    const [commentUserID, setCommentUserID] = useState("");
    const [isReport, setIsReport] = useState(false);
  const [totalLikes, setTotalLikes] = useState(item.likes || 0);
    const [isLikeStatusLoading, setIsLikeStatusLoading] = useState(true);
    const [totalComments, setTotalComments] = useState(0);
    //const [isSaved, setIsSaved] = useState(false);
    const [receiverId, setReceiverId] = useState('');
    const [showGiftPopup, setShowGiftPopup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useMemo(() => {
      const getUser = async () => {
        try {
          const user = await AsyncStorage.getItem("User");

          if (user) {
            const parsedUser = JSON.parse(user);
            const userID = parsedUser.userID;
            setCurrentUserID(userID);
            setCurrentUser(parsedUser);
          }
        } catch (err) {
          console.error("Error parsing user from AsyncStorage", err);
        }
      };
      getUser();
      setTotalLikes(item.likes || 0);
      setTotalComments(item.comments || 0);
      setReelUserProfilePic(item.profilePic || null);
    }, []);

    useEffect(() => {
      const checkLikeStatus = async () => {
        try {
          const user = await AsyncStorage.getItem("User");
          if (user) {
            const parsedUser = JSON.parse(user);
            const response = await axios.get(
              `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/reels/interaction-status/${item.reelId}/${parsedUser.userID}`
            );
            setIsLiked(response.data.data.isLiked);
            setTotalLikes(item.likes || 0);
          }
        } catch (error) {
          console.error("Error checking like status:", error);
        } finally {
          setIsLikeStatusLoading(false);
        }
      };

      checkLikeStatus();
    }, [item.reelId]);



    useEffect(() => {
      if (!video.current) return;
      if (shouldPlay) {
        video.current.playAsync();
        setItemUserID(item.userID);
      } else {
        video.current.pauseAsync();
        video.current.setPositionAsync(0);
      }
    }, [shouldPlay]);

    useEffect(() => {
      return () => {
        if (video.current) {
          video.current.pauseAsync();
          video.current.setPositionAsync(0);
        }
      };
    }, [pathname]);

    useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: status?.isPlaying ? 0 : 1, // fade out if playing
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [status?.isPlaying]);

    const showMoreOptions = () => {
      setShowMoreOptionsModal(true);
    };

    const showFetchedComments = async ({ pageNumber }) => {
      setShowCommentModal(true);

      if (pageNumber === 1) {
        setVideoComments([]); // clear existing comments on first page load
        setIsCommentLoaded(false); // optionally show shimmer/loading again
      }
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/reels/get-all-comments/${item.reelId}?page=${pageNumber}&limit=10`
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
        setCommentUserFirstName(lastJson?.userFirstName || "");
        setCommentUserID(lastJson?.userID || "");
      } catch (error) {
        console.log("Error fetching comments:", error);
      }

      setIsCommentLoaded(true);
    };

    const closeMoreOptions = () => {
      setShowMoreOptionsModal(false);
    };

      const likeReel = async (userID, reelId) => {
        // Optimistic UI update
        setIsLiked(true);
        setTotalLikes(prev => prev + 1);

        try {
          const response = await axios.post(
            `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/reels/like`,
            { userID, reelId },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          
          // Update with actual server response if needed
          console.log("Like successful:", response.data);
        } catch (error) {
          console.error("Like error:", error.response?.data || error.message);
          // Revert optimistic update if failed
          setIsLiked(false);
          setTotalLikes(prev => Math.max(0, prev - 1));
        }
      };

      const dislikeReel = async (userID, reelId) => {
        // Optimistic UI update
        setIsLiked(false);
        setTotalLikes(prev => Math.max(0, prev - 1));

        try {
          const response = await axios.post(
            `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/reels/dislike`,
            { userID, reelId },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          
          console.log("Dislike successful:", response.data);
        } catch (error) {
          console.error("Dislike error:", error.response?.data || error.message);
          // Revert optimistic update if failed
          setIsLiked(true);
          setTotalLikes(prev => prev + 1);
        }
      };

    const deleteReel = async () => {
      console.log("Clicked Delete");

      try {
        await axios.delete(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/reels/delete/${item.reelId}`
        );
        setShowMoreOptionsModal(false);
        Alert.alert("Deleted Successfully", "Your Post Deleted Successfully");
        router.replace("../pages/profile");
      } catch (error) {
        console.log("Cannot delete the reel => ", error);
      }
    };

    const ReelManagement = () => {
      if (isSaved) {
        setIsSaved(false);
      } else {
        setIsSaved(true);
      }
    };

    const getCommentTime = (timestamp) => {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return ""; // Invalid date guard

      const now = new Date();
      const seconds = Math.floor((now - date) / 1000);

      if (seconds < 60) return "Just now";
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h`;
      const days = Math.floor(hours / 24);
      return `${days}d`;
    };

    const sendComment = async (
      commentId,
      reelId,
      userID,
      commentText,
      commentedAt
    ) => {
      if (commentText.trim() === "") return;
      const now = new Date();
      const rawTimestamp = now.toISOString(); // Send this to backend
      const formattedTime = getCommentTime(now); // Display this on UI
      try {
        let data = JSON.stringify({
          commentid: commentId,
          reelId: reelId,
          userID: userID,
          commentText: commentText,
          commentedAt: rawTimestamp,
        });
        const response = await axios.post(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/reels/add-comment`,
          data,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const newComment = {
          commentId: Date.now(), // Temporarily create a random ID
          reelId,
          userID,
          commentText,
          commentedAt: formattedTime,
          userFirstName: "You", // Replace with actual name if available
          userSurname: "", // Replace if surname is available
        };
        setVideoComments((prev) => [newComment, ...prev]);
        setNewComment("");
      } catch (error) {
        console.log("Cannot comment the reel => ", error);
      }
    };

    const deleteComments = async () => {
      if (!showDeleteCommentModal) return;
      if (deleteCommentID === null) return;
      const commentId = deleteCommentID;

      try {
        let data = JSON.stringify({
          commentId: commentId,
        });
        const response = await axios.post(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/reels/delete-comment`,
          data,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (response.data.status === true) {
          // Remove the comment from state
          setVideoComments((prev) =>
            prev.filter((comment) => comment.commentId !== commentId)
          );
        } else {
          console.log("Failed to delete comment:", response.data.msg);
        }
        setDeleteCommentID(null);
      } catch (error) {
        setDeleteCommentID(null);
        console.log("Error deleting comments:", error);
      }
    };

    const handleEndPage = async () => {
      if (haveMoreComments) {
        await showFetchedComments({ pageNumber: pageNumber + 1 });
        setPageNumber((prev) => prev + 1);
      } else {
        console.log("No further comments");
        //setIsCommentLoaded(false);
      }
    };

    const showCommentOptionsModal = async () => {
      setShowDeleteCommentModal(true);
    };

    const togglePlayback = async () => {
      try {
        if (status?.isPlaying) {
          await video.current?.pauseAsync();
        } else {
          await video.current?.playAsync();
        }
      } catch (error) {
        console.log("Error toggling video", error);
      }
    };
    const videoUrl = useMemo(() => {
      return `${process.env.EXPO_PUBLIC_API_BASE_URL}/reels${item.filepath}`;
    }, [item.filepath]);
    return (
      <View style={styles.videoContainer}>
       <Pressable onPress={togglePlayback}>
          {shouldPlay && (
            <>
              <Video
                ref={video}
                source={{ uri: videoUrl }}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                useNativeControls={false}
                isLooping={true}
                shouldPlay={shouldPlay}
                onPlaybackStatusUpdate={(status) => setStatus(() => status)}
                onLoadStart={() => setIsLoading(true)}
                onLoad={() => setIsLoading(false)}
                onBuffer={({ isBuffering }) => setIsLoading(isBuffering)}
              />
            </>
          )}
      </Pressable>

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
                    : likeReel(currentUserID, item.reelId);
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
                      setReceiverId(item.userID); 
                      setShowGiftPopup(true);
                    }}
                  >
                    <Text style={styles.giftButtonText}>🎁 Send Gift</Text>
                  </TouchableOpacity>

                  <GiftCoinPopup 
                    visible={showGiftPopup}
                    onClose={() => setShowGiftPopup(false)}
                    // onSend={sendCoins}
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
                      uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${item.profilePic}`,
                    }
                  : item.userGender === 2
                  ? require("../../assets/images/profile-female.jpg")
                  : require("../../assets/images/profile.jpg")
              }
              style={styles.profileImage}
            />
          </TouchableOpacity>
            <View style={styles.profileInfo}>
               <Text style={[styles.username, {color: '#fff'}]}>
                  {item?.userName || item?.userFirstName || 'Default Text'}
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

                  {isCommentLoaded ? (
                    videoComments.length > 0 ? (
                      <FlatList
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
                                          uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${item.profilePic}`,
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
                        contentContainerStyle={{ paddingBottom: 40 }}
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
                            {"commentt"}
                          </Text>
                          <View style={styles.divider} />
                        </View>
                      </View>
                    ))
                  )}

                  <View style={styles.commentInputContainer}>
                    <Image
                      source={
                        item.profilePic
                          ? { uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${item.profilePic}` }
                          : item.userGender == 2
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
        {/*Show report and delete options modal as a popup */}
        <Modal
          transparent
          visible={showCommentsOptionsModal}
          animationType="fade"
          onRequestClose={() => {
            setDeleteCommentID(null);
            setShowCommentsOptionsModal(false);
          }}
        >
          <TouchableOpacity
            style={styles.optionsOverlay}
            activeOpacity={1}
            onPress={() => {
              setDeleteCommentID(null);
              setShowCommentsOptionsModal(false);
            }}
          >
            <View style={styles.popupContainer}>
              {isReport ? (
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => console.log("Reported successfully")}
                >
                  <MaterialIcons name="report" size={24} color="red" />
                  <Text style={styles.optionText}>Report</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => setShowDeleteCommentModal(true)}
                >
                  <MaterialCommunityIcons
                    name="delete-outline"
                    size={24}
                    color="red"
                  />
                  <Text style={styles.optionText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </Modal>

        {/*Delete comment Modal*/}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showDeleteCommentModal}
          onRequestClose={() => {
            setDeleteCommentID(null);
            setShowDeleteCommentModal(false);
          }}
        >
          <TouchableWithoutFeedback onPress={() => showCommentOptionsModal()}>
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
                        setDeleteCommentID(null);
                        setShowDeleteCommentModal(false);
                      }}
                    >
                      <Text style={styles.cancelButtons}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        deleteComments();
                        setShowDeleteCommentModal(false);
                        setShowCommentsOptionsModal(false);
                      }}
                    >
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
              <View style={styles.modalOptionRow}>
              </View>

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
  };

  const FollowButton = () => {
    const [isFollowing, setIsFollowing] = useState(false);
    return (
      <Pressable
        style={[
          styles.followButton,
          { backgroundColor: isFollowing ? "grey" : "#ffffff" },
        ]}
        onPress={() => setIsFollowing(!isFollowing)}
      >
        <Text style={styles.followButtonText}>
          {isFollowing ? "Following" : "Follow"}
        </Text>
      </Pressable>
    );
  };

  const onViewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentViewableItemIndex(viewableItems[0].index ?? 0);
    }
  };

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged },
  ]);

  const openShareOptions = async () => {
    try {
      const url = Database[currentViewableItemIndex]?.video;
      await Share.share({
        message: `Check out this cool video! ${url}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={Database}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) =>
          index === currentViewableItemIndex ? (
            <ReelItem
              item={item}
              shouldPlay={index === currentViewableItemIndex}
              openShareOptions={openShareOptions}
            />
          ) : (
            <View style={{ height }} /> // placeholder to keep the scroll height consistent
          )
        }
        pagingEnabled
        //showsVerticalScrollIndicator={false}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={height}
        windowSize={2} // Only render current + 1 screen ahead
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        removeClippedSubviews={true}
        //onEndReached={CheckLastReel}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  videoContainer: { width, height },
  video: { width: "100%", height: "92%", borderRadius: 12 },
  overlay: {
    position: "absolute",
    width,
    height,
    justifyContent: "space-between",
    padding: 24,
  },
  profileContainer: {
    position: "absolute",
    bottom: 180,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
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
    bottom: 160,
    right: 14,
    alignItems: "center",
    gap: 28,
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
    backgroundColor: '#fe2146',
    padding: 10,
    borderRadius: 20,
    alignSelf: 'center',
    marginVertical: 10,
  },
  giftButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
}});

