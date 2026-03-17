import { useState } from "react";
import {
  StyleSheet,
  Linking,
  Alert,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useToast } from "react-native-toast-notifications";
import { useSelector } from "react-redux";
import { processPayment } from "../api/paymentApi";
import { useAllOffers } from "../api/coinApi";
import { myConsole } from "../utils/myConsole";
import CustomHeader from "../components/CustomHeader";
import { color } from "../const/color";
import { useQueryClient } from "@tanstack/react-query";
import Ionicons from "react-native-vector-icons/Ionicons"; // Added for icons

const PurchaseCoin = () => {
  const toast = useToast();
  const user = useSelector((state: any) => state.auth?.user ?? null);
  const [processing, setProcessing] = useState(false);

  const { data: offData, isLoading, isError } = useAllOffers();

  const queryClient = useQueryClient();

  const handleOfferClick = async (offer: any) => {
    try {
      setProcessing(true);

      const paymentData = {
        emailId: user?.userEmail,
        userID: user?.userID,
        offerId: offer.offerId,
      };

      const gatewayRes = await processPayment(paymentData);

      if (!gatewayRes?.responseData?.qrString) {
        throw new Error(gatewayRes?.message || "Payment URL not received");
      }

      myConsole(
        "gatewayRes.responseData.qrString",
        gatewayRes.responseData.qrString,
      );

      // 🔹 Encode UPI URL to handle spaces & special characters
      const upiUrl = encodeURI(gatewayRes.responseData.qrString);

      try {
        await Linking.openURL(upiUrl);

        toast.show("Please complete payment in your UPI app", {
          type: "warning",
        });

        // 🔹 Trigger refetch after returning from UPI app
        queryClient.invalidateQueries({ queryKey: ["user-total-coins"] });
        queryClient.invalidateQueries({ queryKey: ["user-transactions"] });

        await AsyncStorage.setItem("pollCoinsAfterPurchase", "1");
      } catch (linkError) {
        Alert.alert(
          "UPI App Required",
          "No UPI app found. Please install Google Pay, PhonePe, or Paytm.",
        );
      }
    } catch (error: any) {
      let displayMessage =
        error?.message || "Something went wrong. Please try again.";

      if (error?.response?.status === 400) {
        displayMessage = "Invalid payment data. Please check your details.";
      }

      console.log("errrrosrr", error);

      toast.show(displayMessage, {
        type: "danger",
        duration: 5000,
        placement: "top",
      });
    } finally {
      setProcessing(false);
    }
  };

  const renderOffer = ({ item }: { item: any }) => {
    // Calculate savings percentage (optional UI enhancement, no logic change)
    const savings = item.actualPrice - item.offerPrice;
    const savingsPercent = ((savings / item.actualPrice) * 100).toFixed(0);

    return (
      <TouchableOpacity
        style={[styles.card, processing && styles.cardDisabled]}
        onPress={() => handleOfferClick(item)}
        disabled={processing}
        activeOpacity={0.8}
      >
        <View style={styles.coinRow}>
          <Ionicons name="star" size={24} color="#FFD700" />
          <Text style={styles.coins}>{item.coinAmount}</Text>
        </View>
        <Text style={styles.coinLabel}>Coins</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.offerPrice}>₹{item.offerPrice}</Text>
          <Text style={styles.actualPrice}>₹{item.actualPrice}</Text>
        </View>

        {savings > 0 && (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>Save {savingsPercent}%</Text>
          </View>
        )}

        {processing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={color.PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading offers...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load offers</Text>
        <Text style={styles.errorSubtext}>Please try again later</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Available Coin Offers" isBack />

      {!offData?.data || offData.data.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="pricetag-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No offers available</Text>
        </View>
      ) : (
        <FlatList
          data={offData.data}
          keyExtractor={(item) => item.offerId}
          renderItem={renderOffer}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    width: "48%", // Slightly adjusted for better spacing
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    position: "relative",
    overflow: "hidden",
  },
  cardDisabled: {
    opacity: 0.7,
  },
  coinRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  coins: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1e293b",
    marginLeft: 6,
  },
  coinLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
    fontWeight: "500",
  },
  priceContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  offerPrice: {
    fontSize: 22,
    fontWeight: "700",
    color: color.PRIMARY_COLOR,
    lineHeight: 28,
  },
  actualPrice: {
    fontSize: 14,
    color: "#94a3b8",
    textDecorationLine: "line-through",
    marginTop: 2,
  },
  savingsBadge: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 30,
    marginTop: 6,
  },
  savingsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  processingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "600",
    color: "#ef4444",
  },
  errorSubtext: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 4,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#94a3b8",
    fontWeight: "500",
  },
});

export default PurchaseCoin;
