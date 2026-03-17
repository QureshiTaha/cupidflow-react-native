import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { getData } from "./hooks/useAsyncStorage";
import { useDispatch } from "react-redux";
import { login } from "./Redux/authSlice";

export default function App() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const _retrieveAuth = async () => {
      try {
        const IsAuthenticated = await getData("Authenticated");
        const User = await getData("User");

        if (IsAuthenticated && User) {
          const parsedUser = JSON.parse(User);
          dispatch(login(parsedUser));
          router.replace("./pages/home");
        } else {
          router.replace("./pages/login");
        }
      } catch (error) {
        console.log("Auth check failed:", error);
        router.replace("./pages/login");
      } finally {
        setLoading(false);
      }
    };

    _retrieveAuth();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return null; // Router will handle navigation
}
