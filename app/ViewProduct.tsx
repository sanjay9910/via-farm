import SuggestionCard from '@/components/myCard/SuggestionCard';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopRatingCard from '../components/common/topRatingCard';
import RatingCardAlso from '../components/myCard/RatingCardAlso';

const ProductDetailScreen = () => {
  const [pincode, setPincode] = useState('110015');
  const [coupon, setCoupon] = useState('');
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();
  const slideAnim = useState(new Animated.Value(300))[0];

  const addresses = [
    { id: 1, name: 'Douang Arya', pincode: '100888', address: '1st C, Amnipal Apartments, Delhi' },
    { id: 2, name: 'Douang Arya', pincode: '100888', address: '1st C, Amnipal Apartments, Delhi' },
    { id: 3, name: 'Douang Arya', pincode: '100888', address: '1st C, Amnipal Apartments, Delhi' }
  ];

  const [selectedAddress, setSelectedAddress] = useState(addresses[0]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        const data = await response.json();
        setProduct({
          name: data[0].name,
          image: 'https://via.placeholder.com/400x220.png?text=Product',
          rating: 4.5,
          price: 200,
          category: 'Handicraft',
          variety: 'Plate',
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
          vendor: 'ABC Handicrafts',
          deliveryDate: 'Sep 30',
        });
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, []);

  const backOrderPage = () => {
    navigation.navigate("MyOrder");
  }

  const openModal = () => {
    setModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        slideAnim.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 100) {
        closeModal();
      } else {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setPincode(address.pincode);
    closeModal();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="green" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Product not found</Text>
      </View>
    );
  }

const MoveToNewAddress = () => {
  setModalVisible(false);
  navigation.navigate("AddNewAddress");
}

  return (
    <SafeAreaView style={styles.mainContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={backOrderPage} style={styles.headerLeft}>
          <Image source={require('../assets/via-farm-img/icons/groupArrow.png')} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {product.name}
        </Text>

        <View style={styles.headerRight}>
          <TouchableOpacity style={{ marginRight: 15 }}>
            <Image source={require("../assets/via-farm-img/icons/heart.png")} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Image source={require("../assets/via-farm-img/icons/shoppinCard.png")} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: product.image }}
          style={styles.productImage}
        />

        {/* Product Info */}
        <View style={styles.productInfo}>
          <View style={styles.rowBetween}>
            <Text style={styles.productTitle}>{product.name}</Text>
            <View style={styles.rating}>
              <Ionicons name="star" size={14} color="gold" />
              <Text style={styles.ratingText}>{product.rating}</Text>
            </View>
          </View>

          <Text style={styles.price}>MRP ${product.price}/pc</Text>

          <Text style={styles.sectionTitle}>About the product</Text>
          <Text style={styles.subText}>Category : {product.category}</Text>
          <Text style={styles.subText}>Variety : {product.variety}</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        {/* Vendor Section */}
        <View style={styles.vendorSection}>
          <Text style={styles.sectionTitle}>About the vendor</Text>
          <Text style={styles.subText}>{product.vendor}</Text>
        </View>

        {/* Delivery Address */}
        <View style={styles.deliverySection}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <View style={styles.deliveryInput}>
            <Text style={{ fontSize: 15 }}>{selectedAddress.pincode}</Text>
            <TouchableOpacity onPress={openModal}>
              <Text style={styles.changeText}>Change ›</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.deliveryDate}>
            Delivered by {product.deliveryDate}
          </Text>
        </View>

        {/* Coupon Section */}
        <View style={styles.couponSection}>
          <Text style={styles.couponTitle}>Have a Coupon ?</Text>
          <Text style={styles.couponSub}>Apply now and Save Extra !</Text>
          <TextInput
            style={styles.couponInput}
            placeholder="Enter your coupon code"
            value={coupon}
            onChangeText={setCoupon}
          />
        </View>

        <RatingCardAlso />
        <TopRatingCard />
        <SuggestionCard />

        <View  /> {/* Space for bottom cart */}
      </ScrollView>

      {/* Bottom Cart Section */}
      <View style={styles.bottomCartSection}>
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>${product.price}</Text>
        </View>

        <TouchableOpacity style={styles.addToCartButton}>
          <Image
            style={{ width: 20, height: 20, marginRight: 8, tintColor: '#fff' }}
            source={require('../assets/via-farm-img/icons/shoppinCard.png')}
          />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>

      {/* Address Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={closeModal}
          />
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY: slideAnim }]
              }
            ]}
            {...panResponder.panHandlers}
          >
            {/* Drag Handle */}
            <View style={styles.dragHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Delivery Location</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Search Section */}
            <View style={styles.searchSection}>
              <View style={styles.pincodeInputContainer}>
                <TextInput
                  style={styles.pincodeInput}
                  placeholder="Enter Pincode"
                  value={pincode}
                  onChangeText={setPincode}
                />
                <TouchableOpacity style={styles.checkButton}>
                  <Text style={styles.checkButtonText}>Check Pincode ›</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.locationButton}>
                <Ionicons name="location" size={16} color="#3b82f6" />
                <Text style={styles.locationButtonText}>Use my current location</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.searchLocationButton}>
                <Ionicons name="search" size={16} color="blue" />
                <Text style={styles.searchLocationButtonText}>Search Location</Text>
              </TouchableOpacity>

              <Text style={styles.orText}>OR</Text>
            </View>

            {/* Address List */}
            <ScrollView style={styles.addressList} showsVerticalScrollIndicator={false}>
              {addresses.map((address) => (
                <TouchableOpacity
                  key={address.id}
                  style={[
                    styles.addressItem,
                    selectedAddress.id === address.id && styles.selectedAddressItem
                  ]}
                  onPress={() => handleAddressSelect(address)}
                >
                  <View style={styles.radioContainer}>
                    <View style={[
                      styles.radioOuter,
                      selectedAddress.id === address.id && styles.radioOuterSelected
                    ]}>
                      {selectedAddress.id === address.id && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                  </View>
                  <View style={styles.addressDetails}>
                    <Text style={styles.addressName}>
                      {address.name}, {address.pincode}
                    </Text>
                    <Text style={styles.addressText}>{address.address}</Text>
                  </View>
                  <TouchableOpacity>
                    <Image source={require('../assets/via-farm-img/icons/editicon.png')} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Add New Address Button */}
            <TouchableOpacity style={styles.addAddressButton}>
              <TouchableOpacity style={styles.NewAddress} onPress={MoveToNewAddress}>
                <Ionicons name="add" size={20} color="rgba(76, 175, 80, 1)" />
                <Text style={styles.addAddressButtonText}>Add New Address</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
  },
  headerLeft: { width: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600' },
  headerRight: { flexDirection: 'row', width: 60, justifyContent: 'flex-end', alignItems: 'center' },

  productImage: { width: '100%', height: 220, resizeMode: 'cover', backgroundColor: '#f9f9f9' },
  productInfo: { padding: 15 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productTitle: { fontSize: 18, fontWeight: '600' },
  rating: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f6f6f6', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  ratingText: { marginLeft: 3, fontSize: 12, fontWeight: '600' },

  price: { fontSize: 16, fontWeight: '700', marginVertical: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginTop: 5 },
  subText: { fontSize: 14, color: '#555', marginTop: 2 },
  description: { fontSize: 13, color: '#666', marginTop: 6, lineHeight: 18 },

  vendorSection: { paddingHorizontal: 15, marginTop: 10 },
  deliverySection: { paddingHorizontal: 15, marginTop: 15 },
  deliveryInput: { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 0.8, borderColor: '#ddd', borderRadius: 10, padding: 12, marginTop: 8 },
  changeText: { color: '#3b82f6', fontWeight: '600' },
  deliveryDate: { marginTop: 5, color: '#777' },

  couponSection: { padding: 15, marginTop: 20, borderTopWidth: 0.5, borderTopColor: '#ddd' },
  couponTitle: { fontWeight: '700', fontSize: 14 },
  couponSub: { fontSize: 12, color: '#3b82f6', marginVertical: 4 },
  couponInput: { borderWidth: 1, borderColor: '#3b82f6', borderRadius: 8, padding: 10, marginTop: 5 },

  // Bottom Cart
  bottomCartSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  priceSection: { flex: 1 },
  priceLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
  priceValue: { fontSize: 18, fontWeight: '700', color: '#000' },
  addToCartButton: {
    flexDirection: 'row',
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '95%',
    borderWidth: 2,
    borderColor: 'rgba(255, 202, 40, 1)',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  searchSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pincodeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  pincodeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
  },
  checkButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  checkButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  locationButton: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  locationButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
    marginLeft: 8,
  },
  searchLocationButton: {
    flexDirection: 'row',
    marginBottom: 15,
    color: '#000',
  },
  searchLocationButtonText: {
    color: 'blue',
    marginLeft: 8,
  },
  orText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  addressList: {
    maxHeight: 300,
    paddingHorizontal: 20,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderWidth: 2,
    padding: 10,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  selectedAddressItem: {
    backgroundColor: '#fff',
  },
  radioContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#3b82f6',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
  addressDetails: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding:15,
  },
  NewAddress: {
    borderWidth:2,
    borderColor: 'rgba(76, 175, 80, 1)',
    flexDirection:'row',
    padding:10,
    borderRadius:10,
  },
  addAddressButtonText: {
    color: 'rgba(76, 175, 80, 1)',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default ProductDetailScreen;