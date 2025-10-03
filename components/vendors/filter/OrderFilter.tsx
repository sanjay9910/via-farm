import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const OrderFilter = () => {
  const [searchText, setSearchText] = useState('');

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>My Orders</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#9ca3af"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Filter Button */}
      <TouchableOpacity style={styles.filterButton}>
        <Feather name="sliders" size={20} color="#6b7280" />
      </TouchableOpacity>
    </View>
  );
};

export default OrderFilter;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginRight: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    padding: 0,
    margin: 0,
  },
  filterButton: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
});