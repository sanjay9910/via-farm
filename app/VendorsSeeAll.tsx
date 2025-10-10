// File: ViewVendors.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Navbar from '../components/common/navbar';
import ProfileCard from './../components/common/VendorsCard';

const API_BASE = 'https://393rb0pp-5000.inc1.devtunnels.ms';
const API_ENDPOINT = '/api/buyer/allvendors?lat=19.0760&lng=72.877';

const ViewVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigation = useNavigation();

  const fetchAllVendors = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        setError('Please login to view vendors');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE}${API_ENDPOINT}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        timeout: 10000,
      });

      console.log('📦 All Vendors API Response:', response.data);

      if (response.data && response.data.success) {
        // Map API data to match ProfileCard component
        const mappedVendors = response.data.vendors.map((vendor) => ({
          id: vendor.id,
          image: vendor.profilePicture !== 'https://default-image-url.com/default.png' 
            ? vendor.profilePicture 
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
          name: vendor.name,
          rating: 4.5, // Default rating since API doesn't provide
          distance: vendor.distance !== 'N/A' ? vendor.distance : 'Not available',
          category: vendor.categories !== 'No categories listed' ? vendor.categories : 'General',
        }));

        setVendors(mappedVendors);
        console.log(`✅ Loaded ${mappedVendors.length} vendors`);
      } else {
        throw new Error('Failed to fetch vendors data');
      }

    } catch (err) {
      console.error('❌ Error fetching all vendors:', err);
      
      if (err.response?.status === 401) {
        setError('Please login to view vendors');
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Please try again.');
      } else if (err.response?.status === 404) {
        setError('Vendors not found');
      } else if (!err.response) {
        setError('Network error. Please check your connection.');
      } else {
        setError(err.response?.data?.message || 'Failed to load vendors');
      }

      // ❌ REMOVED DUMMY DATA FALLBACK - Only show API data
      setVendors([]); // Empty array if API fails

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllVendors();
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchAllVendors();
  };

  const handleLogin = () => {
    navigation.navigate('login');
  };

  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <Navbar />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading all vendors...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <Navbar />
      
      {error && vendors.length === 0 && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
            {error.includes('login') && (
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.buttonText}>Go to Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with vendor count */}
        <View style={styles.header}>
          <Text style={styles.heading}>All Vendors</Text>
          {vendors.length > 0 && (
            <Text style={styles.vendorCount}>{vendors.length} vendors found</Text>
          )}
        </View>

        {vendors.length > 0 ? (
          vendors.map((vendor) => (
            <ProfileCard
              key={vendor.id}
              image={vendor.image}
              name={vendor.name}
              rating={vendor.rating}
              distance={vendor.distance}
              category={vendor.category}
            />
          ))
        ) : (
          !error && (
            <View style={styles.noVendorsContainer}>
              <Text style={styles.noVendorsText}>No vendors found</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.buttonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
};

export default ViewVendors;

// --- Stylesheet Update ---
const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  vendorCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  noVendorsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noVendorsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
});