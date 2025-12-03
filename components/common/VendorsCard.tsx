import {
  moderateScale,
  normalizeFont,
  scale,
  verticalScale,
} from "@/app/Responsive";
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


  const formatCategories = (categories = []) => {
    if (!Array.isArray(categories)) return "Not Listing";

    if (categories.length <= 2) {
      return categories.join(", ");
    }

    const firstTwo = categories.slice(0, 2).join(", ");
    const remaining = categories.length - 2;

    return `${firstTwo} (+${remaining})`;
  };


  return (
    <View style={styles.card}>
      {/* Profile Image */}
      <Image
        source={{ uri: image }}
        style={styles.profileImage}
        resizeMode="stretch"
      />

      {/* Content Section */}
      <View style={styles.contentSection}>
        {/* Name */}
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {name}
        </Text>

        <View style={styles.distanceContainer}>
          <Image source={require('../../assets/via-farm-img/icons/loca.png')} />
          <Text style={styles.distance}>{distance}</Text>
        </View>

        {/* Category */}
        <View style={styles.categoryContainer}>
          <Image source={require(".././../assets/via-farm-img/icons/catagory.png")} />
          <Text style={styles.category} numberOfLines={1} ellipsizeMode="tail">
            {formatCategories(category)} 
          </Text>
        </View>
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.deliveryButton} activeOpacity={0.8}>
            <Text style={styles.deliveryButtonText}>Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickupButton} activeOpacity={0.8}>
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
    borderRadius: moderateScale(12),
    flexDirection: "row",
    alignItems: "center",
    borderWidth: moderateScale(1),
    borderColor: "rgba(255, 202, 40, 1)",
    marginBottom: verticalScale(12),
    overflow: "hidden",
    padding: moderateScale(0),
  },

  profileImage: {
    width: scale(130),
    height: verticalScale(145),
    borderTopLeftRadius: moderateScale(10),
    borderBottomLeftRadius: moderateScale(10),
  },

  contentSection: {
    flex: 1,
    paddingVertical: verticalScale(12),
    paddingRight: moderateScale(12),
    paddingLeft: moderateScale(10),
    justifyContent: "center",
  },

  name: {
    fontSize: normalizeFont(11),
    fontWeight: "600",
    color: "#333",
    marginBottom: verticalScale(6),
  },

  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(6),
  },

  distance: {
    fontSize: normalizeFont(10),
    color: "rgba(66, 66, 66, 0.9)",
    marginLeft: moderateScale(6),
  },

  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },

  category: {
    fontSize: normalizeFont(10),
    color: "rgba(66, 66, 66, 0.7)",
    marginLeft: moderateScale(6),
    flexShrink: 1,
  },

  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    marginTop: verticalScale(6),
  },

  deliveryButton: {
    backgroundColor: "#E3FCE4",
    borderWidth: moderateScale(1),
    borderColor: "#81C784",
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(4),
    paddingHorizontal: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(8),
  },

  pickupButton: {
    backgroundColor: "#FFF8E1",
    borderWidth: moderateScale(1),
    borderColor: "#FFD54F",
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(4),
    paddingHorizontal: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
  },

  deliveryButtonText: {
    color: "#2E7D32",
    fontSize: normalizeFont(9),
    fontWeight: "600",
  },

  pickupButtonText: {
    color: "#9E7B00",
    fontSize: normalizeFont(9),
    fontWeight: "500",
  },
});

export default ProfileCard;