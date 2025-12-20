// ViewAllAroundIndia.jsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { goBack } from "expo-router/build/global-state/routing";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import LocalVendor from '../components/common/LocalVendor';
import { moderateScale, normalizeFont, scale } from "./Responsive";

const API_BASE = "https://viafarm-1.onrender.com";
const API_PATH = "/api/buyer/all-around-india";
const { width } = Dimensions.get('window');

// ----------------- ProductCard (same design + quantity-edit modal) -----------------
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
  const inCart = (cartQuantity || 0) > 0;

  const imageUri =
    item?.image ||
    (Array.isArray(item?.images) && item.images.length > 0 && item.images[0]) ||
    "https://via.placeholder.com/150/FFA500/FFFFFF?text=No+Image";

  const distance =
    item?.distanceFromVendor ?? item?.distance ?? item?.vendor?.distanceFromVendor ?? item?.distance ?? null;

  const status = item?.status ?? (item?.stock === 0 ? "Out of Stock" : "In Stock");

  const rating = typeof item?.rating === "number" ? item.rating : item?.rating ? Number(item.rating) : 0;

  // robust vendor name fallback
  const vendorName =
    (item && typeof item === "object" && (
      item.vendor?.name ||
      item.vendorName ||
      item.vendor?.vendorName ||
      item.vendor?.vendor?.name ||
      item.vendor?.vendor?.vendorName
    )) || "";

  // Quantity edit modal state
  const [qtyModalVisible, setQtyModalVisible] = useState(false);
  const [editQuantity, setEditQuantity] = useState(String(cartQuantity || 0));

  useEffect(() => {
    setEditQuantity(String(cartQuantity || 0));
  }, [cartQuantity]);

  const openQtyModal = (e) => {
    e?.stopPropagation?.();
    setEditQuantity(String(cartQuantity || 0));
    setQtyModalVisible(true);
  };
  const closeQtyModal = () => setQtyModalVisible(false);

  const applyQuantityChange = () => {
    const parsed = parseInt(String(editQuantity).replace(/\D/g, ''), 10);
    const newQty = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    const currentQty = cartQuantity || 0;
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
    <View style={[cardStyles.container, cardWidth ? { width: cardWidth } : {}]}>
      <TouchableOpacity
        style={cardStyles.card}
        activeOpacity={0.85}
        onPress={() => onPress && onPress(item)}
      >
        <View style={[cardStyles.imageContainer, { height: cardStyles.imageHeight }]}>
          <Image source={{ uri: imageUri }} style={cardStyles.productImage} resizeMode="stretch" />

          {/* wishlist */}
          <TouchableOpacity
            style={cardStyles.favoriteButton}
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleFavorite && onToggleFavorite(item);
            }}
          >
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={scale(22)} color={isFavorite ? "#ff4444" : "#fff"} />
          </TouchableOpacity>

          {/* rating */}
          <View style={cardStyles.ratingContainer}>
            <Ionicons name="star" size={scale(12)} color="#FFD700" />
            <Text  allowFontScaling={false} style={cardStyles.ratingText}>{rating ? Number(rating).toFixed(1) : "0.0"}</Text>
          </View>

        </View>

        <View style={cardStyles.cardContent}>
          <Text  allowFontScaling={false} style={cardStyles.productTitle} numberOfLines={1}>
            {item?.name ?? "Unnamed product"}
          </Text>

          <View style={{ marginVertical: moderateScale(5) }}>
            <Text  allowFontScaling={false} numberOfLines={1} style={{ color: "#444", fontSize: normalizeFont(11) }}>
              By {vendorName || "Unnamed vendor"}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(6) }}>
            <Image source={require("../assets/via-farm-img/icons/loca.png")} />
            <Text  allowFontScaling={false} style={{ fontSize: normalizeFont(11), color: "#444" }}>{distance ?? "0.0 km"}</Text>
          </View>

          <View style={cardStyles.priceContainer}>
            <Text  allowFontScaling={false} style={cardStyles.weightText}>₹{item?.price ?? "0"}</Text>
            <Text  allowFontScaling={false} style={cardStyles.weightText}>/{item?.unit ?? "unit"}</Text>
            {item?.weightPerPiece ? <Text allowFontScaling={false}   style={cardStyles.weightTextt}>/{item.weightPerPiece}</Text> : null}
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
                <Text  allowFontScaling={false} style={cardStyles.addToCartText}>{status === "In Stock" ? "Add to Cart" : status}</Text>
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
                      <Ionicons name="remove" size={scale(20)} color="rgba(76, 175, 80, 1)" />
                    </TouchableOpacity>

                    <View style={cardStyles.quantityValueContainer}>
                      <Text  allowFontScaling={false} style={cardStyles.quantityText}>{cartQuantity}</Text>
                    </View>

                    <TouchableOpacity
                      style={cardStyles.quantityButton}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        onUpdateQuantity && onUpdateQuantity(item, 1);
                      }}
                    >
                      <Ionicons name="add" size={scale(20)} color="rgba(76, 175, 80, 1)" />
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
                    style={modalStyles.backdrop}
                    activeOpacity={1}
                    onPress={closeQtyModal}
                  >
                    <View style={[modalStyles.modalWrap, { maxWidth: Math.min(420, Dimensions.get('window').width - moderateScale(40)) }]}>
                      <Text  allowFontScaling={false} style={modalStyles.modalTitle}>Set Quantity</Text>

                      <View style={modalStyles.editRow}>
                        <TouchableOpacity style={modalStyles.pickerBtn} onPress={decrementEdit}>
                          <Ionicons name="remove" size={scale(18)} color="#111" />
                        </TouchableOpacity>

                        <TextInput
                         allowFontScaling={false}
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
                          <Text  allowFontScaling={false} style={modalStyles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={modalStyles.okBtn} onPress={applyQuantityChange}>
                          <Text  allowFontScaling={false} style={modalStyles.okText}>OK</Text>
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

// ----------------- ViewAllAroundIndia (parent) -----------------
const ViewAllAroundIndia = () => {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState({});
  const [query, setQuery] = useState("");

  // Filters (copied behavior)
  const [filters, setFilters] = useState({
    sortBy: 'relevance',
    priceMin: 0,
    priceMax: Number.MAX_SAFE_INTEGER,
    ratingMin: 0,
  });
  const [tempFilters, setTempFilters] = useState({ ...filters });
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const slideAnim = useRef(new Animated.Value(width)).current;
  const [expanded, setExpanded] = useState({ sort: false, price: true, rating: true });
  const window = useWindowDimensions();
  const horizontalPadding = moderateScale(10) * 2; 
  const gap = moderateScale(12); 
  const computedCardWidth = Math.max(120, Math.floor((window.width - horizontalPadding - gap) / 2));

  // ---------------- fetch functions ----------------
  const fetchAllAround = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      const resp = await axios.get(`${API_BASE}${API_PATH}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        timeout: 10000,
      });

      if (resp.data && resp.data.success) {
        const arr = Array.isArray(resp.data.data) ? resp.data.data : [];
        setItems(arr);
      } else {
        setItems([]);
        setError(resp.data?.message || "No products found");
      }
    } catch (err) {
      console.error("Error fetching all-around-india:", err);
      if (err?.response?.status === 401) {
        setError("Please login to view products");
      } else if (err?.code === "ECONNABORTED") {
        setError("Request timeout. Please try again.");
      } else if (!err?.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Failed to load products. Please try again.");
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;
      const resp = await axios.get(`${API_BASE}/api/buyer/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.data?.success) {
        const list = resp.data.data?.items || [];
        const favIds = new Set(list.map((i) => i.productId || i._id || i.id));
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
      const resp = await axios.get(`${API_BASE}/api/buyer/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.data?.success) {
        const list = resp.data.data?.items || [];
        const map = {};
        list.forEach((it) => {
          const pid = it.productId || it._id || it.id;
          map[pid] = { quantity: it.quantity || 1, cartItemId: it._id || it.id };
        });
        setCartItems(map);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  };

  useEffect(() => {
    fetchAllAround();
    fetchWishlist();
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // parsing helper
  const parsePrice = (p) => {
    if (p == null) return 0;
    const asString = String(p);
    const cleaned = asString.replace(/[^0-9.]/g, '');
    const v = parseFloat(cleaned);
    return Number.isNaN(v) ? 0 : v;
  };

  // client-side filter (now supports filters like category view)
  const filtered = useMemo(() => {
    let products = Array.isArray(items) ? [...items] : [];

    const q = (query || "").trim().toLowerCase();
    if (q) {
      products = products.filter(p => (p?.name ?? "").toString().toLowerCase().includes(q));
    }

    products = products.filter(p => {
      const price = parsePrice(p?.price);
      return price >= (filters.priceMin || 0) && price <= (filters.priceMax || Number.MAX_SAFE_INTEGER);
    });

    products = products.filter(p => {
      const rating = (typeof p?.rating === "number") ? p.rating : (p?.rating ? Number(p.rating) : 0);
      return rating >= (filters.ratingMin || 0);
    });

    // sort
    if (filters.sortBy === 'Price - high to low') {
      products.sort((a, b) => parsePrice(b?.price) - parsePrice(a?.price));
    } else if (filters.sortBy === 'Price - low to high') {
      products.sort((a, b) => parsePrice(a?.price) - parsePrice(b?.price));
    } else if (filters.sortBy === 'Newest Arrivals') {
      products.sort((a, b) => {
        const at = Date.parse(a?.createdAt || a?.postedAt || '') || 0;
        const bt = Date.parse(b?.createdAt || b?.postedAt || '') || 0;
        return bt - at;
      });
    }

    return products;
  }, [items, query, filters]);

  // wishlist handlers (OPTIMISTIC updates)
  const addToWishlist = async (product) => {
    const productId = product._id || product.id;
    setFavorites((prev) => new Set(prev).add(productId));
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        console.log("addToWishlist: no token - user not logged in");
        return;
      }
      const payload = {
        productId,
        name: product.name,
        image: product.images?.[0] || product.image || "",
        price: product.price,
        category: product.category || "AllAroundIndia",
        variety: product.variety || "Standard",
        unit: product.unit || "kg",
      };
      const r = await axios.post(`${API_BASE}/api/buyer/wishlist/add`, payload, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!(r.data?.success)) {
        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        console.error("Failed to add to wishlist (server responded false):", r.data);
      }
    } catch (err) {
      console.error("Error adding to wishlist:", err);
      setFavorites((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const removeFromWishlist = async (product) => {
    const productId = product._id || product.id;
    setFavorites((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        setFavorites((prev) => new Set(prev).add(productId));
        console.log("removeFromWishlist: no token - user not logged in");
        return;
      }
      const r = await axios.delete(`${API_BASE}/api/buyer/wishlist/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!(r.data?.success)) {
        setFavorites((prev) => new Set(prev).add(productId));
        console.error("Failed to remove from wishlist (server responded false):", r.data);
      }
    } catch (err) {
      console.error("Error removing wishlist:", err);
      setFavorites((prev) => new Set(prev).add(productId));
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

  // cart handlers (OPTIMISTIC)
  const handleAddToCart = async (product) => {
    const productId = product._id || product.id;
    const fakeCartItemId = productId;
    setCartItems((prev) => ({
      ...prev,
      [productId]: { quantity: 1, cartItemId: fakeCartItemId },
    }));

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        setCartItems((prev) => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
        console.log("handleAddToCart: no token - user not logged in");
        return;
      }
      const payload = {
        productId,
        name: product.name,
        image: product.images?.[0] || product.image || "",
        price: product.price,
        quantity: 1,
        category: product.category || "AllAroundIndia",
        variety: product.variety || "Standard",
        unit: product.unit || "kg",
      };
      const r = await axios.post(`${API_BASE}/api/buyer/cart/add`, payload, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (r.data?.success) {
        const realId = r.data.data?._id || fakeCartItemId;
        setCartItems((prev) => ({
          ...prev,
          [productId]: { quantity: 1, cartItemId: realId },
        }));
      } else {
        setCartItems((prev) => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
        console.error("Failed to add to cart (server responded false):", r.data);
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      await fetchCart();
    }
  };

  const handleUpdateQuantity = async (product, change) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.log("handleUpdateQuantity: no token - user not logged in");
        return;
      }
      const productId = product._id || product.id;
      const current = cartItems[productId];
      if (!current) return;
      const newQty = current.quantity + change;

      if (newQty < 1) {
        const previous = { ...cartItems };
        setCartItems((prev) => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });

        try {
          const r = await axios.delete(`${API_BASE}/api/buyer/cart/${current.cartItemId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!(r.data?.success)) {
            setCartItems(previous);
            console.error("Failed to remove from cart (server responded false):", r.data);
          }
        } catch (err) {
          console.error("Error deleting cart item:", err);
          setCartItems(previous);
        }
      } else {
        const prev = { ...cartItems };
        setCartItems((prevState) => ({ ...prevState, [productId]: { ...current, quantity: newQty } }));

        try {
          const r = await axios.put(
            `${API_BASE}/api/buyer/cart/${current.cartItemId}/quantity`,
            { quantity: newQty },
            { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
          );
          if (!r.data?.success) {
            setCartItems(prev);
            console.error("Failed to update quantity (server responded false):", r.data);
          }
        } catch (err) {
          console.error("Error updating cart quantity:", err);
          setCartItems(prev);
          await fetchCart();
        }
      }
    } catch (err) {
      console.error("Error updating cart quantity (outer):", err);
      await fetchCart();
    }
  };

  // navigation to details
  const openProductDetails = (product) => {
    try {
      const productId = product?._id || product?.id;
      if (!productId) {
        console.error("openProductDetails: Product id missing");
        return;
      }
      navigation.navigate("ViewProduct", { productId, product });
    } catch (err) {
      console.error("openProductDetails error:", err);
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchAllAround();
    fetchWishlist();
    fetchCart();
  };

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
    // sanitize numeric fields
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header with Search + Filter icon */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Image source={require("../assets/via-farm-img/icons/groupArrow.png")} />
        </TouchableOpacity>

        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="#888" style={{ marginRight: moderateScale(6) }} />
          <TextInput
           allowFontScaling={false}
            value={query}
            onChangeText={setQuery}
            placeholder="Search products..."
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
          <TouchableOpacity onPress={openFilterPopup} style={{ paddingHorizontal: moderateScale(8) }}>
            <Image style={{ width: 30, height: 30 }} source={require("../assets/via-farm-img/icons/filterIcon.png")} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView>

      {/* Local Vendor card (same as other screen) */}
      <View>
        <LocalVendor />
      </View>

      <View>
        <Text  allowFontScaling={false} style={{ paddingLeft: moderateScale(10), paddingBottom: moderateScale(5),fontSize:normalizeFont(15) }}>Products</Text>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator  />
          <Text  allowFontScaling={false} style={styles.loadingText}>Fetching products all around India...</Text>
        </View>
      )}

      {/* Error */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text  allowFontScaling={false} style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Success - List */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <View style={{ padding: moderateScale(20), alignItems: "center" }}>
              <Text  allowFontScaling={false} style={{ color: "#444" }}>No products match “{query}”</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item._id || item.id || String(item?.name)}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: moderateScale(10), paddingBottom: moderateScale(20) }}
              renderItem={({ item }) => {
                const productId = item._id || item.id;
                const isFavorite = favorites.has(productId);
                const cartQty = cartItems[productId]?.quantity || 0;
                return (
                  <ProductCard
                    item={item}
                    isFavorite={isFavorite}
                    onToggleFavorite={handleToggleFavorite}
                    cartQuantity={cartQty}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onPress={openProductDetails}
                    cardWidth={computedCardWidth}
                  />
                );
              }}
              columnWrapperStyle={{ justifyContent: "space-between", marginBottom: moderateScale(15) }}
            />
          )}
        </>
      )}

   </ScrollView>
      {/* Filter Modal (slides from right) */}
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
                <Text  allowFontScaling={false} style={filterStyles.filterTitle}>Filters</Text>
              </View>
              <TouchableOpacity onPress={closeFilterPopup}>
                <Ionicons name="close" size={normalizeFont(20)} color="#333" />
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={{ paddingBottom: moderateScale(20) }}>
                {/* Sort */}
                <TouchableOpacity style={filterStyles.filterOption} onPress={() => setExpanded(s => ({ ...s, sort: !s.sort }))}>
                  <Text  allowFontScaling={false} style={filterStyles.filterOptionText}>Sort by</Text>
                  <Ionicons name={expanded.sort ? "chevron-up" : "chevron-down"} size={normalizeFont(14)} color="#666" />
                </TouchableOpacity>
                {expanded.sort && (
                  <View style={filterStyles.filterDetails}>
                    {['relevance', 'Price - low to high', 'Price - high to low', 'Newest Arrivals'].map(opt => (
                      <TouchableOpacity key={opt} style={filterStyles.filterOption2} onPress={() => setTempFilters(tf => ({ ...tf, sortBy: opt }))}>
                        <Text  allowFontScaling={false} style={[
                          filterStyles.filterOptionText2,
                          tempFilters.sortBy === opt && filterStyles.filterOptionText2Active
                        ]}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Price */}
                <TouchableOpacity style={filterStyles.filterOption} onPress={() => setExpanded(s => ({ ...s, price: !s.price }))}>
                  <Text  allowFontScaling={false} style={filterStyles.filterOptionText}>Price Range</Text>
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
                    <Text  allowFontScaling={false} style={{ marginTop: moderateScale(8), color: '#666' }}>Leave Max empty for any</Text>
                  </View>
                )}

                {/* Rating */}
                <TouchableOpacity style={filterStyles.filterOption} onPress={() => setExpanded(s => ({ ...s, rating: !s.rating }))}>
                  <Text  allowFontScaling={false} style={filterStyles.filterOptionText}>Rating</Text>
                  <Ionicons name={expanded.rating ? "chevron-up" : "chevron-down"} size={normalizeFont(14)} color="#666" />
                </TouchableOpacity>
                {expanded.rating && (
                  <View style={filterStyles.filterDetails}>
                    {[0, 2, 3, 4].map(r => (
                      <TouchableOpacity key={r} style={filterStyles.checkboxRow} onPress={() => setTempFilters(tf => ({ ...tf, ratingMin: tf.ratingMin === r ? 0 : r }))}>
                        <View style={[filterStyles.checkbox, tempFilters.ratingMin === r && filterStyles.checkboxChecked]}>
                          {tempFilters.ratingMin === r && <Ionicons name="checkmark" size={12} color="#fff" />}
                        </View>
                        <Text  allowFontScaling={false} style={filterStyles.checkboxLabel}>{r === 0 ? 'Any' : `${r} and above`}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>

              <View style={filterStyles.filterFooter}>
                <TouchableOpacity style={[filterStyles.applyButton, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', marginBottom: moderateScale(8) }]} onPress={() => { clearTempFilters(); }}>
                  <Text  allowFontScaling={false} style={[filterStyles.applyButtonText, { color: '#333' }]}>Clear</Text>
                </TouchableOpacity>

                <TouchableOpacity style={filterStyles.applyButton} onPress={applyFilters}>
                  <Text  allowFontScaling={false} style={filterStyles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ViewAllAroundIndia;

/* ----------------- styles ----------------- (kept consistent with Category screen) */
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
    paddingVertical: moderateScale(1),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: moderateScale(7),
    alignItems: 'center',
    borderRadius: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: normalizeFont(12),
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
    fontSize:moderateScale(13),
    color: "#777",
  },
  errorContainer: {
    alignItems: "center",
    backgroundColor: "#ffebee",
    borderRadius: 8,
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
    marginTop: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    shadowColor: 'grey',
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(4),
    borderWidth: moderateScale(1),
    borderColor: 'grey',
    elevation: 6,
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
    fontSize: normalizeFont(12),
    fontWeight: '600',
    color: '#2b2b2b',
  },

  productVeriety: {
    color: 'rgba(66, 66, 66, 0.7)',
    fontSize: normalizeFont(10),
    paddingVertical: moderateScale(5),
  },

  priceContainer: {
    flexDirection: 'row',
    marginBottom: moderateScale(3),
    marginTop: moderateScale(3),
  },
  productPrice: {
    fontSize: normalizeFont(13),
    fontWeight: '800',
    color: '#666',
  },
  productUnit: {
    fontSize: normalizeFont(12),
    color: '#000',
    marginLeft: moderateScale(6),
    marginBottom: moderateScale(2),
  },
  weightText: {
    fontSize: normalizeFont(11),
    color: '#777',
  },
  weightTextt: {
    fontSize: normalizeFont(11),
    color: '#777',
    // marginLeft:moderateScale(5)
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
    fontSize: normalizeFont(13),
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

/* Filter styles (same as Category) */
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
    borderBottomWidth:0,
    borderWidth: moderateScale(2),
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
  sliderContainer: {
    paddingVertical: moderateScale(8),
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(10),
  },
  sliderLabel: {
    fontSize: normalizeFont(12),
    fontWeight: '600',
    color: '#333',
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
