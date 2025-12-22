// File: ViewVendors.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileCard from './../components/common/VendorsCard';
import { moderateScale, normalizeFont } from './Responsive';

const API_BASE = 'https://viafarm-1.onrender.com';
const API_ENDPOINT = '/api/buyer/allvendors';

const ViewVendors = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState<string>('');

  const navigation = useNavigation<any>(); 

  const fetchAllVendors = async () => {
    try {
      setLoading(true);
      setError(null);

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

      if (response.data && response.data.success) {
        const mappedVendors = response.data.vendors.map((vendor: any) => ({
          id: vendor.id,
          image: vendor.profilePicture && vendor.profilePicture !== 'https://default-image-url.com/default.png'
            ? vendor.profilePicture
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
          name: vendor.name,
          rating: vendor.rating || 4.5,
          distance: vendor.distance || 'Not available',
          category: vendor.categories || 'General',
        }));

        setVendors(mappedVendors);
        setFilteredVendors(mappedVendors);
      } else {
        throw new Error('Failed to fetch vendors data');
      }

    } catch (err: any) {
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

      setVendors([]); 
      setFilteredVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllVendors();
  }, []);

  // Filtering Logic: Updates whenever vendors or filterText changes
  useEffect(() => {
    if (filterText === '') {
      setFilteredVendors(vendors);
      return;
    }

    const lowerCaseFilter = filterText.toLowerCase();
    const result = vendors.filter(vendor => 
      vendor.name.toLowerCase().includes(lowerCaseFilter)
    );
    setFilteredVendors(result);
  }, [filterText, vendors]);


  const handleRetry = () => {
    setError(null);
    fetchAllVendors();
  };

  const handleLogin = () => {
    navigation.navigate('login');
  };

  const handleVendorPress = (vendorId: string) => {
    navigation.navigate('VendorsDetails', { vendorId });
  };


  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text allowFontScaling={false} style={styles.loadingText}>Loading all vendors...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.mainContainer}>
            
            <View style={styles.integratedHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>

                {/* Search/Filter Input */}
                <View style={styles.searchInputWrapper}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                    allowFontScaling={false}
                        style={styles.searchInput}
                        placeholder="Filter vendors by name..."
                        value={filterText}
                        onChangeText={setFilterText}
                        placeholderTextColor="#999"
                    />
                </View>
            </View>

            {error && vendors.length === 0 && (
                <View style={styles.errorContainer}>
                    <Text allowFontScaling={false} style={styles.errorText}>{error}</Text>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                            <Text allowFontScaling={false} style={styles.buttonText}>Try Again</Text>
                        </TouchableOpacity>
                        {error.includes('login') && (
                            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                                <Text allowFontScaling={false} style={styles.buttonText}>Go to Login</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Main Heading/Count (Optional, as the list is below) */}
                <View style={styles.header}>
                    <Text allowFontScaling={false} style={styles.heading}>Vendors</Text>
                    {filteredVendors.length > 0 && (
                        <Text allowFontScaling={false} style={styles.vendorCount}>{filteredVendors.length} vendors found</Text>
                    )}
                </View>

                {filteredVendors.length > 0 ? (
                    filteredVendors.map((vendor) => (
                        <TouchableOpacity 
                            key={vendor.id} 
                            onPress={() => handleVendorPress(vendor.id)}
                            activeOpacity={0.7}
                            style={styles.cardWrapper}
                        >
                            <ProfileCard
                                image={vendor.image}
                                name={vendor.name}
                                rating={vendor.rating}
                                distance={vendor.distance}
                                category={vendor.category}
                            />
                        </TouchableOpacity>
                    ))
                ) : (
                    !loading && (
                        <View style={styles.noVendorsContainer}>
                            <Text allowFontScaling={false} style={styles.noVendorsText}>
                                {filterText 
                                    ? `No vendors found matching "${filterText}"` 
                                    : 'No vendors found'
                                }
                            </Text>
                            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                                <Text allowFontScaling={false} style={styles.buttonText}>Refresh</Text>
                            </TouchableOpacity>
                        </View>
                    )
                )}
            </ScrollView>
        </View>
    </SafeAreaView>
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
    marginTop:moderateScale(10),
    fontSize:16,
    color: '#666',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'white', 
  },
  mainContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  // 🎯 New Integrated Header Style
  integratedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 6, // Increase touchable area
  },
  // 🔍 Search Input Wrapper (Takes up remaining space)
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10, // Space between arrow and search
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize:moderateScale(12),
    color: '#333',
    paddingVertical: 0, 
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
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  vendorCount: {
    fontSize:normalizeFont(14),
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal:moderateScale(10),
    paddingVertical:moderateScale(4),
    borderRadius:moderateScale(12),
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding:moderateScale(16),
    margin:moderateScale(16),
    borderRadius:moderateScale(8),
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    fontSize:normalizeFont(14),
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom:moderateScale(15),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap:moderateScale(10),
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal:moderateScale(20),
    paddingVertical:moderateScale(10),
    borderRadius:moderateScale(6),
    minWidth: 100,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal:moderateScale(20),
    paddingVertical:moderateScale(10),
    borderRadius:moderateScale(6),
    minWidth:moderateScale(100),
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize:normalizeFont(14),
  },
  noVendorsContainer: {
    alignItems: 'center',
    padding:moderateScale(40),
  },
  noVendorsText: {
    fontSize:normalizeFont(16),
    color: '#666',
    marginBottom:moderateScale(20),
    textAlign: 'center',
  },
});