import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  PixelRatio,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import ProfileCard from '../../common/VendorsCard';

const API_BASE = 'https://viafarm-1.onrender.com';
const API_ENDPOINT = '/api/buyer/vendors-near-you?maxDistance=20000';

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

  // Layout math for card width and spacing
  const horizontalPadding = moderateScale(16);
  const CARD_VISIBLE_WIDTH = Math.min(windowWidth - horizontalPadding * 2, 360); // clamp width
  const CARD_SPACING = moderateScale(12);
  const snapInterval = CARD_VISIBLE_WIDTH + CARD_SPACING;

  // ✅ Header now takes "title" prop from parent
  const Header = ({ title }) => (
    <View style={[styles.headerRow, { paddingHorizontal: moderateScale(16) ,paddingVertical:5,}]}>
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

  return (
    <View style={{ flex: 1 }}>
      <Header title={title} />

      {vendors.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={vendors}
          horizontal
          keyExtractor={(item) => String(item.id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
            flexDirection: 'row-reverse',
            alignItems: 'flex-start',
          }}
          snapToInterval={snapInterval}
          decelerationRate="fast"
          snapToAlignment="start"
          pagingEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              key={String(item.id)}
              onPress={() => handleVendorPress(item.id)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.name} details`}
              style={{ width: CARD_VISIBLE_WIDTH, marginRight: CARD_SPACING }}
            >
              <ProfileCard
                image={item.image}
                name={item.name}
                rating={item.rating}
                distance={item.distance}
                category={item.category}
              />
            </TouchableOpacity>
          )}
        />
      )}

      {error && vendors.length > 0 && (
        <View style={styles.apiErrorNote}>
          <Text style={styles.apiErrorText}>Note: Showing cached data - {error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(5),
  },
  heading: {
    fontSize: normalizeFont(13),
    fontWeight: '700',
    color: '#333',
  },
  seeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  link: {
    fontSize: normalizeFont(12),
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
    fontSize: normalizeFont(11),
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
    fontSize: normalizeFont(11),
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(40),
  },
  emptyText: {
    fontSize: normalizeFont(11),
    color: '#666',
    marginBottom: verticalScale(10),
  },
  apiErrorNote: {
    marginTop: verticalScale(10),
    paddingHorizontal: moderateScale(16),
  },
  apiErrorText: {
    fontSize: normalizeFont(11),
    color: '#999',
  },
});

export default ViewVendors;