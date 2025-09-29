import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ProductCardProps {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  rating: number;
  image: string;
  isFavorite?: boolean;
  onPress?: (id: string) => void;
  onFavoritePress?: (id: string) => void;
  onAddToCart?: (id: string) => void;
  width?: number;
  showRating?: boolean;
  showFavorite?: boolean;
  showAddToCart?: boolean;
  cardStyle?: object;
  imageHeight?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  subtitle,
  price,
  rating,
  image,
  isFavorite = false,
  onPress,
  onFavoritePress,
  onAddToCart,
  width = 140,
  showRating = true,
  showFavorite = true,
  showAddToCart = true,
  cardStyle = {},
  imageHeight = 120,
}) => {
  const handleCardPress = () => {
    if (onPress) {
      onPress(id);
    }
  };

  const handleFavoritePress = () => {
    if (onFavoritePress) {
      onFavoritePress(id);
    }
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(id);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { width }, cardStyle]}
      activeOpacity={0.8}
      onPress={handleCardPress}
    >
      <View style={[styles.imageContainer, { height: imageHeight }]}>
        <Image source={{ uri: image }} style={styles.productImage} />
        
        {showFavorite && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={25}
              color={isFavorite ? '#ff4757' : '#666'}
            />
          </TouchableOpacity>
        )}
        
        {showRating && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        )}
      </View>
     
      <View style={styles.cardContent}>
        <Text style={styles.productTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.productSubtitle} numberOfLines={1}>{subtitle}</Text>
        <Text style={styles.productPrice}>₹{price}</Text>
        
        {showAddToCart && (
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={handleAddToCart}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={16} color="#fff" />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 5,
    elevation: 3, // For Android shadow
  },
  imageContainer: {
    position: 'relative',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    elevation: 2,
  },
  ratingContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  ratingText: {
    color: '#fff',
    fontSize: 11,
    marginLeft: 2,
    fontWeight: '500',
  },
  cardContent: {
    padding:8,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    height: 22,
  },
  productSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
    height: 20,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  addToCartButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default ProductCard;