// ViewAllFressPop.tsx
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
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FreshVendor from "../components/common/FreshVendor";
import { moderateScale, normalizeFont, scale } from './Responsive';

const API_BASE = "https://viafarm-1.onrender.com";

/* ---------------------------
   ProductCard (with qty-edit modal)
   - accepts cardWidth prop to keep width responsive
   - Do not change external APIs: uses onUpdateQuantity(item, delta)
   --------------------------- */
const ProductCard = ({
  item,
  isFavorite,
  onToggleFavorite,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity,
  onPress,
  cardWidth,
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

  // Local modal state for editing exact quantity
  const [qtyModalVisible, setQtyModalVisible] = useState(false);
  const [editQuantity, setEditQuantity] = useState(String(qty));

  useEffect(() => {
    setEditQuantity(String(qty));
  }, [qty]);

  const openQtyModal = (e) => {
    e?.stopPropagation?.();
    setEditQuantity(String(qty));
    setQtyModalVisible(true);
  };

  const closeQtyModal = () => {
    setQtyModalVisible(false);
  };

  const applyQuantityChange = () => {
    const parsed = parseInt(String(editQuantity).replace(/\D/g, ''), 10);
    const newQty = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    const currentQty = qty;
    const delta = newQty - currentQty;

    if (delta === 0) {
      closeQtyModal();
      return;
    }

    try {
      onUpdateQuantity && onUpdateQuantity(item, delta);
    } catch (err) {
      console.error("applyQuantityChange error:", err);
    } finally {
      closeQtyModal();
    }
  };

  const incrementEdit = () => {
    const v = parseInt(editQuantity || "0", 10) || 0;
    setEditQuantity(String(v + 1));
  };
  const decrementEdit = () => {
    const v = parseInt(editQuantity || "0", 10) || 0;
    setEditQuantity(String(Math.max(0, v - 1)));
  };

  return (
    <View style={[cardStyles.container, { width: cardWidth }]}>
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
              size={scale(22)}
              color={isFavorite ? '#ff4444' : '#fff'}
            />
          </TouchableOpacity>

          {/* Rating */}
          <View style={cardStyles.ratingContainer}>
            <Ionicons name="star" size={scale(12)} color="#FFD700" />
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
            By {item?.vendor?.name || "Unknown Vendor"}
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
              <>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={openQtyModal}
                  onLongPress={(e) => { e.stopPropagation?.(); openQtyModal(e); }}
                >
                  <View style={cardStyles.quantityContainer}>
                    <TouchableOpacity
                      style={cardStyles.quantityButton}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        onUpdateQuantity && onUpdateQuantity(item, -1);
                      }}
                    >
                      <Ionicons name="remove" size={scale(16)} color="rgba(76, 175, 80, 1)" />
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
                      <Ionicons name="add" size={scale(16)} color="rgba(76, 175, 80, 1)" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {/* Quantity edit modal */}
                <Modal
                  visible={qtyModalVisible}
                  animationType="fade"
                  transparent
                  onRequestClose={closeQtyModal}
                >
                  <TouchableOpacity
                    style={[modalStyles.backdrop]}
                    activeOpacity={1}
                    onPress={closeQtyModal}
                  >
                    <View style={[modalStyles.modalWrap, { maxWidth: Math.min(420, Dimensions.get('window').width - moderateScale(40)) }]}>
                      <Text style={modalStyles.modalTitle}>Add Quantity</Text>

                      <View style={modalStyles.editRow}>
                        <TouchableOpacity style={modalStyles.pickerBtn} onPress={decrementEdit}>
                          <Ionicons name="remove" size={scale(18)} color="#111" />
                        </TouchableOpacity>

                        <TextInput
                          style={modalStyles.qtyInput}
                          keyboardType="number-pad"
                          value={String(editQuantity)}
                          onChangeText={(t) => setEditQuantity(t.replace(/[^0-9]/g, ""))}
                          maxLength={5}
                          placeholder="0"
                          placeholderTextColor="#999"
                        />

                        <TouchableOpacity style={modalStyles.pickerBtn} onPress={incrementEdit}>
                          <Ionicons name="add" size={scale(18)} color="#111" />
                        </TouchableOpacity>
                      </View>

                      <View style={modalStyles.modalActions}>
                        <TouchableOpacity style={modalStyles.cancelBtn} onPress={closeQtyModal}>
                          <Text style={modalStyles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={modalStyles.okBtn} onPress={applyQuantityChange}>
                          <Text style={modalStyles.okText}>OK</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Modal>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

/* ---------------------------
   Main screen: ViewAllFressPop
   (kept your original logic, only uses updated ProductCard above)
   --------------------------- */
const ViewAllFressPop = () => {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState({});

  const window = useWindowDimensions();

  // compute responsive card width for 2 columns with padding/gap considered
  const horizontalPadding = moderateScale(10) * 2; // left + right padding on FlatList content
  const columnGap = moderateScale(10); // space between columns
  const computedCardWidth = Math.max(120, Math.floor((window.width - horizontalPadding - columnGap) / 2));

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
  }, []);

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

  const handleAddToCart = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to cart');
        return;
      }
      const productId = product._id || product.id;
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
        setCartItems(prev => ({
          ...prev,
          [productId]: { quantity: prev[productId]?.quantity || 1, cartItemId: serverId }
        }));
      } else {
        setCartItems(prev => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      const productId = product._id || product.id;
      setCartItems(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      if (err.response?.status === 400) {
        await fetchCart();
      } else {
        Alert.alert('Error', 'Failed to add to cart');
      }
    }
  };

  // Update cart quantity (expects delta)
  const handleUpdateQuantity = async (product, delta) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to update cart');
        return;
      }

      const productId = product._id || product.id;
      const currentItem = cartItems[productId] || { quantity: 0, cartItemId: productId };
      const newQuantity = (currentItem.quantity || 0) + delta;

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
            style={{ width: scale(20), height: scale(20) }}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fresh & Popular</Text>
        <View />
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
                cardWidth={computedCardWidth}
              />
            );
          }}
          columnWrapperStyle={{ justifyContent: "space-between", gap: moderateScale(10) }}
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

/* ---------------------------
   Styles (card + modal + screen)
   Kept sizes responsive using moderateScale / normalizeFont / scale
   --------------------------- */

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
    flexDirection: 'row',
    backgroundColor: 'rgba(252, 252, 252, 1)',
    paddingVertical: moderateScale(10),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: moderateScale(10),
    alignItems: 'center',
    borderRadius: moderateScale(5),
  },
  searchInput: {
    flex: 1,
    fontSize: normalizeFont(10),
    color: '#222',
    paddingVertical: 0
  },
  backButtonContainer: {
    padding: moderateScale(2),
  },
  riceContainer: {
    flex: 1,
    gap: scale(5),
  },
  backIcon: {
    width: scale(20),
    height: scale(20),
  },
  headerTitle: {
    fontSize: normalizeFont(13),
    fontWeight: "600",
    color: "#333",
  },
  loadingContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: 'center',
    alignContent: 'center',
  },
  loadingText: {
    marginTop: moderateScale(10),
    color: "#777",
    fontSize: normalizeFont(11)
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
    fontSize: normalizeFont(11),
  },
  retryButton: {
    backgroundColor: "#1976d2",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(5),
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: normalizeFont(11),
  },
});

const cardStyles = StyleSheet.create({
  container: {
    // width is overridden dynamically via prop
    marginTop: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    overflow: 'hidden',
    shadowColor: 'grey',
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    borderWidth: moderateScale(1),
    borderColor: 'grey',
    elevation: 7,
    shadowOffset: { width: 0, height: moderateScale(3) },
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
    borderTopLeftRadius: moderateScale(10),
    borderTopRightRadius: moderateScale(10),
  },

  favoriteButton: {
    position: 'absolute',
    top: moderateScale(6),
    right: moderateScale(6),
    borderRadius: moderateScale(16),
    width: scale(30),
    height: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
    shadowRadius: moderateScale(4),
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
    fontSize: normalizeFont(10),
    marginLeft: moderateScale(6),
    fontWeight: '600',
  },

  cardContent: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(10),
  },
  productTitle: {
    fontSize: normalizeFont(12),
    fontWeight: '600',
    color: '#2b2b2b',
  },

  productVeriety: {
    color: 'rgba(66, 66, 66, 0.7)',
    fontSize: normalizeFont(11),
  },

  productSubtitle: {
    fontSize: normalizeFont(11),
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
    fontSize: normalizeFont(11),
    color: '#666',
    marginLeft: moderateScale(6),
    marginBottom: moderateScale(2),
  },

  buttonContainer: {
    marginTop: moderateScale(6),
    alignItems: 'stretch',
  },
  addToCartButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    borderRadius: moderateScale(8),
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(6),
    shadowOffset: { width: 0, height: moderateScale(3) },
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  addToCartText: {
    color: '#fff',
    fontSize: normalizeFont(12),
    fontWeight: '700',
  },

  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: moderateScale(1),
    borderColor: 'rgba(76, 175, 80, 1)',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(4),
    minWidth: scale(120),
    backgroundColor: '#fff',
  },
  quantityButton: {
    width: scale(36),
    height: scale(38),
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValueContainer: {
    minWidth: scale(48),
    paddingHorizontal: moderateScale(6),
    height: scale(36),
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: moderateScale(1),
    borderRightWidth: moderateScale(1),
    borderColor: 'rgba(76, 175, 80, 1)',
    flexDirection: 'row',
  },
  quantityText: {
    fontSize: normalizeFont(12),
    color: 'rgba(76, 175, 80, 1)',
    fontWeight: '700',
    textAlign: 'center',
  },
});

/* Modal styles for quantity edit */
const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(20),
  },
  modalWrap: {
    // width: "100%",
    maxWidth: moderateScale(360),
    backgroundColor: "#fff",
    borderRadius: moderateScale(10),
    padding: moderateScale(16),
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(8),
    shadowOffset: { width: 0, height: moderateScale(4) },
  },
  modalTitle: {
    fontSize: normalizeFont(14),
    fontWeight: "700",
    color: "#222",
    marginBottom: moderateScale(12),
    textAlign: "center",
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(12),
    marginBottom: moderateScale(14),
  },
  pickerBtn: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  qtyInput: {
    flex: 1,
    minHeight: moderateScale(44),
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: moderateScale(8),
    textAlign: "center",
    fontSize: normalizeFont(16),
    paddingVertical: moderateScale(8),
  },
  modalActions: {
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: moderateScale(8),
  },
  cancelBtn: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(8),
    width: '40%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: moderateScale(1),
    borderColor: "rgba(76, 175, 80, 1)"
  },
  cancelText: {
    color: "#666",
    fontSize: normalizeFont(13),
  },
  okBtn: {
    backgroundColor: "rgba(76, 175, 80, 1)",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(8),
    width: '40%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  okText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: normalizeFont(13),
  },
});
