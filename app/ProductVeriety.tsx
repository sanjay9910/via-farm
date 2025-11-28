// ProductVarieties.jsx (FIXED - Same as ViewAllFruits Design)
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, normalizeFont, scale } from './Responsive';

const API_BASE = 'https://viafarm-1.onrender.com';
const CARD_WIDTH = Dimensions.get("window").width / 2 - 25;

// Same ProductCard as ViewAllFruits
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

  const imageUri = item?.image
    || (Array.isArray(item?.images) && item.images.length > 0 && item.images[0])
    || "https://via.placeholder.com/150/FFA500/FFFFFF?text=No+Image";

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
              size={23}
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

          <Text style={cardStyles.productVeriety} numberOfLines={1}>
            By: {item?.vendor?.name ?? "Unnamed product"}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap:scale(5) }}>
            <Image
              source={require("../assets/via-farm-img/icons/cardMap.png")}
            />
            <Text style={{ fontSize: normalizeFont(11) }}>
              {distance ?? "0.0 km"}
            </Text>
          </View>

          <View style={cardStyles.priceContainer}>
            <Text style={cardStyles.productUnit}>₹{item?.price ?? "0"}</Text>
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

// Main ProductVarieties Component
const ProductVarieties = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { product, productId, variety } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [varieties, setVarieties] = useState([]);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState({});
  const [query, setQuery] = useState("");

  // Fetch Varieties by variety name
  const fetchVarieties = async () => {
    try {
      setLoading(true);
      setError(null);

      const varietyName = variety || product?.variety || product?.name;

      if (!varietyName) {
        throw new Error('Variety name not found');
      }

      const token = await AsyncStorage.getItem('userToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(
        `${API_BASE}/api/buyer/products/variety?variety=${encodeURIComponent(varietyName)}`,
        { headers, timeout: 10000 }
      );

      const arr = response?.data?.data ?? response?.data?.varieties ?? response?.data ?? [];

      setVarieties(Array.isArray(arr) ? arr : []);
    } catch (err) {
      console.error('Fetch varieties error:', err);
      setError(err?.response?.data?.message || 'Failed to load varieties');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Wishlist
  const fetchWishlist = async () => {
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
  };

  // Fetch Cart
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
            quantity: item.quantity || 1,
            cartItemId: item._id || item.id
          };
        });
        setCartItems(cartMap);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  useEffect(() => {
    fetchVarieties();
    fetchWishlist();
    fetchCart();
  }, [product, productId, variety]);

  // Client-side filter by name
  const filteredVarieties = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return varieties;
    return varieties.filter(v =>
      (v?.name ?? "")
        .toString()
        .toLowerCase()
        .includes(q)
    );
  }, [varieties, query]);

  // Add to Wishlist
  const addToWishlist = async (prod) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to wishlist');
        return;
      }

      const prodId = prod._id || prod.id;

      const wishlistData = {
        productId: prodId,
        name: prod.name,
        image: prod.images?.[0] || prod.image || '',
        price: prod.price,
        category: prod.category || 'Products',
        variety: prod.variety || 'Standard',
        unit: prod.unit || 'kg'
      };

      const response = await axios.post(
        `${API_BASE}/api/buyer/wishlist/add`,
        wishlistData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        setFavorites(prev => new Set(prev).add(prodId));
        Alert.alert('Success', 'Added to wishlist!');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      if (error.response?.status === 400) {
        const prodId = prod._id || prod.id;
        setFavorites(prev => new Set(prev).add(prodId));
        Alert.alert('Info', 'Already in wishlist');
      } else {
        Alert.alert('Error', 'Failed to add to wishlist');
      }
    }
  };

  // Remove from Wishlist
  const removeFromWishlist = async (prod) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const prodId = prod._id || prod.id;

      const response = await axios.delete(
        `${API_BASE}/api/buyer/wishlist/${prodId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.success) {
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(prodId);
          return next;
        });
        Alert.alert('Removed', 'Removed from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      Alert.alert('Error', 'Failed to remove from wishlist');
    }
  };

  const handleToggleFavorite = async (prod) => {
    const prodId = prod._id || prod.id;
    if (favorites.has(prodId)) {
      await removeFromWishlist(prod);
    } else {
      await addToWishlist(prod);
    }
  };

  // Add to Cart
  const handleAddToCart = async (prod) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to cart');
        return;
      }

      const prodId = prod._id || prod.id;

      const cartData = {
        productId: prodId,
        name: prod.name,
        image: prod.images?.[0] || prod.image || '',
        price: prod.price,
        quantity: 1,
        category: prod.category || 'Products',
        variety: prod.variety || 'Standard',
        unit: prod.unit || 'kg'
      };

      const response = await axios.post(
        `${API_BASE}/api/buyer/cart/add`,
        cartData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        setCartItems(prev => ({
          ...prev,
          [prodId]: {
            quantity: 1,
            cartItemId: response.data.data?._id || prodId
          }
        }));
        Alert.alert('Success', 'Added to cart!');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (error.response?.status === 400) {
        fetchCart();
        Alert.alert('Info', 'Product is already in cart');
      } else {
        Alert.alert('Error', 'Failed to add to cart');
      }
    }
  };

  // Update Quantity
  const handleUpdateQuantity = async (prod, change) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const prodId = prod._id || prod.id;
      const currentItem = cartItems[prodId];
      if (!currentItem) return;

      const newQuantity = currentItem.quantity + change;

      if (newQuantity < 1) {
        const response = await axios.delete(
          `${API_BASE}/api/buyer/cart/${currentItem.cartItemId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data?.success) {
          setCartItems(prev => {
            const next = { ...prev };
            delete next[prodId];
            return next;
          });
          Alert.alert('Removed', 'Item removed from cart');
        }
      } else {
        setCartItems(prev => ({
          ...prev,
          [prodId]: { ...currentItem, quantity: newQuantity }
        }));

        const response = await axios.put(
          `${API_BASE}/api/buyer/cart/${currentItem.cartItemId}/quantity`,
          { quantity: newQuantity },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.data?.success) {
          setCartItems(prev => ({ ...prev, [prodId]: currentItem }));
          Alert.alert('Error', 'Failed to update quantity');
        }
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      fetchCart();
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const openProductDetails = (prod) => {
    try {
      const prodId = prod?._id || prod?.id;
      if (!prodId) {
        Alert.alert("Error", "Product id missing");
        return;
      }
      navigation.navigate("ViewProduct", { productId: prodId, product: prod });
    } catch (err) {
      console.error("openProductDetails error:", err);
      Alert.alert("Navigation Error", "Could not open product details");
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchVarieties();
    fetchWishlist();
    fetchCart();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header with Search */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require("../assets/via-farm-img/icons/groupArrow.png")}
          />
        </TouchableOpacity>

        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name..."
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
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA500" />
          <Text style={styles.loadingText}>Fetching varieties...</Text>
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

      {/* Success - Varieties List */}
      {!loading && !error && (
        <>
          {filteredVarieties.length === 0 ? (
            <View style={{ padding: moderateScale(20), alignItems: 'center' }}>
              <Text style={{ color: '#444' }}>No products match "{query}"</Text>
            </View>
          ) : (
            <FlatList
              data={filteredVarieties}
              keyExtractor={(item) => item._id || item.id || String(item?.name)}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 13, paddingBottom: 20 }}
              renderItem={({ item }) => {
                const prodId = item._id || item.id;
                const isFavorite = favorites.has(prodId);
                const cartQuantity = cartItems[prodId]?.quantity || 0;

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
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

export default ProductVarieties;

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
    paddingVertical:moderateScale(5)
  },

  productSubtitle: {
    fontSize: normalizeFont(12),
    color: '#666',
    marginBottom: moderateScale(3),
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop:moderateScale(4),
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
