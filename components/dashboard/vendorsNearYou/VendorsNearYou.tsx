// app/screens/ViewVendors_responsive.jsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  PixelRatio,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import ProfileCard from '../../common/VendorsCard';

const API_BASE = 'https://viafarm-1.onrender.com';
const API_ENDPOINT = '/api/buyer/vendors-near-you?lat=19.076&lng=72.8777';

// ---------- Responsive helpers ----------
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

const normalizeFont = (size) => {
  const newSize = moderateScale(size);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
};
// -----------------------------------------

// ✅ Component now accepts "title" as prop
const ViewVendors = ({ title = 'Vendors Near You' }) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigation = useNavigation();
  const { width: windowWidth } = useWindowDimensions();

  const fetchVendorsNearYou = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('Please login to view vendors near you');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}${API_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch vendors');
      }

      const mappedVendors = (data.vendors || []).map((vendor) => ({
        id: vendor.id || vendor._id || vendor.vendorId,
        image:
          vendor.profilePicture ||
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        name: vendor.name || 'Vendor',
        rating: vendor.rating ?? 4.5,
        distance: vendor.distance ?? '',
        category: vendor.categories ?? [],
        raw: vendor,
      }));

      setVendors(mappedVendors);
    } catch (err) {
      console.error('❌ Error fetching vendors:', err);
      setError(err?.message || 'Failed to load vendors near you');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorsNearYou();
  }, []);

  const handleRetry = () => fetchVendorsNearYou();

  const handleVendorPress = (vendorId) => {
    navigation.navigate('VendorsDetails', { vendorId });
  };

  // ✅ Header now takes "title" prop from parent
  const Header = ({ title }) => (
    <View style={[styles.headerRow, { paddingHorizontal: moderateScale(16) }]}>
      <Text style={styles.heading}>{title}</Text>

      <TouchableOpacity
        style={styles.seeButton}
        onPress={() => navigation.navigate('VendorsSeeAll')}
        activeOpacity={0.8}
      >
        <Text style={styles.link}>See All</Text>
        <Image
          source={require('../../../assets/via-farm-img/icons/see.png')}
        />
      </TouchableOpacity>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No vendors found nearby.</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
        <Text style={styles.retryButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <Header title={title} />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Finding vendors near you...</Text>
        </View>
      </View>
    );
  }

  if (error && vendors.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        <Header title={title} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const horizontalPadding = moderateScale(16);
  const contentWidth = Math.max(windowWidth - horizontalPadding * 2, 320);

  return (
    <View style={{ flex: 1 }}>
      <Header title={title} />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {vendors.length === 0 ? (
          <EmptyState />
        ) : (
          vendors.slice(0, 2).map((vendor) => (
            <TouchableOpacity
              key={String(vendor.id)}
              onPress={() => handleVendorPress(vendor.id)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Open ${vendor.name} details`}
            >
              <ProfileCard
                image={vendor.image}
                name={vendor.name}
                rating={vendor.rating}
                distance={vendor.distance}
                category={vendor.category}
              />
            </TouchableOpacity>
          ))
        )}

        {error && vendors.length > 0 && (
          <View style={styles.apiErrorNote}>
            <Text style={styles.apiErrorText}>Note: Showing cached data - {error}</Text>
          </View>
        )}
        <View style={{ height: moderateScale(32) }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(20),
    marginBottom: verticalScale(12),
  },
  heading: {
    fontSize: normalizeFont(18),
    fontWeight: '700',
    color: '#333',
  },
  seeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  link: {
    fontSize: normalizeFont(14),
    color: 'rgba(1, 151, 218, 1)',
    fontWeight: '500',
  },
  container: {
    paddingBottom: verticalScale(20),
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: verticalScale(10),
    fontSize: normalizeFont(14),
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: normalizeFont(14),
    color: 'red',
    marginBottom: verticalScale(10),
  },
  retryButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    paddingHorizontal: moderateScale(20),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(8),
  },
  retryButtonText: {
    color: '#fff',
    fontSize: normalizeFont(14),
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(40),
  },
  emptyText: {
    fontSize: normalizeFont(14),
    color: '#666',
    marginBottom: verticalScale(10),
  },
  apiErrorNote: {
    marginTop: verticalScale(10),
  },
  apiErrorText: {
    fontSize: normalizeFont(12),
    color: '#999',
  },
});

export default ViewVendors;
