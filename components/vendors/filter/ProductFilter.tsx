import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ProductFilter = () => {
  const [selectedCategory, setSelectedCategory] = useState('Fruits');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const categories = ['Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Beverages', 'Snacks'];

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>My Products</Text>

      {/* Right Side Controls */}
      <View style={styles.controls}>
        {/* Category Dropdown */}
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setIsDropdownOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.dropdownText}>{selectedCategory}</Text>
          <Feather name="chevron-down" size={18} color="#6b7280" />
        </TouchableOpacity>

        {/* Filter Button */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setIsFilterOpen(!isFilterOpen)}
          activeOpacity={0.7}
        >
          <Feather name="sliders" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Dropdown Modal */}
      <Modal
        visible={isDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDropdownOpen(false)}
        >
          <View style={styles.dropdownMenu}>
            <ScrollView>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.dropdownItem,
                    selectedCategory === category && styles.dropdownItemActive
                  ]}
                  onPress={() => {
                    setSelectedCategory(category);
                    setIsDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedCategory === category && styles.dropdownItemTextActive
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ProductFilter;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    minWidth: 120,
  },
  dropdownText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '400',
  },
  filterButton: {
    padding: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    minWidth: 200,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemActive: {
    backgroundColor: '#f3f4f6',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#374151',
  },
  dropdownItemTextActive: {
    fontWeight: '600',
    color: '#111827',
  },
});