import Card from '@/components/common/card';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { moderateScale, normalizeFont, scale } from '@/app/Responsive';

const API_BASE = 'https://viafarm-1.onrender.com';

const CategoryCard = () => {
  const [categories, setCategories] = useState<
    { id: string; name: string; image: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigation: any = useNavigation();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE}/api/admin/manage-app/categories`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const json = await response.json();
      // console.log('kya aa raha Hai (raw)', json);

      // Normalize response to an array. Some APIs return { data: [...] } or { categories: [...] } etc.
      let items: any[] = [];
      if (Array.isArray(json)) {
        items = json;
      } else if (Array.isArray(json.data)) {
        items = json.data;
      } else if (Array.isArray(json.categories)) {
        items = json.categories;
      } else if (json.success && Array.isArray(json.payload)) {
        items = json.payload;
      } else {
        // Try to find first array value in object (fallback)
        const firstArray = Object.values(json).find((v) => Array.isArray(v));
        if (Array.isArray(firstArray)) items = firstArray as any[];
      }

      // If still empty, but API returned an object for a single category, wrap it
      if (items.length === 0 && typeof json === 'object' && (json._id || json.id)) {
        items = [json];
      }

      const transformedData = items.map((category: any, idx: number) => ({
        id:
          String(category._id ?? category.id ?? category._id ?? `cat-${idx}`),
        name: String(category.name ?? category.title ?? 'Unnamed Category'),
        image:
          String(
            category.image?.url ??
              category.image ??
              category.imageUrl ??
              category.img ??
              ''
          ) || 'https://via.placeholder.com/150',
      }));

      setCategories(transformedData);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err?.message ?? 'Unknown error');
      Alert.alert('Error', 'Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle Category Card Press
  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    // console.log('📂 Category Card Pressed:', { categoryId, categoryName });
    try {
      navigation.navigate('CategoryVIewAllProduct', {
        categoryId: String(categoryId),
        categoryName: categoryName,
      });
      // console.log('✅ Navigated to CategoryVIewAllProduct');
    } catch (err) {
      console.error('❌ Navigation error:', err);
      Alert.alert('Error', 'Unable to navigate to category products.');
    }
  };

  // Go to All Categories
  const gotoAllCategory = () => {
    // console.log('➡️ Go to All Categories');
    try {
      navigation.navigate('category');
    } catch (err) {
      console.error('Navigation error:', err);
      Alert.alert('Error', 'Unable to navigate to all categories.');
    }
  };

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

  return (
    <View style={styles.container}>
      <View style={styles.Categoryheader}>
        <Text style={styles.heading}>Categories</Text>
        <TouchableOpacity onPress={gotoAllCategory}>
          {/* See All button placeholder if you want */}
        </TouchableOpacity>
      </View>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleCategoryPress(item.id, item.name)}
            activeOpacity={0.7}
          >
            <Card
              name={item.name}
              image={item.image}
              imageStyel={{ width: scale(110), height: scale(110), borderRadius: scale(12) }}
              cardStyle={{
                backgroundColor: 'rgba(108, 59, 28, 1)',
                borderColor: '#222',
              }}
              stylek={{ color: '#fff', fontWeight: '600' }}
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};


export default CategoryCard;

const styles = StyleSheet.create({
  container: {
    marginVertical: moderateScale(10),
  },
  heading: {
    fontSize:normalizeFont(16),
    marginLeft: moderateScale(20),
    fontWeight: '500',
    marginBottom: moderateScale(10),
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
    marginRight:moderateScale(20),
  },
  text:{
    color:'blue',
  },
  flatListContent: {
    paddingHorizontal: moderateScale(10),
  },
  loadingContainer: {
    height: scale(100),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: moderateScale(10),
    fontSize: normalizeFont(16),
    color: '#666',
  },
  errorContainer: {
    height: scale(100),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  errorText: {
    fontSize: normalizeFont(12),
    color: '#FF3B30',
    marginBottom: moderateScale(10),
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
  },
  retryButtonText: {
    color: 'white',
    fontSize: normalizeFont(12),
    fontWeight: '600',
  },
  emptyContainer: {
    height: scale(100),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: normalizeFont(12),
    color: '#666',
  },
});
