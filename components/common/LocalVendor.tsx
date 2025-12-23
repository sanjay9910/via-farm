import { moderateScale, normalizeFont } from "@/app/Responsive";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ProfileCard from '../common/VendorsCard';

const API_BASE = "https://viafarm-1.onrender.com";
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const normalizeCategoryArray = (catField) => {
  if (!catField) return [];
  if (Array.isArray(catField)) return catField;
  if (typeof catField === 'string') {
    return catField.split(',').map(c => c.trim()).filter(Boolean);
  }
  return [];
};

const FreshVendor = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const res = await axios.get(`${API_BASE}/api/buyer/vendors-near-you?maxDistance=1000000`, {
        headers,
        timeout: 10000,
      });

      let fetched = [];
      if (res?.data?.vendors && Array.isArray(res.data.vendors)) {
        fetched = res.data.vendors;
      } else if (Array.isArray(res.data)) {
        fetched = res.data;
      } else if (res.data?.success && Array.isArray(res.data.data)) {
        fetched = res.data.data;
      } else if (Array.isArray(res.data.data)) {
        fetched = res.data.data;
      } else if (Array.isArray(res.data?.data?.data)) {
        fetched = res.data.data.data;
      } else {
        fetched = res.data?.data || [];
      }

      const normalized = (Array.isArray(fetched) ? fetched : []).map(v => ({
        _id: v._id || v.id || v.vendorId || null,
        id: v.id || v._id || v.vendorId || null,
        name: v.name || v.vendorName || v?.profile?.name || "Unknown Vendor",
        image: v.profilePicture || v.image || v.profileImage || v.logo || (v.images && v.images[0]) || "https://via.placeholder.com/300",
        rating: v.rating || v.avgRating || 0,
        distance: v.distance || v.distanceFromVendor || (typeof v.distanceValue === 'number' ? `${v.distanceValue} km` : "0.0 km"),
        category: normalizeCategoryArray(v.categories || v.category || v.categoriesList),
        topProducts: Array.isArray(v.topProducts) ? v.topProducts : [],
        raw: v,
      }));

      setVendors(normalized);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const openVendorDetails = (vendor) => {
    const vendorId = vendor?.id || vendor?._id || vendor?.raw?.id;
    if (!vendorId) return;
    navigation.navigate('VendorsDetails', { vendorId, vendor });
  };

  const AllVendor = () => {
    navigation.navigate('VendorsSeeAll');
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color="#FFA500" />
      </View>
    );
  }

  if (!vendors.length) {
    return (
      <View style={styles.emptyWrap}>
        <Text allowFontScaling={false} style={styles.emptyText}>
          No vendors found
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <Text allowFontScaling={false} style={styles.vendorsTitle}>
          Vendors
        </Text>

        <TouchableOpacity
          style={styles.seeAllButton}
          onPress={AllVendor}
          activeOpacity={0.7}
        >
          <Text allowFontScaling={false} style={styles.seeAllText}>
            See All
          </Text>
          <Image
            source={require("../../assets/via-farm-img/icons/see.png")}
            
          />
        </TouchableOpacity>
      </View>

      {/* Vendors List */}
      <FlatList
        data={vendors}
        keyExtractor={(v) => v.id || v._id || v.raw?.id || String(v.name)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
        snapToAlignment="start"
        decelerationRate="fast"
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => openVendorDetails(item)}
            activeOpacity={0.9}
            style={styles.touchWrap}
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
  );
};

export default FreshVendor;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(5),
  },

  vendorsTitle: {
    fontSize: normalizeFont(15),
    fontWeight: '500',
    color: '#333',
    flexShrink: 0,
  },

  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    flexShrink: 0,
  },

  seeAllText: {
    color: 'rgba(1, 151, 218, 1)',
    fontSize: normalizeFont(12),
    fontWeight: '500',
  },

  seeAllIcon: {
    width: moderateScale(16),
    height: moderateScale(16),
    resizeMode: 'contain',
  },
  listContent: {
    paddingLeft: moderateScale(5),
    paddingRight: moderateScale(12),
  },
  touchWrap: {
    marginRight: moderateScale(12),
  },
  loadingWrap: {
    paddingVertical: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    paddingVertical: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: normalizeFont(14),
  },
});