import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native'; // useNavigation भी जोड़ा
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text, // 💡 ScrollView जोड़ा
    TouchableOpacity // Back button के लिए जोड़ा
    ,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Base URL for the API
const API_BASE_URL = 'https://393rb0pp-5000.inc1.devtunnels.ms';
const BUYER_COORDINATES = '?buyerLat=28.70&buyerLng=77.22'; 

const VendorsDetails = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation(); // navigation हुक जोड़ा
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const route = useRoute();
  const vendorId = route.params?.vendorId; 

  // Helper function to retrieve the token from AsyncStorage
  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken'); 
      return token;
    } catch (e) {
      console.error("Failed to retrieve token from AsyncStorage:", e);
      return null;
    }
  };

  const fetchVendorDetails = async () => {
    setLoading(true);
    setError(null);

    if (!vendorId) {
        setError('Vendor ID is missing. Cannot fetch details.');
        setLoading(false);
        return;
    }
    
    try {
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in first.');
      }

      const url = `${API_BASE_URL}/api/buyer/vendor/${vendorId}${BUYER_COORDINATES}`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success === true && response.data.data && response.data.data.vendor) {
        setVendor(response.data.data.vendor); 
      } else {
        throw new Error(response.data.message || 'Failed to fetch vendor details. API response was not successful.');
      }

    } catch (err) {
      console.error("API Error caught:", err.message);
      
      if (axios.isAxiosError(err) && err.response) {
          setError(`Error: ${err.response.status}. Please check API URL.`);
      } else {
          setError(err.message || 'An unknown error occurred while fetching data.');
      }
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorDetails();
  }, [vendorId]); 

  // --- Loading and Error States ---
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 10 }}>Loading vendor details...</Text>
      </View>
    );
  }

  if (error || !vendor) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorHeader}>Data Fetch Error</Text>
        <Text style={styles.errorText}>{error || 'No vendor data available.'}</Text>
      </View>
    );
  }

  // --- Data Mapping ---
  const vendorData = {
    name: vendor.name,
    location: vendor.locationText || "Location not specified",
    distance: vendor.distance || "Distance N/A",
    rating: vendor.rating || 0,
    about: vendor.about || "No information available about this vendor.",
    imageUrl: vendor.profilePicture || 'https://picsum.photos/800/600',
  };
  
  const displayRating = vendorData.rating !== undefined ? vendorData.rating.toFixed(1) : 'N/A';
  const vendorImage = vendorData.imageUrl;

  // --- New Review and Product Placeholder Components ---

  const ReviewSection = () => (
    <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>Customer Reviews (4.5/5)</Text>
        <Text style={styles.placeholderText}>
            Review 1: "Great service, fast delivery!" (User 1)
        </Text>
        <Text style={styles.placeholderText}>
            Review 2: "Quality was okay." (User 2)
        </Text>
        <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllButtonText}>View All Reviews</Text>
        </TouchableOpacity>
    </View>
  );

  const TopReviewers = () => (
    <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>Top Contributors</Text>
        <Text style={styles.placeholderText}>
            User A: 15 Reviews
        </Text>
        <Text style={styles.placeholderText}>
            User B: 10 Reviews
        </Text>
    </View>
  );

  const ProductListing = () => (
    <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>Vendor Products & Services</Text>
        <Text style={styles.placeholderText}>
            Product 1: Item name and price
        </Text>
        <Text style={styles.placeholderText}>
            Product 2: Another item name and price
        </Text>
        <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllButtonText}>See All Products</Text>
        </TouchableOpacity>
    </View>
  );

  return (
    // 💡 Main container को ScrollView से बदला गया
    <ScrollView style={styles.scrollViewContainer} showsVerticalScrollIndicator={false}>
      
      {/* --- 1. Vendor Header and Details --- */}
      <View style={styles.headerImageContainer}>
        <Image 
          source={{ uri: vendorImage }} 
          style={styles.vendorImage} 
        />
        {/* Back Arrow */}
        <TouchableOpacity 
            style={[styles.backButton, { top: insets.top + 10 }]}
            onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Details Card */}
      <View style={styles.detailsCard}>
        <View style={styles.nameRow}>
          <Text style={styles.vendorName}>{vendorData.name}</Text>
          <View style={styles.ratingBox}>
            <Text style={styles.ratingText}>{displayRating}</Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={16} color="#757575" />
          <Text style={styles.locationText}>
            {`${vendorData.location} (${vendorData.distance})`}
          </Text>
        </View>

        {/* About Section */}
        <Text style={styles.aboutHeader}>About the vendor</Text>
        <Text style={styles.aboutText}>{vendorData.about}</Text>
      </View>
      
      {/* --- 2. Review Section --- */}
      <ReviewSection />

      {/* --- 3. Top Reviewers Section --- */}
      <TopReviewers />

      {/* --- 4. Product Listing Section --- */}
      <ProductListing />
      
      {/* Bottom padding for better scroll viewing */}
      <View style={{ height: 30 }} /> 
    </ScrollView>
  );
};

export default VendorsDetails;

const styles = StyleSheet.create({
  // 💡 flex: 1 को ScrollView को हटा दिया गया है, लेकिन अन्य sections के लिए flex: 1 रखा जा सकता है।
  scrollViewContainer: {
    flex: 1, // ScrollView को पूरी स्क्रीन लेने दें
    backgroundColor: '#f5f5f5', // हल्का बैकग्राउंड
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 10,
  },
  errorText: {
    color: '#E53935',
    textAlign: 'center',
    padding: 10,
  },
  // --- Image and Header Styles ---
  headerImageContainer: {
    width: '100%',
    height: 220,
  },
  vendorImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.4)', 
    borderRadius: 20,
    padding: 5,
    zIndex: 10, // सुनिश्चित करें कि यह इमेज के ऊपर दिखे
  },
  // --- Details Card Styles ---
  detailsCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    marginBottom: 10, // नीचे मार्जिन जोड़ा
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingBox: {
    backgroundColor: '#FFEB3B',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  locationText: {
    fontSize: 16,
    color: '#757575',
    marginLeft: 5,
  },
  aboutHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },

  // --- New Section Styles ---
  sectionContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 0,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    paddingLeft: 10,
  },
  seeAllButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 5,
    alignItems: 'center',
  },
  seeAllButtonText: {
    color: '#1976D2',
    fontWeight: '600',
  }
});