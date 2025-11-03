import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import ProductCard from '../../components/common/ProductCard';

interface Product {
  id: string;
  name: string;
  variety: string;
  price: number;
  rating: number;
  unit: string;
  imageUrl: string;
  vendorId: string;
}

interface SuggestionCardProps {
  vendorId?: string; 
}

const API_BASE = 'https://viafarm-1.onrender.com';
const WISHLIST_ADD_ENDPOINT = '/api/buyer/wishlist/add';
const WISHLIST_REMOVE_ENDPOINT = '/api/buyer/wishlist';
const CART_ADD_ENDPOINT = '/api/buyer/cart/add';

const SuggestionCard: React.FC<SuggestionCardProps> = ({ 
  vendorId = '68d63155abec554d6931b766' 
}) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchProducts();
    fetchWishlist();
    fetchCart();
  }, [vendorId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('userToken');
      
      // Prepare headers
      const headers: any = {
        'Content-Type': 'application/json',
      };

      // Add token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.get(
        `${API_BASE}/api/buyer/vendor/${vendorId}/products`,
        { headers }
      );

      if (response.data.success && response.data.products) {
        setProducts(response.data.products);
      } else {
        setError('No products found');
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
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
        const cartMap: Record<string, any> = {};
        items.forEach((item: any) => {
          const productId = item.productId || item.id;
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
        const favoriteIds = new Set(wishlistItems.map((item: any) => item.productId || item.id));
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  // Add to Cart Function
  const addToCart = async (product: Product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to cart');
        return false;
      }

      const productId = product.id;

      const cartData = {
        productId: productId,
        name: product.name,
        image: product.imageUrl,
        price: product.price,
        quantity: 1,
        category: 'General',
        variety: product.variety || 'Standard',
        unit: product.unit || 'piece'
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
    } catch (error: any) {
      console.error('❌ Error adding to cart:', error);
      
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

  // Add to Wishlist Function
  const addToWishlist = async (product: Product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to wishlist');
        return false;
      }

      const wishlistData = {
        productId: product.id,
        name: product.name,
        image: product.imageUrl,
        price: product.price,
        category: 'General',
        variety: product.variety || 'Standard',
        unit: product.unit || 'piece'
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
    } catch (error: any) {
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
  const removeFromWishlist = async (product: Product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Login Required', 'Please login to manage wishlist');
        return false;
      }

      const productId = product.id;

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
    } catch (error: any) {
      console.error('❌ Error removing from wishlist:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to remove from wishlist');
      return false;
    }
  };

  const handleFavoritePress = async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId);
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
  const handleAddToCart = async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const productIdKey = product.id;
      
      // Check if already in cart
      if (cartItems[productIdKey]) {
        Alert.alert('Already in Cart', 'This product is already in your cart');
        return;
      }

      await addToCart(product);
    } catch (error) {
      console.error('Error in add to cart:', error);
    }
  };

  // Handle Quantity Change from ProductCard
  const handleQuantityChange = async (productId: string, change: number) => {
    // Not implemented for suggestion cards - user can manage in cart screen
    Alert.alert('Info', 'Please manage quantities in your cart');
  };

  const renderSuggestionCard = useCallback(({ item }: { item: Product }) => {
    const productIdKey = item.id;
    const cartItem = cartItems[productIdKey];
    const inCart = !!cartItem;
    const quantity = cartItem?.quantity || 0;

    return (
      <ProductCard
        id={item.id}
        title={item.name}
        subtitle={item.variety}
        price={item.price}
        rating={item.rating}
        image={item.imageUrl}
        isFavorite={favorites.has(item.id)}
        onPress={(id) => console.log('Product pressed:', id)}
        onFavoritePress={handleFavoritePress}
        onAddToCart={handleAddToCart}
        onQuantityChange={handleQuantityChange}
        inCart={inCart}
        cartQuantity={quantity}
        width={140}
        showRating={true}
        showFavorite={true}
        imageHeight={130}
      />
    );
  }, [favorites, products, cartItems]);

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

  if (products.length === 0) {
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
        keyExtractor={(item) => item.id}
        horizontal
        contentContainerStyle={styles.listContainer}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ width: 15 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  listContainer: {
    paddingHorizontal: 15,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default SuggestionCard;