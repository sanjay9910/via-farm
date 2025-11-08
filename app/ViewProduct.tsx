import SuggestionCard from '@/components/myCard/SuggestionCard';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { goBack } from 'expo-router/build/global-state/routing';
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Responsive from './Responsive';

const { moderateScale, scale, verticalScale ,normalizeFont} = Responsive;

const API_BASE = "https://viafarm-1.onrender.com";
const { width: SCREEN_W } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [inCart, setInCart] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [pincode, setPincode] = useState("110015");
  const [coupon, setCoupon] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [vendorExpanded, setVendorExpanded] = useState(false);

  // NEW: track quantity for cart
  const [quantity, setQuantity] = useState(1);

  const fetchProduct = useCallback(async (id) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_BASE}/api/buyer/products/${id}`, { headers, timeout: 10000 });

      if (res.data?.success && res.data?.data?.product) {
        const p = res.data.data.product;
        setProduct(p);
        setVendor(res.data.data.vendor ?? p.vendor ?? null);
        setRecommended(res.data.data.recommendedProducts ?? []);
        setReviews(res.data.data.reviews?.list ?? []);
        if (res.data.data.shippingAddress) {
          setSelectedAddress(res.data.data.shippingAddress);
          setPincode(res.data.data.shippingAddress.pinCode ?? pincode);
        }
        if (token) checkCartWishlist(p._id, token);
      } else {
        Alert.alert("Error", "Product not found");
        navigation.back?.();
      }
    } catch (err) {
      console.error("fetchProduct error:", err?.response?.data ?? err.message);
      Alert.alert("Error", "Failed to load product");
      navigation.back?.();
    } finally {
      setLoading(false);
    }
  }, [navigation, pincode]);

  useEffect(() => {
    if (!productId) {
      Alert.alert("Error", "Product id missing");
      return;
    }
    fetchProduct(productId);
  }, [productId, fetchProduct]);

  const checkCartWishlist = async (prodId, token) => {
    try {
      const cartRes = await axios.get(`${API_BASE}/api/buyer/cart`, { headers: { Authorization: `Bearer ${token}` } });
      const items = cartRes.data?.data?.items ?? cartRes.data?.data?.cartItems ?? cartRes.data?.cartItems ?? [];
      const found = Array.isArray(items) && items.find(it => String(it.productId ?? it.product?._id) === String(prodId));
      if (found) {
        setInCart(true);
        // if backend returns quantity, use it
        setQuantity(found.quantity ?? found.qty ?? 1);
      } else {
        setInCart(false);
      }
    } catch (e) {
      console.warn("checkCart err", e?.message ?? e);
    }
    try {
      const wishRes = await axios.get(`${API_BASE}/api/buyer/wishlist`, { headers: { Authorization: `Bearer ${token}` } });
      const items = wishRes.data?.data?.items ?? wishRes.data?.wishlistItems ?? [];
      setInWishlist(Array.isArray(items) && items.some(it => String(it.productId ?? it._id ?? it.id) === String(prodId)));
    } catch (e) {
      console.warn("checkWishlist err", e?.message ?? e);
    }
  };

  const toggleWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) { Alert.alert("Login required", "Please login to manage wishlist"); return; }
      const res = await axios.post(`${API_BASE}/api/buyer/wishlist/add`, { productId: product._id }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) setInWishlist(prev => !prev);
      Alert.alert(res.data?.message ?? (inWishlist ? "Removed from wishlist" : "Added to wishlist"));
    } catch (err) {
      console.error("toggleWishlist", err?.response?.data ?? err.message);
      Alert.alert("Error", "Could not update wishlist");
    }
  };

  // NOTE: addToCart now supports updating quantity as well
  const addToCart = async (qty = 1) => {
    if (!product) return;
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) { Alert.alert("Login required", "Please login to add items to cart"); return; }
      const payload = { productId: product._id, quantity: qty, vendorId: vendor?.id ?? vendor?._id ?? product.vendor?._id ?? product.vendor };
      // Many backends accept "add" with the desired quantity and will upsert; this is safe best-effort.
      const res = await axios.post(`${API_BASE}/api/buyer/cart/add`, payload, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) {
        setInCart(true);
        setQuantity(qty);
        Alert.alert(res.data.message ?? "Added to cart");
      } else {
        // fallback: if response doesn't say success, still set quantity optimistically
        setInCart(true);
        setQuantity(qty);
        Alert.alert(res.data?.message ?? "Updated cart");
      }
    } catch (err) {
      console.error("addToCart", err?.response?.data ?? err.message);
      Alert.alert("Error", "Could not add to cart");
    }
  };

  const removeFromCart = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) { Alert.alert("Login required"); return; }
      // best-effort delete by product id (backend may require cartItemId)
      const res = await axios.delete(`${API_BASE}/api/buyer/cart/${product._id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) {
        setInCart(false);
        setQuantity(1);
        Alert.alert(res.data.message ?? "Removed from cart");
      } else {
        setInCart(false);
        setQuantity(1);
        Alert.alert(res.data?.message ?? "Removed from cart");
      }
    } catch (err) {
      console.error("removeFromCart", err?.response?.data ?? err.message);
      Alert.alert("Error", "Could not remove from cart");
    }
  };

  // NEW: increment/decrement handlers that update quantity and call addToCart
  const incrementQuantity = async () => {
    const newQty = (quantity ?? 1) + 1;
    // optimistic UI update + API call
    setQuantity(newQty);
    await addToCart(newQty);
  };

  const decrementQuantity = async () => {
    const newQty = (quantity ?? 1) - 1;
    if (newQty <= 0) {
      // remove from cart
      await removeFromCart();
    } else {
      setQuantity(newQty);
      await addToCart(newQty);
    }
  };

  const handleCartToggle = async () => {
    if (!product) return;
    if (inCart) {
      // if already in cart, open quantity UI: we'll just increment once (or you can open cart)
      // Here we decrease to mimic "move to cart" behaviour? Keep behavior simple: remove if user taps cartBtn when inCart.
      await removeFromCart();
    } else {
      await addToCart(1);
    }
  };

  const openVendorMap = () => {
    Alert.alert("Comming Soon...");
  };

  const openRecommended = (id) => {
    if (!id) return;
    navigation.push?.({ pathname: '/ViewOrderProduct', params: { productId: id } }) || navigation.navigate?.('ViewOrderProduct', { productId: id });
  };

  // NEW: navigate to vendor details screen with vendor id
  const openVendorDetails = () => {
    const vid = vendor?.id ?? vendor?._id ?? product.vendor?._id ?? product.vendor;
    if (!vid) {
      Alert.alert("Vendor not available");
      return;
    }
    // navigate to VendorsDetails, pass vendorId param
    navigation.navigate?.('VendorsDetails', { vendorId: vid });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
      </SafeAreaView>
    );
  }
  if (!product) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Product not found</Text>
      </SafeAreaView>
    );
  }

  const vendorAddr = vendor?.address ?? product.vendor?.address ?? {};
  const pickupAddress = `${vendorAddr.houseNumber ? vendorAddr.houseNumber + ', ' : ''}${vendorAddr.locality ?? vendorAddr.street ?? ''}${vendorAddr.city ? ', ' + vendorAddr.city : ''}`;

  const headerWishlistPress = () => {
    navigation.navigate('wishlist');
  };

  return (
    <SafeAreaView style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={headerWishlistPress} style={{ marginRight: 12 }}>
            <Ionicons name={"heart-outline"} size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate?.('myCard')}>
            <Ionicons name="cart" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: product.images?.[0] }} style={styles.heroImage} />

        <TouchableOpacity style={styles.favButton} onPress={toggleWishlist}>
          <Ionicons name={inWishlist ? "heart" : "heart-outline"} size={26} color={inWishlist ? "red" : "white"} />
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
                <Text style={styles.title}>{product.name}</Text>
                <View style={styles.ratingPill}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={{ marginLeft: 6, fontWeight: '700' }}>{product.rating ?? 0}</Text>
                </View>
              </View>

              <Text style={styles.smallText}>{product.category} {product.variety}</Text>
              <Text style={styles.mrp}>MRP <Text style={{fontWeight:700,color:"#000"}}>₹{product.price}/{product.unit ?? 'pc'}</Text></Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>About the product</Text>
          <Text style={{fontSize:normalizeFont(12),marginVertical:moderateScale(5)}}>Category: {product.category}</Text>
          <Text style={{fontSize:normalizeFont(12)}}>Variety: {product.variety}</Text>

          <Text style={styles.description}>{product.description}</Text>

          <TouchableOpacity style={styles.vendorHeader} onPress={() => setVendorExpanded(v => !v)}>
            <Text style={styles.sectionTitle}>About the vendor</Text>
            <Ionicons name={vendorExpanded ? "chevron-up" : "chevron-down"} size={20} color="#666" />
          </TouchableOpacity>

          {vendorExpanded && (
            // Wrap vendor area in TouchableOpacity so clicking image or text opens vendor details
            <TouchableOpacity onPress={openVendorDetails} activeOpacity={0.8} style={styles.vendorExpanded}>
              <Image source={{ uri: vendor?.profilePicture ?? product.vendor?.profilePicture }} style={styles.vendorImage} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '600' }}>{vendor?.name ?? product.vendor?.name}</Text>
                <Text style={{ color: '#666', marginTop: 6 }}>{vendorAddr.houseNumber ? `${vendorAddr.houseNumber}, ` : ''}{vendorAddr.locality ?? vendorAddr.street ?? ''}{vendorAddr.city ? `, ${vendorAddr.city}` : ''}</Text>
                {/* <Text style={{ color: '#777', marginTop: 8 }}>{vendor?.about ?? ''}</Text> */}
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.pickupRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="location-sharp" size={18} color="#444" />
              <View style={{ marginLeft: 10 }}>
                <Text style={{ fontWeight: '500' }}>Pickup Location</Text>
                <Text style={{ color: '#666', maxWidth: SCREEN_W - 120 }} numberOfLines={1}>{pickupAddress}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={openVendorMap} style={{ padding: 8 }}>
              <Image source={require("../assets/via-farm-img/icons/directionLocation.png")} />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 }}>
              <Text style={{ fontWeight: '700' }}>Ratings & Reviews</Text>
              <TouchableOpacity onPress={() => navigation.navigate?.('Reviews', { productId: product._id })} style={{flexDirection:'row',alignItems:'center',gap:5}}>
                <Text style={{ color: '#3b82f6',fontSize:normalizeFont(12) }}>See All</Text>
                <Image source={require('../assets/via-farm-img/icons/see.png')} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={reviews.filter(r => r.images && r.images.length > 0)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(it, idx) => String(it.id ?? idx)}
              contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 12 }}
              renderItem={({ item }) => (
                <View style={{ marginRight: 10 }}>
                  {item.images.map((img, i) => (
                    <Image key={i} source={{ uri: img }} style={{ width: 120, height: 120, borderRadius: 8, marginBottom: 6 }} />
                  ))}
                </View>
              )}
            />
          </View>

          <FlatList
            data={reviews.filter(r => r.comment && r.comment.trim().length > 0)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(it, idx) => String(it.id ?? idx)}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 18 }}
            renderItem={({ item }) => (
              <View style={styles.reviewCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Image source={{ uri: item.user?.profilePicture ?? 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }} />
                  <View>
                    <Text style={{ fontWeight: '700' }}>{item.user?.name ?? 'Anonymous'}</Text>
                    <Text style={{ color: '#777', fontSize: 12 }}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={{ marginLeft: 6 }}>{item.rating}/5</Text>
                </View>
                {item.comment ? <Text style={{ color: '#444' }}>{item.comment}</Text> : null}
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={{ padding: 20 }}>
                <Text style={{ color: '#777' }}>No reviews yet</Text>
              </View>
            )}
          />

          <View style={{ marginTop: 8 }}>
            <SuggestionCard />
          </View>

        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#666', fontSize: 12 }}>Price</Text>
          <Text style={{ fontWeight: '800', fontSize: 18 }}>₹{product.price}</Text>
        </View>

        {inCart ? (
          // NEW: quantity selector like image (minus, qty, plus)
          <View style={styles.quantityControlContainer}>
            <TouchableOpacity style={styles.qtyBtn} onPress={decrementQuantity}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>

            <View style={styles.qtyDisplay}>
              <Text style={styles.qtyText}>{String(quantity).padStart(2, '0')}</Text>
            </View>

            <TouchableOpacity style={styles.qtyBtn} onPress={incrementQuantity}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.cartBtn} onPress={() => addToCart(1)}>
            <Ionicons name="cart" size={18} color="#fff" />
            <Text style={styles.cartBtnText}>{inCart ? 'Move to Cart' : 'Add to Cart'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 0.4, borderBottomColor: '#eee' },
  iconBtn: { padding: 6 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize:normalizeFont(16) },
  headerRight: { flexDirection: 'row', alignItems: 'center' },

  container: { flex: 1 },

  heroImage: { width: SCREEN_W, height: SCREEN_W * 0.7, backgroundColor: '#f3f3f3' },
  favButton: { position: 'absolute', right: 18, top:6, backgroundColor: 'transparent' },

  infoCard: { backgroundColor: '#fff', marginTop: -18,  padding: 16, minHeight: 220 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize:normalizeFont(15),fontWeight:600,  },
  smallText: { color: '#666', fontSize:normalizeFont(13)},
  mrp: { fontSize:normalizeFont(14), marginTop:5 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff4d9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginTop: 8 },

  sectionTitle: { fontSize:normalizeFont(14), fontWeight: '600' },
  description: { color: '#444', marginTop: 6, fontSize:normalizeFont(14) },

  nutriRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  nutriCol: { alignItems: 'center', flex: 1 },
  nutriLabel: { color: '#777', fontSize: normalizeFont(12) },
  nutriVal: { fontWeight: '600', marginTop: 6 },

  vendorHeader: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vendorExpanded: { flexDirection: 'row', marginTop:10, alignItems: 'center' },
  vendorImage: { width: 90, height: 90, borderRadius: 10, backgroundColor: '#f3f3f3' },

  pickupRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, padding: 8, backgroundColor: '#fafafa', borderRadius: 8 },

  deliverySec: { marginTop: 12 },
  deliveryBox: { marginTop: 8, borderWidth: 0.8, borderColor: '#eee', padding: 12, borderRadius: 10 },

  coupon: { marginTop: 14, paddingTop: 8 },
  couponTitle: { fontWeight: '700' },
  couponSub: { color: '#3b82f6', marginTop: 4 },
  couponInput: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, marginTop: 8 },

  reviewCard: { width:300, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginRight: 12, elevation: 2 },

  bottomBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 0.6, borderTopColor: '#eee', backgroundColor: '#fff' },
  cartBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#22c55e', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10 },
  cartBtnText: { color: '#fff', fontWeight: '700', marginLeft: 8 },

  // NEW styles for quantity control (matches your provided image)
  quantityControlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#22c55e',
    borderRadius:11,
    overflow: 'hidden',
  },
  qtyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: moderateScale(36),
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 0,
  },
  qtyBtnText: {
    fontSize: normalizeFont(18),
    fontWeight: '700',
    color: '#22c55e',
  },
  qtyDisplay: {
    minWidth: 48,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    backgroundColor: '#fff',
  },
  qtyText: {
    fontWeight: '700',
    fontSize: normalizeFont(14),
    color: '#22c55e',
  },
});
