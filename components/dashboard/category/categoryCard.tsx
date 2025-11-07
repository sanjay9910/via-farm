import Card from '@/components/common/card';
import { useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const API_BASE = 'https://viafarm-1.onrender.com';

const CategoryCard = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigation = useNavigation();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/admin/manage-app/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const data = await response.json();
      // console.log('Categories data:', data);

  
      const transformedData = data.map(category => ({
        id: category._id,
        name: category.name,
        image: category.image?.url || 'https://via.placeholder.com/150', 
      }));

      setCategories(transformedData);

    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message);
      Alert.alert('Error', 'Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Categories</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Categories</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load categories</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCategories}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Categories</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No categories found</Text>
        </View>
      </View>
    );
  }


  const gotoAllCategory=()=>{
    navigation.navigate('category');
  } 


  return (
    <View style={styles.container}>
      <View style={styles.Categoryheader}>
        <Text style={styles.heading}>All Categories</Text>
      </View>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        renderItem={({ item }) => (
          <Card
            name={item.name}
            image={item.image}  
             imageStyel={{ width: 110, height: 110, borderRadius: 12 }}
            cardStyle={{ backgroundColor: 'rgba(108, 59, 28, 1)', borderColor: '#222' }} 
            stylek={{ color: '#fff', fontWeight: '600' }}
          />
        )}
      />
    </View>
  );
};

export default CategoryCard;

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  heading: {
    fontSize:17,
    marginLeft: 20,
    fontWeight: '500',
    marginBottom: 10,
  },
  Categoryheader:{
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
  },
  seeAll:{
    color:'blue',
    flexDirection:'row',
    alignItems:'center',
    gap:'7',
    marginRight:20,
  },
  text:{
    color:'blue',
  },
  flatListContent: {
    paddingHorizontal: 10,
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
