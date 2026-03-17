import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_AXIOS } from "./axiosInstance";

const getStoredUser = async () => {
  const userData = await AsyncStorage.getItem("User");
  return userData ? JSON.parse(userData) : null;
};

export const useStoredUser = () => {
  return useQuery({
    queryKey: ["storedUser"],
    queryFn: getStoredUser,
    staleTime: Infinity, 
  });
};

// -------- Payout APIs --------

// Add payout details
export const addPayoutDetails = async (payload: {
  userID: string;
  payout_userEmail: string;
  payout_ifscCode: string;
  payout_mobileNumber: string;
  payout_payeeName: string;
  payout_toAccount: string;
  payout_toUpi: string;
  payout_meta?: string;
}) => {
  const response = await API_AXIOS.post(`/users/details/payout`, payload);
  return response.data;
};

// Update payout details
export const updatePayoutDetails = async (payload: {
  userID: string;
  payout_userEmail: string;
  payout_ifscCode: string;
  payout_mobileNumber: string;
  payout_payeeName: string;
  payout_toAccount: string;
  payout_toUpi: string;
  payout_meta?: string;
}) => {
  const response = await API_AXIOS.put(`/users/details/payout`, payload);
  return response.data;
};

// Get payout details (query function)
export const getPayoutDetails = async (userID: string) => {
  const response = await API_AXIOS.get(`/users/details/payout/${userID}`);
  return response.data;
};

export const usePayoutDetails = (userID: string) => {
  return useQuery({
    queryKey: ["payout-details", userID],
    queryFn: () => getPayoutDetails(userID),
    enabled: !!userID,
  });
};