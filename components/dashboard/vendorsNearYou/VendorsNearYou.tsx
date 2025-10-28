import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ProfileCard from '../../common/VendorsCard';

const API_BASE = 'https://393rb0pp-5000.inc1.devtunnels.ms';
const API_ENDPOINT = '/api/buyer/vendors-near-you?lat=19.076&lng=72.8777';

const ViewVendors = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation();

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
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      // console.log('📦 Vendors API Response:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch vendors');
      }

      const mappedVendors = data.vendors.map((vendor: any) => ({
        id: vendor.id,
        image: vendor.profilePicture || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        name: vendor.name,
        rating: 4.5,
        distance: vendor.distance,
        category: vendor.categories,
      }));

      setVendors(mappedVendors);

    } catch (err: any) {
      console.error('❌ Error fetching vendors:', err);
      setError(err.message || 'Failed to load vendors near you');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorsNearYou();
  }, []);

  const handleRetry = () => fetchVendorsNearYou();

  const handleVendorPress = (vendorId: string) => {
    // Navigate to VendorsDetails and pass vendorId
    navigation.navigate('VendorsDetails', { vendorId });
  };

  if (loading) {
    return (
      <View>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Vendors Near You</Text>
          <TouchableOpacity onPress={() => navigation.navigate("VendorsSeeAll")}>
            <Text style={styles.link}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Finding vendors near you...</Text>
        </View>
      </View>
    );
  }

  if (error && vendors.length === 0) {
    return (
      <View>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Vendors Near You</Text>
          <TouchableOpacity onPress={() => navigation.navigate("VendorsSeeAll")}>
            <Text style={styles.link}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Vendors Near You</Text>
        <TouchableOpacity onPress={() => navigation.navigate("VendorsSeeAll")}>
          <Text style={styles.link}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {vendors.slice(0,2).map((vendor) => (
          <TouchableOpacity key={vendor.id} onPress={() => handleVendorPress(vendor.id)}>
            <ProfileCard
              image={vendor.image}
              name={vendor.name}
              rating={vendor.rating}
              distance={vendor.distance}
              category={vendor.category}
            />
          </TouchableOpacity>
        ))}
        
        {error && (
          <View style={styles.apiErrorNote}>
            <Text style={styles.apiErrorText}>
              Note: Showing cached data - {error}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};




export default ViewVendors;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loader: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  link: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007bff',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
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
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  apiErrorNote: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 6,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  apiErrorText: {
    fontSize: 12,
    color: '#E65100',
    textAlign: 'center',
  },
});