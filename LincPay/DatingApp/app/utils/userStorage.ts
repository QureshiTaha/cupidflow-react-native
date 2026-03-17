import AsyncStorage from "@react-native-async-storage/async-storage";

export const getStoredUser = async () => {
  try {
    const userData = await AsyncStorage.getItem("User");
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error fetching stored user:", error);
    return null;
  }
};
