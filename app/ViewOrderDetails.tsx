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

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const placeholderImage = 'https://media.licdn.com/dms/image/v2/D4E03AQFGq7-JPZSEYg/profile-displayphoto-shrink_200_200/B4EZdDeyJHGcAY-/0/1749183835222?e=2147483647&v=beta&t=qprTD0p_Mev28VSY-gb0DnzwPBIqQtRoZX24FfmMnQM';
const API_BASE = 'https://viafarm-1.onrender.com';

// Star Row Component


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

// Detail Card Component
const DetailCard = ({ children, title }) => (
  <View style={styles.card}>
    {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
    {children}
  </View>
);

// Robust normalize function
const normalizeOrder = (raw = {}) => {
  const itemsRaw = raw.items ?? raw.orderItems ?? raw.products ?? [];

  const items = (Array.isArray(itemsRaw) ? itemsRaw : []).map(item => {
    const productObj = item.product ?? item.productObj ?? {};
    const ratingFromApi = item.rating ?? item.reviewRating ?? productObj.rating ?? productObj.avgRating ?? 0;
    const numericRating = typeof ratingFromApi === 'string' ? parseFloat(ratingFromApi) : (ratingFromApi || 0);

    const productImage =
      (productObj.images && Array.isArray(productObj.images) && productObj.images[0]) ||
      productObj.image ||
      item.image ||
      item.thumbnail ||
      placeholderImage;

    const productName = productObj.name || item.productName || item.name || 'Unknown Product';
    const productId = productObj._id || item.productId || item._id || null;
    const quantity = item.quantity ?? item.qty ?? 1;
    const price = productObj.price ?? item.price ?? item.rate ?? 0;
    const vendorName = item.vendor?.name || productObj.vendor?.name || raw.vendor?.name || 'Unknown Vendor';

    const status = raw.orderStatus ?? raw.status ?? raw.order_state ?? '';
    const canReview = ['paid', 'Paid', 'completed', 'Completed', 'in-process', 'In-process'].includes(status);

    return {
      id: item._id ?? productId ?? Math.random().toString(36).slice(2, 9),
      productName,
      productImage,
      quantity,
      price,
      productId,
      vendorName,
      canReview,
      rating: Number.isFinite(numericRating) ? Math.max(0, Math.min(5, numericRating)) : 0,
      raw: item
    };
  });

  return {
    id: raw._id ?? raw.id ?? raw.orderId ?? null,
    orderNumber: raw.orderId ?? raw.orderNumber ?? `#${String(raw._id ?? '').slice(0, 6)}`,
    deliveryBy: raw.deliveryDate ?? raw.shippingDate ?? raw.createdAt ?? raw.deliveryAt ?? '',
    orderStatus: raw.orderStatus ?? raw.status ?? 'Pending',
    shipping: {
      name: raw.shipping?.name ?? raw.customerName ?? raw.shipTo?.name ?? 'Recipient',
      address: raw.shipping?.address ?? raw.shippingAddress ?? raw.shipTo?.address ?? raw.address ?? '',
      phone: raw.shipping?.phone ?? raw.phone ?? raw.contact ?? ''
    },
    vendor: {
      name: raw.vendor?.name ?? raw.vendorName ?? '',
      address: raw.vendor?.address ?? '',
      phone: raw.vendor?.phone ?? '',
      avatar: raw.vendor?.avatar ?? raw.vendor?.image ?? null
    },
    summary: {
      subtotal: raw.subtotal ?? raw.itemsSubtotal ?? raw.totalPrice ?? raw.sub_total ?? 0,
      coupon: raw.couponDiscount ?? raw.coupon ?? 0,
      delivery: raw.deliveryCharge ?? raw.shippingCharge ?? raw.delivery ?? 0,
      total: raw.totalPrice ?? raw.total ?? raw.grandTotal ?? raw.amount ?? 0
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

  // Review Modal States
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch single order by id
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
          if (resp?.data) {
            break;
          } else {
            resp = null;
          }
        } catch (err) {
          resp = null;
        }
      }

      // Fallback: fetch list and find by id
      if (!resp) {
        const listUrls = [
          `${API_BASE}/api/buyer/orders`,
          `${API_BASE}/api/orders`,
          `${API_BASE}/orders`
        ];
        let listResp = null;
        for (let i = 0; i < listUrls.length; i++) {
          try {
            listResp = await axios.get(listUrls[i], { headers, timeout: 10000 });
            if (listResp?.data) break;
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

      // Pick data from response
      const payload = resp.data?.order ?? resp.data?.data ?? resp.data;
      if (!payload) throw new Error('Invalid response from server');

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
    if (!order && paramOrderId) {
      fetchOrderById(paramOrderId);
    }
    if (paramOrder && !order) {
      setOrder(normalizeOrder(paramOrder));
    }
  }, [paramOrderId, paramOrder]);

  const goBack = () => navigation.goBack();

  // Open Review Modal
  const openReviewModal = (productId) => {
    setSelectedProductId(productId);
    setReviewModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Close Review Modal
  const closeReviewModal = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setReviewModalVisible(false);
      setReviewRating(0);
      setReviewText('');
      setUploadedImages([]);
      setSelectedProductId(null);
    });
  };

  // Handle Review Rating
  const handleReviewRating = (rating) => {
    setReviewRating(rating);
  };

  // Submit Review
  const submitReview = async () => {
    if (reviewRating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    try {
      setSubmitLoading(true);

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'User not logged in. Please log in again.');
        setSubmitLoading(false);
        return;
      }

      if (!selectedProductId) {
        Alert.alert('Error', 'Product id missing. Cannot submit review.');
        setSubmitLoading(false);
        return;
      }

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

          form.append('images', {
            uri,
            name: filename,
            type: mime,
          });
        });
      }

      const response = await axios.post(
        `${API_BASE}/api/buyer/reviews/${selectedProductId}`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        }
      );

      if (response.status === 200 || response.status === 201 || response.data?.success) {
        Alert.alert('Review Submitted', 'Thank you for your review!');
        closeReviewModal();
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to submit review. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting review:', err.response?.data ?? err.message ?? err);
      const serverMsg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null);
      Alert.alert('Error', serverMsg || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Request permissions
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera and photo library permissions to upload images.');
      return false;
    }
    return true;
  };

  // Handle image selection
  const selectImage = async () => {
    if (uploadedImages.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload maximum 5 images.');
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const openCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploadedImages(prev => [...prev, result.assets[0]]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploadedImages(prev => [...prev, result.assets[0]]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
    }
  };

  const removeImage = (index) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setUploadedImages(prev => prev.filter((_, i) => i !== index));
          }
        }
      ]
    );
  };

  // Render modal stars
  const renderModalStars = () => {
    return (
      <View style={styles.modalStarsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleReviewRating(star)}
            style={styles.modalStarButton}
          >
            <Ionicons
              name={star <= reviewRating ? "star" : "star-outline"}
              size={36}
              color={star <= reviewRating ? "#FFD700" : "#E0E0E0"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

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
          <Text style={{ color: '#F44336', marginTop: 12, marginBottom: 12, textAlign: 'center', fontSize: 14 }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setError(null);
              if (paramOrderId) fetchOrderById(paramOrderId);
            }}
            style={styles.retryButton}
          >
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

  const { orderNumber, deliveryBy, items, shipping, vendor, summary, orderStatus } = order;

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
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text>{orderStatus}</Text>
            <Text>{orderNumber}</Text>
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
                    onPress={() => navigation.navigate('ViewOrderProduct', {
                      productId: it.productId,
                      orderId: order?.id
                    })}
                  >
                    <Image source={{ uri: it.productImage || placeholderImage }} style={styles.itemImage} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.itemName}>{it.productName}</Text>
                      <Text style={styles.itemMeta}>Qty: {it.quantity} pc</Text>
                      <Text style={styles.itemMeta}>Price: {formatCurrency(it.price)}</Text>
                      {it.vendorName && <Text style={{ fontSize: 11, color: '#999', marginTop: 4 }}>By: {it.vendorName}</Text>}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </TouchableOpacity>

                  {/* Rating & Review Section - ONLY for reviewable items */}
                  {it.canReview && (
                    <View style={styles.ratingRow}>
                      <Text style={styles.rateText}>Rate this item</Text>
                      {/* <StarRow value={it.rating} size={16} /> */}
                      <Image  source={require("../assets/via-farm-img/icons/satar.png")} />
                      <Image  source={require("../assets/via-farm-img/icons/satar.png")} />
                      <Image  source={require("../assets/via-farm-img/icons/satar.png")} />
                      <Image  source={require("../assets/via-farm-img/icons/satar.png")} />
                      <Image  source={require("../assets/via-farm-img/icons/satar.png")} />
                      <TouchableOpacity
                        style={{ marginLeft: 'auto' }}
                        onPress={() => openReviewModal(it.productId)}
                      >
                        <View style={{flexDirection:'row',alignItems:'center',gap:5}}>
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

        {/* Shipping Details */}
        {/* <View style={{ marginTop: 14 }}>
          <DetailCard title="Ship to">
            <Text style={styles.detailName}>{shipping.name}</Text>
            <Text style={styles.detailText}>{shipping.address}</Text>
            <Text style={styles.detailText}>Phone: {shipping.phone}</Text>
          </DetailCard>
        </View> */}

        {/* Vendor Details */}
        <View style={{ marginTop: 14 }}>
          <DetailCard title="Vendor Details">
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Image source={{ uri: vendor.avatar || placeholderImage }} style={styles.vendorAvatar} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.detailText}>Name:{vendor.name || "Sanjay Kumar Chauhan"}</Text>
                <Text style={styles.detailText}>Location:{vendor.address || "480/2 Delhi Uttam Namger"}</Text>
                <Text style={styles.detailText}>Phone: {vendor.phone || 7355319780}</Text>
              </View>
            </View>
          </DetailCard>
        </View>

        {/* Order Summary */}
        <View style={{ marginTop: 14, marginBottom: 30 }}>
          <DetailCard title="Order Summary">
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Item(s) Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(summary.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Coupon Discount</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                -{formatCurrency(summary.coupon)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Charge</Text>
              <Text style={styles.summaryValue}>{formatCurrency(summary.delivery)}</Text>
            </View>

            <View style={[styles.summaryRow]}>
              <Text style={[styles.summaryLabel, { fontWeight: '700', fontSize: 16 }]}>Total Amount</Text>
              <Text style={[styles.summaryValue, { fontWeight: '700', fontSize: 16, color: '#4CAF50' }]}>
                {formatCurrency(summary.total)}
              </Text>
            </View>
          </DetailCard>
        </View>
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={reviewModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeReviewModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeReviewModal}
          />
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.modalHandle} />

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Product Image */}
              <View style={styles.modalProductSection}>
                <View style={styles.modalProductImageContainer}>
                  <Image
                    source={{
                      uri: selectedProductId && order ?
                        order.items.find(item => item.productId === selectedProductId)?.productImage :
                        'https://via.placeholder.com/150'
                    }}
                    style={styles.modalProductImage}
                  />
                </View>
              </View>

              {/* Rating Section */}
              <Text style={styles.modalRateText}>
                Rate this item <Text style={styles.modalRequired}>*</Text>
              </Text>
              {renderModalStars()}

              {/* Image Upload Section */}
              <Text style={styles.modalImageText}>Add images of the product</Text>

              {uploadedImages.length > 0 && (
                <View style={styles.uploadedImagesContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {uploadedImages.map((image, index) => (
                      <View key={index} style={styles.uploadedImageWrapper}>
                        <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => removeImage(index)}
                        >
                          <Ionicons name="close-circle" size={20} color="#FF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              <TouchableOpacity style={styles.modalImageUpload} onPress={selectImage}>
                <View style={styles.modalImageUploadContent}>
                  <Ionicons name="camera-outline" size={32} color="#999" />
                  <Text style={styles.modalImageUploadText}>
                    Add other photos of your product (max 5)
                  </Text>
                  <Text style={styles.modalImageCount}>
                    {uploadedImages.length}/5 images uploaded
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Review Text */}
              <Text style={styles.modalReviewText}>Write a review</Text>
              <TextInput
                style={styles.modalReviewInput}
                placeholder="Share your experience with this product..."
                placeholderTextColor="#999"
                value={reviewText}
                onChangeText={setReviewText}
                multiline={true}
                numberOfLines={6}
                textAlignVertical="top"
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={submitReview}
              >
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
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between'
  },
  back: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#333' },

  container: {
    padding: 14,
    backgroundColor: '#fff'
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  deliveryLabel: { color: '#37aa5c', fontWeight: '700', marginBottom: 4 },
  deliveryDate: { color: '#666' },
  orderNo: { fontWeight: '700', color: '#333' },

  itemRow: {
    flexDirection: 'row',
    backgroundColor: '#f6f6f6',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center'
  },
  itemImage: {
    width: Math.min(86, width * 0.22),
    height: Math.min(86, width * 0.22),
    borderRadius: 8,
    backgroundColor: '#eee'
  },
  itemName: { fontWeight: '700', fontSize: 15, color: '#222' },
  itemMeta: { color: '#666', fontSize: 12, marginTop: 4 },

  ratingRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  rateText: { color: '#444', marginRight: 8, fontSize: 12 },
  reviewLink: { marginLeft: 'auto' },
  reviewText: { color: '#1a8ad6', fontWeight: '600' },

  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff'
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 8,
    color: '#333'
  },

  detailName: { fontWeight: '700', fontSize: 14, color: '#222' },
  detailText: { color: '#666', marginTop: 4, fontSize: 13 },

  vendorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#eee'
  },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  summaryLabel: { color: '#666' },
  summaryValue: { color: '#222' },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.88,
    borderWidth: 2,
    borderColor: 'rgba(255, 202, 40, 0.5)',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalContent: {
    padding: 10,
    paddingBottom: 40,
    flex: 1,
  },
  modalProductSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  modalProductImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 60,
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
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    fontWeight: '500',
  },
  modalRequired: {
    color: '#f44336',
    fontSize: 16,
  },
  modalStarsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    justifyContent: 'flex-start',
    gap: 8,
  },
  modalStarButton: {
    padding: 4,
  },
  modalImageText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    fontWeight: '500',
  },
  modalImageUpload: {
    borderWidth: 2,
    borderColor: 'rgba(255, 202, 40, 0.5)',
    borderRadius: 8,
    padding: 20,
    marginBottom: 24,
    backgroundColor: '#fff',
  },
  modalImageUploadContent: {
    alignItems: 'center',
  },
  modalImageUploadText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  modalImageCount: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  uploadedImagesContainer: {
    marginBottom: 16,
  },
  uploadedImageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFF',
    borderRadius: 10,
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
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    fontWeight: '500',
  },
  modalReviewInput: {
    borderWidth: 1,
    borderColor: 'rgba(255, 202, 40, 0.5)',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FFF',
    marginBottom: 24,
    minHeight: 100,
  },
  modalSubmitButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ViewOrderDetails;