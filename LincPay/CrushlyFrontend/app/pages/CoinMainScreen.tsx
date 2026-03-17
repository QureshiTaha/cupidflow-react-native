import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import CustomText from "../components/CustomText";
import CustomHeader from "../components/CustomHeader";
import { useFocusEffect, useRouter } from "expo-router";
import { useUserTotalCoins, useUserTransactions } from "../api/coinApi";
import { useAppToast } from "../components/toast/AppToast";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LoadingCompo from "../components/LoadingComp";
import { getStatusIcon, getStatusTextColor } from "../const";
import { color, themeColors } from "../const/color";
import CustomErrorMessage from "../components/CustomErrorMessage";
import NoDataFound from "../components/NoDataFound";
import { useSelector } from "react-redux";
import { formatCoins, formatFullDate } from "../utils/commonFunctions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { myConsole } from "../utils/myConsole";

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
    }, [coinsRefetch, tranHistRefetch]),
  );

  return (
    <LinearGradient colors={["#ffffff", "#fff5f7"]} style={{ flex: 1 }}>
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
            colors={[themeColors.color2]}
            tintColor={themeColors.color2}
          />
        }
      >
        <View style={styles.centerContainer}>
          <LinearGradient
            colors={[themeColors.color1, themeColors.color2]}
            style={styles.circle}
          >
            <MaterialCommunityIcons name="star-circle" size={46} color="#fff" />
          </LinearGradient>
          <CustomText fontSize={28} fontWeight="700" style={{ marginTop: 12 }}>
            {formatCoins(totalCoins)}
          </CustomText>
          <CustomText fontSize={14} color="#6b7280" style={{ marginTop: 4 }}>
            Your total coins
          </CustomText>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={() => router.push("./PurchaseCoin")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[themeColors.color2, themeColors.color4]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
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
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={() => router.push("./Withdraw")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[themeColors.color1, themeColors.color2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
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
            </LinearGradient>
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
                color={themeColors.color2}
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
              const isWithdrawal =
                String(item.paymentType || "").toLowerCase() === "debit" ||
                String(item.senderId || "").toLowerCase() === "withdraw";
              const isSentByMe = item.senderId === user?.userID;
              const isOutgoing = isWithdrawal || isSentByMe;

              const icon = getStatusIcon(s) as any;
              const iconColor = getStatusTextColor(s);
              const borderColor = iconColor;
              const label = getTransactionLabel(item, user?.userID);

              return (
                <TouchableOpacity
                  key={item.coinTransactionId}
                  style={styles.transactionCard}
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
                  <LinearGradient
                    colors={[iconColor + "10", "#fff"]}
                    style={styles.cardGradient}
                  >
                    <View style={styles.cardContent}>
                      <View style={styles.cardRow}>
                        <View style={styles.cardLeft}>
                          <View
                            style={[
                              styles.iconCircle,
                              { backgroundColor: iconColor + "20" },
                            ]}
                          >
                            <Ionicons name={icon} size={20} color={iconColor} />
                          </View>
                          <View style={styles.cardMain}>
                            <CustomText
                              fontSize={16}
                              fontWeight="500"
                              numberOfLines={1}
                            >
                              {label}
                            </CustomText>
                            <CustomText
                              fontSize={12}
                              color="#6b7280"
                              style={{ marginTop: 2 }}
                            >
                              {formatFullDate(item.transactionDate)}
                            </CustomText>
                          </View>
                        </View>
                        <CustomText
                          fontSize={16}
                          fontWeight="600"
                          color={iconColor}
                        >
                          {isOutgoing ? "-" : "+"}
                          {formatCoins(item.coinCount)}
                        </CustomText>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })
          ) : (
            <NoDataFound message="No transactions found" goBack />
          )}
        </View>
      </ScrollView>
    </LinearGradient>
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
    justifyContent: "center",
    alignItems: "center",
    shadowColor: themeColors.color2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  buttonWrapper: {
    flex: 0.48,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: themeColors.color4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  historyViewAllView: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  transactionCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    backgroundColor: "#fff",
  },
  cardGradient: {
    padding: 12,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardMain: {
    flex: 1,
  },
});

export default CoinMainScreen;
