import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const API_BASE = "https://viafarm-1.onrender.com";

// Reusable Product Card (image on top, name below)
const ProductCard = ({ item, onPress }) => {
  const name = item?.name ?? "Unnamed";
  const image =
    (item?.images && item.images.length > 0)
      ? item.images[0]
      : item?.image ?? "https://via.placeholder.com/150/FFA500/FFFFFF?text=No+Image";

  return (
    <TouchableOpacity
      style={cardStyles.container}
      activeOpacity={0.85}
      onPress={() => onPress && onPress(item)}
    >
      <View style={cardStyles.card}>
        <Image source={{ uri: image }} style={cardStyles.image} resizeMode="cover" />
      </View>
      <Text style={cardStyles.name} numberOfLines={2}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const LocalBest = () => {
  const navigation = useNavigation();
  const [data, setData] = useState([]); // store full product objects
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLocalBest = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const resp = await axios.get(
        `${API_BASE}/api/buyer/local-best?lat=28.6139&lng=77.2090`,
        {
          headers,
          timeout: 10000,
        }
      );

      // normalize response shapes
      let items = [];
      if (!resp || !resp.data) items = [];
      else if (Array.isArray(resp.data)) items = resp.data;
      else if (Array.isArray(resp.data.data)) items = resp.data.data;
      else if (Array.isArray(resp.data.items)) items = resp.data.items;
      else items = [];

      setData(items);
    } catch (err) {
      console.error("fetchLocalBest error:", err);
      if (err.response?.status === 401) {
        setError("Please login to view local products");
      } else if (err.code === "ECONNABORTED") {
        setError("Request timeout. Please try again.");
      } else if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Failed to fetch local products. Try again.");
      }
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalBest();
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchLocalBest();
  };

  const handleLogin = () => {
    navigation.navigate("login");
  };

  // navigate to ViewProduct with productId and the full product
  const openProductDetails = (product) => {
    const productId = product?._id || product?.id;
    if (!productId) {
      console.warn("openProductDetails: missing product id", product);
      return;
    }
    navigation.navigate("ViewProduct", { productId, product });
  };

  // Loading
  if (loading) {
    return (
      <View style={{ marginVertical: 20, alignItems: "center" }}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Local Best</Text>
          <TouchableOpacity style={styles.seeButton} onPress={() => navigation.navigate("LocalBestView")}>
            <Image source={require("../../../assets/via-farm-img/icons/see.png")} style={styles.seeIcon} />
            <Text style={styles.link}>See All</Text>
          </TouchableOpacity>
        </View>

        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 10, color: "#666" }}>Discovering local products...</Text>
      </View>
    );
  }

  // Error
  if (error) {
    return (
      <View style={{ marginVertical: 20, alignItems: "center" }}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Local Best</Text>
          <TouchableOpacity style={styles.seeButton} onPress={() => navigation.navigate("LocalBestView")}>
            <Image source={require("../../../assets/via-farm-img/icons/see.png")} style={styles.seeIcon} />
            <Text style={styles.link}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            {error.toLowerCase().includes("login") && (
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.buttonText}>Go to Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Success
  return (
    <View style={{ marginVertical: 20 }}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Local Best</Text>
        <TouchableOpacity style={styles.seeButton} onPress={() => navigation.navigate("LocalBestView")}>
          <Text style={styles.link}>See All</Text>
          <Image source={require("../../../assets/via-farm-img/icons/see.png")}  />
        </TouchableOpacity>
      </View>

      {data.length > 0 ? (
        <FlatList
          data={data}
          keyExtractor={(item, index) => (item._id || item.id || String(index)).toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          renderItem={({ item }) => <ProductCard item={item} onPress={openProductDetails} />}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No local products found near you</Text>
        </View>
      )}
    </View>
  );
};

export default LocalBest;

// ✅ Styles
const styles = StyleSheet.create({
  heading: { fontSize: 20, marginLeft: 20, fontWeight: "600" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15, paddingRight: 20 },
  link: { color: "rgba(1, 151, 218, 1)", fontWeight: "600" },

  // NEW: See All container + icon styles
  seeButton: { flexDirection: "row", alignItems: "center" ,gap:5, },
  seeIcon: { width: 18, height: 18, marginRight: 5, resizeMode: "contain" },

  loadingContainer: { alignItems: "center", padding: 20 },
  loadingText: { marginTop: 10, color: "#777" },
  errorContainer: { alignItems: "center", padding: 20, backgroundColor: "#ffebee", borderRadius: 8, marginHorizontal: 20 },
  errorText: { color: "#d32f2f", textAlign: "center", marginBottom: 15, fontSize: 16 },
  buttonContainer: { flexDirection: "row", gap: 10 },
  retryButton: { backgroundColor: "#1976d2", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  loginButton: { backgroundColor: "#388e3c", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  buttonText: { color: "white", fontWeight: "600" },
  noDataContainer: { alignItems: "center", padding: 20 },
  noDataText: { color: "#666", fontSize: 16 },
});

const cardStyles = StyleSheet.create({
  container: { alignItems: "center", marginHorizontal: 8, width: 120 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 5,
  },
  image: { width: "100%", height: "100%", borderRadius: 8 },
  name: { fontSize: 14, fontWeight: "500", color: "#333", textAlign: "center", marginTop: 4, flexWrap: "wrap", width: 100 },
});
