import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const API_BASE = "https://393rb0pp-5000.inc1.devtunnels.ms";

// Custom Card Component with image inside and name below
const ProductCard = ({ item, onPress }) => {
  const name = item?.name ?? 'Unnamed';
  const image = (item?.images && item.images.length > 0) ? item.images[0] : 'https://via.placeholder.com/150/FFA500/FFFFFF?text=No+Image';

  return (
    <TouchableOpacity style={cardStyles.container} activeOpacity={0.85} onPress={() => onPress && onPress(item)}>
      {/* Card - Sirf Image */}
      <View style={cardStyles.card}>
        <Image
          source={{ uri: image }}
          style={cardStyles.image}
          resizeMode="cover"
        />
      </View>

      {/* Name - Card ke niche */}
      <Text style={cardStyles.name} numberOfLines={2}>{name}</Text>
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
      <View style={{ marginVertical: 20, alignItems: 'center' }}>
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
        <Text style={{ marginTop: 10, color: '#666' }}>Loading fresh products...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={{ marginVertical: 20, alignItems: 'center' }}>
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
    <View style={{ marginVertical: 20 }}>
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
          contentContainerStyle={{ paddingHorizontal: 10 }}
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
    fontSize: 20,
    marginLeft: 20,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingRight: 20,
  },

  // safer link style (removed flex to avoid layout issues)
  link: {
    color: 'rgba(1, 151, 218, 1)',
    fontWeight: '600',
    textAlign: 'center',
  },

  // See All container + icon
  seeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap:5,
  },
  seeIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
    resizeMode: 'contain',
  },

  errorContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    marginHorizontal: 20,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  loginButton: {
    backgroundColor: '#388e3c',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginLeft: 10, // spacing between buttons (compatible)
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    color: '#666',
    fontSize: 16,
  },
});

// New Card Styles - Image inside card, name below card
const cardStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 120,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 5,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    width: 100,
  },
});
