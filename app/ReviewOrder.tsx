import SuggestionCard from '@/components/myCard/SuggestionCard'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRouter } from 'expo-router'
import { goBack } from 'expo-router/build/global-state/routing'
import React, { useState } from 'react'
import {
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
} from 'react-native'

const ReviewOrder = () => {
  const router = useRouter();
  const navigation = useNavigation();

  // Sample product data - this will come from API
  const [products, setProducts] = useState([
    {
      id: 1,
      name: 'Prize',
      description: 'Head Pointed',
      price: 400,
      quantity: 2,
      image: require('../assets/via-farm-img/category/category.png'),
      deliveryDate: 'Sep 20'
    },
    {
      id: 2,
      name: 'Jade',
      description: 'Self Widening Jade Plant',
      price: 100,
      quantity: 1,
      image: require('../assets/via-farm-img/category/category.png'),
      deliveryDate: 'Sep 20'
    }
  ]);

  const [donation, setDonation] = useState(20);
  const deliveryCharge = 20;

  // Address Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [pincode, setPincode] = useState('110098');
  const slideAnim = useState(new Animated.Value(300))[0];

  const addresses = [
    { id: 1, name: 'Devong Arya', pincode: '110098', address: '1st C, Amnipal Apartments, Delhi' },
    { id: 2, name: 'Devong Arya', pincode: '110099', address: '2nd Floor, Green Park, Delhi' },
    { id: 3, name: 'Devong Arya', pincode: '110100', address: '3rd Block, Rohini, Delhi' }
  ];

  const [selectedAddress, setSelectedAddress] = useState(addresses[0]);

  // Calculate total amounts
  const calculateTotals = () => {
    const totalMRP = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    const totalAmount = totalMRP + deliveryCharge + donation;

    return {
      totalMRP,
      totalAmount
    };
  };

  const { totalMRP, totalAmount } = calculateTotals();

  // Quantity handlers
  const increaseQuantity = (productId) => {
    setProducts(products.map(product =>
      product.id === productId
        ? { ...product, quantity: product.quantity + 1 }
        : product
    ));
  };

  const decreaseQuantity = (productId) => {
    setProducts(products.map(product =>
      product.id === productId && product.quantity > 1
        ? { ...product, quantity: product.quantity - 1 }
        : product
    ));
  };

  // Remove product
  const removeProduct = (productId) => {
    setProducts(products.filter(product => product.id !== productId));
  };

  // Handle proceed to payment
  const handleProceedToPayment = () => {
    navigation.navigate("Payment", {
      totalAmount: totalAmount.toString(),
      totalItems: products.reduce((sum, product) => sum + product.quantity, 0).toString()
    });
  };

  // Modal Functions
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

  const MoveToNewAddress = () => {
    setModalVisible(false);
    navigation.navigate("AddNewAddress");
  }

  // Render product card
  const ProductCard = ({ product }) => (
    <View style={styles.productCard}>
      <View style={styles.mainContainer}>
        <View>
          <Image source={product.image} style={styles.productImage} />
        </View>
        <View style={styles.productDetails}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productDescription}>{product.description}</Text>
          <Text style={styles.productPrice}>MRP ₹{product.price}</Text>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => removeProduct(product.id)}
          >
            <Image source={require('../assets/via-farm-img/icons/deleteBtn.png')} />
          </TouchableOpacity>

          <View style={styles.deliveryRow}>
            <Text style={styles.deliveryText}>Delivery by {product.deliveryDate}</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => decreaseQuantity(product.id)}
              >
                <Text style={styles.quantityText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityNumber}>{product.quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => increaseQuantity(product.id)}
              >
                <Text style={styles.quantityText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Image source={require('../assets/via-farm-img/icons/groupArrow.png')} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Review Order</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Deliver to Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deliver to</Text>
          <View style={styles.addressContainer}>
            <View style={styles.location}>
              <Image source={require("../assets/via-farm-img/icons/loca.png")} />
              <Text style={styles.addressText}>{selectedAddress.name}, {selectedAddress.pincode}</Text>
            </View>
            <TouchableOpacity onPress={openModal}>
              <Text style={styles.changeText}>Change ?</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Delivery Date */}
        <Text style={styles.deliveryDate}>Delivered by Sep 20</Text>

        {/* Product Cards - Dynamic */}
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}

        {/* Coupon Section */}
        <View style={styles.couponSection}>
          <Image source={require('../assets/via-farm-img/icons/promo-code.png')} />
          <View>
            <Text style={styles.couponTitle}>Have a Coupon?</Text>
            <Text style={styles.couponSubtitle}>Apply now and Save Extra!</Text>
          </View>
        </View>

        {/* Coupon Input */}
        <View style={styles.couponInputContainer}>
          <TextInput
            style={styles.couponInput}
            placeholder="Enter your coupon code"
            placeholderTextColor="#999"
          />
        </View>

        {/* Donation Section */}
        <Text style={styles.donationText}>If you like the app, you can donate us.</Text>
        <View style={styles.donationSection}>
          <View >
            <Text style={styles.indiaCurrency}>₹</Text>
          </View>
          <View>
            <Text style={styles.donationValue}>₹{donation}</Text>
          </View>
        </View>

        {/* Price Details - Dynamic */}
        <View style={styles.priceSection}>
          <Text style={styles.priceTitle}>Price Details</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total MRP</Text>
            <Text style={styles.priceValue}>₹{totalMRP}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Coupon Discount</Text>
            <Text style={styles.priceValue}>₹0.00</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Charge</Text>
            <Text style={styles.priceValue}>₹{deliveryCharge}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Donation</Text>
            <Text style={styles.priceValue}>₹{donation}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments / Instructions</Text>
          <TextInput
            style={styles.commentsInput}
            placeholder="Instructions / Comments for the vendor"
            placeholderTextColor="#999"
            multiline
          />
        </View>

        <SuggestionCard />

        {/* Extra space for bottom fixed card */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Bottom Payment Card */}
      <View style={styles.bottomPaymentCard}>
        <View style={styles.paymentLeft}>
          <Text style={styles.priceLabelBottom}>Price</Text>
          <Text style={styles.totalPrice}>₹{totalAmount}</Text>
        </View>
        <TouchableOpacity
          style={styles.proceedButton}
          onPress={handleProceedToPayment}
        >
          <Image source={require("../assets/via-farm-img/icons/UpArrow.png")} />
          <Text style={styles.proceedButtonText}>
             Proceed to Payment
             {/* {products.reduce((sum, product) => sum + product.quantity, 0)} | */}
          </Text>
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
                  <Text style={styles.checkButtonText}>Check Pincode</Text>
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
    </View>
  )
}

export default ReviewOrder

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  mainContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  productImage: {
    width: 167,
    height: 128,
    borderRadius: 8,
  },
  productDetails: {
    flex: 1,
  },
  deleteBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 5,
  },
  indiaCurrency: {
    backgroundColor: 'rgba(217, 217, 217, 1)',
    color: 'black',
    padding: 13,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    width: 50,
    fontSize:20,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 70,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal:10,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  bottomSpacer: {
    height: 20,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  addressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  addressText: {
    fontSize: 14,
    color: '#333',
  },
  changeText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },

  deliveryDate: {
    fontSize: 16,
    color: 'rgba(66, 66, 66, 1)',
    marginBottom: 25,
    marginTop: 10,
  },
  productCard: {
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 8,
    marginBottom: 15,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginTop: 4,
  },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  deliveryText: {
    fontSize: 14,
    color: '#666',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    position: 'absolute',
    marginTop: 60,
    borderWidth: 1,
    borderColor: '#000',
  },
  quantityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  quantityNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  couponSection: {
    marginTop: 20,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 10,
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(1, 151, 218, 1)',
  },
  couponSubtitle: {
    fontSize: 14,
    color: 'rgba(1, 151, 218, 1)',
    marginTop: 2,
  },
  couponInputContainer: {
    marginBottom: 20,
  },
  couponInput: {
    borderWidth: 2,
    borderColor: 'rgba(1, 151, 218, 1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  donationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 10,
    gap:20,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  donationText: {
    fontSize:15,
    marginTop:10,
    color: '#666',
    marginBottom:10,
  },
  donationAmount: {
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  donationValue: {
    fontSize:16,
    fontWeight: '600',
    color: '#000',
  },
  priceSection: {
    backgroundColor: '#F8F8F8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  priceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    color: '#000',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  commentsSection: {
    marginBottom: 30,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  commentsInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 80,
    textAlignVertical: 'top',
  },
  // Bottom Payment Card Styles
  bottomPaymentCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent:'space-around',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 25,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  paymentLeft: {
    flexDirection: 'column',
  },
  priceLabelBottom: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  proceedButton: {
    backgroundColor: '#28a745',
    paddingHorizontal:30,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 180,
    flexDirection:'row',
    gap:10,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
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
    borderWidth: 1,
    borderColor: 'green',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  checkButtonText: {
    color: 'blue',
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
})