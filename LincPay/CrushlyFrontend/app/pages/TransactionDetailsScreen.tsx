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

  // Format coin count with sign
  const coinDisplay = `${credit ? "+" : "-"}${details.coinCount}`;
  const coinLabel = `Coin${details.coinCount > 1 ? "s" : ""}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <CustomText style={styles.headerTitle}>Transaction Details</CustomText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View style={[styles.summaryCard, { borderLeftColor: statusColor }]}>
          <View style={styles.coinRow}>
            <Icon
              name={credit ? "arrow-downward" : "arrow-upward"}
              size={28}
              color={statusColor}
            />
            <CustomText style={[styles.coinAmount, { color: statusColor }]}>
              {coinDisplay}
            </CustomText>
            <CustomText style={[styles.coinUnit, { color: statusColor }]}>
              {coinLabel}
            </CustomText>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusTextColor + "20" },
            ]}
          >
            <CustomText style={[styles.statusText, { color: statusTextColor }]}>
              {paymentStatus || "Unknown"}
            </CustomText>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          {/* Transaction ID */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Icon name="fingerprint" size={20} color="#666" />
            </View>
            <View style={styles.detailContent}>
              <CustomText style={styles.detailLabel}>Transaction ID</CustomText>
              <CustomText
                style={styles.detailValue}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {details.coinTransactionId}
              </CustomText>
            </View>
          </View>

          <View style={styles.separator} />

          {/* Sender */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Icon name="person-outline" size={20} color="#666" />
            </View>
            <View style={styles.detailContent}>
              <CustomText style={styles.detailLabel}>Sender</CustomText>
              <CustomText style={styles.detailValue}>
                {details.senderName || "-"}
              </CustomText>
            </View>
          </View>

          <View style={styles.separator} />

          {/* Receiver */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Icon name="person-outline" size={20} color="#666" />
            </View>
            <View style={styles.detailContent}>
              <CustomText style={styles.detailLabel}>Receiver</CustomText>
              <CustomText style={styles.detailValue}>
                {details.receiverName || "-"}
              </CustomText>
            </View>
          </View>

          <View style={styles.separator} />

          {/* Date & Time */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Icon name="calendar-today" size={20} color="#666" />
            </View>
            <View style={styles.detailContent}>
              <CustomText style={styles.detailLabel}>Date & Time</CustomText>
              <CustomText style={styles.detailValue}>
                {formatFullDate(details.transactionDate)}
              </CustomText>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  coinRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
  },
  coinAmount: {
    fontSize: 32,
    fontWeight: "bold",
    marginLeft: 8,
    marginRight: 4,
  },
  coinUnit: {
    fontSize: 16,
    fontWeight: "500",
    color: "#555",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  detailIcon: {
    width: 40,
    alignItems: "center",
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: "#777",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#222",
  },
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginLeft: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
});

export default TransactionDetailsScreen;
