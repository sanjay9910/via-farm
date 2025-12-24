// MyWishlist.jsx
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
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, normalizeFont, scale } from "./Responsive";

const API_BASE = "https://viafarm-1.onrender.com";

// ========== ProductCard (client-perfect visuals) ==========
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

  const rating = Number(item?.rating || 0).toFixed(1);
  const unit = item?.unit || "kg";
  const weight = item?.weightPerPiece || "";

  // modal for exact qty edit
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
    <View style={cardStyles.container}>
      <TouchableOpacity
        style={cardStyles.card}
        activeOpacity={0.85}
        onPress={() => onPress && onPress(item)}
      >
        <View style={cardStyles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={cardStyles.productImage}
            resizeMode="cover"
          />

          <TouchableOpacity
            style={cardStyles.favoriteButton}
            activeOpacity={0.7}
            onPress={(e) => {
              e?.stopPropagation?.();
              onToggleFavorite && onToggleFavorite(item);
            }}
          >
            { isFavorite ? <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={scale(21)}
              color={isFavorite ? '#ff4444' : '#fff'}
            /> : <Image source={require("../assets/via-farm-img/icons/mainHeartIcon.png")}/>}
          </TouchableOpacity>

          <View style={cardStyles.ratingContainer}>
            <Ionicons name="star" size={moderateScale(10)} color="#FFD700" />
            {/* no extra spacing between star and rating */}
            <Text allowFontScaling={false} style={cardStyles.ratingText}>{rating}</Text>
          </View>
        </View>

        <View style={cardStyles.cardContent}>
          <Text allowFontScaling={false} style={cardStyles.productTitle} numberOfLines={1}>
            {item?.name ?? "Unnamed product"}
          </Text>

          <Text allowFontScaling={false} style={cardStyles.productVeriety} numberOfLines={1}>
            By {item?.vendor?.name ?? "N/A"}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: moderateScale(6) }}>
            <Image style={{width:moderateScale(14), height:moderateScale(18),resizeMode:'stretch'}} source={require("../assets/via-farm-img/icons/iconlocation.png")} />
            <Text allowFontScaling={false} style={cardStyles.distanceText}>
              {item?.distance ?? item?.vendor?.distance ?? "0.0 km"}
            </Text>
          </View>

          <View style={cardStyles.priceContainer}>
            <Text allowFontScaling={false} style={cardStyles.productUnit}>₹{item?.price ?? "0"}</Text>
            {/* glued unit and weight without extra spaces */}
            <Text allowFontScaling={false} style={cardStyles.productUnit}>/{unit}</Text>
            {weight ? <Text allowFontScaling={false} style={{ fontSize: normalizeFont(10), fontWeight: 'bold' }}>/{weight}</Text> : null}
          </View>

          <View style={cardStyles.buttonContainer}>
            {!inCart ? (
              <TouchableOpacity
                style={[
                  cardStyles.addToCartButton,
                  (item?.status === 'Out of Stock' || item?.stock === 0) && cardStyles.disabledButton
                ]}
                activeOpacity={0.8}
                disabled={item?.status === 'Out of Stock' || item?.stock === 0}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onAddToCart && onAddToCart(item);
                }}
              >
                <Text allowFontScaling={false} style={cardStyles.addToCartText}>
                  {(item?.status === 'Out of Stock' || item?.stock === 0) ? "Out of Stock" : "Add to Cart"}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={openQtyModal}
                  onLongPress={(e) => { e?.stopPropagation?.(); openQtyModal(e); }}
                >
                  <View style={cardStyles.quantityContainer}>
                    <TouchableOpacity
                      style={cardStyles.quantityButton}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        onUpdateQuantity && onUpdateQuantity(item, -1);
                      }}
                    >
                      <Ionicons name="remove" size={moderateScale(14)} color="rgba(76, 175, 80, 1)" />
                    </TouchableOpacity>

                    <Text style={cardStyles.quantityText}>{cartQuantity}</Text>

                    <TouchableOpacity
                      style={cardStyles.quantityButton}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        onUpdateQuantity && onUpdateQuantity(item, 1);
                      }}
                    >
                      <Ionicons name="add" size={moderateScale(14)} color="rgba(76, 175, 80, 1)" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                <Modal
                  visible={qtyModalVisible}
                  animationType="fade"
                  transparent
                  onRequestClose={closeQtyModal}
                >
                  <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={closeQtyModal}>
                    <View style={[modalStyles.modalWrap, { maxWidth: Math.min(420, Dimensions.get('window').width - moderateScale(40)) }]}>
                      <Text allowFontScaling={false} style={modalStyles.modalTitle}>Add Quantity</Text>

                      <View style={modalStyles.editRow}>
                        <TouchableOpacity style={modalStyles.pickerBtn} onPress={decrementEdit}>
                          <Ionicons name="remove" size={moderateScale(18)} color="#111" />
                        </TouchableOpacity>

                        <TextInput
                          style={modalStyles.qtyInput}
                          allowFontScaling={false}
                          keyboardType="number-pad"
                          value={String(editQuantity)}
                          onChangeText={(t) => setEditQuantity(t.replace(/[^0-9]/g, ""))}
                          maxLength={5}
                          placeholder="0"
                          placeholderTextColor="#999"
                        />

                        <TouchableOpacity style={modalStyles.pickerBtn} onPress={incrementEdit}>
                          <Ionicons name="add" size={moderateScale(18)} color="#111" />
                        </TouchableOpacity>
                      </View>

                      <View style={modalStyles.modalActions}>
                        <TouchableOpacity style={modalStyles.cancelBtn} onPress={closeQtyModal}>
                          <Text allowFontScaling={false} style={modalStyles.cancelText}>Cancel</Text>
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

// ========== MyWishlist Screen ==========
const MyWishlist = () => {
  const navigation = useNavigation();

  const [wishlistData, setWishlistData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState({});

  const [selectedOption, setSelectedOption] = useState('All');
  const [options, setAllCategory] = useState(['All']);

  // dropdown animation
  const animation = useRef(new Animated.Value(0)).current;
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // fetch wishlist list and map to normalized products
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
        const items = response.data.data?.items || [];
        const mapped = items.map((w, idx) => {
          const product = w.product || w.productDetails || w.productData || null;
          if (product) {
            return {
              ...product,
              id: product._id || product.id || product.productId || `wl-${idx}`,
              productId: product._id || product.id || product.productId || `wl-${idx}`,
            };
          }
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

  // fetch favorites & cart meta
  const fetchMeta = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      // wishlist meta
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

  // add/remove wishlist
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
        setFavorites(prev => {
          const next = new Set(prev);
          next.add(productId);
          return next;
        });
      } else {
        Alert.alert('Wishlist', res.data?.message || 'Could not add to wishlist');
      }
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      if (err.response?.status === 400) {
        const pid = product._id || product.id || product.productId;
        setFavorites(prev => {
          const next = new Set(prev);
          next.add(pid);
          return next;
        });
      } else {
        Alert.alert('Error', 'Failed to add to wishlist');
      }
    }
  };

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
        setWishlistData(prev => prev.filter(p => (p._id || p.id || p.productId) !== productId));
        setFilteredData(prev => prev.filter(p => (p._id || p.id || p.productId) !== productId));
      } else {
        Alert.alert('Wishlist', res.data?.message || 'Could not remove from wishlist');
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

  // cart flows
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
      } else {
        const msg = res.data?.message || 'Could not add to cart';
        Alert.alert('Cart', msg);
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      if (err.response?.status === 400) {
        await fetchMeta();
      } else {
        Alert.alert('Error', 'Failed to add to cart');
      }
    }
  };

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
        } else {
          Alert.alert('Cart', res.data?.message || 'Failed to remove item');
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
      navigation.push ? navigation.push("ViewProduct", { productId, product }) : navigation.navigate("ViewProduct", { productId, product });
    } catch (err) {
      console.error("openProductDetails error:", err);
      Alert.alert("Navigation Error", "Could not open product details. See console.");
    }
  };

  // dropdown control (use state to avoid private animation internals)
  const toggleDropdown = () => {
    const next = !dropdownOpen;
    setDropdownOpen(next);
    Animated.timing(animation, {
      toValue: next ? 1 : 0,
      duration: 250,
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

  // categories fetch for dropdown
  useEffect(() => {
    const getAllCategory = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const catRes = await axios.get(`${API_BASE}/api/admin/manage-app/categories`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
        });

        const onlyNames = catRes.data?.categories?.map((item) => item.name) || [];
        setAllCategory(['All', ...onlyNames.filter(n => n !== 'All')]);
      } catch (error) {
        console.log("Error fetching categories", error);
        setAllCategory(prev => prev.length ? prev : ['All']);
      }
    };
    getAllCategory();
  }, []);

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

  const renderCard = ({ item }) => {
    const productId = item._id || item.id || item.productId;
    const isFav = favorites.has(productId);
    const cartQty = cartItems[productId]?.quantity || 0;
    const normalized = {
      ...item,
      image: item.image || (Array.isArray(item.images) && item.images[0]) || null,
    };

    return (
      <ProductCard
        item={normalized}
        isFavorite={isFav}
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
      <Text allowFontScaling={false} style={styles.loadingText}>Loading wishlist...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.centerContainer}>
      <Text allowFontScaling={false} style={styles.errorText}>Error: {error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => { fetchWishlistData(); fetchMeta(); }}>
        <Text allowFontScaling={false} style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.centerContainer}>
      <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/4076/4076549.png" }} style={styles.emptyImage} />
      <Text allowFontScaling={false} style={styles.emptyText}>Your wishlist is empty</Text>
      <Text allowFontScaling={false} style={styles.emptySubText}>Add items to see them here</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.backArrow}>
          <TouchableOpacity onPress={goBack}>
            <Image source={require("../assets/via-farm-img/icons/groupArrow.png")} />
          </TouchableOpacity>
        </View>

        <Text allowFontScaling={false} style={styles.text}>My Wishlist</Text>

        <View style={styles.filterWrapper}>
          <TouchableOpacity style={styles.filterBtn} onPress={toggleDropdown}>
            <View style={styles.filterExpand}>
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.filterText}
              >
                {selectedOption}
              </Text>
              <Image width={moderateScale(20)} source={require('../assets/via-farm-img/icons/expandArrow.png')} />
            </View>
          </TouchableOpacity>

          <Animated.View style={[styles.dropdown, { height: dropdownHeight, borderWidth: borderWidth }]}>
            <ScrollView>
              {options.map(opt => (
                <TouchableOpacity key={opt} style={styles.dropdownItem} onPress={() => handleSelect(opt)}>
                  <Text allowFontScaling={false} style={styles.dropdownText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </View>

      {loading ? renderLoading() : error ? renderError() : filteredData.length === 0 ? (selectedOption === 'All' ? renderEmpty() : (
        <View style={styles.centerContainer}>
          <Text allowFontScaling={false} style={styles.emptyText}>No items found for {selectedOption}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => handleSelect('All')}>
            <Text allowFontScaling={false} style={styles.retryButtonText}>Show All</Text>
          </TouchableOpacity>
        </View>
      )) : (
        <FlatList
          data={filteredData}
          renderItem={renderCard}
          keyExtractor={(item, idx) => (item._id || item.id || item.productId || String(idx))}
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

// ========== Styles ==========
const cardStyles = StyleSheet.create({
  container: {
    width: '48%',
    marginVertical: scale(6),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'grey',
    elevation: 4,
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
    right: moderateScale(2),
    top: moderateScale(2),
    borderRadius: moderateScale(14),
    padding: moderateScale(4)
  },
  ratingContainer: {
    position: 'absolute',
    left: moderateScale(8),
    bottom: moderateScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(3),
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: moderateScale(12)
  },
  ratingText: {
    color: '#fff',
    marginLeft: moderateScale(2),
    fontSize: normalizeFont(9),
    fontWeight: '600'
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
    color: '#444',
    marginLeft: moderateScale(6)
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(8)
  },
  productUnit: {
    fontSize: normalizeFont(11),
    fontWeight: '600',
    color: '#333',
    marginLeft: moderateScale(1)
  },
  buttonContainer: {
    marginTop: moderateScale(10),
    alignItems: 'center'
  },
  addToCartButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(6),
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontSize: normalizeFont(13),
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ddd'
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 1)',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
    width: '100%',
  },
  quantityButton: {
    paddingHorizontal: moderateScale(8),
  },
  quantityText: {
    color: 'rgba(76, 175, 80, 1)',
    minWidth: moderateScale(42),
    textAlign: 'center',
    fontWeight: '600',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(76, 175, 80, 1)',
    paddingVertical: moderateScale(4)
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
  justifyContent: 'space-between', 
  paddingHorizontal: 10,
},
  backArrow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingVertical: scale(6),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: 'rgba(66, 66, 66, 0.7)',
    paddingHorizontal: moderateScale(8)
  },
  filterText: {
    color: 'rgba(66, 66, 66, 0.7)',
    fontSize: normalizeFont(13)
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
    zIndex: 1000,
    elevation: 6
  },
  dropdownItem: {
    padding: scale(8),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(66, 66, 66, 0.06)'
  },
  dropdownText: {
    color: 'rgba(66, 66, 66, 0.7)',
    fontSize: normalizeFont(11)
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
    fontSize: normalizeFont(10),
    color: '#666'
  },
  errorText: {
    fontSize: normalizeFont(12),
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
    fontSize: normalizeFont(12),
    fontWeight: '600'
  },
  emptyText: {
    fontSize: normalizeFont(12),
    fontWeight: '600',
    color: '#333',
    marginTop: scale(12)
  },
  emptySubText: {
    fontSize: normalizeFont(12),
    color: '#666',
    marginTop: scale(8)
  },
  emptyImage: {
    width: moderateScale(100),
    height: moderateScale(100),
    opacity: 0.6
  }
});

/* Modal styles (shared) */
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

export default MyWishlist;
