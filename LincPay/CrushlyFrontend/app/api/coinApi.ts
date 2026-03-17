import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { API_AXIOS } from "./axiosInstance";
import { myConsole } from "../utils/myConsole";

export const sendCoins = async (payload: {
  senderId: string;
  receiverId: string;
  count: number;
}) => {
  try {
    const response = await API_AXIOS.post(`/coins/send-coin`, payload);
    return response.data;
  } catch (error: any) {
    // console.error("Error sending coins:", error?.response?.data || error);
    throw new Error(error?.response?.data?.msg || "Error sending coins");
  }
};

export const getUserTotalCoins = async (
  userID: string,
  page = 1,
  limit = 10
) => {
  try {
    const response = await API_AXIOS.get(`/coins/user-total-coin/${userID}`, {
      params: { page, limit },
    });
    return response.data;
  } catch (error: any) {
    // console.error("Error fetching user coins:", error?.response?.data || error);
    throw error;
  }
};

export const useUserTotalCoins = (userID: string, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ["user-total-coins", userID, page, limit],
    queryFn: () => getUserTotalCoins(userID, page, limit),
    enabled: !!userID,
    staleTime: 5 * 60 * 1000, // 5 min: consider fresh, no refetch
    gcTime: 30 * 60 * 1000, // keep cache around longer
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const getAllOffers = async () => {
  try {
    const response = await API_AXIOS.get(`/coins/all-offers`);
    return response.data;
  } catch (error: any) {
    // console.error("Error fetching offers:", error?.response?.data || error);
    throw new Error(error?.response?.data?.msg || "Error fetching offers");
  }
};
export const useAllOffers = () => {
  return useQuery({
    queryKey: ["all-offers"],
    queryFn: getAllOffers,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
};

export const getUserTransactions = async (
  userID: string,
  page = 1,
  limit = 10,
  paymentType = ""
) => {
  try {
    const response = await API_AXIOS.get(`/coins/user-transaction/${userID}`, {
      params: { page, limit, paymentType },
    });
    return response.data;
  } catch (error: any) {
    // console.error(
    //   "Error fetching transaction history:",
    //   error?.response?.data || error
    // );
    throw error;
  }
};
export const useUserTransactions = (userID: string, paymentType = "") => {
  return useInfiniteQuery({
    queryKey: ["user-transactions", userID, paymentType],
    queryFn: ({ pageParam = 1 }) =>
      getUserTransactions(userID, pageParam, 10, paymentType),
    // Server returns `haveMore` only on the LAST item of `data`
    getNextPageParam: (lastPage, allPages) => {
      const tail = lastPage?.data && lastPage.data[lastPage.data.length - 1];
      return tail?.haveMore ? allPages.length + 1 : undefined;
    },
    enabled: Boolean(userID),
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
