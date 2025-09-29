import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PromoCardProps {
  image: string;
  title: string;
  buttonText: string;
  onPress: () => void;
}

const PromoCard: React.FC<PromoCardProps> = ({ image, title, buttonText, onPress }) => {
  return (
    <View style={styles.card}>
      {/* Left Image */}
      <Image source={{ uri: image }} style={styles.image} />

      {/* Right Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "green",
    borderRadius: 12,
    backgroundColor: "#FFF8E1", 
    overflow: "hidden",
    margin: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 130,
    height: "100%",
    resizeMode: "cover",
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32", // dark green
    textAlign: "center",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#2E7D32", // green
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 25,
  },
  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default PromoCard;
