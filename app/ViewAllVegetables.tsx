import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, normalizeFont, scale } from "./Responsive";

const API_BASE = "https://viafarm-1.onrender.com";

// ----------------- ProductCard (same design + functionality) -----------------
const ProductCard = ({
  item,
  isFavorite,
  onToggleFavorite,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity,
  onPress
}) => {
  const inCart = (cartQuantity || 0) > 0;

  const imageUri =
    item?.image ||
    (Array.isArray(item?.images) && item.images.length > 0 && item.images[0]) ||
    "https://via.placeholder.com/150/FFA500/FFFFFF?text=No+Image";

  const distance =
    item?.distanceFromVendor ?? item?.distance ?? item?.vendor?.distanceFromVendor ?? null;

  const status = item?.status ?? (item?.stock === 0 ? "Out of Stock" : "In Stock");

  const rating = typeof item?.rating === "number" ? item.rating : item?.rating ? Number(item.rating) : 0;

  return (
    <View style={[cardStyles.container]}>
      <TouchableOpacity
        style={cardStyles.card}
        activeOpacity={0.85}
        onPress={() => onPress && onPress(item)}
      >
        <View style={[cardStyles.imageContainer, { height: cardStyles.imageHeight }]}>
          <Image source={{ uri: imageUri }} style={cardStyles.productImage} resizeMode="cover" />

          {/* wishlist */}
          <TouchableOpacity
            style={cardStyles.favoriteButton}
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleFavorite && onToggleFavorite(item);
            }}
          >
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? "#ff4444" : "#fff"} />
          </TouchableOpacity>

          {/* rating */}
          <View style={cardStyles.ratingContainer}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={cardStyles.ratingText}>{rating ? Number(rating).toFixed(1) : "0.0"}</Text>
          </View>

          {/* status */}
          {/* <View style={[
            cardStyles.statusBadge,
            { backgroundColor: status === "In Stock" ? "#4CAF50" : status === "Out of Stock" ? "#f44336" : "#ff9800" }
          ]}>
            <Text style={cardStyles.statusText}>{status}</Text>
          </View> */}
        </View>

        <View style={cardStyles.cardContent}>
          <Text style={cardStyles.productTitle} numberOfLines={1}>{item?.name ?? "Unnamed product"}</Text>

          <View style={{ marginVertical: 5 }}>
            <Text numberOfLines={1} style={{ color: "#444", fontSize: 12 }}>{item?.vendor?.name ?? ""}</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Image source={require("../assets/via-farm-img/icons/cardMap.png")} style={{ width: 14, height: 14 }} />
            <Text style={{ fontSize: 12, color: "#444" }}>{distance ?? "0.0 km"}</Text>
          </View>

          <View style={cardStyles.priceContainer}>
            <Text style={cardStyles.productPrice}>₹{item?.price ?? "0"}</Text>
            <Text style={cardStyles.productUnit}>/{item?.unit ?? "unit"}</Text>
            {item?.weightPerPiece ? <Text style={cardStyles.weightText}>{item.weightPerPiece}</Text> : null}
          </View>

          <View style={cardStyles.buttonContainer}>
            {!inCart ? (
              <TouchableOpacity
                style={[cardStyles.addToCartButton, status !== "In Stock" && cardStyles.disabledButton]}
                activeOpacity={0.8}
                disabled={status !== "In Stock"}
                onPress={(e) => {
                  e.stopPropagation?.();
                  onAddToCart && onAddToCart(item);
                }}
              >
                <Text style={cardStyles.addToCartText}>{status === "In Stock" ? "Add to Cart" : status}</Text>
              </TouchableOpacity>
            ) : (
              <View style={cardStyles.quantityContainer}>
                <TouchableOpacity
                  style={cardStyles.quantityButton}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onUpdateQuantity && onUpdateQuantity(item, -1);
                  }}
                >
                  <Ionicons name="remove" size={16} color="rgba(76, 175, 80, 1)" />
                </TouchableOpacity>

                <View style={cardStyles.quantityValueContainer}>
                  <Text style={cardStyles.quantityText}>{cartQuantity}</Text>
                </View>

                <TouchableOpacity
                  style={cardStyles.quantityButton}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onUpdateQuantity && onUpdateQuantity(item, 1);
                  }}
                >
                  <Ionicons name="add" size={16} color="rgba(76, 175, 80, 1)" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// ----------------- ViewAllVegetables (parent) -----------------
const ViewAllVegetables = () => {
  const navigation = useNavigation();
  const [vegetables, setVegetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState({});
  const [query, setQuery] = useState("");

  const fetchVegetables = async () => {
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
        `${API_BASE}/api/buyer/products/by-category?category=Vegetables`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.success) {
        const arr = response.data.data || [];
        setVegetables(Array.isArray(arr) ? arr : []);
      } else {
        setVegetables([]);
        setError("No vegetables found in your area");
      }
    } catch (err) {
      console.error("Error fetching vegetables:", err);
      if (err.response?.status === 401) {
        setError("Please login to view vegetables");
      } else if (err.code === "ECONNABORTED") {
        setError("Request timeout. Please try again.");
      } else if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Failed to load vegetables. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const response = await axios.get(`${API_BASE}/api/buyer/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        const items = response.data.data?.items || [];
        const favIds = new Set(items.map(i => i.productId || i._id || i.id));
        setFavorites(favIds);
      }
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    }
  };

  const fetchCart = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const response = await axios.get(`${API_BASE}/api/buyer/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        const items = response.data.data?.items || [];
        const map = {};
        items.forEach(i => {
          const pid = i.productId || i._id || i.id;
          map[pid] = { quantity: i.quantity || 1, cartItemId: i._id || i.id };
        });
        setCartItems(map);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  };

  useEffect(() => {
    fetchVegetables();
    fetchWishlist();
    fetchCart();
  }, []);

  // client-side filter by name (case-insensitive)
  const filteredVegetables = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return vegetables;
    return vegetables.filter(v => (v?.name ?? "").toString().toLowerCase().includes(q));
  }, [vegetables, query]);

  // wishlist handlers
  const addToWishlist = async (product) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Login Required", "Please login to add items to wishlist");
        return;
      }
      const productId = product._id || product.id;
      const payload = {
        productId,
        name: product.name,
        image: product.images?.[0] || product.image || '',
        price: product.price,
        category: product.category || 'Vegetables',
        variety: product.variety || 'Standard',
        unit: product.unit || 'kg'
      };

      const res = await axios.post(`${API_BASE}/api/buyer/wishlist/add`, payload, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        setFavorites(prev => new Set(prev).add(productId));
        Alert.alert("Success", "Added to wishlist!");
      }
    } catch (err) {
      console.error("Error adding to wishlist:", err);
      if (err.response?.status === 400) {
        const productId = product._id || product.id;
        setFavorites(prev => new Set(prev).add(productId));
        Alert.alert("Info", "Already in wishlist");
      } else {
        Alert.alert("Error", "Failed to add to wishlist");
      }
    }
  };

  const removeFromWishlist = async (product) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;
      const productId = product._id || product.id;
      const res = await axios.delete(`${API_BASE}/api/buyer/wishlist/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        Alert.alert("Removed", "Removed from wishlist");
      }
    } catch (err) {
      console.error("Error removing wishlist:", err);
      Alert.alert("Error", "Failed to remove from wishlist");
    }
  };

  const handleToggleFavorite = async (product) => {
    const productId = product._id || product.id;
    if (favorites.has(productId)) {
      await removeFromWishlist(product);
    } else {
      await addToWishlist(product);
    }
  };

  // cart handlers
  const handleAddToCart = async (product) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Login Required", "Please login to add items to cart");
        return;
      }
      const productId = product._id || product.id;
      const payload = {
        productId,
        name: product.name,
        image: product.images?.[0] || product.image || '',
        price: product.price,
        quantity: 1,
        category: product.category || 'Vegetables',
        variety: product.variety || 'Standard',
        unit: product.unit || 'kg'
      };
      const res = await axios.post(`${API_BASE}/api/buyer/cart/add`, payload, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        setCartItems(prev => ({
          ...prev,
          [productId]: { quantity: 1, cartItemId: res.data.data?._id || productId }
        }));
        Alert.alert("Success", "Added to cart!");
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      if (err.response?.status === 400) {
        await fetchCart();
        Alert.alert("Info", "Product is already in cart");
      } else {
        Alert.alert("Error", "Failed to add to cart");
      }
    }
  };

  const handleUpdateQuantity = async (product, change) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;
      const productId = product._id || product.id;
      const current = cartItems[productId];
      if (!current) return;
      const newQty = current.quantity + change;

      if (newQty < 1) {
        const res = await axios.delete(`${API_BASE}/api/buyer/cart/${current.cartItemId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) {
          setCartItems(prev => {
            const next = { ...prev };
            delete next[productId];
            return next;
          });
          Alert.alert("Removed", "Item removed from cart");
        }
      } else {
        // optimistic
        setCartItems(prev => ({ ...prev, [productId]: { ...current, quantity: newQty } }));
        const res = await axios.put(`${API_BASE}/api/buyer/cart/${current.cartItemId}/quantity`, { quantity: newQty }, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        });
        if (!res.data?.success) {
          setCartItems(prev => ({ ...prev, [productId]: current }));
          Alert.alert("Error", "Failed to update quantity");
        }
      }
    } catch (err) {
      console.error("Error updating cart quantity:", err);
      await fetchCart();
      Alert.alert("Error", "Failed to update quantity");
    }
  };

  // navigation to details
  const openProductDetails = (product) => {
    try {
      const productId = product?._id || product?.id;
      if (!productId) {
        Alert.alert("Error", "Product id missing");
        return;
      }
      navigation.navigate("ViewProduct", { productId, product });
    } catch (err) {
      console.error("openProductDetails error:", err);
      Alert.alert("Navigation Error", "Could not open product details. See console.");
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchVegetables();
    fetchWishlist();
    fetchCart();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header with Search */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
          <Image source={require("../assets/via-farm-img/icons/groupArrow.png")}  />
        </TouchableOpacity>

        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color="#888" style={{ marginRight:moderateScale(8) }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search vegetables by name..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        <View style={{ width: 50 }} />
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA500" />
          <Text style={styles.loadingText}>Fetching fresh vegetables...</Text>
        </View>
      )}

      {/* Error */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Success */}
      {!loading && !error && (
        <>
          {filteredVegetables.length === 0 ? (
            <View style={{ padding:moderateScale(20), alignItems: "center" }}>
              <Text style={{ color: "#444" }}>No vegetables match “{query}”</Text>
            </View>
          ) : (
            <FlatList
              data={filteredVegetables}
              keyExtractor={(item) => item._id || item.id || String(item?.name)}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal:moderateScale(13), paddingBottom:moderateScale(20) }}
              renderItem={({ item }) => {
                const productId = item._id || item.id;
                const isFavorite = favorites.has(productId);
                const cartQuantity = cartItems[productId]?.quantity || 0;

                return (
                  <ProductCard
                    item={item}
                    isFavorite={isFavorite}
                    onToggleFavorite={handleToggleFavorite}
                    cartQuantity={cartQuantity}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onPress={openProductDetails}
                  />
                );
              }}
              columnWrapperStyle={{ justifyContent: "space-between", marginBottom:moderateScale(15) }}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

export default ViewAllVegetables;

// ----------------- styles -----------------
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  searchWrapper: {
    flex: 1,
    marginHorizontal: moderateScale(8),
    flexDirection: 'row',
    backgroundColor: 'rgba(252, 252, 252, 1)',
    paddingVertical: moderateScale(10),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: moderateScale(10),
    alignItems: 'center',
    borderRadius: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: normalizeFont(14),
    color: '#222',
    paddingVertical: 0
  },
  backButtonContainer: {
    padding: 1,
  },
  riceContainer: {
    flex: 1,
    gap: scale(5),
  },
  backIcon: {
    width: scale(24),
    height: scale(24),
  },
  headerTitle: {
    fontSize: normalizeFont(20),
    fontWeight: "600",
    color: "#333",
  },
  loadingContainer: {
    alignItems: "center",
    padding: moderateScale(20),
    flex: 1,
    justifyContent: 'center',
    alignContent: 'center',
  },
  loadingText: {
    marginTop: moderateScale(10),
    color: "#777",
  },
  errorContainer: {
    alignItems: "center",
    padding: moderateScale(20),
    backgroundColor: "#ffebee",
    borderRadius: 8,
    marginHorizontal: moderateScale(20),
    marginTop: moderateScale(20),
  },
  errorText: {
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: moderateScale(15),
    fontSize: normalizeFont(16),
  },
  retryButton: {
    backgroundColor: "#1976d2",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});

// ✅ Card Styles - Exact same as your design
const cardStyles = StyleSheet.create({
  container: {
    width: Dimensions.get("window").width / 2 - 25,
    marginLeft: moderateScale(5),
    marginTop: moderateScale(10),
    marginBottom: moderateScale(5),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: moderateScale(5),
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    elevation: 7,
  },
  imageContainer: {
    position: 'relative',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  imageHeight: scale(120),
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  favoriteButton: {
    position: 'absolute',
    top: moderateScale(8),
    right: moderateScale(8),
    borderRadius: 15,
    width: scale(30),
    height: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingContainer: {
    position: 'absolute',
    bottom: moderateScale(8),
    left: moderateScale(8),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(12),
  },
  ratingText: {
    color: '#fff',
    fontSize: normalizeFont(11),
    marginLeft: 2,
    fontWeight: '500',
  },
  statusBadge: {
    position: 'absolute',
    top: moderateScale(8),
    left: moderateScale(8),
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: normalizeFont(10),
    fontWeight: '500',
  },
  cardContent: {
    padding: moderateScale(5),
  },
  productTitle: {
    fontSize: normalizeFont(14),
    fontWeight: '600',
    color: '#333',
  },

  productVeriety: {
    color: 'rgba(66, 66, 66, 0.7)',
    fontSize: normalizeFont(12),
    paddingVertical: 1,
  },

  productSubtitle: {
    fontSize: normalizeFont(14),
    color: '#888',
    marginBottom: moderateScale(8),
    height: scale(20),
  },
  // Price and Unit in same line
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: moderateScale(6),
    marginTop: moderateScale(4),
  },
  productPrice: {
    fontSize: normalizeFont(14),
    fontWeight: '700',
    color: '#000',
  },
  productUnit: {
    fontSize: normalizeFont(12),
    color: '#666',
    marginLeft: 2,
  },
  varietyText: {
    fontSize: normalizeFont(12),
    color: '#666',
    marginBottom: moderateScale(8),
  },
  buttonContainer: {
    minHeight: scale(26),
    maxWidth: scale(158),
    justifyContent: 'center',
  },
  addToCartButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
    borderRadius: 10,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  addToCartText: {
    color: '#fff',
    fontSize: normalizeFont(12),
    fontWeight: '500',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 1)',
    borderRadius: 10,
    paddingHorizontal: moderateScale(4),
    height: scale(36),
    minWidth: scale(100),
    backgroundColor: '#fff',
  },
  quantityButton: {
    width: scale(36),
    height: scale(36),
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },

  quantityValueContainer: {
    minWidth: scale(48),
    paddingHorizontal: moderateScale(6),
    height: scale(36),
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(76, 175, 80, 1)',
    flexDirection: 'row',
  },

  quantityText: {
    fontSize: normalizeFont(16),
    color: 'rgba(76, 175, 80, 1)',
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
  },
  quantityCount: {
    fontSize: normalizeFont(14),
    color: 'rgba(76, 175, 80, 1)',
    fontWeight: '600',
    marginHorizontal: moderateScale(6),
  },

});
