import React from 'react';
import {
  Dimensions,
  Image,
  ImageStyle,
  PixelRatio,
  Platform,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

// -------- Responsive helpers --------
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Base guideline (iPhone X)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

const normalizeFont = (size: number) => {
  const newSize = moderateScale(size);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
};
// -------------------------------------

interface CardProps {
  name: string;
  image: string;
  stylek?: TextStyle;
  cardStyle?: ViewStyle;
  imageStyle?: ImageStyle;
}

const Card: React.FC<CardProps> = ({ name, image, stylek, cardStyle, imageStyle }) => {
  return (
    <View style={[styles.card, cardStyle]}>
      <Image source={{ uri: image }} style={[styles.image, imageStyle]} />
      <Text style={[styles.name, stylek]} numberOfLines={2}>
        {name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: moderateScale(128),
    borderRadius: moderateScale(10),
    height:moderateScale(124),
    margin: moderateScale(10),
    marginBottom: moderateScale(10),
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  image: {
    width: moderateScale(128),
    height: verticalScale(94),
    borderRadius: moderateScale(10),
  },
  name: {
    fontSize: normalizeFont(14),
    fontWeight: '500',
    color: '#000',
    marginTop: verticalScale(4),
    textAlign: 'center',
  },
});

export default Card;

