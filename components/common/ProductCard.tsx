import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const ProductCard = ({
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
  const [quantity, setQuantity] = useState(0);

  const handleAddToCart = () => {
    setQuantity(1);
    onAddToCart?.(id);
  };

  const increment = () => setQuantity(q => q + 1);
  const decrement = () => setQuantity(q => (q > 1 ? q - 1 : 0));

  return (
    <View style={[{ width }, cardStyle]}>
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => onPress?.(id)}
      >
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          <Image source={{ uri: image }} style={styles.productImage} />
          
          {showFavorite && (
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => onFavoritePress?.(id)}
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

          {/* Reserve fixed height for button area */}
          <View style={styles.buttonContainer}>
            {quantity === 0 ? (
              <TouchableOpacity
                style={styles.addToCartButton}
                onPress={handleAddToCart}
                activeOpacity={0.7}
              >
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.quantityContainer}>
                <TouchableOpacity onPress={decrement} style={styles.quantityButton}>
                  <Text style={styles.quantityText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityCount}>{quantity}</Text>
                <TouchableOpacity onPress={increment} style={styles.quantityButton}>
                  <Text style={styles.quantityText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginLeft:5,
    marginTop:10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(108, 59, 28, 1)',
    marginBottom: 5,
    elevation: 3,
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
    padding: 8,
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
  buttonContainer: {
    minHeight: 36, // reserve height so card doesn't resize
    justifyContent: 'center',
  },
  addToCartButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  addToCartText: {
    color: '#fff',
    fontSize:17,
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(76, 175, 80, 1)',
    borderRadius: 6,
    paddingHorizontal: 4,
    height: 36,
  },
  quantityButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  quantityText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  quantityCount: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginHorizontal: 6,
  },
});

export default ProductCard;
