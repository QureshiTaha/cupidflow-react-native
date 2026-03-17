import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Platform,
} from "react-native";
import { ResizeMode } from "expo-av";
import { useRouter } from "expo-router";
import axios from "axios";
import { myConsole } from "../utils/myConsole";
import { LinearGradient } from "expo-linear-gradient";
import { themeColors } from "../const/color";

const { width: screenWidth } = Dimensions.get("window");
const cardWidth = screenWidth / 2 - 15;

const VideoCard = ({ item }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        router.push({
          pathname: "../../pages/reels",
          params: { reel: JSON.stringify(item) },
        });
      }}
      style={styles.cardTouchable}
    >
      <LinearGradient
        colors={[themeColors.color1 + "20", themeColors.color2 + "20"]}
        style={styles.card}
      >
        <Image
          resizeMode={ResizeMode.COVER}
          source={{
            uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${item.filepath}-thumbnail.png?token`,
          }}
          style={styles.image}
        />

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.profileOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <Image
            source={{
              uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${item.profilePic}?token`,
            }}
            style={styles.profilePic}
          />
          <Text style={styles.username} numberOfLines={1}>
            {item.userName}
          </Text>
        </LinearGradient>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const VideoList = (props) => {
  const [Database, setDatabase] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [haveMoreReels, setHaveMoreReels] = useState(false);
  const [isFirstLoaded, setIsFirstLoaded] = useState(false);
  const router = useRouter();

  // Fetch data once on mount
  useEffect(() => {
    if (props.userID === undefined) return;

    const initialFetch = async () => {
      if (props.userID) {
        await fetchReel({ userID: props.userID, pageNumber: 1 });
      } else {
        setIsFirstLoaded(true);
        await fetchReel({ pageNumber: 1 });
      }
    };

    initialFetch();
  }, [props.userID]);

  const fetchReel = useCallback(async ({ userID = null, pageNumber = 1 }) => {
    const API = userID
      ? `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/reels/by-userID/${userID}?page=${pageNumber}&limit=10`
      : `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/reels/get-latest?page=${pageNumber}&limit=10`;

    try {
      const response = await axios.get(API);
      const data = response.data.data;

      if (data.length) {
        if (pageNumber === 1) {
          setDatabase([...data]);
          setIsFirstLoaded(false);
        } else {
          setDatabase((prev) => {
            const ids = new Set(prev.map((item) => item.id));
            const newItems = data.filter((item) => !ids.has(item.id));
            return [...prev, ...newItems];
          });
        }

        const lastJson = data[data.length - 1];
        setHaveMoreReels(lastJson?.haveMore ?? false);
      } else {
        setDatabase([]);
        setHaveMoreReels(false);
      }
    } catch (error) {
      console.log("Fetch error", error);
    }
  }, []);

  const CheckLastReel = useCallback(() => {
    if (haveMoreReels) {
      const nextPage = pageNumber + 1;
      setPageNumber(nextPage);

      props.userID
        ? fetchReel({ userID: props.userID, pageNumber: nextPage })
        : fetchReel({ pageNumber: nextPage });
    }
  }, [haveMoreReels, pageNumber, props.userID, fetchReel]);

  return (
    <>
      {Database.length > 0 ? (
        <FlatList
          style={styles.container}
          data={Database}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          horizontal={false}
          columnWrapperStyle={styles.columnWrapper}
          keyExtractor={(item, index) => `${item.id ?? "no-id"}-${index}`}
          renderItem={({ item }) => <VideoCard item={item} />}
          onEndReached={CheckLastReel}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.centeredContainer}>
          <Image
            source={require("../../assets/images/noDataFound.png")}
            style={styles.noDataImage}
          />
          <Text style={styles.postText}>No Posts available</Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  listContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 80,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTouchable: {
    width: cardWidth,
    height: 220,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  profileOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  profilePic: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FFF",
    marginRight: 6,
  },
  username: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  noDataImage: {
    height: 120,
    width: 160,
  },
  postText: {
    marginTop: 8,
    fontSize: 12,
    color: themeColors.color2,
  },
});

export default VideoList;
