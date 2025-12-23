// ViewAllFressPop.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
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
const { width } = Dimensions.get('window');

/* ---------------------------
   ProductCard (with qty-edit modal)
   unchanged logic, receives cardWidth prop
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
              name={isFavorite ? "heart" : "heart-outline"}
              size={moderateScale(24)}
              color={isFavorite ? "#ff4757" : "#fff"}
              style={{
                textShadowColor: "rgba(0,0,0,0.7)", 
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 3,
              }}
            />
          </TouchableOpacity>

          {/* Rating */}
          <View style={cardStyles.ratingContainer}>
            <Ionicons name="star" size={scale(12)} color="#FFD700" />
            <Text allowFontScaling={false} style={cardStyles.ratingText}>
              {rating ? rating.toFixed(1) : "0.0"}
            </Text>
          </View>
        </View>

        <View style={cardStyles.cardContent}>
          <Text allowFontScaling={false} style={cardStyles.productTitle} numberOfLines={1}>
            {item?.name || "Unnamed product"}
          </Text>
          <Text allowFontScaling={false} style={cardStyles.productSubtitle} numberOfLines={1}>
            By {item?.vendor?.name || "Unknown Vendor"}
          </Text>

          {item?.variety ? (
            <View allowFontScaling={false} style={cardStyles.productSubtitle}>
              <Image style={{width:moderateScale(14), height:moderateScale(18),resizeMode:'stretch'}} source={require("../assets/via-farm-img/icons/iconlocation.png")} />
              <Text allowFontScaling={false} style={{ fontSize: normalizeFont(12), color: 'grey' }}>{item.distance}</Text></View>
          ) : null}

          <View style={cardStyles.priceContainer}>
            <Text allowFontScaling={false} style={cardStyles.productPrice}>₹{item?.price ?? "0"}</Text>
            <Text allowFontScaling={false} style={cardStyles.productUnit}>/{item?.unit ?? "unit"}</Text>
            {item?.weightPerPiece ? <Text allowFontScaling={false} style={cardStyles.productUnitt}>/{item.weightPerPiece}</Text> : null}
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
                <Text allowFontScaling={false} style={cardStyles.addToCartText}>
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
                      <Text allowFontScaling={false} style={cardStyles.quantityText}>{qty}</Text>
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
                      <Text allowFontScaling={false} style={modalStyles.modalTitle}>Add Quantity</Text>

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
                          allowFontScaling={false}
                        />

                        <TouchableOpacity style={modalStyles.pickerBtn} onPress={incrementEdit}>
                          <Ionicons name="add" size={scale(18)} color="#111" />
                        </TouchableOpacity>
                      </View>

                      <View style={modalStyles.modalActions}>
                        <TouchableOpacity style={modalStyles.cancelBtn} onPress={closeQtyModal}>
                          <Text allowFontScaling={false} style={modalStyles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={modalStyles.okBtn} onPress={applyQuantityChange}>
                          <Text allowFontScaling={false} style={modalStyles.okText}>OK</Text>
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

const ViewAllFressPop = () => {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState({});

  // Search & filter states
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    sortBy: 'relevance',
    priceMin: 0,
    priceMax: Number.MAX_SAFE_INTEGER,
    ratingMin: 0,
  });
  const [tempFilters, setTempFilters] = useState({ ...filters });
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const slideAnim = useRef(new Animated.Value(width)).current;
  const [expanded, setExpanded] = useState({ sort: false, price: false, rating: false });

  const window = useWindowDimensions();
  const horizontalPadding = moderateScale(10) * 2;
  const columnGap = moderateScale(10);
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

  // Wishlist and cart functions (kept same as before)
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

  // small helper to parse price safely
  const parsePrice = (p) => {
    if (p == null) return 0;
    const asString = String(p);
    const cleaned = asString.replace(/[^0-9.]/g, '');
    const v = parseFloat(cleaned);
    return Number.isNaN(v) ? 0 : v;
  };

  // Combined filtered products (search + applied filters)
  const filteredProducts = useMemo(() => {
    let res = Array.isArray(items) ? [...items] : [];

    const q = (query || "").trim().toLowerCase();
    if (q) {
      res = res.filter(p => (p?.name ?? "").toString().toLowerCase().includes(q));
    }

    res = res.filter(p => {
      const price = parsePrice(p?.price);
      return price >= (filters.priceMin || 0) && price <= (filters.priceMax || Number.MAX_SAFE_INTEGER);
    });

    res = res.filter(p => {
      const rating = (typeof p?.rating === "number") ? p.rating : (p?.rating ? Number(p.rating) : 0);
      return rating >= (filters.ratingMin || 0);
    });

    if (filters.sortBy === 'Price - high to low') {
      res.sort((a, b) => parsePrice(b?.price) - parsePrice(a?.price));
    } else if (filters.sortBy === 'Price - low to high') {
      res.sort((a, b) => parsePrice(a?.price) - parsePrice(b?.price));
    } else if (filters.sortBy === 'Newest Arrivals') {
      res.sort((a, b) => {
        const at = Date.parse(a?.createdAt || a?.postedAt || '') || 0;
        const bt = Date.parse(b?.createdAt || b?.postedAt || '') || 0;
        return bt - at;
      });
    }

    return res;
  }, [items, query, filters]);

  // Filter popup control
  const openFilterPopup = () => {
    setTempFilters({ ...filters });
    setShowFilterPopup(true);
    slideAnim.setValue(width);
    Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  };
  const closeFilterPopup = () => {
    Animated.timing(slideAnim, { toValue: width, duration: 200, useNativeDriver: true }).start(() => setShowFilterPopup(false));
  };

  const applyFilters = () => {
    const pf = {
      ...tempFilters,
      priceMin: Number.isFinite(Number(tempFilters.priceMin)) ? Number(tempFilters.priceMin) : 0,
      priceMax: Number.isFinite(Number(tempFilters.priceMax)) ? Number(tempFilters.priceMax) : Number.MAX_SAFE_INTEGER,
      ratingMin: Number.isFinite(Number(tempFilters.ratingMin)) ? Number(tempFilters.ratingMin) : 0,
    };
    setFilters(pf);
    closeFilterPopup();
  };

  const clearTempFilters = () => {
    setTempFilters({
      sortBy: 'relevance',
      priceMin: 0,
      priceMax: Number.MAX_SAFE_INTEGER,
      ratingMin: 0,
    });
  };

  // Wishlist / Cart handlers (kept same)
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
    } catch (err) {
      console.error('Error adding to wishlist:', err);
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

      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });

      await axios.delete(`${API_BASE}/api/buyer/wishlist/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error removing from wishlist:', err);
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
      {/* Header with Search + Filter */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
          <Image
            source={require("../assets/via-farm-img/icons/groupArrow.png")}
          />
        </TouchableOpacity>

        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={scale(15)} color="#888" style={{ marginRight: moderateScale(8) }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={`Search Fresh & Popular...`}
            placeholderTextColor="#999"
            style={styles.searchInput}
            returnKeyType="search"
            allowFontScaling={false}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} style={styles.clearButton}>
              <Ionicons name="close-circle" size={scale(18)} color="#888" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={openFilterPopup} style={{ paddingHorizontal: moderateScale(8) }}>
            <Image style={{ width: scale(30), height: scale(30) }} source={require("../assets/via-farm-img/icons/filterIcon.png")} />
          </TouchableOpacity>
        </View>

        <View />
      </View>

      <ScrollView>

        <FreshVendor />

        <View>
          <Text allowFontScaling={false} style={{ fontSize: normalizeFont(15), paddingLeft: moderateScale(15), paddingBottom: moderateScale(5) }}>Products</Text>
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFA500" />
            <Text allowFontScaling={false} style={styles.loadingText}>Fetching...</Text>
          </View>
        )}

        {/* Error */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text allowFontScaling={false} style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Success - Items List */}
        {!loading && !error && (
          <FlatList
            data={filteredProducts}
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
                  <Text allowFontScaling={false} style={{ color: '#444' }}>No items found</Text>
                </View>
              )
            }
          />
        )}

      </ScrollView>
      {/* Filter Modal */}
      <Modal
        visible={showFilterPopup}
        transparent
        animationType="none"
        onRequestClose={closeFilterPopup}
      >
        <View style={filterStyles.modalOverlay}>
          <TouchableOpacity style={filterStyles.overlayTouchable} activeOpacity={1} onPress={closeFilterPopup} />
          <Animated.View style={[filterStyles.filterPopup, { transform: [{ translateX: slideAnim }] }]}>
            <View style={filterStyles.filterHeader}>
              <View style={filterStyles.filterTitleContainer}>
                <Ionicons name="options" size={normalizeFont(18)} color="#333" />
                <Text allowFontScaling={false} style={filterStyles.filterTitle}>Filters</Text>
              </View>
              <TouchableOpacity onPress={closeFilterPopup}>
                <Ionicons name="close" size={normalizeFont(20)} color="#333" />
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={{ paddingBottom: moderateScale(20) }}>
                {/* Sort */}
                <TouchableOpacity style={filterStyles.filterOption} onPress={() => setExpanded(s => ({ ...s, sort: !s.sort }))}>
                  <Text allowFontScaling={false} style={filterStyles.filterOptionText}>Sort by</Text>
                  <Ionicons name={expanded.sort ? "chevron-up" : "chevron-down"} size={normalizeFont(14)} color="#666" />
                </TouchableOpacity>
                {expanded.sort && (
                  <View style={filterStyles.filterDetails}>
                    {['relevance', 'Price - low to high', 'Price - high to low', 'Newest Arrivals'].map(opt => (
                      <TouchableOpacity key={opt} style={filterStyles.filterOption2} onPress={() => setTempFilters(tf => ({ ...tf, sortBy: opt }))}>
                        <Text allowFontScaling={false} style={[
                          filterStyles.filterOptionText2,
                          tempFilters.sortBy === opt && filterStyles.filterOptionText2Active
                        ]}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Price */}
                <TouchableOpacity style={filterStyles.filterOption} onPress={() => setExpanded(s => ({ ...s, price: !s.price }))}>
                  <Text allowFontScaling={false} style={filterStyles.filterOptionText}>Price Range</Text>
                  <Ionicons name={expanded.price ? "chevron-up" : "chevron-down"} size={normalizeFont(14)} color="#666" />
                </TouchableOpacity>
                {expanded.price && (
                  <View style={filterStyles.filterDetails}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: moderateScale(8) }}>
                      <TextInput
                        allowFontScaling={false}
                        style={[filterStyles.simpleInput, { flex: 1 }]}
                        placeholder="Min"
                        keyboardType="numeric"
                        value={tempFilters.priceMin !== Number.MAX_SAFE_INTEGER ? String(tempFilters.priceMin) : '0'}
                        onChangeText={(t) => setTempFilters(tf => ({ ...tf, priceMin: t.replace(/[^0-9]/g, '') ? Number(t.replace(/[^0-9]/g, '')) : 0 }))}
                      />
                      <TextInput
                        allowFontScaling={false}
                        style={[filterStyles.simpleInput, { flex: 1 }]}
                        placeholder="Max"
                        keyboardType="numeric"
                        value={tempFilters.priceMax === Number.MAX_SAFE_INTEGER ? '' : String(tempFilters.priceMax)}
                        onChangeText={(t) => setTempFilters(tf => ({ ...tf, priceMax: t.replace(/[^0-9]/g, '') ? Number(t.replace(/[^0-9]/g, '')) : Number.MAX_SAFE_INTEGER }))}
                      />
                    </View>
                    <Text allowFontScaling={false} style={{ marginTop: moderateScale(8), color: '#666' }}>Leave Max empty for any</Text>
                  </View>
                )}

                {/* Rating */}
                <TouchableOpacity style={filterStyles.filterOption} onPress={() => setExpanded(s => ({ ...s, rating: !s.rating }))}>
                  <Text allowFontScaling={false} style={filterStyles.filterOptionText}>Rating</Text>
                  <Ionicons name={expanded.rating ? "chevron-up" : "chevron-down"} size={normalizeFont(14)} color="#666" />
                </TouchableOpacity>
                {expanded.rating && (
                  <View style={filterStyles.filterDetails}>
                    {[0, 2, 3, 4].map(r => (
                      <TouchableOpacity key={r} style={filterStyles.checkboxRow} onPress={() => setTempFilters(tf => ({ ...tf, ratingMin: tf.ratingMin === r ? 0 : r }))}>
                        <View style={[filterStyles.checkbox, tempFilters.ratingMin === r && filterStyles.checkboxChecked]}>
                          {tempFilters.ratingMin === r && <Ionicons name="checkmark" size={12} color="#fff" />}
                        </View>
                        <Text allowFontScaling={false} style={filterStyles.checkboxLabel}>{r === 0 ? 'Any' : `${r} and above`}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>

              <View style={filterStyles.filterFooter}>
                <TouchableOpacity style={[filterStyles.applyButton, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', marginBottom: moderateScale(8) }]} onPress={() => { clearTempFilters(); }}>
                  <Text allowFontScaling={false} style={[filterStyles.applyButtonText, { color: '#333' }]}>Clear</Text>
                </TouchableOpacity>

                <TouchableOpacity style={filterStyles.applyButton} onPress={applyFilters}>
                  <Text allowFontScaling={false} style={filterStyles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
export default ViewAllFressPop;



const styles = StyleSheet.create({
  header: {
    paddingHorizontal: moderateScale(5),
    paddingVertical: moderateScale(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(252, 252, 252, 1)',
    // paddingVertical: moderateScale(2),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: moderateScale(4),
    alignItems: 'center',
    borderRadius: moderateScale(5),
  },
  searchInput: {
    flex: 1,
    fontSize: normalizeFont(13),
    color: '#222',
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: moderateScale(6),
    padding: moderateScale(4),
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
    fontSize: normalizeFont(15),
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
    marginTop: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    shadowColor: 'grey',
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    borderWidth: moderateScale(1),
    borderColor: 'grey',
    elevation: 7,
    shadowOffset: { width: 0, height: moderateScale(3) },
  },

  imageContainer: {
    width: '100%',
    height: scale(140),
    backgroundColor: '#f6f6f6',
  },
  imageHeight: scale(135),
  productImage: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
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
    bottom: moderateScale(6),
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
    marginLeft: moderateScale(2),
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
    marginVertical: moderateScale(2),
    color: '#666',
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(5),
    marginBottom: moderateScale(3),
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: moderateScale(2),
  },
  productPrice: {
    fontSize: normalizeFont(12),
    fontWeight: '500',
    color: '#000',
  },
  productUnit: {
    fontSize: normalizeFont(11),
    color: '#000',
    marginBottom: moderateScale(2),
  },
  productUnitt: {
    fontSize: normalizeFont(11),
    color: '#000',
    // marginLeft:moderateScale(4),
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

const filterStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  filterPopup: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    height: "92%",
    width: moderateScale(250),
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderWidth: moderateScale(2),
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 202, 40, 1)',
    elevation: 10,
    paddingBottom: moderateScale(8),
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTitle: {
    fontSize: normalizeFont(13),
    fontWeight: '600',
    color: '#333',
    marginLeft: moderateScale(8),
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  filterOption2: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  filterOptionText: {
    fontSize: normalizeFont(12),
    fontWeight: '500',
    color: '#333',
  },
  filterOptionText2: {
    fontSize: normalizeFont(13),
    color: '#666',
  },
  filterOptionText2Active: {
    fontWeight: '600',
    color: '#333',
  },
  filterDetails: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  simpleInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    fontSize: normalizeFont(13),
    backgroundColor: '#fff',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
  },
  checkbox: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(2),
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxLabel: {
    fontSize: normalizeFont(13),
    color: '#333',
  },
  filterFooter: {
    padding: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  applyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: normalizeFont(12),
    fontWeight: '600',
  },
});
