import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, normalizeFont, scale } from './Responsive';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const placeholderImage = 'https://via.placeholder.com/200';
const API_BASE = 'https://viafarm-1.onrender.com';

// Simple star row (read-only)
const StarRow = ({ value = 0, size = 16 }) => {
  const v = Math.max(0, Math.min(5, Number(value || 0)));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {[0, 1, 2, 3, 4].map(i => (
        <Ionicons
          key={i}
          name={i < v ? 'star' : 'star-outline'}
          size={size}
          color={i < v ? '#FFD700' : '#E0E0E0'}
          style={{ marginRight: 4 }}
        />
      ))}
    </View>
  );
};

// Small card wrapper
const DetailCard = ({ children, title }) => (
  <View style={styles.card}>
    {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
    {children}
  </View>
);

// Normalize incoming raw order payload to a consistent shape
const normalizeOrder = (raw = {}) => {
  // Prefer arrays under different keys
  const itemsRaw = raw.items ?? raw.orderItems ?? raw.products ?? raw.items ?? [];

  const items = (Array.isArray(itemsRaw) ? itemsRaw : []).map(it => {
    // API sometimes returns item as { product: {...}, quantity }
    const productObj = it.product ?? it.productObj ?? {};
    const productImage =
      (productObj.images && Array.isArray(productObj.images) && productObj.images[0]) ||
      productObj.image ||
      it.image ||
      placeholderImage;

    const productName = productObj.name || it.name || it.productName || 'Unknown product';
    const productId = productObj._id || it.productId || it.id || it._id || null;
    const quantity = it.quantity ?? it.qty ?? 1;
    const price = Number(productObj.price ?? it.price ?? 0);
    const vendorData = it.vendor ?? productObj.vendor ?? null;
    const vendorId = (vendorData && (vendorData._id || vendorData.id)) || (raw.vendor && (raw.vendor._id || raw.vendor.id)) || null;
    const vendorName = vendorData ? (vendorData.name || vendorData.vendorName || '') : (raw.vendor?.name ?? '');
    const ratingFromApi = it.rating ?? it.reviewRating ?? productObj.rating ?? productObj.avgRating ?? 0;
    const numericRating = typeof ratingFromApi === 'string' ? parseFloat(ratingFromApi) : (ratingFromApi || 0);
    const canReview = ['paid', 'Paid', 'completed', 'Completed', 'in-process', 'In-process'].includes(raw.orderStatus ?? raw.status ?? '');

    return {
      id: it._id ?? productId ?? Math.random().toString(36).slice(2, 9),
      productName,
      productImage,
      quantity,
      price,
      productId,
      vendorId,
      vendorName,
      canReview,
      rating: Number.isFinite(numericRating) ? Math.max(0, Math.min(5, numericRating)) : 0,
      raw: it
    };
  });

  // vendors[] may be present from order-details endpoint
  const vendorsArray = Array.isArray(raw.vendors) ? raw.vendors : (raw.vendors ? [raw.vendors] : []);

  // calculate subtotal from items if API didn't provide
  const subtotalFromItems = items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 1)), 0);

  // summary fields: try many possible names
  const topSubtotal = Number(raw.subtotal ?? raw.itemsSubtotal ?? raw.totalPrice ?? raw.sub_total ?? subtotalFromItems ?? 0);
  const coupon = Number(raw.discount ?? raw.couponDiscount ?? raw.coupon ?? 0);
  // delivery: try per-vendor(s) else global
  const deliveryFromOrder = Number(raw.deliveryCharge ?? raw.shippingCharge ?? raw.delivery ?? 0);

  // If vendors array contains deliveryCharge entries, sum them
  const vendorDeliverySum = vendorsArray.length
    ? vendorsArray.reduce((s, v) => s + (Number(v.deliveryCharge ?? v.delivery ?? 0)), 0)
    : 0;

  const delivery = vendorDeliverySum || deliveryFromOrder || 0;

  // final total fallback
  const topTotal = Number(raw.totalPrice ?? raw.total ?? raw.grandTotal ?? raw.amount ?? (topSubtotal - coupon + delivery));

  return {
    id: raw._id ?? raw.id ?? raw.orderId ?? null,
    orderNumber: raw.orderId ?? raw.orderNumber ?? `#${String(raw._id ?? '').slice(0, 6)}`,
    deliveryBy: raw.deliveryDate ?? raw.shippingDate ?? raw.createdAt ?? raw.deliveryAt ?? raw.deliveryDate ?? '',
    orderStatus: raw.orderStatus ?? raw.status ?? 'Pending',
    shipping: {
      name: raw.shipping?.name ?? raw.customerName ?? raw.shipTo?.name ?? 'Recipient',
      address: raw.shipping?.address ?? raw.shippingAddress ?? raw.shipTo?.address ?? raw.address ?? '',
      phone: raw.shipping?.phone ?? raw.phone ?? raw.contact ?? ''
    },
    vendors: vendorsArray.map(v => ({
      id: v.id ?? v._id ?? v.vendorId,
      name: v.name ?? v.vendorName ?? v.vendor?.name ?? '',
      phone: v.mobileNumber ?? v.phone ?? v.mobile ?? '',
      address: v.address ?? v.location ?? {},
      avatar: v.profilePicture ?? v.profileImage ?? v.avatar ?? null,
      deliveryCharge: Number(v.deliveryCharge ?? v.delivery ?? 0),
      raw: v
    })),
    // summary values normalized
    summary: {
      subtotal: topSubtotal,
      coupon: coupon,
      delivery,
      total: topTotal
    },
    items,
    raw
  };
};

const ViewOrderDetails = () => {
  const route = useRoute();
  const navigation = useNavigation();

  const paramOrder = route.params?.order ?? null;
  const paramOrderId = route.params?.orderId ?? route.params?.id ?? null;

  const [order, setOrder] = useState(paramOrder ? normalizeOrder(paramOrder) : null);
  const [loading, setLoading] = useState(!paramOrder && !!paramOrderId);
  const [error, setError] = useState(null);

  // Review modal states & image upload (kept from your code)
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch a single order (robustly tries several endpoints)
  const fetchOrderById = async (orderId) => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const tryUrls = [
        `${API_BASE}/api/buyer/orders/${orderId}`,
        `${API_BASE}/api/buyer/orders/${orderId}/details`,
        `${API_BASE}/api/buyer/orders/find/${orderId}`
      ];

      let resp = null;
      for (let i = 0; i < tryUrls.length; i++) {
        try {
          const url = tryUrls[i];
          resp = await axios.get(url, { headers, timeout: 10000 });
          if (resp?.data) break;
          resp = null;
        } catch (err) {
          resp = null;
        }
      }

      // fallback: fetch list and find by id
      if (!resp) {
        const listUrls = [
          `${API_BASE}/api/buyer/orders`,
          `${API_BASE}/api/orders`,
          `${API_BASE}/api/buyer/orders/`
        ];
        let listResp = null;
        for (let i = 0; i < listUrls.length; i++) {
          try {
            listResp = await axios.get(listUrls[i], { headers, timeout: 10000 });
            if (listResp?.data) break;
            listResp = null;
          } catch (err) {
            listResp = null;
          }
        }
        if (!listResp) throw new Error('Failed to fetch orders list');
        const arr = listResp?.data?.orders ?? listResp?.data?.data ?? listResp?.data ?? [];
        const found = (arr || []).find(o => String(o._id) === String(orderId) || String(o.orderId) === String(orderId));
        if (!found) throw new Error('Order not found in list');
        setOrder(normalizeOrder(found));
        return;
      }

      const payload = resp.data?.order ?? resp.data?.data ?? resp.data;
      if (!payload) throw new Error('Invalid response from server');

      // Some endpoints wrap object inside `order` or `data`
      const rawOrder = Array.isArray(payload) ? payload[0] : payload;
      setOrder(normalizeOrder(rawOrder));
    } catch (err) {
      console.error('fetchOrderById error', err);
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!order && paramOrderId) fetchOrderById(paramOrderId);
    if (paramOrder && !order) setOrder(normalizeOrder(paramOrder));
  }, [paramOrderId, paramOrder]);

  const goBack = () => navigation.goBack();

  // Review modal helpers (kept similar to your flow)
  const openReviewModal = (productId) => {
    setSelectedProductId(productId);
    setReviewModalVisible(true);
    Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  };
  const closeReviewModal = () => {
    Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 300, useNativeDriver: true }).start(() => {
      setReviewModalVisible(false);
      setReviewRating(0); setReviewText(''); setUploadedImages([]); setSelectedProductId(null);
    });
  };
  const handleReviewRating = (rating) => setReviewRating(rating);

  // Submit review (same approach as you had)
  const submitReview = async () => {
    if (reviewRating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }
    try {
      setSubmitLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) { Alert.alert('Error','User not logged in.'); setSubmitLoading(false); return; }
      if (!selectedProductId) { Alert.alert('Error','Product id missing.'); setSubmitLoading(false); return; }

      const form = new FormData();
      form.append('orderId', order?.id || '');
      form.append('productId', selectedProductId);
      form.append('rating', String(reviewRating));
      form.append('comment', reviewText || '');

      if (Array.isArray(uploadedImages) && uploadedImages.length > 0) {
        uploadedImages.forEach((img) => {
          const uri = img.uri || img.uriString || (img.assets && img.assets[0]?.uri);
          if (!uri) return;
          const filename = uri.split('/').pop().split('?')[0];
          const match = /\.(\w+)$/.exec(filename);
          const ext = match ? match[1].toLowerCase() : 'jpg';
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : `image/${ext}`;
          form.append('images', { uri, name: filename, type: mime });
        });
      }

      const response = await axios.post(`${API_BASE}/api/buyer/reviews/${selectedProductId}`, form, {
        headers: { Authorization: `Bearer ${await AsyncStorage.getItem('userToken')}`, 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      });

      if (response.status === 200 || response.status === 201 || response.data?.success) {
        Alert.alert('Review Submitted', 'Thank you for your review!');
        closeReviewModal();
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Error submitting review:', err.response?.data ?? err.message ?? err);
      const serverMsg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null);
      Alert.alert('Error', serverMsg || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Image picker helpers (same as your implementation)
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera and photo library permissions to upload images.');
      return false;
    }
    return true;
  };

  const selectImage = async () => {
    if (uploadedImages.length >= 5) { Alert.alert('Limit Reached', 'You can upload maximum 5 images.'); return; }
    const hasPermission = await requestPermissions(); if (!hasPermission) return;
    Alert.alert('Select Image', 'Choose an option', [
      { text: 'Camera', onPress: () => openCamera() },
      { text: 'Gallery', onPress: () => openGallery() },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };
  const openCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 0.8 });
      if (!result.canceled) setUploadedImages(prev => [...prev, result.assets[0]]);
    } catch (err) { Alert.alert('Error', 'Failed to open camera.'); }
  };
  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 0.8 });
      if (!result.canceled) setUploadedImages(prev => [...prev, result.assets[0]]);
    } catch (err) { Alert.alert('Error', 'Failed to open gallery.'); }
  };

  const removeImage = (index) => {
    Alert.alert('Remove Image','Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setUploadedImages(prev => prev.filter((_,i)=>i!==index)) }
    ]);
  };

  // Formatters
  const formatDateSafe = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    return dt.toLocaleDateString('en-US', options);
  };
  const formatCurrency = (n) => {
    const num = Number(n || 0);
    return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  // UI early returns for loading/error
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.back} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={{ marginTop: 12, color: '#666' }}>Loading order...</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.back} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={60} color="#F44336" />
          <Text style={{ color: '#F44336', marginTop: 12, marginBottom: 12, textAlign: 'center', fontSize: 14 }}>{error}</Text>
          <TouchableOpacity onPress={() => { setError(null); if (paramOrderId) fetchOrderById(paramOrderId); }} style={styles.retryButton}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.back} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Text style={{ color: '#666' }}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Destructure normalized order
  const { orderNumber, deliveryBy, items, shipping, vendors, summary, orderStatus } = order;

  // Helper to show vendor section (if multiple vendors, show first and allow listing)
  const renderVendorsBlock = () => {
    if (!Array.isArray(vendors) || vendors.length === 0) {
      // Attempt to infer vendor from items
      const itemVendor = items?.[0]?.raw?.vendor ?? null;
      if (!itemVendor) {
        return (
          <Text style={styles.detailText}>Vendor information not available</Text>
        );
      }
      const v = {
        name: itemVendor.name || itemVendor.vendorName || '',
        phone: itemVendor.mobileNumber || itemVendor.phone || '',
        address: itemVendor.address || ''
      };
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={{ uri: itemVendor.profilePicture || placeholderImage }} style={styles.vendorAvatar} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.detailText}>Name: {v.name || 'N/A'}</Text>
            <Text style={styles.detailText}>Location: {v.address?.locality || v.address?.city || v.address || 'N/A'}</Text>
            <Text style={styles.detailText}>Phone: {v.phone || 'N/A'}</Text>
          </View>
        </View>
      );
    }

    // If vendors array has more than one vendor, show them all
    return vendors.map((v, idx) => (
      <View key={v.id || idx} style={{ marginBottom: moderateScale(8) }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Image source={{ uri: v.avatar || placeholderImage }} style={styles.vendorAvatar} />
          <View style={{ marginLeft: moderateScale(12), flex: 1 }}>
            <Text style={styles.detailText}>Name: {v.name || 'N/A'}</Text>
            <Text style={styles.detailText}>Location: {v.address?.locality || v.address?.city || ''}</Text>
            <Text style={styles.detailText}>Phone: {v.phone || 'N/A'}</Text>
            <Text style={styles.detailSubText}>Delivery charge: {formatCurrency(v.deliveryCharge || 0)}</Text>
          </View>
        </View>
      </View>
    ));
  };

  // Compute a defensive item subtotal (if summary.subtotal seems missing)
  const computedSubtotal = summary?.subtotal ?? items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
  const computedCoupon = summary?.coupon ?? Number(order.raw?.discount ?? 0);
  // delivery taken from normalized summary (already sums vendor delivery charges if present)
  const computedDelivery = summary?.delivery ?? 0;
  const computedTotal = summary?.total ?? (computedSubtotal - computedCoupon + computedDelivery);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Order Status Header */}
        <View style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '700'  }}>{orderStatus}</Text>
            <Text style={{ color: '#666' ,fontSize:normalizeFont(12)}}>{orderNumber}</Text>
          </View>
        </View>

        {/* Delivery Info */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.deliveryLabel}>Delivery by</Text>
            <Text style={styles.deliveryDate}>{formatDateSafe(deliveryBy)}</Text>
          </View>
        </View>

        {/* Items Section */}
        <View style={{ marginTop: 16 }}>
          <DetailCard title="Items">
            {items.length === 0 ? (
              <View style={{ padding: 12 }}>
                <Text style={{ color: '#666' }}>No items found in this order.</Text>
              </View>
            ) : (
              items.map((it, index) => (
                <View key={String(it.id)}>
                  <TouchableOpacity
                    style={styles.itemRow}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('ViewOrderProduct', { productId: it.productId, orderId: order?.id })}
                  >
                    <Image source={{ uri: it.productImage || placeholderImage }} style={styles.itemImage} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.itemName}>{it.productName}</Text>
                      <Text style={styles.itemMeta}>Qty: {it.quantity} {it.raw?.unit ?? ''}</Text>
                      <Text style={styles.itemMeta}>Price: {formatCurrency(it.price)}</Text>
                      {it.vendorName ? <Text style={{ fontSize: 11, color: '#999', marginTop: 4 }}>By: {it.vendorName}</Text> : null}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </TouchableOpacity>

                  {it.canReview && (
                    <View style={styles.ratingRow}>
                      <Text style={styles.rateText}>Rate this item</Text>
                      <Image source={require("../assets/via-farm-img/icons/satar.png")} />
                      <Image source={require("../assets/via-farm-img/icons/satar.png")} />
                      <Image source={require("../assets/via-farm-img/icons/satar.png")} />
                      <Image source={require("../assets/via-farm-img/icons/satar.png")} />
                      <Image source={require("../assets/via-farm-img/icons/satar.png")} />
                      <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={() => openReviewModal(it.productId)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center',gap:5}}>
                          <Text style={styles.reviewText}>Write a review</Text>
                          <Image source={require('../assets/via-farm-img/icons/see.png')} />
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}

                  {index < items.length - 1 && <View style={{ height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 }} />}
                </View>
              ))
            )}
          </DetailCard>
        </View>

        {/* Vendor Details */}
        <View style={{ marginTop: 14 }}>
          <DetailCard title="Vendor Details">
            {renderVendorsBlock()}
          </DetailCard>
        </View>

        {/* Order Summary */}
        <View style={{ marginTop: 14, marginBottom: 30 }}>
          <DetailCard title="Order Summary">
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Item(s) Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(computedSubtotal)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Coupon / Discount</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                -{formatCurrency(computedCoupon)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Charge</Text>
              <Text style={styles.summaryValue}>{formatCurrency(computedDelivery)}</Text>
            </View>

            <View style={[styles.summaryRow, { marginTop: moderateScale(8) }]}>
              <Text style={[styles.summaryLabel, { fontWeight: '700', fontSize: normalizeFont(13) }]}>Total Amount</Text>
              <Text style={[styles.summaryValue, { fontWeight: '700', fontSize: normalizeFont(13), color: '#4CAF50' }]}>
                {formatCurrency(computedTotal)}
              </Text>
            </View>
          </DetailCard>
        </View>
      </ScrollView>

      {/* Review Modal (kept as earlier) */}
      <Modal visible={reviewModalVisible} transparent animationType="none" onRequestClose={closeReviewModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeReviewModal} />
          <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.modalHandle} />
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalProductSection}>
                <View style={styles.modalProductImageContainer}>
                  <Image source={{ uri: selectedProductId && order ? order.items.find(item => item.productId === selectedProductId)?.productImage : placeholderImage }} style={styles.modalProductImage} />
                </View>
              </View>

              <Text style={styles.modalRateText}>Rate this item <Text style={styles.modalRequired}>*</Text></Text>
              <View style={styles.modalStarsContainer}>
                {[1,2,3,4,5].map(star => (
                  <TouchableOpacity key={star} onPress={() => handleReviewRating(star)} style={styles.modalStarButton}>
                    <Ionicons name={star <= reviewRating ? 'star' : 'star-outline'} size={scale(36)} color={star <= reviewRating ? '#FFD700' : '#E0E0E0'} />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalImageText}>Add images of the product</Text>

              {uploadedImages.length > 0 && (
                <View style={styles.uploadedImagesContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {uploadedImages.map((image, index) => (
                      <View key={index} style={styles.uploadedImageWrapper}>
                        <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
                        <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                          <Ionicons name="close-circle" size={scale(20)} color="#FF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              <TouchableOpacity style={styles.modalImageUpload} onPress={selectImage}>
                <View style={styles.modalImageUploadContent}>
                  <Ionicons name="camera-outline" size={32} color="#999" />
                  <Text style={styles.modalImageUploadText}>Add other photos of your product (max 5)</Text>
                  <Text style={styles.modalImageCount}>{uploadedImages.length}/5 images uploaded</Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.modalReviewText}>Write a review</Text>
              <TextInput style={styles.modalReviewInput} placeholder="Share your experience with this product..." placeholderTextColor="#999" value={reviewText} onChangeText={setReviewText} multiline numberOfLines={6} textAlignVertical="top" />

              <TouchableOpacity style={styles.modalSubmitButton} onPress={submitReview}>
                <Text style={styles.modalSubmitButtonText}>{submitLoading ? 'Submitting...' : '✓ Submit'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: scale(56),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    justifyContent: 'space-between'
  },
  back: {
    width: scale(36),
    height: scale(36),
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: { fontSize: normalizeFont(14), fontWeight: '700', color: '#333' },

  container: {
    padding: moderateScale(14),
    backgroundColor: '#fff'
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  deliveryLabel: { color: '#37aa5c', fontWeight: '700', marginBottom: moderateScale(4) },
  deliveryDate: { color: '#666' },
  orderNo: { fontWeight: '700', color: '#333' },

  itemRow: {
    flexDirection: 'row',
    backgroundColor: '#f6f6f6',
    padding: moderateScale(10),
    borderRadius: 8,
    marginBottom: moderateScale(10),
    alignItems: 'center'
  },
  itemImage: {
    width: Math.min(86, width * 0.22),
    height: Math.min(86, width * 0.22),
    borderRadius: 8,
    backgroundColor: '#eee'
  },
  itemName: { fontWeight: '700', fontSize: normalizeFont(13), color: '#222' },
  itemMeta: { color: '#666', fontSize: normalizeFont(11), marginTop: moderateScale(4) },

  ratingRow: {
    marginTop: moderateScale(8),
    flexDirection: 'row',
    alignItems: 'center'
  },
  rateText: { color: 'rgba(1, 151, 218, 1)', marginRight: 8, fontSize: normalizeFont(12) },
  reviewLink: { marginLeft: 'auto' },
  reviewText: { color: 'rgba(1, 151, 218, 1)', },

  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: moderateScale(12),
    backgroundColor: '#fff'
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: moderateScale(8),
    color: '#333'
  },

  detailName: { fontWeight: '700', fontSize: normalizeFont(12), color: '#222' },
  detailText: { color: '#666', marginTop: moderateScale(4), fontSize: normalizeFont(11) },

  vendorAvatar: {
    width:scale(56),
    height:scale(56),
    marginTop:moderateScale(5),
    borderRadius: 8,
    backgroundColor: '#eee'
  },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: moderateScale(8) },
  summaryLabel: { color: '#666' },
  summaryValue: { color: '#222' },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(10),
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    maxHeight: SCREEN_HEIGHT * 0.88,
    borderWidth: 2,
    borderColor: 'rgba(255, 202, 40, 0.5)',
  },
  modalHandle: {
    width: scale(40),
    height: scale(4),
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  modalContent: {
    padding: moderateScale(10),
    paddingBottom: moderateScale(40),
    flex: 1,
  },
  modalProductSection: {
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  modalProductImageContainer: {
    width: scale(110),
    height: scale(110),
    borderRadius: moderateScale(60),
    overflow: 'hidden',
    backgroundColor: '#FFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalProductImage: {
    width: '100%',
    height: '100%',
  },
  modalRateText: {
    fontSize: normalizeFont(16),
    color: '#333',
    marginBottom: moderateScale(12),
    fontWeight: '500',
  },
  modalRequired: {
    color: '#f44336',
    fontSize: normalizeFont(14),
  },
  modalStarsContainer: {
    flexDirection: 'row',
    marginBottom: moderateScale(24),
    justifyContent: 'flex-start',
    gap: scale(8),
  },
  modalStarButton: {
    padding: moderateScale(4),
  },
  modalImageText: {
    fontSize: normalizeFont(12),
    color: '#333',
    marginBottom: moderateScale(12),
    fontWeight: '500',
  },
  modalImageUpload: {
    borderWidth: 2,
    borderColor: 'rgba(255, 202, 40, 0.5)',
    borderRadius: 8,
    padding: moderateScale(20),
    marginBottom: moderateScale(24),
    backgroundColor: '#fff',
  },
  modalImageUploadContent: {
    alignItems: 'center',
  },
  modalImageUploadText: {
    fontSize: normalizeFont(11),
    color: '#999',
    textAlign: 'center',
    marginTop: moderateScale(8),
  },
  modalImageCount: {
    fontSize: normalizeFont(10),
    color: '#666',
    textAlign: 'center',
    marginTop: moderateScale(4),
    fontWeight: '500',
  },
  uploadedImagesContainer: {
    marginBottom: moderateScale(13),
  },
  uploadedImageWrapper: {
    position: 'relative',
    marginRight: moderateScale(12),
  },
  uploadedImage: {
    width: scale(75),
    height: scale(75),
    borderRadius: moderateScale(8),
    backgroundColor: '#F5F5F5',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFF',
    borderRadius: moderateScale(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  modalReviewText: {
    fontSize: normalizeFont(12),
    color: '#333',
    marginBottom: moderateScale(12),
    fontWeight: '500',
  },
  modalReviewInput: {
    borderWidth: 1,
    borderColor: 'rgba(255, 202, 40, 0.5)',
    borderRadius: 8,
    padding: moderateScale(12),
    fontSize: normalizeFont(12),
    color: '#333',
    backgroundColor: '#FFF',
    marginBottom: moderateScale(24),
    minHeight: scale(100),
  },
  modalSubmitButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    paddingVertical: moderateScale(16),
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    color: '#FFF',
    fontSize: normalizeFont(14),
    fontWeight: '600',
  },
});

export default ViewOrderDetails;