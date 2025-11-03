import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProductCard from '../components/common/ProductCard';

const { width } = Dimensions.get('window');
const API = 'https://viafarm-1.onrender.com';
const COORDS = '?buyerLat=28.70&buyerLng=77.22';

const CARD_MARGIN = 10;
const CARD_COLUMNS = 2;
const CARD_WIDTH = (width - CARD_MARGIN * (CARD_COLUMNS * 2)) / CARD_COLUMNS;

/** Robust FarmImage - unchanged */
const FarmImage = ({ item }) => {
  let uri = null;
  if (!item) uri = 'https://via.placeholder.com/120';
  else if (typeof item === 'string') uri = item;
  else if (item?.url) uri = item.url;
  else if (item?.image) uri = item.image;
  else if (item?.src) uri = item.src;
  else if (item?.path) uri = item.path;
  else uri = 'https://via.placeholder.com/120';

  return (
    <TouchableOpacity style={{ marginRight: 8 }} activeOpacity={0.85}>
      <Image
        source={{ uri }}
        style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: '#eee' }}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
};

const ReviewCard = ({ item }) => (
  <TouchableOpacity style={styles.reviewCard} activeOpacity={0.8}>
    <View style={styles.header}>
      <Image
        source={{ uri: item?.user?.profilePicture || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.name}>{item?.user?.name || 'Anonymous'}</Text>
        <Text style={styles.rating}>⭐ {item?.rating ?? 'N/A'}</Text>
      </View>
      <Text style={styles.date}>
        {item?.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : ''}
      </Text>
    </View>
    {item?.comment && <Text style={styles.comment}>{item.comment}</Text>}
  </TouchableOpacity>
);

const VendorsDetails = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { params } = useRoute();
  const vendorId = params?.vendorId;

  const [vendor, setVendor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [farmImage, setFarmImage] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // wishlist & cart state
  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState({});

  const [selectedCategory, setSelectedCategory] = useState('All');
  const dropdownButtonRef = useRef(null);

  // ----- helper function -----
  const getVendorRating = (r) => {
    const numeric = typeof r === 'string' ? parseFloat(r) : r;
    if (numeric === null || numeric === undefined || numeric === 0 || Number.isNaN(numeric)) {
      return 5.0;
    }
    return numeric;
  };

  // ----- fetch vendor & product data -----
  const fetchVendor = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('userToken');
      const resp = await axios.get(`${API}/api/buyer/vendor/${vendorId}${COORDS}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = resp?.data ?? {};

      const vendorData = data?.data?.vendor ?? data?.vendor ?? null;
      const reviewsList = data?.data?.reviews?.list ?? data?.data?.reviews ?? data?.reviews?.list ?? data?.reviews ?? [];
      const farmImagesList = vendorData?.farmImages ?? data?.data?.farmImages ?? data?.farmImages ?? [];
      const listedProducts = data?.data?.listedProducts ?? data?.listedProducts ?? [];

      if (!vendorData) throw new Error('Vendor not found');

      setVendor(vendorData);
      setReviews(Array.isArray(reviewsList) ? reviewsList : []);
      setFarmImage(Array.isArray(farmImagesList) ? farmImagesList : []);
      setProducts(Array.isArray(listedProducts) ? listedProducts : []);
    } catch (e) {
      setError(e?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ----- wishlist endpoints -----
  const fetchWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const res = await axios.get(`${API}/api/buyer/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        const wishlistItems = res.data.data?.items ?? [];
        const favoriteIds = new Set(wishlistItems.map((it) => it.productId || it._id || it.id));
        setFavorites(favoriteIds);
      }
    } catch (err) {
      console.error('fetchWishlist error', err);
    }
  };

  // ----- cart endpoints -----
  const fetchCart = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const res = await axios.get(`${API}/api/buyer/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        const items = res.data.data?.items ?? [];
        const map = {};
        items.forEach((it) => {
          const productId = it.productId || it._id || it.id;
          map[productId] = { quantity: it.quantity || 1, cartItemId: it._id || it.id };
        });
        setCartItems(map);
      }
    } catch (err) {
      console.error('fetchCart error', err);
    }
  };

  useEffect(() => {
    if (vendorId) {
      fetchVendor();
      fetchWishlist();
      fetchCart();
    }
  }, [vendorId]);

  // ----- wishlist handlers -----
  const addToWishlist = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to wishlist');
        return;
      }
      const productId = product._id || product.id;
      const body = {
        productId,
        name: product.name,
        image: product.images?.[0] || product.image || '',
        price: product.price,
        category: product.category || 'Uncategorized',
        variety: product.variety || 'Standard',
        unit: product.unit || 'kg'
      };
      const res = await axios.post(`${API}/api/buyer/wishlist/add`, body, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.data?.success) {
        setFavorites(prev => new Set(prev).add(productId));
        Alert.alert('Success', 'Added to wishlist!');
      }
    } catch (err) {
      console.error('addToWishlist error', err);
      if (err.response?.status === 400) {
        const productId = product._id || product.id;
        setFavorites(prev => new Set(prev).add(productId));
        Alert.alert('Info', 'Already in wishlist');
      } else {
        Alert.alert('Error', 'Failed to add to wishlist');
      }
    }
  };

  const removeFromWishlist = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const productId = product._id || product.id;
      const res = await axios.delete(`${API}/api/buyer/wishlist/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        Alert.alert('Removed', 'Removed from wishlist');
      }
    } catch (err) {
      console.error('removeFromWishlist error', err);
      Alert.alert('Error', 'Failed to remove from wishlist');
    }
  };

  const handleToggleFavorite = async (product) => {
    const productId = product._id || product.id;
    if (favorites.has(productId)) {
      await removeFromWishlist(product);
    } else {
      await addToWishlist(product);
    }
  };

  // ----- cart handlers -----
  const handleAddToCart = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to add items to cart');
        return;
      }
      const productId = product._id || product.id;
      const body = {
        productId,
        name: product.name,
        image: product.images?.[0] || product.image || '',
        price: product.price,
        quantity: 1,
        category: product.category || 'Uncategorized',
        variety: product.variety || 'Standard',
        unit: product.unit || 'kg'
      };
      const res = await axios.post(`${API}/api/buyer/cart/add`, body, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.data?.success) {
        setCartItems(prev => ({ ...prev, [productId]: { quantity: 1, cartItemId: res.data.data?._id || productId } }));
        Alert.alert('Success', 'Added to cart!');
      }
    } catch (err) {
      console.error('handleAddToCart error', err);
      if (err.response?.status === 400) {
        await fetchCart();
        Alert.alert('Info', 'Product is already in cart');
      } else {
        Alert.alert('Error', 'Failed to add to cart');
      }
    }
  };

  const handleUpdateQuantity = async (product, change) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to update cart');
        return;
      }
      const productId = product._id || product.id;
      const current = cartItems[productId];
      if (!current) return;
      const newQty = current.quantity + change;

      if (newQty < 1) {
        const res = await axios.delete(`${API}/api/buyer/cart/${current.cartItemId}`, {
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
      } else {
        setCartItems(prev => ({ ...prev, [productId]: { ...current, quantity: newQty } }));
        const res = await axios.put(`${API}/api/buyer/cart/${current.cartItemId}/quantity`, { quantity: newQty }, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (!res.data?.success) {
          setCartItems(prev => ({ ...prev, [productId]: current }));
          Alert.alert('Error', 'Failed to update quantity');
        }
      }
    } catch (err) {
      console.error('handleUpdateQuantity error', err);
      await fetchCart();
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  // ----- navigation to product details -----
  const openProductDetails = (product) => {
    const productId = product?._id || product?.id;
    if (!productId) {
      Alert.alert('Error', 'Product id missing');
      return;
    }
    navigation.navigate('ViewProduct', { productId, product });
  };

  // ---- small helpers & UI guards ----
  if (loading)
    return (
      <View style={styles.containerRoot}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={{ marginTop: 8 }}>Loading...</Text>
        </View>
      </View>
    );

  if (error || !vendor)
    return (
      <View style={styles.containerRoot}>
        <View style={styles.center}>
          <Text style={styles.errorHeader}>Error</Text>
          <Text>{error}</Text>
        </View>
      </View>
    );

  const v = vendor;
  const image = v.profilePicture || 'https://picsum.photos/800/600';

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const allReviewImages = reviews.reduce((acc, review) => {
    const imgs = review?.images;
    if (!imgs) return acc;
    if (Array.isArray(imgs)) {
      imgs.forEach((it) => {
        if (typeof it === 'string') acc.push(it);
        else if (it?.url) acc.push(it.url);
        else if (it?.image) acc.push(it.image);
      });
    }
    return acc;
  }, []);

  const ListHeader = () => (
    <View style={{ width: '100%', paddingBottom: 10, backgroundColor: '#fff' }}>
      <View style={styles.imageBox}>
        <Image source={{ uri: image }} style={styles.image} />
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.rowBetween}>
          <Text style={styles.vendorName}>{v.name}</Text>
          <View style={styles.ratingBox}>
            <Text style={styles.ratingText}>
              {getVendorRating(v.rating).toFixed(1)}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Ionicons name="location-sharp" size={16} color="#757575" />
          <Text style={styles.location}>
            {v.locationText ?? 'Unknown'} ({v.distance ?? 'N/A'})
          </Text>
        </View>
        <Text style={styles.aboutHeader}>About</Text>
        <Text style={styles.about}>{v.about ?? 'No information available.'}</Text>
      </View>

      {/* FarmImage */}
      <View style={{ backgroundColor: '#fff', paddingVertical: 10, marginTop: allReviewImages.length > 0 ? 0 : 10 }}>
        {farmImage.length > 0 ? (
          <FlatList
            data={farmImage}
            renderItem={({ item }) => <FarmImage item={item} />}
            keyExtractor={(item, index) =>
              typeof item === 'string' ? item : item?._id ? item._id.toString() : index.toString()
            }
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 }}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={styles.noReviewText}>No farm images.</Text>
          </View>
        )}
      </View>

      {allReviewImages.length > 0 && (
        <View style={{ backgroundColor: '#fff', paddingVertical: 10, paddingLeft: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionHeader}>Reviews ({reviews.length} reviews)</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('SeeAllReview', {
                  vendor,
                  reviews,
                })
              }>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingRight: 5 }}>
                <Text style={{ color: 'rgba(1, 151, 218, 1)', fontWeight: '600' }}>See All</Text>
                <Image source={require("../assets/via-farm-img/icons/see.png")} />
              </View>
            </TouchableOpacity>
          </View>
          <FlatList
            data={allReviewImages}
            horizontal
            keyExtractor={(item, idx) => `review-img-${idx}`}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={{ width: 80, height: 80, marginRight: 8, borderRadius: 8 }} />
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* Reviews */}
      <View style={{ backgroundColor: '#fff', paddingVertical: 10, marginTop: allReviewImages.length > 0 ? 0 : 10 }}>
        {reviews.length > 0 ? (
          <FlatList
            data={reviews}
            renderItem={({ item }) => <ReviewCard item={item} />}
            keyExtractor={(item, index) => (item?._id ? item._id.toString() : index.toString())}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 }}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Image style={{ width: 70, height: 70 }} source={require('../assets/via-farm-img/icons/empty.png')} />
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
              <Image style={{ width: 25, height: 25 }} source={require("../assets/via-farm-img/icons/satar.png")} />
              <Image style={{ width: 25, height: 25 }} source={require("../assets/via-farm-img/icons/satar.png")} />
              <Image style={{ width: 25, height: 25 }} source={require("../assets/via-farm-img/icons/satar.png")} />
              <Image style={{ width: 25, height: 25 }} source={require("../assets/via-farm-img/icons/satar.png")} />
              <Image style={{ width: 25, height: 25 }} source={require("../assets/via-farm-img/icons/satar.png")} />
            </View>
            <Text style={styles.noReviewText}>No reviews yet.</Text>
          </View>
        )}
      </View>

      <View style={styles.productsHeaderContainer}>
        <Text style={[styles.sectionHeader, { marginLeft: 0, marginVertical: 0 }]}>
          Listing Product
        </Text>
        <TouchableOpacity
          ref={dropdownButtonRef}
          style={styles.dropdownButton}
          onPress={() => { /* your dropdown handler */ }}>
          <Text style={styles.dropdownButtonText}>{selectedCategory}</Text>
          <Ionicons name="chevron-down" size={20} color="#555" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList
      style={styles.containerRoot}
      data={filteredProducts}
      ListHeaderComponent={<ListHeader />}
      renderItem={({ item }) => {
        const productId = item?._id || item?.id;
        const isFavorite = favorites.has(productId);
        const cartQuantity = cartItems[productId]?.quantity || 0;

        return (
          <ProductCard
            id={item?._id}
            title={item?.name || 'Unnamed Product'}
            subtitle={item?.variety || ''}
            price={item?.price || 0}
            rating={item?.rating || 0}
            image={item?.images?.[0] || 'https://via.placeholder.com/150'}
            width={CARD_WIDTH}
            onPress={() => openProductDetails(item)}
            onAddToCart={() => handleAddToCart(item)}
            onToggleFavorite={() => handleToggleFavorite(item)}
            onUpdateQuantity={(diff) => handleUpdateQuantity(item, diff)}
            cartQuantity={cartQuantity}
            isFavorite={isFavorite}
          />
        );
      }}
      keyExtractor={(item, index) => (item?._id ? item._id.toString() : index.toString())}
      numColumns={CARD_COLUMNS}
      columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: CARD_MARGIN }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40, backgroundColor: '#fff' }}
      ListEmptyComponent={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Image style={{ width: 120, height: 120 }} source={require('../assets/via-farm-img/icons/emptyProductList.png')} />
          <Text>No products available.</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  containerRoot: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 10,
  },
  imageBox: {
    width: '100%',
    height: 250,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backBtn: {
    position: 'absolute',
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 5,
  },
  cardContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  vendorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingBox: {
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  ratingText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  location: {
    marginLeft: 5,
    fontSize: 14,
    color: '#757575',
  },
  aboutHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  about: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
    lineHeight: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 10,
    marginLeft: 10,
  },
  noReviewText: {
    textAlign: 'center',
    color: '#757575',
    paddingVertical: 10,
  },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginRight: 10,
    width: 300,
    borderWidth: 1,
    borderColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  rating: {
    fontSize: 12,
    color: '#FFC107',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  comment: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  productsHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 10,
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    minWidth: 120,
  },
  dropdownButtonText: {
    fontSize: 16,
    marginRight: 5,
    color: '#333',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: 235,
    minWidth: 100,
  },
  modalScrollView: {
    paddingVertical: 5,
  },
  modalItem: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalItemSelected: {
    backgroundColor: '#e8f5e9',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemTextSelected: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});

export default VendorsDetails;
