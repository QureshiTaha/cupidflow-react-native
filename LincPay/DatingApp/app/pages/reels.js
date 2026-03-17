import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Dimensions, StyleSheet, FlatList } from 'react-native';
import * as FileSystem from 'expo-file-system';
import Header from '../components/header';
import Footer from '../components/footer';
import { router, useLocalSearchParams, useRouter } from "expo-router";
import ReelItem from '../components/ReelItem';
import axios from 'axios';
import { useSelector } from "react-redux";
import { StatusBar } from 'expo-status-bar';
const { width, height } = Dimensions.get("window");

const Reels = (props) => {
  const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "https://api-dating-app.iceweb.in";
  const paramsData = useLocalSearchParams();
  const [pageNumber, setPageNumber] = useState(1);
  const [currentViewableItemIndex, setCurrentViewableItemIndex] = useState(0);
  const [haveMoreReels, setHaveMoreReels] = useState(false);
  const [Database, setDatabase] = useState(paramsData.reel ? [JSON.parse(paramsData.reel)] : []);
  const REELS_CACHE_DIR = FileSystem.cacheDirectory + 'reels/';
  const MAX_CACHE_FILES = 4;
  // useEffect(() => {
  //   if (paramsData.reel) {
  //     setDatabase([JSON.parse(paramsData.reel)]);
  //   }
  // }, [paramsData]);

  const currentUser = useSelector((state) => state.auth?.user ?? null);

  // console.log("currentUser", currentUser);

  const fetchReels = async ({ pageNumber }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/v1/reels/get-latest?page=${pageNumber}&limit=10`
      );
      const fetchedReels = response.data.data;
      const lastJson = fetchedReels[fetchedReels.length - 1];
      setHaveMoreReels(lastJson?.haveMore ?? false);

      if (paramsData.reel) {
        // Remove If Already Exists in Database
        const existingIds = new Set(Database.map((c) => c.reelId));
        const filtered = fetchedReels.filter((c) => !existingIds.has(c.reelId));
        // setDatabase([...Database, ...filtered]); 
        setDatabase((prev) => [...prev, ...filtered]);
      } else {
        setDatabase((prev) => [...prev, ...fetchedReels]);
      }
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


  useEffect(() => {
    let isCancelled = false;


    const manageCache = async (remoteUri, filename, fileUri) => {
      try {
        await FileSystem.makeDirectoryAsync(REELS_CACHE_DIR, { intermediates: true });

        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (!fileInfo.exists) {
          console.log('🔽 Downloading:', filename);
          await FileSystem.downloadAsync(remoteUri, fileUri);
        } else {
          console.log('✅ Already cached:', filename);
        }



        // Manage cache files
        const allFiles = await FileSystem.readDirectoryAsync(REELS_CACHE_DIR);
        if (allFiles.length > MAX_CACHE_FILES) {
          const fileStats = await Promise.all(
            allFiles.map(async (file) => {
              const info = await FileSystem.getInfoAsync(`${REELS_CACHE_DIR}${file}`);
              return { file, mtime: info.modificationTime || 0 };
            })
          );

          // Sort by modification time (oldest first)
          const sorted = fileStats.sort((a, b) => a.mtime - b.mtime);

          // Delete extra files
          const excessFiles = sorted.slice(0, allFiles.length - MAX_CACHE_FILES);
          for (const f of excessFiles) {
            await FileSystem.deleteAsync(`${REELS_CACHE_DIR}${f.file}`, { idempotent: true });
            console.log('🗑️🗑️🗑️ Removed old cached video:', f.file);
          }
        }
      } catch (err) {
        console.error('❌ Cache error:', err);
      }
    };

    for (let i = 0; i < Database.length; i++) {
      if (i === currentViewableItemIndex + 2 || i === currentViewableItemIndex + 1) {
        const remoteUri = `${BASE_URL}/reels${Database[i].filepath}`;
        const filename = Database[i].filepath.replace(/\//g, '_');
        const fileUri = `${REELS_CACHE_DIR}${filename}`;
        manageCache(remoteUri, filename, fileUri);
      }
    }

    return () => {
      isCancelled = true;
    };
  }, [currentViewableItemIndex]);
  return (
    <View
      style={{
        width: width,
        flex: 1,
        backgroundColor: 'white',
        position: 'relative',
        backgroundColor: 'white',
      }}>
      <Header isTransparent={true} />
      <View style={styles.container}>
        <FlatList
          
          data={Database}
          onEndReached={CheckLastReel}
          pagingEnabled
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          keyExtractor={(item, index) => index.toString()}
          extraData={currentViewableItemIndex}
          renderItem={({ item, index }) =>
            index === currentViewableItemIndex ? (
              <ReelItem
                item={item}
                shouldPlay={index === currentViewableItemIndex}
                index={index}
                currentUser={currentUser}
                currentUserID={currentUser?.userID}
                currentIndex={currentViewableItemIndex}
                isLastItem={index === Database.length - 1}
              />
            ) : (
              <View style={{ height }} /> // placeholder to keep the scroll height consistent
            )
          }
          showsVerticalScrollIndicator={false}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 80,
          }}
          onViewableItemsChanged={useRef(({ viewableItems }) => {
            if (viewableItems.length > 0) {
              setCurrentViewableItemIndex(viewableItems[0].index ?? 0);
            }
          }).current}
          windowSize={2} // Only render current + 1 screen ahead
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          removeClippedSubviews={true}
          onEndReachedThreshold={0.5}
        />
      </View>

      <Footer />
    </View>
  );
};

export default Reels;

const styles = StyleSheet.create({
  VideoContainer: {
    height,
    backgroundColor: 'black',
  },
  video: {
    width: '100%',
    height:height,
  },
  container: { flex: 1, backgroundColor: "#000" },
});