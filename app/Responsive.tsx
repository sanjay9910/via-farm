
import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GUIDELINE_BASE_WIDTH = 375;   
const GUIDELINE_BASE_HEIGHT = 812;  

export const scale = (size) => (SCREEN_WIDTH / GUIDELINE_BASE_WIDTH) * size;

export const verticalScale = (size) => (SCREEN_HEIGHT / GUIDELINE_BASE_HEIGHT) * size;

export const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export const normalizeFont = (size) => {
  const newSize = moderateScale(size);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
};

// Handy helpers (optional)
export const isSmallDevice = SCREEN_WIDTH <= 320;
export const isLargeDevice = SCREEN_WIDTH >= 768;

export default {
  scale,
  verticalScale,
  moderateScale,
  normalizeFont,
  isSmallDevice,
  isLargeDevice,
};
