// File: ProfileCard.tsx
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ProfileCardProps {
  image: string;
  name: string;
  rating?: number;
  distance: string;
  category: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  image,
  name,
  rating,
  distance,
  category,
}) => {
  return (
    <View style={styles.card}>
      {/* Profile Image */}
      <Image source={{ uri: image }} style={styles.profileImage} />

      {/* Content Section */}
      <View style={styles.contentSection}>
        {/* Name */}
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>

        {/* Distance */}
        <View style={styles.distanceContainer}>
          <Ionicons
            name="location-outline"
            size={16}
            color="rgba(66, 66, 66, 1)"
          />
          <Text style={styles.distance}>{distance} away</Text>
        </View>

        {/* Category */}
        <View style={styles.categoryContainer}>
          <MaterialIcons name="local-grocery-store" size={16} color="#666" />
          <Text style={styles.category} numberOfLines={1}>
            {category}
          </Text>
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
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255, 202, 40, 1)",
    marginBottom: 16,
    overflow: "hidden",
    maxWidth: "100%",
    minHeight: 140,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    // elevation: 2,
  },
  profileImage: {
    width: 125,
    height: 140,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  contentSection: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    paddingLeft: 10,
    justifyContent: "center",
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  distance: {
    fontSize: 13,
    color: "rgba(66, 66, 66, 0.9)",
    marginLeft: 5,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  category: {
    fontSize: 13,
    color: "rgba(66, 66, 66, 0.7)",
    marginLeft: 5,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop:5,
  },
  deliveryButton: {
    backgroundColor: "#E3FCE4",
    borderWidth: 1,
    borderColor: "#81C784",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pickupButton: {
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#FFD54F",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  deliveryButtonText: {
    color: "#2E7D32",
    fontWeight: "600",
    fontSize: 13,
  },
  pickupButtonText: {
    color: "#9E7B00",
    fontWeight: "600",
    fontSize: 13,
  },
});

export default ProfileCard;
