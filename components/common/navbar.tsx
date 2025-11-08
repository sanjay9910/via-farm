// HeaderDesign_responsive_keep_all.jsx
import { AuthContext } from '@/app/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  PixelRatio,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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

export default function HeaderDesign() {
  const [searchText, setSearchText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const slideAnim = useState(new Animated.Value(width))[0];
  const navigation = useNavigation();

  // Filter states
  const [filters, setFilters] = useState({
    sortBy: 'relevance',
    priceMin: 50,
    priceMax: 3000,
    distanceMin: 4,
    distanceMax: 40,
    ratingMin: 0,
  });

  const [tempFilters, setTempFilters] = useState({
    sortBy: 'relevance',
    priceMin: 50,
    priceMax: 3000,
    distanceMin: 4,
    distanceMax: 40,
    ratingMin: 0,
  });

  const [expandedFilters, setExpandedFilters] = useState({
    sortBy: false,
    price: false,
    distance: false,
    rating: false,
  });

  const placeholders = ["Search by Products", "Search by Name", "Search by ID"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % placeholders.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Handle search text change - show suggestions
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

  // Handle product click - navigate to ViewProduct
  const handleProductClick = (product) => {
    console.log('Navigating with Product ID:', product._id);
    setShowSuggestions(false);
    // Pass productId directly, not the whole product object
    navigation.navigate('ViewProduct', { productId: product._id });
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

  // Suggestion card component - clickable
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
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:scale(5)}}>
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
            <TouchableOpacity style={styles.locationContainer}>
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

        {/* Suggestions Dropdown - FlatList ke saath scrolling control */}
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
                                  left: `${(tempFilters.priceMin / 5000) * 100}%`,
                                  right: `${100 - (tempFilters.priceMax / 5000) * 100}%`,
                                }
                              ]} />
                              <TouchableOpacity
                                style={[
                                  styles.sliderThumb,
                                  { left: `${(tempFilters.priceMin / 5000) * 100}%` }
                                ]}
                                onPress={() => {}}
                              />
                              <TouchableOpacity
                                style={[
                                  styles.sliderThumb,
                                  { right: `${100 - (tempFilters.priceMax / 5000) * 100}%` }
                                ]}
                                onPress={() => {}}
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
                              <TouchableOpacity
                                style={[
                                  styles.sliderThumb,
                                  { left: `${(tempFilters.distanceMin / 100) * 100}%` }
                                ]}
                                onPress={() => {}}
                              />
                              <TouchableOpacity
                                style={[
                                  styles.sliderThumb,
                                  { right: `${100 - (tempFilters.distanceMax / 100) * 100}%` }
                                ]}
                                onPress={() => {}}
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
    marginBottom: moderateScale(4),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: normalizeFont(12),
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
    fontSize: normalizeFont(12),
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
    fontSize: normalizeFont(15),
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
