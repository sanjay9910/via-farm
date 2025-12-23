// ProductDetailScreen.jsx
import SuggestionCard from '@/components/myCard/SuggestionCard';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { goBack } from 'expo-router/build/global-state/routing';
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Responsive from './Responsive';

const { moderateScale, scale, verticalScale, normalizeFont } = Responsive;

const API_BASE = "https://viafarm-1.onrender.com";
const { width: SCREEN_W } = Dimensions.get("window");

const scaleFont = (size) => {
  try {
    const n = normalizeFont(size);
    return Math.round(n * 1.08);
  } catch (e) {
    return normalizeFont(size);
  }
};

export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [cardGet, setCardGet] = useState([]);
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
  const [qtyModalVisible, setQtyModalVisible] = useState(false);
  const [editQuantity, setEditQuantity] = useState(String(quantity || 1));

  const [message, setMessage] = useState(null);
  const messageAnim = useRef(new Animated.Value(0)).current;
  const messageTimerRef = useRef<number | null>(null);

  const showMessage = (msg) => {
    if (!msg) return;
    setMessage(String(msg));
    Animated.timing(messageAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }
    messageTimerRef.current = setTimeout(() => {
      Animated.timing(messageAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setMessage(null));
      messageTimerRef.current = null;
    }, 1800);
    // also log for debugging
    console.warn('UI message:', msg);
  };

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, []);

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
        // non-blocking message then go back
        showMessage("Product not found");
        navigation.back?.();
      }
    } catch (err) {
      console.error("fetchProduct error:", err?.response?.data ?? err.message);
      showMessage("Failed to load product");
      navigation.back?.();
    } finally {
      setLoading(false);
    }
  }, [navigation, pincode]);

  useEffect(() => {
    if (!productId) {
      showMessage("Product id missing");
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

  // keep modal editQuantity in sync when quantity changes
  useEffect(() => {
    setEditQuantity(String(quantity || 1));
  }, [quantity]);

  const toggleWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) { showMessage("Login required"); return; }
      const res = await axios.post(`${API_BASE}/api/buyer/wishlist/add`, { productId: product._id }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) {
        setInWishlist(prev => !prev);
        showMessage(res.data?.message ?? (inWishlist ? "Removed from wishlist" : "Added to wishlist"));
      } else {
        showMessage(res.data?.message ?? "Could not update wishlist");
      }
    } catch (err) {
      console.error("toggleWishlist", err?.response?.data ?? err.message);
      showMessage("Could not update wishlist");
    }
  };

  useEffect(() => {
    const wishlistGet = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const res = await axios.get(`${API_BASE}/api/buyer/wishlist`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWishlist(res.data?.data?.items.length ?? "0");
      } catch (error) {
        console.warn("wishlistGet error", error);
      }
    };
    wishlistGet();
  }, []);

  useEffect(() => {
    const cardGet = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const res = await axios.get(`${API_BASE}/api/buyer/cart`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCardGet(res.data?.data?.items.length ?? "0");
      } catch (error) {
        console.warn("cardGet error", error);
      }
    };
    cardGet();
  }, []);

  // NOTE: addToCart now supports updating quantity as well
  const addToCart = async (qty = 1) => {
    if (!product) return;
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) { showMessage("Login required"); return; }
      const payload = { productId: product._id, quantity: qty, vendorId: vendor?.id ?? vendor?._id ?? product.vendor?._id ?? product.vendor };
      const res = await axios.post(`${API_BASE}/api/buyer/cart/add`, payload, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) {
        setInCart(true);
        setQuantity(qty);
        showMessage(res.data.message ?? "Added to cart");
      } else {
        setInCart(true);
        setQuantity(qty);
        showMessage(res.data?.message ?? "Updated cart");
      }
    } catch (err) {
      console.error("addToCart", err?.response?.data ?? err.message);
      showMessage("Could not add to cart");
    }
  };

  const removeFromCart = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) { showMessage("Login required"); return; }
      const res = await axios.delete(`${API_BASE}/api/buyer/cart/${product._id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) {
        setInCart(false);
        setQuantity(1);
        showMessage(res.data.message ?? "Removed from cart");
      } else {
        setInCart(false);
        setQuantity(1);
        showMessage(res.data?.message ?? "Removed from cart");
      }
    } catch (err) {
      console.error("removeFromCart", err?.response?.data ?? err.message);
      showMessage("Could not remove from cart");
    }
  };

  const incrementQuantity = async () => {
    const newQty = (quantity ?? 1) + 1;
    setQuantity(newQty);
    await addToCart(newQty);
  };

  const decrementQuantity = async () => {
    const newQty = (quantity ?? 1) - 1;
    if (newQty <= 0) {
      await removeFromCart();
    } else {
      setQuantity(newQty);
      await addToCart(newQty);
    }
  };

  const handleCartToggle = async () => {
    if (!product) return;
    if (inCart) {
      await removeFromCart();
    } else {
      await addToCart(1);
    }
  };

  const openVendorMap = () => {
    showMessage("Coming soon...");
  };

  const openRecommended = (id) => {
    if (!id) return;
    navigation.push?.({ pathname: '/ViewOrderProduct', params: { productId: id } }) || navigation.navigate?.('ViewOrderProduct', { productId: id });
  };

  const openVendorDetails = () => {
    const vid = vendor?.id ?? vendor?._id ?? product.vendor?._id ?? product.vendor;
    if (!vid) {
      showMessage("Vendor not available");
      return;
    }
    navigation.navigate?.('VendorsDetails', { vendorId: vid });
  };

  // --- Modal handlers ---
  const openQtyModal = (e) => {
    e?.stopPropagation?.();
    setEditQuantity(String(quantity || 1));
    setQtyModalVisible(true);
  };
  const closeQtyModal = () => setQtyModalVisible(false);

  const applyQuantityChange = async () => {
    const parsed = parseInt(String(editQuantity).replace(/\D/g, ''), 10);
    const newQty = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);

    if (newQty <= 0) {
      // treat as remove
      await removeFromCart();
    } else {
      await addToCart(newQty);
    }

    closeQtyModal();
  };

  const incrementEdit = () => {
    const v = parseInt(editQuantity || "0", 10) || 0;
    setEditQuantity(String(v + 1));
  };
  const decrementEdit = () => {
    const v = parseInt(editQuantity || "0", 10) || 0;
    setEditQuantity(String(Math.max(0, v - 1)));
  };

  const headerWishlistPress = () => {
    navigation.navigate('wishlist');
  };
  const headerCartPress = () => {
    navigation.navigate('OnlyRoutingCart');
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
        <Text allowFontScaling={false}>Product not found</Text>
      </SafeAreaView>
    );
  }

  const vendorAddr = vendor?.address ?? product.vendor?.address ?? {};
  const pickupAddress = `${vendorAddr.houseNumber ? vendorAddr.houseNumber + ', ' : ''}${vendorAddr.locality ?? vendorAddr.street ?? ''}${vendorAddr.city ? ', ' + vendorAddr.city : ''}`;

  return (
    <SafeAreaView style={styles.page}>
      {/* non-blocking message banner */}
      {message ? (
        <Animated.View style={[toastStyles.container, { opacity: messageAnim, transform: [{ translateY: messageAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }]}>
          <Text allowFontScaling={false} numberOfLines={2} style={toastStyles.text}>{message}</Text>
        </Animated.View>
      ) : null}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>

        <Text allowFontScaling={false} style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={headerWishlistPress} style={{ marginRight: moderateScale(12) }}>
            <Ionicons
              name="heart-outline"
              size={scale(27)}
              color="#000"
            />

            <View style={styles.countWishlistA}>
              <Text allowFontScaling={false} style={styles.countA}>{wishlist || "0"}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={headerCartPress} style={{ marginRight: moderateScale(12) }}>
            <Ionicons
              name="cart-outline"
              size={scale(27)}
              color="#000"   // green / brand color
            />
            <View style={styles.countWishlistA}>
              <Text allowFontScaling={false} style={styles.countA}>{cardGet || "0"}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: product.images?.[0] }} style={styles.heroImage} resizeMode='stretch' />

        <TouchableOpacity style={styles.favButton} onPress={toggleWishlist}>
          <Ionicons name={inWishlist ? "heart" : "heart-outline"} size={26} color={inWishlist ? "red" : "white"} />
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: moderateScale(8) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text allowFontScaling={false} style={styles.title}>{product.name}</Text>
                <View style={styles.ratingPill}>
                  <Image source={require("../assets/via-farm-img/icons/satar.png")} />
                  <Text allowFontScaling={false} style={{ fontWeight: '700', fontSize: scaleFont(12) }}>
                    {Number(product.rating || 0).toFixed(1)}
                  </Text>
                </View>
              </View>

              <Text allowFontScaling={false} style={styles.mrp}>MRP <Text style={{ fontWeight: 700, color: "#000", fontSize: scaleFont(13) }}>₹{product.price}/{product.unit ?? 'pc'}</Text></Text>
            </View>
          </View>

          <Text allowFontScaling={false} style={[styles.sectionTitle, { marginTop: moderateScale(12) }]}>About the product</Text>
          <Text allowFontScaling={false} style={{ fontSize: scaleFont(11), marginVertical: moderateScale(5) }}>Category: {product.category}</Text>
          <Text allowFontScaling={false} style={{ fontSize: scaleFont(11) }}>Variety: {product.variety}</Text>

          <Text allowFontScaling={false} style={[styles.description, { fontSize: scaleFont(12) }]}>Description: {product.description}</Text>

          <TouchableOpacity style={styles.vendorHeader} onPress={() => setVendorExpanded(v => !v)}>
            <Text allowFontScaling={false} style={styles.sectionTitle}>About the vendor</Text>
            <Ionicons name={vendorExpanded ? "chevron-up" : "chevron-down"} size={20} color="#666" />
          </TouchableOpacity>

          {vendorExpanded && (
            <TouchableOpacity onPress={openVendorDetails} activeOpacity={0.8} style={styles.vendorExpanded}>
              <Image source={{ uri: vendor?.profilePicture ?? product.vendor?.profilePicture }} style={styles.vendorImage} />
              <View style={{ flex: 1, marginLeft: moderateScale(12) }}>
                <Text allowFontScaling={false} style={{ fontWeight: '600', fontSize: scaleFont(12), }}>{vendor?.name ?? product.vendor?.name}</Text>
                <Text allowFontScaling={false} style={{ color: '#666', marginTop: moderateScale(6), fontSize: scaleFont(11) }}>{vendorAddr.houseNumber ? `${vendorAddr.houseNumber}, ` : ''}{vendorAddr.locality ?? vendorAddr.street ?? ''}{vendorAddr.city ? `, ${vendorAddr.city}` : ''}</Text>
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.pickupRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
             <Image style={{width:moderateScale(14), height:moderateScale(18),resizeMode:'stretch'}} source={require("../assets/via-farm-img/icons/iconlocation.png")} />
              <View style={{ marginLeft: moderateScale(10) }}>
                <Text allowFontScaling={false} style={{ fontWeight: '500', fontSize: scaleFont(11) }}>Pickup Location</Text>
                <Text allowFontScaling={false} style={{ color: '#666', fontSize: scaleFont(11), maxWidth: SCREEN_W - scale(120) }} numberOfLines={1}>{pickupAddress}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={openVendorMap} style={{ padding: scale(8) }}>
              <Image source={require("../assets/via-farm-img/icons/directionLocation.png")} />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: moderateScale(6) }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: moderateScale(4) }}>
              <Text allowFontScaling={false} style={{ fontWeight: '600', fontSize: scaleFont(12) }}>Ratings & Reviews</Text>
              <TouchableOpacity onPress={() => navigation.navigate?.('SeeAllReview', {
                vendor,
                reviews,
              })} style={{ flexDirection: 'row', alignItems: 'center', gap: moderateScale(5) }}>
                <Text allowFontScaling={false} style={{ color: '#3b82f6', fontSize: scaleFont(11) }}>See All</Text>
                <Image source={require('../assets/via-farm-img/icons/see.png')} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={reviews.filter(r => r.images && r.images.length > 0)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(it, idx) => String(it.id ?? idx)}
              contentContainerStyle={{ paddingVertical: moderateScale(10), paddingHorizontal: moderateScale(12) }}
              renderItem={({ item }) => (
                <View style={{ marginRight: moderateScale(10) }}>
                  {item.images.map((img, i) => (
                    <Image key={i} source={{ uri: img }} style={{ width: scale(120), height: scale(120), borderRadius: moderateScale(8), marginBottom: moderateScale(6) }} />
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
            contentContainerStyle={{ paddingHorizontal: moderateScale(12), paddingBottom: moderateScale(18) }}
            renderItem={({ item }) => (
              <View style={styles.reviewCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: moderateScale(8) }}>
                  <Image source={{ uri: item.user?.profilePicture ?? 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} style={{ width: scale(40), height: scale(40), borderRadius: moderateScale(20), marginRight: moderateScale(10) }} />
                  <View>
                    <Text allowFontScaling={false} style={{ fontWeight: '700', fontSize: scaleFont(12) }}>{item.user?.name ?? 'Anonymous'}</Text>
                    <Text allowFontScaling={false} style={{ color: '#777', fontSize: scaleFont(11) }}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: moderateScale(8) }}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text allowFontScaling={false} style={{ marginLeft: 6, fontSize: scaleFont(11) }}>{item.rating}/5</Text>
                </View>
                {item.comment ? <Text style={{ color: '#444', fontSize: scaleFont(12) }}>{item.comment}</Text> : null}
              </View>
            )}
            ListEmptyComponent={() => (
              <View>
                <Text allowFontScaling={false} style={{ color: '#777', fontSize: scaleFont(11) }}>No reviews yet</Text>
              </View>
            )}
          />

          <View>
            <SuggestionCard />
          </View>

        </View>
      </ScrollView>

      {/* Quantity Edit Modal (opens when clicking qty display) */}
      <Modal
        visible={qtyModalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeQtyModal}
      >
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={closeQtyModal}>
          <View style={[modalStyles.modalWrap, { maxWidth: Math.min(420, Dimensions.get('window').width - moderateScale(40)) }]}>
            <Text allowFontScaling={false} style={modalStyles.modalTitle}>Set quantity</Text>

            <View style={modalStyles.editRow}>
              <TouchableOpacity style={modalStyles.pickerBtn} onPress={decrementEdit}>
                <Ionicons name="remove" size={moderateScale(18)} color="#111" />
              </TouchableOpacity>

              <TextInput
                style={modalStyles.qtyInput}
                keyboardType="number-pad"
                value={String(editQuantity)}
                onChangeText={(t) => setEditQuantity(t.replace(/[^0-9]/g, ""))}
                maxLength={5}
                placeholder="0"
                placeholderTextColor="#999"
                allowFontScaling={false}
              />

              <TouchableOpacity style={modalStyles.pickerBtn} onPress={incrementEdit}>
                <Ionicons name="add" size={moderateScale(18)} color="#111" />
              </TouchableOpacity>
            </View>

            <View style={modalStyles.modalActions}>
              <TouchableOpacity style={modalStyles.cancelBtn} onPress={closeQtyModal}>
                <Text allowFontScaling={false} style={modalStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalStyles.okBtn} onPress={applyQuantityChange}>
                <Text allowFontScaling={false} style={modalStyles.okText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View style={{ flex: 1, }}>
          <Text allowFontScaling={false} style={{ color: '#666', fontSize: scaleFont(12) }}>Price</Text>
          <Text allowFontScaling={false} style={{ fontWeight: '600', fontSize: scaleFont(16) }}>₹{product.price}</Text>
        </View>

        {inCart ? (
          // NEW: quantity selector like image (minus, qty, plus)
          <View style={styles.quantityControlContainer}>
            <TouchableOpacity style={styles.qtyBtn} onPress={decrementQuantity}>
              <Text allowFontScaling={false} style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>

            {/* Make qty display pressable to open modal */}
            <TouchableOpacity style={styles.qtyDisplay} onPress={openQtyModal}>
              <Text allowFontScaling={false} style={styles.qtyText}>{String(quantity).padStart(2, '0')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.qtyBtn} onPress={incrementQuantity}>
              <Text allowFontScaling={false} style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.cartBtn} onPress={() => addToCart(1)}>
            <Ionicons name="cart" size={18} color="#fff" />
            <Text allowFontScaling={false} style={styles.cartBtnText}>{inCart ? 'Move to Cart' : 'Add to Cart'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: moderateScale(8),
    left: moderateScale(12),
    right: moderateScale(12),
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
    zIndex: 9999,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    fontSize: normalizeFont(12),
  },
});

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: moderateScale(12), paddingVertical: moderateScale(10), borderBottomWidth: 0.4, borderBottomColor: '#eee' },
  iconBtn: { padding: moderateScale(6) },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: scaleFont(15), fontWeight: '600' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },

  countWishlistA: {
    position: 'absolute',
    top: moderateScale(-6),
    right: moderateScale(-6),
    minWidth: moderateScale(20),
    height: moderateScale(20),
    paddingHorizontal: moderateScale(4),
    borderRadius: moderateScale(11),
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: 'grey',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 99,
  },
  countA: {
    color: '#fff',
    fontWeight: '700',
    fontSize: normalizeFont(10),
    lineHeight: normalizeFont(12),
    textAlign: 'center',
    includeFontPadding: false,
  },

  container: { flex: 1 },

  heroImage: { width: SCREEN_W, height: SCREEN_W * 0.7, backgroundColor: '#f3f3f3' },
  favButton: { position: 'absolute', right: moderateScale(18), top: 6, backgroundColor: 'transparent' },

  infoCard: { backgroundColor: '#fff', marginTop: -14, padding: moderateScale(14), minHeight: scale(220) },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: scaleFont(16), fontWeight: '700' },
  smallText: { color: '#666', fontSize: scaleFont(12) },
  mrp: { fontSize: scaleFont(12), marginTop: moderateScale(5) },
  ratingPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: moderateScale(5), paddingVertical: moderateScale(1), borderRadius: 5, marginTop: moderateScale(8), borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.4)' },

  sectionTitle: { fontSize: scaleFont(13), fontWeight: '600' },
  description: { color: '#444', marginTop: moderateScale(6) },

  vendorHeader: { marginTop: moderateScale(12), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vendorExpanded: { flexDirection: 'row', marginTop: moderateScale(10), alignItems: 'center' },
  vendorImage: { width: scale(70), height: scale(70), borderRadius: moderateScale(10), backgroundColor: '#f3f3f3' },

  pickupRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: moderateScale(12), padding: moderateScale(8), backgroundColor: '#fafafa', borderRadius: 8 },

  reviewCard: { width: scale(300), backgroundColor: '#fff', borderRadius: moderateScale(12), padding: moderateScale(12), marginRight: moderateScale(12), elevation: 2 },

  bottomBar: { flexDirection: 'row', alignItems: 'center', padding: moderateScale(12), borderTopWidth: 0.6, borderTopColor: '#eee', backgroundColor: '#fff' },
  cartBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#22c55e', paddingHorizontal: moderateScale(18), paddingVertical: moderateScale(12), borderRadius: moderateScale(10) },
  cartBtnText: { color: '#fff', fontWeight: '700', marginLeft: moderateScale(8), fontSize: scaleFont(14) },

  quantityControlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#22c55e',
    borderRadius: moderateScale(11),
    overflow: 'hidden',
  },
  qtyBtn: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    minWidth: moderateScale(36),
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 0,
  },
  qtyBtnText: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    color: '#22c55e',
  },
  qtyDisplay: {
    minWidth: scale(42),
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  qtyText: {
    fontWeight: '700',
    fontSize: scaleFont(13),
    color: '#22c55e',
  },
});

/* Modal styles (local for qty modal) */
const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(20),
  },
  modalWrap: {
    width: '100%',
    maxWidth: moderateScale(360),
    backgroundColor: "#fff",
    borderRadius: moderateScale(10),
    padding: moderateScale(16),
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(8),
    shadowOffset: { width: 0, height: moderateScale(4) },
  },
  modalTitle: {
    fontSize: normalizeFont(14),
    fontWeight: "700",
    color: "#222",
    marginBottom: moderateScale(12),
    textAlign: "center",
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(12),
    marginBottom: moderateScale(14),
  },
  pickerBtn: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  qtyInput: {
    flex: 1,
    minHeight: moderateScale(44),
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: moderateScale(8),
    textAlign: "center",
    fontSize: normalizeFont(16),
    paddingVertical: moderateScale(8),
  },
  modalActions: {
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: moderateScale(8),
  },
  cancelBtn: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(8),
    width: '40%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: moderateScale(1),
    borderColor: "rgba(76, 175, 80, 1)"
  },
  cancelText: {
    color: "#666",
    fontSize: normalizeFont(13),
  },
  okBtn: {
    backgroundColor: "rgba(76, 175, 80, 1)",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(8),
    width: '40%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  okText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: normalizeFont(13),
  },
});
