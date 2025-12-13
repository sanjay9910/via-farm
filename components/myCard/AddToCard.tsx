// MyCart.jsx
import Responsive from '@/app/Responsive';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from 'expo-router';
import { goBack } from 'expo-router/build/global-state/routing';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  DeviceEventEmitter,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SuggestionCard from '../myCard/RelatedProduct';

const { width, height } = Dimensions.get('window');

const BASE_URL = 'https://viafarm-1.onrender.com';
const GET_CART_ENDPOINT = '/api/buyer/cart';
const ADD_UPDATE_CART_ENDPOINT = '/api/buyer/cart/add';
const DELETE_CART_ITEM_ENDPOINT = '/api/buyer/cart/';
const SELECT_VENDOR_ENDPOINT = '/api/buyer/cart/selectVendor';
const GET_HIGHLIGHTED_COUPONS = '/api/buyer/coupons/highlighted';
const PLACE_PICKUP_ORDER = '/api/buyer/pickuporder';

const { moderateScale, scale, verticalScale, normalizeFont } = Responsive;
const SELECTED_VENDOR_KEY = 'selectedVendorId_viafarm';

const MyCart = () => {
  const navigation = useNavigation();

  const [authToken, setAuthToken] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedVendorId, setSelectedVendorId] = useState(null); 
  const [selectedVendorItems, setSelectedVendorItems] = useState([]);
  const [selectedVendorDetails, setSelectedVendorDetails] = useState(null);
  const [loading, setLoading] = useState(true);
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

  // Modal state (delivery/payment)
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const slideAnim = useRef(new Animated.Value(300)).current;

  const [pickupModalVisible, setPickupModalVisible] = useState(false);
  const pickupSlideAnim = useRef(new Animated.Value(300)).current;

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); 
  const [couponError, setCouponError] = useState('');

  const [highlightedCoupons, setHighlightedCoupons] = useState([]);
  const [showCouponsDropdown, setShowCouponsDropdown] = useState(false);
  const [fetchingCoupons, setFetchingCoupons] = useState(false);

  // --- NEW: quantity-edit modal state for MyCart (same behavior as ProductDetailScreen) ---
  const [qtyModalVisible, setQtyModalVisible] = useState(false);
  const [editQuantity, setEditQuantity] = useState('1');
  const [editingItemId, setEditingItemId] = useState(null);

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

  // persist selected vendor id
  const persistSelectedVendorId = async (id) => {
    try {
      if (id) await AsyncStorage.setItem(SELECTED_VENDOR_KEY, String(id));
      else await AsyncStorage.removeItem(SELECTED_VENDOR_KEY);
    } catch (e) {
      console.warn('persistSelectedVendorId error', e);
    }
  };

  const selectVendor = async (vendorId) => {
    setSelectedVendorId(vendorId);
    persistSelectedVendorId(vendorId);
    const localVendor = vendors.find(v => String(v.id) === String(vendorId));
    if (localVendor) {
      setSelectedVendor(localVendor);
      setSelectedVendorDetails(localVendor);
      setSelectedVendorItems(localVendor.items || []);
      setPriceDetails(localVendor.priceDetails || {
        totalMRP: 0, couponDiscount: 0, deliveryCharge: 0, totalAmount: 0
      });
    }

    try {
      const token = authToken || (await getAuthToken());
      if (!token) return;
      const res = await fetch(`${BASE_URL}${SELECT_VENDOR_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vendorId: vendorId,
          selected: true
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        console.warn('Failed to select vendor on server:', json?.message || res.status);
      }
    } catch (error) {
      console.error('Select Vendor Error:', error);
    }
  };

  const fetchCartItems = useCallback(async (tokenArg) => {
    const token = tokenArg ?? (await getAuthToken());
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
      const json = await res.json().catch(() => ({}));
      // Defensive checks
      if (res.ok && json?.success) {
        const items = (json.data && Array.isArray(json.data.items)) ? json.data.items : [];
        // Group items by vendor
        const vendorsMap = new Map();

        items.forEach(item => {
          const vendor = item.vendor || {};
          const vendorId = vendor.id || vendor._id || 'unknown_vendor';
          if (!vendorsMap.has(vendorId)) {
            vendorsMap.set(vendorId, {
              id: vendorId,
              name: vendor.name || 'Unknown Vendor',
              phoneNo: vendor.mobileNumber || vendor.phone || '',
              profilePicture: vendor.profilePicture || vendor.image || null,
              pickupLocationText: `${vendor.address?.houseNumber || ''} ${vendor.address?.street || ''}, ${vendor.address?.locality || ''}, ${vendor.address?.city || ''}`.trim(),
              address: vendor.address || {},
              about: vendor.about || '',
              latitude: vendor.address?.latitude || vendor.geoLocation?.[1] || null,
              longitude: vendor.address?.longitude || vendor.geoLocation?.[0] || null,
              items: [],
              priceDetails: {},
              selected: false
            });
          }
          const vendorData = vendorsMap.get(vendorId);

          const transformedItem = {
            id: item.id || item._id || String(Math.random()),
            title: item.name || item.title || 'Product',
            subtitle: item.subtitle || '',
            mrp: Number(item.mrp) || 0,
            price: Number(item.price ?? item.mrp) || 0,
            image: item.imageUrl || item.image || null,
            quantity: Number(item.quantity) || 1,
            deliveryDate: item.deliveryText || 'Today',
            vendorId: vendorId,
            vendorName: vendor.name || 'Vendor'
          };

          vendorData.items.push(transformedItem);

          // vendor-wise subtotal
          const subtotal = vendorData.items.reduce((sum, i) => sum + (Number(i.price) || 0) * (i.quantity || 1), 0);

          const vendorPriceDetails = item.vendorPriceDetails || {};
          vendorData.priceDetails = {
            totalMRP: subtotal,
            couponDiscount: Number(vendorPriceDetails.discount || vendorPriceDetails.couponDiscount || 0),
            deliveryCharge: Number(vendorPriceDetails.deliveryCharge || 0),
            totalAmount: Number(vendorPriceDetails.totalAmount || Math.max(0, subtotal - (vendorPriceDetails.discount || vendorPriceDetails.couponDiscount || 0) + (vendorPriceDetails.deliveryCharge || 0))),
          };
        });

        const vendorsArray = Array.from(vendorsMap.values());
        setVendors(vendorsArray);
        let toSelect = null;

        const persisted = await AsyncStorage.getItem(SELECTED_VENDOR_KEY);
        if (persisted) {
          toSelect = vendorsArray.find(v => String(v.id) === String(persisted));
        }
        if (!toSelect && selectedVendorId) {
          toSelect = vendorsArray.find(v => String(v.id) === String(selectedVendorId));
        }

        if (!toSelect) {
          const selectedVendorIds = (json.data && Array.isArray(json.data.selectedVendors)) ? json.data.selectedVendors : [];
          if (selectedVendorIds.length > 0) {
            toSelect = vendorsArray.find(v => v.id === selectedVendorIds[0]);
          }
        }

        if (!toSelect && vendorsArray.length > 0) {
          toSelect = vendorsArray[0];
        }

        if (toSelect) {
          setSelectedVendor(toSelect);
          setSelectedVendorId(toSelect.id);
          persistSelectedVendorId(toSelect.id);
          setSelectedVendorDetails(toSelect);
          setSelectedVendorItems(toSelect.items || []);
          setPriceDetails(toSelect.priceDetails || {
            totalMRP: 0, couponDiscount: 0, deliveryCharge: 0, totalAmount: 0
          });
        } else {
          // no vendors
          setSelectedVendor(null);
          setSelectedVendorItems([]);
          setSelectedVendorDetails(null);
          setPriceDetails({ totalMRP: 0, couponDiscount: 0, deliveryCharge: 0, totalAmount: 0 });
        }

      } else {
        console.warn('Failed to fetch cart:', json?.message || res.status);
        setVendors([]);
        setSelectedVendor(null);
        setSelectedVendorItems([]);
        setSelectedVendorDetails(null);
        setPriceDetails({ totalMRP: 0, couponDiscount: 0, deliveryCharge: 0, totalAmount: 0 });
      }
    } catch (error) {
      console.error('Fetch Cart Error:', error);
      setVendors([]);
      setSelectedVendor(null);
      setSelectedVendorItems([]);
      setSelectedVendorDetails(null);
      setPriceDetails({ totalMRP: 0, couponDiscount: 0, deliveryCharge: 0, totalAmount: 0 });
    } finally {
      setLoading(false);
    }
  }, [selectedVendorId]);

  // fetch highlighted coupons
  const fetchHighlightedCoupons = async (token) => {
    try {
      setFetchingCoupons(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${BASE_URL}${GET_HIGHLIGHTED_COUPONS}`, { headers });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.success && Array.isArray(json.data)) {
        setHighlightedCoupons(json.data);
      } else {
        setHighlightedCoupons([]);
      }
    } catch (err) {
      console.error('Fetch highlighted coupons error:', err);
      setHighlightedCoupons([]);
    } finally {
      setFetchingCoupons(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = await getAuthToken();
      if (token) {
        await fetchCartItems(token);
        await fetchHighlightedCoupons(token);
      } else {
        await fetchHighlightedCoupons(null);
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

  // update quantity (server + optimistic UI)
  const updateQuantity = async (itemId, newQty) => {
    const token = authToken || (await getAuthToken());
    if (!token) {
      Alert.alert('Login required', 'Please login to update cart.');
      return;
    }

    if (newQty < 1) return removeItem(itemId);

    const prevItem = selectedVendorItems.find(i => i.id === itemId);
    if (!prevItem) return;

    // optimistic UI
    setSelectedVendorItems(prev =>
      prev.map(i => (i.id === itemId ? { ...i, quantity: newQty } : i))
    );
    setVendors(prevVendors => prevVendors.map(v => {
      if (v.id !== selectedVendorId) return v;
      return { ...v, items: v.items.map(it => it.id === itemId ? { ...it, quantity: newQty } : it) };
    }));

    try {
      const res = await fetch(`${BASE_URL}/api/buyer/cart/${itemId}/quantity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: newQty }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.success) {
        // rollback
        setSelectedVendorItems(prev =>
          prev.map(i => (i.id === itemId ? prevItem : i))
        );
        fetchCartItems(token);
      } else {
        // refresh server truth
        fetchCartItems(token);
      }
    } catch (e) {
      console.error('Update Error:', e);
      setSelectedVendorItems(prev =>
        prev.map(i => (i.id === itemId ? prevItem : i))
      );
      fetchCartItems(token);
    }
  };

  const removeItem = async (itemId) => {
    const token = authToken || (await getAuthToken());
    if (!token) {
      Alert.alert('Login required', 'Please login to update cart.');
      return;
    }

    const itemToRemove = selectedVendorItems.find(i => i.id === itemId);
    if (!itemToRemove) return;

    setSelectedVendorItems(prev => prev.filter(i => i.id !== itemId));
    setVendors(prevVendors => prevVendors.map(v => v.id === selectedVendorId ? { ...v, items: v.items.filter(it => it.id !== itemId) } : v));

    try {
      const res = await fetch(`${BASE_URL}${DELETE_CART_ITEM_ENDPOINT}${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        console.warn('Delete failed', json);
        fetchCartItems(token);
      } else {
        fetchCartItems(token);
      }
    } catch (e) {
      console.error('Remove Error:', e);
      fetchCartItems(token);
    }
  };

  // apply coupon (keeps your existing server flow)
  const applyCoupon = async (codeToApplyArg) => {
    setCouponError('');
    const raw = codeToApplyArg ?? couponCode;
    const codeToApply = (raw || '').toString().trim();

    if (!codeToApply) {
      setCouponError('Please enter coupon code');
      return;
    }

    if (!selectedVendor) {
      Alert.alert('Error', 'Please select a vendor first.');
      return;
    }

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
        body: JSON.stringify({
          code: codeToApply,
          vendorId: selectedVendor.id
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        const pd = json.priceDetails ?? json.summary ?? {};
        const newPriceDetails = {
          totalMRP: Number(pd.totalMRP ?? pd.totalAmount ?? priceDetails.totalMRP ?? 0),
          couponDiscount: Number(pd.discount ?? pd.couponDiscount ?? 0),
          deliveryCharge: Number(pd.deliveryCharge ?? 0),
          totalAmount: Number(pd.totalAmount ?? (Number(pd.totalMRP ?? 0) - Number(pd.discount ?? pd.couponDiscount ?? 0) + Number(pd.deliveryCharge ?? 0)) ?? 0),
        };

        const updatedVendors = vendors.map(v => {
          if (v.id === selectedVendor.id) {
            return { ...v, priceDetails: newPriceDetails };
          }
          return v;
        });

        setVendors(updatedVendors);

        const updatedSelectedVendor = updatedVendors.find(v => v.id === selectedVendor.id) || selectedVendor;
        setSelectedVendor(updatedSelectedVendor);
        setSelectedVendorDetails(updatedSelectedVendor);
        setSelectedVendorItems(updatedSelectedVendor.items || []);
        setPriceDetails(updatedSelectedVendor.priceDetails || newPriceDetails);

        const serverDiscount = Number(pd.discount ?? pd.couponDiscount ?? 0);

        setAppliedCoupon({
          code: json.couponCode ?? codeToApply,
          discount: serverDiscount,
          type: 'fixed',
          vendorId: selectedVendor.id, 
        });

        setCouponCode(codeToApply);
        fetchCartItems(token);
        setShowCouponsDropdown(false);
      } else {
        const errMsg = json.message || 'Failed to apply coupon';
        setCouponError(errMsg);
      }
    } catch (err) {
      console.error('Apply coupon error:', err);
      setCouponError('Network error while applying coupon');
    }
  };

  const removeCoupon = async () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');

    const token = authToken || (await getAuthToken());
    if (token) {
      try {
        await fetch(`${BASE_URL}/api/buyer/cart/remove-coupon`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ vendorId: selectedVendor?.id }),
        });
        fetchCartItems(token);
      } catch (error) {
        console.error('Remove coupon error:', error);
        fetchCartItems(token);
      }
    }
  };

  const handleDateChange = (event, date) => {
    if (event?.type === 'set' && date) {
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
    if (event?.type === 'set' && time) {
      const formattedTime = convertTo12Hour(time, startAMPM);
      setSlot({ ...slot, startTime: formattedTime });
      setSelectedStartTime(time);
    }
    setShowStartTimePicker(false);
  };

  const handleEndTimeChange = (event, time) => {
    if (event?.type === 'set' && time) {
      const formattedTime = convertTo12Hour(time, endAMPM);
      setSlot({ ...slot, endTime: formattedTime });
      setSelectedEndTime(time);
    }
    setShowEndTimePicker(false);
  };

  const subtotal = selectedVendorItems.reduce((s, i) => s + (Number(i.price) || 0) * (i.quantity || 0), 0);

  const effectiveCouponDiscount = (appliedCoupon && appliedCoupon.vendorId === selectedVendor?.id)
    ? Number(appliedCoupon.discount || 0)
    : Number(priceDetails.couponDiscount || 0);

  const serverHas = priceDetails && priceDetails.totalAmount !== undefined && priceDetails.totalAmount !== null;
  const baseSubtotal = serverHas ? Number(priceDetails.totalMRP ?? subtotal) : subtotal;
  const baseDelivery = serverHas ? Number(priceDetails.deliveryCharge ?? 0) : Number(priceDetails.deliveryCharge ?? 0);
  const serverTotal = serverHas ? Number(priceDetails.totalAmount) : Number(baseSubtotal - (Number(priceDetails.couponDiscount || 0)) + baseDelivery);

  const finalAmount = Math.max(0, Number((serverTotal - effectiveCouponDiscount).toFixed(2)));

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
      navigation.navigate("ReviewOrder", {
        vendorId: selectedVendor?.id,
        vendorName: selectedVendor?.name,
        items: selectedVendorItems,
        priceDetails: priceDetails,
        deliveryType: 'Delivery'
      });
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
    if (!selectedVendor) {
      Alert.alert('Error', 'No vendor selected');
      return;
    }

    const orderPayload = {
      vendorId: selectedVendor.id,
      deliveryType: 'Pickup',
      pickupSlot: {
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      },
      couponCode: appliedCoupon?.code || '',
      paymentMethod: paymentMethod === 'online' ? 'Online' : 'Cash',
      comments: '',
      items: selectedVendorItems.map(item => ({
        id: item.id,
        quantity: item.quantity
      }))
    };

    if (paymentMethod === 'online') {
      closePickupModal();
      setTimeout(() => {
        navigation.navigate('PickupOnlinePayment', {
          amount: finalAmount,
          orderPayload,
          vendorId: selectedVendor.id
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

      const res = await fetch(`${BASE_URL}${PLACE_PICKUP_ORDER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const json = await res.json().catch(() => ({}));

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

  // --- NEW: quantity modal helpers for MyCart ---
  const openQtyModal = (item) => {
    if (!item) return;
    setEditingItemId(item.id);
    setEditQuantity(String(item.quantity || 1));
    setQtyModalVisible(true);
  };

  const closeQtyModal = () => {
    setQtyModalVisible(false);
    setEditingItemId(null);
  };

  const applyQtyChange = async () => {
    const parsed = parseInt(String(editQuantity).replace(/\D/g, ''), 10);
    const newQty = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);

    if (!editingItemId) {
      closeQtyModal();
      return;
    }

    if (newQty <= 0) {
      await removeItem(editingItemId);
    } else {
      await updateQuantity(editingItemId, newQty);
    }

    closeQtyModal();
  };

  const incrementEdit = () => {
    const v = parseInt(editQuantity || "0", 10) || 0;
    setEditQuantity(String(v + 1));
  };
  const decrementEdit = () => {
    const v = parseInt(editQuantity || "0", 10) || 0;
    setEditQuantity(String(Math.max(0, v - 1)));
  };

  // Cart Card Component
  const CartCard = ({ item }) => (
    <View style={styles.cartCard}>
      <TouchableOpacity onPress={() => navigation.navigate('ViewProduct', { productId: item.id, product: item })}>
        <Image source={{ uri: item.image || 'https://via.placeholder.com/300' }} style={styles.productImage} resizeMode='stretch' />
      </TouchableOpacity>
      <View style={styles.productDetails}>
        <View style={styles.productInfo}>
          <Text allowFontScaling={false} style={styles.productTitle}>{item.title}</Text>
          <View style={styles.priceContainer}>
            <Text allowFontScaling={false} style={styles.priceText}><Text style={{ color: 'rgba(66, 66, 66, 1)', fontWeight: '500' }}>MRP </Text>₹{Number(item.price).toFixed(2)}</Text>
          </View>
          <Text allowFontScaling={false} style={styles.deliveryText}>{item.deliveryDate}</Text>
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeItem(item.id)}
        >
          <Image source={require("../../assets/via-farm-img/icons/deleteBtn.png")} />
        </TouchableOpacity>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
            activeOpacity={0.7}
          >
            <Text allowFontScaling={false} style={styles.quantityButtonText}>−</Text>
          </TouchableOpacity>

          {/* MAKE quantity display pressable to open modal (exactly like ProductDetailScreen) */}
          <TouchableOpacity style={styles.quantityButtonn} onPress={() => openQtyModal(item)} activeOpacity={0.8}>
            <Text style={styles.quantityText} allowFontScaling={false}>{String(item.quantity).padStart(2, '0')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
            activeOpacity={0.7}
          >
            <Text style={styles.quantityButtonText} allowFontScaling={false}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const VendorSection = ({ vendor }) => {
    const isSelected = selectedVendor?.id === vendor.id;

    return (
      <View
        style={[
          styles.vendorSection,
          isSelected && styles.selectedVendorSection
        ]}
      >
        <TouchableOpacity
          style={styles.vendorHeader}
          onPress={() => selectVendor(vendor.id)}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: vendor.profilePicture || 'https://via.placeholder.com/40' }}
            style={styles.vendorAvatar}
          />
          <View style={styles.vendorInfoHeader}>
            <Text allowFontScaling={false} style={styles.vendorName}>{vendor.name}</Text>
            <Text allowFontScaling={false} style={styles.vendorItemCount}>{vendor.items?.length || 0} items</Text>
          </View>

          {isSelected ? (
            <View style={styles.selectedIndicator}>
              <Text allowFontScaling={false} style={styles.selectedText}>✓</Text>
            </View>
          ) : (
            <View style={styles.unselectedIndicator} />
          )}
        </TouchableOpacity>

        {/* Always render items for every vendor */}
        {vendor.items?.map((item) => (
          <CartCard key={item.id} item={item} />
        ))}
      </View>
    );
  };

  // Empty Cart Component
  const EmptyCart = () => (
    <View style={styles.emptyCartContainer}>
      <Image
        source={require("../../assets/via-farm-img/icons/AddToCard.png")}
        style={styles.emptyCartImage}
      />
      <Text allowFontScaling={false} style={styles.emptyCartTitle}>Your Cart is Empty</Text>
      <Text allowFontScaling={false} style={styles.emptyCartSubtitle}>Looks like you haven't added anything to your cart yet</Text>
      <TouchableOpacity
        style={styles.shopNowButton}
        onPress={() => navigation.navigate('index')}
      >
        <Text allowFontScaling={false} style={styles.shopNowText}>Shop Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Image source={require("../../assets/via-farm-img/icons/groupArrow.png")} />
        </TouchableOpacity>
        <Text allowFontScaling={false} style={styles.headerTitle}>My Cart {loading && vendors.length > 0 && '(Updating...)'}</Text>
        <View />
      </View>

      {/* Scrollable Content */}
      {vendors.length === 0 && !loading ? (
        <EmptyCart />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: moderateScale(100) }} showsVerticalScrollIndicator={false}>
          {/* Vendor Sections */}
          <View style={styles.vendorsContainer}>
            {vendors.map((vendor) => (
              <VendorSection key={vendor.id} vendor={vendor} />
            ))}
          </View>

          {/* Coupon Section - Only show for selected vendor */}
          {selectedVendor && (
            <View style={styles.couponSection}>
              {/* highlighted coupons trigger */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: moderateScale(8) }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={require("../../assets/via-farm-img/icons/promo-code.png")} />
                  <View style={{ marginLeft: moderateScale(8) }}>
                    <Text allowFontScaling={false} style={styles.couponTitle}>Offers & Coupons</Text>
                    <Text allowFontScaling={false} style={styles.couponSubtitle}>Tap a coupon to apply quickly</Text>
                  </View>
                </View>

                <TouchableOpacity onPress={() => setShowCouponsDropdown(prev => !prev)}>
                  <Text allowFontScaling={false} style={{ fontSize: normalizeFont(10), color: '#0077ff' }}>{showCouponsDropdown ? 'Hide' : 'View Coupons'}</Text>
                </TouchableOpacity>
              </View>

              {/* centered modal for coupons (matches ReviewOrder) */}
              <Modal visible={showCouponsDropdown} transparent animationType="fade" onRequestClose={() => setShowCouponsDropdown(false)}>
                <View style={styles.centeredOverlay}>
                  <Pressable style={styles.modalBackground} onPress={() => setShowCouponsDropdown(false)} />
                  <View style={styles.centeredCouponModal}>
                    <View style={styles.modalHeader}>
                      <Text allowFontScaling={false} style={{ fontWeight: '600' }}>Choose a Coupon</Text>
                      <TouchableOpacity onPress={() => setShowCouponsDropdown(false)} style={styles.closeButton}>
                        <Ionicons name="close" size={22} color="#666" />
                      </TouchableOpacity>
                    </View>


                  <ScrollView>
                    <View style={{ paddingHorizontal: moderateScale(12), paddingBottom: moderateScale(12), paddingTop: moderateScale(8) }}>
                      {fetchingCoupons ? (
                        <Text allowFontScaling={false} style={{ textAlign: 'center' }}> <ActivityIndicator size="large" color="#6B46C1" /></Text>
                      ) : highlightedCoupons.length === 0 ? (
                        <Text allowFontScaling={false} style={{ textAlign: 'center', color: '#666' }}>No offers available</Text>
                      ) : (
                        highlightedCoupons.map(c => {
                          const isPercentage = (c.discount?.type || '').toLowerCase() === 'percentage';
                          const label = isPercentage ? `${c.discount.value}% off` : `₹${c.discount.value} off`;
                          const subtotalLocal = priceDetails?.totalMRP ?? subtotal;
                          const previewDiscount = isPercentage
                            ? Number(((subtotalLocal * Number(c.discount.value || 0)) / 100).toFixed(2))
                            : Number(Number(c.discount.value || 0).toFixed(2));
                          return (
                            <TouchableOpacity
                              key={c._id}
                              style={styles.highlightCouponRow}
                              onPress={() => {
                                setCouponCode(c.code || '');
                                applyCoupon(c.code || '');
                                setShowCouponsDropdown(false);
                              }}
                            >
                              <View>
                                <Text allowFontScaling={false} style={{ fontSize: normalizeFont(11), fontWeight: '600' }}>{c.code}</Text>
                                <Text allowFontScaling={false} style={{ color: '#666' }}>{c.appliesTo?.join?.(', ') || 'All Products'}</Text>
                                <Text allowFontScaling={false} style={{ fontSize: normalizeFont(10), color: '#666' }}>{label} • Min ₹{c.minimumOrder ?? 0}</Text>
                              </View>
                              <View style={{alignItems:"flex-end"}}>
                                <Text allowFontScaling={false} style={{color:'#000',fontSize:normalizeFont(13),fontWeight:'bold',marginBottom:moderateScale(6)}}>Save </Text>
                                <Text allowFontScaling={false} style={{color:'grey',fontSize:normalizeFont(10)}}>₹{previewDiscount.toFixed(2)}</Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </View>
                    </ScrollView>
                  </View>
                </View>
              </Modal>

              <View style={styles.couponInputContainer}>
                <TextInput
                allowFontScaling={false}
                  style={styles.couponInput}
                  placeholder="Enter your coupon code"
                  value={couponCode}
                  onChangeText={setCouponCode}
                  editable={!appliedCoupon}
                />
                {appliedCoupon && appliedCoupon.vendorId === selectedVendor?.id ? (
                  <TouchableOpacity style={styles.removeCouponButton} onPress={removeCoupon}>
                    <Text allowFontScaling={false} style={styles.removeCouponText}>Remove</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.applyCouponButton} onPress={() => applyCoupon()}>
                    <Text allowFontScaling={false} style={styles.applyCouponText}>Apply</Text>
                  </TouchableOpacity>
                )}
              </View>

              {couponError ? (
                <Text allowFontScaling={false} style={styles.couponError}>{couponError}</Text>
              ) : (appliedCoupon && appliedCoupon.vendorId === selectedVendor?.id) ? (
                <Text allowFontScaling={false} style={styles.couponSuccess}>
                  Coupon applied! ₹{Number(effectiveCouponDiscount).toFixed(2)} discount
                </Text>
              ) : null}
            </View>
          )}

          {/* Price Section - show price details for selected vendor */}
          {selectedVendor && (
            <View style={styles.priceSection}>
              <Text allowFontScaling={false} style={styles.priceSectionTitle}>Price Details for {selectedVendor?.name}</Text>

              <View style={styles.priceRow}>
                <Text allowFontScaling={false} style={styles.priceLabel}>Total MRP</Text>
                <Text allowFontScaling={false} style={styles.priceValue}>₹{Number(baseSubtotal).toFixed(2)}</Text>
              </View>

              <View style={styles.priceRow}>
                <Text allowFontScaling={false} style={styles.priceLabel}>Coupon Discount</Text>
                <Text allowFontScaling={false} style={styles.discountValue}>-₹{Number(effectiveCouponDiscount).toFixed(2)}</Text>
              </View>

              <View style={[styles.priceRow, styles.totalRow]}>
                <Text allowFontScaling={false} style={styles.totalLabel}>Total Amount</Text>
                <Text allowFontScaling={false} style={styles.totalValue}>₹{Number(finalAmount).toFixed(2)}</Text>
              </View>
            </View>
          )}

          {selectedVendorItems.length > 0 && <SuggestionCard />}
        </ScrollView>
      )}

      {/* Fixed Checkout Button - Only show if there's a selected vendor with items */}
      {selectedVendor && selectedVendorItems.length > 0 && (
        <View style={styles.checkoutContainer}>
          <TouchableOpacity style={styles.checkoutButton} onPress={openModal}>
            <Image source={require("../../assets/via-farm-img/icons/UpArrow.png")} />
            <Text allowFontScaling={false} style={styles.checkoutText}>Place Order for {selectedVendor?.name}</Text>
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
                  <Text allowFontScaling={false}>Pickup Location</Text>
                </View>

                <View style={styles.locationInfo}>
                  <View style={styles.locationIcon}>
                    <Image source={require('../../assets/via-farm-img/icons/loca.png')} />
                  </View>
                  <View style={styles.locationDetails}>
                    <Text allowFontScaling={false} style={styles.locationAddress}>
                      {selectedVendorDetails?.pickupLocationText || 'Loading location...'}
                    </Text>
                    <Text allowFontScaling={false} style={styles.locationDistance}>
                      {selectedVendorDetails?.address?.locality || 'Location details'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.locationButton}>
                    <Image source={require('../../assets/via-farm-img/icons/directionLocation.png')} />
                  </TouchableOpacity>
                </View>

                <View style={styles.slotSection}>
                  <Text allowFontScaling={false} style={styles.slotTitle}>Pick a slot</Text>

                  <View style={styles.dateRow}>
                    <Text allowFontScaling={false} style={styles.dateLabel}>Date</Text>
                    <TouchableOpacity
                      style={styles.datePicker}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text allowFontScaling={false} style={styles.dateText}>
                        {slot.date || 'Select Date'}
                      </Text>
                      <Text allowFontScaling={false} style={styles.dateIcon}>📅</Text>
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
                    <Text allowFontScaling={false} style={styles.timeLabel}>Between</Text>
                    <View style={styles.timeContainer}>
                      <TouchableOpacity
                        style={styles.timeInput}
                        onPress={() => setShowStartTimePicker(true)}
                      >
                        <Text allowFontScaling={false} style={styles.timeText}>
                          {slot.startTime || '--:--'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.ampmButton}
                        onPress={() => setStartAMPM(startAMPM === 'AM' ? 'PM' : 'AM')}
                      >
                        <Text allowFontScaling={false} style={styles.ampmText}>{startAMPM}</Text>
                      </TouchableOpacity>
                      <Text allowFontScaling={false} style={styles.timeTo}>to</Text>
                      <TouchableOpacity
                        style={styles.timeInput}
                        onPress={() => setShowEndTimePicker(true)}
                      >
                        <Text allowFontScaling={false} style={styles.timeText}>
                          {slot.endTime || '--:--'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.ampmButton}
                        onPress={() => setEndAMPM(endAMPM === 'AM' ? 'PM' : 'AM')}
                      >
                        <Text allowFontScaling={false} style={styles.ampmText}>{endAMPM}</Text>
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
                  <Text allowFontScaling={false} style={{ fontSize: normalizeFont(10), fontWeight: '600', marginBottom: moderateScale(15) }}>Payment Options</Text>

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
                    <Text allowFontScaling={false} style={{ fontSize: normalizeFont(9), color: '#333' }}>Pay by Cash</Text>
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
                    <Text allowFontScaling={false} style={{ fontSize: normalizeFont(9), color: '#333' }}>Pay Online</Text>
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

                <Text allowFontScaling={false} style={styles.vendorTitle}>Vendor's Details</Text>

                <View style={styles.vendorInfo}>
                  <Image
                    borderRadius={10}
                    style={{ width: scale(60), height: scale(60) }}
                    source={{
                      uri: selectedVendorDetails?.profilePicture || "https://via.placeholder.com/60",
                    }}
                  />
                  <View style={styles.vendorDetails}>
                    <Text allowFontScaling={false} style={styles.vendorName}>
                      {selectedVendorDetails?.name || "Vendor Name"}
                    </Text>
                    <Text allowFontScaling={false} style={styles.vendorPhone}>
                      Phone: {selectedVendorDetails?.phoneNo || "N/A"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.bottomProceed}>
                <TouchableOpacity
                  style={styles.proceedButtonStyle}
                  onPress={handlePlaceOrderPickup}
                >
                  <Text allowFontScaling={false} style={styles.proceedButtonText}>Place Order for {selectedVendor?.name}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalBox}>
            <Image source={require('../../assets/via-farm-img/icons/confirm.png')} style={{ width: scale(80), height: scale(70), marginBottom: moderateScale(12) }} />
            <Text allowFontScaling={false} style={{ fontSize: normalizeFont(9), fontWeight: '600', marginBottom: moderateScale(6) }}>Order Placed</Text>
            <Text allowFontScaling={false} style={{ color: '#555' }}>Your order was placed successfully!</Text>
          </View>
        </View>
      </Modal>

      {/* Quantity Modal (NEW - same behavior as ProductDetailScreen) */}
      <Modal
        visible={qtyModalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeQtyModal}
      >
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={closeQtyModal}>
          <View style={[modalStyles.modalWrap, { maxWidth: Math.min(420, Dimensions.get('window').width - moderateScale(40)) }]}>
            <Text allowFontScaling={false} style={modalStyles.modalTitle}>Set quantity</Text>

            <View style={modalStyles.editRow}>
              <TouchableOpacity style={modalStyles.pickerBtn} onPress={decrementEdit}>
                <Ionicons name="remove" size={moderateScale(18)} color="#111" />
              </TouchableOpacity>

              <TextInput
              allowFontScaling={false}
                style={modalStyles.qtyInput}
                keyboardType="number-pad"
                value={String(editQuantity)}
                onChangeText={(t) => setEditQuantity(t.replace(/[^0-9]/g, ""))}
                maxLength={5}
                placeholder="0"
                placeholderTextColor="#999"
              />

              <TouchableOpacity style={modalStyles.pickerBtn} onPress={incrementEdit}>
                <Ionicons name="add" size={moderateScale(18)} color="#111" />
              </TouchableOpacity>
            </View>

            <View style={modalStyles.modalActions}>
              <TouchableOpacity style={modalStyles.cancelBtn} onPress={closeQtyModal}>
                <Text allowFontScaling={false} style={modalStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalStyles.okBtn} onPress={applyQtyChange}>
                <Text allowFontScaling={false} style={modalStyles.okText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
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
              <Text allowFontScaling={false} style={styles.modalTitle}>Select Delivery Option for {selectedVendor?.name}</Text>
            </View>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => handleOptionSelect('pickup')}
              >
                <View style={styles.optionContent}>
                  <Text allowFontScaling={false} style={styles.optionTitle}>Pickup your package from vendor's location</Text>
                  <View style={styles.optionSubtitle}>
                    <Text allowFontScaling={false} style={styles.text}>Pickup</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => handleOptionSelect('delivery')}
              >
                <View style={styles.optionContent}>
                  <Text allowFontScaling={false} style={styles.optionTitle}>Get your package delivered to your doorstep</Text>
                  <View style={styles.optionSubtitle}>
                    <Text allowFontScaling={false} style={styles.text}>Delivery</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  emptyCartContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(20),
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
  couponSection: {
    backgroundColor: '#fff',
    margin: moderateScale(8),
    marginTop: moderateScale(16),
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
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
    marginBottom: moderateScale(6),
  },
  highlightCouponRow: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    padding: moderateScale(10),
    borderRadius: 8,
    marginBottom: moderateScale(8),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    height:scale(50),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: normalizeFont(12),
    fontWeight: '600',
    color: '#333',
  },
  vendorsContainer: {
    marginTop: moderateScale(8),
    padding:moderateScale(8),
  },
  vendorSection: {
    backgroundColor: '#fff',
    marginBottom: moderateScale(5),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: 'grey',
    overflow: 'hidden',
    marginTop:moderateScale(15)
  },
  selectedVendorSection: {
    borderColor: 'grey',
    borderWidth: 2,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    backgroundColor: '#f9f9f9',
  },
  vendorAvatar: {
    width: scale(40),
    height: scale(40),
    borderRadius:50,
    marginRight: moderateScale(12),
  },
  vendorInfoHeader: {
    flex: 1,
  },
  vendorName: {
    fontSize: normalizeFont(12),
    fontWeight: '600',
    color: '#333',
  },
  vendorItemCount: {
    fontSize: normalizeFont(10),
    color: '#666',
    marginTop: 2,
  },
  selectedIndicator: {
    width: scale(24),
    height: scale(24),
    borderRadius:50,
    backgroundColor: 'rgba(76, 175, 80, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: normalizeFont(12),
  },
  unselectedIndicator: {
    width: scale(24),
    height: scale(24),
    borderRadius:50,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productImage: {
    width: moderateScale(120),
    height: moderateScale(110),
    borderRadius: moderateScale(8),
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
    fontSize: normalizeFont(14),
    fontWeight: '500',
    paddingBottom:moderateScale(5),
    color: 'rgba(66, 66, 66, 1)',
    // marginBottom: moderateScale(10),
  },
  productSubtitle: {
    fontSize: normalizeFont(12),
    color: '#666',
    paddingBottom: moderateScale(5),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mrpText: {
    fontSize: normalizeFont(12),
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: moderateScale(8),
    fontWeight: '300',
    paddingBottom:moderateScale(5),
  },
  priceText: {
    fontSize: normalizeFont(12),
    fontWeight: '700',
    color: '#333',
     paddingBottom:moderateScale(5),
  },
  deliveryText: {
    fontSize: normalizeFont(12),
    color: 'rgba(66, 66, 66, 1)',
  },
  removeButton: {
    position: 'absolute',
    right: '5%',
    bottom: 0,
    padding: moderateScale(4),
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
  },

  /* ---------- UPDATED QUANTITY STYLES: CENTERED BOTH AXES ---------- */
  quantityContainer: {
    position: 'absolute',
    left: "1%",
    bottom: 0,
    width:"50%",
    height: verticalScale(28),
    flexDirection: 'row',
    alignItems: 'center',        
    justifyContent: 'space-between', 
    borderRadius: moderateScale(5),
    borderWidth: moderateScale(1),
    borderColor: 'rgba(76, 175, 80, 1)',
    backgroundColor: '#fff',
    paddingHorizontal: moderateScale(4),
  },

  quantityButton: {
    width: scale(28),
    height: verticalScale(28),
    borderRadius: moderateScale(3),
    justifyContent: 'center',
    alignItems: 'center',
  },

  quantityButtonn: {
    minWidth: scale(36),
    height: verticalScale(28),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(4),
  },

  quantityText: {
    minWidth: scale(34),
    height: verticalScale(28),
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(76, 175, 80, 1)',
    fontSize: normalizeFont(13),
    fontWeight: '700',
    color: 'rgba(76, 175, 80, 1)',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: verticalScale(28), 
  },

  quantityButtonText: {
    fontSize: normalizeFont(18),
    lineHeight: verticalScale(22),
    fontWeight: '800',
    color: 'rgba(76, 175, 80, 1)',
    textAlign: 'center',
  },

  /* ---------- rest unchanged ---------- */

  priceSection: {
    backgroundColor: '#fff',
    margin: moderateScale(8),
    marginTop: moderateScale(16),
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
  },
  priceSectionTitle: {
    fontSize: normalizeFont(12),
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
    fontSize: normalizeFont(12),
    color: 'rgba(66, 66, 66, 1)',
    fontWeight: '500',
  },
  discountValue: {
    fontSize: normalizeFont(12),
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
    fontSize: normalizeFont(12),
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: normalizeFont(12),
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
    fontSize: normalizeFont(12),
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centeredOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding:moderateScale(10),
  },
  centeredCouponModal: {
    width: '90%',
    maxHeight: '60%',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    padding: moderateScale(12),
    paddingHorizontal:moderateScale(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  modalContainer: {
    backgroundColor: 'transparent',
    paddingBottom: moderateScale(20),
  },
  modalHeaderRow: {
    padding: moderateScale(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  deliveryModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    maxHeight: '80%',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 202, 40, 1)',
  },
  dragHandle: {
    width: scale(40),
    height: scale(4),
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: moderateScale(8),
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
  text: {
    color: 'rgba(76, 175, 80, 1)',
    fontWeight: '600',
    fontSize: normalizeFont(13),
  },
  closeButton: {
    padding: moderateScale(4),
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
  vendorDetails: {
    flex: 1,
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
    borderRadius: moderateScale(10),
    alignItems: 'center',
    width: '60%',
  },
  proceedButtonText: {
    color: '#fff',
    fontWeight: '600',
    paddingVertical: moderateScale(4),
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
    borderRadius: moderateScale(16),
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

/* Modal styles (local for qty modal) */
const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(20),
  },
  modalWrap: {
    width: '100%',
    maxWidth: moderateScale(360),
    backgroundColor: "#fff",
    borderRadius: moderateScale(10),
    padding: moderateScale(16),
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(8),
    shadowOffset: { width: 0, height: moderateScale(4) },
  },
  modalTitle: {
    fontSize: normalizeFont(14),
    fontWeight: "700",
    color: "#222",
    marginBottom: moderateScale(12),
    textAlign: "center",
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(12),
    marginBottom: moderateScale(14),
  },
  pickerBtn: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  qtyInput: {
    flex: 1,
    minHeight: moderateScale(44),
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: moderateScale(8),
    textAlign: "center",
    fontSize: normalizeFont(16),
    paddingVertical: moderateScale(8),
  },
  modalActions: {
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: moderateScale(8),
  },
  cancelBtn: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(8),
    width: '40%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: moderateScale(1),
    borderColor: "rgba(76, 175, 80, 1)"
  },
  cancelText: {
    color: "#666",
    fontSize: normalizeFont(13),
  },
  okBtn: {
    backgroundColor: "rgba(76, 175, 80, 1)",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(8),
    width: '40%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  okText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: normalizeFont(13),
  },
});
