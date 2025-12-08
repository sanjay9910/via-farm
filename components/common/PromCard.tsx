import { moderateScale, scale } from "@/app/Responsive";
import React from "react";
import { ImageBackground, StyleSheet, TouchableOpacity } from "react-native";
interface PromoCardProps {
  image: string;
  onPress: () => void;
}

const PromoCard: React.FC<PromoCardProps> = ({ image, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <ImageBackground
        source={{ uri: image }}
        style={styles.imageBackground}
        imageStyle={styles.imageStyle}
      />
    </TouchableOpacity>
  );
};

export default PromoCard;

const styles = StyleSheet.create({
  card: {
    width: "92%",
    alignSelf: "center",
    borderRadius:moderateScale(16),
    overflow: "hidden",
    marginVertical:moderateScale(10),
    backgroundColor: "#E8F5E9", 
    elevation:moderateScale(4),
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  imageBackground: {
    width: "100%",
    height:scale(145),
  },
  imageStyle: {
    resizeMode: "stretch",
  },
});
