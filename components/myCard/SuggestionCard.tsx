import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;
const normalizeFont = (size) => {
  const newSize = moderateScale(size);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
};

const SuggestionCard = ({ productId: propProductId }) => {
  const navigation = useNavigation();
  const route = useRoute();

  const productId = propProductId || route?.params?.productId;

  const [favorites, setFavorites] = useState(new Set());
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState({});

  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      if (!productId) {
        setLoading(false);
        setProducts([]);
        return;
      }

      setLoading(true);
      setError(null);
      await Promise.all([
        fetchProductAndRecommendations(productId, mounted),
        fetchWishlist(),
        fetchCart(),
      ]);
      if (mounted) setLoading(false);
    };

    loadAll();
    return () => {
      mounted = false;
    };
  }, [productId]);

  const fetchProductAndRecommendations = async (pid, mounted = true) => {
    try {
      if (!pid) return;

      setError(null);
      const token = await AsyncStorage.getItem('userToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const url = `${API_BASE}/api/buyer/products/${pid}`;
      const resp = await axios.get(url, { headers, timeout: 10000 });

      const recommended =
        resp?.data?.data?.recommendedProducts ||
        resp?.data?.recommendedProducts ||
        resp?.data?.products ||
        resp?.data?.data?.product?.recommendedProducts ||
        [];

      const normalized = Array.isArray(recommended)
        ? recommended.map((p) => normalizeProductObject(p)).filter(Boolean)
        : [];

      if (mounted) {
        if (normalized && normalized.length > 0) {
          setProducts(normalized);
        } else {
          const single = resp?.data?.data?.product || resp?.data?.product;
          if (single && typeof single === 'object') {
            const fallbackArr = [normalizeProductObject(single)].filter(
              Boolean
            );
            setProducts(fallbackArr);
          } else {
            setProducts([]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching product/recommended:', err);
      if (mounted) {
        setProducts([]);
        setError(
          err?.response?.data?.message || 'Failed to load suggestions'
        );
      }
    }
  };

  const normalizeProductObject = (p) => {
    if (!p) return null;
    const id = String(p._id ?? p.id ?? p.productId ?? '');
    if (!id) return null;

    const images = p.images ?? p.imageUrls ?? p.photos ?? [];
    const image =
      Array.isArray(images) && images.length > 0
        ? images[0]
        : p.imageUrl ?? p.image ?? null;

    const category =
      typeof p.category === 'object'
        ? p.category.name ?? p.category
        : p.category ?? 'General';

    const vendorName =
      p.vendor?.name ||
      p.vendorName ||
      '';

    return {
      id,
      name: p.name ?? p.title ?? '',
      price: typeof p.price === 'number' ? p.price : Number(p.price) || 0,
      quantity: p.quantity ?? 1,
      unit: p.unit ?? 'pc',
      variety: p.variety ?? '',
      image,
      rating: p.rating ?? 0,
      category,
      vendorName, 
      raw: p,
    };
  };

  const fetchCart = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setCartItems({});
        return;
      }

      const response = await axios.get(`${API_BASE}/api/buyer/cart`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      if (response?.data?.success) {
        const items = (response.data.data && response.data.data.items) || [];
        const cartMap = {};
        items.forEach((item) => {
          const pid = String(item.productId ?? item.product?._id ?? item.id);
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

  // Fetch wishlist (set of product ids)
  const fetchWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setFavorites(new Set());
        return;
      }

      const response = await axios.get(`${API_BASE}/api/buyer/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      if (response?.data?.success) {
        const wishlistItems =
          (response.data.data && response.data.data.items) || [];
        const favSet = new Set(
          wishlistItems.map((it) =>
            String(it.productId ?? it.product?._id ?? it._id ?? it.id)
          )
        );
        setFavorites(favSet);
      } else {
        setFavorites(new Set());
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setFavorites(new Set());
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

      const productId = String(product.id ?? product._id ?? '');

      const cartData = {
        productId,
        name: product.name || product.title || '',
        image: product.image || null,
        price: product.price || 0,
        quantity: 1,
        category: product.category || 'General',
        variety: product.variety || 'Standard',
        unit: product.unit || 'piece',
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

      if (response?.data?.success) {
        Alert.alert('Success', 'Product added to cart!');
        await fetchCart();
        return true;
      } else {
        throw new Error(
          response?.data?.message || 'Failed to add to cart'
        );
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      if (err.response?.status === 400) {
        Alert.alert(
          'Info',
          err.response?.data?.message || 'Product is already in your cart'
        );
        await fetchCart();
      } else if (err.response?.status === 401) {
        Alert.alert(
          'Login Required',
          'Please login to add items to cart'
        );
      } else {
        Alert.alert(
          'Error',
          err.response?.data?.message || 'Failed to add to cart'
        );
      }
      return false;
    }
  };

  // Wishlist add
  const addToWishlist = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert(
          'Login Required',
          'Please login to add items to wishlist'
        );
        return false;
      }

      const payload = {
        productId: String(product.id ?? product._id ?? ''),
        name: product.name || '',
        image: product.image || null,
        price: product.price || 0,
        category: product.category || 'General',
        variety: product.variety || 'Standard',
        unit: product.unit || 'piece',
      };

      const response = await axios.post(
        `${API_BASE}${WISHLIST_ADD_ENDPOINT}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );

      if (response?.data?.success) {
        setFavorites((prev) => {
          const n = new Set(prev);
          n.add(String(payload.productId));
          return n;
        });
        return true;
      } else {
        throw new Error(
          response?.data?.message || 'Failed to add to wishlist'
        );
      }
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      if (err.response?.status === 400) {
        Alert.alert(
          'Info',
          err.response?.data?.message || 'Product already in wishlist'
        );
        setFavorites((prev) => {
          const n = new Set(prev);
          n.add(String(product.id ?? product._id ?? ''));
          return n;
        });
      } else if (err.response?.status === 401) {
        Alert.alert(
          'Login Required',
          'Please login to add items to wishlist'
        );
      } else {
        Alert.alert(
          'Error',
          err.response?.data?.message || 'Failed to add to wishlist'
        );
      }
      return false;
    }
  };

  // Wishlist remove
  const removeFromWishlist = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert(
          'Login Required',
          'Please login to manage wishlist'
        );
        return false;
      }

      const pid = String(product.id ?? product._id ?? '');
      const response = await axios.delete(
        `${API_BASE}${WISHLIST_REMOVE_ENDPOINT}/${pid}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      if (response?.data?.success) {
        setFavorites((prev) => {
          const n = new Set(prev);
          n.delete(pid);
          return n;
        });
        return true;
      } else {
        throw new Error(
          response?.data?.message || 'Failed to remove from wishlist'
        );
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to remove from wishlist'
      );
      return false;
    }
  };

  const handleFavoritePress = async (productId) => {
    try {
      const product = products.find(
        (p) => String(p.id) === String(productId)
      );
      if (!product) return;

      if (favorites.has(String(productId))) {
        const ok = await removeFromWishlist(product);
        if (ok) Alert.alert('Removed', 'Product removed from wishlist');
      } else {
        const ok = await addToWishlist(product);
        if (ok) Alert.alert('Added', 'Product added to wishlist');
      }
    } catch (err) {
      console.error('Error in favorite press:', err);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      const product = products.find(
        (p) => String(p.id) === String(productId)
      );
      if (!product) return;

      if (cartItems[String(productId)]) {
        Alert.alert(
          'Already in Cart',
          'This product is already in your cart'
        );
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

  const onProductPress = (product) => {
    try {
      navigation.navigate('ViewProduct', {
        productId: String(product.id),
        product,
      });
    } catch (err) {
      console.error('Navigation error to ViewProduct:', err);
      Alert.alert('Error', 'Unable to open product details.');
    }
  };

  const renderSuggestionCard = useCallback(
    ({ item }) => {
      if (!item) return null;
      const inCart = !!cartItems[String(item.id)];
      const quantity = cartItems[String(item.id)]
        ? cartItems[String(item.id)].quantity
        : 0;

      const subtitleParts = [];
      if (item.variety) subtitleParts.push(item.variety);
      if (item.vendorName) subtitleParts.push(item.vendorName);
      const subtitleText = subtitleParts.join(' • ');

      return (
        <View style={styles.itemWrapper}>
          <ProductCard
            id={String(item.id)}
            title={item.name}
            subtitle={subtitleText} 
            price={item.price}
            rating={item.rating}
            image={item.image}
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
    [favorites, products, cartItems]
  );

  const title = useMemo(() => 'You May Also Like', []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!products || products.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No products available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <FlatList
        data={products}
        renderItem={renderSuggestionCard}
        keyExtractor={(item) =>
          String(item?.id ?? item?._id ?? Math.random())
        }
        horizontal
        contentContainerStyle={styles.listContainer}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View style={{ width: Math.round(moderateScale(12)) }} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: Math.round(verticalScale(8)),
    paddingHorizontal: 0,
  },
  title: {
    fontSize: normalizeFont(15),
    fontWeight: '600',
    color: '#333',
    marginBottom: Math.round(verticalScale(8)),
    paddingHorizontal: 0,
    alignSelf: 'flex-start',
    marginLeft: Math.round(moderateScale(10)),
  },
  listContainer: {
    paddingHorizontal: 0,
  },
  itemWrapper: {
    marginHorizontal: 0,
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