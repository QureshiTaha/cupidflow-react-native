import { useQuery } from "@tanstack/react-query";
import { API_AXIOS } from "./axiosInstance";
import { myConsole } from "../utils/myConsole";

const getUserTotalFollowers = async (userID: string) => {
  try {
    const response = await API_AXIOS.get(`/follow/getFollowersList/${userID}`, {
      params: { page: 1, limit: 10 },
    });

    const lastItem =
      response?.data?.data && response.data.data[response.data.data.length - 1];

    return lastItem?.totalCount ?? 0;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.msg || "Error fetching total followers"
    );
  }
};

export const useUserTotalFollowers = (userID: string) => {
  return useQuery({
    queryKey: ["user-total-followers", userID],
    queryFn: () => getUserTotalFollowers(userID),
    enabled: !!userID,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
