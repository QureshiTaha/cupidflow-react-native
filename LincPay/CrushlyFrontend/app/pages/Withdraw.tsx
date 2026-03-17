import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
} from "react-native";
import Slider from "@react-native-community/slider";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import CustomHeader from "../components/CustomHeader";
import CustomText from "../components/CustomText";
import { color } from "../const/color";
import { useUserTotalCoins, useUserTransactions } from "../api/coinApi";
import CustomModal from "../components/CustomModal";
import CustomTextInput from "../components/CustomTextInput";
import { Formik } from "formik";
import * as Yup from "yup";
import {
  addPayoutDetails,
  updatePayoutDetails,
  usePayoutDetails,
} from "../api/userApi";
import { useQueryClient } from "@tanstack/react-query";
import { useAppToast } from "../components/toast/AppToast";
import {
  getStatusIcon,
  getStatusTextColor,
  getTransactionColor,
} from "../const";
import { initiatePayout } from "../api/paymentApi";
import { getTransactionLabel } from "./CoinMainScreen";
import moment from "moment";
import NoDataFound from "../components/NoDataFound";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { formatCoins } from "../utils/commonFunctions";
import { myConsole } from "../utils/myConsole";

const WithdrawScreen = () => {
  const router = useRouter();
  const [coins, setCoins] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const user = useSelector((state: any) => state.auth?.user ?? null);
  const {
    data: totalCoins,
    isLoading: isLoadingCoins,
    refetch: coinsRefetch,
    isRefetching: isRefetchingCoins,
  } = useUserTotalCoins(user?.userID, 1, 10);

  const { data: payoutDetails } = usePayoutDetails(user?.userID);
  const isBankDetailsAdded = !!payoutDetails?.data;

  const {
    data: transactions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: txnRefetch,
    isRefetching: isRefetchingTxn,
  } = useUserTransactions(user?.userID, "debit");

  const availableCoins = Number(totalCoins?.totalCoins ?? 0);
  const handleWithdrawPress = async (formik: any) => {
    if (!isBankDetailsAdded) {
      formik.handleSubmit();
    } else if (formik.dirty) {
      formik.handleSubmit();
    } else {
      Alert.alert(
        "Confirm Withdrawal",
        `Are you sure you want to withdraw ${coins} coin${
          coins > 1 ? "s" : ""
        } (₹${coins})?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Yes, Withdraw",
            onPress: async () => {
              try {
                await initiatePayout({
                  userID: user?.userID,
                  coinCount: coins,
                });
                toast.success(
                  `${coins} coin${coins > 1 ? "s" : ""} withdrawn successfully`,
                );
                setShowModal(false);
              } catch (err) {
                toast.error(err?.message || "Failed to initiate payout");
                setShowModal(false);
                console.error("Payout error:", err);
              }
            },
          },
        ],
      );
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Withdraw" isBack />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Slider Card */}
        <View style={styles.sliderCard}>
          <View style={styles.sliderHeader}>
            <CustomText style={styles.sliderTitle}>Select amount</CustomText>
            <CustomText style={styles.sliderSubtitle}>
              Available: {formatCoins(availableCoins)} coins
            </CustomText>
          </View>

          <View style={styles.sliderContainer}>
            <View style={styles.iconWrapper}>
              <CustomText style={styles.valueText}>{coins}</CustomText>
              <View style={[styles.circle, styles.coinCircle]}>
                <Ionicons name="star" size={28} color="#FFD700" />
              </View>
            </View>
            {!isLoadingCoins && (
              <Slider
                style={styles.slider}
                minimumValue={10}
                maximumValue={totalCoins?.totalCoins || 10}
                step={1}
                value={coins}
                minimumTrackTintColor={color.PRIMARY_COLOR}
                maximumTrackTintColor="#e0e0e0"
                thumbTintColor={color.PRIMARY_COLOR}
                onValueChange={(value) => setCoins(value)}
              />
            )}
            <View style={styles.iconWrapper}>
              <CustomText style={styles.valueText}>{coins}</CustomText>
              <View style={[styles.circle, styles.rupeeCircle]}>
                <FontAwesome name="rupee" size={24} color="#fff" />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={() => {
              if (availableCoins === 0) {
                toast.error("You don't have any coins to withdraw.");
                return;
              }
              if (availableCoins < 10) {
                toast.warning("You need at least 10 coins to withdraw.");
                return;
              }
              setShowModal(true);
            }}
          >
            <CustomText style={styles.buttonText}>Withdraw Now</CustomText>
          </TouchableOpacity>
        </View>

        {/* History Header */}
        <View style={styles.historyHeader}>
          <CustomText style={styles.historyTitle}>
            Recent Withdrawals
          </CustomText>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "./TransactionHistoryScreen",
                params: { paymentType: "debit" },
              })
            }
          >
            <CustomText style={styles.viewAll}>View All</CustomText>
          </TouchableOpacity>
        </View>

        {/* Transaction List */}
        {transactions?.pages?.some((page) => page.data?.length > 0) ? (
          <FlatList
            data={transactions.pages
              .flatMap((page) => page.data || [])
              .slice(0, 3)}
            keyExtractor={(item) => item.coinTransactionId}
            scrollEnabled={false}
            refreshControl={
              <RefreshControl
                refreshing={Boolean(isRefetchingCoins || isRefetchingTxn)}
                onRefresh={() => {
                  coinsRefetch();
                  txnRefetch();
                }}
                colors={[color.PRIMARY_COLOR]}
                tintColor={color.PRIMARY_COLOR}
              />
            }
            renderItem={({ item }) => {
              const status = item.status?.toLowerCase() || "default";
              const borderColor = getTransactionColor(
                item.transactionType,
                status,
              );
              const icon = getStatusIcon(status);
              const iconColor = getStatusTextColor(status);
              const label = getTransactionLabel(item, user?.userID);
              const fullDate = moment(item.transactionDate).format(
                "DD MMM, YYYY hh:mm A",
              );

              return (
                <TouchableOpacity
                  key={item.coinTransactionId}
                  style={[styles.transactionCard]}
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
                        isCredit: String(item.receiverId === user?.userID),
                        paymentStatus: item.status,
                      },
                    })
                  }
                >
                  <View style={styles.transactionRow}>
                    <View style={styles.transactionLeft}>
                      <View
                        style={[
                          styles.statusIcon,
                          { backgroundColor: iconColor + "20" },
                        ]}
                      >
                        <Ionicons name={icon} size={20} color={iconColor} />
                      </View>
                      <View>
                        <CustomText fontSize={16} fontWeight="500">
                          {label}
                        </CustomText>
                        <CustomText
                          fontSize={12}
                          color="#9ca3af"
                          style={{ marginTop: 2 }}
                        >
                          {fullDate}
                        </CustomText>
                      </View>
                    </View>
                    <CustomText
                      fontSize={18}
                      fontWeight="700"
                      color={borderColor}
                    >
                      {item.receiverId === user?.userID ? "+" : "-"}
                      {formatCoins(item.coinCount)}
                    </CustomText>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          <NoDataFound message="No transactions found" style={styles.noData} />
        )}
      </ScrollView>

      {/* Modal */}
      <CustomModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        showCloseIcon
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Formik
            enableReinitialize
            initialValues={
              payoutDetails?.data
                ? {
                    ifsc: payoutDetails.data.payout_ifscCode,
                    phone: payoutDetails.data.payout_mobileNumber,
                    email: payoutDetails.data.payout_userEmail,
                    accountHolder: payoutDetails.data.payout_payeeName,
                    accountNo: payoutDetails.data.payout_toAccount,
                    upi: payoutDetails.data.payout_toUpi,
                  }
                : {
                    ifsc: "",
                    phone: "",
                    email: "",
                    accountHolder: "",
                    accountNo: "",
                    upi: "",
                  }
            }
            validationSchema={Yup.object({
              ifsc: Yup.string().required("IFSC Code is required"),
              phone: Yup.string().required("Phone is required"),
              email: Yup.string()
                .email("Invalid email")
                .required("Email is required"),
              accountHolder: Yup.string().required(
                "Account Holder Name is required",
              ),
              accountNo: Yup.string().required("Account No. is required"),
              upi: Yup.string().required("UPI ID is required"),
            })}
            onSubmit={async (values, { resetForm }) => {
              const payload = {
                userID: user?.userID,
                payout_userEmail: values.email,
                payout_ifscCode: values.ifsc,
                payout_mobileNumber: values.phone,
                payout_payeeName: values.accountHolder,
                payout_toAccount: values.accountNo,
                payout_toUpi: values.upi,
                payout_meta: "",
              };
              try {
                if (!isBankDetailsAdded) {
                  await addPayoutDetails(payload);
                  toast.success("Bank details added successfully");
                } else {
                  await updatePayoutDetails(payload);
                  toast.success("Bank details updated successfully");
                }
                queryClient.invalidateQueries({ queryKey: ["payout-details"] });
                queryClient.invalidateQueries({
                  queryKey: ["user-total-coins"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["user-transactions"],
                });
                resetForm();
                setShowModal(false);
              } catch (err) {
                toast.error("Failed to save bank details");
                console.error("Error saving payout details:", err);
              }
            }}
          >
            {(formik) => (
              <>
                <CustomText style={styles.modalTitle}>
                  Withdraw Coins
                </CustomText>
                <CustomText style={styles.modalSubtitle}>
                  You are withdrawing {coins} coins = ₹{coins}
                </CustomText>

                <CustomText style={styles.sectionLabel}>
                  Contact Info
                </CustomText>
                <CustomTextInput
                  formik={formik}
                  name="email"
                  label="Email"
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  containerStyle={styles.inputContainer}
                />
                <CustomTextInput
                  formik={formik}
                  name="phone"
                  label="Mobile / Phone No."
                  placeholder="Enter phone number"
                  keyboardType="number-pad"
                  containerStyle={styles.inputContainer}
                />

                <CustomText style={[styles.sectionLabel, { marginTop: 16 }]}>
                  Bank Details
                </CustomText>
                <CustomTextInput
                  formik={formik}
                  name="ifsc"
                  label="IFSC Code"
                  placeholder="Enter IFSC code"
                  containerStyle={styles.inputContainer}
                />
                <CustomTextInput
                  formik={formik}
                  name="accountNo"
                  label="Account No."
                  placeholder="Enter account number"
                  keyboardType="number-pad"
                  containerStyle={styles.inputContainer}
                />
                <CustomTextInput
                  formik={formik}
                  name="accountHolder"
                  label="Account Holder Name"
                  placeholder="Enter name"
                  containerStyle={styles.inputContainer}
                />

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => handleWithdrawPress(formik)}
                >
                  <CustomText style={styles.modalButtonText}>
                    {!isBankDetailsAdded
                      ? "Add Bank Details & Withdraw"
                      : formik.dirty
                        ? "Update Bank Details & Withdraw"
                        : "Withdraw with Bank"}
                  </CustomText>
                </TouchableOpacity>

                <CustomText style={styles.orSeparator}>OR</CustomText>

                <CustomText style={[styles.sectionLabel, { marginTop: 0 }]}>
                  UPI Details
                </CustomText>
                <CustomTextInput
                  formik={formik}
                  name="upi"
                  label="UPI ID"
                  placeholder="Enter UPI ID (e.g., name@okhdfcbank)"
                  containerStyle={styles.inputContainer}
                />

                <TouchableOpacity
                  style={[styles.modalButton, styles.upiButton]}
                  onPress={() => handleWithdrawPress(formik)}
                >
                  <CustomText style={styles.modalButtonText}>
                    {!isBankDetailsAdded
                      ? "Add UPI & Withdraw"
                      : formik.dirty
                        ? "Update UPI & Withdraw"
                        : "Withdraw with UPI"}
                  </CustomText>
                </TouchableOpacity>
              </>
            )}
          </Formik>
        </ScrollView>
      </CustomModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  sliderCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sliderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  sliderSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  iconWrapper: {
    alignItems: "center",
    width: 70,
  },
  circle: {
    height: 60,
    width: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  coinCircle: {
    backgroundColor: "#fef9e7",
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  rupeeCircle: {
    backgroundColor: color.PRIMARY_COLOR,
  },
  valueText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  slider: {
    flex: 1,
    marginHorizontal: 12,
    height: 40,
  },
  withdrawButton: {
    backgroundColor: color.PRIMARY_COLOR,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 8,
    shadowColor: color.PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  viewAll: {
    fontSize: 14,
    fontWeight: "600",
    color: color.PRIMARY_COLOR,
  },
  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  noData: {
    marginTop: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    marginBottom: 12,
  },
  modalButton: {
    backgroundColor: color.PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 16,
    shadowColor: color.PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  upiButton: {
    backgroundColor: "#3b82f6",
    shadowColor: "#3b82f6",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  orSeparator: {
    textAlign: "center",
    fontSize: 14,
    color: "#94a3b8",
    marginVertical: 16,
    fontWeight: "600",
  },
});

export default WithdrawScreen;
