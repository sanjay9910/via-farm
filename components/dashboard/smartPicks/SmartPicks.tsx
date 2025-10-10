// SmartPicks.js
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ProductCard from '../../../components/common/ProductCard';

const API_BASE = 'https://393rb0pp-5000.inc1.devtunnels.ms';
const ENDPOINT = '/api/buyer/smart-picks';
const WISHLIST_ADD_ENDPOINT = '/api/buyer/wishlist/add';
const WISHLIST_REMOVE_ENDPOINT = '/api/buyer/wishlist';
const CART_ADD_ENDPOINT = '/api/buyer/cart/add';
const CART_QUANTITY_ENDPOINT = '/api/buyer/cart';

const SmartPicks = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [showDropdown, setShowDropdown] = useState(false);
  const [cartItems, setCartItems] = useState({}); // Store cart quantities by productId

  const animation = useRef(new Animated.Value(0)).current;

  const categories = ['All', 'Fruits', 'Vegetables', 'Plants', 'Seeds', 'Handicrafts'];

  // Filter products based on selected category
  const filterProductsByCategory = useCallback((productsList, category) => {
    if (category === 'All') {
      return productsList;
    }
    return productsList.filter(product => 
      product.category?.toLowerCase() === category.toLowerCase() ||
      product.raw?.category?.toLowerCase() === category.toLowerCase() ||
      product.title?.toLowerCase().includes(category.toLowerCase())
    );
  }, []);

  // Update filtered products when category or products change
  useEffect(() => {
    const filtered = filterProductsByCategory(products, selectedCategory);
    setFilteredProducts(filtered);
  }, [products, selectedCategory, filterProductsByCategory]);

  const mapApiItemToProduct = useCallback((item) => {

  
    return {
      id: item.id || item._id || String(Math.random()),
      title: item.name || item.title || 'Product',
      subtitle: item.vendor?.name || item.variety || '',
      price: item.price ?? 0,
      rating: item.rating ?? 0,
      ratingCount: item.ratingCount ?? 0,
      image: item.image || null,
      isFavorite: false,
      raw: item, // Keep original data
      productId: item._id || item.id || item.productId,
      category: item.category || 'General',
    };
  }, []);

  const fetchProducts = async (isRefresh = false) => {
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
        console.log('📦 Loaded products:', mapped.length);
      } else {
        if (res?.data?.data) {
          try {
            const mapped = Object.values(res.data.data).map(mapApiItemToProduct);
            setProducts(mapped);
          } catch (e) {
            setProducts([]);
          }
        } else {
          setProducts([]);
        }
      }
    } catch (error) {
      console.error('Error fetching smart picks:', error);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch Cart Items
  const fetchCart = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${API_BASE}/api/buyer/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const items = response.data.data?.items || [];
        const cartMap = {};
        items.forEach(item => {
          const productId = item.productId || item.id;
          cartMap[productId] = {
            quantity: item.quantity || 1,
            cartItemId: item._id || item.id
          };
        });
        setCartItems(cartMap);
        // Removed console log to reduce clutter
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  // Fetch wishlist to sync favorites
  const fetchWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${API_BASE}/api/buyer/wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const wishlistItems = response.data.data?.items || [];
        const favoriteIds = new Set(wishlistItems.map(item => item.productId || item.id));
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchWishlist();
    fetchCart();
  }, []);

  // Listen for cart updates (removed auto-refresh to reduce API calls)
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetchCart();
  //     fetchWishlist();
  //   }, 3000);

  //   return () => clearInterval(interval);
  // }, []);

  // Dropdown animation
  const toggleDropdown = () => {
    const toValue = showDropdown ? 0 : 1;
    setShowDropdown(!showDropdown);
    
    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const dropdownHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240],
  });

  const borderWidth = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Add to Cart Function
  const addToCart = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to cart');
        return false;
      }

      // Get the correct productId from raw data
      const productId = product.raw?.productId || product.raw?._id || product.productId || product.id;

      const cartData = {
        productId: productId,
        name: product.title || product.raw?.name,
        image: product.image || product.raw?.image,
        price: product.price || product.raw?.price,
        quantity: 1,
        category: product.category || product.raw?.category || 'General',
        variety: product.subtitle || product.raw?.variety || 'Standard',
        unit: 'piece'
      };


      const response = await axios.post(
        `${API_BASE}${CART_ADD_ENDPOINT}`,
        cartData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Product added to cart!');
        // Update cart items immediately
        await fetchCart();
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      console.error('❌ Error response:', error.response?.data);
      
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message || 'Product is already in your cart';
        Alert.alert('Info', errorMsg);
        await fetchCart();
      } else if (error.response?.status === 401) {
        Alert.alert('Login Required', 'Please login to add items to cart');
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to add to cart');
      }
      return false;
    }
  };

  // Update Cart Quantity
  const updateQuantity = async (itemId, newQty) => {
  if (!authToken) {
    Alert.alert('Error', 'Token not found.');
    return;
  }
  
  if (newQty < 1) return removeItem(itemId);

  const prevItem = cartItems.find(i => i.id === itemId);

  // Optimistic UI
  setCartItems(prev =>
    prev.map(i => (i.id === itemId ? { ...i, quantity: newQty } : i))
  );

  try {
    // Correct API endpoint with itemId in URL
    const res = await fetch(`${BASE_URL}/api/buyer/cart/${itemId}/quantity`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${authToken}` 
      },
      body: JSON.stringify({ quantity: newQty }), // Only send quantity in body
    });
    
    const json = await res.json();
    
    if (!res.ok || !json.success) {
      Alert.alert('Update Failed', json.message || 'Could not update quantity.');
      // Revert optimistic update
      setCartItems(prev =>
        prev.map(i => (i.id === itemId ? prevItem : i))
      );
    } else {
      // Refresh cart data to get updated prices
      fetchCartItems(authToken);
    }
  } catch (e) {
    console.error('Update Error:', e);
    Alert.alert('Error', 'Network error.');
    // Revert optimistic update
    setCartItems(prev =>
      prev.map(i => (i.id === itemId ? prevItem : i))
    );
  }
};

  // Add to Wishlist Function
  const addToWishlist = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to wishlist');
        return false;
      }

      const wishlistData = {
        productId: product.productId || product.id,
        name: product.title,
        image: product.image,
        price: product.price,
        category: product.category,
        variety: product.subtitle || 'Standard',
        unit: 'piece'
      };

      const response = await axios.post(
        `${API_BASE}${WISHLIST_ADD_ENDPOINT}`,
        wishlistData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Product added to wishlist!');
        setFavorites(prev => new Set(prev).add(product.id));
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to add to wishlist');
      }
    } catch (error) {
      console.error('❌ Error adding to wishlist:', error);
      
      if (error.response?.status === 400) {
        Alert.alert('Info', 'Product is already in your wishlist');
        setFavorites(prev => new Set(prev).add(product.id));
      } else if (error.response?.status === 401) {
        Alert.alert('Login Required', 'Please login to add items to wishlist');
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to add to wishlist');
      }
      return false;
    }
  };

  // Remove from Wishlist Function
  const removeFromWishlist = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Login Required', 'Please login to manage wishlist');
        return false;
      }

      const productId = product.productId || product.id;

      const response = await axios.delete(
        `${API_BASE}${WISHLIST_REMOVE_ENDPOINT}/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(product.id);
          return next;
        });
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to remove from wishlist');
      }
    } catch (error) {
      console.error('❌ Error removing from wishlist:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to remove from wishlist');
      return false;
    }
  };

  const handleCardPress = (productId) => {
    console.log('Product pressed:', productId);
  };

  const handleFavoritePress = async (productId) => {
    try {
      const product = filteredProducts.find(p => p.id === productId);
      if (!product) return;

      if (favorites.has(productId)) {
        const success = await removeFromWishlist(product);
        if (success) {
          Alert.alert('Removed', 'Product removed from wishlist');
        }
      } else {
        await addToWishlist(product);
      }
    } catch (error) {
      console.error('Error in favorite press:', error);
    }
  };

  // Handle Add to Cart Button Press from ProductCard
  const handleAddToCart = async (productId) => {
    try {
      const product = filteredProducts.find(p => p.id === productId);
      if (!product) return;

      const productIdKey = product.productId || product.id;
      
      // Check if already in cart
      if (cartItems[productIdKey]) {
        // Already in cart, do nothing or show message
        Alert.alert('Already in Cart', 'This product is already in your cart');
        return;
      }

      await addToCart(product);
    } catch (error) {
      console.error('Error in add to cart:', error);
    }
  };

  // Handle Quantity Change from ProductCard
  const handleQuantityChange = async (productId, change) => {
    try {
      const product = filteredProducts.find(p => p.id === productId);
      if (!product) return;

      const productIdKey = product.productId || product.id;
      const currentQuantity = cartItems[productIdKey]?.quantity || 0;
      const newQuantity = currentQuantity + change;

      if (newQuantity < 0) return;

      await updateCartQuantity(product, newQuantity);
    } catch (error) {
      console.error('Error in quantity change:', error);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    toggleDropdown();
    console.log('🎯 Selected category:', category);
  };

  const renderProductCard = useCallback(({ item }) => {
    const productIdKey = item.productId || item.id;
    const cartItem = cartItems[productIdKey];
    const inCart = !!cartItem;
    const quantity = cartItem?.quantity || 0;

    return (
      <View style={styles.cardWrapper}>
        <ProductCard
          id={item.id}
          title={item.title}
          subtitle={item.subtitle}
          price={item.price}
          rating={item.rating}
          image={item.image}
          isFavorite={favorites.has(item.id)}
          onPress={handleCardPress}
          onFavoritePress={handleFavoritePress}
          onAddToCart={handleAddToCart}
          onQuantityChange={handleQuantityChange}
          inCart={inCart}
          cartQuantity={quantity}
          width={135}
          showRating
          showFavorite
          imageHeight={120}
        />
      </View>
    );
  }, [favorites, filteredProducts, cartItems]);

  const getItemLayout = useCallback((data, index) => ({
    length: 138,
    offset: 138 * index,
    index,
  }), []);

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
        
        {/* Dropdown Container */}
        <View style={styles.filterWrapper}>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={toggleDropdown}
          >
            <View style={styles.filterExpand}>
              <Text style={styles.filterText}>{selectedCategory}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </View>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.dropdown,
              {
                height: dropdownHeight,
                borderWidth: borderWidth,
              },
            ]}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.dropdownItem,
                  selectedCategory === category && styles.selectedDropdownItem
                ]}
                onPress={() => handleCategorySelect(category)}
              >
                <Text style={[
                  styles.dropdownText,
                  selectedCategory === category && styles.selectedDropdownText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProductCard}
        keyExtractor={(item) => item.id}
        horizontal
        contentContainerStyle={styles.listContainer}
        showsHorizontalScrollIndicator={false}
        style={styles.flatListStyle}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => {
              fetchProducts(true);
              fetchCart();
            }} 
          />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {selectedCategory === 'All' 
                  ? 'No products available right now.' 
                  : `No ${selectedCategory} products available.`
                }
              </Text>
              <TouchableOpacity 
                style={styles.showAllButton}
                onPress={() => handleCategorySelect('All')}
              >
                <Text style={styles.showAllButtonText}>Show All Products</Text>
              </TouchableOpacity>
            </View>
          )
        }
        removeClippedSubviews={true}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        getItemLayout={getItemLayout}
        decelerationRate="fast"
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
    paddingVertical: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingTop: 10,
    paddingHorizontal: 13,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  filterWrapper: {
    position: 'relative',
    minWidth: 120,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(66, 66, 66, 0.7)',
  },
  filterExpand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'space-around',
  },
  filterText: {
    color: 'rgba(66, 66, 66, 0.7)',
    textAlign: 'center',
    fontSize: 13,
  },
  dropdown: {
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderColor: 'rgba(66, 66, 66, 0.7)',
    borderRadius: 6,
    position: 'absolute',
    top: 35,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(66, 66, 66, 0.7)',
  },
  selectedDropdownItem: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  dropdownText: {
    color: 'rgba(66, 66, 66, 0.7)',
    fontSize: 13,
  },
  selectedDropdownText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 10,
  },
  flatListStyle: {
    paddingBottom: 10,
  },
  cardWrapper: {
    marginHorizontal: 4,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  showAllButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  showAllButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SmartPicks;