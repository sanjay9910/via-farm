// File: Card.tsx
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TextStyle, View } from 'react-native';

interface CardProps {
  name: string;
  image: string;
  stylek: TextStyle; 
  cardStyle:CardStyle;
  imageStyel:imageStyle;
}

const Card: React.FC<CardProps> = ({ name, image ,stylek, cardStyle, imageStyle}) => {
  return (
    <View style={[styles.card, cardStyle]}>
      <Image source={{ uri: image }} style={[styles.image, imageStyle]} />
      <Text style={[styles.name,stylek]}>{name}</Text>
    </View>
  );
};

const { width } = Dimensions.get('window');


const styles = StyleSheet.create({
  card: {
    width:128,
    height:114,
    borderWidth:1,
    borderColor:'green',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    margin: 10,
    marginBottom:10,
    alignItems: 'center',
  },
  image: {
    width:128,
    height:94,
    borderRadius: 10,
  },
  name: {
    fontSize:14,
    fontWeight:600,
    color: '#000',
  },
});

export default Card;
