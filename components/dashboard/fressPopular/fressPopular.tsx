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
const ProductCard = ({ name, image }) => {
  return (
    <View style={cardStyles.container}>
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
    </View>
  );
};

const FressPopular = () => {
  const navigation = useNavigation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFreshPopular = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE}/api/buyer/fresh-and-popular`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const formattedData = response.data.data.map(item => ({
          name: item.name,
          image: item.images[0] || 'https://via.placeholder.com/150/FFA500/FFFFFF?text=No+Image'
        }));
        setData(formattedData);
      } else {
        setError("Failed to load data");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Please login to view products");
      } else {
        setError("Failed to fetch products");
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

  // Loading state
  if (loading) {
    return (
      <View style={{ marginVertical: 20, alignItems: 'center' }}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Fresh & Popular</Text>
          <TouchableOpacity onPress={() => navigation.navigate("AllCategory")}>
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
          <TouchableOpacity onPress={() => navigation.navigate("AllCategory")}>
            <Text style={styles.link}>View All</Text>
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
            
            {error.includes('login') && (
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
        <TouchableOpacity onPress={() => navigation.navigate("AllCategory")}>
          <Text style={styles.link}>View All</Text>
        </TouchableOpacity>
      </View>
      
      {data.length > 0 ? (
        <FlatList
          data={data}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          renderItem={({ item }) => (
            <ProductCard 
              name={item.name} 
              image={item.image} 
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
}

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
  link: {
    color: 'blue',
    flex: 1,
    justifyContent: 'center',
    textAlign: 'center',
    alignItems: 'center',
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
    gap: 10,
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
    marginBottom:5,
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