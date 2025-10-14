
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE = "https://393rb0pp-5000.inc1.devtunnels.ms";

// ✅ Product Card with Wishlist & Cart functionality
const ProductCard = ({ 
  item, 
  isFavorite, 
  onToggleFavorite,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity 
}) => {
  const inCart = cartQuantity > 0;

  return (
    <View style={[cardStyles.container]}>
      <TouchableOpacity 
        style={cardStyles.card}
        activeOpacity={0.8}
      >
        <View style={[cardStyles.imageContainer, { height: cardStyles.imageHeight }]}>
          <Image 
            source={{
              uri: item.images && item.images.length > 0 
                ? item.images[0] 
                : "https://via.placeholder.com/150/FFA500/FFFFFF?text=No+Image",
            }} 
            style={cardStyles.productImage} 
          />
          
          {/* Wishlist Icon */}
          <TouchableOpacity
            style={cardStyles.favoriteButton}
            activeOpacity={0.7}
            onPress={() => onToggleFavorite(item)}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={25}
              color={isFavorite ? '#ff4444' : '#666'}
            />
          </TouchableOpacity>
          
          {/* Rating */}
          <View style={cardStyles.ratingContainer}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={cardStyles.ratingText}>
              {item.rating && item.rating > 0 ? item.rating.toFixed(1) : "0.0"}
            </Text>
          </View>

          {/* Status Badge */}
          <View style={[
            cardStyles.statusBadge,
            { 
              backgroundColor: item.status === "In Stock" ? "#4CAF50" : 
                              item.status === "Out of Stock" ? "#f44336" : "#ff9800" 
            }
          ]}>
            <Text style={cardStyles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={cardStyles.cardContent}>
          <Text style={cardStyles.productTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={cardStyles.productSubtitle} numberOfLines={1}>
            by {item.vendor?.name || "Unknown Vendor"}
          </Text>
          
          {/* Price and Unit in same line */}
          <View style={cardStyles.priceContainer}>
            <Text style={cardStyles.productPrice}>₹{item.price}</Text>
            <Text style={cardStyles.productUnit}>/{item.unit}</Text>
          </View>

          {/* Variety */}
          {item.variety && (
            <Text style={cardStyles.varietyText}>Variety: {item.variety}</Text>
          )}

          {/* Add to Cart / Quantity Control */}
          <View style={cardStyles.buttonContainer}>
            {!inCart ? (
              <TouchableOpacity
                style={[
                  cardStyles.addToCartButton,
                  item.status !== "In Stock" && cardStyles.disabledButton
                ]}
                activeOpacity={0.7}
                disabled={item.status !== "In Stock"}
                onPress={() => onAddToCart(item)}
              >
                <Text style={cardStyles.addToCartText}>
                  {item.status === "In Stock" ? "Add to Cart" : item.status}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={cardStyles.quantityContainer}>
                <TouchableOpacity
                  style={cardStyles.quantityButton}
                  onPress={() => onUpdateQuantity(item, -1)}
                >
                  <Ionicons name="remove" size={16} color="#fff" />
                </TouchableOpacity>
                <Text style={cardStyles.quantityText}>{cartQuantity}</Text>
                <TouchableOpacity
                  style={cardStyles.quantityButton}
                  onPress={() => onUpdateQuantity(item, 1)}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const ViewAllFruits = () => {
  const navigation = useNavigation();
  const [fruits, setFruits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState({});

  // Fetch Fruits
  const fetchFruits = async () => {
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
        `${API_BASE}/api/buyer/products/by-category?category=Fruits`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.success) {
        setFruits(response.data.data || []);
      } else {
        setError("No fruits found in your area");
      }
    } catch (err) {
      console.error("Error fetching fruits:", err);
      if (err.response?.status === 401) {
        setError("Please login to view fruits");
      } else if (err.code === "ECONNABORTED") {
        setError("Request timeout. Please try again.");
      } else if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Failed to load fruits. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch Wishlist
  const fetchWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${API_BASE}/api/buyer/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const wishlistItems = response.data.data?.items || [];
        const favoriteIds = new Set(
          wishlistItems.map(item => item.productId || item._id)
        );
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  // Fetch Cart
  const fetchCart = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${API_BASE}/api/buyer/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const items = response.data.data?.items || [];
        const cartMap = {};
        items.forEach(item => {
          const productId = item.productId || item._id;
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
    fetchFruits();
    fetchWishlist();
    fetchCart();
  }, []);

  // Add to Wishlist
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
        image: product.images?.[0] || '',
        price: product.price,
        category: product.category || 'Fruits',
        variety: product.variety || 'Standard',
        unit: product.unit || 'kg'
      };

      const response = await axios.post(
        `${API_BASE}/api/buyer/wishlist/add`,
        wishlistData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Update local state immediately
        setFavorites(prev => new Set(prev).add(productId));
        Alert.alert('Success', 'Added to wishlist!');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      if (error.response?.status === 400) {
        // Already in wishlist
        const productId = product._id || product.id;
        setFavorites(prev => new Set(prev).add(productId));
        Alert.alert('Info', 'Already in wishlist');
      } else {
        Alert.alert('Error', 'Failed to add to wishlist');
      }
    }
  };

  // Remove from Wishlist
  const removeFromWishlist = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const productId = product._id || product.id;

      const response = await axios.delete(
        `${API_BASE}/api/buyer/wishlist/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        // Update local state immediately
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        Alert.alert('Removed', 'Removed from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      Alert.alert('Error', 'Failed to remove from wishlist');
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (product) => {
    const productId = product._id || product.id;
    
    if (favorites.has(productId)) {
      await removeFromWishlist(product);
    } else {
      await addToWishlist(product);
    }
  };

  // Add to Cart
  const handleAddToCart = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to cart');
        return;
      }

      const productId = product._id || product.id;

      const cartData = {
        productId: productId,
        name: product.name,
        image: product.images?.[0] || '',
        price: product.price,
        quantity: 1,
        category: product.category || 'Fruits',
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

      if (response.data.success) {
        // Update local state immediately
        setCartItems(prev => ({
          ...prev,
          [productId]: {
            quantity: 1,
            cartItemId: response.data.data?._id || productId
          }
        }));
        Alert.alert('Success', 'Added to cart!');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (error.response?.status === 400) {
        // Already in cart, refresh to get current quantity
        await fetchCart();
        Alert.alert('Info', 'Product is already in cart');
      } else {
        Alert.alert('Error', 'Failed to add to cart');
      }
    }
  };

  // Update Cart Quantity
  const handleUpdateQuantity = async (product, change) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const productId = product._id || product.id;
      const currentItem = cartItems[productId];
      if (!currentItem) return;

      const newQuantity = currentItem.quantity + change;

      if (newQuantity < 1) {
        // Remove from cart
        const response = await axios.delete(
          `${API_BASE}/api/buyer/cart/${currentItem.cartItemId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          setCartItems(prev => {
            const next = { ...prev };
            delete next[productId];
            return next;
          });
          Alert.alert('Removed', 'Item removed from cart');
        }
      } else {
        // Update quantity optimistically
        setCartItems(prev => ({
          ...prev,
          [productId]: {
            ...currentItem,
            quantity: newQuantity
          }
        }));

        // Update on server
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

        if (!response.data.success) {
          // Revert on failure
          setCartItems(prev => ({
            ...prev,
            [productId]: currentItem
          }));
          Alert.alert('Error', 'Failed to update quantity');
        }
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      // Refresh cart to get accurate data
      await fetchCart();
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchFruits();
    fetchWishlist();
    fetchCart();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
          <Image
            source={require("../assets/via-farm-img/icons/groupArrow.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Fruits</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA500" />
          <Text style={styles.loadingText}>Fetching fresh fruits...</Text>
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

      {/* Success - Fruits List */}
      {!loading && !error && (
        <FlatList
          data={fruits}
          keyExtractor={(item) => item._id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
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
              />
            );
          }}
          columnWrapperStyle={{ justifyContent: "space-between" }}
        />
      )}
    </SafeAreaView>
  );
};


export default ViewAllFruits;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 10,
    backgroundColor: '#fff',
  },
  backButtonContainer: {
    padding: 5,
  },
  riceContainer:{
   flex:1,
   gap:5,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  loadingContainer: {
    alignItems: "center",
    padding: 20,
    flex: 1,
    justifyContent: 'center',
    alignContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: "#777",
  },
  errorContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffebee",
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 20,
  },
  errorText: {
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 15,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: "#1976d2",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});

// ✅ Card Styles - Exact same as your design
const cardStyles = StyleSheet.create({
  container: {
    width: Dimensions.get("window").width / 2 - 25,
    marginLeft: 5,
    marginTop: 10,
    marginBottom: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(108, 59, 28, 1)',
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  imageHeight: 120,
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    elevation: 2,
  },
  ratingContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  ratingText: {
    color: '#fff',
    fontSize: 11,
    marginLeft: 2,
    fontWeight: '500',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  cardContent: {
    padding: 8,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    height: 22,
  },
  productSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
    height: 20,
  },
  // Price and Unit in same line
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  productUnit: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  varietyText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  buttonContainer: {
    minHeight: 36,
    justifyContent: 'center',
  },
  addToCartButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(76, 175, 80, 1)',
    borderRadius: 6,
    paddingHorizontal: 4,
    height: 36,
  },
  quantityButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  quantityText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  quantityCount: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginHorizontal: 6,
  },
});