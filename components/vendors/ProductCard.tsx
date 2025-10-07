import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

const API_BASE = "https://393rb0pp-5000.inc1.devtunnels.ms";
const { width } = Dimensions.get("window");

// --- ProductCard Component (No change needed here) ---

const ProductCard = ({ item, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const menuButtonRef = useRef(null);

  const handleMenuPress = () => {
    if (menuButtonRef.current) {
      menuButtonRef.current.measureInWindow((x, y, width, height) => {
        setMenuPosition({
          x: x - 140,
          y: y + height + 4,
        });
        setIsMenuOpen(true);
      });
    }
  };

  const handleDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await axios.delete(`${API_BASE}/api/vendor/products/${item._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        Alert.alert('Success', 'Product deleted successfully');
        onDelete(item._id);
      } else {
        Alert.alert('Error', 'Failed to delete product');
      }
    } catch (error) {
      console.log("Delete error:", error);
      Alert.alert('Error', 'Something went wrong while deleting');
    } finally {
      setIsMenuOpen(false);
    }
  };

  return (
    <View style={cardStyles.card}>
      <Image
        source={{ uri: item.images?.[0] }}
        style={cardStyles.image}
        resizeMode="cover"
      />
      <View style={cardStyles.details}>
        <View style={cardStyles.header}>
          <Text style={cardStyles.productName}>{item.name}</Text>
          <TouchableOpacity
            ref={menuButtonRef}
            style={cardStyles.menuButton}
            onPress={handleMenuPress}
          >
            <Feather name="more-vertical" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={cardStyles.row}>
          <Text style={cardStyles.label}>Category</Text>
          <Text style={cardStyles.colon}>:</Text>
          <Text style={cardStyles.value}>{item.category}</Text>
        </View>

        <View style={cardStyles.row}>
          <Text style={cardStyles.label}>Price</Text>
          <Text style={cardStyles.colon}>:</Text>
          <Text style={cardStyles.value}>₹ {item.price}/{item.unit}</Text>
        </View>

        <Text style={cardStyles.uploadDate}>
          Uploaded on {new Date(item.datePosted).toLocaleDateString()}
        </Text>

        <View style={cardStyles.stockContainer}>
          <View style={[
            cardStyles.stockBadge,
            item.status === 'In Stock' ? cardStyles.inStock : cardStyles.outOfStock
          ]}>
            <View style={[
              cardStyles.stockDot,
              item.status === 'In Stock' ? cardStyles.inStockDot : cardStyles.outOfStockDot
            ]} />
            <Text style={[
              cardStyles.stockText,
              item.status === 'In Stock' ? cardStyles.inStockText : cardStyles.outOfStockText
            ]}>
              {item.status}
            </Text>
            <Feather
              name="chevron-down"
              size={16}
              color={item.status === 'In Stock' ? '#22c55e' : '#ef4444'}
            />
          </View>
        </View>
      </View>

      <Modal
        visible={isMenuOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <TouchableOpacity
          style={cardStyles.modalOverlayTransparent}
          activeOpacity={1}
          onPress={() => setIsMenuOpen(false)}
        >
          <View style={[
            cardStyles.menuPopup,
            { position: 'absolute', top: menuPosition.y, left: menuPosition.x }
          ]}>
            <TouchableOpacity
              style={cardStyles.menuItem}
              onPress={() => { setIsMenuOpen(false); console.log('Edit clicked'); }}
            >
              <Feather name="edit-2" size={18} color="#374151" />
              <Text style={cardStyles.menuItemText}>Edit</Text>
            </TouchableOpacity>

            <View style={cardStyles.menuDivider} />

            <TouchableOpacity
              style={cardStyles.menuItem}
              onPress={() => { setIsMenuOpen(false); console.log('Hide clicked'); }}
            >
              <Feather name="eye-off" size={18} color="#374151" />
              <Text style={cardStyles.menuItemText}>Hide</Text>
            </TouchableOpacity>

            <View style={cardStyles.menuDivider} />

            <TouchableOpacity
              style={cardStyles.menuItem}
              onPress={handleDelete}
            >
              <Feather name="trash-2" size={18} color="#ef4444" />
              <Text style={[cardStyles.menuItemText, cardStyles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// --- ProductFilter Component ---

const categories = ['All', 'Fruits', 'Vegetables','Seeds','Plants','Handicrafts'];
const stockOptions = ['Out of Stock', 'In Stock'];
const dateOptions = ['Today', 'Last 7 Days', 'Last 30 Days', 'All Time'];
const amountOptions = ['Low to High', 'High to Low'];

const ProductFilter = ({ 
  selectedCategory, setSelectedCategory, 
  stockFilter, setStockFilter, 
  dateFilter, setDateFilter, 
  amountFilter, setAmountFilter, 
  applyFilters, 
  handleCategoryChange 
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    stock: false,
    date: false,
    amount: false,
  });

  const slideAnim = useRef(new Animated.Value(width)).current;
  const dropdownButtonRef = useRef(null);
  
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
  
  // जब कैटेगरी ड्रॉपडाउन में आइटम सेलेक्ट होता है
  const onCategorySelect = (category) => {
      setSelectedCategory(category); 
      handleCategoryChange(category); 
      setIsDropdownOpen(false);
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleApplyFilters = () => {
    applyFilters(); 
    setIsFilterOpen(false);
  };

  return (
    <View style={filterStyles.container}>
      {/* Title */}
      <Text style={filterStyles.title}>My Products</Text>

      {/* Right Side Controls */}
      <View style={filterStyles.controls}>
        {/* Category Dropdown */}
        <TouchableOpacity
          ref={dropdownButtonRef}
          style={filterStyles.dropdownButton}
          onPress={openDropdown}
          activeOpacity={0.7}
        >
          <Text style={filterStyles.dropdownText}>{selectedCategory}</Text>
          <Feather name="chevron-down" size={18} color="#6b7280" />
        </TouchableOpacity>

        {/* Filter Button */}
        <TouchableOpacity
          style={filterStyles.filterButton}
          onPress={() => setIsFilterOpen(true)}
          activeOpacity={0.7}
        >
          {/* Path को अपने प्रोजेक्ट के अनुसार बदलें। मैंने यहाँ एक Default स्टाइल जोड़ी है ताकि इमेज दिखे। */}
          <Image 
            source={require("../../assets/via-farm-img/icons/filter.png")} 
            style={{width: 20, height: 20}} 
          /> 
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
          <View style={filterStyles.modalOverlay}>
            <View
              style={[
                filterStyles.dropdownMenu,
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
                    filterStyles.dropdownItem,
                    selectedCategory === category && filterStyles.dropdownItemActive,
                  ]}
                  onPress={() => onCategorySelect(category)} // अपडेटेड फंक्शन
                >
                  <Text
                    style={[
                      filterStyles.dropdownItemText,
                      selectedCategory === category &&
                      filterStyles.dropdownItemTextActive,
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
        <TouchableOpacity style={filterStyles.filterOverlay} activeOpacity={1} onPress={() => setIsFilterOpen(false)}>
          <Animated.View style={[filterStyles.filterModal, { transform: [{ translateX: slideAnim }] }]} onStartShouldSetResponder={() => true}>
            <View style={filterStyles.modalHeader}>
              <Text style={filterStyles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setIsFilterOpen(false)}>
                <Text style={filterStyles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={filterStyles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Stock */}
              <View style={filterStyles.filterSection}>
                <TouchableOpacity style={filterStyles.filterHeader} onPress={() => toggleSection('stock')}>
                  <Text style={filterStyles.filterTitle}>Stock</Text>
                  <Text style={[filterStyles.chevron, expandedSections.stock && filterStyles.chevronRotated]}>›</Text>
                </TouchableOpacity>
                {expandedSections.stock && (
                  <View style={filterStyles.filterOptions}>
                    {stockOptions.map((option) => (
                      <TouchableOpacity key={option} style={filterStyles.radioOption} onPress={() => setStockFilter(option)}>
                        <View style={[filterStyles.radioCircle, stockFilter === option && filterStyles.radioCircleSelected]}>
                          {stockFilter === option && <View style={filterStyles.radioSelected} />}
                        </View>
                        <Text style={[filterStyles.optionText, stockFilter === option && filterStyles.optionTextSelected]}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Date */}
              <View style={filterStyles.filterSection}>
                <TouchableOpacity style={filterStyles.filterHeader} onPress={() => toggleSection('date')}>
                  <Text style={filterStyles.filterTitle}>By Date</Text>
                  <Text style={[filterStyles.chevron, expandedSections.date && filterStyles.chevronRotated]}>›</Text>
                </TouchableOpacity>
                {expandedSections.date && (
                  <View style={filterStyles.filterOptions}>
                    {dateOptions.map((option) => (
                      <TouchableOpacity key={option} style={filterStyles.radioOption} onPress={() => setDateFilter(option)}>
                        <View style={[filterStyles.radioCircle, dateFilter === option && filterStyles.radioCircleSelected]}>
                          {dateFilter === option && <View style={filterStyles.radioSelected} />}
                        </View>
                        <Text style={[filterStyles.optionText, dateFilter === option && filterStyles.optionTextSelected]}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Amount */}
              <View style={filterStyles.filterSection}>
                <TouchableOpacity style={filterStyles.filterHeader} onPress={() => toggleSection('amount')}>
                  <Text style={filterStyles.filterTitle}>Amount</Text>
                  <Text style={[filterStyles.chevron, expandedSections.amount && filterStyles.chevronRotated]}>›</Text>
                </TouchableOpacity>
                {expandedSections.amount && (
                  <View style={filterStyles.filterOptions}>
                    {amountOptions.map((option) => (
                      <TouchableOpacity key={option} style={filterStyles.radioOption} onPress={() => setAmountFilter(option)}>
                        <View style={[filterStyles.radioCircle, amountFilter === option && filterStyles.radioCircleSelected]}>
                          {amountFilter === option && <View style={filterStyles.radioSelected} />}
                        </View>
                        <Text style={[filterStyles.optionText, amountFilter === option && filterStyles.optionTextSelected]}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={filterStyles.modalFooter}>
              <TouchableOpacity style={filterStyles.applyButton} onPress={handleApplyFilters}>
                <Text style={filterStyles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};


// --- ProductList Component (Main Controller) ---

const ProductList = () => {
  // Product Data States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States (Temp states for Filter Modal)
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState('');
  
  // State to hold the APPLIED filters (The filters currently active on the list)
  const [appliedFilters, setAppliedFilters] = useState({
      stock: '',
      date: '',
      amount: '',
      category: 'All',
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      // API call
      const res = await axios.get(`${API_BASE}/api/vendor/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setProducts(res.data.data); 
      }
    } catch (error) {
      console.log("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // --- HANDLERS ---
  
  // Fired when an option is selected inside the Category Dropdown.
  const handleCategoryChange = (newCategory) => {
      // Category बदलने पर, सिर्फ़ Category फ़िल्टर को तुरंत लागू करें।
      setAppliedFilters(prev => ({
          ...prev,
          category: newCategory,
      }));
  };

  // Fired when the APPLY FILTERS button is pressed in the Filter Modal.
  const handleApplyFilters = () => {
      // Stock, Date, Amount फ़िल्टर्स को लागू करें।
      setAppliedFilters(prev => ({
          ...prev,
          stock: stockFilter,
          date: dateFilter,
          amount: amountFilter,
          // Category पहले ही handleCategoryChange से अपडेट हो चुका है।
      }));
  };
  
  // --- FILTERING LOGIC ---

  const filteredProducts = useMemo(() => {
    // products की एक copy बना लें ताकि sorting original array को प्रभावित न करे
    let filtered = [...products]; 
    
    // Category Filter (Instant)
    const categoryToFilter = appliedFilters.category === 'All' ? null : appliedFilters.category;
    if (categoryToFilter) {
      filtered = filtered.filter(item => item.category === categoryToFilter);
    }

    // Stock Filter (Applied via Modal)
    const stockToFilter = appliedFilters.stock;
    if (stockToFilter) {
      filtered = filtered.filter(item => item.status === stockToFilter);
    }
    
    // Amount Filter (Sorting - Applied via Modal)
    if (appliedFilters.amount === 'Low to High') {
        // 'Low to High' sorting
        filtered.sort((a, b) => a.price - b.price);
    } else if (appliedFilters.amount === 'High to Low') {
        // 'High to Low' sorting
        filtered.sort((a, b) => b.price - a.price);
    }

    // Date Filter (Not implemented, requires date conversion/logic)

    return filtered;
  }, [products, appliedFilters]);

  // 3. Delete Handler
  const handleDeleteFromList = (id) => {
    setProducts((prev) => prev.filter((item) => item._id !== id));
  };

  // 4. Initial Data Fetch
  useEffect(() => {
    fetchProducts();
  }, []);


  return (
    <View style={{ flex: 1 }}>
      {/* ProductFilter Component - List के ठीक ऊपर */}
      <ProductFilter 
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        amountFilter={amountFilter}
        setAmountFilter={setAmountFilter}
        applyFilters={handleApplyFilters} 
        handleCategoryChange={handleCategoryChange} // नया प्रॉप
      />
      
      {/* Product List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts} 
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ProductCard item={item} onDelete={handleDeleteFromList} />
          )}
          contentContainerStyle={cardStyles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={{textAlign: 'center', marginTop: 20, color: '#666'}}>No products found matching your filters.</Text>
          }
        />
      )}
    </View>
  );
};

export default ProductList;

// ---- STYLES for ProductCard (cardStyles) ----
const cardStyles = StyleSheet.create({
  listContainer: { padding: 16, gap: 16 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, borderWidth: 2, borderColor: '#fbbf24', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  image: { width: 150, height: '100%', minHeight: 180 },
  details: { flex: 1, padding: 16, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  productName: { fontSize: 20, fontWeight: '700', color: '#1f2937', flex: 1, marginRight: 8 },
  menuButton: { padding: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 14, color: '#6b7280', width: 80 },
  colon: { fontSize: 14, color: '#6b7280', marginHorizontal: 8 },
  value: { fontSize: 14, color: '#374151', fontWeight: '500', flex: 1 },
  uploadDate: { fontSize: 13, color: '#9ca3af', marginTop: 4, marginBottom: 12 },
  stockContainer: { flexDirection: 'row', alignItems: 'center' },
  stockBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, gap: 6 },
  inStock: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  outOfStock: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  inStockDot: { backgroundColor: '#22c55e' },
  outOfStockDot: { backgroundColor: '#ef4444' },
  stockText: { fontSize: 14, fontWeight: '500' },
  inStockText: { color: '#22c55e' },
  outOfStockText: { color: '#ef4444' },
  modalOverlayTransparent: { flex: 1, backgroundColor: 'transparent' },
  menuPopup: { 
  backgroundColor: '#fff',
  borderRadius: 6,
  minWidth: 100, 
 paddingVertical: 8,
 shadowColor: '#000',
 shadowOffset: { width: 0, height: 4 },
 shadowOpacity: 0.2, shadowRadius: 12,
 elevation: 10,
 borderWidth: 1,
 borderColor: 'rgba(255, 202, 40, 1)',
 marginLeft:60,
 marginTop:-26,
},
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 6, gap: 12 },
  menuItemText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  deleteText: { color: '#ef4444' },
  menuDivider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 8 },
});


// ---- STYLES for ProductFilter (filterStyles) ----
const filterStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', zIndex: 10 },
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
  chevron: { fontSize: 16, color: '#666', transform: [{ rotate: '90deg' }] }, 
  chevronRotated: { transform: [{ rotate: '270deg' }] },
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