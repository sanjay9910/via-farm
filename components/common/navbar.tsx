import { AuthContext } from '@/app/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  PanResponder,
  PixelRatio,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const { width } = Dimensions.get('window');
const API_BASE_URL = 'https://viafarm-1.onrender.com';
const API_BASE = 'https://viafarm-1.onrender.com';

export default function HeaderDesign() {
  const [searchText, setSearchText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const slideAnim = useState(new Animated.Value(width))[0];
  const slideUpAnim = useState(new Animated.Value(SCREEN_HEIGHT))[0];
  const navigation = useNavigation();

  // Address Form States
  const [formData, setFormData] = useState({
    pinCode: '',
    houseNumber: '',
    locality: '',
    city: '',
    district: '',
    state: '',
    latitude: 0,
    longitude: 0,
  });

  const [isDefaultAddress, setIsDefaultAddress] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    sortBy: 'relevance',
    priceMin:0,
    priceMax: 1000,
    distanceMin:0,
    distanceMax:100,
    ratingMin: 0,
  });

  const [tempFilters, setTempFilters] = useState({
    sortBy: 'relevance',
    priceMin:0,
    priceMax: 1000,
    distanceMin:0,
    distanceMax: 100,
    ratingMin: 0,
  });

  const [expandedFilters, setExpandedFilters] = useState({
    sortBy: false,
    price: false,
    distance: false,
    rating: false,
  });

  // PanResponder refs
  const priceMinResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, { dx }) => {
        const newValue = Math.max(50, Math.min(tempFilters.priceMax - 100, tempFilters.priceMin + Math.round(dx / 2)));
        setTempFilters(prev => ({ ...prev, priceMin: newValue }));
      },
    })
  ).current;

  const priceMaxResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, { dx }) => {
        const newValue = Math.min(3000, Math.max(tempFilters.priceMin + 100, tempFilters.priceMax + Math.round(dx / 2)));
        setTempFilters(prev => ({ ...prev, priceMax: newValue }));
      },
    })
  ).current;

  const distanceMinResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, { dx }) => {
        const newValue = Math.max(0, Math.min(tempFilters.distanceMax - 5, tempFilters.distanceMin + Math.round(dx / 3)));
        setTempFilters(prev => ({ ...prev, distanceMin: newValue }));
      },
    })
  ).current;

  const distanceMaxResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, { dx }) => {
        const newValue = Math.min(100, Math.max(tempFilters.distanceMin + 5, tempFilters.distanceMax + Math.round(dx / 3)));
        setTempFilters(prev => ({ ...prev, distanceMax: newValue }));
      },
    })
  ).current;

  const placeholders = ["Search by Products", "Search by Name"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % placeholders.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Handle search text change
  const handleSearchChange = async (text) => {
    setSearchText(text);

    if (text.trim().length > 0) {
      setLoading(true);
      setShowSuggestions(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/buyer/products/search?q=${encodeURIComponent(text)}`
        );
        const data = await response.json();
        let products = [];
        if (data.success && data.data && Array.isArray(data.data)) {
          products = data.data;
        } else if (Array.isArray(data)) {
          products = data;
        } else if (data.products && Array.isArray(data.products)) {
          products = data.products;
        }

        setSuggestions(products);
        applyFiltersToSuggestions(products);
      } catch (error) {
        console.error('Search Error:', error);
        setSuggestions([]);
        setFilteredSuggestions([]);
      } finally {
        setLoading(false);
      }
    } else {
      setSuggestions([]);
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Apply filters to suggestions
  const applyFiltersToSuggestions = (products) => {
    const filtered = products.filter((product) => {
      const price = product.price || 0;
      const rating = product.rating || 0;

      return (
        price >= tempFilters.priceMin &&
        price <= tempFilters.priceMax &&
        rating >= tempFilters.ratingMin
      );
    });

    setFilteredSuggestions(filtered);
  };

  // Open filter popup
  const openFilterPopup = () => {
    setTempFilters({ ...filters });
    setShowFilterPopup(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Close filter popup
  const closeFilterPopup = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowFilterPopup(false);
    });
  };

  // Apply filters
  const applyFilters = () => {
    setFilters({ ...tempFilters });
    applyFiltersToSuggestions(suggestions);
    closeFilterPopup();
  };

  // Clear filters
  const clearFilters = () => {
    setTempFilters({
      sortBy: 'relevance',
      priceMin: 50,
      priceMax: 3000,
      distanceMin: 4,
      distanceMax: 40,
      ratingMin: 0,
    });
  };

  // Handle product click
  const handleProductClick = (product) => {
    // console.log('Navigating with Product ID:', product._id);
    setShowSuggestions(false);
    navigation.navigate('ViewProduct', { productId: product._id });
  };

  // Open Address Modal
  const openAddressModal = () => {
    setShowAddressModal(true);
    Animated.timing(slideUpAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  // Close Address Modal
  const closeAddressModal = () => {
    Animated.timing(slideUpAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowAddressModal(false);
      resetAddressForm();
    });
  };

  // Reset Address Form
  const resetAddressForm = () => {
    setFormData({
      pinCode: '',
      houseNumber: '',
      locality: '',
      city: '',
      district: '',
      state: '',
      latitude: 0,
      longitude: 0,
    });
    setIsDefaultAddress(false);
  };

  // Handle Address Input Change
  const handleAddressInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Get Current Location
  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        setLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;

      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (geocode && geocode.length > 0) {
        const addr = geocode[0];
        setFormData({
          houseNumber: addr.name || addr.street || '',
          locality: addr.street || addr.subregion || '',
          city: addr.city || addr.subregion || '',
          district: addr.district || addr.region || addr.county || '',
          state: addr.region || addr.state || '',
          pinCode: addr.postalCode || '',
          latitude: latitude,
          longitude: longitude,
        });
        Alert.alert('Success', 'Location fetched successfully!');
      } else {
        Alert.alert('Error', 'Unable to fetch address from location.');
      }
    } catch (error) {
      console.error('Location Error:', error);
      Alert.alert('Error', 'Failed to fetch current location.');
    } finally {
      setLocating(false);
    }
  };

  // AuthContext
  const { user, address, fetchBuyerAddress } = useContext(AuthContext);
  const profilePicture = user?.profilePicture || user?.profileImage || null;

  const getInitial = () => {
    if (user?.name && user.name.length > 0) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const notification = () => {
    navigation.navigate("Notification");
  };

  useEffect(() => {
    fetchBuyerAddress();
  }, []);

  // Save Address
  const handleSaveAddress = async () => {
    try {
      const requiredFields = ['pinCode', 'houseNumber', 'locality', 'city', 'district', 'state'];
      const missing = requiredFields.filter((f) => !formData[f] || !formData[f].trim());

      if (missing.length > 0) {
        Alert.alert('Error', `Please fill all required fields: ${missing.join(', ')}`);
        return;
      }

      setAddressLoading(true);

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'User not logged in. Please login again.');
        return;
      }

      const payload = {
        pinCode: formData.pinCode.trim(),
        houseNumber: formData.houseNumber.trim(),
        locality: formData.locality.trim(),
        city: formData.city.trim(),
        district: formData.district.trim(),
        state: formData.state.trim(),
        isDefault: isDefaultAddress,
        latitude: parseFloat(String(formData.latitude || 28.0)),
        longitude: parseFloat(String(formData.longitude || 77.0)),
      };

      // console.log('📤 Sending Address Payload:', payload);

      const res = await axios.post(
        `${API_BASE}/api/buyer/addresses`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      // console.log('✅ Server Response:', res.data);

      if (res.data.success) {
        console.log('🔄 Refreshing address immediately...');
        await fetchBuyerAddress();

        closeAddressModal();

        Alert.alert('Success', 'Address added successfully!');
      } else {
        Alert.alert('Error', res.data.message || 'Failed to add address');
      }
    } catch (error) {
      console.error('❌ Add Address Error:', error);

      let errorMessage = 'Failed to add address. Please try again.';

      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response?.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.response?.status === 400) {
          errorMessage = 'Invalid data. Please check all fields.';
        } else if (error.response?.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          await AsyncStorage.removeItem('userToken');
          return;
        } else if (error.response?.status === 403) {
          errorMessage = 'You do not have permission to add addresses.';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setAddressLoading(false);
    }
  };

  // Suggestion Card Component
  const SuggestionCard = ({ product }) => (
    <TouchableOpacity
      style={styles.suggestionCard}
      onPress={() => handleProductClick(product)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionImageContainer}>
        <Image
          source={{ uri: product.images?.[0] || 'https://via.placeholder.com/60' }}
          style={styles.suggestionImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.suggestionInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: scale(5) }}>
          <Text style={styles.suggestionName} numberOfLines={1}>{product.name}</Text>
          <View style={styles.suggestionRating}>
            <Image source={require("../../assets/via-farm-img/icons/satar.png")} />
            <Text style={styles.suggestionRatingText}>{product.rating || 0}</Text>
          </View>
        </View>

        <Text style={styles.suggestionVendor} numberOfLines={1}>
          by {product.vendor?.name || 'Unknown'}
        </Text>
        <View style={styles.suggestionMeta}>
          <Text style={styles.suggestionPrice}>₹{product.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.locationContainer}
              onPress={openAddressModal}
            >
              <Text style={styles.locationText}>
                {address?.city || 'Select City'}
              </Text>
              <Image source={require("../../assets/via-farm-img/icons/downArrow.png")} />
            </TouchableOpacity>
            <View style={styles.rightSection}>
              <TouchableOpacity onPress={notification}>
                <Image source={require('../../assets/via-farm-img/icons/notification.png')} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.profileContainer}
                onPress={() => navigation.navigate('profile')}
              >
                <View style={styles.profileCircle}>
                  {profilePicture ? (
                    <Image
                      source={{ uri: profilePicture }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <Text style={styles.profileText}>{getInitial()}</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.locationSubtitle}>
            {address?.locality || ''}{address?.district ? `, ${address.district}` : ''}
          </Text>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={normalizeFont(18)} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={placeholders[index]}
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={handleSearchChange}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchText('');
                setSuggestions([]);
                setFilteredSuggestions([]);
                setShowSuggestions(false);
              }}>
                <Ionicons name="close-circle" size={normalizeFont(18)} color="#999" />
              </TouchableOpacity>
            )}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <TouchableOpacity
                style={styles.filterButton}
                onPress={openFilterPopup}
                activeOpacity={0.7}
              >
                <Ionicons name="options" size={normalizeFont(20)} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {showSuggestions && (
          <View style={styles.suggestionsDropdown}>
            {loading ? (
              <View style={styles.suggestionsLoadingContainer}>
                <ActivityIndicator size="large" color="#FF9800" />
              </View>
            ) : filteredSuggestions.length > 0 ? (
              <FlatList
                data={filteredSuggestions}
                renderItem={({ item }) => <SuggestionCard product={item} />}
                keyExtractor={(item, index) => `${item._id}-${index}`}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                style={styles.suggestionsList}
                scrollEventThrottle={16}
                removeClippedSubviews={true}
              />
            ) : (
              <View style={styles.noSuggestionsContainer}>
                <Ionicons name="search" size={40} color="#ccc" />
                <Text style={styles.noSuggestionsText}>No products match your criteria</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Filter Popup Modal */}
      <Modal
        visible={showFilterPopup}
        transparent={true}
        animationType="none"
        onRequestClose={closeFilterPopup}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            onPress={closeFilterPopup}
            activeOpacity={1}
          />
          <Animated.View
            style={[
              styles.filterPopup,
              {
                transform: [{ translateX: slideAnim }]
              }
            ]}
          >
            <View style={styles.filterHeader}>
              <View style={styles.filterTitleContainer}>
                <Ionicons name="options" size={normalizeFont(18)} color="#333" />
                <Text style={styles.filterTitle}>Filters</Text>
              </View>
              <TouchableOpacity onPress={closeFilterPopup} activeOpacity={0.7}>
                <Ionicons name="close" size={normalizeFont(20)} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={['sort', 'price', 'distance', 'rating']}
              renderItem={({ item }) => {
                if (item === 'sort') {
                  return (
                    <View>
                      <TouchableOpacity
                        style={styles.filterOption}
                        onPress={() => setExpandedFilters({
                          ...expandedFilters,
                          sortBy: !expandedFilters.sortBy
                        })}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.filterOptionText}>Sort by</Text>
                        <Ionicons
                          name={expandedFilters.sortBy ? "chevron-up" : "chevron-down"}
                          size={normalizeFont(14)}
                          color="#666"
                        />
                      </TouchableOpacity>
                      {expandedFilters.sortBy && (
                        <View style={styles.filterDetails}>
                          {['Price - high to low', 'Newest Arrivals', 'Price - low to high', 'Freshness'].map((option) => (
                            <TouchableOpacity
                              key={option}
                              style={styles.filterOption2}
                              onPress={() => setTempFilters({ ...tempFilters, sortBy: option })}
                              activeOpacity={0.7}
                            >
                              <Text style={[
                                styles.filterOptionText2,
                                tempFilters.sortBy === option && styles.filterOptionText2Active
                              ]}>
                                {option}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                } else if (item === 'price') {
                  return (
                    <View>
                      <TouchableOpacity
                        style={styles.filterOption}
                        onPress={() => setExpandedFilters({
                          ...expandedFilters,
                          price: !expandedFilters.price
                        })}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.filterOptionText}>Price Range</Text>
                        <Ionicons
                          name={expandedFilters.price ? "chevron-up" : "chevron-down"}
                          size={normalizeFont(14)}
                          color="#666"
                        />
                      </TouchableOpacity>
                      {expandedFilters.price && (
                        <View style={styles.filterDetails}>
                          <View style={styles.sliderContainer}>
                            <View style={styles.sliderLabelRow}>
                              <Text style={styles.sliderLabel}>₹{tempFilters.priceMin}</Text>
                              <Text style={styles.sliderLabel}>₹{tempFilters.priceMax}</Text>
                            </View>
                            <View style={styles.sliderBar}>
                              <View style={[
                                styles.sliderFill,
                                {
                                  left: `${(tempFilters.priceMin / 3000) * 100}%`,
                                  right: `${100 - (tempFilters.priceMax / 3000) * 100}%`,
                                }
                              ]} />
                              <View
                                {...priceMinResponder.panHandlers}
                                style={[
                                  styles.sliderThumb,
                                  { left: `${(tempFilters.priceMin / 3000) * 100}%` }
                                ]}
                              />
                              <View
                                {...priceMaxResponder.panHandlers}
                                style={[
                                  styles.sliderThumb,
                                  { right: `${100 - (tempFilters.priceMax / 3000) * 100}%` }
                                ]}
                              />
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                } else if (item === 'distance') {
                  return (
                    <View>
                      <TouchableOpacity
                        style={styles.filterOption}
                        onPress={() => setExpandedFilters({
                          ...expandedFilters,
                          distance: !expandedFilters.distance
                        })}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.filterOptionText}>Distance</Text>
                        <Ionicons
                          name={expandedFilters.distance ? "chevron-up" : "chevron-down"}
                          size={normalizeFont(14)}
                          color="#666"
                        />
                      </TouchableOpacity>
                      {expandedFilters.distance && (
                        <View style={styles.filterDetails}>
                          <View style={styles.sliderContainer}>
                            <View style={styles.sliderLabelRow}>
                              <Text style={styles.sliderLabel}>{tempFilters.distanceMin}km</Text>
                              <Text style={styles.sliderLabel}>{tempFilters.distanceMax}km</Text>
                            </View>
                            <View style={styles.sliderBar}>
                              <View style={[
                                styles.sliderFill,
                                {
                                  left: `${(tempFilters.distanceMin / 100) * 100}%`,
                                  right: `${100 - (tempFilters.distanceMax / 100) * 100}%`,
                                }
                              ]} />
                              <View
                                {...distanceMinResponder.panHandlers}
                                style={[
                                  styles.sliderThumb,
                                  { left: `${(tempFilters.distanceMin / 100) * 100}%` }
                                ]}
                              />
                              <View
                                {...distanceMaxResponder.panHandlers}
                                style={[
                                  styles.sliderThumb,
                                  { right: `${100 - (tempFilters.distanceMax / 100) * 100}%` }
                                ]}
                              />
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                } else if (item === 'rating') {
                  return (
                    <View>
                      <TouchableOpacity
                        style={styles.filterOption}
                        onPress={() => setExpandedFilters({
                          ...expandedFilters,
                          rating: !expandedFilters.rating
                        })}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.filterOptionText}>Rating</Text>
                        <Ionicons
                          name={expandedFilters.rating ? "chevron-up" : "chevron-down"}
                          size={normalizeFont(14)}
                          color="#666"
                        />
                      </TouchableOpacity>
                      {expandedFilters.rating && (
                        <View style={styles.filterDetails}>
                          {[2.0, 3.0, 4.0].map((rating) => (
                            <TouchableOpacity
                              key={rating}
                              style={styles.checkboxRow}
                              onPress={() => setTempFilters({ ...tempFilters, ratingMin: tempFilters.ratingMin === rating ? 0 : rating })}
                              activeOpacity={0.7}
                            >
                              <View style={[
                                styles.checkbox,
                                tempFilters.ratingMin === rating && styles.checkboxChecked
                              ]}>
                                {tempFilters.ratingMin === rating && (
                                  <Ionicons name="checkmark" size={12} color="#fff" />
                                )}
                              </View>
                              <Text style={styles.checkboxLabel}>{rating} and above</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                }
              }}
              keyExtractor={(item) => item}
              scrollEnabled={false}
              nestedScrollEnabled={false}
            />

            <View style={styles.filterFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Address Modal */}
      <Modal
        visible={showAddressModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeAddressModal}
      >
        <View style={styles.addressModalOverlay}>
          <TouchableOpacity
            style={styles.addressOverlayTouchable}
            onPress={closeAddressModal}
            activeOpacity={1}
          />
          <Animated.View
            style={[
              styles.addressModalContent,
              {
                transform: [{ translateY: slideUpAnim }]
              }
            ]}
          >
            {/* Header */}
            <View style={styles.addressModalHeader}>
              <Text style={styles.addressModalTitle}>Add New Address</Text>
              <TouchableOpacity onPress={closeAddressModal} style={styles.addressCloseBtn}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.addressScrollView}
              showsVerticalScrollIndicator={false}
              scrollEnabled={true}
              nestedScrollEnabled={true}
            >
              {/* Current Location Button */}
              <View style={styles.locationBoxModal}>
                <TouchableOpacity
                  style={[styles.locationButtonModal, locating && styles.locationButtonDisabledModal]}
                  onPress={handleUseCurrentLocation}
                  disabled={locating}
                >
                  <Ionicons name="location" size={20} color="#3b82f6" />
                  <Text style={styles.locationTextModal}>
                    {locating ? 'Fetching location...' : 'Use Current Location'}
                  </Text>
                  {locating && <ActivityIndicator size="small" color="#3b82f6" style={{ marginLeft: 10 }} />}
                </TouchableOpacity>
              </View>

              {/* Address Form */}
              <View style={styles.addressSection}>
                <Text style={styles.addressSectionTitle}>Address Details *</Text>

                <TextInput
                  style={styles.addressTextInput}
                  placeholder="Pin Code *"
                  keyboardType="number-pad"
                  value={formData.pinCode}
                  onChangeText={(value) => handleAddressInputChange('pinCode', value)}
                  placeholderTextColor="#999"
                  maxLength={6}
                  editable={!addressLoading}
                />

                <TextInput
                  style={styles.addressTextInput}
                  placeholder="House Number / Block / Street *"
                  value={formData.houseNumber}
                  onChangeText={(value) => handleAddressInputChange('houseNumber', value)}
                  placeholderTextColor="#999"
                  editable={!addressLoading}
                />

                <TextInput
                  style={styles.addressTextInput}
                  placeholder="Locality / Town *"
                  value={formData.locality}
                  onChangeText={(value) => handleAddressInputChange('locality', value)}
                  placeholderTextColor="#999"
                  editable={!addressLoading}
                />

                <View style={styles.addressRow}>
                  <TextInput
                    style={[styles.addressTextInput, styles.addressHalfInput]}
                    placeholder="City *"
                    value={formData.city}
                    onChangeText={(value) => handleAddressInputChange('city', value)}
                    placeholderTextColor="#999"
                    editable={!addressLoading}
                  />
                  <TextInput
                    style={[styles.addressTextInput, styles.addressHalfInput]}
                    placeholder="District *"
                    value={formData.district}
                    onChangeText={(value) => handleAddressInputChange('district', value)}
                    placeholderTextColor="#999"
                    editable={!addressLoading}
                  />
                </View>

                <TextInput
                  style={styles.addressTextInput}
                  placeholder="State *"
                  value={formData.state}
                  onChangeText={(value) => handleAddressInputChange('state', value)}
                  placeholderTextColor="#999"
                  editable={!addressLoading}
                />

                <View style={styles.addressSwitchContainer}>
                  <Switch
                    value={isDefaultAddress}
                    onValueChange={setIsDefaultAddress}
                    trackColor={{ false: '#f0f0f0', true: '#3b82f6' }}
                    thumbColor="#fff"
                    disabled={addressLoading}
                  />
                  <Text style={styles.addressSwitchLabel}>Make this my default address</Text>
                </View>
              </View>

              <View style={{ height: 30 }} />
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.addressModalFooter}>
              <TouchableOpacity
                style={styles.addressCancelButton}
                onPress={closeAddressModal}
                disabled={addressLoading}
              >
                <Text style={styles.addressCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addressSaveButton, addressLoading && styles.addressSaveButtonDisabled]}
                onPress={handleSaveAddress}
                disabled={addressLoading}
              >
                {addressLoading ? (
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                ) : null}
                <Text style={styles.addressSaveButtonText}>
                  {addressLoading ? 'Saving...' : 'Save Address'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    zIndex: 1,
  },
  headerWrapper: {
    backgroundColor: '#fff',
    zIndex: 10000,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderBottomColor: '#f0f0f0',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: normalizeFont(11),
    fontWeight: '600',
    color: '#333',
    marginRight: moderateScale(4),
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileContainer: {
    marginLeft: moderateScale(8),
  },
  profileCircle: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
  },
  profileText: {
    color: '#fff',
    fontSize: normalizeFont(12),
    fontWeight: '600',
  },
  locationSubtitle: {
    fontSize: normalizeFont(11 ),
    color: '#666',
    marginBottom: moderateScale(10),
    marginLeft: moderateScale(2),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: moderateScale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: normalizeFont(12),
    color: '#333',
    paddingVertical: 0,
  },
  filterButton: {
    padding: moderateScale(4),
    marginLeft: moderateScale(4),
  },

  // Suggestions Dropdown
  suggestionsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    maxHeight: SCREEN_HEIGHT * 0.65,
    zIndex: 9999,
    elevation: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  suggestionsLoadingContainer: {
    height: scale(150),
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsList: {
    maxHeight: SCREEN_HEIGHT * 0.55,
  },
  suggestionCard: {
    flexDirection: 'row',
    padding: moderateScale(12),
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: moderateScale(15),
    borderRadius: 10,
    marginTop: moderateScale(10),
    marginBottom: moderateScale(5),
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  suggestionImageContainer: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(6),
    overflow: 'hidden',
    marginRight: moderateScale(12),
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  suggestionImage: {
    width: '100%',
    height: '100%',
  },
  suggestionInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  suggestionName: {
    fontSize: normalizeFont(13),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(2),
  },
  suggestionVendor: {
    fontSize: normalizeFont(11),
    color: '#666',
    marginBottom: moderateScale(4),
  },
  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  suggestionPrice: {
    fontSize: normalizeFont(12),
    fontWeight: '600',
    color: '#FF9800',
  },
  suggestionRating: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF3E0',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(8),
    gap: moderateScale(3),
    flexShrink: 0,
  },
  suggestionRatingText: {
    fontSize: normalizeFont(11),
    fontWeight: '600',
    color: '#FFB800',
  },
  noSuggestionsContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSuggestionsText: {
    fontSize: normalizeFont(14),
    color: '#999',
    marginTop: moderateScale(10),
  },

  // Filter Popup Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  filterPopup: {
    position: 'absolute',
    right: 0,
    top: 190,
    bottom: 0,
    width: moderateScale(280),
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderBottomLeftRadius: moderateScale(20),
    borderWidth: moderateScale(2),
    borderColor: 'rgba(255, 202, 40, 1)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(5),
    flexDirection: 'column',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTitle: {
    fontSize: normalizeFont(16),
    fontWeight: '600',
    color: '#333',
    marginLeft: moderateScale(8),
  },
  filterContent: {
    flex: 1,
    paddingVertical: moderateScale(0),
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  filterOption2: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  filterOptionText: {
    fontSize: normalizeFont(14),
    fontWeight: '500',
    color: '#333',
  },
  filterOptionText2: {
    fontSize: normalizeFont(13),
    color: '#666',
  },
  filterOptionText2Active: {
    fontWeight: '600',
    color: '#333',
  },
  filterDetails: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },

  // Slider Styles
  sliderContainer: {
    paddingVertical: moderateScale(8),
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(10),
  },
  sliderLabel: {
    fontSize: normalizeFont(12),
    fontWeight: '600',
    color: '#333',
  },
  sliderBar: {
    height: moderateScale(30),
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    height: moderateScale(4),
    backgroundColor: '#4CAF50',
    borderRadius: moderateScale(2),
    top: moderateScale(13),
  },
  sliderThumb: {
    position: 'absolute',
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    backgroundColor: '#4CAF50',
    top: moderateScale(5),
    borderWidth: 2,
    borderColor: '#fff',
  },

  // Checkbox Styles
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
  },
  checkbox: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(2),
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10),
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxLabel: {
    fontSize: normalizeFont(13),
    color: '#333',
  },

  filterFooter: {
    padding: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  applyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: normalizeFont(14),
    fontWeight: '600',
  },

  // Address Modal Styles
  addressModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  addressOverlayTouchable: {
    flex: 1,
  },
  addressModalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    borderWidth:2,
    borderColor:'rgba(255, 202, 40, 1)',
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    maxHeight: SCREEN_HEIGHT * 0.9,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(8),
  },
  addressModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addressModalTitle: {
    fontSize: normalizeFont(15),
    fontWeight: '700',
    color: '#1a1a1a',
  },
  addressCloseBtn: {
    padding: moderateScale(4),
  },
  addressScrollView: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
  },
  locationBoxModal: {
    marginBottom: moderateScale(16),
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    backgroundColor: '#e8f0ff',
  },
  locationButtonModal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationButtonDisabledModal: {
    opacity: 0.6,
  },
  locationTextModal: {
    marginLeft: moderateScale(8),
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: normalizeFont(13),
  },
  addressSection: {
    marginBottom: moderateScale(20),
  },
  addressSectionTitle: {
    fontSize: normalizeFont(14),
    fontWeight: '600',
    marginBottom: moderateScale(12),
    color: '#1a1a1a',
  },
  addressTextInput: {
    borderWidth: 1,
    borderColor: 'rgba(255, 202, 40, 1)',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    fontSize: normalizeFont(12),
    marginBottom: moderateScale(10),
    color: '#333',
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(10),
  },
  addressHalfInput: {
    flex: 1,
    marginRight: moderateScale(8),
    marginBottom: 0,
  },
  addressSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(12),
    marginBottom: moderateScale(16),
  },
  addressSwitchLabel: {
    marginLeft: moderateScale(8),
    fontSize: normalizeFont(14),
    color: '#333',
  },
  addressModalFooter: {
    flexDirection: 'row',
    padding: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    gap: moderateScale(10),
  },
  addressCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  addressCancelButtonText: {
    color: '#555',
    fontWeight: '500',
    fontSize: normalizeFont(14),
  },
  addressSaveButton: {
    flex: 1,
    backgroundColor: 'rgba(76, 175, 80, 1)',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  addressSaveButtonDisabled: {
    opacity: 0.6,
  },
  addressSaveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: normalizeFont(14),
  },
});

// HeaderDesign_responsive_fonts.jsx
// import { AuthContext } from '@/app/context/AuthContext';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import React, { useContext, useEffect, useState } from 'react';
// import {
//   Dimensions,
//   Image,
//   PixelRatio,
//   Platform,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// // Responsive helpers
// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// // base dimensions (iPhone X)
// const guidelineBaseWidth = 375;
// const guidelineBaseHeight = 812;

// const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
// const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
// const moderateScale = (size, factor = 0.5) =>
//   size + (scale(size) - size) * factor;

// const normalizeFont = (size) => {
//   const newSize = moderateScale(size);
//   if (Platform.OS === 'ios') {
//     return Math.round(PixelRatio.roundToNearestPixel(newSize));
//   } else {
//     // android renders slightly larger, so reduce by 1 for parity
//     return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
//   }
// };

// export default function HeaderDesign() {
//   const [searchText, setSearchText] = useState('');
//   const navigation = useNavigation();

//   const placeholders = ['Search by Products', 'Search by Name', 'Search by ID'];
//   const [index, setIndex] = useState(0);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setIndex((p) => (p + 1) % placeholders.length);
//     }, 2000);
//     return () => clearInterval(interval);
//   }, []);

//   // AuthContext se user data (defensive fallback)
//   const { user, address, fetchBuyerAddress } = useContext(AuthContext ?? {});
//   const profilePicture = user?.profilePicture || user?.profileImage || null;
//   const getInitial = () =>
//     user?.name && user.name.length > 0 ? user.name.charAt(0).toUpperCase() : 'U';

//   useEffect(() => {
//     if (typeof fetchBuyerAddress === 'function') {
//       fetchBuyerAddress();
//     }
//   }, [fetchBuyerAddress]);

//   const goNotification = () => navigation.navigate?.('Notification');
//   const goProfile = () => navigation.navigate?.('profile');
//   const onSubmitSearch = () => {
//     if (!searchText?.trim()) return;
//     navigation.navigate?.('SearchResults', { q: searchText.trim() });
//   };

//   const cityText = address?.city || 'Select City';
//   const localityText = address?.locality || '';
//   const districtText = address?.district ? `, ${address.district}` : '';

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar backgroundColor="#fff" barStyle="dark-content" />
//       <View style={styles.header}>
//         <View style={styles.topRow}>
//           <TouchableOpacity
//             style={styles.locationContainer}
//             onPress={() => navigation.navigate?.('SelectCity')}
//             activeOpacity={0.8}
//           >
//             <Text style={styles.locationText}>{cityText}</Text>
//             <Image
//               source={require('../../assets/via-farm-img/icons/downArrow.png')}
//               style={styles.downIcon}
//             />
//           </TouchableOpacity>

//           <View style={styles.rightSection}>
//             <TouchableOpacity
//               onPress={goNotification}
//               activeOpacity={0.8}
//               style={styles.bellButton}
//             >
//               <View style={styles.bellWrap}>
//                 <Image
//                   source={require('../../assets/via-farm-img/icons/notification.png')}
//                   style={styles.bellIcon}
//                 />
//               </View>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.profileContainer}
//               onPress={goProfile}
//               activeOpacity={0.8}
//             >
//               <View style={styles.profileCircle}>
//                 {profilePicture ? (
//                   <Image
//                     source={{ uri: profilePicture }}
//                     style={styles.profileImage}
//                     resizeMode="cover"
//                   />
//                 ) : (
//                   <Text style={styles.profileText}>{getInitial()}</Text>
//                 )}
//               </View>
//             </TouchableOpacity>
//           </View>
//         </View>

//         <Text
//           style={styles.locationSubtitle}
//           numberOfLines={1}
//           ellipsizeMode="tail"
//         >
//           {localityText}
//           {districtText}
//         </Text>

//         <View style={styles.searchContainer}>
//           <Ionicons
//             name="search"
//             size={normalizeFont(18)}
//             color="#999"
//             style={styles.searchIcon}
//           />
//           <TextInput
//             style={styles.searchInput}
//             placeholder={placeholders[index]}
//             placeholderTextColor="#999"
//             value={searchText}
//             onChangeText={setSearchText}
//             returnKeyType="search"
//             onSubmitEditing={onSubmitSearch}
//             selectionColor="#333"
//           />
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: '#fff',

//   },
//   header: {
//     backgroundColor: '#fff',
//     paddingHorizontal: moderateScale(16),
//     paddingTop: verticalScale(12),
//     paddingBottom: verticalScale(10),
//   },
//   topRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },

//   locationContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     maxWidth: '75%',
//   },
//   locationText: {
//     fontSize: normalizeFont(12), 
//     fontWeight: '600',
//     color: '#333',
//     marginRight: moderateScale(6),
//   },
//   downIcon: {
//     width: moderateScale(14),
//     height: moderateScale(14),
//     tintColor: '#333',
//   },

//   rightSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },

//   bellButton: {
//     marginRight: moderateScale(10),
//   },
//   bellWrap: {
//     width: moderateScale(40),
//     height: moderateScale(40),
//     borderRadius: moderateScale(20),
//     backgroundColor: '#fff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     ...Platform.select({
//       ios: {
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 5 },
//         shadowOpacity: 0.06,
//         shadowRadius: 8,
//       },
//       android: {
//         elevation: 4,
//       },
//     }),
//   },
//   bellIcon: {
//     width: moderateScale(18),
//     height: moderateScale(18),
//     resizeMode: 'contain',
//     tintColor: '#333',
//   },

//   profileContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   profileCircle: {
//     width: moderateScale(40),
//     height: moderateScale(40),
//     borderRadius: moderateScale(20),
//     backgroundColor: '#FF9800',
//     justifyContent: 'center',
//     alignItems: 'center',
//     overflow: 'hidden',
//   },
//   profileImage: {
//     width: moderateScale(40),
//     height: moderateScale(40),
//     borderRadius: moderateScale(20),
//   },
//   profileText: {
//     color: '#fff',
//     fontSize: normalizeFont(12),
//     fontWeight: '600',
//   },

//   locationSubtitle: {
//     fontSize: normalizeFont(12),
//     color: '#666',
//     marginTop: verticalScale(6),
//     marginBottom: verticalScale(12),
//     maxWidth: '100%',
//   },

//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f8f8f8',
//     borderRadius: moderateScale(8),
//     paddingHorizontal: moderateScale(12),
//     paddingVertical: verticalScale(8),
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   searchIcon: {
//     marginRight: moderateScale(8),
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: normalizeFont(12),
//     color: '#333',
//     paddingVertical: 0,
//   },
// });
