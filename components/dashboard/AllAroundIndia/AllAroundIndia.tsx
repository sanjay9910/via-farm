// File: components/dashboard/localBest/AllAroundIndia.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const API_BASE = "https://393rb0pp-5000.inc1.devtunnels.ms";

// ✅ Touchable Product Card (same look as other cards)
const ProductCard = ({ id, name, image, onPress }) => {
  return (
    <TouchableOpacity
      style={cardStyles.container}
      activeOpacity={0.85}
      onPress={() => onPress && onPress(id)}
    >
      <View style={cardStyles.card}>
        <Image
          source={{
            uri: image || "https://via.placeholder.com/150/FFA500/FFFFFF?text=No+Image",
          }}
          style={cardStyles.image}
          resizeMode="cover"
        />
      </View>
      <Text style={cardStyles.name} numberOfLines={2}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const AllAroundIndia = () => {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllAroundIndia = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE}/api/buyer/all-around-india`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      // normalize response
      const arr = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
        ? response.data
        : [];

      if (arr.length > 0) {
        const formatted = arr.map((item, idx) => ({
          id: item._id || item.id || `item-${idx}`,
          name: item.name || item.productName || "Unnamed",
          image: (item.images && item.images[0]) || item.image || null,
          raw: item,
        }));
        setItems(formatted);
      } else {
        setItems([]);
        setError(response.data?.message || "No products found");
      }
    } catch (err) {
      console.error("Error fetching all-around-india:", err);
      if (err.response?.status === 401) {
        setError("Please login to view products");
      } else if (err.code === "ECONNABORTED") {
        setError("Request timeout. Please try again.");
      } else if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Failed to load products. Please try again.");
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAroundIndia();
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchAllAroundIndia();
  };

  const handleLogin = () => {
    navigation.navigate("login");
  };

  const openProductDetails = (productId) => {
    if (!productId) {
      console.warn("openProductDetails: missing productId");
      Alert.alert("Error", "Product id missing");
      return;
    }
    // navigate to ViewProduct screen; ViewProduct should read route.params.productId
    try {
      navigation.navigate("ViewProduct", { productId });
    } catch (e1) {
      try {
        navigation.navigate("ViewOrderProduct", { productId });
      } catch (e2) {
        console.error("Navigation error:", e1, e2);
        Alert.alert("Navigation Error", "Could not open product detail screen. Check route names.");
      }
    }
  };

  // Loading
  if (loading) {
    return (
      <View>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>All Around India</Text>
          <TouchableOpacity onPress={() => navigation.navigate("ViewAllAroundIndia")}>
            <Text style={styles.link}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA500" />
          <Text style={styles.loadingText}>Fetching products across India...</Text>
        </View>
      </View>
    );
  }

  // Error
  if (error) {
    return (
      <View style={{ marginVertical: 20 }}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>All Around India</Text>
          <TouchableOpacity onPress={() => navigation.navigate("ViewAllAroundIndia")}>
            <Text style={styles.link}>View All</Text>
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

  // Success UI
  return (
    <View >
      <View style={styles.headerRow}>
        <Text style={styles.heading}>All Around India</Text>
        <TouchableOpacity style={styles.seeButton} onPress={() => navigation.navigate("ViewAllAroundIndia")}>
          <Text style={styles.link}>See All</Text>
          <Image source={require("../../../assets/via-farm-img/icons/see.png")} />
        </TouchableOpacity>
      </View>

      {items.length > 0 ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          renderItem={({ item }) => (
            <ProductCard id={item.id} name={item.name} image={item.image} onPress={openProductDetails} />
          )}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No products found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default AllAroundIndia;

const styles = StyleSheet.create({
  heading: { fontSize: 20, marginLeft: 20, fontWeight: "600" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15, paddingRight: 20 },
  link: { color: "rgba(1, 151, 218, 1)", fontWeight: "600" },

  seeButton: { flexDirection: "row", alignItems: "center", gap: 5 },
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

// Card styles matching your other components
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
