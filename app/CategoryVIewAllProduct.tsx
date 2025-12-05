// CategoryViewAllProduct.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
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
import { moderateScale, normalizeFont, scale } from './Responsive';

const API_BASE = "https://viafarm-1.onrender.com";

/* ---------------------------
   ProductCard (with qty-edit modal)
   - Doesn't change external APIs: uses onUpdateQuantity(item, delta)
   - Accepts cardWidth prop for responsive sizing
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

  // quantity modal state
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
  const closeQtyModal = () => setQtyModalVisible(false);

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
              size={scale(23)}
              color={isFavorite ? '#ff4444' : '#fff'}
            />
          </TouchableOpacity>

          <View style={cardStyles.ratingContainer}>
            <Ionicons name="star" size={scale(12)} color="#FFD700" />
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
            By {item?.vendor?.name ?? "Unnamed vendor"}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: moderateScale(6), paddingVertical: moderateScale(4) }}>
            <Image
              source={require("../assets/via-farm-img/icons/loca.png")}
        
            />
            <Text style={cardStyles.productVeriety}>
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

                {/* Qty edit modal */}
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
   Main screen: CategoryViewAllProduct
   Keeps your API logic the same; only responsiveness & modal added
   --------------------------- */
const CategoryViewAllProduct = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const categoryName = route.params?.categoryName || "Products";
  const categoryId = route.params?.categoryId;

  const [allCategories, setAllCategories] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState({});
  const [query, setQuery] = useState("");

  const window = useWindowDimensions();

  // responsive card width: 2 columns, consider horizontal paddings and gaps
  const horizontalPadding = moderateScale(13) * 2; // FlatList content padding left+right
  const columnGap = moderateScale(10);
  const computedCardWidth = Math.max(120, Math.floor((window.width - horizontalPadding - columnGap) / 2));

  const fetchCategoryProducts = async () => {
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

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setAllCategories(response.data.data);

        // Find the specific category
        const selectedCategory = response.data.data.find(
          cat => cat._id === categoryId || cat.name === categoryName
        );

        if (selectedCategory && Array.isArray(selectedCategory.products)) {
          setCategoryProducts(selectedCategory.products);
        } else {
          setError("No products found in this category");
          setCategoryProducts([]);
        }
      } else {
        setError("Failed to load category products");
        setCategoryProducts([]);
      }
    } catch (err) {
      console.error("❌ Error fetching category products:", err);

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
  };

  // Wishlist
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

  // Cart
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
    fetchCategoryProducts();
    fetchWishlist();
    fetchCart();
  }, [categoryId, categoryName]);

  // Client-side filter by name
  const filteredProducts = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return categoryProducts;
    return categoryProducts.filter(p =>
      (p?.name ?? "")
        .toString()
        .toLowerCase()
        .includes(q)
    );
  }, [categoryProducts, query]);

  // Wishlist add/remove (optimistic)
  const addToWishlist = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to wishlist');
        return;
      }

      const productId = product._id || product.id;

      setFavorites(prev => new Set(prev).add(productId));

      const wishlistData = {
        productId: productId,
        name: product.name,
        image: product.images?.[0] || product.image || '',
        price: product.price,
        category: product.category || categoryName,
        variety: product.variety || 'Standard',
        unit: product.unit || 'kg'
      };

      await axios.post(
        `${API_BASE}/api/buyer/wishlist/add`,
        wishlistData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      const productId = product._id || product.id;
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      if (!error.response) {
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

      await axios.delete(
        `${API_BASE}/api/buyer/wishlist/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      const productId = product._id || product.id;
      setFavorites(prev => new Set(prev).add(productId));
      if (!error.response) {
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

  // Add to cart (optimistic)
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

      const cartData = {
        productId: productId,
        name: product.name,
        image: product.images?.[0] || product.image || '',
        price: product.price,
        quantity: 1,
        category: product.category || categoryName,
        variety: product.variety || 'Standard',
        unit: product.unit || 'kg'
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
        const idFromServer = response.data.data?._id || productId;
        setCartItems(prev => ({
          ...prev,
          [productId]: {
            quantity: prev[productId]?.quantity || 1,
            cartItemId: idFromServer
          }
        }));
      } else {
        setCartItems(prev => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      const productId = product._id || product.id;
      setCartItems(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      if (error.response?.status === 400) {
        await fetchCart();
      } else {
        Alert.alert('Error', 'Failed to add to cart');
      }
    }
  };

  // Update quantity (expects delta)
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

      const newQuantity = currentItem.quantity + change;

      if (newQuantity < 1) {
        // optimistic remove
        setCartItems(prev => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });

        const response = await axios.delete(
          `${API_BASE}/api/buyer/cart/${currentItem.cartItemId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.data?.success) {
          await fetchCart();
        }
        return;
      } else {
        // optimistic update
        setCartItems(prev => ({
          ...prev,
          [productId]: { ...currentItem, quantity: newQuantity }
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
          await fetchCart();
        }
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      await fetchCart();
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

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
      Alert.alert("Navigation Error", "Could not open product details.");
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchCategoryProducts();
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
            style={{ width: scale(20), height: scale(20) }}
          />
        </TouchableOpacity>

        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={scale(15)} color="#888" style={{ marginRight: moderateScale(8) }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${categoryName}...`}
            placeholderTextColor="#999"
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} style={styles.clearButton}>
              <Ionicons name="close-circle" size={scale(18)} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Title */}
      <View style={{ paddingLeft: moderateScale(20), paddingBottom: moderateScale(10) }}>
        <Text style={{ fontSize: normalizeFont(15), fontWeight: '600' }}>{categoryName}</Text>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA500" />
          <Text style={styles.loadingText}>Loading products...</Text>
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

      {/* Success - Products List */}
      {!loading && !error && (
        <>
          {filteredProducts.length === 0 ? (
            <View style={{ padding: moderateScale(20), alignItems: 'center', flex: 1, justifyContent: 'center' }}>
              <Text style={{ color: '#444', fontSize: normalizeFont(14) }}>
                No products match "{query}"
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item._id || item.id || String(item?.name)}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: moderateScale(13), paddingBottom: moderateScale(20) }}
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
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

export default CategoryViewAllProduct;

/* ---------------------------
   Styles (responsive)
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
    marginHorizontal: moderateScale(8),
    flexDirection: 'row',
    backgroundColor: 'rgba(252, 252, 252, 1)',
    paddingVertical: moderateScale(7),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: moderateScale(7),
    alignItems: 'center',
    borderRadius: moderateScale(10),
  },
  searchInput: {
    flex: 1,
    fontSize: normalizeFont(12),
    color: '#222',
    paddingVertical: moderateScale(5),
  },
  backButtonContainer: {
    padding: moderateScale(2),
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
    borderRadius: moderateScale(8),
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
    borderRadius: moderateScale(5),
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
    fontSize: normalizeFont(11),
    paddingVertical: moderateScale(2),
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
    borderLeftWidth: moderateScale(1),
    borderRightWidth: moderateScale(1),
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

/* Modal styles */
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
