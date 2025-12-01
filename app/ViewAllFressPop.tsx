import { Ionicons } from '@expo/vector-icons';
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
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FreshVendor from "../components/common/FreshVendor";
import { moderateScale, normalizeFont, scale } from './Responsive';

const API_BASE = "https://viafarm-1.onrender.com";
const CARD_WIDTH = Dimensions.get("window").width / 2 - 25;

const ProductCard = ({
  item,
  isFavorite,
  onToggleFavorite,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity,
  onPress,
}) => {
  const qty = cartQuantity || 0;
  const inCart = qty > 0;

  const imageUri =
    item?.images && Array.isArray(item.images) && item.images.length > 0
      ? item.images[0]
      : item?.image ||
        "https://via.placeholder.com/150/FFA500/FFFFFF?text=No+Image";

  const rating = (item?.rating && Number(item.rating)) ? Number(item.rating) : 0;
  const status = item?.status ?? (item?.stock === 0 ? "Out of Stock" : "In Stock");

  return (
    <View style={[cardStyles.container]}>
      <TouchableOpacity
        style={cardStyles.card}
        activeOpacity={0.8}
        onPress={() => onPress && onPress(item)}
      >
        <View style={[cardStyles.imageContainer, { height: cardStyles.imageHeight }]}>
          <Image
            source={{ uri: imageUri }}
            style={cardStyles.productImage}
            resizeMode="stretch"
          />

          {/* Wishlist Icon */}
          <TouchableOpacity
            style={cardStyles.favoriteButton}
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleFavorite && onToggleFavorite(item);
            }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={25}
              color={isFavorite ? '#ff4444' : '#fff'}
            />
          </TouchableOpacity>

          {/* Rating */}
          <View style={cardStyles.ratingContainer}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={cardStyles.ratingText}>
              {rating ? rating.toFixed(1) : "0.0"}
            </Text>
          </View>
        </View>

        <View style={cardStyles.cardContent}>
          <Text style={cardStyles.productTitle} numberOfLines={1}>
            {item?.name || "Unnamed product"}
          </Text>
          <Text style={cardStyles.productSubtitle} numberOfLines={1}>
            by {item?.vendor?.name || "Unknown Vendor"}
          </Text>

          {item?.variety ? (
            <Text style={cardStyles.productSubtitle}>Variety: {item.variety}</Text>
          ) : null}

          <View style={cardStyles.priceContainer}>
            <Text style={cardStyles.productPrice}>₹{item?.price ?? "0"}</Text>
            <Text style={cardStyles.productUnit}>/{item?.unit ?? "unit"}</Text>
            {item?.weightPerPiece ? <Text style={cardStyles.productUnit}>{item.weightPerPiece}</Text> : null}
          </View>

          <View style={cardStyles.buttonContainer}>
            {!inCart ? (
              <TouchableOpacity
                style={[
                  cardStyles.addToCartButton,
                  status !== "In Stock" && cardStyles.disabledButton
                ]}
                activeOpacity={0.7}
                disabled={status !== "In Stock"}
                onPress={(e) => {
                  e.stopPropagation?.();
                  onAddToCart && onAddToCart(item);
                }}
              >
                <Text style={cardStyles.addToCartText}>
                  {status === "In Stock" ? "Add to Cart" : status}
                </Text>
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
                  <Text style={cardStyles.quantityText}>{qty}</Text>
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

const ViewAllFressPop = () => {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState({});

  // Fetch Fresh & Popular
  const fetchFreshAndPopular = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const res = await axios.get(`${API_BASE}/api/buyer/fresh-and-popular`, {
        headers,
        timeout: 10000,
      });

      let fetched = [];
      if (!res || !res.data) {
        fetched = [];
      } else if (Array.isArray(res.data)) {
        fetched = res.data;
      } else if (res.data.success && Array.isArray(res.data.data)) {
        fetched = res.data.data;
      } else if (Array.isArray(res.data.data)) {
        fetched = res.data.data;
      } else if (Array.isArray(res.data?.data?.data)) {
        fetched = res.data.data.data;
      } else {
        fetched = res.data.data || [];
      }

      setItems(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.error("Error fetching fresh & popular:", err);
      if (err.response?.status === 401) {
        setError("Please login to view items");
      } else if (err.code === "ECONNABORTED") {
        setError("Request timeout. Please try again.");
      } else if (!err.response) {
        setError("Network error. Check your connection.");
      } else {
        setError("Failed to load items. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Wishlist and cart functions
  const fetchWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${API_BASE}/api/buyer/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        const wishlistItems = response.data.data?.items || [];
        const favoriteIds = new Set(wishlistItems.map(item => item.productId || item._id || item.id));
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const fetchCart = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${API_BASE}/api/buyer/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        const items = response.data.data?.items || [];
        const cartMap = {};
        items.forEach(item => {
          const productId = item.productId || item._id || item.id;
          cartMap[productId] = {
            quantity: item.quantity || item.qty || 1,
            cartItemId: item._id || item.id || item.cartItemId
          };
        });
        setCartItems(cartMap);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  useEffect(() => {
    fetchFreshAndPopular();
    fetchWishlist();
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add to / remove from wishlist (optimistic + silent)
  const addToWishlist = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to wishlist');
        return;
      }
      const productId = product._id || product.id;

      // optimistic UI
      setFavorites(prev => new Set(prev).add(productId));

      const payload = {
        productId,
        name: product.name,
        image: (product.images && product.images[0]) || product.image || '',
        price: product.price,
        category: product.category || '',
        variety: product.variety || '',
        unit: product.unit || '',
        weight: product.weightPerPiece,
      };
      await axios.post(`${API_BASE}/api/buyer/wishlist/add`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // silent success
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      // rollback
      const productId = product._id || product.id;
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      if (!err.response) {
        Alert.alert('Network Error', 'Failed to add to wishlist');
      }
    }
  };

  const removeFromWishlist = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const productId = product._id || product.id;

      // optimistic UI remove
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });

      await axios.delete(`${API_BASE}/api/buyer/wishlist/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // silent success
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      // rollback
      const productId = product._id || product.id;
      setFavorites(prev => new Set(prev).add(productId));
      if (!err.response) {
        Alert.alert('Network Error', 'Failed to remove from wishlist');
      }
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

  // Add to cart (optimistic + silent)
  const handleAddToCart = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to cart');
        return;
      }
      const productId = product._id || product.id;

      // optimistic UI: set quantity = 1
      setCartItems(prev => ({
        ...prev,
        [productId]: {
          quantity: 1,
          cartItemId: prev[productId]?.cartItemId || productId
        }
      }));

      const payload = {
        productId,
        name: product.name,
        image: (product.images && product.images[0]) || product.image || '',
        price: product.price,
        quantity: 1,
        category: product.category || '',
        variety: product.variety || '',
        unit: product.unit || ''
      };
      const res = await axios.post(`${API_BASE}/api/buyer/cart/add`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        const serverId = res.data.data?._id || productId;
        // ensure server id present
        setCartItems(prev => ({
          ...prev,
          [productId]: { quantity: prev[productId]?.quantity || 1, cartItemId: serverId }
        }));
      } else {
        // rollback
        setCartItems(prev => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      // rollback optimistic change
      const productId = product._id || product.id;
      setCartItems(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      if (err.response?.status === 400) {
        // likely already in cart — refresh quietly
        await fetchCart();
      } else {
        Alert.alert('Error', 'Failed to add to cart');
      }
    }
  };

  // Update cart quantity (optimistic)
  const handleUpdateQuantity = async (product, change) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to update cart');
        return;
      }

      const productId = product._id || product.id;
      const currentItem = cartItems[productId];
      if (!currentItem) return;

      const newQuantity = (currentItem.quantity || 0) + change;

      if (newQuantity < 1) {
        // optimistic remove
        setCartItems(prev => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });

        const res = await axios.delete(`${API_BASE}/api/buyer/cart/${currentItem.cartItemId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.data?.success) {
          // rollback by refetching
          await fetchCart();
        }
      } else {
        // optimistic update
        setCartItems(prev => ({
          ...prev,
          [productId]: { ...currentItem, quantity: newQuantity }
        }));

        const res = await axios.put(`${API_BASE}/api/buyer/cart/${currentItem.cartItemId}/quantity`, { quantity: newQuantity }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.data?.success) {
          // rollback
          await fetchCart();
        }
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      await fetchCart();
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  // Open product details
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
    fetchFreshAndPopular();
    fetchWishlist();
    fetchCart();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
          <Image
            source={require("../assets/via-farm-img/icons/groupArrow.png")}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fresh & Popular</Text>
        <View style={{ width: scale(50) }} />
      </View>

      <FreshVendor />

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA500" />
          <Text style={styles.loadingText}>Fetching fresh & popular items...</Text>
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

      {/* Success - Items List */}
      {!loading && !error && (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id || item.id || String(item?.name)}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: moderateScale(10), paddingBottom: moderateScale(20) }}
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
          columnWrapperStyle={{ justifyContent: "space-between" }}
          ListEmptyComponent={() =>
            !loading && (
              <View style={{ padding: moderateScale(20), alignItems: 'center' }}>
                <Text style={{ color: '#444' }}>No items found</Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
};
export default ViewAllFressPop;

// Card Styles - Updated to match ViewAllFressPop
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
    fontSize: normalizeFont(15),
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
    fontSize: normalizeFont(12),
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

const cardStyles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginLeft: moderateScale(6),
    marginTop: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius:12,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    elevation: 7,
    shadowOffset: { width: 0, height: 3 },
  },

  // image area
  imageContainer: {
    width: '100%',
    height: scale(140),
    backgroundColor: '#f6f6f6',
  },
  imageHeight: scale(135),
  productImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius:10,
    borderTopRightRadius:10,
  },


  favoriteButton: {
    position: 'absolute',
    top: moderateScale(2),
    right: moderateScale(2),
    borderRadius: 16,
    width: scale(30),
    height: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
    shadowRadius: 4,
  },


  ratingContainer: {
    position: 'absolute',
    bottom: moderateScale(10),
    left: moderateScale(8),
    backgroundColor: 'rgba(141, 141, 141, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(14),
  },
  ratingText: {
    color: '#fff',
    fontSize: normalizeFont(11),
    marginLeft: moderateScale(6),
    fontWeight: '600',
  },

  cardContent: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(10),
  },
  productTitle: {
    fontSize: normalizeFont(13),
    fontWeight: '600',
    color: '#2b2b2b',

  },

  productVeriety: {
    color: 'rgba(66, 66, 66, 0.7)',
    fontSize: normalizeFont(12),
  },

  productSubtitle: {
    fontSize: normalizeFont(12),
    color: '#666',
    marginBottom: moderateScale(3),
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: moderateScale(5),
  },
  productPrice: {
    fontSize: normalizeFont(12),
    fontWeight: '800',
    color: '#666',
  },
  productUnit: {
    fontSize: normalizeFont(12),
    color: '#666',
    marginLeft: moderateScale(6),
    marginBottom: moderateScale(2),
  },
  weightText: {
    fontSize: normalizeFont(11),
    color: '#777',
    marginLeft: moderateScale(6),
  },


  buttonContainer: {
    marginTop: moderateScale(6),
    alignItems: 'stretch',
  },
  addToCartButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    borderRadius: 8,
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  addToCartText: {
    color: '#fff',
    fontSize: normalizeFont(13),
    fontWeight: '700',
  },


  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 1)',
    borderRadius: 8,
    paddingHorizontal: moderateScale(4),
    height: scale(36),
    minWidth: scale(120),
    backgroundColor: '#fff',
  },
  quantityButton: {
    width: scale(36),
    height: scale(36),
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '700',
    textAlign: 'center',
  },
});
