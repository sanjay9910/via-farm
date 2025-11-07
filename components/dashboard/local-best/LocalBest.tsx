// LocalBest_responsive.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
// base guideline (iPhone X)
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
    // small compensation for Android rendering
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
};
// -----------------------------------------

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
      <View style={{ marginVertical: verticalScale(20), alignItems: "center" }}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Local Best</Text>
          <TouchableOpacity style={styles.seeButton} onPress={() => navigation.navigate("LocalBestView")}>
            <Image source={require("../../../assets/via-farm-img/icons/see.png")} style={styles.seeIcon} />
            <Text style={styles.link}>See All</Text>
          </TouchableOpacity>
        </View>

        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: verticalScale(10), color: "#666", fontSize: normalizeFont(12) }}>Discovering local products...</Text>
      </View>
    );
  }

  // Error
  if (error) {
    return (
      <View style={{ marginVertical: verticalScale(20), alignItems: "center" }}>
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
    <View style={{ marginVertical: verticalScale(20) }}>
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
          contentContainerStyle={{ paddingHorizontal: moderateScale(10) }}
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

// ✅ Styles (responsive)
const styles = StyleSheet.create({
  heading: { fontSize: normalizeFont(18), marginLeft: moderateScale(20), fontWeight: "600" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: verticalScale(15), paddingRight: moderateScale(20) },
  link: { color: "rgba(1, 151, 218, 1)", fontWeight: "600", fontSize: normalizeFont(13) },

  // NEW: See All container + icon styles
  seeButton: { flexDirection: "row", alignItems: "center", gap: moderateScale(5) },
  seeIcon: { width: moderateScale(18), height: moderateScale(18), marginRight: moderateScale(5), resizeMode: "contain" },

  loadingContainer: { alignItems: "center", padding: moderateScale(20) },
  loadingText: { marginTop: verticalScale(10), color: "#777", fontSize: normalizeFont(12) },
  errorContainer: { alignItems: "center", padding: moderateScale(20), backgroundColor: "#ffebee", borderRadius: moderateScale(8), marginHorizontal: moderateScale(20) },
  errorText: { color: "#d32f2f", textAlign: "center", marginBottom: moderateScale(15), fontSize: normalizeFont(14) },
  buttonContainer: { flexDirection: "row", gap: moderateScale(10) },
  retryButton: { backgroundColor: "#1976d2", paddingVertical: moderateScale(10), paddingHorizontal: moderateScale(20), borderRadius: moderateScale(5) },
  loginButton: { backgroundColor: "#388e3c", paddingVertical: moderateScale(10), paddingHorizontal: moderateScale(20), borderRadius: moderateScale(5) },
  buttonText: { color: "white", fontWeight: "600", fontSize: normalizeFont(14) },
  noDataContainer: { alignItems: "center", padding: moderateScale(20) },
  noDataText: { color: "#666", fontSize: normalizeFont(14) },
});

// Card styles responsive
const cardStyles = StyleSheet.create({
  container: { alignItems: "center", marginHorizontal: moderateScale(8), width: moderateScale(120) },
  card: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    width: moderateScale(120),
    height: moderateScale(120),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: 0.1,
  },
  image: { width: "100%", height: "100%", borderRadius: moderateScale(8) },
  name: { fontSize: normalizeFont(14), fontWeight: "500", color: "#333", textAlign: "center", flexWrap: "wrap", width: moderateScale(100) },
});
