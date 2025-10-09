// File: ProfileCard.tsx
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProfileCardProps {
  image: string;
  name: string;
  distance: string;
  category: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ image, name, rating, distance, category }) => {
  return (
    <View>
    <View style={styles.card}>
      {/* Profile Image */}
      <Image source={{ uri: image }} style={styles.profileImage} />

      {/* Content Section */}
      <View style={styles.contentSection}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
        </View>

        {/* Distance */}
        <View style={styles.distanceContainer}>
          <Ionicons name="location-outline" size={20} color="rgba(66, 66, 66, 1)" />
          <Text style={styles.distance}>{distance} away</Text>
          {/* <Text style={styles.distance}> 2.1kms away</Text> */}
        </View>

        {/* Category */}
        <View style={styles.categoryContainer}>
          <MaterialIcons name="local-grocery-store" size={20} color="#666" />
          <Text style={styles.category}>{category}</Text>
          {/* <Text style={styles.category}>(Fruits, Vegetable,Plants)</Text> */}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.deliveryButton}>
            <Text style={styles.deliveryButtonText}>Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickupButton}>
            <Text style={styles.pickupButtonText}>Pickup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 202, 40, 1)',
    marginBottom: 16,
    overflow: 'hidden',
    maxWidth: '100%',
    minHeight: 159,
  },
  profileImage: {
    width: 129,
    height: 159,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    marginRight: 12,
    flexShrink: 0,
  },
  contentSection: {
    flex: 1,
    paddingTop: 12,
    paddingRight: 12,
    paddingBottom: 12,
    paddingLeft: 0,
    minWidth: 0,
    maxWidth: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'nowrap',
    width: '100%',
  },
  name: {
    fontSize:12,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight:3,
    minWidth: 0,
    flexShrink: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderRadius: 4,
    flexShrink: 0,
    maxWidth: 50,
    minWidth: 40,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginLeft: 2,
    flexShrink: 0,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    maxWidth: '100%',
  },
  distance: {
    fontSize: 13,
    color: 'rgba(66, 66, 66, 1)',
    marginLeft: 4,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    maxWidth: '100%',
  },
  category: {
    fontSize: 13,
    color: 'rgba(66, 66, 66, 0.7)',
    marginLeft: 4,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    maxWidth: '100%',
  },
  deliveryButton: {
    backgroundColor: '#C6FFC8',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    paddingVertical: 5,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    flex: 1,
    marginRight: 4,
    alignItems: 'center',
  },
  deliveryButtonText: {
    color: '#000',
    fontSize: 13,
    textAlign: 'center',
  },
  pickupButton: {
    backgroundColor: '#FFE9A8',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    paddingVertical: 5,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    flex: 1,
    marginLeft: 4,
    alignItems: 'center',
  },
  pickupButtonText: {
    color: '#000',
    fontSize: 13,
    textAlign: 'center',
  },
});

export default ProfileCard;