import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

const mockData = [

];

// -------------------- Card Component --------------------
const BidCard = ({ item }) => {
  const [yourBid, setYourBid] = useState(item.yourBid);
  const [addPressed, setAddPressed] = useState(false);
  const [removePressed, setRemovePressed] = useState(false);

  const increaseBid = () => setYourBid((prev) => prev + 50);
  const decreaseBid = () => {
    if (yourBid > item.bid) setYourBid((prev) => prev - 50);
  };

  return (
    <View style={styles.card}>
      <Image source={item.image} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>

        <View style={styles.bidRow}>
          <View style={styles.bidStyleRow}>
            <TouchableOpacity
              onPressIn={() => setAddPressed(true)}
              onPressOut={() => setAddPressed(false)}
              onPress={increaseBid}
            >
              <Ionicons
                name={addPressed ? "add-circle" : "add-circle-outline"}
                size={22}
                color="#facc15"
              />
            </TouchableOpacity>

            <Text style={styles.yourBid}>🪙 {yourBid}</Text>

            <TouchableOpacity
              onPressIn={() => setRemovePressed(true)}
              onPressOut={() => setRemovePressed(false)}
              onPress={decreaseBid}
            >
              <MaterialIcons
                name={removePressed ? "remove-circle" : "remove-circle-outline"}
                size={24}
                color="#facc15"
              />
            </TouchableOpacity>
          </View>

          <LinearGradient
            colors={["#f472b6", "#ec4899"]}
            style={styles.bidButton}
          >
            <Text style={styles.bidButtonText}>Bid</Text>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
};

// -------------------- AuctionScreen --------------------
export default function AuctionScreen() {
  const [timeLeft, setTimeLeft] = useState(13 * 3600 + 40 * 60 + 31);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const hours = String(Math.floor(secs / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
    const seconds = String(secs % 60).padStart(2, "0");
    return `00 : ${hours} : ${minutes} : ${seconds}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.coins}>
          <Text style={styles.coinText}>🪙 10</Text>
          <TouchableOpacity>
            <Ionicons name="add-circle" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Title and Timer */}
      <Text style={styles.title}>Formula 1 Auction!</Text>
      <Text style={styles.timer}>{formatTime(timeLeft)}</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Text style={[styles.tab, styles.activeTab]}>All Cards</Text>
      </View>

      {/* Cards */}
      <FlatList
        data={mockData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BidCard item={item} />}
      />
    </SafeAreaView>
  );
}

// -------------------- Styles --------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coins: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coinText: {
    color: "#fff",
    fontSize: 16,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    textAlign: "center",
    fontWeight: "bold",
    marginVertical: 10,
  },
  timer: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 12,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  tab: {
    color: "#888",
    fontSize: 15,
    paddingVertical: 6,
  },
  activeTab: {
    color: "#fff",
    borderBottomColor: "#fff",
    borderBottomWidth: 2,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    alignItems: "center",
  },
  cardImage: {
    width: 70,
    height: 100,
    borderRadius: 10,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  bidText: {
    color: "#facc15",
    marginVertical: 6,
    fontSize: 15,
  },
  bidRow: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bidStyleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  yourBid: {
    color: "#facc15",
    fontSize: 15,
    marginHorizontal: 10,
  },
  bidButton: {
    paddingVertical: 6,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  bidButtonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
});
