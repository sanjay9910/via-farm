// FressPopular_responsive.jsx
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
// base guideline (iPhone X)
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
    // Android tends to render slightly larger fonts; compensate a bit
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
};
// -----------------------------------------

// Custom Card Component with image inside and name below
const ProductCard = ({ item, onPress }) => {
  const veriety = item?.variety ?? 'Unnamed';
  const image = (item?.images && item.images.length > 0) ? item.images[0] : 'https://via.placeholder.com/150/FFA500/FFFFFF?text=No+Image';

  return (
    <TouchableOpacity
      style={cardStyles.container}
      activeOpacity={0.85}
      onPress={() => onPress && onPress(item)}
    >
      {/* Card - Sirf Image */}
      <View style={cardStyles.card}>
        <Image
          source={{ uri: image }}
          style={cardStyles.image}
          resizeMode="cover"
        />
      </View>

      {/* Name - Card ke niche */}
      <Text style={cardStyles.name} numberOfLines={1}>{veriety}</Text>
    </TouchableOpacity>
  );
};

const FressPopular = () => {
  const navigation = useNavigation();
  const [data, setData] = useState([]);            // store full product objects
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

      // normalize various possible response shapes
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

  // navigate to ViewProduct with productId and the full product
  const openProductDetails = (product) => {
    const productId = product?._id || product?.id;
    if (!productId) {
      console.warn("openProductDetails: missing product id", product);
      return;
    }
    // pass both productId and product to the target screen
    navigation.navigate('ViewProduct', { productId, product });
  };

  // Loading state
  if (loading) {
    return (
      <View style={{ marginVertical: verticalScale(20), alignItems: 'center' }}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Fresh & Popular</Text>

          {/* See All: icon on left, safe for older RN */}
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

          {/* See All: icon on left */}
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

        {/* Final See All usage: icon left */}
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

const styles = StyleSheet.create({
  heading: {
    fontSize: normalizeFont(17),
    marginLeft: moderateScale(20),
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(10),
    paddingRight: moderateScale(20),
  },


  link: {
    color: 'rgba(1, 151, 218, 1)',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: normalizeFont(12),
  },

  // See All container + icon
  seeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap:5
  },
  seeIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    marginRight: moderateScale(6),
    resizeMode: 'contain',
  },

  errorContainer: {
    alignItems: 'center',
    padding: moderateScale(20),
    backgroundColor: '#ffebee',
    borderRadius: moderateScale(8),
    marginHorizontal: moderateScale(20),
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: moderateScale(15),
    fontSize: normalizeFont(14),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#1976d2',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(5),
  },
  loginButton: {
    backgroundColor: '#388e3c',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(5),
    marginLeft: moderateScale(10), 
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: normalizeFont(14),
  },
  noDataContainer: {
    alignItems: 'center',
    padding: moderateScale(20),
  },
  noDataText: {
    color: '#666',
    fontSize: normalizeFont(14),
  },
});

const cardStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: moderateScale(8),
    width: moderateScale(120),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    width: moderateScale(120),
    height: moderateScale(120),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(5),
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(8),
  },
  name: {
    fontSize: normalizeFont(13),
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    // marginTop: verticalScale(2),
    flexWrap: 'wrap',
    width: moderateScale(100),
  },
});
