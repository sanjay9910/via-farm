import { useNavigation } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import SuggestionCard from './SuggestionCard';

const { width, height } = Dimensions.get('window');

const MyCart = () => {

  const navigation = useNavigation();
  // API data - Replace this with your actual API call
  const [cartItems, setCartItems] = useState([
    {
      id: '1',
      title: 'Ceramic Bowl',
      subtitle: 'Hand Crafted',
      price: 350,
      mrp: 450,
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
      quantity: 1,
      deliveryDate: 'Sep 25',
    },
    {
      id: '3',
      title: 'Wooden Spoon Set',
      subtitle: 'Natural Wood',
      price: 200,
      mrp: 280,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop',
      quantity: 3,
      deliveryDate: 'Sep 27',
    },
    {
      id: '78',
      title: 'Glass Jar',
      subtitle: 'Storage Container',
      price: 150,
      mrp: 200,
      image: 'https://images.unsplash.com/photo-1544967882-6abaa82dfea2?w=300&h=300&fit=crop',
      quantity: 2,
      deliveryDate: 'Sep 30',
    },
    {
      id: '5',
      title: 'Jade',
      subtitle: 'Money Plant with Pot',
      price: 100,
      mrp: 150,
      image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=300&fit=crop',
      quantity: 1,
      deliveryDate: 'Sep 30',
    },
  ]);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const slideAnim = useRef(new Animated.Value(300)).current;

  const [pickupModalVisible, setPickupModalVisible] = useState(false);
  const pickupSlideAnim = useRef(new Animated.Value(300)).current;

  // Calculate totals
  const totalMRP = cartItems.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const couponDiscount = 0;
  const deliveryCharges = 50;
  const finalAmount = totalPrice + deliveryCharges - couponDiscount;

  // PanResponder for delivery modal
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

  // PanResponder for pickup modal
  const pickupPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        pickupSlideAnim.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 100) {
        closePickupModal();
      } else {
        Animated.spring(pickupSlideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

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

  const handleOptionSelect = (option) => {
    navigation.navigate("ReviewOrder")
    setSelectedOption(option);
    // setTimeout(() => {
      closeModal();
    // }, 500);
  };

  const openPickupModal = () => {
    // पहले delivery modal को बंद करें
    closeModal();

    // थोड़ी देर बाद pickup modal खोलें
    setTimeout(() => {
      setPickupModalVisible(true);
      Animated.timing(pickupSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 350);
  };

  const closePickupModal = () => {
    Animated.timing(pickupSlideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setPickupModalVisible(false);
    });
  };

  const goReviewPage = () => {
    navigation.navigate("ReviewOrder")
  }

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      setCartItems(prev =>
        prev.map(item =>
          item.id === itemId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const removeItem = (itemId) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const CartCard = ({ item }) => (
    <View style={styles.cartCard}>
      <Image source={{ uri: item.image }} style={styles.productImage} />

      <View style={styles.productDetails}>
        <View style={styles.productInfo}>
          <Text style={styles.productTitle}>{item.title}</Text>
          <Text style={styles.productSubtitle}>{item.subtitle}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.mrpText}>MRP ₹{item.mrp}</Text>
            <Text style={styles.priceText}>₹{item.price}</Text>
          </View>

          <Text style={styles.deliveryText}>Delivery by {item.deliveryDate}</Text>
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeItem(item.id)}
        >
          <Image source={require("../../assets/via-farm-img/icons/deleteBtn.png")} />
        </TouchableOpacity>
      </View>

      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, item.quantity - 1)}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>

        <View style={styles.quantityButton}>
          <Text style={styles.quantityText}>{item.quantity}</Text>
        </View>

        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, item.quantity + 1)}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.cartSection}>
          {cartItems.map((item) => (
            <CartCard key={item.id} item={item} />
          ))}
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.priceSectionTitle}>Price Details</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total MRP</Text>
            <Text style={styles.priceValue}>₹{totalMRP}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Coupon Discount</Text>
            <Text style={styles.discountValue}>-₹{couponDiscount}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Charges</Text>
            <Text style={styles.priceValue}>₹{deliveryCharges}</Text>
          </View>

          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{finalAmount}</Text>
          </View>
        </View>

        <SuggestionCard />
      </ScrollView>

      {/* Fixed Checkout Button */}
      <View style={styles.checkoutContainer}>
        <TouchableOpacity style={styles.checkoutButton} onPress={openModal}>
          <Image source={require("../../assets/via-farm-img/icons/UpArrow.png")} />
          <Text style={styles.checkoutText}>Place Order</Text>
        </TouchableOpacity>
      </View>

      {/* Pickup Modal */}
      <Modal
        visible={pickupModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closePickupModal}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          {/* Background overlay */}
          <TouchableOpacity
            style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' }}
            activeOpacity={1}
            onPress={closePickupModal}
          />

          {/* Bottom Sheet */}
          <Animated.View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 25,
              borderWidth: 2,
              borderColor: 'rgba(255, 202, 40, 1)',
              maxHeight: '80%',
              transform: [{ translateY: pickupSlideAnim }],
            }}
            {...pickupPanResponder.panHandlers}
          >
            {/* Drag handle */}
            <View style={styles.dragHandle} />

            {/* Modal content Start*/}
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity style={styles.backButton}>
                  <Image source={require('../../assets/via-farm-img/icons/groupArrow.png')} />
                </TouchableOpacity>
                <Text style={styles.modalHeaderTitle}>Pickup Location</Text>
              </View>

              {/* Location Info */}
              <View style={styles.locationInfo}>
                <View style={styles.locationIcon}>
                  <Image source={require('../../assets/via-farm-img/icons/loca.png')} />
                </View>
                <View style={styles.locationDetails}>
                  <Text style={styles.locationAddress}>182/3, Vinod Nagar, Delhi</Text>
                  <Text style={styles.locationDistance}>(1.2 kms away)</Text>
                </View>
                <TouchableOpacity style={styles.locationButton}>
                  <Image source={require('../../assets/via-farm-img/icons/directionLocation.png')} />
                </TouchableOpacity>
              </View>

              {/* Pick a slot section */}
              <View style={styles.slotSection}>
                <Text style={styles.slotTitle}>Pick a slot</Text>

                {/* Date picker */}
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Date</Text>
                  <TouchableOpacity style={styles.datePicker}>
                    <Text style={styles.dateText}>29/09/2025</Text>
                    <Text style={styles.dateIcon}>📅</Text>
                  </TouchableOpacity>
                </View>

                {/* Time slot */}
                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>Between</Text>
                  <View style={styles.timeContainer}>
                    <View style={styles.timeInput}>
                      <Text style={styles.timeText}>10:30</Text>
                    </View>
                    <Text style={styles.timeUnit}>AM</Text>
                    <Text style={styles.timeTo}>to</Text>
                    <View style={styles.timeInput}>
                      <Text style={styles.timeText}>12:30</Text>
                    </View>
                    <Text style={styles.timeUnit}>PM</Text>
                  </View>
                </View>
              </View>

              {/* Vendor Details */}
              <Text style={styles.vendorTitle}>Vendor's Details</Text>

              <View style={styles.vendorInfo}>
                {/* <View style={styles.vendorImage}> */}
                  <Image borderRadius={10} width={30} height={30} source={require("../../assets/via-farm-img/category/category.png")} />
                {/* </View> */}
                <View style={styles.vendorDetails}>
                  <Text style={styles.vendorName}>Ashok Sharma</Text>
                  <Text style={styles.vendorLocation}>Location - 182/3, Vinod Nagar,Delhi</Text>
                  <Text style={styles.vendorPhone}>Phone No. - 9999999999</Text>
                </View>
              </View>
            </View>
            {/* Model Content End */}

            {/* Fixed Proceed Button */}
            <View style={styles.bottomProceed}>
              <TouchableOpacity
                style={styles.proceedButtonStyle}
                onPress={() => {
                  closePickupModal(); 
                  goReviewPage();
                }}
              >
                <Text style={styles.proceedButtonText}>Proceed</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </View>
      </Modal>

      {/* Delivery Option Modal */}
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
              styles.deliveryModalContainer,
              {
                transform: [{ translateY: slideAnim }]
              }
            ]}
            {...panResponder.panHandlers}
          >
            {/* Drag Handle */}
            <View style={styles.dragHandle} />

            {/* Modal Header */}
            <View style={styles.deliveryModalHeader}>
              <Text style={styles.modalTitle}>Select One</Text>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {/* Pickup Option */}
              <TouchableOpacity
                style={styles.optionCard}
                onPress={openPickupModal}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Pickup your package from vendor's location</Text>
                  <View style={styles.optionSubtitle}>
                    <Text style={styles.text}>Pickup</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Delivery Option */}
              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => handleOptionSelect('delivery')}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Get your package delivered to your doorstep</Text>
                  <View style={styles.optionSubtitle}>
                    <Text style={styles.text}>Delivery</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
    minHeight: '25%',
    maxHeight: '25%',
  },
  cartSection: {
    backgroundColor: '#fff',
    marginTop: 8,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productImage: {
    width: 127,
    height: 135,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priceContainer: {
    // backgroundColor:'blue',
  },
  mrpText: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  deliveryText: {
    fontSize: 12,
    color: '#28a745',
    marginTop: 4,
  },
  removeButton: {
    position: 'absolute',
    padding: 4,
    marginLeft: 240,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 7,
    marginLeft: 150,
    marginBottom: 16,
    alignSelf: 'flex-end',
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 1)',
  },
  quantityButton: {
    width: 22,
    height: 22,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(76, 175, 80, 1)',
  },
  quantityDisplay: {
    marginHorizontal: 12,
    minWidth: 30,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(76, 175, 80, 1)',
  },
  priceSection: {
    backgroundColor: '#fff',
    margin: 8,
    marginTop: 16,
    borderRadius: 8,
    padding: 16,
  },
  priceSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  discountValue: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  checkoutButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  deliveryModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
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
    borderWidth: 2,
  },
  deliveryModalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  optionsContainer: {
    padding: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  selectedOptionCard: {
    backgroundColor: '#fff',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(66, 66, 66, 0.7)',
    marginBottom: 10,
  },
  optionSubtitle: {
    padding: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    fontSize: 14,
    color: 'rgba(76, 175, 80, 1)',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 250, 232, 1)',
    borderColor: 'rgba(76, 175, 80, 1)',
    borderWidth: 2,
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
  text: {
    color: 'rgba(76, 175, 80, 1)',
    fontWeight: '600',
    fontSize: 16,
  },

  // Pickup Modal Styles
  modalContainer: {
    backgroundColor: 'transparent',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  locationIcon: {
    marginRight: 10,
  },
  locationDetails: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  locationDistance: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  locationButton: {
    marginLeft: 50,
  },
  slotSection: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  slotTitle: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateText: {
    fontSize: 14,
    marginRight: 8,
  },
  dateIcon: {
    fontSize: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  timeText: {
    fontSize: 14,
  },
  timeUnit: {
    fontSize: 12,
    marginHorizontal: 8,
    color: '#666',
  },
  timeTo: {
    fontSize: 14,
    marginHorizontal: 8,
    color: '#666',
  },
  vendorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    gap:10,
  },
  vendorImage: {
    width:30,
    height:30,
    borderRadius: 25,
    backgroundColor: '#ddd',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorDetails: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  vendorLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 1,
  },
  vendorPhone: {
    fontSize: 12,
    color: '#666',
  },
  bottomProceed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
  },
  proceedButtonStyle: {
    padding: 10,
    backgroundColor: 'rgba(76, 175, 80, 1)',
    borderRadius: 10,
    alignItems: 'center',
    width: '60%',
  },
  proceedButtonText: {
    color: '#fff', 
    fontWeight: '600',
  },
});

export default MyCart;