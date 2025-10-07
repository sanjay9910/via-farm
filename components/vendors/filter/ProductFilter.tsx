import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

const { width } = Dimensions.get("window");

const ProductFilter = () => {
  const [selectedCategory, setSelectedCategory] = useState('Fruits');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    stock: false,
    date: false,
    amount: false,
  });

  const [stockFilter, setStockFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState('');

  const slideAnim = useRef(new Animated.Value(width)).current;
  const dropdownButtonRef = useRef(null);

  const categories = ['All', 'Fruits', 'Vegetables'];
  const stockOptions = ['Out of Stock', 'In Stock'];
  const dateOptions = ['Today', 'Last 7 Days', 'Last 30 Days', 'All Time'];
  const amountOptions = ['Low to High', 'High to Low'];

  // Animate filter modal
  useEffect(() => {
    if (isFilterOpen) {
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
  }, [isFilterOpen]);

  const openDropdown = () => {
    dropdownButtonRef.current?.measure((fx, fy, w, h, px, py) => {
      setDropdownPos({ top: py + h, left: px, width: w });
      setIsDropdownOpen(true);
    });
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const applyFilters = () => {
    console.log("Applied Filters:", { stockFilter, dateFilter, amountFilter });
    setIsFilterOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>My Products</Text>

      {/* Right Side Controls */}
      <View style={styles.controls}>
        {/* Category Dropdown */}
        <TouchableOpacity
          ref={dropdownButtonRef}
          style={styles.dropdownButton}
          onPress={openDropdown}
          activeOpacity={0.7}
        >
          <Text style={styles.dropdownText}>{selectedCategory}</Text>
          <Feather name="chevron-down" size={18} color="#6b7280" />
        </TouchableOpacity>

        {/* Filter Button */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setIsFilterOpen(true)}
          activeOpacity={0.7}
        >
       <Image source={require("../../../assets/via-farm-img/icons/filter.png")} />
        </TouchableOpacity>
      </View>

      {/* Dropdown Modal */}
      <Modal
        visible={isDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.dropdownMenu,
                {
                  position: "absolute",
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  width: dropdownPos.width,
                },
              ]}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.dropdownItem,
                    selectedCategory === category && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory(category);
                    setIsDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedCategory === category &&
                      styles.dropdownItemTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Filter Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={isFilterOpen}
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <TouchableOpacity style={styles.filterOverlay} activeOpacity={1} onPress={() => setIsFilterOpen(false)}>
          <Animated.View style={[styles.filterModal, { transform: [{ translateX: slideAnim }] }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setIsFilterOpen(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Stock */}
              <View style={styles.filterSection}>
                <TouchableOpacity style={styles.filterHeader} onPress={() => toggleSection('stock')}>
                  <Text style={styles.filterTitle}>Stock</Text>
                  <Text style={[styles.chevron, expandedSections.stock && styles.chevronRotated]}>›</Text>
                </TouchableOpacity>
                {expandedSections.stock && (
                  <View style={styles.filterOptions}>
                    {stockOptions.map((option) => (
                      <TouchableOpacity key={option} style={styles.radioOption} onPress={() => setStockFilter(option)}>
                        <View style={[styles.radioCircle, stockFilter === option && styles.radioCircleSelected]}>
                          {stockFilter === option && <View style={styles.radioSelected} />}
                        </View>
                        <Text style={[styles.optionText, stockFilter === option && styles.optionTextSelected]}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Date */}
              <View style={styles.filterSection}>
                <TouchableOpacity style={styles.filterHeader} onPress={() => toggleSection('date')}>
                  <Text style={styles.filterTitle}>By Date</Text>
                  <Text style={[styles.chevron, expandedSections.date && styles.chevronRotated]}>›</Text>
                </TouchableOpacity>
                {expandedSections.date && (
                  <View style={styles.filterOptions}>
                    {dateOptions.map((option) => (
                      <TouchableOpacity key={option} style={styles.radioOption} onPress={() => setDateFilter(option)}>
                        <View style={[styles.radioCircle, dateFilter === option && styles.radioCircleSelected]}>
                          {dateFilter === option && <View style={styles.radioSelected} />}
                        </View>
                        <Text style={[styles.optionText, dateFilter === option && styles.optionTextSelected]}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Amount */}
              <View style={styles.filterSection}>
                <TouchableOpacity style={styles.filterHeader} onPress={() => toggleSection('amount')}>
                  <Text style={styles.filterTitle}>Amount</Text>
                  <Text style={[styles.chevron, expandedSections.amount && styles.chevronRotated]}>›</Text>
                </TouchableOpacity>
                {expandedSections.amount && (
                  <View style={styles.filterOptions}>
                    {amountOptions.map((option) => (
                      <TouchableOpacity key={option} style={styles.radioOption} onPress={() => setAmountFilter(option)}>
                        <View style={[styles.radioCircle, amountFilter === option && styles.radioCircleSelected]}>
                          {amountFilter === option && <View style={styles.radioSelected} />}
                        </View>
                        <Text style={[styles.optionText, amountFilter === option && styles.optionTextSelected]}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ProductFilter;

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', color: '#374151' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dropdownButton: { flexDirection: 'row', alignItems: 'center', gap: 32, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.3)', borderRadius: 8, minWidth: 120 },
  dropdownText: { fontSize: 15, color: '#374151', fontWeight: '400' },
  filterButton: { padding: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1 },
  dropdownMenu: { backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.3)' },
  dropdownItem: { paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  dropdownItemActive: { backgroundColor: '#f3f4f6' },
  dropdownItemText: { fontSize: 15, color: '#374151' },
  dropdownItemTextActive: { fontWeight: '600', color: '#111827' },

  // Filter Modal
  filterOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  filterModal: { position: 'absolute', right: 0, top: 280, bottom: 80, width: 250, backgroundColor: '#fff', borderTopLeftRadius: 20, borderBottomLeftRadius: 20, borderWidth: 2, borderColor: 'rgba(255,202,40,1)', elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  closeButton: { fontSize: 22, color: '#333' },
  modalBody: { flex: 1, backgroundColor: '#fff', padding: 20 },
  filterSection: { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  filterTitle: { fontSize: 16, fontWeight: '500', color: '#333' },
  chevron: { fontSize: 16, color: '#666', transform: [{ rotate: '0deg' }] },
  chevronRotated: { transform: [{ rotate: '180deg' }] },
  filterOptions: { paddingBottom: 16 },
  radioOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#d1d5db', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  radioCircleSelected: { borderColor: '#22c55e' },
  radioSelected: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' },
  optionText: { fontSize: 14, color: '#6b7280' },
  optionTextSelected: { color: '#1f2937', fontWeight: '600' },
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  applyButton: { backgroundColor: '#4CAF50', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  applyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
