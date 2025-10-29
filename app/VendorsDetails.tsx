import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProductCard from '../components/common/ProductCard';

const { width } = Dimensions.get('window');
const API = 'https://393rb0pp-5000.inc1.devtunnels.ms';
const COORDS = '?buyerLat=28.70&buyerLng=77.22';

const CARD_MARGIN = 10;
const CARD_COLUMNS = 2;
const CARD_WIDTH = (width - CARD_MARGIN * (CARD_COLUMNS * 2)) / CARD_COLUMNS;

const CATEGORIES = ['All', 'Fruits', 'Vegetables', 'Seeds', 'Plants', 'Handicrafts'];

const ReviewCard = ({ item }) => (
  <TouchableOpacity style={styles.reviewCard} activeOpacity={0.8}>
    <View style={styles.header}>
      <Image
        source={{ uri: item?.user?.profilePicture || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.name}>{item?.user?.name || 'Anonymous'}</Text>
        <Text style={styles.rating}>⭐ {item?.rating || 'N/A'}</Text>
      </View>
      <Text style={styles.date}>
        {new Date(item?.createdAt).toLocaleDateString('en-GB')}
      </Text>
    </View>
    {item?.comment && <Text style={styles.comment}>{item.comment}</Text>}
  </TouchableOpacity>
);

const VendorsDetails = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { params } = useRoute();
  const vendorId = params?.vendorId;

  const [vendor, setVendor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const dropdownButtonRef = useRef(null);

  const fetchVendor = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const { data } = await axios.get(`${API}/api/buyer/vendor/${vendorId}${COORDS}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success && data.data?.vendor) {
        setVendor(data.data.vendor);
        setReviews(data.data?.reviews?.list || []);
        setProducts(data.data?.listedProducts || []);
      } else throw new Error('Vendor not found');
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendor();
  }, [vendorId]);

  const handleDropdownPress = () => {
    if (dropdownButtonRef.current) {
      dropdownButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setDropdownLayout({
          x: pageX,
          y: pageY,
          width,
          height,
        });
        setModalVisible(true);
      });
    }
  };

  if (loading)
    return (
      <View style={styles.containerRoot}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={{ marginTop: 8 }}>Loading...</Text>
        </View>
      </View>
    );

  if (error || !vendor)
    return (
      <View style={styles.containerRoot}>
        <View style={styles.center}>
          <Text style={styles.errorHeader}>Error</Text>
          <Text>{error}</Text>
        </View>
      </View>
    );

  const v = vendor;
  const image = v.profilePicture || 'https://picsum.photos/800/600';

  // Filter products
  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter(p => p.category === selectedCategory);

  const allReviewImages = reviews.reduce((acc, review) => {
    if (review.images && Array.isArray(review.images)) {
      return [...acc, ...review.images];
    }
    return acc;
  }, []);

  const ListHeader = () => (
    <View style={{ width: '100%', paddingBottom: 10, backgroundColor: '#fff' }}>
      {/* Header Image */}
      <View style={styles.imageBox}>
        <Image source={{ uri: image }} style={styles.image} />
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Vendor Info */}
      <View style={styles.cardContainer}>
        <View style={styles.rowBetween}>
          <Text style={styles.vendorName}>{v.name}</Text>
          <View style={styles.ratingBox}>
            <Text style={styles.ratingText}>{v.rating?.toFixed(1) || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Ionicons name="location-sharp" size={16} color="#757575" />
          <Text style={styles.location}>
            {v.locationText || 'Unknown'} ({v.distance || 'N/A'})
          </Text>
        </View>
        <Text style={styles.aboutHeader}>About</Text>
        <Text style={styles.about}>{v.about || 'No information available.'}</Text>
      </View>

      {allReviewImages.length > 0 && (
        <View style={{ backgroundColor: '#fff', paddingVertical: 10, paddingLeft: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
            <Text style={styles.sectionHeader}>Reviews ( {reviews.length} reviews)</Text>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('SeeAllReview', {
                  vendor,
                  reviews,
                })
              }>
              <Text style={{ color: 'blue', fontWeight: '600', marginRight: 10, }}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={allReviewImages}
            horizontal
            keyExtractor={(item, idx) => `review-img-${idx}`}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={{ width: 120, height: 120, marginRight: 8, borderRadius: 8 }}
              />
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* Reviews */}
      <View style={{ backgroundColor: '#fff', paddingVertical: 10, marginTop: allReviewImages.length > 0 ? 0 : 10 }}>
        {reviews.length > 0 ? (
          <FlatList
            data={reviews}
            renderItem={({ item }) => <ReviewCard item={item} />}
            keyExtractor={item => item._id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 }}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', }}>
            <Image style={{ width: 70, height: 70 }} source={require('../assets/via-farm-img/icons/empty.png')} />
            <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:5,}}>
              <Image style={{ width:25, height:25 }} source={require("../assets/via-farm-img/icons/satar.png")} />
              <Image style={{ width:25, height:25 }} source={require("../assets/via-farm-img/icons/satar.png")} />
              <Image style={{ width:25, height:25 }} source={require("../assets/via-farm-img/icons/satar.png")} />
              <Image style={{ width:25, height:25 }} source={require("../assets/via-farm-img/icons/satar.png")} />
              <Image style={{ width:25, height:25 }} source={require("../assets/via-farm-img/icons/satar.png")} />
            </View>
            <Text style={styles.noReviewText}>No reviews yet.</Text>
          </View>
        )}
      </View>

      {/* Products Header + Dropdown */}
      <View style={styles.productsHeaderContainer}>
        <Text style={[styles.sectionHeader, { marginLeft: 0, marginVertical: 0 }]}>
          Listing Product
        </Text>

        <TouchableOpacity
          ref={dropdownButtonRef}
          style={styles.dropdownButton}
          onPress={handleDropdownPress}>
          <Text style={styles.dropdownButtonText}>{selectedCategory}</Text>
          <Ionicons name="chevron-down" size={20} color="#555" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList
      style={styles.containerRoot}
      data={filteredProducts}
      ListHeaderComponent={<ListHeader />}
      renderItem={({ item }) => (
        <ProductCard
          id={item?._id}
          title={item?.name || 'Unnamed Product'}
          subtitle={item?.variety || ''}
          price={item?.price || 0}
          rating={item?.rating || 0}
          image={item?.images?.[0] || 'https://via.placeholder.com/150'}
          width={CARD_WIDTH}
          onPress={() => console.log('Pressed product', item?._id)}
          onAddToCart={() => console.log('Add to cart:', item?._id)}
        />
      )}
      keyExtractor={(item, index) => item?._id?.toString() || index.toString()}
      numColumns={CARD_COLUMNS}
      columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: CARD_MARGIN }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40, backgroundColor: '#fff' }}
      ListEmptyComponent={<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Image style={{ width: 120, height: 120, }} source={require('../assets/via-farm-img/icons/emptyProductList.png')} />
        <Text>No products available.</Text>
      </View>}
    />
  );
};

const styles = StyleSheet.create({
  containerRoot: {
    flex: 1,
    backgroundColor: '#fff', 
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', 
  },
  errorHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 10,
  },
  imageBox: {
    width: '100%',
    height: 250,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backBtn: {
    position: 'absolute',
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 5,
  },
  cardContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  vendorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingBox: {
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  ratingText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  location: {
    marginLeft: 5,
    fontSize: 14,
    color: '#757575',
  },
  aboutHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  about: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
    lineHeight: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 10,
    marginLeft: 10,
  },
  noReviewText: {
    textAlign: 'center',
    color: '#757575',
    paddingVertical: 10,
  },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginRight: 10,
    width: 300,
    borderWidth: 1,
    borderColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  rating: {
    fontSize: 12,
    color: '#FFC107',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  comment: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  productsHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 10,
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    minWidth: 120,
  },
  dropdownButtonText: {
    fontSize: 16,
    marginRight: 5,
    color: '#333',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: 235,
    minWidth: 100,
  },
  modalScrollView: {
    paddingVertical: 5,
  },
  modalItem: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalItemSelected: {
    backgroundColor: '#e8f5e9',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemTextSelected: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});

export default VendorsDetails;
