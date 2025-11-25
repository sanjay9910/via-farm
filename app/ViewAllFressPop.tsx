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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, normalizeFont, scale } from './Responsive';

const API_BASE = "https://viafarm-1.onrender.com";

// ✅ Product Card with Wishlist & Cart functionality
const ProductCard = ({
  item,
  isFavorite,
  onToggleFavorite,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity,
  onPress, // <-- handler when card pressed
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
              color={isFavorite ? '#ff4444' : '#666'}
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

          {/* Price and Unit in same line */}
          <View style={cardStyles.priceContainer}>
            <Text style={cardStyles.productPrice}>₹{item?.price ?? "0"}</Text>
            <Text style={cardStyles.productUnit}>/{item?.unit ?? "unit"}</Text>
          </View>

          {/* Variety */}
          {item?.variety ? (
            <Text style={cardStyles.varietyText}>Variety: {item.variety}</Text>
          ) : null}

          {/* Add to Cart / Quantity Control */}
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
  const [items, setItems] = useState([]); // fresh & popular items
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

  // Add to / remove from wishlist
  const addToWishlist = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to wishlist');
        return;
      }
      const productId = product._id || product.id;
      const payload = {
        productId,
        name: product.name,
        image: (product.images && product.images[0]) || product.image || '',
        price: product.price,
        category: product.category || '',
        variety: product.variety || '',
        unit: product.unit || '',
      };
      const res = await axios.post(`${API_BASE}/api/buyer/wishlist/add`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setFavorites(prev => new Set(prev).add(productId));
        Alert.alert('Success', 'Added to wishlist!');
      } else {
        Alert.alert('Error', res.data?.message || 'Could not add to wishlist');
      }
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      if (err.response?.status === 400) {
        const productId = product._id || product.id;
        setFavorites(prev => new Set(prev).add(productId));
        Alert.alert('Info', 'Already in wishlist');
      } else {
        Alert.alert('Error', 'Failed to add to wishlist');
      }
    }
  };

  const removeFromWishlist = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
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
        Alert.alert('Removed', 'Removed from wishlist');
      } else {
        Alert.alert('Error', res.data?.message || 'Could not remove from wishlist');
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      Alert.alert('Error', 'Failed to remove from wishlist');
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

  // Add to cart
  const handleAddToCart = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to cart');
        return;
      }
      const productId = product._id || product.id;
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
        setCartItems(prev => ({
          ...prev,
          [productId]: {
            quantity: 1,
            cartItemId: res.data.data?._id || productId
          }
        }));
        Alert.alert('Success', 'Added to cart!');
      } else {
        Alert.alert('Error', res.data?.message || 'Could not add to cart');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      if (err.response?.status === 400) {
        await fetchCart();
        Alert.alert('Info', 'Product is already in cart');
      } else {
        Alert.alert('Error', 'Failed to add to cart');
      }
    }
  };

  // Update cart quantity
  const handleUpdateQuantity = async (product, change) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const productId = product._id || product.id;
      const currentItem = cartItems[productId];
      if (!currentItem) return;

      const newQuantity = (currentItem.quantity || 0) + change;

      if (newQuantity < 1) {
        const res = await axios.delete(`${API_BASE}/api/buyer/cart/${currentItem.cartItemId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) {
          setCartItems(prev => {
            const next = { ...prev };
            delete next[productId];
            return next;
          });
          Alert.alert('Removed', 'Item removed from cart');
        } else {
          await fetchCart();
          Alert.alert('Error', 'Failed to remove item');
        }
      } else {
        // optimistic UI update
        setCartItems(prev => ({
          ...prev,
          [productId]: { ...currentItem, quantity: newQuantity }
        }));

        const res = await axios.put(`${API_BASE}/api/buyer/cart/${currentItem.cartItemId}/quantity`, { quantity: newQuantity }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.data?.success) {
          setCartItems(prev => ({ ...prev, [productId]: currentItem }));
          Alert.alert('Error', 'Failed to update quantity');
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
        <View style={{ width: 50 }} />
      </View>

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
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
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
              <View style={{ padding: 20, alignItems: 'center' }}>
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
