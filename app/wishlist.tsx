import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from 'expo-router';
import { goBack } from "expo-router/build/global-state/routing";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, normalizeFont, scale } from "./Responsive";

const API_BASE = "https://viafarm-1.onrender.com";

// ----------------- ProductCard (same look/behavior as ViewAllFruits) -----------------
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
    <View style={cardStyles.container}>
      <TouchableOpacity
        style={cardStyles.card}
        activeOpacity={0.85}
        onPress={() => onPress && onPress(item)}
      >
        <View style={[cardStyles.imageContainer]}>
          <Image
            source={{ uri: imageUri }}
            style={cardStyles.productImage}
            resizeMode="cover"
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
              size={moderateScale(25)}
              color={isFavorite ? '#ff4444' : '#fff'}
            />
          </TouchableOpacity>

          <View style={cardStyles.ratingContainer}>
            <Ionicons name="star" size={moderateScale(10)} color="#FFD700" />
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
           Variety: {item?.variety ?? "N/A"}
          </Text>

          <View style={{flexDirection:'row',alignItems:'center',gap:scale(6), marginTop: moderateScale(6)}}>
            <Image source={require("../assets/via-farm-img/icons/cardMap.png")} />
            <Text style={cardStyles.distanceText}>
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
                  <Ionicons name="remove" size={moderateScale(14)} color="rgba(76, 175, 80, 1)" />
                </TouchableOpacity>
                <Text style={cardStyles.quantityText}>{cartQuantity}</Text>
                <TouchableOpacity
                  style={cardStyles.quantityButton}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onUpdateQuantity && onUpdateQuantity(item, 1);
                  }}
                >
                  <Ionicons name="add" size={moderateScale(14)} color="rgba(76, 175, 80, 1)" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// ----------------- MyWishlist Screen -----------------
const MyWishlist = () => {
  const navigation = useNavigation();
  const animation = useRef(new Animated.Value(0)).current;

  const [wishlistData, setWishlistData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredData, setFilteredData] = useState([]);

  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState({});
  const [selectedOption, setSelectedOption] = useState('All');

  // Fetch wishlist (and convert to product-like items)
  const fetchWishlistData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        setError("Please login to view wishlist");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE}/api/buyer/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      if (response.data?.success) {
        // Wishlist items may be shaped differently (some APIs return product inside)
        const items = response.data.data?.items || [];
        // Map to a product-like object expected by ProductCard
        const mapped = items.map((w, idx) => {
          // If the wishlist entry contains a full product object, prefer that
          const product = w.product || w.productDetails || w.productData || null;
          if (product) {
            // attach wishlist id refs if present
            return {
              ...product,
              id: product._id || product.id || product.productId || `wl-${idx}`,
              productId: product._id || product.id || product.productId || `wl-${idx}`,
            };
          }

          // Otherwise construct minimal product-like object from wishlist fields
          const id = w.productId || w.id || w._id || `wl-${idx}`;
          return {
            id,
            _id: id,
            productId: id,
            name: w.name || w.productName || "Unnamed product",
            images: w.images ? w.images : (w.image ? [w.image] : []),
            image: w.image || (w.images && w.images[0]) || null,
            price: w.price ?? w.unitPrice ?? 0,
            unit: w.unit || 'kg',
            variety: w.variety || w.varient || '',
            vendor: w.vendor || null,
            distance: w.distance || w.vendor?.distance || null,
            rating: w.rating || 0,
            category: w.category || 'Fruits',
            inCart: !!w.inCart,
            weightPerPiece: w.weightPerPiece || null
          };
        });

        setWishlistData(mapped);
        setFilteredData(mapped);
      } else {
        setWishlistData([]);
        setFilteredData([]);
        setError("No items in wishlist");
      }
    } catch (err) {
      console.error("Error fetching wishlist:", err);
      setError("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  // Fetch favorites (wishlist product ids) and cart mapping
  const fetchMeta = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      // wishlist -> favorites
      try {
        const res = await axios.get(`${API_BASE}/api/buyer/wishlist`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) {
          const items = res.data.data?.items || [];
          const favSet = new Set(items.map(i => i.productId || i._id || i.id));
          setFavorites(favSet);
        }
      } catch (e) {
        console.warn("wishlist fetch meta failed", e);
      }

      // cart
      try {
        const res2 = await axios.get(`${API_BASE}/api/buyer/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res2.data?.success) {
          const items = res2.data.data?.items || [];
          const cartMap = {};
          items.forEach(ci => {
            const pid = ci.productId || ci._id || ci.id;
            cartMap[pid] = {
              quantity: ci.quantity || 1,
              cartItemId: ci._id || ci.id || pid
            };
          });
          setCartItems(cartMap);
        }
      } catch (e) {
        console.warn("cart fetch meta failed", e);
      }
    } catch (e) {
      console.warn("fetchMeta error", e);
    }
  };

  useEffect(() => {
    fetchWishlistData();
    fetchMeta();
  }, []);

  // Add to wishlist
  const addToWishlist = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to wishlist');
        return;
      }
      const productId = product._id || product.id || product.productId;
      const body = {
        productId,
        name: product.name,
        image: (product.images && product.images[0]) || product.image || '',
        price: product.price,
        category: product.category || 'Fruits',
        variety: product.variety || 'Standard',
        unit: product.unit || 'kg'
      };
      const res = await axios.post(`${API_BASE}/api/buyer/wishlist/add`, body, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setFavorites(prev => new Set(prev).add(productId));
        Alert.alert('Success', 'Added to wishlist!');
      }
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      if (err.response?.status === 400) {
        const pid = product._id || product.id || product.productId;
        setFavorites(prev => new Set(prev).add(pid));
        Alert.alert('Info', 'Already in wishlist');
      } else {
        Alert.alert('Error', 'Failed to add to wishlist');
      }
    }
  };

  // Remove from wishlist
  const removeFromWishlist = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const productId = product._id || product.id || product.productId;
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
        // remove from local wishlist list too
        setWishlistData(prev => prev.filter(p => (p._id || p.id || p.productId) !== productId));
        setFilteredData(prev => prev.filter(p => (p._id || p.id || p.productId) !== productId));
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      Alert.alert('Error', 'Failed to remove from wishlist');
    }
  };

  const handleToggleFavorite = async (product) => {
    const productId = product._id || product.id || product.productId;
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
      const productId = product._id || product.id || product.productId;
      const body = {
        productId,
        name: product.name,
        image: (product.images && product.images[0]) || product.image || '',
        price: product.price,
        quantity: 1,
        category: product.category || 'Fruits',
        variety: product.variety || 'Standard',
        unit: product.unit || 'kg'
      };

      const res = await axios.post(`${API_BASE}/api/buyer/cart/add`, body, {
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
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      if (err.response?.status === 400) {
        await fetchMeta();
        Alert.alert('Info', 'Product is already in cart');
      } else {
        Alert.alert('Error', 'Failed to add to cart');
      }
    }
  };

  // Update quantity (delta: +1 or -1)
  const handleUpdateQuantity = async (product, delta) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const productId = product._id || product.id || product.productId;
      const current = cartItems[productId];
      if (!current) return;

      const newQty = current.quantity + delta;

      if (newQty < 1) {
        // remove
        const res = await axios.delete(`${API_BASE}/api/buyer/cart/${current.cartItemId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) {
          setCartItems(prev => {
            const next = { ...prev };
            delete next[productId];
            return next;
          });
          Alert.alert('Removed', 'Item removed from cart');
        }
        return;
      }

      // optimistic update locally
      setCartItems(prev => ({ ...prev, [productId]: { ...current, quantity: newQty } }));

      const res = await axios.put(
        `${API_BASE}/api/buyer/cart/${current.cartItemId}/quantity`,
        { quantity: newQty },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.data?.success) {
        // rollback
        setCartItems(prev => ({ ...prev, [productId]: current }));
        Alert.alert('Error', 'Failed to update quantity');
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
      await fetchMeta();
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const openProductDetails = (product) => {
    try {
      const productId = product._id || product.id || product.productId;
      if (!productId) {
        Alert.alert("Error", "Product id missing");
        return;
      }
      // navigate to ViewProduct with product and productId (same as ViewAllFruits)
      navigation.push ? navigation.push("ViewProduct", { productId, product }) : navigation.navigate("ViewProduct", { productId, product });
    } catch (err) {
      console.error("openProductDetails error:", err);
      Alert.alert("Navigation Error", "Could not open product details. See console.");
    }
  };

  // Filter handling (options dropdown behaviour from original)
  const toggleDropdown = () => {
    Animated.timing(animation, {
      toValue: animation._value === 0 ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const dropdownHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180],
  });

  const borderWidth = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const options = ['All', 'Fruits', 'Vegetable', 'Seeds', 'Plants', 'Handicrafts'];

  const handleSelect = (option) => {
    setSelectedOption(option);
    if (option === 'All') {
      setFilteredData(wishlistData);
    } else {
      const filtered = wishlistData.filter(item =>
        (item.category || '').toLowerCase().includes(option.toLowerCase()) ||
        (item.name || '').toLowerCase().includes(option.toLowerCase())
      );
      setFilteredData(filtered);
    }
    toggleDropdown();
  };

  const confirmRemove = (item) => {
    Alert.alert(
      'Remove from Wishlist',
      'Are you sure you want to remove this item from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFromWishlist(item) },
      ]
    );
  };

  // render card wrapper passing appropriate props from meta state
  const renderCard = ({ item }) => {
    const productId = item._id || item.id || item.productId;
    const isFavorite = favorites.has(productId);
    const cartQty = cartItems[productId]?.quantity || 0;

    // ensure item has required image fields
    const normalized = {
      ...item,
      image: item.image || (Array.isArray(item.images) && item.images[0]) || null,
    };

    return (
      <ProductCard
        item={normalized}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
        cartQuantity={cartQty}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateQuantity}
        onPress={openProductDetails}
      />
    );
  };

  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#4CAF50" />
      <Text style={styles.loadingText}>Loading wishlist...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.errorText}>Error: {error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => { fetchWishlistData(); fetchMeta(); }}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.centerContainer}>
      <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/4076/4076549.png" }} style={styles.emptyImage} />
      <Text style={styles.emptyText}>Your wishlist is empty</Text>
      <Text style={styles.emptySubText}>Add items to see them here</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.backArrow}>
          <TouchableOpacity onPress={goBack}>
            <Image source={require("../assets/via-farm-img/icons/groupArrow.png")} />
          </TouchableOpacity>
          <Text style={styles.text}>My Wishlist</Text>
        </View>

        <View style={styles.filterWrapper}>
          <TouchableOpacity style={styles.filterBtn} onPress={toggleDropdown}>
            <View style={styles.filterExpand}>
              <Text style={styles.filterText}>{selectedOption}</Text>
              <Image width={moderateScale(14)} source={require('../assets/via-farm-img/icons/expandArrow.png')} />
            </View>
          </TouchableOpacity>

          <Animated.View style={[styles.dropdown, { height: dropdownHeight, borderWidth: borderWidth }]}>
            {options.map(opt => (
              <TouchableOpacity key={opt} style={styles.dropdownItem} onPress={() => handleSelect(opt)}>
                <Text style={styles.dropdownText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>
      </View>

      {loading ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : filteredData.length === 0 ? (
        selectedOption === 'All' ? renderEmpty() : (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No items found for {selectedOption}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => handleSelect('All')}>
              <Text style={styles.retryButtonText}>Show All</Text>
            </TouchableOpacity>
          </View>
        )
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderCard}
          keyExtractor={(item) => item._id || item.id || item.productId || String(Math.random())}
          numColumns={2}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={() => { fetchWishlistData(); fetchMeta(); }}
          columnWrapperStyle={{ justifyContent: "space-between" }}
        />
      )}
    </SafeAreaView>
  );
};

// ----------------- Styles -----------------
const cardStyles = StyleSheet.create({
  container: {
    width: '48%',
    marginVertical: scale(6),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    elevation: 3
  },
  imageContainer: {
    width: '100%',
    height: moderateScale(125),
    backgroundColor: '#f6f6f6',
    position: 'relative'
  },
  productImage: {
    width: '100%',
    height: '100%'
  },
  favoriteButton: {
    position: 'absolute',
    // top: moderateScale(2),
    right: moderateScale(2),
    // backgroundColor: 'rgba(0,0,0,0.35)',
    padding: moderateScale(6),
    borderRadius: moderateScale(14)
  },
  ratingContainer: {
    position: 'absolute',
    left: moderateScale(8),
    top: moderateScale(100),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(4),
    backgroundColor: 'rgba(141, 141, 141, 0.6)',
    borderRadius: moderateScale(12)
  },
  ratingText: {
    color: '#fff',
    marginLeft: moderateScale(4),
    fontSize: normalizeFont(10)
  },
  cardContent: {
    padding: scale(10)
  },
  productTitle: {
    fontSize: normalizeFont(13),
    fontWeight: '600',
    color: '#222'
  },
  productVeriety: {
    fontSize: normalizeFont(11),
    color: '#666',
    marginTop: moderateScale(4)
  },
  distanceText: {
    fontSize: normalizeFont(11),
    color: '#444'
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginTop: moderateScale(8)
  },
  productUnit: {
    fontSize: normalizeFont(13),
    fontWeight: '700',
    color: '#333'
  },
  buttonContainer: {
    marginTop: moderateScale(10),
    alignItems: 'center'
  },
  addToCartButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(6),
    width:'100%',
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
  },
  addToCartText: {
    color: '#fff',
    fontSize: normalizeFont(12),
    fontWeight: '600',

  },
  disabledButton: {
    backgroundColor: '#ddd'
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'space-around',
    borderWidth:1,
    borderColor:'rgba(76, 175, 80, 1)',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(6),
    width:'100%',
  },
  quantityButton: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    color:'rgba(76, 175, 80, 1)',
  },
  quantityText: {
    color: 'rgba(76, 175, 80, 1)',
    minWidth: moderateScale(42),
    top:0,
    textAlign: 'center',
    fontWeight: '700',
    borderLeftWidth:1,
    borderRightWidth:1,
    borderColor:'rgba(76, 175, 80, 1)',
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  filterExpand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    justifyContent: 'space-around'
  },
  backArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12)
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    backgroundColor: '#fff'
  },
  text: {
    fontSize: normalizeFont(15),
    fontWeight: '600',
    color: '#000'
  },
  filterWrapper: {
    position: 'relative',
    minWidth: scale(120)
  },
  filterBtn: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: 'rgba(66, 66, 66, 0.7)'
  },
  filterText: {
    color: 'rgba(66, 66, 66, 0.7)',
    textAlign: 'center',
    fontSize: normalizeFont(12)
  },
  dropdown: {
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderColor: 'rgba(66, 66, 66, 0.7)',
    borderRadius: moderateScale(6),
    position: 'absolute',
    top: scale(36),
    left: 0,
    right: 0,
    zIndex: 1000
  },
  dropdownItem: {
    padding: scale(8),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(66, 66, 66, 0.7)'
  },
  dropdownText: {
    color: 'rgba(66, 66, 66, 0.7)',
    fontSize: normalizeFont(12)
  },
  flatListContent: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(10)
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20)
  },
  loadingText: {
    marginTop: scale(12),
    fontSize: normalizeFont(14),
    color: '#666'
  },
  errorText: {
    fontSize: normalizeFont(14),
    color: 'red',
    textAlign: 'center',
    marginBottom: scale(12)
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: scale(18),
    paddingVertical: scale(8),
    borderRadius: moderateScale(8)
  },
  retryButtonText: {
    color: 'white',
    fontSize: normalizeFont(14),
    fontWeight: '600'
  },
  emptyText: {
    fontSize: normalizeFont(16),
    fontWeight: '600',
    color: '#333',
    marginTop: scale(12)
  },
  emptySubText: {
    fontSize: normalizeFont(13),
    color: '#666',
    marginTop: scale(8)
  },
  emptyImage: {
    width: moderateScale(100),
    height: moderateScale(100),
    opacity: 0.6
  }
});

export default MyWishlist;
