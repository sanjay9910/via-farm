// FressPopular_responsive.jsx (FIXED)
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
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

const API_BASE = "https://viafarm-1.onrender.com";

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

// Styles
const cardStyles = StyleSheet.create({
  container: { marginHorizontal: moderateScale(8), width: moderateScale(130) },
  card: { borderRadius: 8, overflow: 'hidden' },
  image: { width: '100%', height: moderateScale(130), backgroundColor: '#f0f0f0' },
  name: { fontSize: normalizeFont(12), fontWeight: '600', color: '#333', marginTop: moderateScale(8), textAlign: 'center', paddingHorizontal: 4 }
});

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: moderateScale(20), marginBottom: verticalScale(12) },
  heading: { fontSize: normalizeFont(13), fontWeight: '600', color: '#333' },
  seeButton: { flexDirection: 'row', alignItems: 'center', paddingVertical:moderateScale(6) ,gap:5},
  seeIcon: { width: moderateScale(16), height: moderateScale(16), marginRight:moderateScale(4) },
  link: { fontSize: normalizeFont(12), color: 'rgba(1, 151, 218, 1)', fontWeight: '600' },
  errorContainer: { marginVertical: verticalScale(20), paddingHorizontal: moderateScale(20), alignItems: 'center' },
  errorText: { fontSize: normalizeFont(10), color: '#e74c3c', textAlign: 'center', marginBottom: verticalScale(12) },
  buttonContainer: { flexDirection: 'row', gap: 10 },
  retryButton: { backgroundColor: '#ff6b35', paddingHorizontal:moderateScale(16), paddingVertical:moderateScale(10), borderRadius:moderateScale(6) },
  loginButton: { backgroundColor: '#3498db', paddingHorizontal:moderateScale(16), paddingVertical:moderateScale(10), borderRadius:moderateScale(6) },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: normalizeFont(10) },
  noDataContainer: { marginVertical: verticalScale(20), alignItems: 'center' },
  noDataText: { fontSize: normalizeFont(10), color: '#999' }
});

// ---------- Custom Card Component ----------
const ProductCard = ({ item, onPress }) => {
  const variety = item?.variety ?? item?.name ?? 'Unnamed';
  const image = (item?.images && item.images.length > 0) ? item.images[0] : 'https://via.placeholder.com/150/FFA500/FFFFFF?text=No+Image';

  return (
    <TouchableOpacity
      style={cardStyles.container}
      activeOpacity={0.85}
      onPress={() => onPress && onPress(item)}
    >
      <View style={cardStyles.card}>
        <Image
          source={{ uri: image }}
          style={cardStyles.image}
          resizeMode="cover"
        />
      </View>
      <Text style={cardStyles.name} numberOfLines={1}>{variety}</Text>
    </TouchableOpacity>
  );
};

// ---------- Main Component ----------
const FressPopular = () => {
  const navigation = useNavigation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFreshPopular = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('userToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_BASE}/api/buyer/fresh-and-popular`, {
        headers,
        timeout: 10000,
      });

      let items = [];
      if (!response || !response.data) items = [];
      else if (Array.isArray(response.data)) items = response.data;
      else if (Array.isArray(response.data.data)) items = response.data.data;
      else items = [];

      setData(items);
    } catch (err) {
      console.error("fetchFreshPopular error:", err);
      if (err.response?.status === 401) {
        setError("Please login to view products");
      } else if (err.code === "ECONNABORTED") {
        setError("Request timeout. Please try again.");
      } else if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Failed to fetch products. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreshPopular();
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchFreshPopular();
  };

  const handleLogin = () => {
    navigation.navigate('login');
  };

  // FIXED: Pass variety name to ProductVarieties page
  const openProductDetails = (product) => {
    const varietyName = product?.variety || product?.name;
    
    if (!varietyName) {
      console.warn("openProductDetails: missing variety/product name", product);
      return;
    }
    navigation.navigate('ProductVeriety', { 
      product, 
      variety: varietyName 
    });
  };

  // Loading state
  if (loading) {
    return (
      <View style={{ marginVertical: verticalScale(20), alignItems: 'center' }}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Fresh & Popular</Text>
          <TouchableOpacity style={styles.seeButton} onPress={() => navigation.navigate("AllCategory")}>
            <Image
              source={require("../../../assets/via-farm-img/icons/see.png")}
              style={styles.seeIcon}
            />
            <Text style={styles.link}>View All</Text>
          </TouchableOpacity>
        </View>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: verticalScale(10), color: '#666', fontSize: normalizeFont(12) }}>Loading fresh products...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={{ marginVertical: verticalScale(20), alignItems: 'center' }}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Fresh & Popular</Text>
          <TouchableOpacity style={styles.seeButton} onPress={() => navigation.navigate("AllCategory")}>
            <Image
              source={require("../../../assets/via-farm-img/icons/see.png")}
              style={styles.seeIcon}
            />
            <Text style={styles.link}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            {error.toLowerCase().includes('login') && (
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
              >
                <Text style={styles.buttonText}>Go to Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ marginVertical: verticalScale(20) }}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Fresh & Popular</Text>

        <TouchableOpacity style={styles.seeButton} onPress={() => navigation.navigate('ViewAllFressPop')}>
          <Text style={styles.link}>See All</Text>
          <Image
            source={require("../../../assets/via-farm-img/icons/see.png")}
        
          />
        </TouchableOpacity>
      </View>

      {data.length > 0 ? (
        <FlatList
          data={data}
          keyExtractor={(item, index) => (item._id || item.id || String(index)).toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: moderateScale(10) }}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onPress={openProductDetails}
            />
          )}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No products available</Text>
        </View>
      )}
    </View>
  );
};

export default FressPopular;