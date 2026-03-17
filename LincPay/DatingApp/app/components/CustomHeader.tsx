// CustomHeader.tsx
import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import CustomText from "./CustomText";
import { useNavigation } from "@react-navigation/native";

interface RightSideIcon {
  name: string;
  onPress: () => void;
}

interface CustomHeaderProps {
  customStyle?: StyleProp<ViewStyle>;
  title?: string;
  titleAlign?: "left" | "center" | "right";
  isBack?: boolean;
  rightSideIcons?: RightSideIcon[];
}

const CustomHeader: React.FC<CustomHeaderProps> = ({
  customStyle,
  title,
  titleAlign = "center",
  isBack = false,
  rightSideIcons = [],
}) => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.safeArea, customStyle]}>
      <StatusBar barStyle="dark-content" backgroundColor={"#fff"} />
      <View style={styles.container}>
        {/* Left Side - Back Button */}
        <View style={styles.leftContainer}>
          {isBack && (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <View
          style={[
            styles.titleContainer,
            { alignItems: getTitleAlign(titleAlign) },
          ]}
        >
          {title && (
            <CustomText fontSize={18} fontWeight="600">
              {title}
            </CustomText>
          )}
        </View>

        {/* Right Side - Icons */}
        <View style={styles.rightContainer}>
          {rightSideIcons.map((icon, index) => (
            <TouchableOpacity
              key={index}
              onPress={icon.onPress}
              style={styles.iconButton}
            >
              <Ionicons name={icon.name} size={22} color="#000" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const getTitleAlign = (align: "left" | "center" | "right") => {
  switch (align) {
    case "left":
      return "flex-start";
    case "right":
      return "flex-end";
    default:
      return "center";
  }
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#fff",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: 12,
  },
  leftContainer: {
    width: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 16,
  },
});

export default CustomHeader;
