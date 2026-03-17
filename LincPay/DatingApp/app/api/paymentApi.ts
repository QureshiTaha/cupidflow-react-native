import { myConsole } from "../utils/myConsole";
import { API_AXIOS } from "./axiosInstance";

const BASE_URL = "/payment";

export const initiatePayment = async (paymentData: any) => {
  try {
    const res = await API_AXIOS.post(`${BASE_URL}/initiate`, paymentData);
    if (!res.data?.status) {
      throw new Error(res.data?.message || "Payment initiation failed");
    }

    return res.data;
  } catch (err: any) {
    // console.error("❌ initiatePayment error:", err?.response?.data || err.message);
    throw (
      err.response?.data || new Error(err.message || "Something went wrong")
    );
  }
};

export const processPayment = async (paymentData: any) => {
  try {
    const initiateRes = await initiatePayment(paymentData);

    if (
      !initiateRes.encryptedPayload ||
      !initiateRes.MID ||
      !initiateRes.paymentUrl
    ) {
      throw new Error("Invalid payment data received from server");
    }

    const gatewayRes = await API_AXIOS.post(
      initiateRes.paymentUrl,
      {
        mid: initiateRes.MID,
        payload: initiateRes.encryptedPayload,
      },
      {
        timeout: 15000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // myConsole("✅ [processPayment] Gateway response:", gatewayRes.data);
    return gatewayRes.data;
  } catch (err: any) {
    // console.error("❌ processPayment error:", err?.response?.data || err.message);
    throw (
      err.response?.data || new Error(err.message || "Something went wrong")
    );
  }
};

export const initiatePayout = async (payoutData: any) => {
  try {
    console.log("📡 Sending payout data to backend:", payoutData);

    const res = await API_AXIOS.post(`${BASE_URL}/payout-initiate`, payoutData);

    if (!res.data?.status) {
      throw new Error(res.data?.message || "Payout initiation failed");
    }

    return res.data;
  } catch (err: any) {
    // console.error("❌ initiatePayout error:", err?.response?.data || err.message);
    throw (
      err.response?.data || new Error(err.message || "Something went wrong")
    );
  }
};
