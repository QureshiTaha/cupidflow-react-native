import { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams } from "expo-router";
import CustomText from "../components/CustomText";
import { getStatusTextColor, getTransactionColor } from "../const";
import { formatFullDate } from "../utils/commonFunctions";

const TransactionDetailsScreen = () => {
  const router = useRouter();
  const {
    coinTransactionId,
    senderFirstName,
    senderSurname,
    receiverFirstName,
    receiverSurname,
    transactionDate,
    coinCount,
    isCredit,
    paymentStatus,
  } = useLocalSearchParams();

  const credit = isCredit === "true";
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const data = {
      coinTransactionId,
      senderName: `${senderFirstName || ""} ${senderSurname || ""}`.trim(),
      receiverName: `${receiverFirstName || ""} ${
        receiverSurname || ""
      }`.trim(),
      transactionDate,
      coinCount,
    };
    setDetails(data);
    setLoading(false);
  }, []);

  if (loading || !details) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e91e63" />
      </View>
    );
  }

  const txType = credit ? "received" : "sent";
  const normalizedStatus =
    (paymentStatus as string)?.toLowerCase?.() || "default";
  const statusColor = getTransactionColor(txType, normalizedStatus);
  const statusTextColor = getStatusTextColor(normalizedStatus);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>
        <CustomText style={styles.headerTitle}>Transaction Details</CustomText>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.card}>
          <CustomText style={styles.cardTitle}>Transaction ID</CustomText>
          <CustomText style={styles.cardValue}>
            {details.coinTransactionId}
          </CustomText>
          <View style={styles.divider} />
          <CustomText style={styles.cardTitle}>Sender</CustomText>
          <CustomText style={styles.cardValue}>
            {details.senderName || "-"}
          </CustomText>
          <View style={styles.divider} />
          <CustomText style={styles.cardTitle}>Receiver</CustomText>
          <CustomText style={styles.cardValue}>
            {details.receiverName || "-"}
          </CustomText>
          <View style={styles.divider} />
          <CustomText style={styles.cardTitle}>Status</CustomText>
          <CustomText style={[styles.cardValue, { color: statusTextColor }]}>
            {paymentStatus || "-"}
          </CustomText>
          <View style={styles.divider} />
          <CustomText style={styles.cardTitle}>Coins</CustomText>
          <CustomText style={[styles.cardValue, { color: statusColor }]}>
            {credit ? "+" : "-"}
            {details.coinCount} Coin{details.coinCount > 1 ? "s" : ""}
          </CustomText>
          <View style={styles.divider} />
          <CustomText style={styles.cardTitle}>Date & Time</CustomText>
          <CustomText style={styles.cardValue}>
            {formatFullDate(details.transactionDate)}
          </CustomText>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    elevation: 3,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default TransactionDetailsScreen;
