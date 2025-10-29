import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  DeviceEventEmitter,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import SuggestionCard from './SuggestionCard';

const { width, height } = Dimensions.get('window');

const BASE_URL = 'https://393rb0pp-5000.inc1.devtunnels.ms';
const GET_CART_ENDPOINT = '/api/buyer/cart';
const ADD_UPDATE_CART_ENDPOINT = '/api/buyer/cart/add';
const DELETE_CART_ITEM_ENDPOINT = '/api/buyer/cart/';

const MyCart = () => {
  const navigation = useNavigation();

  const [authToken, setAuthToken] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorDetails, SetVendorsDetails] = useState('');
  const [slot, setSlot] = useState({ date: '', startTime: '', endTime: '' });

  const [priceDetails, setPriceDetails] = useState({
    totalMRP: 0,
    couponDiscount: 0,
    deliveryCharge: 0,
    totalAmount: 0,
  });

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const slideAnim = useRef(new Animated.Value(300)).current;

  const [pickupModalVisible, setPickupModalVisible] = useState(false);
  const pickupSlideAnim = useRef(new Animated.Value(300)).current;

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // Available coupons
  const availableCoupons = [
    { code: 'SAVE10', discount: 10, type: 'percentage' },
    { code: 'SAVE20', discount: 20, type: 'percentage' },
    { code: 'FREESHIP', discount: 50, type: 'fixed' },
  ];

  // --- Fetch Token ---
  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) setAuthToken(token);
      return token;
    } catch (e) {
      console.error('Failed to load token:', e);
      return null;
    }
  };

  // fetch Vendors Details start
  useEffect(() => {
    const fetchVendorDetails = async () => {
      try {
        const token = await getAuthToken(); // fetch token
        if (!token) return;

        const response = await fetch(
          `${BASE_URL}/api/buyer/pickup/68d63155abec554d6931b766?buyerLat=19.076&buyerLng=72.8777`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();
        if (data.success) {
          SetVendorsDetails(data.data.vendor);
        } else {
          console.warn("Failed to fetch vendor details:", data.message);
        }
      } catch (error) {
        console.error("Vendor Details Error:", error);
      }
    };

    fetchVendorDetails();
  }, []);
  // fetch Vendors Details end

  // --- Fetch Cart ---
  const fetchCartItems = useCallback(async (token) => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}${GET_CART_ENDPOINT}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const items = json.data.items || [];
        const transformed = items.map(item => ({
          id: item.id || item._id,
          title: item.name,
          subtitle: item.subtitle,
          mrp: Number(item.mrp) || 0,
          price: Number(item.mrp) || 0,
          image: item.imageUrl,
          quantity: item.quantity || 1,
          deliveryDate: item.deliveryText || 'Sep 27',
        }));
        setCartItems(transformed);

        // Use server-provided summary if present, but keep numeric defaults
        const summary = json.data.priceDetails || {};
        setPriceDetails({
          totalMRP: Number(summary.totalMRP ?? transformed.reduce((s, i) => s + i.price * i.quantity, 0)),
          couponDiscount: Number(summary.couponDiscount ?? 0),
          deliveryCharge: Number(summary.deliveryCharge ?? 0),
          totalAmount: Number(summary.totalAmount ?? 0),
        });
      } else {
        setCartItems([]);
        setPriceDetails({ totalMRP: 0, couponDiscount: 0, deliveryCharge: 0, totalAmount: 0 });
        console.warn('Failed to fetch cart:', json.message);
      }
    } catch (error) {
      console.error('Fetch Cart Error:', error);
      Alert.alert('Error', 'Could not fetch cart.');
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = await getAuthToken();
      if (token) fetchCartItems(token);
      else {
        setLoading(false);
      }
    };
    init();

    const sub = DeviceEventEmitter.addListener('cartUpdated', () => {
      getAuthToken().then((token) => {
        if (token) fetchCartItems(token);
      });
    });

    return () => {
      sub.remove();
    };
  }, [fetchCartItems]);

  // --- Update Quantity ---
  const updateQuantity = async (itemId, newQty) => {
    if (!authToken) {
      Alert.alert('Error', 'Token not found.');
      return;
    }

    if (newQty < 1) return removeItem(itemId);

    const prevItem = cartItems.find(i => i.id === itemId);

    // Optimistic UI
    setCartItems(prev =>
      prev.map(i => (i.id === itemId ? { ...i, quantity: newQty } : i))
    );

    try {
      const res = await fetch(`${BASE_URL}/api/buyer/cart/${itemId}/quantity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ quantity: newQty }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        Alert.alert('Update Failed', json.message || 'Could not update quantity.');
        setCartItems(prev =>
          prev.map(i => (i.id === itemId ? prevItem : i))
        );
      } else {
        fetchCartItems(authToken);
      }
    } catch (e) {
      console.error('Update Error:', e);
      Alert.alert('Error', 'Network error.');
      setCartItems(prev =>
        prev.map(i => (i.id === itemId ? prevItem : i))
      );
    }
  };

  // --- Remove Item ---
  const removeItem = async (itemId) => {
    if (!authToken) return Alert.alert('Error', 'Token not found.');
    const prevCart = [...cartItems];

    setCartItems(prev => prev.filter(i => i.id !== itemId));

    try {
      const res = await fetch(`${BASE_URL}${DELETE_CART_ITEM_ENDPOINT}${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        const json = await res.json();
        Alert.alert('Remove Failed', json.message || 'Could not remove item.');
        setCartItems(prevCart);
      } else {
        fetchCartItems(authToken);
      }
    } catch (e) {
      console.error('Remove Error:', e);
      Alert.alert('Error', 'Network error.');
      setCartItems(prevCart);
    }
  };

  // Apply coupon function (client-side fallback; server should ideally handle)
  const applyCoupon = () => {
    setCouponError('');
    const coupon = availableCoupons.find(c => c.code === couponCode.toUpperCase());

    if (coupon) {
      setAppliedCoupon(coupon);
    } else {
      setCouponError('Invalid coupon code');
    }
  };

  // Remove coupon function
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const subtotal = cartItems.reduce((s, i) => s + (Number(i.price) || 0) * (i.quantity || 0), 0);


  const calculateCouponDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percentage') {
      return (subtotal * appliedCoupon.discount) / 100;
    } else {
      return Math.min(appliedCoupon.discount, subtotal);
    }
  };

  const couponDiscount = calculateCouponDiscount();

  const deliveryCharge = Number(priceDetails.deliveryCharge || 0);

  const finalAmount = Number((subtotal - couponDiscount + deliveryCharge).toFixed(2));

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
    navigation.navigate("ReviewOrder");
    setSelectedOption(option);
    closeModal();
  };

  const openPickupModal = () => {
    closeModal();
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
    navigation.navigate("ReviewOrder", {
      totalAmount: finalAmount,
      totalItems: cartItems.reduce((s, i) => s + (i.quantity || 0), 0).toString(),
    });
  };

  // Cart Card Component
  const CartCard = ({ item }) => (
    <View style={styles.cartCard}>
      <Image source={{ uri: item.image || 'https://via.placeholder.com/300' }} style={styles.productImage} />

      <View style={styles.productDetails}>
        <View style={styles.productInfo}>
          <Text style={styles.productTitle}>{item.title}</Text>
          <Text style={styles.productSubtitle}>{item.subtitle}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>₹{Number(item.price).toFixed(2)}</Text>
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
          onPress={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>

        <View style={styles.quantityButton}>
          <Text style={styles.quantityText}>{item.quantity}</Text>
        </View>

        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Empty Cart Component
  const EmptyCart = () => (
    <View style={styles.emptyCartContainer}>
      <Image
        source={require("../../assets/via-farm-img/icons/AddToCard.png")}
        style={styles.emptyCartImage}
      />
      <Text style={styles.emptyCartTitle}>Your Cart is Empty</Text>
      <Text style={styles.emptyCartSubtitle}>Looks like you haven't added anything to your cart yet</Text>
      <TouchableOpacity
        style={styles.shopNowButton}
        onPress={() => navigation.navigate('index')}
      >
        <Text style={styles.shopNowText}>Shop Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart {loading && cartItems.length > 0 && '(Updating...)'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Scrollable Content */}
      {cartItems.length === 0 && !loading ? (
        <EmptyCart />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View style={styles.cartSection}>
            {loading ? (
              <Text style={styles.emptyCartText}>Loading cart...</Text>
            ) : (
              cartItems.map((item) => (
                <CartCard key={item.id} item={item} />
              ))
            )}
          </View>

          {/* Coupon Section */}
          {cartItems.length > 0 && (
            <View style={styles.couponSection}>
              <Text style={styles.couponTitle}>Have a Coupon ?</Text>
              <Text style={styles.couponSubtitle}>Apply now and Save Extra!</Text>

              <View style={styles.couponInputContainer}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter your coupon code"
                  value={couponCode}
                  onChangeText={setCouponCode}
                  editable={!appliedCoupon}
                />
                {appliedCoupon ? (
                  <TouchableOpacity style={styles.removeCouponButton} onPress={removeCoupon}>
                    <Text style={styles.removeCouponText}>Remove</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.applyCouponButton} onPress={applyCoupon}>
                    <Text style={styles.applyCouponText}>Apply</Text>
                  </TouchableOpacity>
                )}
              </View>

              {couponError ? (
                <Text style={styles.couponError}>{couponError}</Text>
              ) : appliedCoupon ? (
                <Text style={styles.couponSuccess}>
                  Coupon applied! {appliedCoupon.discount}
                  {appliedCoupon.type === 'percentage' ? '%' : '₹'} discount
                </Text>
              ) : null}
            </View>
          )}

          {/* Price Section */}
          {cartItems.length > 0 && (
            <View style={styles.priceSection}>
              <Text style={styles.priceSectionTitle}>Price Details</Text>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Total MRP</Text>
                <Text style={styles.priceValue}>₹{Number(subtotal).toFixed(2)}</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Coupon Discount</Text>
                <Text style={styles.discountValue}>-₹{Number(couponDiscount).toFixed(2)}</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Delivery Charges</Text>
                <Text style={styles.priceValue}>₹{Number(deliveryCharge).toFixed(2)}</Text>
              </View>

              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{Number(finalAmount).toFixed(2)}</Text>
              </View>
            </View>
          )}

          {cartItems.length > 0 && <SuggestionCard />}
        </ScrollView>
      )}

      {/* Fixed Checkout Button */}
      {cartItems.length > 0 && (
        <View style={styles.checkoutContainer}>
          <TouchableOpacity style={styles.checkoutButton} onPress={openModal}>
            <Image source={require("../../assets/via-farm-img/icons/UpArrow.png")} />
            <Text style={styles.checkoutText}>Place Order</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pickup Modal */}
      <Modal
        visible={pickupModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closePickupModal}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity
            style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' }}
            activeOpacity={1}
            onPress={closePickupModal}
          />

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
            <View style={styles.dragHandle} />

            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity style={styles.backButton} onPress={closePickupModal}>
                  <Image source={require('../../assets/via-farm-img/icons/groupArrow.png')} />
                </TouchableOpacity>
                <Text style={styles.modalHeaderTitle}>Pickup Location</Text>
              </View>

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

              <View style={styles.slotSection}>
                <Text style={styles.slotTitle}>Pick a slot</Text>

                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Date</Text>
                  <TouchableOpacity style={styles.datePicker}>
                    <Text style={styles.dateText}>
                      {slot.date || 'Select Date'}
                    </Text>
                    <Text style={styles.dateIcon}>📅</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>Between</Text>
                  <View style={styles.timeContainer}>
                    <View style={styles.timeInput}>
                      <Text style={styles.timeText}>
                        {slot.startTime || '--:--'}
                      </Text>
                    </View>
                    <Text style={styles.timeTo}>to</Text>
                    <View style={styles.timeInput}>
                      <Text style={styles.timeText}>
                        {slot.endTime || '--:--'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <Text style={styles.vendorTitle}>Vendor's Details</Text>

              <View style={styles.vendorInfo}>
                <Image
                  borderRadius={10}
                  style={{ width: 60, height: 60 }}
                  source={{
                    uri: vendorDetails?.profilePicture || "https://via.placeholder.com/60",
                  }}
                />
                <View style={styles.vendorDetails}>
                  <Text style={styles.vendorName}>
                    {vendorDetails?.name || "Vendor Name"}
                  </Text>
                  <Text style={styles.vendorLocation}>
                    {vendorDetails?.pickupLocationText || "Vendor Location"}
                  </Text>
                  <Text style={styles.vendorPhone}>
                    Phone: {vendorDetails?.phoneNo || "N/A"}
                  </Text>
                </View>
              </View>
            </View>

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
            <View style={styles.dragHandle} />

            <View style={styles.deliveryModalHeader}>
              <Text style={styles.modalTitle}>Select One</Text>
            </View>

            <View style={styles.optionsContainer}>
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
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyCartImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
    resizeMode: 'contain',
  },
  emptyCartTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyCartSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  shopNowButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  shopNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCartText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
    padding: 20,
  },
  couponSection: {
    backgroundColor: '#fff',
    margin: 8,
    marginTop: 16,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(1, 151, 218, 1)',
    marginBottom: 4,
  },
  couponSubtitle: {
    fontSize: 14,
    color: 'rgba(1, 151, 218, 1)',
    marginBottom: 12,
  },
  couponInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 14,
  },
  applyCouponButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  applyCouponText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  removeCouponButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  removeCouponText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  couponError: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 8,
  },
  couponSuccess: {
    color: '#28a745',
    fontSize: 12,
    marginTop: 8,
  },

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
    flexDirection: 'row',
    alignItems: 'center',
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
    right: '5%',
    top: '5%',
    padding: 4,
    backgroundColor: '#fff',
    borderRadius: 20,
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
    gap: 10,
  },
  vendorImage: {
    width: 30,
    height: 30,
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