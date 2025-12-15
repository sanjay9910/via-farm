// File: components/dashboard/localBest/AllAroundIndia_responsive.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  PixelRatio,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE = "https://viafarm-1.onrender.com";

// ---------- Responsive helpers ----------
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

const normalizeFont = (size) => {
  const newSize = moderateScale(size);
  if (Platform.OS === "ios") {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
};
// -----------------------------------------

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
      <Text allowFontScaling={false} style={cardStyles.name} numberOfLines={1}>
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
            <Text allowFontScaling={false} style={styles.link}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA500" />
          <Text allowFontScaling={false} style={styles.loadingText}>Fetching products across India...</Text>
        </View>
      </View>
    );
  }

  // Error
  if (error) {
    return (
      <View style={{ marginVertical: moderateScale(20) }}>
        <View style={styles.headerRow}>
          <Text allowFontScaling={false}  style={styles.heading}>All Around India</Text>
          <TouchableOpacity onPress={() => navigation.navigate("ViewAllAroundIndia")}>
            <Text allowFontScaling={false} style={styles.link}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.errorContainer}>
          <Text allowFontScaling={false} style={styles.errorText}>{error}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text allowFontScaling={false} style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            {error.toLowerCase().includes("login") && (
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text allowFontScaling={false} style={styles.buttonText}>Go to Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Success UI
  return (
    <View>
      <View style={styles.headerRow}>
        <Text allowFontScaling={false} style={styles.heading}>All Around India</Text>
        <TouchableOpacity style={styles.seeButton} onPress={() => navigation.navigate("ViewAllAroundIndia")}>
          <Text allowFontScaling={false} style={styles.link}>See All</Text>
          <Image
            source={require("../../../assets/via-farm-img/icons/see.png")}
          />
        </TouchableOpacity>
      </View>

      {items.length > 0 ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: moderateScale(10) }}
          renderItem={({ item }) => (
            <ProductCard id={item.id} name={item.name} image={item.image} onPress={openProductDetails} />
          )}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Text allowFontScaling={false} style={styles.noDataText}>No products found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text allowFontScaling={false} style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default AllAroundIndia;

const styles = StyleSheet.create({
  heading: { fontSize: normalizeFont(13), marginLeft: moderateScale(20), fontWeight: "600" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: verticalScale(15), paddingRight: moderateScale(20) },
  link: { color: "rgba(1, 151, 218, 1)", fontWeight: "600", fontSize: normalizeFont(12) },

  seeButton: { flexDirection: "row", alignItems: "center",gap:5 },


  loadingContainer: { alignItems: "center", padding: moderateScale(20) },
  loadingText: { marginTop: verticalScale(10), color: "#777", fontSize: normalizeFont(10) },

  errorContainer: { alignItems: "center", padding: moderateScale(20), backgroundColor: "#ffebee", borderRadius: moderateScale(8), marginHorizontal: moderateScale(20) },
  errorText: { color: "#d32f2f", textAlign: "center", marginBottom: moderateScale(15), fontSize: normalizeFont(14) },

  buttonContainer: { flexDirection: "row" },
  retryButton: { backgroundColor: "#1976d2", paddingVertical: moderateScale(10), paddingHorizontal: moderateScale(20), borderRadius: moderateScale(5), marginRight: moderateScale(10) },
  loginButton: { backgroundColor: "#388e3c", paddingVertical: moderateScale(10), paddingHorizontal: moderateScale(20), borderRadius: moderateScale(5) },

  buttonText: { color: "white", fontWeight: "600", fontSize: normalizeFont(14) },

  noDataContainer: { alignItems: "center", padding: moderateScale(20) },
  noDataText: { color: "#666", fontSize: normalizeFont(14) },
});

const cardStyles = StyleSheet.create({
  container: { alignItems: "center", marginHorizontal: moderateScale(8), width: moderateScale(120) },
  card: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    width: moderateScale(120),
    height: moderateScale(120),
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    marginBottom: moderateScale(5),
  },
  image: { width: "100%", height: "100%", borderRadius: moderateScale(8) },
  name: { fontSize: normalizeFont(12), fontWeight: "500", color: "#333", textAlign: "center", flexWrap: "wrap", width: moderateScale(100) },
});
