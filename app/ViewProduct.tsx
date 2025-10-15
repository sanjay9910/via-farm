import SuggestionCard from '@/components/myCard/SuggestionCard';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
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

const API_BASE = 'https://393rb0pp-5000.inc1.devtunnels.ms';

// --- UPDATED PickupLocationCard Component ---
const PickupLocationCard = ({ vendorAddress, distance, onPressNavigation }) => {
  // Constructing the full address string from vendorAddress object
  const fullVendorAddress = vendorAddress?.houseNumber || vendorAddress?.locality || vendorAddress?.city
    ? `${vendorAddress.houseNumber || ''}${vendorAddress.houseNumber && vendorAddress.locality ? ', ' : ''}${vendorAddress.locality || ''}${vendorAddress.locality && vendorAddress.city ? ', ' : ''}${vendorAddress.city || ''}`
    : 'Vendor Location not available';

  const displayAddress = fullVendorAddress.trim() || 'Vendor Location not available';

  return (
    <View style={pickupStyles.container}>
      <View style={pickupStyles.leftContent}>
        {/* <Ionicons name="location-sharp" size={20} color="#555" style={pickupStyles.icon} /> */}
        <View style={pickupStyles.textContainer}>
          <Text style={pickupStyles.locationText} numberOfLines={1}>
            <Ionicons name="location-sharp" size={20} color="#555" style={pickupStyles.icon} /> Pickup Location - {displayAddress}
          </Text>
          <Text style={pickupStyles.distanceText}>
            ({distance})
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onPressNavigation} style={pickupStyles.navigationButton}>
        <Image source={require("../assets/via-farm-img/icons/mapDirection.png")} />
      </TouchableOpacity>
    </View>
  );
};

const pickupStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 10,
    padding: 5,
    backgroundColor: 'whitesmock',
  },

  icon: {
    // marginRight: 10,
    color: '#666',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  navigationButton: {
    padding: 5,
    borderRadius: 20,
  },
});
// ------------------------------------------

const ProductDetailScreen = () => {
  const [pincode, setPincode] = useState('110015');
  const [coupon, setCoupon] = useState('');
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState({
    id: 0,
    name: 'Default',
    pincode: '110015',
    address: '182/3, Vinod Nagar, Delhi',
  });
  const [vendorExpanded, setVendorExpanded] = useState(false);
  const slideAnim = useState(new Animated.Value(300))[0];
  const navigation = useNavigation();
  const { orderId } = useLocalSearchParams();

  const addresses = [
    { id: 1, name: 'Douang Arya', pincode: '100888', address: '1st C, Amnipal Apartments, Delhi' },
    { id: 2, name: 'Douang Arya', pincode: '100888', address: '1st C, Amnipal Apartments, Delhi' },
    { id: 3, name: 'Douang Arya', pincode: '100888', address: '1st C, Amnipal Apartments, Delhi' }
  ];

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  // ✅ Fetch order details + set product
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Login required');

      const response = await axios.get(`${API_BASE}/api/buyer/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.order) {
        const orderData = response.data.order;

        // Transform each item
        const transformedItems = orderData.items.map(item => ({
          id: item.id || '',
          name: item.name || 'Unknown Product',
          description: item.description || 'No description available.',
          category: item.category || 'Unknown Category',
          variety: item.subtext || 'Unknown Variety',
          quantity: item.quantity || 0,
          price: item.price || 0,
          unit: item.unit || 'pc',
          image: item.image || 'https://via.placeholder.com/400x220.png?text=Product',
          reviews: (item.reviews || []).map(r => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment || '',
            images: r.images || [],
            createdAt: r.createdAt,
            user: {
              id: r.user._id,
              name: r.user.name,
              profilePicture: r.user.profilePicture
            }
          }))
        }));

        // Vendor info
        const vendorDetails = orderData.vendorDetails || {};
        const vendorAddress = vendorDetails.address || {};

        const transformedProduct = {
          id: transformedItems[0]?.id || '',
          name: transformedItems[0]?.name || 'Unknown Product',
          image: transformedItems[0]?.image || 'https://via.placeholder.com/400x220.png?text=Product',
          rating: 4.5, // You can calculate avg rating if needed
          price: transformedItems[0]?.price || orderData.totalPrice || 0,
          category: transformedItems[0]?.category || 'Unknown Category',
          variety: transformedItems[0]?.variety || 'Unknown Variety',
          description: transformedItems[0]?.description || 'No description available.',
          vendor: vendorDetails.name || 'Unknown Vendor',
          vendorId: orderData.vendor || '',
          deliveryDate: orderData.deliveryDate || 'N/A',
          items: transformedItems,
          vendorDetails: {
            name: vendorDetails.name || 'Unknown Vendor',
            mobileNumber: vendorDetails.mobileNumber || 'N/A',
            profilePicture: vendorDetails.profilePicture || 'https://via.placeholder.com/80x80.png?text=Vendor',
            about: vendorDetails.about || 'No information available.',
            address: {
              houseNumber: vendorAddress.houseNumber || '',
              street: vendorAddress.street || '',
              locality: vendorAddress.locality || '',
              city: vendorAddress.city || '',
              district: vendorAddress.district || '',
              state: vendorAddress.state || '',
              zip: vendorAddress.zip || '',
              pinCode: vendorAddress.pinCode || '',
              latitude: vendorAddress.latitude || '',
              longitude: vendorAddress.longitude || ''
            }
          },
          shippingAddress: orderData.shippingAddress
            ? {
              id: orderData.shippingAddress._id,
              name: 'User',
              pincode: orderData.shippingAddress.pinCode,
              address: `${orderData.shippingAddress.houseNumber}, ${orderData.shippingAddress.locality}, ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state}`
            }
            : null,
          totalPrice: orderData.totalPrice,
          paymentMethod: orderData.paymentMethod,
          comments: orderData.comments,
          donation: orderData.donation,
          orderStatus: orderData.orderStatus,
          transactionId: orderData.transactionId
        };

        setProduct(transformedProduct);

        // Set selected address
        if (transformedProduct.shippingAddress) {
          setSelectedAddress(transformedProduct.shippingAddress);
          setPincode(transformedProduct.shippingAddress.pincode);
        }

        // Check cart & wishlist
        checkIfInCart(transformedProduct.id, token);
        checkIfInWishlist(transformedProduct.id, token);

      } else {
        throw new Error('Order not found');
      }
    } catch (error) {
      console.log('Order fetch error:', error.response?.data || error.message);
      alert('Failed to load order details.');
    } finally {
      setLoading(false);
    }
  };



  const checkIfInCart = async (productId, token) => {
    try {
      const res = await axios.get(`${API_BASE}/api/buyer/cart`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success && res.data.cartItems) {
        const exists = res.data.cartItems.some(item => item.productId === productId);
        setInCart(exists);
      }
    } catch (error) {
      console.log('Check cart error:', error.response?.data || error.message);
    }
  };

  const checkIfInWishlist = async (productId, token) => {
    try {
      const res = await axios.get(`${API_BASE}/api/buyer/wishlist`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success && res.data.wishlistItems) {
        const exists = res.data.wishlistItems.some(item => item.productId === productId);
        setInWishlist(exists);
      }
    } catch (error) {
      console.log('Check wishlist error:', error.response?.data || error.message);
    }
  };

  const handleCartToggle = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return alert("Login required");
      if (!product?.id) return alert("Product not loaded");

      if (!inCart) {
        const payload = { productId: product.id, quantity: 1, vendorId: product.vendorId };
        const res = await axios.post(`${API_BASE}/api/buyer/cart/add`, payload, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.success) setInCart(true);
        alert(res.data.message || "Added to cart!");
      } else {
        const res = await axios.delete(`${API_BASE}/api/buyer/cart/${product.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.success) setInCart(false);
        alert(res.data.message || "Removed from cart!");
      }
    } catch (error) {
      console.log('Cart error:', error.response?.data || error.message);
      alert(error.response?.data?.message || "Error updating cart");
    }
  };

  const handleWishlistToggle = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return alert("Login required");
      if (!product?.id) return alert("Product not loaded");

      const payload = { productId: product.id };
      const res = await axios.post(`${API_BASE}/api/buyer/wishlist/add`, payload, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setInWishlist(!inWishlist);
      alert(res.data.message || (inWishlist ? "Removed from wishlist" : "Added to wishlist"));
    } catch (error) {
      console.log('Wishlist error:', error.response?.data || error.message);
      alert(error.response?.data?.message || "Error updating wishlist");
    }
  };

  const openModal = () => {
    setModalVisible(true);
    Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, { toValue: 300, duration: 300, useNativeDriver: true }).start(() => setModalVisible(false));
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => { if (gestureState.dy > 0) slideAnim.setValue(gestureState.dy); },
    onPanResponderRelease: (_, gestureState) => { if (gestureState.dy > 100) closeModal(); else Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start(); }
  });

  const handleAddressSelect = (address) => { setSelectedAddress(address); setPincode(address.pincode); closeModal(); };
  const MoveToNewAddress = () => { setModalVisible(false); navigation.navigate("AddNewAddress"); };
  const backOrderPage = () => navigation.navigate("MyOrder");
  const handleNavigate = () => alert(`Navigating to Vendor Location: ${product.vendorDetails?.address?.city || 'Unknown'}`); // Placeholder function

  if (loading) return (<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="green" /></View>);
  if (!product) return (<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Product not found</Text></View>);

  return (
    <SafeAreaView style={styles.mainContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={backOrderPage} style={styles.headerLeft}><Image source={require('../assets/via-farm-img/icons/groupArrow.png')} /></TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={{ marginRight: 15 }} onPress={() => navigation.navigate("wishlist")} >
            <Ionicons name={inWishlist ? "heart" : "heart-outline"} size={24} color={inWishlist ? "red" : "black"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("myCard")}>
            <Image source={require("../assets/via-farm-img/icons/shoppinCard.png")} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: product.image }} style={styles.productImage} />
        <TouchableOpacity style={{ right: 10, top: 10, position: 'absolute' }} onPress={handleWishlistToggle}>
          <Ionicons name={inWishlist ? "heart" : "heart-outline"} size={27} color={inWishlist ? "red" : "white"} />
        </TouchableOpacity>

        <View style={styles.productInfo}>
          <View style={styles.rowBetween}>
            <Text style={styles.productTitle}>{product.name}</Text>
            <View style={styles.rating}><Ionicons name="star" size={14} color="gold" /><Text style={styles.ratingText}>{product.rating}</Text></View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <Text style={styles.sectionTitle}>About the product</Text>
            <Text style={styles.price}>MRP ₹{product.price}/pc</Text>
          </View>
          <Text style={styles.subText}>Category : {product.category}</Text>
          <Text style={styles.subText}>Variety : {product.variety}</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        {/* Vendor Section with Dropdown */}
        <TouchableOpacity
          onPress={() => setVendorExpanded(!vendorExpanded)}
          style={styles.vendorSection}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, }}>
            <Text style={styles.sectionTitle}>About the vendor</Text>
            <Ionicons
              name={vendorExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#666"
            />
          </View>

          {vendorExpanded && (
            <View style={{ marginTop: 15, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15, }}>
              <Image
                source={{ uri: product.vendorDetails?.profilePicture || 'https://via.placeholder.com/80x80.png?text=Vendor' }}
                style={{ width: 100, height: 100, borderRadius: 10, marginRight: 15 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 }}>
                  {product.vendorDetails?.name || product.vendor}
                </Text>
                <Text style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>
                  {product.vendorDetails?.address?.houseNumber && product.vendorDetails?.address?.locality
                    ? `Location - ${product.vendorDetails.address.houseNumber}, ${product.vendorDetails.address.locality}, ${product.vendorDetails.address.city}`
                    : 'Location not available'}
                </Text>
                {product.vendorDetails?.mobileNumber && (
                  <Text style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>
                    Mobile: {product.vendorDetails.mobileNumber}
                  </Text>
                )}
                <Text style={{ fontSize: 12, color: '#999', lineHeight: 18 }}>
                  {product.vendorDetails?.about || 'No information available about this vendor.'}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* --- PickupLocationCard Integration (Now uses Vendor Address) --- */}
        <PickupLocationCard
          vendorAddress={product.vendorDetails?.address}
          distance="1.2 kms away" // STATIC Distance (Vendor's location from Buyer's selectedAddress)
          onPressNavigation={handleNavigate}
        />
        {/* ----------------------------------------------------------------- */}


        <View style={styles.deliverySection}>
          <View style={styles.rowBetween}><Text style={styles.sectionTitle}>Delivery Address</Text></View>
          <View style={styles.deliveryInput}>
            <Text style={{ fontSize: 15 }}>{selectedAddress?.pincode}</Text>
            <TouchableOpacity onPress={openModal}><Text style={styles.changeText}>Change ›</Text></TouchableOpacity>
          </View>
          <Text style={styles.deliveryDate}>Delivered by {product.deliveryDate}</Text>
        </View>

        <View style={styles.couponSection}>
          <Text style={styles.couponTitle}>Have a Coupon ?</Text>
          <Text style={styles.couponSub}>Apply now and Save Extra !</Text>
          <TextInput style={styles.couponInput} placeholder="Enter your coupon code" value={coupon} onChangeText={setCoupon} />
        </View>

        <RatingCardAlso />
        <View>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:10,}}>
            <View><Text>Left</Text></View>
            <TouchableOpacity>
              <Text>See All</Text>
              </TouchableOpacity>
          </View>
        <FlatList
          data={product.items[0].reviews.filter(r => r.images.length > 0)} // only reviews with images
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={{ marginRight: 10 }}>
              {item.images.map((imgUrl, index) => (
                <Image
                  key={index}
                  source={{ uri: imgUrl }}
                  style={{ width: 120, height: 120, borderRadius: 8 }}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}
        />
        </View>
        <TopRatingCard />
        <SuggestionCard />
      </ScrollView>

      {/* Bottom Cart */}
      <View style={styles.bottomCartSection}>
        <View style={styles.priceSection}><Text style={styles.priceLabel}>Price</Text><Text style={styles.priceValue}>₹{product.price}</Text></View>
        <TouchableOpacity style={styles.addToCartButton} onPress={handleCartToggle}>
          <Image style={{ width: 20, height: 20, marginRight: 8, tintColor: '#fff' }} source={require('../assets/via-farm-img/icons/shoppinCard.png')} />
          <Text style={styles.addToCartText}>{inCart ? 'Move to Cart' : 'Add to Cart'}</Text>
        </TouchableOpacity>
      </View>

      {/* Address Modal */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackground} activeOpacity={1} onPress={closeModal} />
          <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Delivery Location</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {addresses.map(address => (
                <TouchableOpacity key={address.id} style={[styles.addressItem, selectedAddress?.id === address.id && styles.selectedAddressItem]} onPress={() => handleAddressSelect(address)}>
                  <View style={styles.radioContainer}>
                    <View style={[styles.radioOuter, selectedAddress?.id === address.id && styles.radioOuterSelected]}>
                      {selectedAddress?.id === address.id && <View style={styles.radioInner} />}
                    </View>
                  </View>
                  <View style={styles.addressDetails}><Text style={styles.addressName}>{address.name}, {address.pincode}</Text><Text style={styles.addressText}>{address.address}</Text></View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.NewAddress} onPress={MoveToNewAddress}><Ionicons name="add" size={20} color="rgba(76, 175, 80, 1)" /><Text style={styles.addAddressButtonText}>Add New Address</Text></TouchableOpacity>
            </ScrollView>
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
    padding: 15,
  },
  NewAddress: {
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 1)',
    flexDirection: 'row',
    padding: 10,
    borderRadius: 10,
  },
  addAddressButtonText: {
    color: 'rgba(76, 175, 80, 1)',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default ProductDetailScreen;