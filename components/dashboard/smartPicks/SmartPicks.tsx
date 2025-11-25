import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  DeviceEventEmitter,
  Dimensions,
  FlatList,
  PixelRatio,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ProductCard from '../../../components/common/ProductCard';

const API_BASE = 'https://viafarm-1.onrender.com';
const ENDPOINT = '/api/buyer/smart-picks';
const WISHLIST_ADD_ENDPOINT = '/api/buyer/wishlist/add';
const WISHLIST_REMOVE_ENDPOINT = '/api/buyer/wishlist';
const CART_ADD_ENDPOINT = '/api/buyer/cart/add';

// ---------- Responsive helpers ----------
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

const normalizeFont = (size) => {
  const newSize = moderateScale(size);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
};
// -----------------------------------------

// Make card slightly wider than before but responsive
const ITEM_CARD_WIDTH = Math.round(moderateScale(150));
const ITEM_HORIZONTAL_MARGIN = Math.round(moderateScale(8));
const ITEM_FULL = ITEM_CARD_WIDTH + ITEM_HORIZONTAL_MARGIN * 2;

const SmartPicks = () => {
  const navigation = useNavigation();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All']); // populated from API
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [showDropdown, setShowDropdown] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const animation = useRef(new Animated.Value(0)).current;

  // Normalize API item to a stable shape
  const normalizeApiItem = (item = {}) => {
    const productId = String(item.productId ?? item._id ?? item.id ?? '');
    const id = String(item.id ?? item._id ?? productId);

    // Vendor name extraction
    let vendorName = '';
    if (item.vendor?.name) {
      vendorName = item.vendor.name;
    } else if (item.vendorName) {
      vendorName = item.vendorName;
    } else if (item.seller?.name) {
      vendorName = item.seller.name;
    }

    return {
      raw: item,
      productId,
      id,
      title: item.name ?? item.title ?? 'Product',
      subtitle: vendorName || item.variety || '',
      price: Number(item.price ?? item.mrp ?? 0),
      image: item.image || item.imageUrl || null,
      category:
        item.category ??
        (typeof item.categoryName === 'string' ? item.categoryName : 'General'),
      rating: item.rating ?? 0,
      ratingCount: item.ratingCount ?? 0,
    };
  };

  const mapApiItemToProduct = useCallback((item) => {
    const n = normalizeApiItem(item);
    return {
      id: n.id,
      title: n.title,
      subtitle: n.subtitle,
      price: n.price,
      rating: n.rating,
      ratingCount: n.ratingCount,
      image: n.image,
      isFavorite: false,
      raw: n.raw,
      productId: String(n.productId || n.id),
      category: n.category,
    };
  }, []);

  const fetchProducts = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const token = await AsyncStorage.getItem('userToken');
        const res = await axios.get(`${API_BASE}${ENDPOINT}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 10000,
        });

        if (res?.data?.success && Array.isArray(res.data.data)) {
          const mapped = res.data.data.map(mapApiItemToProduct);
          setProducts(mapped);
        } else if (res?.data?.data) {
          const arr = Array.isArray(res.data.data)
            ? res.data.data
            : Object.values(res.data.data);
          setProducts(arr.map(mapApiItemToProduct));
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching smart picks:', error);
        setProducts([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [mapApiItemToProduct]
  );

  const fetchCart = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setCartItems({});
        return;
      }

      const response = await axios.get(`${API_BASE}/api/buyer/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        const items = response.data.data?.items || [];
        const cartMap = {};
        items.forEach((item) => {
          const productIdKey = String(item.productId ?? item._id ?? item.id ?? '');
          cartMap[productIdKey] = {
            quantity: item.quantity ?? 1,
            cartItemId: item._id ?? item.id ?? null,
            raw: item,
          };
        });
        setCartItems(cartMap);
      } else {
        setCartItems({});
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems({});
    }
  }, []);

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
          wishlistItems.map((i) => String(i.productId ?? i._id ?? i.id ?? ''))
        );
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  }, []);

  // NEW: fetch categories from API and set dropdown (trim + unique)
  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/manage-app/categories`, {
        timeout: 10000,
      });
      // API returns { success: true, categories: [...] }
      const catArr = Array.isArray(res.data?.categories) ? res.data.categories : [];
      // Trim + unique + preserve order
      const seen = new Set();
      const names = [];
      for (const c of catArr) {
        const rawName = typeof c.name === 'string' ? c.name : String(c.name ?? c._id ?? '');
        const name = rawName.trim();
        if (!name) continue;
        const lower = name.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          names.push(name);
        }
      }
      setCategories(['All', ...names]);
      // if currently selected category isn't in new list, reset to All
      if (selectedCategory && selectedCategory !== 'All') {
        const found = names.find((n) => n.toLowerCase() === selectedCategory.toLowerCase());
        if (!found) setSelectedCategory('All');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories(['All']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchWishlist();
    fetchCart();
    fetchCategories();

    const sub = DeviceEventEmitter.addListener('cartUpdated', () => {
      fetchCart();
    });
    return () => sub.remove();
  }, [fetchProducts, fetchWishlist, fetchCart, fetchCategories]);

  // Filter products by category
  useEffect(() => {
    const filtered =
      selectedCategory === 'All'
        ? products
        : products.filter(
            (p) => String(p.category || '').toLowerCase() === String(selectedCategory).toLowerCase()
          );
    setFilteredProducts(filtered);
  }, [products, selectedCategory]);

  const openDropdown = useCallback(() => {
    setShowDropdown(true);
    Animated.timing(animation, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  }, [animation]);

  const closeDropdown = useCallback(() => {
    Animated.timing(animation, { toValue: 0, duration: 180, useNativeDriver: false }).start(() => {
      setShowDropdown(false);
    });
  }, [animation]);

  const toggleDropdown = useCallback(() => {
    if (showDropdown) closeDropdown();
    else openDropdown();
  }, [showDropdown, openDropdown, closeDropdown]);

  // Add to Cart
  const addToCart = useCallback(
    async (product) => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          Alert.alert('Login Required', 'Please login to add items to cart');
          return false;
        }

        const productId = String(
          product.productId ?? product.raw?._id ?? product.raw?.id ?? product.id ?? ''
        );

        if (!productId) {
          Alert.alert('Error', 'Invalid product id');
          return false;
        }

        if (cartItems[productId]) {
          Alert.alert('Info', 'Product already in cart');
          return false;
        }

        const cartData = {
          productId,
          name: product.title,
          image: product.image || product.raw?.image,
          price: Number(product.price || 0),
          quantity: 1,
          category: product.categoryName || 'General',
          variety: product.subtitle || product.raw?.variety || 'Standard',
          unit: 'piece',
        };

        const response = await axios.post(`${API_BASE}${CART_ADD_ENDPOINT}`, cartData, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          timeout: 10000,
        });

        if (response.data?.success) {
          await fetchCart();
          DeviceEventEmitter.emit('cartUpdated');
          Alert.alert('Success', 'Product added to cart!');
          return true;
        } else {
          const msg = response.data?.message || 'Failed to add to cart';
          Alert.alert('Info', msg);
          await fetchCart();
          return false;
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        const status = error.response?.status;
        const msg = error.response?.data?.message || error.message || 'Failed to add to cart';
        if (status === 401) {
          Alert.alert('Login Required', 'Please login to add items');
        } else if (status === 400) {
          Alert.alert('Info', msg);
        } else {
          Alert.alert('Error', msg);
        }
        await fetchCart();
        return false;
      }
    },
    [cartItems, fetchCart]
  );

  // Update cart quantity
  const updateCartQuantity = useCallback(
    async (product, newQty) => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;

        const productIdKey = String(product.productId ?? product.id ?? '');
        const entry = cartItems[productIdKey];
        if (!entry || !entry.cartItemId) {
          await fetchCart();
          return;
        }
        const cartItemId = entry.cartItemId;
        const res = await axios.put(
          `${API_BASE}/api/buyer/cart/${cartItemId}/quantity`,
          { quantity: newQty },
          {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          }
        );
        if (res.data?.success) {
          await fetchCart();
          DeviceEventEmitter.emit('cartUpdated');
        } else {
          Alert.alert('Error', res.data?.message || 'Failed to update quantity');
        }
      } catch (err) {
        console.error('Error updating cart quantity:', err);
        Alert.alert('Error', 'Failed to update cart quantity');
        await fetchCart();
      }
    },
    [cartItems, fetchCart]
  );

  // Wishlist functions
  const addToWishlist = useCallback(async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to wishlist');
        return false;
      }

      const payload = {
        productId: product.productId || product.id,
        name: product.title,
        image: product.image,
        price: product.price,
        category: product.category,
        variety: product.subtitle || 'Standard',
        unit: 'piece',
      };

      const response = await axios.post(`${API_BASE}${WISHLIST_ADD_ENDPOINT}`, payload, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        setFavorites((prev) => {
          const next = new Set(prev);
          next.add(String(product.productId || product.id));
          return next;
        });
        Alert.alert('Success', 'Product added to wishlist!');
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to add to wishlist');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to add to wishlist');
      return false;
    }
  }, []);

  const removeFromWishlist = useCallback(async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to manage wishlist');
        return false;
      }

      const productId = product.productId || product.id;
      const response = await axios.delete(`${API_BASE}${WISHLIST_REMOVE_ENDPOINT}/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(String(product.productId ?? product.id));
          return next;
        });
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to remove from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to remove from wishlist');
      return false;
    }
  }, []);

  // Navigate to product view
  const handleCardPress = useCallback(
    (productId, item) => {
      try {
        navigation.navigate('ViewProduct', {
          productId: String(productId),
          product: item,
        });
      } catch (err) {
        console.error('Navigation error to ViewProduct:', err);
        Alert.alert('Error', 'Unable to open product details.');
      }
    },
    [navigation]
  );

  const handleFavoritePress = useCallback(
    async (productId) => {
      try {
        const product = filteredProducts.find((p) => p.id === productId);
        if (!product) return;
        if (favorites.has(String(product.productId ?? product.id))) {
          await removeFromWishlist(product);
        } else {
          await addToWishlist(product);
        }
        await fetchWishlist();
      } catch (err) {
        console.error(err);
      }
    },
    [filteredProducts, favorites, addToWishlist, removeFromWishlist, fetchWishlist]
  );

  const handleAddToCart = useCallback(
    async (productId) => {
      const product = filteredProducts.find((p) => p.id === productId);
      if (!product) return;
      await addToCart(product);
    },
    [filteredProducts, addToCart]
  );

  const handleQuantityChange = useCallback(
    async (productId, change) => {
      const product = filteredProducts.find((p) => p.id === productId);
      if (!product) return;
      const key = String(product.productId ?? product.id);
      const currentQty = cartItems[key]?.quantity ?? 0;
      const newQty = Math.max(0, currentQty + change);
      if (newQty === 0) {
        await updateCartQuantity(product, 0);
      } else {
        await updateCartQuantity(product, newQty);
      }
    },
    [filteredProducts, cartItems, updateCartQuantity]
  );

  // Memoized renderItem
  const renderProductCard = useCallback(
    ({ item }) => {
      const productIdKey = item.productId || item.id;
      const inCart = !!cartItems[productIdKey];
      const quantity = cartItems[productIdKey]?.quantity || 0;

      return (
        <View style={[styles.cardWrapper, { width: ITEM_CARD_WIDTH }]}>
          <ProductCard
            id={item.id}
            title={item.title}
            subtitle={item.subtitle}
            price={item.price}
            rating={item.rating}
            image={item.image}
            isFavorite={favorites.has(String(item.productId ?? item.id))}
            onPress={() => handleCardPress(item.productId ?? item.id, item)}
            onFavoritePress={() => handleFavoritePress(item.id)}
            onAddToCart={() => handleAddToCart(item.id)}
            onQuantityChange={(change) => handleQuantityChange(item.id, change)}
            inCart={inCart}
            cartQuantity={quantity}
            width={ITEM_CARD_WIDTH}
            showRating
            showFavorite
            imageHeight={Math.round(moderateScale(120))}
          />
        </View>
      );
    },
    [favorites, cartItems, handleCardPress, handleFavoritePress, handleAddToCart, handleQuantityChange]
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Smart Picks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Smart Picks</Text>

        <View style={styles.filterWrapper}>
          <TouchableOpacity style={styles.filterBtn} onPress={toggleDropdown} activeOpacity={0.8}>
            <View style={styles.filterExpand}>
              <Text numberOfLines={1} ellipsizeMode="tail" style={styles.filterText}>
                {selectedCategory}
              </Text>
              <Ionicons name={showDropdown ? 'chevron-up' : 'chevron-down'} size={normalizeFont(14)} color="#666" />
            </View>
          </TouchableOpacity>

          {/* Animated dropdown */}
          {/*
            Animated.View has absolute positioning.
            We give it elevation on Android and zIndex on iOS so it renders above other elements.
          */}
          <Animated.View
            pointerEvents={showDropdown ? 'auto' : 'none'}
            style={[
              styles.dropdown,
              {
                height: animation.interpolate({ inputRange: [0, 1], outputRange: [0, moderateScale(240)] }),
                borderWidth: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                opacity: animation,
              },
            ]}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.dropdownScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              {categories.map((category) => {
                const isSelected = String(category).toLowerCase() === String(selectedCategory).toLowerCase();
                return (
                  <TouchableOpacity
                    key={category}
                    style={[styles.dropdownItem, isSelected && styles.selectedDropdownItem]}
                    activeOpacity={0.7}
                    onPress={() => {
                      // set selected and close dropdown
                      setSelectedCategory(category);
                      // animate close
                      closeDropdown();
                    }}
                  >
                    <Text style={[styles.dropdownText, isSelected && styles.selectedDropdownText]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        </View>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProductCard}
        keyExtractor={(item) => String(item.productId ?? item.id)}
        horizontal
        contentContainerStyle={styles.listContainer}
        showsHorizontalScrollIndicator={false}
        style={styles.flatListStyle}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { fetchProducts(true); fetchCart(); }} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products available.</Text>
            </View>
          )
        }
        initialNumToRender={5}
        removeClippedSubviews={false}
        extraData={{ favorites: Array.from(favorites), cartItems, selectedCategory }}
        getItemLayout={(data, index) => ({ length: ITEM_FULL, offset: ITEM_FULL * index, index })}
        windowSize={5}
        maxToRenderPerBatch={6}
        bounces={false}
        alwaysBounceHorizontal={false}
        contentInsetAdjustmentBehavior="never"
        snapToInterval={ITEM_FULL}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    paddingVertical: verticalScale(30),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: verticalScale(10),
    fontSize: normalizeFont(13),
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(6),
    paddingTop: verticalScale(10),
    paddingHorizontal: moderateScale(13),
  },
  title: {
    fontSize: normalizeFont(18),
    fontWeight: '600',
    color: '#333',
  },
  filterWrapper: {
    position: 'relative',
    minWidth: moderateScale(120),
  },
  filterBtn: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: 'rgba(66, 66, 66, 0.7)',
  },
  filterExpand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    color: 'rgba(66, 66, 66, 0.9)',
    textAlign: 'center',
    fontSize: normalizeFont(11),
    marginRight: moderateScale(6),
    maxWidth: moderateScale(90),
  },
  dropdown: {
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderColor: 'rgba(66, 66, 66, 0.7)',
    borderRadius: moderateScale(6),
    position: 'absolute',
    top: moderateScale(35),
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 10, // android elevation
  },
  dropdownScrollContent: { paddingVertical: 6 },
  dropdownItem: {
    padding: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(66, 66, 66, 0.06)',
  },
  selectedDropdownItem: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  dropdownText: {
    color: 'rgba(66, 66, 66, 0.9)',
    fontSize: normalizeFont(11),
  },
  selectedDropdownText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  listContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: moderateScale(5),
    paddingVertical: verticalScale(8),
  },
  flatListStyle: {
    paddingBottom: moderateScale(10),
  },
  cardWrapper: {
    marginHorizontal: ITEM_HORIZONTAL_MARGIN,
  },
  emptyContainer: {
    padding: moderateScale(20),
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: normalizeFont(14),
    textAlign: 'center',
    marginBottom: verticalScale(10),
  },
});

export default SmartPicks;
