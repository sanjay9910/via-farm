import { AuthContext } from '@/app/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  PanResponder,
  PixelRatio,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const API_BASE_URL = 'https://viafarm-1.onrender.com';

const SearchPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { searchQuery, currentFilters, initialResults } = route.params || {};

  const { user, address } = useContext(AuthContext);
  const [searchText, setSearchText] = useState(searchQuery || '');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState(initialResults || []);
  const [filteredProducts, setFilteredProducts] = useState(initialResults || []);

  // Filter states
  const [filters, setFilters] = useState(currentFilters || {
    sortBy: 'relevance',
    priceMin: 50,
    priceMax: 3000,
    distanceMin: 0,
    distanceMax: 100,
    ratingMin: 0,
  });

  // Wishlist and Cart states
  const [wishlist, setWishlist] = useState(new Set());
  const [cartItems, setCartItems] = useState({});
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');

  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [tempFilters, setTempFilters] = useState({ ...filters });
  const [expandedFilters, setExpandedFilters] = useState({
    sortBy: false,
    price: false,
    distance: false,
    rating: false,
  });

  const slideAnim = useState(new Animated.Value(SCREEN_WIDTH))[0];
  const { width } = Dimensions.get('window');

  // PanResponders for sliders
  const priceMinResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, { dx }) => {
        const newValue = Math.max(50, Math.min(tempFilters.priceMax - 100, tempFilters.priceMin + Math.round(dx / 2)));
        setTempFilters(prev => ({ ...prev, priceMin: newValue }));
      },
    })
  ).current;

  const priceMaxResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, { dx }) => {
        const newValue = Math.min(3000, Math.max(tempFilters.priceMin + 100, tempFilters.priceMax + Math.round(dx / 2)));
        setTempFilters(prev => ({ ...prev, priceMax: newValue }));
      },
    })
  ).current;

  const distanceMinResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, { dx }) => {
        const newValue = Math.max(0, Math.min(tempFilters.distanceMax - 5, tempFilters.distanceMin + Math.round(dx / 3)));
        setTempFilters(prev => ({ ...prev, distanceMin: newValue }));
      },
    })
  ).current;

  const distanceMaxResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, { dx }) => {
        const newValue = Math.min(100, Math.max(tempFilters.distanceMin + 5, tempFilters.distanceMax + Math.round(dx / 3)));
        setTempFilters(prev => ({ ...prev, distanceMax: newValue }));
      },
    })
  ).current;

  // Fetch data on mount
  useEffect(() => {
    if (searchQuery) {
      fetchProducts(searchQuery);
    }
    fetchWishlist();
    fetchCart();
  }, [searchQuery]);

  // Apply filters whenever products or filters change
  useEffect(() => {
    applyFiltersToProducts();
  }, [products, filters]);

  const fetchProducts = async (query) => {
    if (!query || query.trim().length === 0) return;

    setLoading(true);
    try {
      const q = encodeURIComponent(query.trim());
      const token = await AsyncStorage.getItem('userToken');

      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/buyer/products/search?q=${q}`,
        {
          method: 'GET',
          headers: headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let products = [];

      // Handle response format
      if (data?.success && Array.isArray(data.data)) {
        products = data.data;
      } else if (Array.isArray(data)) {
        products = data;
      } else if (Array.isArray(data.products)) {
        products = data.products;
      }

      // Remove duplicates by ID
      const uniqueProducts = [];
      const seen = new Set();

      products.forEach((p) => {
        const id = p._id || p.id;
        if (id && !seen.has(id)) {
          seen.add(id);
          uniqueProducts.push(p);
        }
      });

      setProducts(uniqueProducts);

    } catch (error) {
      console.error('Search Error:', error);
      Alert.alert('Error', 'Failed to fetch products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/api/buyer/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        const wishlistItems = response.data.data?.items || [];
        const favoriteIds = new Set(
          wishlistItems.map(item => item.productId || item._id || item.id)
        );
        setWishlist(favoriteIds);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const fetchCart = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/api/buyer/cart`, {
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

  const applyFiltersToProducts = () => {
    if (!Array.isArray(products) || products.length === 0) {
      setFilteredProducts([]);
      return;
    }

    const filtered = products.filter((product) => {
      const price = Number(product.price ?? product.mrp ?? 0);
      const rating = Number(product.rating ?? 0);

      const okPrice = price >= (filters.priceMin ?? 0) && price <= (filters.priceMax ?? Number.MAX_SAFE_INTEGER);
      const okRating = rating >= (filters.ratingMin ?? 0);

      return okPrice && okRating;
    });

    // Apply sort
    let sorted = [...filtered];
    const sortBy = filters.sortBy;

    if (sortBy && sortBy !== 'relevance') {
      if (sortBy === 'Price - low to high') {
        sorted.sort((a, b) => (Number(a.price ?? a.mrp ?? 0) - Number(b.price ?? b.mrp ?? 0)));
      } else if (sortBy === 'Price - high to low') {
        sorted.sort((a, b) => (Number(b.price ?? b.mrp ?? 0) - Number(a.price ?? a.mrp ?? 0)));
      } else if (sortBy === 'Newest Arrivals') {
        sorted.sort((a, b) => {
          const da = new Date(a.createdAt || a.datePosted || 0).getTime();
          const db = new Date(b.createdAt || b.datePosted || 0).getTime();
          return db - da;
        });
      }
    }

    setFilteredProducts(sorted);
  };

  const handleSearchSubmit = () => {
    if (searchText.trim().length === 0) {
      Alert.alert('Empty Search', 'Please enter something to search');
      return;
    }
    fetchProducts(searchText);
  };

  // Wishlist Functions
  const addToWishlist = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to wishlist');
        return;
      }

      const productId = product._id || product.id;

      const wishlistData = {
        productId: productId,
        name: product.name,
        image: product.images?.[0] || product.image || '',
        price: product.price,
        category: product.category?.name || product.category || 'Products',
        variety: product.variety || 'Standard',
        unit: product.unit || 'kg'
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/buyer/wishlist/add`,
        wishlistData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        setWishlist(prev => new Set(prev).add(productId));
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      Alert.alert('Error', 'Failed to add to wishlist');
    }
  };

  const removeFromWishlist = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const productId = product._id || product.id;

      const response = await axios.delete(
        `${API_BASE_URL}/api/buyer/wishlist/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.success) {
        setWishlist(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      Alert.alert('Error', 'Failed to remove from wishlist');
    }
  };

  const handleToggleWishlist = async (product) => {
    const productId = product._id || product.id;
    if (wishlist.has(productId)) {
      await removeFromWishlist(product);
    } else {
      await addToWishlist(product);
    }
  };

  // Cart Functions
  const handleAddToCart = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to cart');
        return;
      }

      const productId = product._id || product.id;

      // Optimistic update
      setCartItems(prev => ({
        ...prev,
        [productId]: { quantity: 1, cartItemId: prev[productId]?.cartItemId || productId }
      }));

      const cartData = {
        productId: productId,
        name: product.name,
        image: product.images?.[0] || product.image || '',
        price: product.price,
        quantity: 1,
        category: product.category?.name || product.category || 'Products',
        variety: product.variety || 'Standard',
        unit: product.unit || 'kg'
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/buyer/cart/add`,
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
          [productId]: {
            quantity: 1,
            cartItemId: response.data.data?._id || productId
          }
        }));
      } else {
        // Rollback on failure
        setCartItems(prev => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add to cart');
      await fetchCart(); // Refresh cart state
    }
  };

  const handleUpdateQuantity = async (product, change) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const productId = product._id || product.id;
      const currentItem = cartItems[productId];
      if (!currentItem) return;

      const newQuantity = currentItem.quantity + change;

      if (newQuantity < 1) {
        const prevCart = { ...cartItems };
        setCartItems(prev => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });

        const response = await axios.delete(`${API_BASE_URL}/api/buyer/cart/${currentItem.cartItemId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data?.success) {
          setCartItems(prevCart); 
        }
      } else {
        const prevCart = { ...cartItems };
        setCartItems(prev => ({
          ...prev,
          [productId]: { ...currentItem, quantity: newQuantity }
        }));

        const response = await axios.put(
          `${API_BASE_URL}/api/buyer/cart/${currentItem.cartItemId}/quantity`,
          { quantity: newQuantity },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
          }
        );

        if (!response.data?.success) {
          setCartItems(prevCart);
        }
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      await fetchCart();
    }
  };

  // Quantity Modal Functions
  const openQuantityModal = (product) => {
    const productId = product._id || product.id;
    const currentQty = cartItems[productId]?.quantity || 0;
    setSelectedProduct(product);
    setEditQuantity(String(currentQty));
    setQuantityModalVisible(true);
  };

  const closeQuantityModal = () => {
    setQuantityModalVisible(false);
    setSelectedProduct(null);
    setEditQuantity('');
  };

  const applyQuantityChange = async () => {
    if (!selectedProduct) return;

    const parsed = parseInt(String(editQuantity).replace(/\D/g, ''), 10);
    const newQty = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    const productId = selectedProduct._id || selectedProduct.id;
    const currentQty = cartItems[productId]?.quantity || 0;
    const delta = newQty - currentQty;

    if (delta === 0) {
      closeQuantityModal();
      return;
    }

    if (newQty === 0) {
      // Remove from cart
      await handleUpdateQuantity(selectedProduct, -currentQty);
    } else if (currentQty === 0) {
      // Add to cart with specific quantity
      await handleAddToCartWithQuantity(selectedProduct, newQty);
    } else {
      // Update existing quantity
      await handleUpdateQuantity(selectedProduct, delta);
    }

    closeQuantityModal();
  };

  const handleAddToCartWithQuantity = async (product, quantity) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to cart');
        return;
      }

      const productId = product._id || product.id;

      setCartItems(prev => ({
        ...prev,
        [productId]: { quantity: quantity, cartItemId: prev[productId]?.cartItemId || productId }
      }));

      const cartData = {
        productId: productId,
        name: product.name,
        image: product.images?.[0] || product.image || '',
        price: product.price,
        quantity: quantity,
        category: product.category?.name || product.category || 'Products',
        variety: product.variety || 'Standard',
        unit: product.unit || 'kg'
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/buyer/cart/add`,
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
          [productId]: {
            quantity: quantity,
            cartItemId: response.data.data?._id || productId
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
      console.error('Error adding to cart with quantity:', error);
      Alert.alert('Error', 'Failed to add to cart');
      await fetchCart();
    }
  };

  const incrementEditQuantity = () => {
    const v = parseInt(editQuantity || "0", 10) || 0;
    setEditQuantity(String(v + 1));
  };

  const decrementEditQuantity = () => {
    const v = parseInt(editQuantity || "0", 10) || 0;
    setEditQuantity(String(Math.max(0, v - 1)));
  };

  // Filter Functions
  const openFilterPopup = () => {
    setTempFilters({ ...filters });
    setShowFilterPopup(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeFilterPopup = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowFilterPopup(false);
    });
  };

  const applyFilters = () => {
    setFilters({ ...tempFilters });
    closeFilterPopup();
  };

  const clearFilters = () => {
    const defaults = {
      sortBy: 'relevance',
      priceMin: 50,
      priceMax: 3000,
      distanceMin: 0,
      distanceMax: 100,
      ratingMin: 0,
    };
    setTempFilters(defaults);
    setFilters(defaults);
  };

  const handleProductClick = (product) => {
    navigation.navigate('ViewProduct', {
      productId: product._id || product.id,
      product: product
    });
  };

  // Product Card Component
  const ProductCard = ({ product }) => {
    const productId = product._id || product.id;
    const isFavorite = wishlist.has(productId);
    const cartQuantity = cartItems[productId]?.quantity || 0;
    const inCart = cartQuantity > 0;
    const imageUri = product.images?.[0] || product.image || 'https://via.placeholder.com/120';
    const vendorName = product.vendor?.name || 'Unknown Vendor';
    const rating = product.rating || 0;
    const distance = product.distanceFromVendor || product.distance || '0.0 km';
    const status = product.status || (product.quantity === 0 ? 'Out of Stock' : 'In Stock');

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleProductClick(product)}
        activeOpacity={0.7}
      >
        <View style={styles.productImageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.productImage}
            resizeMode="cover"
          />

          {/* Wishlist Button */}
          <TouchableOpacity
            style={styles.wishlistButton}
            onPress={(e) => {
              e.stopPropagation();
              handleToggleWishlist(product);
            }}
          >
            {isFavorite ? <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={scale(22)}
              color={isFavorite ? '#ff4444' : '#fff'}
            /> : <Image source={require("../assets/via-farm-img/icons/mainHeartIcon.png")} />}
          </TouchableOpacity>

          {/* Rating Badge */}
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={scale(12)} color="#FFD700" />
            <Text allowFontScaling={false} style={styles.ratingText}>
              {Number(rating).toFixed(1)}
            </Text>
          </View>
        </View>

        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text allowFontScaling={false} style={styles.productName} numberOfLines={2}>
              {product.name}
            </Text>
          </View>

          <Text allowFontScaling={false} style={styles.productVendor} numberOfLines={1}>
            by {vendorName}
          </Text>

          {/* Location */}
          <View style={styles.locationContainer}>
            <Image
              source={require("../assets/via-farm-img/icons/iconlocation.png")}
              style={styles.locationIcon}
            />
            <Text allowFontScaling={false} style={styles.locationText}>
              {distance}
            </Text>
          </View>

          <View style={styles.productFooter}>
            <Text allowFontScaling={false} style={styles.productPrice}>
              ₹{product.price}
            </Text>

            {!inCart ? (
              <TouchableOpacity
                style={[
                  styles.addToCartButton,
                  status !== 'In Stock' && styles.disabledButton
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  if (status === 'In Stock') {
                    handleAddToCart(product);
                  }
                }}
                disabled={status !== 'In Stock'}
              >
                <Text allowFontScaling={false} style={styles.addToCartText}>
                  {status === 'In Stock' ? 'Add to Cart' : status}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleUpdateQuantity(product, -1);
                  }}
                >
                  <Ionicons name="remove" size={scale(16)} color="rgba(76, 175, 80, 1)" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quantityValueContainer}
                  onPress={(e) => {
                    e.stopPropagation();
                    openQuantityModal(product);
                  }}
                >
                  <Text allowFontScaling={false} style={styles.quantityText}>{cartQuantity}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleUpdateQuantity(product, 1);
                  }}
                >
                  <Ionicons name="add" size={scale(16)} color="rgba(76, 175, 80, 1)" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={60} color="#ccc" />
      <Text allowFontScaling={false} style={styles.emptySubtitle}>
        Try searching for something else or adjust your filters
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
            allowFontScaling={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.filterIconButton} onPress={openFilterPopup}>
          <Image
            source={require("../assets/via-farm-img/icons/filterIcon.png")}
            style={{ width: scale(24), height: scale(24) }}
          />
        </TouchableOpacity>
      </View>

      {/* Results Info */}
      <View style={styles.resultsInfo}>
        <Text allowFontScaling={false} style={styles.resultsText}>
          {loading ? 'Searching...' : `${filteredProducts.length} products found`}
        </Text>
        {filters.sortBy !== 'relevance' && (
          <Text allowFontScaling={false} style={styles.sortText}>
            Sorted by: {filters.sortBy}
          </Text>
        )}
      </View>

      {/* Products List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={({ item }) => <ProductCard product={item} />}
          keyExtractor={(item, index) => `${item._id || item.id || index}`}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Quantity Edit Modal */}
      <Modal
        visible={quantityModalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeQuantityModal}
      >
        <TouchableOpacity
          style={styles.quantityModalBackdrop}
          activeOpacity={1}
          onPress={closeQuantityModal}
        >
          <View style={styles.quantityModalContent}>
            <Text allowFontScaling={false} style={styles.quantityModalTitle}>Edit Quantity</Text>

            <View style={styles.quantityEditRow}>
              <TouchableOpacity
                style={styles.quantityModalButton}
                onPress={decrementEditQuantity}
              >
                <Ionicons name="remove" size={scale(20)} color="#333" />
              </TouchableOpacity>

              <TextInput
                style={styles.quantityModalInput}
                keyboardType="number-pad"
                value={editQuantity}
                onChangeText={(text) => setEditQuantity(text.replace(/[^0-9]/g, ''))}
                maxLength={3}
                textAlign="center"
                allowFontScaling={false}
              />

              <TouchableOpacity
                style={styles.quantityModalButton}
                onPress={incrementEditQuantity}
              >
                <Ionicons name="add" size={scale(20)} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.quantityModalActions}>
              <TouchableOpacity
                style={[styles.quantityModalActionButton, styles.cancelButton]}
                onPress={closeQuantityModal}
              >
                <Text allowFontScaling={false} style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quantityModalActionButton, styles.applyButton]}
                onPress={applyQuantityChange}
              >
                <Text allowFontScaling={false} style={styles.applyButtonText}>add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Popup Modal */}
      <Modal
        visible={showFilterPopup}
        transparent={true}
        animationType="none"
        onRequestClose={closeFilterPopup}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            onPress={closeFilterPopup}
            activeOpacity={1}
          />
          <Animated.View
            style={[
              styles.filterPopup,
              {
                transform: [{ translateX: slideAnim }]
              }
            ]}
          >
            <View style={styles.filterHeader}>
              <View style={styles.filterTitleContainer}>
                <Image
                  source={require("../assets/via-farm-img/icons/filterIcon.png")}
                  style={{ width: scale(15), height: scale(15) }}
                />
                <Text allowFontScaling={false} style={styles.filterTitle}>Filters</Text>
              </View>
              <TouchableOpacity onPress={closeFilterPopup} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={['sort', 'price', 'distance', 'rating']}
              renderItem={({ item }) => {
                if (item === 'sort') {
                  return (
                    <View>
                      <TouchableOpacity
                        style={styles.filterOption}
                        onPress={() => setExpandedFilters({
                          ...expandedFilters,
                          sortBy: !expandedFilters.sortBy
                        })}
                        activeOpacity={0.7}
                      >
                        <Text allowFontScaling={false} style={styles.filterOptionText}>Sort by</Text>
                        <Ionicons
                          name={expandedFilters.sortBy ? "chevron-up" : "chevron-down"}
                          size={14}
                          color="#666"
                        />
                      </TouchableOpacity>
                      {expandedFilters.sortBy && (
                        <View style={styles.filterDetails}>
                          {['relevance', 'Price - high to low', 'Newest Arrivals', 'Price - low to high'].map((option) => (
                            <TouchableOpacity
                              key={option}
                              style={styles.filterOption2}
                              onPress={() => setTempFilters({ ...tempFilters, sortBy: option })}
                              activeOpacity={0.7}
                            >
                              <Text allowFontScaling={false} style={[
                                styles.filterOptionText2,
                                tempFilters.sortBy === option && styles.filterOptionText2Active
                              ]}>
                                {option}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                } else if (item === 'price') {
                  return (
                    <View>
                      <TouchableOpacity
                        style={styles.filterOption}
                        onPress={() => setExpandedFilters({
                          ...expandedFilters,
                          price: !expandedFilters.price
                        })}
                        activeOpacity={0.7}
                      >
                        <Text allowFontScaling={false} style={styles.filterOptionText}>Price Range</Text>
                        <Ionicons
                          name={expandedFilters.price ? "chevron-up" : "chevron-down"}
                          size={14}
                          color="#666"
                        />
                      </TouchableOpacity>
                      {expandedFilters.price && (
                        <View style={styles.filterDetails}>
                          <View style={styles.sliderContainer}>
                            <View style={styles.sliderLabelRow}>
                              <Text allowFontScaling={false} style={styles.sliderLabel}>₹{tempFilters.priceMin}</Text>
                              <Text allowFontScaling={false} style={styles.sliderLabel}>₹{tempFilters.priceMax}</Text>
                            </View>
                            <View style={styles.sliderBar}>
                              <View style={[
                                styles.sliderFill,
                                {
                                  left: `${(tempFilters.priceMin / 3000) * 100}%`,
                                  right: `${100 - (tempFilters.priceMax / 3000) * 100}%`,
                                }
                              ]} />
                              <View
                                {...priceMinResponder.panHandlers}
                                style={[
                                  styles.sliderThumb,
                                  { left: `${(tempFilters.priceMin / 3000) * 100}%` }
                                ]}
                              />
                              <View
                                {...priceMaxResponder.panHandlers}
                                style={[
                                  styles.sliderThumb,
                                  { right: `${100 - (tempFilters.priceMax / 3000) * 100}%` }
                                ]}
                              />
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                } else if (item === 'distance') {
                  return (
                    <View>
                      <TouchableOpacity
                        style={styles.filterOption}
                        onPress={() => setExpandedFilters({
                          ...expandedFilters,
                          distance: !expandedFilters.distance
                        })}
                        activeOpacity={0.7}
                      >
                        <Text allowFontScaling={false} style={styles.filterOptionText}>Distance</Text>
                        <Ionicons
                          name={expandedFilters.distance ? "chevron-up" : "chevron-down"}
                          size={14}
                          color="#666"
                        />
                      </TouchableOpacity>
                      {expandedFilters.distance && (
                        <View style={styles.filterDetails}>
                          <View style={styles.sliderContainer}>
                            <View style={styles.sliderLabelRow}>
                              <Text allowFontScaling={false} style={styles.sliderLabel}>{tempFilters.distanceMin}km</Text>
                              <Text allowFontScaling={false} style={styles.sliderLabel}>{tempFilters.distanceMax}km</Text>
                            </View>
                            <View style={styles.sliderBar}>
                              <View style={[
                                styles.sliderFill,
                                {
                                  left: `${(tempFilters.distanceMin / 100) * 100}%`,
                                  right: `${100 - (tempFilters.distanceMax / 100) * 100}%`,
                                }
                              ]} />
                              <View
                                {...distanceMinResponder.panHandlers}
                                style={[
                                  styles.sliderThumb,
                                  { left: `${(tempFilters.distanceMin / 100) * 100}%` }
                                ]}
                              />
                              <View
                                {...distanceMaxResponder.panHandlers}
                                style={[
                                  styles.sliderThumb,
                                  { right: `${100 - (tempFilters.distanceMax / 100) * 100}%` }
                                ]}
                              />
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                } else if (item === 'rating') {
                  return (
                    <View>
                      <TouchableOpacity
                        style={styles.filterOption}
                        onPress={() => setExpandedFilters({
                          ...expandedFilters,
                          rating: !expandedFilters.rating
                        })}
                        activeOpacity={0.7}
                      >
                        <Text allowFontScaling={false} style={styles.filterOptionText}>Rating</Text>
                        <Ionicons
                          name={expandedFilters.rating ? "chevron-up" : "chevron-down"}
                          size={14}
                          color="#666"
                        />
                      </TouchableOpacity>
                      {expandedFilters.rating && (
                        <View style={styles.filterDetails}>
                          {[2.0, 3.0, 4.0].map((rating) => (
                            <TouchableOpacity
                              key={rating}
                              style={styles.checkboxRow}
                              onPress={() => setTempFilters({ ...tempFilters, ratingMin: tempFilters.ratingMin === rating ? 0 : rating })}
                              activeOpacity={0.7}
                            >
                              <View style={[
                                styles.checkbox,
                                tempFilters.ratingMin === rating && styles.checkboxChecked
                              ]}>
                                {tempFilters.ratingMin === rating && (
                                  <Ionicons name="checkmark" size={12} color="#fff" />
                                )}
                              </View>
                              <Text allowFontScaling={false} style={styles.checkboxLabel}>{rating} and above</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                }
              }}
              keyExtractor={(item) => item}
              scrollEnabled={false}
            />

            <View style={styles.filterFooter}>
              <TouchableOpacity
                style={[styles.applyButton, { marginBottom: 8 }]}
                onPress={applyFilters}
                activeOpacity={0.8}
              >
                <Text allowFontScaling={false} style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: '#ddd' }]}
                onPress={clearFilters}
                activeOpacity={0.8}
              >
                <Text allowFontScaling={false} style={[styles.applyButtonText, { color: '#333' }]}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: moderateScale(8),
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    marginHorizontal: moderateScale(12),
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: moderateScale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: normalizeFont(14),
    color: '#333',
    paddingVertical: moderateScale(10),
  },
  filterIconButton: {
    padding: moderateScale(8),
  },
  resultsInfo: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultsText: {
    fontSize: normalizeFont(14),
    fontWeight: '600',
    color: '#333',
  },
  sortText: {
    fontSize: normalizeFont(12),
    color: '#666',
    marginTop: moderateScale(4),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(12),
    marginBottom: moderateScale(12),
  },
  listContent: {
    paddingVertical: moderateScale(12),
  },

  // Product Card Styles
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'grey',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    elevation: 3,
  },
  productImageContainer: {
    width: '100%',
    height: scale(140),
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  wishlistButton: {
    position: 'absolute',
    top: moderateScale(3),
    right: moderateScale(3),
    // backgroundColor: 'rgba(0,0,0,0.3)',
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingContainer: {
    position: 'absolute',
    bottom: moderateScale(8),
    left: moderateScale(8),
    backgroundColor: 'rgba(141, 141, 141, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(12),
  },
  ratingText: {
    color: '#fff',
    fontSize: normalizeFont(11),
    marginLeft: moderateScale(4),
    fontWeight: '600',
  },
  productInfo: {
    padding: moderateScale(12),
  },
  productHeader: {
    marginBottom: moderateScale(4),
  },
  productName: {
    fontSize: normalizeFont(14),
    fontWeight: '600',
    color: '#333',
    lineHeight: moderateScale(18),
  },
  productVendor: {
    fontSize: normalizeFont(12),
    color: '#666',
    marginBottom: moderateScale(6),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  locationIcon: {
    width: moderateScale(14),
    height: moderateScale(18),
    marginRight: moderateScale(4),
  },
  locationText: {
    fontSize: normalizeFont(11),
    color: '#444',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: normalizeFont(16),
    fontWeight: '700',
    color: '#FF9800',
  },
  addToCartButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(6),
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  addToCartText: {
    color: '#fff',
    fontSize: normalizeFont(12),
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 1)',
    borderRadius: moderateScale(6),
    overflow: 'hidden',
  },
  quantityButton: {
    width: scale(28),
    height: scale(28),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  quantityValueContainer: {
    minWidth: scale(32),
    height: scale(28),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(76, 175, 80, 1)',
  },
  quantityText: {
    fontSize: normalizeFont(14),
    color: 'rgba(76, 175, 80, 1)',
    fontWeight: '700',
  },

  // Quantity Modal Styles
  quantityModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  quantityModalContent: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    width: '100%',
    maxWidth: moderateScale(300),
  },
  quantityModalTitle: {
    fontSize: normalizeFont(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(20),
    textAlign: 'center',
  },
  quantityEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(20),
  },
  quantityModalButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  quantityModalInput: {
    flex: 1,
    marginHorizontal: moderateScale(10),
    height: scale(40),
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: moderateScale(6),
    textAlign: 'center',
    fontSize: normalizeFont(16),
    fontWeight: '600',
  },
  quantityModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(10),
  },
  quantityModalActionButton: {
    flex: 1,
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  applyButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: normalizeFont(14),
    fontWeight: '600',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: normalizeFont(14),
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: moderateScale(100),
  },
  emptySubtitle: {
    fontSize: normalizeFont(14),
    color: '#999',
    marginTop: moderateScale(8),
    textAlign: 'center',
    paddingHorizontal: moderateScale(32),
  },

  // Filter Popup Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,

  },
  filterPopup: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '50%',
    backgroundColor: '#fff',
    elevation: 10,
    height:'92%',
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(5),
    borderColor: 'yellow',
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderTopLeftRadius:moderateScale(20),
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
    fontSize: normalizeFont(16),
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
  filterOptionText: {
    fontSize: normalizeFont(14),
    fontWeight: '500',
    color: '#333',
  },
  filterOption2: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  filterOptionText2: {
    fontSize: normalizeFont(14),
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
  sliderContainer: {
    paddingVertical: moderateScale(8),
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(10),
  },
  sliderLabel: {
    fontSize: normalizeFont(14),
    fontWeight: '600',
    color: '#333',
  },
  sliderBar: {
    height: moderateScale(30),
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    height: moderateScale(4),
    backgroundColor: '#4CAF50',
    borderRadius: moderateScale(2),
    top: moderateScale(13),
  },
  sliderThumb: {
    position: 'absolute',
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    backgroundColor: '#4CAF50',
    top: moderateScale(5),
    borderWidth: 2,
    borderColor: '#fff',
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
    fontSize: normalizeFont(14),
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
    fontSize: normalizeFont(14),
    fontWeight: '600',
  },
});

export default SearchPage;