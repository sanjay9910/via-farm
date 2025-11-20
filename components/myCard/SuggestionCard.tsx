// SuggestionCard.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  PixelRatio,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ProductCard from '../../components/common/ProductCard';

const API_BASE = 'https://viafarm-1.onrender.com';
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

const SuggestionCard = ({ vendorId = '68d63155abec554d6931b766' }) => {
  const navigation = useNavigation();

  const [favorites, setFavorites] = useState(new Set());
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState({});

  useEffect(() => {
    fetchProducts();
    fetchWishlist();
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  // Fetch vendor products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('userToken');

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await axios.get(
        `${API_BASE}/api/buyer/vendor/${vendorId}/products`,
        { headers, timeout: 10000 }
      );

      if (response.data && response.data.success && response.data.products) {
        const prodArr = Array.isArray(response.data.products)
          ? response.data.products
          : Object.values(response.data.products || {});
        setProducts(prodArr);
      } else {
        setProducts([]);
        setError('No products found');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]);
      setError(err?.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch cart items
  const fetchCart = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setCartItems({});
        return;
      }

      const response = await axios.get(`${API_BASE}/api/buyer/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.success) {
        const items = (response.data.data && response.data.data.items) || [];
        const cartMap = {};
        items.forEach((item) => {
          const pid = item.productId || item.id;
          cartMap[pid] = {
            quantity: item.quantity || 1,
            cartItemId: item._id || item.id,
            raw: item,
          };
        });
        setCartItems(cartMap);
      } else {
        setCartItems({});
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      setCartItems({});
    }
  };

  // Fetch wishlist
  const fetchWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setFavorites(new Set());
        return;
      }

      const response = await axios.get(`${API_BASE}/api/buyer/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.success) {
        const wishlistItems = (response.data.data && response.data.data.items) || [];
        const favSet = new Set(wishlistItems.map((it) => String(it.productId || it.id)));
        setFavorites(favSet);
      } else {
        setFavorites(new Set());
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    }
  };

  // Add to cart
  const addToCart = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to cart');
        return false;
      }

      const productId = String(product.id);

      const cartData = {
        productId,
        name: product.name || product.title || '',
        image: product.imageUrl || product.image || null,
        price: product.price || 0,
        quantity: 1,
        category: 'General',
        variety: product.variety || 'Standard',
        unit: product.unit || 'piece',
      };

      const response = await axios.post(`${API_BASE}${CART_ADD_ENDPOINT}`, cartData, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      if (response.data && response.data.success) {
        Alert.alert('Success', 'Product added to cart!');
        await fetchCart();
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to add to cart');
      }
    } catch (err) {
      console.error('❌ Error adding to cart:', err);
      if (err.response?.status === 400) {
        const msg = err.response?.data?.message || 'Product is already in your cart';
        Alert.alert('Info', msg);
        await fetchCart();
      } else if (err.response?.status === 401) {
        Alert.alert('Login Required', 'Please login to add items to cart');
      } else {
        Alert.alert('Error', err.response?.data?.message || 'Failed to add to cart');
      }
      return false;
    }
  };

  // Wishlist handlers
  const addToWishlist = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to wishlist');
        return false;
      }

      const payload = {
        productId: product.id,
        name: product.name || product.title || '',
        image: product.imageUrl || product.image || null,
        price: product.price || 0,
        category: 'General',
        variety: product.variety || 'Standard',
        unit: product.unit || 'piece',
      };

      const response = await axios.post(`${API_BASE}${WISHLIST_ADD_ENDPOINT}`, payload, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      if (response.data && response.data.success) {
        Alert.alert('Success', 'Product added to wishlist!');
        setFavorites((prev) => {
          const n = new Set(prev);
          n.add(String(product.id));
          return n;
        });
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to add to wishlist');
      }
    } catch (err) {
      console.error('❌ Error adding to wishlist:', err);
      if (err.response?.status === 400) {
        Alert.alert('Info', err.response?.data?.message || 'Product already in wishlist');
        setFavorites((prev) => {
          const n = new Set(prev);
          n.add(String(product.id));
          return n;
        });
      } else if (err.response?.status === 401) {
        Alert.alert('Login Required', 'Please login to add items to wishlist');
      } else {
        Alert.alert('Error', err.response?.data?.message || 'Failed to add to wishlist');
      }
      return false;
    }
  };

  const removeFromWishlist = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to manage wishlist');
        return false;
      }

      const response = await axios.delete(`${API_BASE}${WISHLIST_REMOVE_ENDPOINT}/${String(product.id)}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      if (response.data && response.data.success) {
        setFavorites((prev) => {
          const n = new Set(prev);
          n.delete(String(product.id));
          return n;
        });
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to remove from wishlist');
      }
    } catch (err) {
      console.error('❌ Error removing from wishlist:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to remove from wishlist');
      return false;
    }
  };

  const handleFavoritePress = async (productId) => {
    try {
      const product = products.find((p) => String(p.id) === String(productId));
      if (!product) return;

      if (favorites.has(String(productId))) {
        const ok = await removeFromWishlist(product);
        if (ok) Alert.alert('Removed', 'Product removed from wishlist');
      } else {
        await addToWishlist(product);
      }
    } catch (err) {
      console.error('Error in favorite press:', err);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      const product = products.find((p) => String(p.id) === String(productId));
      if (!product) return;

      if (cartItems[String(productId)]) {
        Alert.alert('Already in Cart', 'This product is already in your cart');
        return;
      }

      await addToCart(product);
    } catch (err) {
      console.error('Error in add to cart:', err);
    }
  };

  const handleQuantityChange = async () => {
    Alert.alert('Info', 'Please manage quantities in your cart');
  };

  // On product press -> navigate to ViewProduct
  const onProductPress = (product) => {
    try {
      navigation.navigate('ViewProduct', { productId: String(product.id), product });
    } catch (err) {
      console.error('Navigation error to ViewProduct:', err);
      Alert.alert('Error', 'Unable to open product details.');
    }
  };

  const renderSuggestionCard = useCallback(
    ({ item }) => {
      const inCart = !!cartItems[String(item.id)];
      const quantity = cartItems[String(item.id)] ? cartItems[String(item.id)].quantity : 0;

      return (
        <View style={styles.itemWrapper}>
          <ProductCard
            id={String(item.id)}
            title={item.name || item.title}
            subtitle={item.variety || ''}
            price={item.price || 0}
            rating={item.rating || 0}
            image={item.imageUrl || item.image || null}
            isFavorite={favorites.has(String(item.id))}
            onPress={() => onProductPress(item)}
            onFavoritePress={() => handleFavoritePress(item.id)}
            onAddToCart={() => handleAddToCart(item.id)}
            onQuantityChange={() => handleQuantityChange(item.id, 1)}
            inCart={inCart}
            cartQuantity={quantity}
            width={Math.round(moderateScale(140))}
            showRating
            showFavorite
            imageHeight={Math.round(verticalScale(120))}
          />
        </View>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [favorites, products, cartItems]
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>You May Also Like</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>You May Also Like</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!products || products.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>You May Also Like</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No products available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You May Also Like</Text>

      <FlatList
        data={products}
        renderItem={renderSuggestionCard}
        keyExtractor={(item) => String(item.id)}
        horizontal
        contentContainerStyle={styles.listContainer}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ width: Math.round(moderateScale(12)) }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: Math.round(verticalScale(8)),
    paddingHorizontal: 0, // <-- left/right 0
  },
  title: {
    fontSize: normalizeFont(15),
    fontWeight: '600',
    color: '#333',
    marginBottom: Math.round(verticalScale(8)),
    paddingHorizontal: 0, // <-- left/right 0
    alignSelf: 'flex-start',
    marginLeft: Math.round(moderateScale(10)), // small indent for title readability; set to 0 if you want exact edge
  },
  listContainer: {
    paddingHorizontal: 0, // <-- ensure flatlist has no outer padding
  },
  itemWrapper: {
    marginHorizontal: 0, // ensure card wrapper has no extra margins
  },
  loadingContainer: {
    height: Math.round(verticalScale(180)),
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    height: Math.round(verticalScale(180)),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Math.round(moderateScale(20)),
  },
  errorText: {
    fontSize: normalizeFont(14),
    color: '#999',
    textAlign: 'center',
  },
});

export default SuggestionCard;
