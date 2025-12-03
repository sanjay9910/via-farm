// FreshVendor.js
import { moderateScale, normalizeFont } from "@/app/Responsive";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ProfileCard from '../common/VendorsCard';

const API_BASE = "https://viafarm-1.onrender.com";

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

      const res = await axios.get(`${API_BASE}/api/buyer/fresh-and-vendor`, {
        headers,
        timeout: 10000,
      });

      // Normalize response shapes
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

      const normalized = (Array.isArray(fetched) ? fetched : []).map(v => {
        const id = v._id || v.id || v.vendorId || (v.raw && (v.raw._id || v.raw.id));
        const name = v.name || v.vendorName || v?.profile?.name || "Unknown Vendor";
        const image = v.profilePicture || v.image || v.profileImage || v.logo || (Array.isArray(v.images) && v.images[0]) || "https://via.placeholder.com/300";
        const rating = v.rating ?? v.avgRating ?? 0;
        const distance = v.distance || v.distanceFromVendor || (typeof v.distanceValue === 'number' ? `${v.distanceValue} km` : "0.0 km");

        return {
          _id: id,
          id,
          name,
          image,
          rating,
          distance,
          category: normalizeCategoryArray(v.categories || v.category || v.categoriesList),
          topProducts: Array.isArray(v.topProducts) ? v.topProducts : [],
          raw: v,
        };
      });

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
    if (!vendor) return;
    const vendorId = vendor?.id || vendor?._id || vendor?.raw?._id || vendor?.raw?.id;
    if (!vendorId) return;
    // ensure it's a string
    navigation.navigate('VendorsDetails', { vendorId: String(vendorId), vendor });
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
        <Text style={styles.emptyText}>No vendors found</Text>
      </View>
    );
  }

  const AllVendor = () => {
    navigation.navigate('VendorsSeeAll');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Vendors</Text>
        <TouchableOpacity style={styles.seeAllBtn} onPress={AllVendor}>
          <Text style={styles.seeAllText}>See All</Text>
          <Image source={require("../../assets/via-farm-img/icons/see.png")} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={vendors}
        keyExtractor={(v, idx) => (v.id || v._id || v.raw?.id || v.name || String(idx))}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
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
    // optional container styles
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(13),
    marginBottom: 5,
  },
  title: {
    fontSize: normalizeFont(10),
    fontWeight: 'bold',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  seeAllText: {
    fontSize: normalizeFont(10),
    color: 'rgba(1, 151, 218, 1)',
  },
  listContent: {
    paddingLeft: moderateScale(12),
    paddingRight: moderateScale(18),
  },
  touchWrap: {
    marginRight: moderateScale(10),
  },
  loadingWrap: {
    paddingVertical: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    paddingVertical: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
  },
});
