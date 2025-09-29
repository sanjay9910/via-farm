import React, { useEffect, useRef, useState } from 'react'
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native'

const { width } = Dimensions.get('window')

const Banner = () => {
  const [images, setImages] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollViewRef = useRef(null)

  // Sample API data - Replace with your actual API call
  useEffect(() => {
    fetchBannerImages()
  }, [])

  const fetchBannerImages = async () => {
    try {
      // Replace this with your actual API call
      const response = await fetch('YOUR_API_ENDPOINT')
      const data = await response.json()
      
      // For demo purpose, using sample data
      const sampleImages = [
        { id: 1, url: 'https://picsum.photos/400/200?random=1' },
        { id: 2, url: 'https://picsum.photos/400/200?random=2' },
        { id: 3, url: 'https://picsum.photos/400/200?random=3' },
        { id: 4, url: 'https://picsum.photos/400/200?random=4' },
      ]
      
      setImages(sampleImages)
    } catch (error) {
      console.log('Error fetching images:', error)
      
      // Fallback to local images if API fails
      const localImages = [
        { id: 1, local: require('../../assets/via-farm-img/banner.png') },
        // Add more local images if available
      ]
      setImages(localImages)
    }
  }

  // Auto slide every 3 seconds
  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % images.length
          scrollToIndex(nextIndex)
          return nextIndex
        })
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [images.length])

  const scrollToIndex = (index) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * width * 0.92,
        animated: true
      })
    }
  }

  const onMomentumScrollEnd = (event) => {
    const slideSize = width * 0.92
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize)
    setCurrentIndex(index)
  }

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {images.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dot,
              currentIndex === index ? styles.activeDot : styles.inactiveDot
            ]}
            onPress={() => {
              setCurrentIndex(index)
              scrollToIndex(index)
            }}
          />
        ))}
      </View>
    )
  }

  if (images.length === 0) {
    return (
      <View style={styles.container}>
        <Image 
          source={require('../../assets/via-farm-img/banner.png')}
          style={styles.banner}
          resizeMode="stretch"
        />
      </View>
    )
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={styles.scrollView}
      >
        {images.map((image, index) => (
          <View key={image.id || index} style={styles.container}>
            <Image 
              source={image.url ? { uri: image.url } : image.local}
              style={styles.banner}
              resizeMode="stretch"
            />
          </View>
        ))}
      </ScrollView>
      
      {images.length > 1 && renderDots()}
    </View>
  )
}

export default Banner

const styles = StyleSheet.create({
  mainContainer: {
    position: 'relative',
  },
  scrollView: {
    height: 155 + 46, // Banner height + margin
  },
  container: {
    width: width * 0.92,
    height: 165,
    marginTop:13,
    marginHorizontal: width * 0.04, // Center alignment
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#007AFF',
    width: 20,
    borderRadius: 10,
  },
  inactiveDot: {
    backgroundColor: '#C4C4C4',
  }
})