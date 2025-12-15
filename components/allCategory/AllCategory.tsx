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

// ✅ Touchable Product Card
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
          resizeMode="stretch"
        />
      </View>
      <Text allowFontScaling={false} style={cardStyles.name} numberOfLines={1}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const AllCategory = () => {
  const navigation = useNavigation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_BASE}/api/buyer/with-products`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      // console.log("📦 All Categories API Response:", response.data);

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const formattedCategories = response.data.data.map((category) => ({
          id: category._id || category.name,
          name: category.name || "Unnamed Category",
          products: Array.isArray(category.products)
            ? category.products.map((item, index) => ({
                id: item._id || `product-${index}`,
                name: item.name || "Unnamed",
                image:
                  item.images && item.images.length > 0
                    ? item.images[0]
                    : "https://via.placeholder.com/150/FFA500/FFFFFF?text=No+Image",
                raw: item,
              }))
            : [],
        }));
        setCategories(formattedCategories);
      } else {
        setCategories([]);
        setError("No categories found");
      }
    } catch (err) {
      console.error("❌ Error fetching categories:", err);

      if (err.response?.status === 401) {
        setError("Please login to view categories");
      } else if (err.code === "ECONNABORTED") {
        setError("Request timeout. Please try again.");
      } else if (err.response?.status === 404) {
        setError("Categories not found");
      } else if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Failed to load categories. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCategories();
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchAllCategories();
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
        Alert.alert("Navigation Error", "Could not open product detail screen.");
      }
    }
  };

  // ⏳ Loading
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA500" />
          <Text allowFontScaling={false} style={styles.loadingText}>Loading all categories...</Text>
        </View>
      </View>
    );
  }

  // ⚠️ Error
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text allowFontScaling={false} style={styles.errorText}>{error}</Text>

          <View style={styles.buttonContainer}>
            {error.toLowerCase().includes("login") ? (
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
              >
                <Text allowFontScaling={false} style={styles.buttonText}>Go to Login</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
              >
                <Text allowFontScaling={false} style={styles.buttonText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ✅ Success - Render all categories
  return (
    <View style={styles.container}>
      {categories.length > 0 ? (
        <FlatList
          data={categories}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={false}
          renderItem={({ item: category }) => (
            <View style={styles.categorySection}>
              <View style={styles.headerRow}>
                <Text allowFontScaling={false} style={styles.heading}>{category.name}</Text>
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                  onPress={() => {
                    console.log("🔗 Navigating to CategoryViewAllProduct with:", {
                      categoryName: category.name,
                      categoryId: category.id,
                    });
                    navigation.navigate("CategoryVIewAllProduct", {
                      categoryName: category.name,
                      categoryId: category.id,
                    });
                  }}
                >
                  <Text allowFontScaling={false} style={styles.link}>See All</Text>
                  <Image source={require("../../assets/via-farm-img/icons/see.png")} />
                </TouchableOpacity>
              </View>

              {category.products.length > 0 ? (
                <FlatList
                  data={category.products}
                  keyExtractor={(item) => String(item.id)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 10 }}
                  scrollEnabled={true}
                  renderItem={({ item }) => (
                    <ProductCard
                      id={item.id}
                      name={item.name}
                      image={item.image}
                      onPress={openProductDetails}
                    />
                  )}
                />
              ) : (
                <View style={styles.noDataContainer}>
                  <Text allowFontScaling={false} style={styles.noDataText}>No products available</Text>
                </View>
              )}
            </View>
          )}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Text allowFontScaling={false} style={styles.noDataText}>No categories available right now</Text>
        </View>
      )}
    </View>
  );
};

export default AllCategory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  categorySection: {
    marginBottom: moderateScale(25),
  },
  heading: {
    fontSize: normalizeFont(15),
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
    fontSize: normalizeFont(13),
  },
  loadingContainer: {
    alignItems: "center",
    padding: moderateScale(20),
    justifyContent: "center",
    height: 200,
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
    marginTop: moderateScale(20),
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


