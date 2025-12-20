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
} from 'react-native';
import ProfileCard from '../../common/VendorsCard';

const API_BASE = 'https://viafarm-1.onrender.com';
const API_ENDPOINT = '/api/buyer/vendors-near-you?maxDistance=20000';

// ---------- Responsive helpers ----------
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 912;

const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

const normalizeFont = (size) => {
  const newSize = moderateScale(size);
  return Platform.OS === 'ios'
    ? Math.round(PixelRatio.roundToNearestPixel(newSize))
    : Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
};
// -----------------------------------------

// 🔑 Card sizing
const CARD_HEIGHT = verticalScale(200);
const CARD_GAP = verticalScale(12);
const LIST_HEIGHT = CARD_HEIGHT * 2 + CARD_GAP;

const ViewVendors = ({ title = 'Vendors Near You' }) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigation = useNavigation();

  const fetchVendorsNearYou = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setError('Please login to view vendors near you');
        return;
      }

      const response = await fetch(`${API_BASE}${API_ENDPOINT}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch vendors');
      }

      const mapped = (data.vendors || []).map((v) => ({
        id: v.id || v._id || v.vendorId,
        image:
          v.profilePicture ||
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        name: v.name || 'Vendor',
        rating: v.rating ?? 4.5,
        distance: v.distance ?? '',
        category: v.categories ?? [],
      }));

      setVendors(mapped);
    } catch (e) {
      setError(e.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorsNearYou();
  }, []);

  const Header = () => (
    <View style={[styles.headerRow, { paddingHorizontal: moderateScale(16) }]}>
      <Text allowFontScaling={false} style={styles.heading}>{title}</Text>

      <TouchableOpacity
        style={styles.seeButton}
        onPress={() => navigation.navigate('VendorsSeeAll')}
      >
        <Text allowFontScaling={false} style={styles.link}>See All</Text>
        <Image source={require('../../../assets/via-farm-img/icons/see.png')} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View>
        <Header />
        <View style={[styles.centerBox, { height: LIST_HEIGHT }]}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </View>
    );
  }

  if (error && vendors.length === 0) {
    return (
      <View>
        <Header />
        <View style={[styles.centerBox, { height: LIST_HEIGHT }]}>
          <Text allowFontScaling={false} style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      <Header />

      {/* 🔑 FIXED HEIGHT + NESTED SCROLL */}
      <View style={{ height: LIST_HEIGHT }}>
        <FlatList
          data={vendors}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}          
          scrollEnabled={vendors.length > 2} 
          contentContainerStyle={{
            paddingHorizontal: moderateScale(16),
            paddingBottom: verticalScale(4),
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('VendorsDetails', { vendorId: item.id })
              }
              activeOpacity={0.85}
              style={{ marginBottom: CARD_GAP }}
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },
  heading: {
    fontSize: normalizeFont(15),
    fontWeight: '700',
    color: '#333',
  },
  seeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  link: {
    fontSize: normalizeFont(13),
    color: 'rgba(1, 151, 218, 1)',
    fontWeight: '500',
  },
  centerBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: normalizeFont(12),
    color: 'red',
  },
});

export default ViewVendors;
