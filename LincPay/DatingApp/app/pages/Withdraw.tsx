import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  RefreshControl,
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
        `Are you sure you want to withdraw ${coins} coin${coins > 1 ? "s" : ""
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
                  `${coins} coin${coins > 1 ? "s" : ""} withdrawn successfully`
                );
                setShowModal(false);
              } catch (err) {
                toast.error(err?.message || "Failed to initiate payout");
                setShowModal(false);
                console.error("Payout error:", err);
              }
            },
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Withdraw" isBack />
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <View style={styles.sliderContainer}>
          <View style={styles.iconWrapper}>
            <CustomText style={styles.valueText}>{coins}</CustomText>
            <View style={styles.circle}>
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
              maximumTrackTintColor="#ccc"
              thumbTintColor={color.PRIMARY_COLOR}
              onValueChange={(value) => setCoins(value)}
            />
          )}
          <View style={styles.iconWrapper}>
            <CustomText style={styles.valueText}>{coins}</CustomText>
            <View style={styles.circle}>
              <FontAwesome name="rupee" size={24} color={color.PRIMARY_COLOR} />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
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
          <CustomText style={styles.buttonText}>Withdraw</CustomText>
        </TouchableOpacity>

        <View style={styles.historyHeader}>
          <CustomText style={styles.historyTitle}>Withdraw History</CustomText>
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

        {transactions?.pages?.some((page) => page.data?.length > 0) ? (
          <FlatList
            data={transactions.pages
              .flatMap((page) => page.data || [])
              .slice(0, 3)}
            keyExtractor={(item) => item.coinTransactionId}
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
                status
              );
              const icon = getStatusIcon(status);
              const iconColor = getStatusTextColor(status);
              const label = getTransactionLabel(item, user?.userID);
              const fullDate = moment(item.transactionDate).format(
                "DD MMM, YYYY hh:mm A"
              );

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
                        isCredit: String(item.receiverId === user?.userID),
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
                    {fullDate}
                  </CustomText>

                  <CustomText
                    fontSize={16}
                    fontWeight="600"
                    color={borderColor}
                    style={{ marginTop: 6 }}
                  >
                    {item.receiverId === user?.userID ? "+" : "-"}
                    {formatCoins(item.coinCount)}
                  </CustomText>
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          <NoDataFound message="No transactions found" />
        )}

        <CustomModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          showCloseIcon
        >
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
                "Account Holder Name is required"
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
                <CustomText style={styles.bankDetTxt}>Bank Details</CustomText>
                <CustomText style={styles.selectedCoinsText}>
                  You are withdrawing {coins} coins = ₹{coins}
                </CustomText>
                <CustomTextInput
                  formik={formik}
                  name="email"
                  label="Email"
                  placeholder="Enter email address"
                  keyboardType="email-address"
                />
                <CustomTextInput
                  formik={formik}
                  name="phone"
                  label="Mobile / Phone No."
                  placeholder="Enter phone number"
                  keyboardType="number-pad"
                />


                {/* Bank Details */}
                <CustomText style={{ ...styles.bankDetTxt, top: 10 }}>Bank Details</CustomText>
                <CustomTextInput
                  formik={formik}
                  name="ifsc"
                  label="IFSC Code"
                  placeholder="Enter IFSC code"
                />
                <CustomTextInput
                  formik={formik}
                  name="accountNo"
                  label="Account No."
                  placeholder="Enter account number"
                  keyboardType="number-pad"
                />
                <CustomTextInput
                  formik={formik}
                  name="accountHolder"
                  label="Account Holder Name"
                  placeholder="Enter name"
                />
                <TouchableOpacity
                  style={[styles.button, { marginTop: 10 }]}
                  onPress={() => handleWithdrawPress(formik)}
                >
                  <CustomText style={styles.buttonText}>
                    {!isBankDetailsAdded
                      ? "Add Bank Details"
                      : formik.dirty
                        ? "Update Bank Details"
                        : "Proceed with This Bank Details"}
                  </CustomText>
                </TouchableOpacity>

                {/* or UPI */}

                <CustomText style={{ ...styles.bankDetTxt, top: 0, marginTop: 10 }}>Or</CustomText>

                <CustomTextInput
                  formik={formik}
                  name="upi"
                  label="UPI ID"
                  placeholder="Enter UPI ID"
                />

                <View style={{ flexDirection: "column", justifyContent: "space-between" }} >

                  <TouchableOpacity
                    style={[styles.button, { marginTop: 20 }]}
                    onPress={() => handleWithdrawPress(formik)}
                  >
                    <CustomText style={styles.buttonText}>
                      {!isBankDetailsAdded
                        ? "Add UPI Details"
                        : formik.dirty
                          ? "Update UPI Details"
                          : "Proceed with UPI ID"}
                    </CustomText>
                  </TouchableOpacity></View>
              </>
            )}
          </Formik>
        </CustomModal>
      </View>
    </View>
  );
};

export default WithdrawScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 10,
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

  selectedCoinsText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: color.titleColor,
    marginBottom: 12,
    marginTop: -8,
  },
  bankDetTxt: {
    position: "relative",
    top: -16,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    color: color.PRIMARY_COLOR,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  historyLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  historyCoin: {
    fontSize: 14,
    color: "grey",
    marginTop: 4,
  },
  historyDate: {
    fontSize: 12,
    color: "grey",
    marginTop: 2,
  },

  viewAll: {
    fontSize: 14,
    fontWeight: "600",
    color: color.PRIMARY_COLOR,
  },
  historyCard: {
    height: 80,
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    elevation: 2,
    marginBottom: 20,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 40,
  },
  iconWrapper: {
    alignItems: "center",
    width: 60,
  },
  circle: {
    height: 50,
    width: 50,
    borderRadius: 25,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    elevation: 2,
  },
  valueText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  slider: {
    flex: 1,
    marginTop: 30,
  },
  button: {
    backgroundColor: color.PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
