import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";
import { ResizeMode } from "expo-av";
import { useRouter } from "expo-router";
import axios from "axios";

const VideoCard = ({ item }) => {
  const router = useRouter();

  return (
    <View style={styles.card}>
      <Image
        onTouchEndCapture={() => {
          router.push({
            pathname: "../../pages/reels",
            params: { reel: JSON.stringify(item) },
          });
        }}
        resizeMode={ResizeMode.COVER}
        source={{
          uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${item.filepath}-thumbnail.png?token`,
        }}
        style={styles.image}
      />
    </View>
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
    // only fetch if userID is non-null or explicitly undefined (never changing later)
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
  }, [props.userID, fetchReel]);

  const fetchReel = useCallback(
    async ({ userID = null, pageNumber = 1 }) => {
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
    },
    [isFirstLoaded] // include all external dependencies
  );

  const CheckLastReel = useCallback(() => {
    if (haveMoreReels) {
      const nextPage = pageNumber + 1;
      setPageNumber(nextPage);

      props.userID
        ? fetchReel({ userID: props.userID, pageNumber: nextPage })
        : fetchReel({ pageNumber: nextPage });
    }
  }, [haveMoreReels, pageNumber, props.userID, fetchReel]);



  const screenWidth = Dimensions.get("screen").width;

  return (
    <>
      {Database.length > 0 ? (
        <>
          <FlatList
            style={styles.container}
            width={screenWidth}
            data={Database}
            numColumns={2}
            contentContainerStyle={{ padding: 0 }}
            horizontal={false}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            keyExtractor={(item, index) => `${item.id ?? "no-id"}-${index}`}
            renderItem={({ item }) => <VideoCard item={item} />}
            onEndReached={CheckLastReel}
            onEndReachedThreshold={0.5}
          />
        </>
      ) : (
        <View style={styles.centeredContainer}>
          <Text style={styles.postText}>No Posts available</Text>
        </View>
      )}
    </>
  );
};

const width = Dimensions.get("screen").width / 2;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 10,
  },
  card: {
    width: width - 15,
    height: 300,
    padding: 0,
    margin: 2,
    borderRadius: 50,
    backgroundColor: "#f5f5f5",
  },
  text: {
    fontWeight: "bold",
    textAlign: "center",
    numberOfLines: 1, // Use in JSX, not style
    ellipsizeMode: "tail", // Optional: adds ... if text overflows
  },
  centeredContainer: {
    position: "fixed",
    justifyContent: "center", // Vertical center
    alignItems: "center", // Horizontal center
    height: "50%", // Full height
  },

  postText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: 5,
  },
});

export default VideoList;
