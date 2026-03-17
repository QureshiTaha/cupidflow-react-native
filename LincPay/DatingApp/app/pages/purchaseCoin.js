import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useToast } from 'react-native-toast-notifications';

const API_BASE_URL = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1`;

const PurchaseCoinScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [user, setUser] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const toast = useToast();

  useEffect(() => {
    const getUser = async () => {
      const User = await AsyncStorage.getItem("User");
      setUser(JSON.parse(User));
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        if (!accessToken) {
          Alert.alert("Authentication Required", "Please login to view offers");
          router.push("../login");
        }

        const response = await axios.get(`${API_BASE_URL}/coins/all-offers`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        });

        if (response.data?.status && response.data.data) {
          setOffers(response.data.data);
        } else {
          throw new Error(response.data?.message || "No offers available");
        }
      } catch (error) {
        console.error("Fetch offers error:", error);
        let errorMsg = "Failed to load offers";

        if (error.response) {
          if (error.response.status === 401) {
            errorMsg = "Session expired. Please login again.";
            router.push("/login");
          } else {
            errorMsg = error.response.data?.message || errorMsg;
          }
        }

        Alert.alert("Error", errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  const handlePurchase = async (offer) => {
    try {
      setSelectedOffer(offer.offerId);
      setProcessing(true);

      const accessToken = await AsyncStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const response = await axios.post(
        `${API_BASE_URL}/coins/purchase-coin`,
        {
          userID: user.userID,
          count: offer.coinAmount
        },
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data?.status) {
        toast.show(`✅ ${response.data.msg || `Purchased ${offer.coinAmount} coins!`}`, { type: "success" });
        setShowSuccessModal(true);
      } else {
        throw new Error(response.data?.msg || "Purchase failed");
      }

    } catch (error) {
      console.error("Purchase error:", error.response?.data || error.message);
      let errorMsg = "Purchase failed. Please try again.";

      if (error.response) {
        if (error.response.status === 401) {
          errorMsg = "Session expired. Please login again.";
          router.push("/login");
        } else if (error.response.status === 404) {
          errorMsg = "Endpoint not found. Please contact support.";
        } else if (error.response.data?.message) {
          errorMsg = error.response.data.message;
        }
      }

      toast.show(`❌ ${errorMsg}`, { type: "danger" });

    } finally {
      setProcessing(false);
      setSelectedOffer(null);
    }
  };

  const renderOffer = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.offer,
        selectedOffer === item.offerId && styles.selectedOffer,
        processing && styles.disabled
      ]}
      onPress={() => handlePurchase(item)}
      disabled={processing}
    >
      <View style={styles.offerContent}>
        <Text style={styles.offerTitle}>{item.name || `${item.coinAmount} Coins`}</Text>
        <Text style={styles.offerPrice}>${item.offerPrice?.toFixed(2)}</Text>
        {item.bonusText && <Text style={styles.bonus}>{item.bonusText}</Text>}
      </View>
      {processing && selectedOffer === item.offerId ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <Icon name="chevron-right" size={24} color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Modal
        transparent
        visible={showSuccessModal}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>🎉 Purchase Successful!</Text>
            <Text style={styles.modalMessage}>Your coins have been added.</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                router.push("../pages/home");
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Buy Coins</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={offers}
        renderItem={renderOffer}
        numColumns={2}
        keyExtractor={(item) => item.offerId}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={<Text style={styles.subtitle}>Available Coin Packages</Text>}
        ListFooterComponent={<Text style={styles.footer}>Coins can be used for in-app purchases</Text>}
        ListEmptyComponent={!loading && <Text style={styles.empty}>No offers available at the moment</Text>}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    display: 'flex',
    backgroundColor: '#bbb',
    minHeight: '100%',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "black",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#0f0f1a',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    color: "black",
    marginBottom: 25,
    textAlign: 'center',
    fontFamily: 'Avenir',
  },
  footer: {
    fontSize: 14,
    color: "black",
    marginTop: 20,
    textAlign: "center",
    lineHeight: 18,
  },
  empty: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: 50,
  },
  offer: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: "#6e45e2",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  selectedOffer: {
    borderWidth: 2,
    borderColor: "#fff",
  },
  gradient: {
    padding: 20,
    borderRadius: 15,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginBottom: 5,
  },
  offerPrice: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
  },
  bonusBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    transform: [{ rotate: '15deg' }],
  },
  bonusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  buyButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  buyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loader: {
    paddingHorizontal: 20,
  },
  disabled: {
    opacity: 0.7,
  },
  gridContainer: {
  paddingHorizontal: 10,
  paddingBottom: 20,
},

row: {
  justifyContent: 'space-between',
  marginBottom: 15,
},

offer: {
  flex: 1,
  marginHorizontal: 5,
  backgroundColor: "#fff",
  borderRadius: 10,
  padding: 15,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 5,
  elevation: 3,
  minHeight: 120,
  justifyContent: "space-between",
},

offerContent: {
  flexDirection: "column",
  justifyContent: "space-between",
},

offerTitle: {
  fontSize: 16,
  fontWeight: "bold",
  color: "#333",
},

offerPrice: {
  fontSize: 14,
  color: "#007AFF",
  marginTop: 5,
},

bonus: {
  fontSize: 12,
  color: "#28a745",
  marginTop: 3,
},

selectedOffer: {
  borderWidth: 2,
  borderColor: "#007AFF",
},

disabled: {
  opacity: 0.6,
},
modalBackground: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContainer: {
  width: '80%',
  backgroundColor: '#fff',
  padding: 20,
  borderRadius: 10,
  alignItems: 'center',
},
modalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 10,
},
modalMessage: {
  fontSize: 14,
  color: '#333',
  marginBottom: 20,
  textAlign: 'center',
},
modalButton: {
  backgroundColor: '#007AFF',
  paddingHorizontal: 20,
  paddingVertical: 10,
  borderRadius: 5,
},
modalButtonText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 16,
},

});

export default PurchaseCoinScreen;