import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useToast } from "react-native-toast-notifications";
import { useDispatch } from "react-redux";
import { requestRefresh, updateFromTransaction } from "../Redux/coinSlice";
import { sendCoins } from "../api/coinApi";
import { useQueryClient } from "@tanstack/react-query";

const GiftCoinPopup = ({ visible, onClose, receiverId, onSuccess, onSend }) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const coinOptions = [3, 5, 10, 20, 30, 50];

  useEffect(() => {
    if (visible) {
      setSelectedAmount(null);
    }
  }, [visible]);

  const handleSend = async () => {
    if (!selectedAmount) return;

    try {
      setLoading(true);

      const userDataString = await AsyncStorage.getItem("User");
      if (!userDataString) {
        toast.show("User not logged in", { type: "danger" });
        return;
      }

      const userData = JSON.parse(userDataString);
      if (!userData?.userID) {
        toast.show("User not logged in", { type: "danger" });
        return;
      }

      const payload = {
        senderId: userData.userID,
        receiverId,
        count: selectedAmount,
      };

      const result = await sendCoins(payload);

      if (result?.status) {
        toast.show("Coins sent successfully!", { type: "success" });
        dispatch(updateFromTransaction(result));
        dispatch(requestRefresh());
        queryClient.invalidateQueries({ queryKey: ["user-total-coins"] });

        // ✅ Call parent callback
        if (typeof onSuccess === "function") {
          onSuccess({ amount: selectedAmount, result });
        }

        // ✅ Call onSend if provided
        if (typeof onSend === "function") {
          onSend({ amount: selectedAmount, result });
        }

        onClose();
      } else {
        toast.show(result?.msg || "Failed to send coins", { type: "danger" });
      }
    } catch (error) {
      toast.show(error?.message || "Error sending coins", { type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.popupContainer}>
          <Text style={styles.title}>Send Gift Coins</Text>
          <Text style={styles.subtitle}>Select coin amount</Text>

          <View style={styles.coinOptions}>
            {coinOptions.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.coinButton,
                  selectedAmount === amount && styles.selectedCoinButton,
                ]}
                onPress={() => setSelectedAmount(amount)}
              >
                <Text style={styles.coinText}>{amount} coins</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!selectedAmount || loading) && styles.disabledButton,
              ]}
              e
              onPress={handleSend}
              disabled={!selectedAmount || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Gift</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  popupContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "80%",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  coinOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  coinButton: {
    width: "30%",
    padding: 8,
    marginVertical: 5,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
  },
  selectedCoinButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fe2146",
  },
  coinText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    backgroundColor: "#fe2146",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    borderWidth: 1,
    marginRight: 10,
    alignItems: "center",
    borderColor: "#fe2146",
  },
  sendButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default GiftCoinPopup;
