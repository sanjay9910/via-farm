// ProductFilterResponsive.js
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
    View
} from 'react-native';

/**
 * Responsive helpers (no external dependency)
 * baseline 375 width typical mobile design
 */
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;
const normalizeFont = (size) => Math.round(moderateScale(size) * (SCREEN_WIDTH / guidelineBaseWidth));

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

  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const dropdownButtonRef = useRef(null);

  const categories = ['All', 'Fruits', 'Vegetables', 'Seeds', 'Plants', 'Handicrafts'];
  const stockOptions = ['Out of Stock', 'In Stock'];
  const dateOptions = ['Today', 'Last 7 Days', 'Last 30 Days', 'All Time'];
  const amountOptions = ['Low to High', 'High to Low'];

  // Animate filter modal
  useEffect(() => {
    if (isFilterOpen) {
      slideAnim.setValue(SCREEN_WIDTH);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  }, [isFilterOpen, slideAnim]);

  const openDropdown = () => {
    // measure element position using measureInWindow for reliability
    const node = dropdownButtonRef.current;
    if (!node || !node.measureInWindow) {
      // fallback: center top under header
      const fallbackTop = moderateScale(48);
      const fallbackLeft = scale(16);
      setDropdownPos({ top: fallbackTop, left: fallbackLeft, width: SCREEN_WIDTH - fallbackLeft * 2 });
      setIsDropdownOpen(true);
      return;
    }
    node.measureInWindow((x, y, w, h) => {
      // compute desired top/left but ensure dropdown fits in width
      const padding = scale(8);
      const maxWidth = Math.min(w * 1.05, SCREEN_WIDTH - padding * 2);
      let left = x;
      // if dropdown would overflow, adjust left
      if (left + maxWidth > SCREEN_WIDTH - padding) {
        left = Math.max(padding, SCREEN_WIDTH - padding - maxWidth);
      }
      const top = Math.min(y + h + scale(6), SCREEN_HEIGHT - moderateScale(120));
      setDropdownPos({ top, left, width: maxWidth });
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
    // you can wire real filter callback here
    console.log('Applied Filters:', { stockFilter, dateFilter, amountFilter, selectedCategory });
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
          ref={(r) => (dropdownButtonRef.current = r)}
          style={styles.dropdownButton}
          onPress={openDropdown}
          activeOpacity={0.75}
        >
          <Text style={styles.dropdownText} numberOfLines={1}>
            {selectedCategory}
          </Text>
          <Feather name="chevron-down" size={moderateScale(16)} color="#6b7280" />
        </TouchableOpacity>

        {/* Filter Button */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setIsFilterOpen(true)}
          activeOpacity={0.75}
        >
          {/* small filter icon - replace require path if needed */}
          <Image
            source={require('../../../assets/via-farm-img/icons/filterIcon.png')}
            style={styles.filterIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Dropdown Modal */}
      <Modal visible={isDropdownOpen} transparent animationType="fade" onRequestClose={() => setIsDropdownOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.dropdownMenu,
                {
                  position: 'absolute',
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  width: dropdownPos.width || Math.min(scale(200), SCREEN_WIDTH - scale(32)),
                },
              ]}
            >
              <ScrollView nestedScrollEnabled style={{ maxHeight: moderateScale(220) }}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[styles.dropdownItem, selectedCategory === category && styles.dropdownItemActive]}
                    onPress={() => {
                      setSelectedCategory(category);
                      setIsDropdownOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dropdownItemText, selectedCategory === category && styles.dropdownItemTextActive]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Filter Modal */}
      <Modal animationType="none" transparent visible={isFilterOpen} onRequestClose={() => setIsFilterOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setIsFilterOpen(false)}>
          <View style={styles.filterOverlay} />
        </TouchableWithoutFeedback>

        {/* Animated sliding panel */}
        <Animated.View
          style={[
            styles.filterModal,
            {
              // slide from right to left by translateX = slideAnim
              transform: [{ translateX: slideAnim }],
              // set height/width responsively
              height: Math.min(SCREEN_HEIGHT * 0.78, 760),
              width: Math.min(Math.max(SCREEN_WIDTH * 0.78, 260), 420), // responsive width between 260 and 420
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setIsFilterOpen(false)} accessibilityRole="button" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: moderateScale(20) }} showsVerticalScrollIndicator={false}>
            {/* Stock */}
            <View style={styles.filterSection}>
              <TouchableOpacity style={styles.filterHeader} onPress={() => toggleSection('stock')} activeOpacity={0.8}>
                <Text style={styles.filterTitle}>Stock</Text>
                <Text style={[styles.chevron, expandedSections.stock && styles.chevronRotated]}>›</Text>
              </TouchableOpacity>
              {expandedSections.stock && (
                <View style={styles.filterOptions}>
                  {stockOptions.map((option) => (
                    <TouchableOpacity key={option} style={styles.radioOption} onPress={() => setStockFilter(option)} activeOpacity={0.75}>
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
              <TouchableOpacity style={styles.filterHeader} onPress={() => toggleSection('date')} activeOpacity={0.8}>
                <Text style={styles.filterTitle}>By Date</Text>
                <Text style={[styles.chevron, expandedSections.date && styles.chevronRotated]}>›</Text>
              </TouchableOpacity>
              {expandedSections.date && (
                <View style={styles.filterOptions}>
                  {dateOptions.map((option) => (
                    <TouchableOpacity key={option} style={styles.radioOption} onPress={() => setDateFilter(option)} activeOpacity={0.75}>
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
              <TouchableOpacity style={styles.filterHeader} onPress={() => toggleSection('amount')} activeOpacity={0.8}>
                <Text style={styles.filterTitle}>Amount</Text>
                <Text style={[styles.chevron, expandedSections.amount && styles.chevronRotated]}>›</Text>
              </TouchableOpacity>
              {expandedSections.amount && (
                <View style={styles.filterOptions}>
                  {amountOptions.map((option) => (
                    <TouchableOpacity key={option} style={styles.radioOption} onPress={() => setAmountFilter(option)} activeOpacity={0.75}>
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
            <TouchableOpacity style={styles.applyButton} onPress={applyFilters} activeOpacity={0.85}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
};

export default ProductFilter;

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    backgroundColor: '#fff',
  },
  title: {
    fontSize: normalizeFont(18),
    fontWeight: '700',
    color: '#374151',
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },

  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: moderateScale(10),
    minWidth: moderateScale(110),
    maxWidth: moderateScale(220),
  },

  dropdownText: {
    fontSize: normalizeFont(14),
    color: '#374151',
    fontWeight: '500',
    marginRight: moderateScale(8),
  },

  filterButton: {
    padding: moderateScale(8),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: moderateScale(8),
  },

  filterIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    tintColor: '#374151',
  },

  modalOverlay: { flex: 1 },

  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(10),
    elevation: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },

  dropdownItem: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f8faf8',
  },

  dropdownItemActive: {
    backgroundColor: '#f8faf8',
  },

  dropdownItemText: {
    fontSize: normalizeFont(14),
    color: '#374151',
  },

  dropdownItemTextActive: {
    fontWeight: '600',
    color: '#111827',
  },

  // Filter Modal overlay (dark)
  filterOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  // Sliding panel (animated)
  filterModal: {
    position: 'absolute',
    right: 0,
    top: moderateScale(96),
    // bottom: moderateScale(48),
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(16),
    borderBottomLeftRadius: moderateScale(16),
    borderWidth: moderateScale(1),
    borderColor: 'rgba(255,202,40,0.95)',
    elevation: 12,
    // shadow tuned for iOS:
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    paddingBottom: 0,
    overflow: 'hidden',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f3f3',
    backgroundColor: '#fff',
  },

  modalTitle: { fontSize: normalizeFont(16), fontWeight: '600', color: '#111' },

  closeButton: { fontSize: normalizeFont(18), color: '#333' },

  modalBody: { flex: 1, backgroundColor: '#fff', paddingHorizontal: moderateScale(12) },

  filterSection: { borderBottomWidth: 1, borderBottomColor: '#f5f5f5', paddingBottom: moderateScale(6) },

  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(4),
  },

  filterTitle: { fontSize: normalizeFont(15), fontWeight: '500', color: '#111' },

  chevron: { fontSize: normalizeFont(16), color: '#6b7280' },

  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },

  filterOptions: { paddingBottom: moderateScale(8), paddingHorizontal: moderateScale(4) },

  radioOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: moderateScale(10) },

  radioCircle: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(2),
    borderColor: '#d1d5db',
    marginRight: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioCircleSelected: { borderColor: '#22c55e' },

  radioSelected: { width: moderateScale(10), height: moderateScale(10), borderRadius: moderateScale(6), backgroundColor: '#22c55e' },

  optionText: { fontSize: normalizeFont(14), color: '#6b7280' },

  optionTextSelected: { color: '#111', fontWeight: '600' },

  modalFooter: { padding: moderateScale(12), borderTopWidth: 1, borderTopColor: '#f3f3f3', backgroundColor: '#fff' },

  applyButton: { backgroundColor: '#22c55e', paddingVertical: moderateScale(12), borderRadius: moderateScale(10), alignItems: 'center' },

  applyButtonText: { color: '#fff', fontSize: normalizeFont(15), fontWeight: '600' },
});
