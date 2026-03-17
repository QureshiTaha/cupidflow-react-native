import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from "react-native";
import { useRouter, usePathname } from "expo-router";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import IoniconsIcons from "react-native-vector-icons/Ionicons";
import OcticonsIcons from "react-native-vector-icons/Octicons";
import EntypoIcons from "react-native-vector-icons/Entypo";
import { LinearGradient } from "expo-linear-gradient";

// Theme colors
const themeColors = {
  color1: "#f38ea8",
  color2: "#ef7cca",
  color3: "#f4b595",
  color4: "#8f6adf",
};

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route) => pathname === route;

  // const getIconColor = (route) => (isActive(route) ? "#FFF" : "#FFF");
  const getIconColor = (route) => 
  isActive(route) ? "#FFFFFF" : "rgba(255,255,255,0.6)";

  return (
    <LinearGradient
      colors={[themeColors.color4, themeColors.color2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      {/* Swipes */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => router.push("../pages/UserCard")}
        activeOpacity={0.7}
      >
        <MaterialIcon
          style={styles.icon}
          name={isActive("/pages/UserCard") ? "person" : "person-outline"}
          size={24}
          color={getIconColor("/pages/UserCard")}
        />
        <Text style={[styles.footerText, isActive("/pages/UserCard") && styles.activeText]}>
          Find
        </Text>
      </TouchableOpacity>

      {/* Explore */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => router.push("../pages/explore")}
        activeOpacity={0.7}
      >
        <IoniconsIcons
          style={styles.icon}
          name={isActive("/pages/explore") ? "search" : "search-outline"}
          size={24}
          color={getIconColor("/pages/explore")}
        />
        <Text style={[styles.footerText, isActive("/pages/explore") && styles.activeText]}>
          Discover
        </Text>
      </TouchableOpacity>

      {/* Home - with custom image */}
      <TouchableOpacity
        style={[styles.item]}
        onPress={() => router.replace("../pages/home")}
        activeOpacity={0.7}
      >
        {/* Using custom image instead of icon */}
      <Image
  source={isActive("/pages/home") ? require('../../assets/images/dilmilLogoActive.png') : require('../../assets/images/dilmilLogoInactive.png')}
  style={{
    height: isActive("/pages/home") ? 48 : 44,
    width: isActive("/pages/home") ? 48 : 44,
    borderRadius: 50,
  }}
  tintColor={!isActive("/pages/home") ? "rgba(255,255,255)" : undefined}
/>
        {/* <Text style={[styles.footerText, isActive("/pages/home") && styles.activeText]}>
          Home
        </Text> */}
      </TouchableOpacity>

      {/* Moments */}
      {pathname === "/pages/reels" ? (
        <View style={styles.item}>
         <EntypoIcons
  style={styles.icon}
  name="folder-video"
  size={24}
  color={getIconColor("/pages/reels")}
/>
          <Text style={[styles.footerText, styles.activeText]}>Highlights</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.item}
          onPress={() => router.push("../pages/reels")}
          activeOpacity={0.7}
        >
        <OcticonsIcons
  style={styles.icon}
  name="video"
  size={24}
  color={getIconColor("/pages/reels")}
/>
          <Text style={styles.footerText}>Highlights</Text>
        </TouchableOpacity>
      )}

      {/* Profile */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => router.push("../pages/profile")}
        activeOpacity={0.7}
      >
        <IoniconsIcons
          style={styles.icon}
          name={
            isActive("/pages/profile")
              ? "person-circle-sharp"
              : "person-circle-outline"
          }
          size={24}
          color={getIconColor("/pages/profile")}
        />
        <Text style={[styles.footerText, isActive("/pages/profile") && styles.activeText]}>
          Profile
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: themeColors.color4,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  item: {
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  icon: {
    marginBottom: 2,
  },
  homeItem: {
    marginTop: -20,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  footerText: {
    // color: "#FFF",
      color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    opacity: 0.8,
  },
  activeText: {
    fontWeight: "bold",
      color: "#FFFFFF", 
    opacity: 1,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});