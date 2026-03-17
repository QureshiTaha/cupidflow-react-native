import { myConsole } from "../utils/myConsole";
import { API_AXIOS } from "./axiosInstance";

const BASE_URL = "/payment";

export const initiatePayment = async (paymentData: any) => {
  try {
    console.log("🟡 [initiatePayment] Request URL:", `${BASE_URL}/initiate`);
    console.log("🟡 [initiatePayment] Request Body:", paymentData);

    const res = await API_AXIOS.post(`${BASE_URL}/initiate`, paymentData);

    console.log("🟢 [initiatePayment] Response Status:", res.status);
    myConsole("🟢 [initiatePayment] Response Data:", res.data);

    if (!res.data?.status) {
      throw new Error(res.data?.message || "Payment initiation failed");
    }

    return res.data;
  } catch (err: any) {
    console.log("🔴 [initiatePayment] ERROR STATUS:", err?.response?.status);
    console.log("🔴 [initiatePayment] ERROR DATA:", err?.response?.data);
    console.log("🔴 [initiatePayment] ERROR MESSAGE:", err.message);

    throw err.response?.data || err;
  }
};

export const processPayment = async (paymentData: any) => {
  try {
    const res = await initiatePayment(paymentData);

    if (!res?.qrString) {
      throw new Error("QR string not received from server");
    }

    return res;
  } catch (err: any) {
    throw err?.response?.data || err;
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
