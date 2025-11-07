import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

// Define constants for clean and readable spacing
const SCREEN_PADDING = 10; 
const ITEM_GAP = 10;       
// Width calculation: width - (2 * 10) = width - 20
const VISIBLE_ITEM_WIDTH = width - (2 * SCREEN_PADDING); 

const BASE_URL = 'https://viafarm-1.onrender.com';
const ENDPOINT = '/api/admin/public/manage-app/banners/placement/HomePageSlider';

const BannerCard = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');

        const res = await axios.get(`${BASE_URL}${ENDPOINT}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success && Array.isArray(res.data.data)) {
          const formatted = res.data.data.map(item => ({
            id: item._id,
            imageUrl: item.imageUrl,
            link: item.link || null,
          }));
          setBanners(formatted);
        } else {
          console.warn('Invalid response format:', res.data);
          setBanners([]);
        }
      } catch (err) {
        console.log('Error fetching banners:', err.message);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Auto slide every 3 seconds (सुधार यहां किया गया है)
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        let nextIndex = currentIndex + 1;
        
        // Loop Logic: If the index is past the last banner, go back to index 0 (the first banner)
        if (nextIndex >= banners.length) {
            nextIndex = 0; // index 0 पर रीसेट करें
        }
        
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        setCurrentIndex(nextIndex);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [banners, currentIndex]);

  const onMomentumScrollEnd = (event) => {
    // Total snap width is the banner width PLUS the gap between banners (10 + 10 = 20)
    const totalSnapWidth = VISIBLE_ITEM_WIDTH + (ITEM_GAP * 2); 
    const index = Math.round(event.nativeEvent.contentOffset.x / totalSnapWidth);
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (banners.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <Image
          source={require('../../assets/via-farm-img/banner.png')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="stretch"
        />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <FlatList
        ref={flatListRef}
        data={banners}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        // Snap to the width of the banner + gap (width - 20 + 20 = width)
        snapToInterval={VISIBLE_ITEM_WIDTH + (ITEM_GAP * 2)}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumScrollEnd}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.container,
              {
                // First item gets the screen padding (10)
                marginLeft: index === 0 ? SCREEN_PADDING : ITEM_GAP,
                // All items get the item gap (10) on the right
                marginRight: ITEM_GAP,
                // Last item adjustment: The right margin of the last item needs to match SCREEN_PADDING (10) 
                // Currently, marginRight is 10. To make it 10 total, we add 0 padding. 
                // The gap between the last banner and screen edge is 10 (from marginRight)
                paddingRight: index === banners.length - 1 ? 0 : 0, 
              }
            ]}
            activeOpacity={0.9}
            onPress={() => {
              if (item.link) Linking.openURL(item.link).catch((err) => console.log('Link error:', err));
            }}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default BannerCard;

const styles = StyleSheet.create({
  mainContainer: { position: 'relative', marginVertical: 15 },
  loaderContainer: { height: 180, justifyContent: 'center', alignItems: 'center' },
  container: {
    // Banner width: screen width - 20 (10 left padding + 10 right padding)
    width: VISIBLE_ITEM_WIDTH, 
    height: 155,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bannerImage: { width: '100%', height: '100%', borderRadius: 15 },
});