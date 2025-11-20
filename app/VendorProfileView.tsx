// VendorProfileViewDetails.jsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, normalizeFont, scale } from './Responsive';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://your-api.com';

const VendorProfileViewDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const rawParams = route.params || {};
  const vendorFromParams =
    rawParams.user || rawParams.vendor || rawParams.userData || rawParams;

  const [vendor, setVendor] = useState(vendorFromParams || null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setVendor(vendorFromParams || null);
  }, [route.params]);
  useEffect(() => {
    if (!vendor) return;
    const vendorReviewsList =
      vendor.reviews?.list ?? 
      vendor.reviews ?? 
      vendor.reviewList ?? 
      null;

    if (Array.isArray(vendorReviewsList) && vendorReviewsList.length > 0) {
      setReviews(vendorReviewsList);
      return;
    }
    const vendorId = vendor.id || vendor._id || vendor.vendorId;
    if (vendorId) {
      fetchReviews(vendorId);
    } else {
      setReviews([]);
    }
  }, [vendor]);

  const fetchReviews = async (vendorId) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      const response = await axios.get(`${API_BASE}/api/vendor/${vendorId}/reviews`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });

      // Try common shapes
      if (response?.data?.success && Array.isArray(response.data.reviews)) {
        setReviews(response.data.reviews);
      } else if (Array.isArray(response?.data?.data)) {
        setReviews(response.data.data);
      } else if (Array.isArray(response?.data)) {
        setReviews(response.data);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.log('Error fetching reviews:', err?.message ?? err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  if (!vendor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.noDataText}>No vendor data found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Helpers
  const getImageUri = (v) =>
    v?.profilePicture ||
    v?.image ||
    v?.avatar ||
    (v?.farmImages && Array.isArray(v.farmImages) && v.farmImages[0]) ||
    'https://picsum.photos/800/600';

  const formatAddressObject = (addr) => {
    if (!addr) return '';
    if (typeof addr === 'string') return addr;
    const parts = [];
    if (addr.houseNumber) parts.push(String(addr.houseNumber));
    if (addr.street) parts.push(String(addr.street));
    if (addr.locality) parts.push(String(addr.locality));
    if (addr.city) parts.push(String(addr.city));
    if (addr.district) parts.push(String(addr.district));
    if (addr.state) parts.push(String(addr.state));
    if (addr.pinCode || addr.zip) parts.push(String(addr.pinCode ?? addr.zip));
    return parts.filter(Boolean).join(', ');
  };

  const extractLocationText = (v) => {
    const vendorLocationRaw =
      v.locationText ?? v.addressesText ?? v.address ?? v.addresses ?? v.location ?? v.location_detail ?? null;

    if (!vendorLocationRaw) return 'Location not available';

    if (typeof vendorLocationRaw === 'string') return vendorLocationRaw;

    if (Array.isArray(vendorLocationRaw) && vendorLocationRaw.length > 0) {
      const first = vendorLocationRaw[0];
      return typeof first === 'string' ? first : formatAddressObject(first);
    }

    if (typeof vendorLocationRaw === 'object' && vendorLocationRaw !== null) {
      return formatAddressObject(vendorLocationRaw);
    }

    return 'Location not available';
  };

  // Field fallbacks
  const v = vendor;
  const image = getImageUri(v);
  const vendorLocation = extractLocationText(v);
  const vendorName = v?.name || v?.businessName || 'Vendor';
  const vendorPhone = v?.mobileNumber || v?.phone || v?.contact || 'N/A';
  const vendorUpi = v?.upiId || v?.upi || null;
  const vendorRating = v?.rating ?? v?.ratingValue ?? '—';
  const farmImages = Array.isArray(v?.farmImages) ? v.farmImages : [];

  const ReviewCard = ({ item }) => {
    if (!item) return null;

    const avatarUri =
      item?.user?.profilePicture ||
      item?.profilePicture ||
      item?.avatar ||
      item?.user?.image ||
      'https://via.placeholder.com/50';

    const reviewImages = Array.isArray(item.images) ? item.images : [];

    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.reviewerName} numberOfLines={1}>
              {item?.user?.name || item?.name || 'Anonymous'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center',marginTop:moderateScale(5) }}>
             <Image source={require("../assets/via-farm-img/icons/satar.png")} />
              <Text style={styles.ratingText}>{' '}{item?.rating ?? 'N/A'}</Text>
            </View>
          </View>
          <Text style={styles.reviewDate}>
            {item?.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : 'N/A'}
          </Text>
        </View>

        {reviewImages.length > 0 && (
          <FlatList
            data={reviewImages}
            horizontal
            keyExtractor={(_img, idx) => `img-${idx}`}
            renderItem={({ item: img }) => {
              const uri = typeof img === 'string' ? img : img?.url ?? img?.image ?? '';
              return uri ? <Image source={{ uri }} style={styles.reviewImage} /> : null;
            }}
            showsHorizontalScrollIndicator={false}
            style={{ marginVertical: 8 }}
          />
        )}

        <Text style={styles.reviewComment}>
          {item?.comment || item?.text || item?.message || 'No comment provided.'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageBox}>
          <Image source={{ uri: image }} style={styles.headerImage} />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Vendor Info */}
        <View style={styles.vendorInfo}>
          <View style={styles.vendorHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.vendorName}>{vendorName}</Text>
              <View style={styles.row}>
                <Ionicons name="location-sharp" size={16} color="#757575" />
                <Text style={styles.vendorLocation} numberOfLines={2}>
                  {vendorLocation} {v.distance ? `(${v.distance})` : ''}
                </Text>
              </View>
            </View>

            <View style={styles.ratingBadge}>
              <Image source={require("../assets/via-farm-img/icons/satar.png")} />
              <Text style={styles.vendorRating}>{String(vendorRating)}</Text>
            </View>
          </View>

          {/* Contact Info */}
          {(vendorPhone && vendorPhone !== 'N/A') && (
            <View style={styles.contactInfo}>
              <Image source={require("../assets/via-farm-img/icons/call.png")} />
              <Text style={styles.contactText}>{vendorPhone}</Text>
            </View>
          )}

          {vendorUpi && (
            <View style={styles.contactInfo}>
             <Image source={require(".././/assets/via-farm-img/icons/upi.png")} />
              <Text style={styles.contactText}>{vendorUpi}</Text>
            </View>
          )}

          <Text style={styles.aboutHeader}>About</Text>
          <Text style={styles.aboutText}>
            {v.about || v.description || v.summary || 'No description available.'}
          </Text>

          {/* Small gallery / farm images thumbnails */}
          {farmImages.length > 0 && (
            <>
              {/* <Text style={[styles.aboutHeader, { marginTop: 12 }]}>Photos</Text> */}
              <FlatList
                data={farmImages}
                horizontal
                keyExtractor={(_, idx) => `farm-${idx}`}
                renderItem={({ item }) => <Image source={{ uri: item }} style={styles.thumbImage} />}
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 8 }}
              />
            </>
          )}
        </View>

        {/* Reviews Section */}
        <View style={styles.reviewsContainer}>
          <Text style={styles.allReviewsTitle}>All Reviews ({reviews.length} reviews)</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#4CAF50" style={{ marginVertical: 20 }} />
          ) : reviews && reviews.length > 0 ? (
            <FlatList
              data={reviews}
              keyExtractor={(item, idx) => (item?._id ? String(item._id) : String(idx))}
              renderItem={({ item }) => <ReviewCard item={item} />}
              scrollEnabled={false}
              nestedScrollEnabled={true}
            />
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="star-outline" size={60} color="#ccc" />
              <Text style={styles.noReviewText}>No reviews yet.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default VendorProfileViewDetails;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noDataText: { fontSize: normalizeFont(16), color: '#757575', marginBottom:moderateScale(20) },
  backButton: { paddingHorizontal: moderateScale(20), paddingVertical: moderateScale(10), backgroundColor: '#4CAF50', borderRadius: 5 },
  backButtonText: { color: '#fff', fontSize: normalizeFont(16), fontWeight: 'bold' },

  imageBox: { width: '100%', height: scale(220), position: 'relative' },
  headerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  backBtn: { position: 'absolute', top:moderateScale(40), left: moderateScale(15), backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: moderateScale(20), padding: moderateScale(6) },

  vendorInfo: {
    backgroundColor: '#fff',
    paddingHorizontal: moderateScale(15),
    paddingTop: moderateScale(15),
    paddingBottom: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  vendorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: moderateScale(10) },
  vendorName: { fontSize: normalizeFont(17), fontWeight: 'bold', color: '#333' },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: moderateScale(4) },
  vendorLocation: { fontSize: normalizeFont(11), color: '#757575', marginLeft: moderateScale(5), flex: 1 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center',  paddingHorizontal:8, paddingVertical:4, borderRadius:8, borderWidth:1, borderColor:'rgba(0, 0, 0, 0.4)' },
  vendorRating: { fontSize: normalizeFont(14), fontWeight: 'bold', marginLeft: moderateScale(5), color: '#333' },

  aboutHeader: { fontSize: normalizeFont(13), marginTop: moderateScale(20), color: '#333' },
  aboutText: { fontSize: normalizeFont(12), color: 'rgba(66, 66, 66, 0.7)', marginTop: moderateScale(5), lineHeight: scale(20) },

  contactInfo: { flexDirection: 'row', alignItems: 'center', marginTop:5, paddingTop:5,  },
  contactText: { fontSize: normalizeFont(14), color: '#333', marginLeft: moderateScale(8), fontWeight: '500' },

  thumbImage: { width: scale(86), height: scale(80), borderRadius: moderateScale(8), marginRight: moderateScale(8) },

  reviewsContainer: { padding: moderateScale(15) },
  allReviewsTitle: { fontSize: normalizeFont(18), fontWeight: 'bold', color: '#333', marginBottom: moderateScale(10) },

  reviewCard: { backgroundColor: '#f9f9f9', borderRadius: moderateScale(10), padding: moderateScale(15), marginBottom: moderateScale(15), borderWidth: 1, borderColor: '#eee' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: scale(42), height: scale(42), borderRadius: scale(25) },
  reviewerName: { fontSize: normalizeFont(12), fontWeight: 'bold', color: '#333' },
  ratingText: { fontSize: normalizeFont(12), color: '#555' },
  reviewDate: { fontSize: normalizeFont(10), color: '#9E9E9E' },

  reviewComment: { fontSize: normalizeFont(12), color: '#444', marginTop: moderateScale(5), lineHeight: scale(20) },
  reviewImage: { width: scale(86), height: scale(80), borderRadius: moderateScale(8), marginRight: moderateScale(8) },

  emptyBox: { justifyContent: 'center', alignItems: 'center', paddingVertical: moderateScale(40) },
  noReviewText: { color: '#757575', marginTop: moderateScale(10), fontSize: normalizeFont(16) },
});
