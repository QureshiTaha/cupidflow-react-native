import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function FansPage() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Fans</Text>
      </View>

      {/* Plans Section */}
      <Text style={styles.sectionTitle}>My Plans</Text>
      <View style={styles.planCard}>
        <Text style={styles.planTitle}>Fan</Text>
        
          <Text style={styles.planFeature}><AntDesign name="check" size={20} color="green"/> Support broadcaster</Text>
          <Text style={styles.planFeature}><AntDesign name="check" size={20} color="green"/> Get special status</Text>
          <Text style={styles.planFeature}><AntDesign name="check" size={20} color="green"/> Access 3 exclusive posts</Text>
        
        <View style={styles.planFooter}>
          <Text style={styles.planPrice}>499/Mo</Text>
          <TouchableOpacity style={styles.changeButton}>
            <Text style={styles.changeButtonText}>Change</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* No Fans Message */}
      <View style={styles.noFansContainer}>
        <Ionicons name="star-outline" size={40} color="#999" />
        <Text style={styles.noFansText}>
          You have no Fans yet. Make exclusive posts to attract them.
        </Text>
      </View>

      {/* Call to Action Button */}
      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionButtonText}>Make exclusive posts</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: "#f9f9f9",
    padding: 25,
    borderRadius: 10,
    elevation: 1,
    marginBottom: 20,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  planFeature: {
    margin: 11,
    fontSize: 14,
    color: "#555",
    flexWrap: "wrap",
    width: "100%",
    textAlign: "left",
  },
  planFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f0a500",
  },
  changeButton: {
    backgroundColor: "#eae6ff",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  changeButtonText: {
    color: "#805ad5",
    fontWeight: "bold",
  },
  noFansContainer: {
    alignItems: "center",
    marginVertical: 30,
  },
  noFansText: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: "#805ad5",
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 25,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
