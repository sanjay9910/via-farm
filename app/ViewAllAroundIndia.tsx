// ViewAllAroundIndia.jsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { goBack } from "expo-router/build/global-state/routing";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { moderateScale, normalizeFont, scale } from "./Responsive";

const API_BASE = "https://viafarm-1.onrender.com";
const API_PATH = "/api/buyer/all-around-india";

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

  React.useEffect(() => {
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
            <Text style={cardStyles.ratingText}>{rating ? Number(rating).toFixed(1) : "0.0"}</Text>
          </View>

        </View>

        <View style={cardStyles.cardContent}>
          <Text style={cardStyles.productTitle} numberOfLines={1}>
            {item?.name ?? "Unnamed product"}
          </Text>

          <View style={{ marginVertical: moderateScale(5) }}>
            <Text numberOfLines={1} style={{ color: "#444", fontSize: normalizeFont(11) }}>
              By {vendorName}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(6) }}>
            <Image source={require("../assets/via-farm-img/icons/loca.png")} />
            <Text style={{ fontSize: normalizeFont(11), color: "#444" }}>{distance ?? "0.0 km"}</Text>
          </View>

          <View style={cardStyles.priceContainer}>
            <Text style={cardStyles.weightText}>₹{item?.price ?? "0"}</Text>
            <Text style={cardStyles.weightText}>/{item?.unit ?? "unit"}</Text>
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
                      <Text style={cardStyles.quantityText}>{cartQuantity}</Text>
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
                      <Text style={modalStyles.modalTitle}>Set Quantity</Text>

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

// ----------------- ViewAllAroundIndia (parent) -----------------
const ViewAllAroundIndia = () => {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState({});
  const [query, setQuery] = useState("");

  const window = useWindowDimensions();
  // compute responsive card width for 2-column grid
  const horizontalPadding = moderateScale(10) * 2; // FlatList padding left+right
  const gap = moderateScale(12); // space between columns
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

  // client-side filter
  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => (p?.name ?? "").toString().toLowerCase().includes(q));
  }, [items, query]);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header with Search */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Image source={require("../assets/via-farm-img/icons/groupArrow.png")} />
        </TouchableOpacity>

        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="#888" style={{ marginRight: moderateScale(6) }} />
          <TextInput
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
        </View>

        <View />
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA500" />
          <Text style={styles.loadingText}>Fetching products all around India...</Text>
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

      {/* Success - List */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <View style={{ padding: moderateScale(20), alignItems: "center" }}>
              <Text style={{ color: "#444" }}>No products match “{query}”</Text>
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
    </SafeAreaView>
  );
};

export default ViewAllAroundIndia;

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
    paddingVertical: moderateScale(12),
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
    width: Dimensions.get("window").width / 2 - 25,
    marginLeft: moderateScale(6),
    marginTop: moderateScale(12),
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
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
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
