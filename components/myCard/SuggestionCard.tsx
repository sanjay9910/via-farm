import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ProductCard from '../../components/common/ProductCard';

interface Product {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  rating: number;
  image: string;
}

const SuggestionCard: React.FC = () => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Sample data - unique IDs
  const suggestionProducts: Product[] = [
    {
      id: '1',
      title: 'Suggested Item 1',
      subtitle: 'Hand Crafted',
      price: 250,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
    },
    {
      id: '2',
      title: 'Suggested Item 2',
      subtitle: 'Premium Quality',
      price: 180,
      rating: 4.3,
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=300&fit=crop',
    },
    {
      id: '3',
      title: 'Suggested Item 3',
      subtitle: 'Premium Quality',
      price: 180,
      rating: 4.3,
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=300&fit=crop',
    },
    {
      id: '4',
      title: 'Suggested Item 4',
      subtitle: 'Premium Quality',
      price: 180,
      rating: 4.3,
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=300&fit=crop',
    },
    {
      id: '5',
      title: 'Suggested Item 5',
      subtitle: 'Premium Quality',
      price: 180,
      rating: 4.3,
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=300&fit=crop',
    },
    {
      id: '6',
      title: 'Suggested Item 6',
      subtitle: 'Premium Quality',
      price: 180,
      rating: 4.3,
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=300&fit=crop',
    },
  ];

  const handleCardPress = (productId: string) => {
    console.log('Card pressed:', productId);
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

  const renderSuggestionCard = ({ item }: { item: Product }) => (
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
      width={140} 
      showRating={true}
      showFavorite={true}
      imageHeight={130} 
    />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You May Also Like</Text>
      
      <FlatList
        data={suggestionProducts}
        renderItem={renderSuggestionCard}
        keyExtractor={(item) => item.id}
        horizontal
        contentContainerStyle={styles.listContainer}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ width: 15 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  listContainer: {
    paddingHorizontal: 15,
  },
});

export default SuggestionCard;
