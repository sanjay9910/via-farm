import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ProductCard from '../../../components/common/ProductCard';

interface Product {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  rating: number;
  image: string;
  isFavorite: boolean;
}

interface SmartPicksProps {
  category?: string;
}

const SmartPicks: React.FC<SmartPicksProps> = ({ category = 'Handicrafts' }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Dummy API data - replace with your actual API call
  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const dummyData: Product[] = [
        {
          id: '1',
          title: 'Plate',
          subtitle: 'Hand Painted',
          price: 200,
          rating: 4.5,
          image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
          isFavorite: false,
        },
        {
          id: '2',
          title: 'Mugs (set of 3)',
          subtitle: 'Hand Painted',
          price: 200,
          rating: 4.5,
          image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=300&fit=crop',
          isFavorite: false,
        },
        {
          id: '3',
          title: 'Plate',
          subtitle: 'Hand Painted',
          price: 200,
          rating: 4.5,
          image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=300&h=300&fit=crop',
          isFavorite: false,
        },
        {
          id: '4',
          title: 'Vase Set',
          subtitle: 'Hand Crafted',
          price: 350,
          rating: 4.8,
          image: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=300&h=300&fit=crop',
          isFavorite: false,
        },
        {
          id: '5',
          title: 'Decorative Bowl',
          subtitle: 'Ceramic Art',
          price: 150,
          rating: 4.3,
          image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop',
          isFavorite: false,
        },
        {
          id: '6',
          title: 'Tea Set',
          subtitle: 'Traditional',
          price: 450,
          rating: 4.7,
          image: 'https://images.unsplash.com/photo-1563822249548-ad74765e8ddf?w=300&h=300&fit=crop',
          isFavorite: false,
        },
      ];
      
      setProducts(dummyData);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCardPress = (productId: string) => {
    console.log('Product card pressed:', productId);
    // Navigate to product detail screen
  };

  const handleFavoritePress = (productId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });
  };

  const renderProductCard = ({ item }: { item: Product }) => (
    <ProductCard
      id={item.id}
      title={item.title}
      subtitle={item.subtitle}
      price={item.price}
      rating={item.rating}
      image={item.image}
      isFavorite={favorites.has(item.id)}
      onPress={handleCardPress}
      onFavoritePress={handleFavoritePress}
      width={130}
      showRating={true}
      showFavorite={true}
      imageHeight={120}
      cardStyle={styles.cardMargin}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Smart Picks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Smart Picks</Text>
        <TouchableOpacity style={styles.categoryContainer}>
          <Text style={styles.categoryText}>{category}</Text>
          <Ionicons name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={products}
        renderItem={renderProductCard}
        keyExtractor={(item) => item.id}
        horizontal
        contentContainerStyle={styles.listContainer}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ width:1 }} />}
        style={styles.flatListStyle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingTop: 10,
    padding: 10,
    paddingLeft: 13,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    borderRadius: 5,
    padding: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  listContainer: {
    paddingRight: 10,
    width:190,
  },
  flatListStyle: {
    paddingBottom:10,
  },
  cardMargin: {
    marginLeft:11,
  },
});

export default SmartPicks;