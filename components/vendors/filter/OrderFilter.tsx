import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

const OrderFilter = () => {
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [priceRange, setPriceRange] = useState(5000);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    sortBy: false,
    priceRange: false,
    status: false,
    date: false,
  });

  const [sliderWidth, setSliderWidth] = useState(0);
  const [sliderLeft, setSliderLeft] = useState(0);

  const slideAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    if (isModalVisible) {
      slideAnim.setValue(width);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
  }, [isModalVisible]);

  const sortOptions = ['Price - high to low', 'Newest Arrivals', 'Price - low to high', 'Freshness'];
  const dateOptions = ['Today', 'Last 7 days', 'Last 30 days', 'Last 3 months', 'Last 6 months', 'All time'];
  const statusOptions = ['Complete', 'Cancelled', 'In Progress'];

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // PanResponder for price slider
  const STEP = 100; // Price increment step
  const MIN_PRICE = 100;
  const MAX_PRICE = 5000;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (sliderWidth > 0) {
          let relativeX = gestureState.moveX - sliderLeft;
          relativeX = Math.max(0, Math.min(sliderWidth, relativeX));

          const price = MIN_PRICE + ((relativeX / sliderWidth) * (MAX_PRICE - MIN_PRICE));
          const newPrice = Math.round(price / STEP) * STEP;

          setPriceRange(newPrice);
        }
      },
    })
  ).current;

  const applyFilters = () => {
    console.log('Filters applied:', { sortBy, priceRange, statusFilter, dateFilter });
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <View style={styles.searchContainer}>
          <Image style={styles.searchIcon} source={require('../../../assets/via-farm-img/icons/search.png')} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity style={styles.filterButton} onPress={() => setIsModalVisible(true)}>
            <Image source={require('../../../assets/via-farm-img/icons/filter.png')} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsModalVisible(false)}>
          <Animated.View style={[styles.modalContent, { transform: [{ translateX: slideAnim }] }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.filterIconContainer}>
                  <Image source={require('../../../assets/via-farm-img/icons/filter.png')} />
                </View>
                <Text style={styles.modalTitle}>Filters</Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButtonContainer}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Sort By */}
              <View style={styles.filterSection}>
                <TouchableOpacity style={styles.filterHeader} onPress={() => toggleSection('sortBy')} activeOpacity={0.7}>
                  <Text style={styles.filterTitle}>Sort by</Text>
                  <Text style={[styles.chevron, expandedSections.sortBy && styles.chevronRotated]}>›</Text>
                </TouchableOpacity>
                {expandedSections.sortBy && (
                  <View style={styles.filterOptions}>
                    {sortOptions.map((option) => (
                      <TouchableOpacity key={option} style={styles.radioOption} onPress={() => setSortBy(option)} activeOpacity={0.7}>
                        <View style={[styles.radioCircle, sortBy === option && styles.radioCircleSelected]}>
                          {sortBy === option && <View style={styles.radioSelected} />}
                        </View>
                        <Text style={[styles.optionText, sortBy === option && styles.optionTextSelected]}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Post by Date */}
              <View style={styles.filterSection}>
                <TouchableOpacity style={styles.filterHeader} onPress={() => toggleSection('date')} activeOpacity={0.7}>
                  <Text style={styles.filterTitle}>Post by Date</Text>
                  <Text style={[styles.chevron, expandedSections.date && styles.chevronRotated]}>›</Text>
                </TouchableOpacity>
                {expandedSections.date && (
                  <View style={styles.filterOptions}>
                    {dateOptions.map((option) => (
                      <TouchableOpacity key={option} style={styles.radioOption} onPress={() => setDateFilter(option)} activeOpacity={0.7}>
                        <View style={[styles.radioCircle, dateFilter === option && styles.radioCircleSelected]}>
                          {dateFilter === option && <View style={styles.radioSelected} />}
                        </View>
                        <Text style={[styles.optionText, dateFilter === option && styles.optionTextSelected]}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Price Range */}
              <View style={styles.filterSection}>
                <TouchableOpacity style={styles.filterHeader} onPress={() => toggleSection('priceRange')} activeOpacity={0.7}>
                  <Text style={styles.filterTitle}>Price Range</Text>
                  <Text style={[styles.chevron, expandedSections.priceRange && styles.chevronRotated]}>›</Text>
                </TouchableOpacity>
                {expandedSections.priceRange && (
                  <View style={styles.filterOptions}>
                    <View style={styles.priceDisplay}>
                      <View style={styles.priceBox}>
                        <Text style={styles.priceLabel}>Min</Text>
                        <Text style={styles.priceValue}>₹{MIN_PRICE}</Text>
                      </View>
                      <View style={styles.priceDivider} />
                      <View style={styles.priceBox}>
                        <Text style={styles.priceLabel}>Max</Text>
                        <Text style={styles.priceValue}>₹{priceRange}</Text>
                      </View>
                    </View>

                    <View
                      style={styles.sliderContainer}
                      onLayout={(e) => {
                        setSliderWidth(e.nativeEvent.layout.width);
                        setSliderLeft(e.nativeEvent.layout.x);
                      }}
                    >
                      <View style={styles.sliderTrack} {...panResponder.panHandlers}>
                        <View style={[styles.sliderFill, { width: `${((priceRange - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100}%` }]} />
                        <View style={[styles.sliderThumb, { left: `${((priceRange - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100}%` }]} />
                      </View>
                    </View>
                    <View style={styles.sliderValues}>
                      <Text style={styles.sliderLabel}>₹{MIN_PRICE}</Text>
                      <Text style={styles.sliderLabel}>₹{MAX_PRICE}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Status */}
              <View style={styles.filterSection}>
                <TouchableOpacity style={styles.filterHeader} onPress={() => toggleSection('status')} activeOpacity={0.7}>
                  <Text style={styles.filterTitle}>Status</Text>
                  <Text style={[styles.chevron, expandedSections.status && styles.chevronRotated]}>›</Text>
                </TouchableOpacity>
                {expandedSections.status && (
                  <View style={styles.filterOptions}>
                    {statusOptions.map((option) => (
                      <TouchableOpacity key={option} style={styles.radioOption} onPress={() => setStatusFilter(option)} activeOpacity={0.7}>
                        <View style={[styles.radioCircle, statusFilter === option && styles.radioCircleSelected]}>
                          {statusFilter === option && <View style={styles.radioSelected} />}
                        </View>
                        <Text style={[styles.optionText, statusFilter === option && styles.optionTextSelected]}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters} activeOpacity={0.8}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default OrderFilter;

// Styles remain mostly same
const styles = StyleSheet.create({
  container: { backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.1)' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#1f2937', padding: 0 },
  filterButton: { marginLeft: 8, padding: 6, borderRadius: 8, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { position: 'absolute', right: 0, top: 120, bottom: 80, width: 250, backgroundColor: '#fff', borderTopLeftRadius: 20, borderBottomLeftRadius: 20, borderWidth: 2, borderColor: 'rgba(255, 202, 40, 1)', elevation: 10, shadowColor: '#000', shadowOffset: { width: -2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterIconContainer: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  closeButtonContainer: { padding: 0 },
  closeButton: { fontSize: 24, color: '#333', fontWeight: '400' },
  modalBody: { flex: 1, backgroundColor: '#ffffff', padding: 20 },
  filterSection: { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, backgroundColor: '#ffffff' },
  filterTitle: { fontSize: 16, fontWeight: '400', color: '#333' },
  chevron: { fontSize: 16, color: '#666', fontWeight: '300', transform: [{ rotate: '0deg' }] },
  chevronRotated: { transform: [{ rotate: '180deg' }] },
  filterOptions: { paddingBottom: 16, backgroundColor: '#ffffff' },
  radioOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#d1d5db', marginRight: 14, alignItems: 'center', justifyContent: 'center' },
  radioCircleSelected: { borderColor: '#22c55e' },
  radioSelected: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e' },
  optionText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  optionTextSelected: { color: '#1f2937', fontWeight: '600' },
  priceDisplay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 10, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e5e7eb' },
  priceBox: { flex: 1, alignItems: 'center' },
  priceLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 4, fontWeight: '500' },
  priceValue: { fontSize: 18, fontWeight: '700', color: '#22c55e' },
  priceDivider: { width: 1, height: 30, backgroundColor: '#e5e7eb', marginHorizontal: 16 },
  sliderContainer: { marginBottom: 12, paddingVertical: 10 },
  sliderTrack: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, position: 'relative' },
  sliderFill: { height: 6, backgroundColor: '#22c55e', borderRadius: 3 },
  sliderThumb: { position: 'absolute', top: -5, width: 16, height: 16, borderRadius: 8, backgroundColor: '#22c55e', borderWidth: 3, borderColor: '#ffffff' },
  sliderValues: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  sliderLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  modalFooter: { padding: 20, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f0f0f0', borderBottomLeftRadius: 20 },
  applyButton: { backgroundColor: '#4CAF50', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  applyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
