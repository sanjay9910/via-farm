import { moderateScale, normalizeFont, scale } from "@/app/Responsive";
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
  View,
} from "react-native";

const API_BASE = "https://viafarm-1.onrender.com";

// ✅ Reusable Product Card (updated: accepts onPress and product)
const ProductCard = ({ id, name, image, onPress, product }) => {
  return (
    <TouchableOpacity
      style={cardStyles.container}
      activeOpacity={0.85}
      onPress={() => onPress && onPress(product)}
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
      <Text style={cardStyles.name} numberOfLines={1}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const Seeds = () => {
  const navigation = useNavigation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSeeds = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("userToken");

      const response = await axios.get(
        `${API_BASE}/api/buyer/products/by-category?category=Seeds`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      // console.log("🌱 Seeds API Response:", response.data);

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const formattedData = response.data.data.map((item, index) => ({
          id: item._id || `seed-${index}`,
          name: item.name || "Unnamed",
          image:
            item.images && item.images.length > 0
              ? item.images[0]
              : item.image ||
                "https://via.placeholder.com/150/FFA500/FFFFFF?text=No+Image",
          raw: item, // keep original item to pass to detail screen
        }));
        setData(formattedData);
      } else {
        setError("No seeds found");
        setData([]);
      }
    } catch (err) {
      console.error("❌ Error fetching seeds:", err);
      if (err.response?.status === 401) {
        setError("Unauthorized. Please login to view seeds");
      } else if (err.code === "ECONNABORTED") {
        setError("Request timeout. Please try again.");
      } else if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Failed to load seeds. Please try again.");
      }
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeeds();
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchSeeds();
  };

  const handleLogin = () => {
    navigation.navigate("login");
  };

  // OPEN DETAILS: receives full product object (formatted item)
  const openProductDetails = (product) => {
    if (!product) {
      console.warn("openProductDetails: missing product");
      Alert.alert("Error", "Product data missing");
      return;
    }

    const productId = product.raw?._id || product.id || product.raw?.id;

    try {
      navigation.navigate("ViewProduct", { productId, product: product.raw ?? product });
    } catch (e1) {
      console.error("Navigation primary route failed:", e1);
      try {
        navigation.navigate("ViewOrderProduct", { productId, product: product.raw ?? product });
      } catch (e2) {
        console.error("Navigation fallback failed:", e2);
        Alert.alert("Navigation Error", "Could not open product detail screen. Check route names.");
      }
    }
  };

  // ⏳ Loading
  if (loading) {
    return (
      <View style={{ marginVertical: 10 }}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Seeds</Text>
          <TouchableOpacity onPress={() => navigation.navigate("AllSeeds")}>
            <Text style={styles.link}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Fetching seeds...</Text>
        </View>
      </View>
    );
  }

  // ⚠️ Error
  if (error) {
    return (
      <View style={{ marginVertical: 10 }}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Seeds</Text>
          <TouchableOpacity onPress={() => navigation.navigate("AllSeeds")}>
            <Text style={styles.link}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            {String(error).toLowerCase().includes("login") && (
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.buttonText}>Go to Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ✅ Success
  return (
    <View style={{ marginVertical: 10 }}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Seeds</Text>
        <TouchableOpacity
          style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5 }}
          onPress={() => navigation.navigate("ViewAllSeeds")}
        >
          <Text style={styles.link}>See All</Text>
          <Image source={require("../../assets/via-farm-img/icons/see.png")} />
        </TouchableOpacity>
      </View>

      {data.length > 0 ? (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 5 }}
          renderItem={({ item }) => (
            <ProductCard
              id={item.id}
              name={item.name}
              image={item.image}
              product={item}
              onPress={openProductDetails}
            />
          )}
        />
      ) : (
        <View style={[styles.noDataContainer, { paddingBottom: 5 }]}>
          <Text style={styles.noDataText}>No seeds available right now</Text>
        </View>
      )}
    </View>
  );
};

export default Seeds;

// ✅ Styles same as Fruits/Vegetables/Plants/Handicrafts
const styles = StyleSheet.create({
  heading: {
    fontSize: normalizeFont(16),
    marginLeft: moderateScale(20),
    fontWeight: "600",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(15),
    paddingRight: moderateScale(20),
  },
  link: {
    color: "rgba(1, 151, 218, 1)",
    fontWeight: "600",
    fontSize:normalizeFont(12),
  },
  loadingContainer: {
    alignItems: "center",
    padding: moderateScale(20),
  },
  loadingText: {
    marginTop: moderateScale(10),
    color: "#777",
  },
  errorContainer: {
    alignItems: "center",
    padding: moderateScale(20),
    backgroundColor: "#ffebee",
    borderRadius: moderateScale(8),
    marginHorizontal: moderateScale(20),
  },
  errorText: {
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: moderateScale(15),
    fontSize: normalizeFont(13),
  },
  buttonContainer: {
    flexDirection: "row",
    gap: scale(10),
  },
  retryButton: {
    backgroundColor: "#1976d2",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
    borderRadius: 5,
  },
  loginButton: {
    backgroundColor: "#388e3c",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(5),
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  noDataContainer: {
    alignItems: "center",
    padding: moderateScale(20),
  },
  noDataText: {
    color: "#666",
    fontSize: normalizeFont(13),
  },
});

// ✅ Same card design as NewSeason
const cardStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginHorizontal: moderateScale(8),
    width: scale(120),
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: scale(120),
    height: scale(120),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  name: {
    fontSize: normalizeFont(12),
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
    marginTop: moderateScale(4),
    flexWrap: "wrap",
    width: scale(100),
  },
});
