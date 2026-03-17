import { useEffect, useState } from "react";
import {
  StyleSheet,
  Linking,
  Alert,
  View,
  Text,
  FlatList,
  TouchableOpacity,
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

      const upiUrl = gatewayRes.responseData.qrString;
      const canOpen = await Linking.canOpenURL(upiUrl);
      if (!canOpen) {
        Alert.alert(
          "UPI App Required",
          "Please install a UPI app to continue",
          [
            {
              text: "Install",
              onPress: () =>
                Linking.openURL("https://play.google.com/store/search?q=upi"),
            },
            { text: "Cancel" },
          ]
        );
        return;
      }

      await Linking.openURL(upiUrl);
      toast.show("Please wait while we verify your payment...", {
        type: "warning",
      });
      queryClient.invalidateQueries({ queryKey: ["user-total-coins"] });
      queryClient.invalidateQueries({ queryKey: ["user-transactions"] });
      await AsyncStorage.setItem("pollCoinsAfterPurchase", "1");
    } catch (error: any) {
      let displayMessage = error.message;
      if (error.response?.status === 400) {
        displayMessage = "Invalid payment data. Please check your details";
      }

      toast.show(displayMessage, {
        type: "danger",
        duration: 5000,
        placement: "top",
      });
    } finally {
      setProcessing(false);
    }
  };

  const renderOffer = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleOfferClick(item)}
      disabled={processing}
    >
      <Text style={styles.coins}>{item.coinAmount} Coins</Text>
      <Text style={styles.offerPrice}>₹ {item.offerPrice}</Text>
      <Text style={styles.actualPrice}>₹ {item.actualPrice}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <CustomHeader title="Available Coin Offers" isBack />

      {!offData?.data || offData?.data.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No offers available</Text>
        </View>
      ) : (
        <FlatList
          data={offData?.data}
          keyExtractor={(item) => item.offerId}
          renderItem={renderOffer}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row}
        />
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContainer: {
    padding: 26,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    width: "46%",
    aspectRatio: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  coins: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#222",
  },
  offerPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: color.PRIMARY_COLOR,
    marginBottom: 4,
  },
  actualPrice: {
    fontSize: 14,
    color: "#999",
    textDecorationLine: "line-through",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#444",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});

export default PurchaseCoin;
