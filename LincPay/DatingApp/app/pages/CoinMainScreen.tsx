import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import CustomText from "../components/CustomText";
import CustomHeader from "../components/CustomHeader";
import { useFocusEffect, useRouter } from "expo-router";
import { useUserTotalCoins, useUserTransactions } from "../api/coinApi";
import { useAppToast } from "../components/toast/AppToast";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LoadingCompo from "../components/LoadingComp";
import { getStatusIcon, getStatusTextColor } from "../const";
import { color } from "../const/color";
import CustomErrorMessage from "../components/CustomErrorMessage";
import NoDataFound from "../components/NoDataFound";
import { useSelector } from "react-redux";
import { formatCoins, formatFullDate } from "../utils/commonFunctions";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const getTransactionLabel = (item: any, userId: string) => {
  if (item.transactionLabel) return item.transactionLabel;

  const isCredit = item.receiverId === userId;

  if (isCredit) return `Received from ${item.senderFirstName || "Unknown"}`;
  if (item.senderId?.toLowerCase().includes("withdraw")) return "Withdrawal";

  return `Sent to ${item.receiverFirstName || "Unknown"}`;
};

const CoinMainScreen: React.FC = () => {
  const router = useRouter();
  const toast = useAppToast();
  const user = useSelector((state: any) => state.auth?.user ?? null);
  const {
    data: coinsData,
    isLoading: isLoadingCoins,
    isError: isErrorCoins,
    refetch: coinsRefetch,
    isRefetching: isRefetchingCoins,
  } = useUserTotalCoins(user?.userID, 1, 10);
  const {
    data: transactionHisData,
    isLoading: transactionHisLoad,
    isError: transactionHisErr,
    refetch: tranHistRefetch,
    isRefetching: isRefetchingTxn,
  } = useUserTransactions(user?.userID);

  const totalCoins = Number(coinsData?.totalCoins ?? 0);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      let timer: any;

      (async () => {
        const shouldPoll = await AsyncStorage.getItem("pollCoinsAfterPurchase");
        if (!shouldPoll) return;

        let runs = 0;
        const tick = async () => {
          if (!isActive) return;
          runs += 1;
          await Promise.all([coinsRefetch(), tranHistRefetch()]);
          if (runs >= 3) {
            await AsyncStorage.removeItem("pollCoinsAfterPurchase");
            return;
          }
          timer = setTimeout(tick, 10_000);
        };
        tick();
      })();

      return () => {
        isActive = false;
        if (timer) clearTimeout(timer);
      };
    }, [coinsRefetch, tranHistRefetch])
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <CustomHeader title="My Coins" isBack />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(isRefetchingCoins || isRefetchingTxn)}
            onRefresh={() => {
              coinsRefetch();
              tranHistRefetch();
            }}
            colors={[color.PRIMARY_COLOR]}
            tintColor={color.PRIMARY_COLOR}
          />
        }
      >
        <View style={styles.centerContainer}>
          <View style={styles.circle}>
            <MaterialCommunityIcons
              name="star-circle"
              size={46}
              color="#facc15"
            />
          </View>
          <CustomText fontSize={28} fontWeight="700" style={{ marginTop: 12 }}>
            {formatCoins(totalCoins)}
          </CustomText>
          <CustomText fontSize={14} color="#6b7280" style={{ marginTop: 4 }}>
            Your total coins
          </CustomText>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#22c55e" }]}
            onPress={() => router.push("./PurchaseCoin")}
          >
            <Ionicons
              name="add"
              size={18}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <CustomText fontSize={16} fontWeight="600" color="#fff">
              Purchase
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#ef4444" }]}
            onPress={() => {
              router.push("./Withdraw");
            }}
          >
            <Ionicons
              name="remove"
              size={18}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <CustomText fontSize={16} fontWeight="600" color="#fff">
              Withdraw
            </CustomText>
          </TouchableOpacity>
        </View>
        <View style={{ marginTop: 24 }}>
          <View style={styles.historyViewAllView}>
            <CustomText fontSize={18} fontWeight="600">
              Transaction History
            </CustomText>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "./TransactionHistoryScreen",
                  params: { paymentType: "" },
                })
              }
            >
              <CustomText
                fontSize={14}
                fontWeight="600"
                color={color.PRIMARY_COLOR}
              >
                View All
              </CustomText>
            </TouchableOpacity>
          </View>

          {transactionHisLoad ? (
            <LoadingCompo message="Loading transactions..." />
          ) : transactionHisErr ? (
            <CustomErrorMessage
              message="Failed to load transactions"
              height={500}
              onRetry={tranHistRefetch}
            />
          ) : transactionHisData?.pages?.[0]?.data?.length > 0 ? (
            transactionHisData.pages[0].data.slice(0, 3).map((item: any) => {
              const s = String(item.status || "default").toLowerCase();
              // Outgoing if it's a withdrawal or I sent it
              const isWithdrawal =
                String(item.paymentType || "").toLowerCase() === "debit" ||
                String(item.senderId || "").toLowerCase() === "withdraw";
              const isSentByMe = item.senderId === user?.userID;
              const isOutgoing = isWithdrawal || isSentByMe;

              // Icon & color based on STATUS (consistent with history screen)
              const icon = getStatusIcon(s) as any;
              const iconColor = getStatusTextColor(s);
              const borderColor = iconColor;
              const label = getTransactionLabel(item, user?.userID);
              return (
                <TouchableOpacity
                  key={item.coinTransactionId}
                  style={[
                    styles.transactionCard,
                    { borderLeftColor: borderColor },
                  ]}
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
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name={icon}
                      size={22}
                      color={iconColor}
                      style={{ marginRight: 8 }}
                    />
                    <CustomText fontSize={16} fontWeight="500">
                      {label}
                    </CustomText>
                  </View>

                  <CustomText
                    fontSize={14}
                    color="#6b7280"
                    style={{ marginTop: 4 }}
                  >
                    {formatFullDate(item.transactionDate)}
                  </CustomText>

                  <CustomText
                    fontSize={16}
                    fontWeight="600"
                    color={borderColor}
                    style={{ marginTop: 6 }}
                  >
                    {isOutgoing ? "-" : "+"}
                    {formatCoins(item.coinCount)}
                  </CustomText>
                </TouchableOpacity>
              );
            })
          ) : (
            <NoDataFound message="No transactions found" goBack />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  circle: {
    height: 80,
    width: 80,
    borderRadius: 40,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
  historyViewAllView: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 5,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
});

export default CoinMainScreen;
