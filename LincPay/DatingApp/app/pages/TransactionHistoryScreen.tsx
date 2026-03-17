import React, { useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import CustomHeader from "../components/CustomHeader";
import { useUserTransactions } from "../api/coinApi";
import CustomText from "../components/CustomText";
import { useSelector } from "react-redux";
import { formatFullDate } from "../utils/commonFunctions";
import { color } from "../const/color";

const STATUS_COLORS: Record<string, string> = {
  success: "#22c55e",
  completed: "#22c55e",
  "withdraw-success": "#22c55e",
  failed: "#ef4444",
  "withdraw-failed": "#ef4444",
  processing: "#f59e0b",
  pending: "#f59e0b",
  cancelled: "#9ca3af",
  default: "#6b7280",
};

const statusToIcon = (status?: string) => {
  const s = String(status || "default").toLowerCase();
  if (s === "success" || s === "completed" || s === "withdraw-success")
    return "checkmark-circle";
  if (s === "failed" || s === "withdraw-failed") return "close-circle";
  if (s === "processing" || s === "pending") return "time";
  if (s === "cancelled") return "ban";
  return "help-circle";
};

const statusToColor = (status?: string) => {
  const s = String(status || "default").toLowerCase();
  return STATUS_COLORS[s] ?? STATUS_COLORS.default;
};

const TransactionHistoryScreen = () => {
  const router = useRouter();
  const { paymentType } = useLocalSearchParams();
  const user = useSelector((state: any) => state.auth?.user ?? null);

  const paymentTypeStr = Array.isArray(paymentType) ? "" : paymentType ?? "";
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch: txnRefetch,
    isRefetching: isRefetchingTxn,
  } = useUserTransactions(user?.userID, paymentTypeStr);

  const transactions = useMemo(
    () => data?.pages.flatMap((page: any) => page?.data || []) ?? [],
    [data]
  );

  const renderItem = ({ item }: any) => {
    const s = String(item.status || "").toLowerCase();
    const color = statusToColor(s);
    const icon = statusToIcon(s);

    const isWithdrawal =
      String(item.paymentType || "").toLowerCase() === "debit" ||
      String(item.senderId || "").toLowerCase() === "withdraw";
    const isSentByMe = item.senderId === user?.userID;
    const isOutgoing = isWithdrawal || isSentByMe;

    const sign = isOutgoing ? "-" : "+";
    const coins = Number(item.coinCount) || 0;

    return (
      <TouchableOpacity
        style={[styles.item, { borderLeftColor: color }]}
        onPress={() =>
          router.push({
            pathname: "./TransactionDetailsScreen",
            params: {
              coinTransactionId: item.coinTransactionId,
              senderId: item.senderId,
              senderFirstName: item.senderFirstName,
              senderSurname: item.senderSurname,
              receiverId: item.receiverId,
              receiverFirstName: item.receiverFirstName,
              receiverSurname: item.receiverSurname,
              transactionDate: item.transactionDate,
              coinCount: item.coinCount,
              isCredit: isOutgoing ? "false" : "true",
              paymentStatus: item.status,
            },
          })
        }
      >
        <View style={styles.row}>
          <Ionicons
            name={icon as any}
            size={20}
            color={color}
            style={{ marginRight: 8 }}
          />
          <CustomText style={[styles.amount, { color }]}>
            {sign}
            {coins} Coin{coins > 1 ? "s" : ""}
          </CustomText>
        </View>

        <CustomText style={styles.date}>
          {formatFullDate(item.transactionDate)}
        </CustomText>

        <CustomText style={styles.message}>{item.transactionLabel}</CustomText>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#e91e63" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Transaction History" isBack />
      <FlatList
        data={transactions}
        keyExtractor={(item) => String(item.coinTransactionId)}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(isRefetchingTxn)}
            onRefresh={txnRefetch}
            colors={[color.PRIMARY_COLOR]}
            tintColor={color.PRIMARY_COLOR}
          />
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <CustomText style={styles.noData}>No transactions found.</CustomText>
        }
        contentContainerStyle={{ padding: 12 }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ padding: 10 }}>
              <ActivityIndicator size="small" color="#e91e63" />
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  item: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
    elevation: 2,
    borderLeftWidth: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  amount: { fontSize: 16, fontWeight: "bold" },
  date: { fontSize: 12, color: "#555", marginTop: 4 },
  message: { fontSize: 14, marginTop: 4, color: "#333" },
  noData: { textAlign: "center", marginTop: 20, color: "#888" },
});

export default TransactionHistoryScreen;
