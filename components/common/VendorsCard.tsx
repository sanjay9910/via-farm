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
    borderRadius: moderateScale(14),
    flexDirection: "row",
    alignItems: "center",
    borderWidth: moderateScale(1),
    borderColor: "rgba(255, 202, 40, 1)",
    marginBottom: verticalScale(14),
    overflow: "hidden",
    padding: 0,
    elevation: 3, 
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  profileImage: {
    width: scale(140),
    height: verticalScale(160),
    borderTopLeftRadius: moderateScale(14),
    borderBottomLeftRadius: moderateScale(14),
    backgroundColor: "#f5f5f5",
  },

  contentSection: {
    flex: 1,
    paddingVertical: verticalScale(14),
    paddingRight: moderateScale(14),
    paddingLeft: moderateScale(12),
    justifyContent: "center",
  },

  name: {
    fontSize: normalizeFont(13), 
    fontWeight: "700",
    color: "#222",
    marginBottom: verticalScale(6),
  },

  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(6),
  },

  distance: {
    fontSize: normalizeFont(11),
    color: "rgba(66, 66, 66, 0.9)",
    marginLeft: moderateScale(6),
    fontWeight: "500",
  },

  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },

  category: {
    fontSize: normalizeFont(11),
    color: "rgba(66, 66, 66, 0.75)",
    marginLeft: moderateScale(6),
    flexShrink: 1,
    fontWeight: "500",
  },

  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    marginTop: verticalScale(8),
  },

  deliveryButton: {
    backgroundColor: "#E3FCE4",
    borderWidth: moderateScale(1),
    borderColor: "#81C784",
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(5),
    paddingHorizontal: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
  },

  pickupButton: {
    backgroundColor: "#FFF8E1",
    borderWidth: moderateScale(1),
    borderColor: "#FFD54F",
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(5),
    paddingHorizontal: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
  },

  deliveryButtonText: {
    color: "#2E7D32",
    fontSize: normalizeFont(10),
    fontWeight: "700",
  },

  pickupButtonText: {
    color: "#9E7B00",
    fontSize: normalizeFont(10),
    fontWeight: "600",
  },
});
export default ProfileCard;