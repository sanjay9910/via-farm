// File: ViewVendors.tsx
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProfileCard from '../../common/VendorsCard';

const ViewVendors = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();


  useEffect(() => {
    // Dummy Data (later replace with API)
    const dummyVendors = [
      {
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        name: 'Sanjay kr Chauhan-01',
        rating: 4.5,
        distance: '2 kms',
        category: 'Fruits',
      },
      {
        image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f',
        name: 'Sanjay kr Chauhan-02',
        rating: 4.8,
        distance: '3.5 km',
        category: 'Vegetables',
      },
      {
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
        name: 'Sanjay kr Chauhan-03',
        rating: 4.2,
        distance: '1.8 kms',
        category: 'Dairy',
      },
      {
        image: 'https://images.unsplash.com/photo-1565958011703-44e4864b8f31',
        name: 'Bakery House',
        rating: 4.7,
        distance: '4 kms',
        category: 'Bakery',
      },
    ];

    // Simulate loading time
    setTimeout(() => {
      setVendors(dummyVendors);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }



  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Vendors Near You</Text>
        <TouchableOpacity onPress={() => navigation.navigate("VendorsSeeAll")}>
          <Text style={styles.link}>View All  </Text>
          {/* <Ionicons name="arrow-forward" size={18} color="#333" style={styles.icon} /> */}
        </TouchableOpacity>
      </View>
    <ScrollView contentContainerStyle={styles.container}>
      {vendors.slice(0, 3).map((vendor, index) => (
        <ProfileCard
          key={index}
          image={vendor.image}
          name={vendor.name}   // ✅ name bhi show hoga ab
          rating={vendor.rating}
          distance={vendor.distance}
          category={vendor.category}
        />
      ))}
    </ScrollView>
    </View>
  );
};


export default ViewVendors;


const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  link: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007bff',
  },
});