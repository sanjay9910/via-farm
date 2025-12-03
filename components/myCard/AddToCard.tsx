import Responsive from '@/app/Responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from 'expo-router';
import { goBack } from 'expo-router/build/global-state/routing';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  View
} from 'react-native';
import SuggestionCard from '../myCard/RelatedProduct';

const { width, height } = Dimensions.get('window');

const BASE_URL = 'https://viafarm-1.onrender.com';
const GET_CART_ENDPOINT = '/api/buyer/cart';
const ADD_UPDATE_CART_ENDPOINT = '/api/buyer/cart/add';
const DELETE_CART_ITEM_ENDPOINT = '/api/buyer/cart/';
const { moderateScale, scale, verticalScale, normalizeFont } = Responsive;


const MyCart = () => {
  const navigation = useNavigation();

  const [authToken, setAuthToken] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorDetails, setVendorDetails] = useState(null);
  const [slot, setSlot] = useState({ date: '', startTime: '', endTime: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState(new Date());
  const [selectedEndTime, setSelectedEndTime] = useState(new Date());
  const [startAMPM, setStartAMPM] = useState('AM');
  const [endAMPM, setEndAMPM] = useState('AM');
  const [paymentMethod, setPaymentMethod] = useState('cash');


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

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Coupon state: appliedCoupon = null unless user applied explicitly
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // Available coupons (local fallback)
  const availableCoupons = [
    { code: 'SAVE10', discount: 10, type: 'percentage' },
    { code: 'SAVE20', discount: 70, type: 'percentage' },
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
      console.log('Fetch cart response:', res.status, json);
      if (res.ok && json.success) {
        const items = json.data.items || [];

        if (items.length > 0 && items[0].vendor) {
          const vendor = items[0].vendor;
          setVendorDetails({
            id: vendor.id,
            name: vendor.name,
            phoneNo: vendor.mobileNumber,
            profilePicture: vendor.profilePicture,
            pickupLocationText: `${vendor.address?.houseNumber || ''} ${vendor.address?.street || ''}, ${vendor.address?.locality || ''}, ${vendor.address?.city || ''}`.trim(),
            address: vendor.address,
            about: vendor.about,
            latitude: vendor.address?.latitude || vendor.geoLocation?.[1],
            longitude: vendor.address?.longitude || vendor.geoLocation?.[0],
          });
        }

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

        const subtotalLocal = transformed.reduce((s, i) => s + (Number(i.price) || 0) * (i.quantity || 0), 0);
        const serverSummary = json.data.priceDetails ?? json.data.summary ?? {};
        const serverDeliveryCharge = Number(serverSummary.deliveryCharge ?? 0);
        if (appliedCoupon) {
          setPriceDetails({
            totalMRP: Number(serverSummary.totalMRP ?? subtotalLocal),
            couponDiscount: Number(serverSummary.discount ?? serverSummary.couponDiscount ?? 0),
            deliveryCharge: serverDeliveryCharge,
            totalAmount: Number(serverSummary.totalAmount ?? Math.max(0, subtotalLocal - (serverSummary.discount ?? serverSummary.couponDiscount ?? 0) + serverDeliveryCharge)),
          });
        } else {
          setPriceDetails({
            totalMRP: subtotalLocal,
            couponDiscount: 0,
            deliveryCharge: serverDeliveryCharge,
            totalAmount: Number((subtotalLocal + serverDeliveryCharge).toFixed(2)),
          });

          if (json.data.couponCode) {
            console.log('Server returned couponCode but not auto-applying:', json.data.couponCode);
          }
        }
      } else {
        setCartItems([]);
        setVendorDetails(null);
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
  }, [appliedCoupon]); 

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

  const updateQuantity = async (itemId, newQty) => {
    if (!authToken) {
      Alert.alert('Error', 'Token not found.');
      return;
    }

    if (newQty < 1) return removeItem(itemId);

    const prevItem = cartItems.find(i => i.id === itemId);

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

  const removeItem = async (itemId) => {
    if (!authToken) return Alert.alert('Error', 'Token not found.');

    const prevCart = [...cartItems];

    // Optimistically remove from UI
    setCartItems(prev => prev.filter(i => i.id !== itemId));

    try {
      const res = await fetch(`${BASE_URL}${DELETE_CART_ITEM_ENDPOINT}${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) {
        const json = await res.json();
        Alert.alert('Remove Failed', json.message || 'Could not remove item.');
        // Revert on error
        setCartItems(prevCart);
      } else {
        Alert.alert('Success', 'Item removed from cart');
        // Refresh cart to update prices
        fetchCartItems(authToken);
      }
    } catch (e) {
      console.error('Remove Error:', e);
      Alert.alert('Error', 'Network error.');
      // Revert on error
      setCartItems(prevCart);
    }
  };

  // APPLY COUPON: call server endpoint to validate & apply coupon.
  const applyCoupon = async () => {
    setCouponError('');
    const codeToApply = (couponCode || '').toString().trim();
    if (!codeToApply) {
      setCouponError('Please enter coupon code');
      return;
    }

    console.log('Applying coupon to API:', codeToApply);

    try {
      const token = authToken || (await getAuthToken());
      if (!token) {
        Alert.alert('Error', 'Please login to apply coupon.');
        return;
      }

      const res = await fetch(`${BASE_URL}/api/buyer/cart/apply-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: codeToApply }),
      });

      const json = await res.json();
      console.log('Apply coupon response:', res.status, json);

      if (res.ok && json.success) {
        const pd = json.priceDetails ?? json.summary ?? {};

        setPriceDetails({
          totalMRP: Number(pd.totalMRP ?? pd.totalMRP ?? 0),
          couponDiscount: Number(pd.discount ?? pd.couponDiscount ?? 0),
          deliveryCharge: Number(pd.deliveryCharge ?? 0),
          totalAmount: Number(pd.totalAmount ?? 0),
        });

        const serverTotalMRP = Number(pd.totalMRP ?? 0);
        const serverTotalAmount = Number(pd.totalAmount ?? 0);
        let computedDiscount = 0;
        if (serverTotalMRP > 0 && serverTotalAmount >= 0) {
          computedDiscount = serverTotalMRP - serverTotalAmount;
        }
        const explicitDiscount = Number(pd.discount ?? pd.couponDiscount ?? 0);
        const finalDiscountToShow = explicitDiscount > 0 ? explicitDiscount : computedDiscount;

        setAppliedCoupon({
          code: json.couponCode ?? codeToApply,
          discount: finalDiscountToShow,
          type: 'fixed', 
        });

        console.log('Applied coupon resolved discount:', finalDiscountToShow, 'server priceDetails:', pd);

        Alert.alert('Success', json.message || 'Coupon applied successfully.');
      } else {
        console.warn('Apply coupon failed:', json);
        const errMsg = json.message || 'Failed to apply coupon';
        setCouponError(errMsg);
        Alert.alert('Coupon Error', errMsg);
      }
    } catch (err) {
      console.error('Apply coupon error:', err);
      setCouponError('Network error while applying coupon');
      Alert.alert('Error', 'Network error while applying coupon');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    (async () => {
      const token = authToken || (await getAuthToken());
      if (token) fetchCartItems(token);
    })();
  };

  const handleDateChange = (event, date) => {
    if (event.type === 'set' && date) {
      const formattedDate = date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      setSlot({ ...slot, date: formattedDate });
      setSelectedDate(date);
    }
    setShowDatePicker(false);
  };

  const convertTo12Hour = (date, ampm) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');

    if (ampm === 'PM' && hours < 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours >= 12) {
      hours -= 12;
    }

    const display12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${String(display12).padStart(2, '0')} : ${minutes}`;
  };

  const handleStartTimeChange = (event, time) => {
    if (event.type === 'set' && time) {
      const formattedTime = convertTo12Hour(time, startAMPM);
      setSlot({ ...slot, startTime: formattedTime });
      setSelectedStartTime(time);
    }
    setShowStartTimePicker(false);
  };

  const handleEndTimeChange = (event, time) => {
    if (event.type === 'set' && time) {
      const formattedTime = convertTo12Hour(time, endAMPM);
      setSlot({ ...slot, endTime: formattedTime });
      setSelectedEndTime(time);
    }
    setShowEndTimePicker(false);
  };

  const subtotal = cartItems.reduce((s, i) => s + (Number(i.price) || 0) * (i.quantity || 0), 0);
  const calculateCouponDiscount = () => {
    const serverCouponDiscount = Number(priceDetails.couponDiscount ?? priceDetails.discount ?? 0);
    if (appliedCoupon && serverCouponDiscount > 0) return serverCouponDiscount;
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percentage') {
      return (subtotal * appliedCoupon.discount) / 100;
    } else {
      return Number(appliedCoupon.discount || 0);
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
    if (option === 'pickup') {
      openPickupModal();
    } else {
      navigation.navigate("ReviewOrder");
      setSelectedOption(option);
      closeModal();
    }
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


  const handlePlaceOrderPickup = async () => {
    if (!slot.date || !slot.startTime || !slot.endTime) {
      Alert.alert('Error', 'Please select date and time slot');
      return;
    }
    if (!paymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    const orderPayload = {
      deliveryType: 'Pickup',
      pickupSlot: {
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      },
      couponCode: appliedCoupon?.code || '',
      paymentMethod: paymentMethod === 'online' ? 'Online' : 'Cash',
      comments: '',
    };
    if (paymentMethod === 'online') {
      closePickupModal();
      setTimeout(() => {
        navigation.navigate('PickupOnlinePayment', {
          amount: finalAmount,
          orderPayload,
        });
      }, 300); 
      return;
    }

    try {
      const token = authToken || (await getAuthToken());
      if (!token) {
        Alert.alert('Error', 'Please login to place order.');
        return;
      }

      const res = await fetch(`${BASE_URL}/api/buyer/pickuporder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        closePickupModal();
        setTimeout(() => {
          setShowSuccessModal(true);
          setTimeout(() => {
            setShowSuccessModal(false);
            navigation.navigate('index');
          }, 3000);
        }, 350); 
      } else {
        console.warn('Place order failed:', json);
        Alert.alert('Order Failed', json.message || 'Could not place order.');
      }
    } catch (err) {
      console.error('Place order error:', err);
      Alert.alert('Error', 'Network error while placing order.');
    }
  };







  const goReviewPage = () => {
    if (!slot.date || !slot.startTime || !slot.endTime) {
      Alert.alert('Error', 'Please select date and time slot');
      return;
    }
    navigation.navigate("index", {
      totalAmount: finalAmount,
      totalItems: cartItems.reduce((s, i) => s + (i.quantity || 0), 0).toString(),
      pickupSlot: slot,
      paymentMethod: paymentMethod,
    });
  };


  // Cart Card Component
  const CartCard = ({ item }) => (
    <View style={styles.cartCard}>
     <TouchableOpacity onPress={() => navigation.navigate('ViewProduct', { productId: item._id || item.id, product: item })}>

      <Image source={{ uri: item.image || 'https://via.placeholder.com/300' }} style={styles.productImage}  resizeMode='stretch' />
      </TouchableOpacity>
      <View style={styles.productDetails}>
        <View style={styles.productInfo}>
          <Text style={styles.productTitle}>{item.title}</Text>
          {/* <Text style={styles.productSubtitle}>{item.subtitle}</Text> */}

          <View style={styles.priceContainer}>
            <Text style={styles.priceText}><Text style={{ color: 'rgba(66, 66, 66, 1)', fontWeight: 500 }}>MRP </Text>₹{Number(item.price).toFixed(2)}</Text>
          </View>

          <Text style={styles.deliveryText}>{item.deliveryDate}</Text>
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
        <TouchableOpacity onPress={goBack}>
          <Image source={require("../../assets/via-farm-img/icons/groupArrow.png")} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart {loading && cartItems.length > 0 && '(Updating...)'}</Text>
        <View  />
      </View>

      {/* Scrollable Content */}
      {cartItems.length === 0 && !loading ? (
        <EmptyCart />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom:moderateScale(100) }} showsVerticalScrollIndicator={false}>
          <View style={styles.cartSection}>
            {loading ? (
              <Text style={styles.emptyCartText}></Text>
            ) : (
              cartItems.map((item) => (
                <CartCard key={item.id} item={item} />
              ))
            )}
          </View>

          {/* Coupon Section */}
          {cartItems.length > 0 && (
            <View style={styles.couponSection}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: moderateScale(10) }}>
                <Image source={require("../../assets/via-farm-img/icons/promo-code.png")} />
                <View>
                  <Text style={styles.couponTitle}>Have a Coupon ?</Text>
                  <Text style={styles.couponSubtitle}>Apply now and Save Extra!</Text>
                </View>
              </View>

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

         {Array.isArray(cartItems) && cartItems.length > 0 && <SuggestionCard />}
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
              borderTopLeftRadius: moderateScale(20),
              borderTopRightRadius: moderateScale(20),
              padding: moderateScale(25),
              borderWidth: 2,
              borderColor: 'rgba(255, 202, 40, 1)',
              maxHeight: '90%',
              transform: [{ translateY: pickupSlideAnim }],
            }}
            {...pickupPanResponder.panHandlers}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
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
                    <Text style={styles.locationAddress}>
                      {vendorDetails?.pickupLocationText || 'Loading location...'}
                    </Text>
                    <Text style={styles.locationDistance}>
                      {vendorDetails?.address?.locality || 'Location details'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.locationButton}>
                    <Image source={require('../../assets/via-farm-img/icons/directionLocation.png')} />
                  </TouchableOpacity>
                </View>

                <View style={styles.slotSection}>
                  <Text style={styles.slotTitle}>Pick a slot</Text>

                  <View style={styles.dateRow}>
                    <Text style={styles.dateLabel}>Date</Text>
                    <TouchableOpacity
                      style={styles.datePicker}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={styles.dateText}>
                        {slot.date || 'Select Date'}
                      </Text>
                      <Text style={styles.dateIcon}>📅</Text>
                    </TouchableOpacity>
                  </View>

                  {showDatePicker && (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      minimumDate={new Date()}
                    />
                  )}

                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>Between</Text>
                    <View style={styles.timeContainer}>
                      <TouchableOpacity
                        style={styles.timeInput}
                        onPress={() => setShowStartTimePicker(true)}
                      >
                        <Text style={styles.timeText}>
                          {slot.startTime || '--:--'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.ampmButton}
                        onPress={() => setStartAMPM(startAMPM === 'AM' ? 'PM' : 'AM')}
                      >
                        <Text style={styles.ampmText}>{startAMPM}</Text>
                      </TouchableOpacity>
                      <Text style={styles.timeTo}>to</Text>
                      <TouchableOpacity
                        style={styles.timeInput}
                        onPress={() => setShowEndTimePicker(true)}
                      >
                        <Text style={styles.timeText}>
                          {slot.endTime || '--:--'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.ampmButton}
                        onPress={() => setEndAMPM(endAMPM === 'AM' ? 'PM' : 'AM')}
                      >
                        <Text style={styles.ampmText}>{endAMPM}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {showStartTimePicker && (
                    <DateTimePicker
                      value={selectedStartTime}
                      mode="time"
                      display="spinner"
                      onChange={handleStartTimeChange}
                    />
                  )}

                  {showEndTimePicker && (
                    <DateTimePicker
                      value={selectedEndTime}
                      mode="time"
                      display="spinner"
                      onChange={handleEndTimeChange}
                    />
                  )}
                </View>

                <View style={{ paddingBottom: moderateScale(16), backgroundColor: '#fff', borderRadius: moderateScale(10) }}>
                  <Text style={{ fontSize: normalizeFont(10), fontWeight: '600', marginBottom: moderateScale(15) }}>Payment Options</Text>

                  {/* Pay by Cash */}
                  <TouchableOpacity
                    onPress={() => setPaymentMethod('cash')}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: moderateScale(12),
                      paddingHorizontal: moderateScale(10),
                      borderWidth: 1,
                      borderColor: paymentMethod === 'cash' ? '#FFA500' : '#ddd',
                      borderRadius: moderateScale(8),
                      marginBottom: moderateScale(10),
                      backgroundColor: paymentMethod === 'cash' ? '#FFF8E1' : '#fff'
                    }}
                  >
                    <Text style={{ fontSize: normalizeFont(9), color: '#333' }}>Pay by Cash</Text>
                    <View
                      style={{
                        width: scale(22),
                        height: scale(22),
                        borderRadius: moderateScale(11),
                        borderWidth: 2,
                        borderColor: paymentMethod === 'cash' ? '#FFA500' : '#ccc',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {paymentMethod === 'cash' && (
                        <View
                          style={{
                            width: scale(10),
                            height: scale(10),
                            borderRadius: 5,
                            backgroundColor: '#FFA500',
                          }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Pay Online */}
                  <TouchableOpacity
                    onPress={() => setPaymentMethod('online')}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: moderateScale(12),
                      paddingHorizontal: moderateScale(10),
                      borderWidth: 1,
                      borderColor: paymentMethod === 'online' ? '#FFA500' : '#ddd',
                      borderRadius: 8,
                      backgroundColor: paymentMethod === 'online' ? '#FFF8E1' : '#fff'
                    }}
                  >
                    <Text style={{ fontSize: normalizeFont(9), color: '#333' }}>Pay Online</Text>
                    <View
                      style={{
                        width: scale(22),
                        height: scale(22),
                        borderRadius: moderateScale(11),
                        borderWidth: 2,
                        borderColor: paymentMethod === 'online' ? '#FFA500' : '#ccc',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {paymentMethod === 'online' && (
                        <View
                          style={{
                            width: scale(10),
                            height: scale(10),
                            borderRadius: 5,
                            backgroundColor: '#FFA500',
                          }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>

                <Text style={styles.vendorTitle}>Vendor's Details</Text>

                <View style={styles.vendorInfo}>
                  <Image
                    borderRadius={10}
                    style={{ width: scale(60), height: scale(60) }}
                    source={{
                      uri: vendorDetails?.profilePicture || "https://via.placeholder.com/60",
                    }}
                  />
                  <View style={styles.vendorDetails}>
                    {/* <Text style={styles.vendorName}>
                      {vendorDetails?.name || "Vendor Name"}
                    </Text> */}
                    {/* <Text style={styles.vendorLocation}>
                      {vendorDetails?.pickupLocationText || "Vendor Location"}
                    </Text> */}
                    <Text style={styles.vendorPhone}>
                      Phone: {vendorDetails?.phoneNo || "N/A"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.bottomProceed}>
                <TouchableOpacity
                  style={styles.proceedButtonStyle}
                  onPress={handlePlaceOrderPickup}
                >
                  <Text style={styles.proceedButtonText}>Place Order</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Success Modal (shown for Cash order success) */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalBox}>
            <Image source={require('../../assets/via-farm-img/icons/confirm.png')} style={{ width: scale(80), height: scale(70), marginBottom: moderateScale(12) }} />
            <Text style={{ fontSize: normalizeFont(9), fontWeight: '600', marginBottom: moderateScale(6) }}>Order Placed</Text>
            <Text style={{ color: '#555' }}>Your order was placed successfully!</Text>
          </View>
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
                onPress={() => handleOptionSelect('pickup')}
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
    paddingHorizontal:moderateScale(40),
  },
  emptyCartImage: {
    width: scale(150),
    height: scale(150),
    marginBottom: 24,
    resizeMode: 'contain',
  },
  emptyCartTitle: {
    fontSize: normalizeFont(10),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyCartSubtitle: {
    fontSize: normalizeFont(10),
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: scale(22),
  },
  shopNowButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    paddingHorizontal: moderateScale(32),
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(13),
  },
  shopNowText: {
    color: '#fff',
    fontSize: normalizeFont(10),
    fontWeight: '600',
  },
  emptyCartText: {
    textAlign: 'center',
    fontSize: normalizeFont(10),
    color: '#666',
    marginTop: moderateScale(50),
    padding: moderateScale(20),
  },
  couponSection: {
    backgroundColor: '#fff',
    margin: moderateScale(8),
    marginTop: moderateScale(16),
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  couponTitle: {
    fontSize: normalizeFont(10),
    fontWeight: '600',
    color: 'rgba(1, 151, 218, 1)',
  },
  couponSubtitle: {
    fontSize: normalizeFont(10),
    color: 'rgba(1, 151, 218, 1)',
    marginBottom: moderateScale(12),
  },
  couponInputContainer: {
    flexDirection: 'row',
    fontSize: normalizeFont(10),
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    fontSize: normalizeFont(10),
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    marginRight: moderateScale(10),
  },
  applyCouponButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderRadius: 8,
  },
  applyCouponText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: normalizeFont(10),
  },
  removeCouponButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
  },
  removeCouponText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: normalizeFont(12),
  },
  couponError: {
    color: '#ff4444',
    fontSize: normalizeFont(10),
    marginTop: moderateScale(8),
  },
  couponSuccess: {
    color: '#28a745',
    fontSize: normalizeFont(10),
    marginTop: moderateScale(8),
  },

  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(50),
    paddingBottom: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: normalizeFont(12),
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
    marginTop: moderateScale(8),
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productImage: {
    width: moderateScale(160),
    height: moderateScale(148),
    borderRadius:moderateScale(8),
    backgroundColor: '#f8f8f8',
  },
  productDetails: {
    flex: 1,
    marginLeft: moderateScale(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: normalizeFont(10),
    fontWeight: '500',
    color: 'rgba(66, 66, 66, 1)',
    marginBottom: moderateScale(10),
  },
  productSubtitle: {
    fontSize: normalizeFont(10),
    color: '#666',
    marginBottom: moderateScale(8),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mrpText: {
    fontSize: normalizeFont(10),
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: moderateScale(8),
    fontWeight: 300,
  },
  priceText: {
    fontSize: normalizeFont(10),
    fontWeight: '700',
    color: '#333',
  },
  deliveryText: {
    fontSize: normalizeFont(10),
    color: 'rgba(66, 66, 66, 1)',
    marginTop: moderateScale(13),
  },
  removeButton: {
    position: 'absolute',
    right: '5%',
    top: '5%',
    padding: moderateScale(4),
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
  },
  quantityContainer: {
    position: 'absolute',
    right: moderateScale(10),
    bottom: moderateScale(25),
    width: scale(94),
    height: verticalScale(28),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: moderateScale(5),
    borderWidth: moderateScale(1),
    borderColor: 'rgba(76, 175, 80, 1)',
    backgroundColor: '#fff',
    marginRight: scale(71),
  },

  quantityButton: {
    width: scale(28),
    height: verticalScale(28),
    borderRadius: moderateScale(3),
    justifyContent: 'center',
    alignItems: 'center',
  },

  quantityText: {
    paddingTop:moderateScale(2),
    width: scale(28),
    height: scale(27),
    textAlign: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(76, 175, 80, 1)',
    fontSize: normalizeFont(13),
    fontWeight: '600',
    color: 'rgba(76, 175, 80, 1)',
  },
  quantityButtonText: {
    fontSize: normalizeFont(13),
    fontWeight: '800',
    color: 'rgba(76, 175, 80, 1)',
  },



  priceSection: {
    backgroundColor: '#fff',
    margin: moderateScale(8),
    marginTop: moderateScale(16),
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
  },
  priceSectionTitle: {
    fontSize: normalizeFont(10),
    fontWeight: '500',
    color: '#333',
    marginBottom: moderateScale(16),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(12),
  },
  priceLabel: {
    fontSize: normalizeFont(12),
    color: 'rgba(66, 66, 66, 1)',
  },
  priceValue: {
    fontSize: normalizeFont(10),
    color: 'rgba(66, 66, 66, 1)',
    fontWeight: '500',
  },
  discountValue: {
    fontSize: normalizeFont(10),
    color: 'rgba(66, 66, 66, 1)',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: moderateScale(12),
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: normalizeFont(10),
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: normalizeFont(10),
    fontWeight: '700',
    color: '#333',
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: moderateScale(10),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  checkoutButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    borderRadius: 8,
    padding: moderateScale(16),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(10),
  },
  checkoutText: {
    fontSize: normalizeFont(10),
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
    borderTopLeftRadius:moderateScale(20),
    borderTopRightRadius:moderateScale(20),
    maxHeight: '80%',
    borderWidth:1,
    borderBottomWidth:0,
    borderColor: 'rgba(255, 202, 40, 1)',
  },
  dragHandle: {
    width: scale(40),
    height: scale(4),
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical:moderateScale(8),
    borderWidth: 2,
  },
  deliveryModalHeader: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: normalizeFont(11),
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  optionsContainer: {
    padding: moderateScale(20),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: moderateScale(16),
    textAlign: 'center',
  },
  selectedOptionCard: {
    backgroundColor: '#fff',
  },
  optionIcon: {
    marginRight: moderateScale(12),
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: normalizeFont(13),
    fontWeight: '500',
    color: 'rgba(66, 66, 66, 0.7)',
    marginBottom: moderateScale(10),
  },
  optionSubtitle: {
    padding: moderateScale(10),
    marginBottom: moderateScale(20),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    fontSize: normalizeFont(12),
    color: 'rgba(76, 175, 80, 1)',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 250, 232, 1)',
    borderColor: 'rgba(76, 175, 80, 1)',
    borderWidth: 2,
  },
  radioOuter: {
    width: scale(20),
    height: scale(20),
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
    width: scale(10),
    height: scale(10),
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
  text: {
    color: 'rgba(76, 175, 80, 1)',
    fontWeight: '600',
    fontSize: normalizeFont(13),
  },

  // Pickup Modal Styles
  modalContainer: {
    backgroundColor: 'transparent',
    paddingBottom: moderateScale(20),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(20),
  },
  backButton: {
    marginRight: moderateScale(15),
  },
  modalHeaderTitle: {
    fontSize: normalizeFont(13),
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(25),
    paddingHorizontal: moderateScale(10),
  },
  locationIcon: {
    marginRight: moderateScale(10),
  },
  locationDetails: {
    flex: 1,
  },
  locationAddress: {
    fontSize: normalizeFont(13),
    fontWeight: '500',
    color: '#333',
  },
  locationDistance: {
    fontSize: normalizeFont(12),
    color: '#888',
    marginTop: 2,
  },
  locationButton: {
    marginLeft: moderateScale(50),
  },
  slotSection: {
    borderRadius: 12,
    padding: moderateScale(15),
    marginBottom: moderateScale(25),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  slotTitle: {
    color: '#000',
    fontSize: normalizeFont(12),
    fontWeight: '600',
    marginBottom: moderateScale(15),
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(15),
  },
  dateLabel: {
    fontSize: normalizeFont(10),
    color: '#666',
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateText: {
    fontSize: normalizeFont(10),
    marginRight: moderateScale(8),
  },
  dateIcon: {
    fontSize: normalizeFont(10),
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeLabel: {
    fontSize: normalizeFont(10),
    color: '#666',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    backgroundColor: 'white',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  timeText: {
    fontSize: normalizeFont(12),
  },
  timeUnit: {
    fontSize: normalizeFont(12),
    marginHorizontal: moderateScale(8),
    color: '#666',
  },
  timeTo: {
    fontSize: normalizeFont(12),
    marginHorizontal: moderateScale(8),
    color: '#666',
  },
  vendorTitle: {
    fontSize: normalizeFont(10),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(15),
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(25),
    gap: scale(10),
  },
  vendorImage: {
    width: scale(30),
    height: scale(30),
    borderRadius: 25,
    backgroundColor: '#ddd',
    marginRight: moderateScale(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorDetails: {
    flex: 1,
  },
  vendorName: {
    fontSize: normalizeFont(11),
    fontWeight: '600',
    color: '#333',
    marginBottom:moderateScale(2),
  },
  vendorLocation: {
    fontSize: normalizeFont(10),
    color: '#666',
    marginBottom: 1,
  },
  vendorPhone: {
    fontSize: normalizeFont(10),
    color: '#666',
  },
  bottomProceed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: moderateScale(20),
  },
  proceedButtonStyle: {
    padding: moderateScale(8),
    backgroundColor: 'rgba(76, 175, 80, 1)',
    borderRadius:moderateScale(10),
    alignItems: 'center',
    width: '60%',
  },
  proceedButtonText: {
    color: '#fff',
    fontWeight: '600',
    paddingVertical:moderateScale(4),
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalBox: {
    backgroundColor: '#fff',
    width: '75%',
    borderRadius:moderateScale(16),
    paddingVertical: moderateScale(30),
    paddingHorizontal: moderateScale(20),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
});

export default MyCart;