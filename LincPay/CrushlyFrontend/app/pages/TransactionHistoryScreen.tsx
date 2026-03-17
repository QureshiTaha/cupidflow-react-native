import React, { useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import CustomHeader from "../components/CustomHeader";
import { useUserTransactions } from "../api/coinApi";
import CustomText from "../components/CustomText";
import { useSelector } from "react-redux";
import { formatFullDate } from "../utils/commonFunctions";
import { color, themeColors } from "../const/color";
import { sizes } from "../const";

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

  const paymentTypeStr = Array.isArray(paymentType) ? "" : (paymentType ?? "");
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch: txnRefetch,
    isRefetching: isRefetchingTxn,
  } = useUserTransactions(user?.userID, paymentTypeStr);

  const transactions = useMemo(() => {
    const map = new Map<string, any>();

    data?.pages?.forEach((page: any) => {
      page?.data?.forEach((txn: any) => {
        if (!map.has(txn.coinTransactionId)) {
          map.set(txn.coinTransactionId, txn);
        }
      });
    });

    return Array.from(map.values());
  }, [data]);

  // console.log(
  //   "ALL TRANSACTIONS IDS =>",
  //   transactions.map((t: any) => t.coinTransactionId),
  // );

  const renderItem = ({ item, index }: any) => {
    // console.log(
    //   "RENDER ITEM => index:",
    //   index,
    //   "coinTransactionId:",
    //   item.coinTransactionId,
    // );
    const s = String(item.status || "").toLowerCase();
    const statusColor = statusToColor(s);
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
        style={[styles.item, { borderLeftColor: statusColor }]}
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
        activeOpacity={0.7}
      >
        <View style={styles.row}>
          <View style={styles.leftContainer}>
            <Ionicons
              name={icon as any}
              size={20}
              color={statusColor}
              style={styles.icon}
            />
            <CustomText style={[styles.amount, { color: statusColor }]}>
              {sign}
              {coins} Coin{coins > 1 ? "s" : ""}
            </CustomText>
          </View>
          <View style={styles.rightContainer}>
            <CustomText style={styles.date}>
              {formatFullDate(item.transactionDate)}
            </CustomText>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </View>

        <CustomText style={styles.message} numberOfLines={1}>
          {item.transactionLabel}
        </CustomText>
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
        keyExtractor={(item, index) => `${item.coinTransactionId}-${index}`}
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
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              height: sizes.height - 80,
            }}
          >
            <Image
              source={require("../../assets/images/noDataFound.png")}
              style={{ height: 160, width: 200 }}
            />
            <CustomText style={styles.noData}>
              No transactions found.
            </CustomText>
          </View>
        }
        contentContainerStyle={{ padding: 16 }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ padding: 16 }}>
              <ActivityIndicator size="small" color="#e91e63" />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  item: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  date: {
    fontSize: 12,
    color: "#777",
    marginRight: 4,
  },
  message: {
    fontSize: 14,
    marginTop: 6,
    color: "#444",
  },
  noData: {
    textAlign: "center",
    marginTop: 16,
    color: themeColors.color1,
  },
});

export default TransactionHistoryScreen;
