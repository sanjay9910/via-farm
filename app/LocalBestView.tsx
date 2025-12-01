import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LocalVendor from "../components/common/LocalVendor";
import { moderateScale, normalizeFont, scale } from './Responsive';

const API_BASE = "https://viafarm-1.onrender.com";
const CARD_WIDTH = Dimensions.get("window").width / 2 - 25;

/**
 * Key changes:
 * - memoize LocalVendor with React.memo
 * - wrap handlers with useCallback so props to ProductCard remain stable
 * - memoize header (which contains LocalVendor) using useMemo
 * - use functional updates for cart/favorites to avoid recreating objects unnecessarily
 */

// Memoize LocalVendor (safe even if already memoized)
const MemoLocalVendor = React.memo(LocalVendor);

// ==================== ProductCard ====================
const ProductCard = React.memo(({
  item,
  isFavorite,
  onToggleFavorite,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity,
  onPress
}) => {
  const inCart = (cartQuantity || 0) > 0;

  const imageUri = item?.image
    || (Array.isArray(item?.images) && item.images.length > 0 && item.images[0])
    || "https://via.placeholder.com/300x300.png?text=No+Image";

  const distance =
    item?.distanceFromVendor ??
    item?.distance ??
    item?.vendor?.distanceFromVendor ??
    null;

  const status = item?.status ?? (item?.stock === 0 ? "Out of Stock" : "In Stock");

  const rating = (typeof item?.rating === "number") ? item.rating : (item?.rating ? Number(item.rating) : 0);

  return (
    <View style={[cardStyles.container]}>
      <TouchableOpacity
        style={cardStyles.card}
        activeOpacity={0.85}
        onPress={() => onPress && onPress(item)}
      >
        <View style={[cardStyles.imageContainer, { height: cardStyles.imageHeight }]}>
          <Image
            source={{ uri: imageUri }}
            style={cardStyles.productImage}
            resizeMode="stretch"
          />

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

          <View style={cardStyles.ratingContainer}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={cardStyles.ratingText}>
              {rating ? Number(rating).toFixed(1) : "0.0"}
            </Text>
          </View>
        </View>

        <View style={cardStyles.cardContent}>
          <Text style={cardStyles.productTitle} numberOfLines={1}>
            {item?.name ?? "Unnamed product"}
          </Text>

          <View style={{ marginVertical: moderateScale(3) }}>
            <Text numberOfLines={1} style={{ color: '#444', fontSize: normalizeFont(12) }}>
              By {item?.vendor?.name ?? item?.vendorName ?? "Local Vendor"}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Image
              source={require("../assets/via-farm-img/icons/loca.png")}
            />
            <Text style={{ fontSize: normalizeFont(12), color: '#444', paddingVertical: 3 }}>
              {distance ?? "0.0 km"}
            </Text>
          </View>

          <View style={cardStyles.priceContainer}>
            <Text style={cardStyles.productPrice}>₹{item?.price ?? "0"}</Text>
            <Text style={cardStyles.productUnit}>/{item?.unit ?? "unit"}</Text>
            {item?.weightPerPiece ? <Text style={cardStyles.weightText}>{item.weightPerPiece}</Text> : null}
          </View>

          <View style={cardStyles.buttonContainer}>
            {!inCart ? (
              <TouchableOpacity
                style={[
                  cardStyles.addToCartButton,
                  status !== "In Stock" && cardStyles.disabledButton
                ]}
                activeOpacity={0.8}
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
                  <Ionicons name="remove" size={20} color="rgba(76, 175, 80, 1)" />
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
                  <Ionicons name="add" size={20} color="rgba(76, 175, 80, 1)" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});

// ==================== ViewAllLocalBest ====================
const ViewAllLocalBest = () => {
  const navigation = useNavigation();
  const [localBestProducts, setLocalBestProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState({});

  // Fetch Local Best Products
  const fetchLocalBest = useCallback(async () => {
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
        `${API_BASE}/api/buyer/local-best?lat=28.6139&lng=77.2090`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.success) {
        const dataArray = response.data.data || [];
        setLocalBestProducts(Array.isArray(dataArray) ? dataArray : []);
      } else {
        setError("No local best products found");
      }
    } catch (err) {
      console.error("Error fetching local best:", err);
      if (err.response?.status === 401) {
        setError("Please login to view products");
      } else if (err.code === "ECONNABORTED") {
        setError("Request timeout. Please try again.");
      } else if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Failed to load products. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Wishlist
  const fetchWishlist = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${API_BASE}/api/buyer/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        const wishlistItems = response.data.data?.items || [];
        const favoriteIds = new Set(
          wishlistItems.map(item => item.productId || item._id || item.id)
        );
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  }, []);

  // Fetch Cart
  const fetchCart = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchLocalBest();
    fetchWishlist();
    fetchCart();
    // note: fetch functions are stable thanks to useCallback
  }, [fetchLocalBest, fetchWishlist, fetchCart]);

  // Add to Wishlist (optimistic & silent)
  const addToWishlist = useCallback(async (product) => {
    const productId = product._id || product.id;
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      Alert.alert('Login Required', 'Please login to add items to wishlist');
      return;
    }

    setFavorites(prev => {
      if (prev.has(productId)) return prev;
      const next = new Set(prev);
      next.add(productId);
      return next;
    });

    try {
      const wishlistData = {
        productId,
        name: product.name,
        image: product.images?.[0] || product.image || '',
        price: product.price,
        category: product.category || 'Local Best',
        variety: product.variety || 'Standard',
        unit: product.unit || 'kg'
      };
      await axios.post(`${API_BASE}/api/buyer/wishlist/add`, wishlistData, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      // rollback if failed
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      if (!error.response) Alert.alert('Network Error', 'Failed to add to wishlist');
    }
  }, []);

  // Remove from Wishlist (optimistic & silent)
  const removeFromWishlist = useCallback(async (product) => {
    const productId = product._id || product.id;
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      // nothing to do if not logged in
      return;
    }

    // optimistic remove
    setFavorites(prev => {
      if (!prev.has(productId)) return prev;
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });

    try {
      await axios.delete(`${API_BASE}/api/buyer/wishlist/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      // rollback
      setFavorites(prev => new Set(prev).add(productId));
      if (!error.response) Alert.alert('Network Error', 'Failed to remove from wishlist');
    }
  }, []);

  // Toggle Favorite
  const handleToggleFavorite = useCallback((product) => {
    const productId = product._id || product.id;
    if (favorites.has(productId)) {
      removeFromWishlist(product);
    } else {
      addToWishlist(product);
    }
  }, [favorites, addToWishlist, removeFromWishlist]);

  // Add to Cart (optimistic & silent)
  const handleAddToCart = useCallback(async (product) => {
    const productId = product._id || product.id;
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      Alert.alert('Login Required', 'Please login to add items to cart');
      return;
    }

    // optimistic UI - set quantity 1
    setCartItems(prev => {
      if (prev[productId]) return prev;
      return {
        ...prev,
        [productId]: {
          quantity: 1,
          cartItemId: prev[productId]?.cartItemId || productId
        }
      };
    });

    try {
      const cartData = {
        productId,
        name: product.name,
        image: product.images?.[0] || product.image || '',
        price: product.price,
        quantity: 1,
        category: product.category || 'Local Best',
        variety: product.variety || 'Standard',
        unit: product.unit || 'kg'
      };

      const response = await axios.post(`${API_BASE}/api/buyer/cart/add`, cartData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        const serverId = response.data.data?._id || productId;
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
    } catch (error) {
      console.error('Error adding to cart:', error);
      setCartItems(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      if (error.response?.status === 400) {
        await fetchCart();
      } else if (!error.response) {
        Alert.alert('Network Error', 'Failed to add to cart');
      }
    }
  }, [fetchCart]);

  // Update Quantity (optimistic)
  const handleUpdateQuantity = useCallback(async (product, change) => {
    const productId = product._id || product.id;
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      Alert.alert('Login Required', 'Please login to update cart');
      return;
    }

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

      try {
        const res = await axios.delete(`${API_BASE}/api/buyer/cart/${currentItem.cartItemId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.data?.success) {
          await fetchCart();
        }
      } catch (err) {
        console.error('Error removing from cart:', err);
        await fetchCart();
        if (!err.response) Alert.alert('Network Error', 'Failed to update cart');
      }
    } else {
      // optimistic update
      setCartItems(prev => ({
        ...prev,
        [productId]: { ...currentItem, quantity: newQuantity }
      }));

      try {
        const res = await axios.put(`${API_BASE}/api/buyer/cart/${currentItem.cartItemId}/quantity`, { quantity: newQuantity }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.data?.success) {
          await fetchCart();
        }
      } catch (err) {
        console.error('Error updating quantity:', err);
        await fetchCart();
        if (!err.response) Alert.alert('Network Error', 'Failed to update cart');
      }
    }
  }, [cartItems, fetchCart]);

  // Open Product Details
  const openProductDetails = useCallback((product) => {
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
  }, [navigation]);

  // Memoized header (won't be recreated on every render)
  const ListHeader = useMemo(() => {
    return (
      <View>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Local Best</Text>
          <View style={{ width: 50 }} />
        </View>

        <View>
          <MemoLocalVendor />
        </View>

        <View style={{ paddingHorizontal: moderateScale(10) }}>
          <Text style={{ fontSize: normalizeFont(13), fontWeight: "700" }}>Products</Text>
        </View>
      </View>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // no deps so created once

  const handleRetry = useCallback(() => {
    setError(null);
    fetchLocalBest();
    fetchWishlist();
    fetchCart();
  }, [fetchLocalBest, fetchWishlist, fetchCart]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA500" />
          <Text style={styles.loadingText}>Fetching local best products...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={localBestProducts}
          keyExtractor={(item, index) => (item._id || item.id || String(item?.name) || String(index))}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 11, paddingBottom: 20 }}
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
          ListHeaderComponent={ListHeader}
          removeClippedSubviews={true}
          initialNumToRender={8}
        />
      )}
    </SafeAreaView>
  );
};

export default ViewAllLocalBest;

// ✅ Styles
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: moderateScale(5),
    paddingVertical: moderateScale(5),
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
    padding: moderateScale(15),
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
    marginTop: moderateScale(7),
    marginBottom: moderateScale(8),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius:10,
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
    borderTopLeftRadius:5,
    borderTopRightRadius:5,
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
    marginBottom: moderateScale(8),
    height: scale(20),
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: moderateScale(5),
  },
  productPrice: {
    fontSize: normalizeFont(13),
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
