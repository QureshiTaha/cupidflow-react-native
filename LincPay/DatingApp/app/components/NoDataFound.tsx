import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import CustomText from "./CustomText";
import { useRouter } from "expo-router";
import { sizes } from "../const";
import { color } from "../const/color";

type NoDataFoundProps = {
  message: string;
  goBack?: boolean;
  minHeight?: number;
};

const NoDataFound: React.FC<NoDataFoundProps> = ({ message, goBack, minHeight = sizes.width }) => {
  const router = useRouter();

  return (
    <View style={[styles.container, { minHeight }]}>
      <CustomText style={styles.message}>{message}</CustomText>

      {goBack && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.back()}
        >
          <CustomText style={styles.buttonText}>Go Back</CustomText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  message: {
    fontSize: 16,
    color: "grey",
    textAlign: "center",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1, borderColor: color.PRIMARY_COLOR
  },
  buttonText: {
    color: color.PRIMARY_COLOR,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default NoDataFound;
