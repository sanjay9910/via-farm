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
    borderRadius: 16,
    overflow: "hidden",
    marginVertical: 12,
    backgroundColor: "#E8F5E9", // fallback color while loading
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  imageBackground: {
    width: "100%",
    height:140,
  },
  imageStyle: {
    resizeMode: "cover",
  },
});
