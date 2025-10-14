import ViewVendors from '@/components/dashboard/vendorsNearYou/VendorsNearYou';
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
const CARD_WIDTH = Dimensions.get("window").width / 2 - 25;

// ✅ Product Card Component
const ProductCard = ({
  item,
  isFavorite,
  onToggleFavorite,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity
}) => {
  const inCart = cartQuantity > 0;
  const status = item.status || "In Stock";
  const isInStock = status === "In Stock";

  return (
    <View>
    <View style={cardStyles.container}>
      <View style={cardStyles.card}>
        <View style={[cardStyles.imageContainer, { height: cardStyles.imageHeight }]}>
          <Image
            source={{
              uri: item.image
                ? item.image
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
              {item.rating && item.rating > 0 ? item.rating.toFixed(1) : "4.5"}
            </Text>
          </View>

          {/* Status Badge */}
          <View style={[
            cardStyles.statusBadge,
            {
              backgroundColor: status === "In Stock" ? "#4CAF50" :
                status === "Out of Stock" ? "#f44336" : "#ff9800"
            }
          ]}>
            <Text style={cardStyles.statusText}>{status}</Text>
          </View>
        </View>

        <View style={cardStyles.cardContent}>
          <Text style={cardStyles.productTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={cardStyles.productSubtitle} numberOfLines={1}>
            by {item.vendorName || "Local Vendor"}
          </Text>

          <View style={cardStyles.priceContainer}>
            <Text style={cardStyles.productPrice}>₹{item.price || "100"}</Text>
            <Text style={cardStyles.productUnit}>/{item.unit || "kg"}</Text>
          </View>

          {item.variety && (
            <Text style={cardStyles.varietyText}>Variety: {item.variety}</Text>
          )}

          {/* Add to Cart / Quantity */}
          <View style={cardStyles.buttonContainer}>
            {!inCart ? (
              <TouchableOpacity
                style={[
                  cardStyles.addToCartButton,
                  !isInStock && cardStyles.disabledButton
                ]}
                activeOpacity={0.7}
                disabled={!isInStock}
                onPress={() => onAddToCart(item)}
              >
                <Text style={cardStyles.addToCartText}>
                  {isInStock ? "Add to Cart" : status}
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
      </View>
    </View>
    </View>
  );
};

// ✅ Main Component
const ViewAllLocalBest = () => {
  const navigation = useNavigation();
  const [localBestProducts, setLocalBestProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState({});

  const fetchLocalBest = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_BASE}/api/buyer/local-best?lat=19.0760&lng=72.8777&maxDistance=50000`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.success) {
        const formatted = response.data.data.map(item => ({
          ...item,
          id: item._id,
          price: item.price || 100,
          unit: item.unit || 'kg',
          category: item.category || 'Local Best',
          status: item.status || "In Stock",
          vendorName: item.vendor?.name || 'Local Farm'
        }));
        setLocalBestProducts(formatted);
      } else {
        setError("No local best products found");
      }
    } catch (e) {
      console.error("Local Best Fetch Error:", e);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const res = await axios.get(`${API_BASE}/api/buyer/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const ids = new Set(res.data.data?.items?.map(i => i.productId || i._id));
        setFavorites(ids);
      }
    } catch (err) {
      console.error("Wishlist Fetch Error:", err);
    }
  };

  const fetchCart = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const res = await axios.get(`${API_BASE}/api/buyer/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const map = {};
        res.data.data?.items?.forEach(i => {
          const pid = i.productId || i._id;
          map[pid] = { quantity: i.quantity || 1, cartItemId: i._id };
        });
        setCartItems(map);
      }
    } catch (err) {
      console.error("Cart Fetch Error:", err);
    }
  };

  useEffect(() => {
    fetchLocalBest();
    fetchWishlist();
    fetchCart();
  }, []);

const handleToggleFavorite = async (product) => {
  const id = product._id || product.id;
  const token = await AsyncStorage.getItem('userToken');
  if (!token) {
    Alert.alert('Login Required', 'Please login to manage wishlist');
    return;
  }

  try {
    if (favorites.has(id)) {
      // Remove from wishlist
      await axios.delete(`${API_BASE}/api/buyer/wishlist/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      Alert.alert('Removed', 'Removed from wishlist');
    } else {
      // Add to wishlist
      await axios.post(
        `${API_BASE}/api/buyer/wishlist/add`,
        {
          productId: id,
          name: product.name,
          image: product.image || 'https://via.placeholder.com/150',
          price: product.price || 100,
          category: product.category || 'Local Best',
          unit: product.unit || 'kg',
          variety: product.variety || 'Standard',
        },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }
      );
      setFavorites(prev => new Set(prev).add(id));
      Alert.alert('Added', 'Added to wishlist');
    }
  } catch (err) {
    console.error("Wishlist Error:", err.response?.data || err.message);
    Alert.alert('Error', err.response?.data?.message || 'Wishlist operation failed');
  }
};

const handleAddToCart = async (product) => {
  const token = await AsyncStorage.getItem('userToken');
  if (!token) {
    Alert.alert('Login Required', 'Please login to add items to cart');
    return;
  }

  const id = product._id || product.id;
  if (!id) {
    Alert.alert('Error', 'Product ID missing');
    return;
  }

  try {
    const res = await axios.post(
      `${API_BASE}/api/buyer/cart/add`,
      {
        productId: id,
        name: product.name,
        image: product.image || 'https://via.placeholder.com/150',
        price: product.price || 100,
        quantity: 1,
        category: product.category || 'Local Best',
        unit: product.unit || 'kg',
        variety: product.variety || 'Standard',
      },
      {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      }
    );

    if (res.data.success) {
      const cartItemId = res.data.data?._id || id;
      setCartItems(prev => ({
        ...prev,
        [id]: { quantity: 1, cartItemId },
      }));
      Alert.alert('Success', 'Added to cart!');
    } else {
      Alert.alert('Error', res.data.message || 'Failed to add to cart');
    }
  } catch (err) {
    console.error("Add Cart Error:", err.response?.data || err.message);
    Alert.alert('Error', err.response?.data?.message || 'Failed to add to cart');
  }
};

  const handleUpdateQuantity = async (product, change) => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) return;

    const id = product._id || product.id;
    const current = cartItems[id];
    if (!current) return;

    const newQty = current.quantity + change;
    try {
      if (newQty < 1) {
        await axios.delete(`${API_BASE}/api/buyer/cart/${current.cartItemId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCartItems(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        Alert.alert('Removed', 'Item removed from cart');
      } else {
        await axios.put(`${API_BASE}/api/buyer/cart/${current.cartItemId}/quantity`,
          { quantity: newQty },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCartItems(prev => ({
          ...prev,
          [id]: { ...current, quantity: newQty },
        }));
      }
    } catch (err) {
      console.error("Quantity Update Error:", err);
      fetchCart();
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchLocalBest();
    fetchWishlist();
    fetchCart();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Local Best Products</Text>
        <View style={{ width: 50 }} />
      </View>

         <ViewVendors/>
       <View ><Text>Products</Text></View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA500" />
          <Text style={styles.loadingText}>Fetching local best products...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={localBestProducts}
          keyExtractor={(item, index) => item._id ? item._id.toString() : index.toString()}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          renderItem={({ item, index }) => {
            const productId = item._id || item.id || index.toString(); // Ensure unique
            const isFavorite = favorites.has(productId);
            const cartQuantity = cartItems[productId]?.quantity || 0;

            const marginRight = index % 2 === 0 ? 10 : 0;

            return (
              <View style={{ marginRight }} key={productId}>
                <ProductCard
                  item={item}
                  isFavorite={isFavorite}
                  onToggleFavorite={handleToggleFavorite}
                  cartQuantity={cartQuantity}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                />
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default ViewAllLocalBest;

// ✅ Styles
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 15, borderBottomWidth: 1, borderColor: "#eee" },
  backButtonContainer: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#333" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#777" },
  errorContainer: { alignItems: "center", marginTop: 40 },
  errorText: { color: "#d32f2f", fontSize: 16, marginBottom: 15 },
  retryButton: { backgroundColor: "#1976d2", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5 },
  buttonText: { color: "#fff", fontWeight: "600" },
});

const cardStyles = StyleSheet.create({
  container: { width: CARD_WIDTH, marginTop: 10 },
  card: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(108,59,28,1)', elevation: 3 },
  imageContainer: { position: 'relative', borderTopLeftRadius: 8, borderTopRightRadius: 8, overflow: 'hidden' },
  imageHeight: 120,
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  favoriteButton: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  ratingContainer: { position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, borderRadius: 12 },
  ratingText: { color: '#fff', fontSize: 11, marginLeft: 2 },
  statusBadge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '500' },
  cardContent: { padding: 8 },
  productTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  productSubtitle: { fontSize: 13, color: '#777', marginBottom: 6 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  productPrice: { fontSize: 14, fontWeight: '700', color: '#000' },
  productUnit: { fontSize: 12, color: '#666', marginLeft: 2 },
  varietyText: { fontSize: 12, color: '#666', marginBottom: 8 },
  buttonContainer: { minHeight: 36, justifyContent: 'center' },
  addToCartButton: { backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center', paddingVertical: 6, borderRadius: 6 },
  disabledButton: { backgroundColor: '#ccc' },
  addToCartText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#4CAF50', borderRadius: 6, paddingHorizontal: 4, height: 36 },
  quantityButton: { paddingHorizontal: 8 },
  quantityText: { fontSize: 16, color: '#fff', fontWeight: '600' },
});
