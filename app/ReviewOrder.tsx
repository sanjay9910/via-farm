// ReviewOrder.jsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation, useRouter } from 'expo-router';
import { goBack } from 'expo-router/build/global-state/routing';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SuggestionCard from '../components/myCard/RelatedProduct';
import { moderateScale, normalizeFont, scale } from './Responsive';

const API_BASE = 'https://viafarm-1.onrender.com';
const AUTO_CLEAR_SERVER_COUPON = true;

const ReviewOrder = () => {
  const router = useRouter();
  const navigation = useNavigation();

  // States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverPriceDetails, setServerPriceDetails] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [pincode, setPincode] = useState('110098');
  const slideAnim = useRef(new Animated.Value(300)).current;

  // Address states
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);

  // Donation
  const [wantDonation, setWantDonation] = useState(false);
  const [amount, setAmount] = useState('');

  // Comments (wired now)
  const [comments, setComments] = useState('');

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponFetching, setCouponFetching] = useState(false);

  // Track which cart item(s) are currently updating to prevent double requests
  const [updatingQuantities, setUpdatingQuantities] = useState({}); // { [cartItemId]: true }

  // ---- Effects ----
  useEffect(() => {
    fetchBuyerAddresses();
    fetchCartProducts();
    fetchCoupons();
  }, []);

  // Refresh addresses & cart when screen focused
  useEffect(() => {
    const sub = navigation.addListener && navigation.addListener('focus', () => {
      fetchBuyerAddresses();
      fetchCartProducts();
    });
    return sub;
  }, [navigation]);

  // --- API Calls ---

  const fetchBuyerAddresses = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setAddresses([]);
        setSelectedAddress(null);
        return;
      }

      const response = await axios.get(`${API_BASE}/api/buyer/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.success) {
        const fetchedAddresses = (response.data.addresses || []).map((addr) => ({
          id: addr.id || addr._id,
          name: addr.name || 'Buyer',
          pincode: addr.pinCode || addr.pincode || '000000',
          address: `${addr.houseNumber || ''} ${addr.locality || ''} ${addr.city || ''} ${addr.state || ''}`.replace(/\s+/g, ' ').trim(),
          isDefault: addr.isDefault || false,
          houseNumber: addr.houseNumber || '',
          locality: addr.locality || '',
          city: addr.city || '',
          district: addr.district || '',
        }));

        setAddresses(fetchedAddresses);
        const defaultAddr = fetchedAddresses.find((a) => a.isDefault) || fetchedAddresses[0];
        if (defaultAddr) {
          setSelectedAddress(defaultAddr);
          setPincode(defaultAddr.pincode);
        } else {
          setSelectedAddress(null);
        }
      } else {
        console.warn('No addresses or failed to fetch addresses', response?.data);
        setAddresses([]);
        setSelectedAddress(null);
      }
    } catch (error) {
      console.error('Error fetching buyer addresses:', error);
    }
  };

  const fetchCartProducts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setProducts([]);
        setServerPriceDetails(null);
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE}/api/buyer/checkout`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.success) {
        const cartItems = response.data.data?.items || [];
        const mappedProducts = cartItems.map((item) => ({
          id: item._id || item.id,
          productId: item.productId,
          name: item.name || 'Product',
          description: item.subtitle || item.variety || 'Fresh Product',
          price: Number(item.mrp || item.price || 0),
          quantity: item.quantity || 1,
          image: { uri: item.imageUrl || item.image || '' },
          deliveryDate: item.deliveryText || 'Delivered soon',
        }));

        setProducts(mappedProducts);
        const priceDetails = response.data.data?.priceDetails ?? null;
        if (priceDetails) {
          setServerPriceDetails({
            totalMRP: Number(priceDetails.totalMRP ?? 0),
            couponDiscount: Number(priceDetails.couponDiscount ?? 0),
            deliveryCharge: Number(priceDetails.deliveryCharge ?? 0),
            totalAmount: Number(priceDetails.totalAmount ?? 0),
          });
        } else {
          setServerPriceDetails(null);
        }

        const applied = response.data.data?.appliedCoupon ?? response.data.data?.coupon ?? null;
        if (applied) {
          if (AUTO_CLEAR_SERVER_COUPON) {
            try {
              await axios.delete(`${API_BASE}/api/buyer/cart/remove-coupon`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000,
              });
              // refresh cart after clearing coupon
              await fetchCartProducts();
              setAppliedCoupon(null);
              setCouponCode('');
            } catch (clearErr) {
              console.warn('Failed to auto-clear server coupon on load:', clearErr?.response?.data || clearErr.message || clearErr);
              setAppliedCoupon(null);
              setCouponCode('');
            }
          } else {
            setAppliedCoupon(null);
            setCouponCode('');
          }
        } else {
          setAppliedCoupon(null);
          setCouponCode('');
        }
      } else {
        console.warn('Failed to load cart: ', response?.data);
      }
    } catch (error) {
      console.error('Error fetching cart products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    setCouponFetching(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      // endpoint given by user: api/buyer/coupons/highlighted
      const res = await axios.get(`${API_BASE}/api/buyer/coupons/highlighted`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res?.data?.success) {
        setAvailableCoupons(res.data.data || []);
      } else {
        console.warn('Failed fetch coupons:', res?.data);
      }
    } catch (err) {
      console.warn('Error fetching coupons:', err?.message || err);
    } finally {
      setCouponFetching(false);
    }
  };

  // --- Helpers for local/optimistic calculations ---
  const computeLocalSubtotal = () => {
    return products.reduce((sum, p) => sum + (Number(p.price) || 0) * (p.quantity || 0), 0);
  };

  // compute preview discount for given coupon and subtotal
  const computeDiscountForCoupon = (coupon, subtotal) => {
    if (!coupon) return 0;
    const d = coupon.discount || {};
    const value = d.value ?? (d.amount ?? 0);
    if ((d.type || '').toLowerCase() === 'percentage') {
      return Number(((subtotal * (Number(value) || 0)) / 100).toFixed(2));
    } else {
      return Number(Number(value || 0).toFixed(2));
    }
  };

  // combine serverPriceDetails (if present) with optimistic coupon details
  const previewPriceWithCoupon = (coupon) => {
    const subtotal = serverPriceDetails?.totalMRP ?? computeLocalSubtotal();
    const deliveryCharge = serverPriceDetails?.deliveryCharge ?? 0;
    const discount = computeDiscountForCoupon(coupon, subtotal);
    const total = Math.max(0, subtotal - discount + deliveryCharge);
    return {
      subtotal,
      couponDiscount: discount,
      deliveryCharge,
      totalAmount: total,
    };
  };

  // --- Coupon flow (select from dropdown -> shows preview -> apply) ---
  const onSelectCouponFromList = (coupon) => {
    if (!coupon) return;
    const local = {
      id: coupon._id,
      code: coupon.code,
      discount: coupon.discount,
      minimumOrder: coupon.minimumOrder,
      startDate: coupon.startDate,
      expiryDate: coupon.expiryDate,
    };
    setCouponCode(local.code);
    setAppliedCoupon({ ...local, previewDiscount: computeDiscountForCoupon(local, serverPriceDetails?.totalMRP ?? computeLocalSubtotal()) });
    setCouponModalVisible(false);
  };

  const applyCoupon = async () => {
    if (!couponCode || couponCode.trim().length === 0) {
      Alert.alert('Invalid', 'Please enter/select a coupon code');
      return;
    }

    setApplyingCoupon(true);
    const code = couponCode.trim().toUpperCase();

    // optimistic preview if we found the coupon locally
    const matched = availableCoupons.find((c) => String(c.code || '').toUpperCase() === code.toUpperCase());
    const prevServerPrice = serverPriceDetails ? { ...serverPriceDetails } : null;

    if (matched) {
      const preview = previewPriceWithCoupon({
        _id: matched._id,
        code: matched.code,
        discount: matched.discount,
      });
      setServerPriceDetails(preview);
      setAppliedCoupon({ code: matched.code, id: matched._id, discountRaw: matched.discount, previewDiscount: preview.couponDiscount });
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Please login to apply coupon');
        setApplyingCoupon(false);
        return;
      }

      const endpoints = [
        { url: `${API_BASE}/api/buyer/cart/apply-coupon`, body: { couponCode: code } },
        { url: `${API_BASE}/api/buyer/cart/apply-coupon`, body: { coupon: code } },
        { url: `${API_BASE}/api/buyer/cart/applyCoupon`, body: { couponCode: code } },
        { url: `${API_BASE}/api/buyer/cart/apply`, body: { couponCode: code } },
        { url: `${API_BASE}/api/buyer/cart/update-coupon`, body: { couponCode: code } },
      ];

      let appliedOnServer = false;
      for (let i = 0; i < endpoints.length; i++) {
        try {
          const res = await axios.post(endpoints[i].url, endpoints[i].body, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 12000,
          });

          if (res?.data?.success) {
            const pd = res.data.data?.priceDetails ?? res.data.data ?? res.data;
            if (pd) {
              setServerPriceDetails({
                totalMRP: Number(pd.totalMRP ?? pd.subtotal ?? 0),
                couponDiscount: Number(pd.couponDiscount ?? pd.discountAmount ?? 0),
                deliveryCharge: Number(pd.deliveryCharge ?? 0),
                totalAmount: Number(pd.totalAmount ?? pd.total ?? 0),
              });
            } else {
              await fetchCartProducts();
            }
            appliedOnServer = true;
            setAppliedCoupon((prev) => ({ ...(prev || {}), code, serverApplied: true, previewDiscount: Number((res.data.data?.discountAmount ?? res.data.discountAmount ?? 0)) }));
            Alert.alert('Success', res.data.message || 'Coupon applied');
            break;
          } else {
            const msg = res.data?.message || 'Coupon not applied';
            if (/invalid|required|not valid/i.test(String(msg))) {
              if (!appliedOnServer && prevServerPrice) setServerPriceDetails(prevServerPrice);
              setAppliedCoupon(null);
              setCouponCode('');
              Alert.alert('Coupon Error', msg);
              setApplyingCoupon(false);
              return;
            }
          }
        } catch (err) {
          const serverMsg = err?.response?.data?.message;
          if (serverMsg && /invalid|required|not valid/i.test(serverMsg)) {
            if (!appliedOnServer && prevServerPrice) setServerPriceDetails(prevServerPrice);
            setAppliedCoupon(null);
            setCouponCode('');
            Alert.alert('Coupon Error', serverMsg);
            setApplyingCoupon(false);
            return;
          }
          // otherwise try next endpoint
        }
      }

      if (!appliedOnServer) {
        // Dry-run order validation
        try {
          if (!selectedAddress?.id) {
            if (!appliedOnServer && prevServerPrice) setServerPriceDetails(prevServerPrice);
            Alert.alert('Coupon Error', 'Select an address to validate coupon.');
            setApplyingCoupon(false);
            return;
          }

          const validatePayload = {
            deliveryType: 'Delivery',
            addressId: selectedAddress.id,
            paymentMethod: 'UPI',
            comments: comments || "I'll pick it up before noon",
            couponCode: code,
            validateOnly: true,
          };

          const resOrder = await axios.post(`${API_BASE}/api/buyer/orders/place`, validatePayload, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000,
          });

          if (resOrder?.data?.success) {
            const pd = resOrder.data.data?.priceDetails ?? resOrder.data.data ?? resOrder.data;
            if (pd) {
              setServerPriceDetails({
                totalMRP: Number(pd.totalMRP ?? pd.subtotal ?? 0),
                couponDiscount: Number(pd.couponDiscount ?? pd.discountAmount ?? 0),
                deliveryCharge: Number(pd.deliveryCharge ?? 0),
                totalAmount: Number(pd.totalAmount ?? pd.total ?? 0),
              });
            } else {
              await fetchCartProducts();
            }
            setAppliedCoupon({ code, serverApplied: true, previewDiscount: Number(resOrder.data.data?.discountAmount ?? resOrder.data.totalDiscount ?? 0) });
            Alert.alert('Success', resOrder.data.message || 'Coupon validated');
          } else {
            const message = resOrder?.data?.message || 'Coupon could not be validated';
            if (!appliedOnServer && prevServerPrice) setServerPriceDetails(prevServerPrice);
            setAppliedCoupon(null);
            setCouponCode('');
            Alert.alert('Coupon Error', message);
          }
        } catch (errOrders) {
          if (!appliedOnServer && prevServerPrice) setServerPriceDetails(prevServerPrice);
          const serverMsg = errOrders?.response?.data?.message || errOrders?.message || 'Coupon validation failed';
          Alert.alert('Coupon Error', serverMsg);
        }
      }
    } catch (fatal) {
      console.error('Unexpected error applying coupon:', fatal);
      Alert.alert('Error', (fatal?.response?.data?.message) || fatal?.message || 'Failed to apply coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = async () => {
    setApplyingCoupon(true);
    const prev = serverPriceDetails ? { ...serverPriceDetails } : null;
    setAppliedCoupon(null);
    setCouponCode('');
    if (prev) {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          setApplyingCoupon(false);
          await fetchCartProducts();
          return;
        }
        const res = await axios.delete(`${API_BASE}/api/buyer/cart/remove-coupon`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        if (res?.data?.success) {
          await fetchCartProducts();
          Alert.alert('Removed', 'Coupon removed');
        } else {
          await fetchCartProducts();
        }
      } catch (err) {
        console.warn('remove-coupon error:', err?.message || err);
        await fetchCartProducts();
      } finally {
        setApplyingCoupon(false);
      }
    } else {
      setApplyingCoupon(false);
      await fetchCartProducts();
    }
  };

  // --- Quantity (optimistic, NO full refresh) ---

  /**
   * updateQuantityInAPI
   * - optimistic UI already updated by caller
   * - this function not do full fetch on success; only update serverPriceDetails if returned
   * - on error, roll back the product's quantity and show alert
   */
  const updateQuantityInAPI = async (cartItemId, newQuantity) => {
    // prevent multiple concurrent updates for same item
    if (!cartItemId) return;
    if (updatingQuantities[cartItemId]) return;

    setUpdatingQuantities((prev) => ({ ...prev, [cartItemId]: true }));

    // capture previous quantity so we can rollback if needed
    const prevProducts = products;
    const prevItem = prevProducts.find((p) => p.id === cartItemId);
    const prevQuantity = prevItem ? prevItem.quantity : null;

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Login required');
      }

      const response = await axios.put(
        `${API_BASE}/api/buyer/cart/${cartItemId}/quantity`,
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
      );

      if (response?.data && response.data.success) {
        // If server returns price details, update them; otherwise leave client-side totals intact
        const pd = response.data.data?.priceDetails ?? response.data.priceDetails ?? response.data.data ?? null;
        if (pd) {
          setServerPriceDetails({
            totalMRP: Number(pd.totalMRP ?? pd.subtotal ?? computeLocalSubtotal()),
            couponDiscount: Number(pd.couponDiscount ?? pd.discountAmount ?? 0),
            deliveryCharge: Number(pd.deliveryCharge ?? 0),
            totalAmount: Number(pd.totalAmount ?? pd.total ?? (computeLocalSubtotal() - (pd.couponDiscount ?? 0) + (pd.deliveryCharge ?? 0))),
          });
        }
        // no full fetch to avoid page refresh/scroll jump
      } else {
        // server responded with failure -> rollback
        setProducts((prev) => prev.map((p) => (p.id === cartItemId ? { ...p, quantity: prevQuantity } : p)));
        const errMsg = (response?.data?.message) || 'Failed to update quantity';
        Alert.alert('Update Failed', errMsg);
      }
    } catch (err) {
      console.error('Error updating quantity:', err?.response?.data || err.message || err);
      // rollback UI
      if (prevQuantity !== null) {
        setProducts((prev) => prev.map((p) => (p.id === cartItemId ? { ...p, quantity: prevQuantity } : p)));
      }
      // show friendly error
      const message = err?.response?.data?.message || err.message || 'Failed to update quantity';
      Alert.alert('Error', message);
    } finally {
      setUpdatingQuantities((prev) => {
        const copy = { ...prev };
        delete copy[cartItemId];
        return copy;
      });
    }
  };

  const increaseQuantity = (id) => {
    // block if already updating this item
    if (updatingQuantities[id]) return;

    const product = products.find(p => p.id === id);
    if (!product) return;
    const newQuantity = (product.quantity || 0) + 1;

    // Optimistic UI update
    setProducts((prev) => prev.map(p => p.id === id ? { ...p, quantity: newQuantity } : p));

    // Fire API but do NOT re-fetch whole cart on success to avoid page refresh
    updateQuantityInAPI(id, newQuantity);
  };

  const decreaseQuantity = (id) => {
    if (updatingQuantities[id]) return;

    const product = products.find(p => p.id === id);
    if (!product) return;
    if (product.quantity <= 1) return; // do not allow below 1

    const newQuantity = product.quantity - 1;
    setProducts((prev) => prev.map(p => p.id === id ? { ...p, quantity: newQuantity } : p));

    updateQuantityInAPI(id, newQuantity);
  };

  // --- Remove product (optimistic) ---
  const removeProduct = async (id) => {
    const prev = [...products];
    setProducts(prev.filter(p => p.id !== id));
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.delete(`${API_BASE}/api/buyer/cart/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data && response.data.success) {
        // update server totals if present
        const pd = response.data.data?.priceDetails ?? response.data.priceDetails ?? response.data.data ?? null;
        if (pd) {
          setServerPriceDetails({
            totalMRP: Number(pd.totalMRP ?? pd.subtotal ?? computeLocalSubtotal()),
            couponDiscount: Number(pd.couponDiscount ?? pd.discountAmount ?? 0),
            deliveryCharge: Number(pd.deliveryCharge ?? 0),
            totalAmount: Number(pd.totalAmount ?? pd.total ?? 0),
          });
        } else {
          // best-effort: don't force full refresh to keep UI smooth
          // but if cart becomes empty we should reflect that
          if (prev.length === 1) {
            setServerPriceDetails(null);
            setProducts([]);
          }
        }
        Alert.alert('Success', 'Item removed');
      } else {
        setProducts(prev);
        Alert.alert('Error', response.data?.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing product:', error);
      setProducts(prev);
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  // --- Address selection (optimistic save) ---
  const handleAddressSelect = async (addr) => {
    try {
      if (!addr || !addr.id) return;
      setSelectedAddress(addr);
      setPincode(addr.pincode);
      closeModal();

      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      setSavingAddress(true);
      const body = { addressId: addr.id };
      const res = await axios.post(`${API_BASE}/api/buyer/delivery/address`, body, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });

      if (res && res.data && res.data.success) {
        await fetchCartProducts();
        await fetchBuyerAddresses();
      } else {
        console.warn('delivery/address response not success:', res?.data);
        await fetchCartProducts();
        if (res?.data && !res.data.success && res?.data.message) {
          Alert.alert('Address', res.data.message);
        }
      }
    } catch (err) {
      console.error('Error saving delivery address:', err?.response?.data || err.message || err);
      await fetchBuyerAddresses();
      await fetchCartProducts();
      Alert.alert('Error', 'Failed to save delivery address. Try again.');
    } finally {
      setSavingAddress(false);
    }
  };

  // Delete address (optimistic)
  const deleteAddress = async (address) => {
    if (!address?.id) return;
    const prev = [...addresses];
    setAddresses(prev.filter(a => a.id !== address.id));
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await axios.delete(`${API_BASE}/api/buyer/addresses/${address.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res?.data?.success) {
        if (selectedAddress?.id === address.id) {
          setSelectedAddress(null);
        }
        await fetchBuyerAddresses();
      } else {
        setAddresses(prev);
        Alert.alert('Error', res?.data?.message || 'Failed to delete address');
      }
    } catch (err) {
      console.error('Failed delete address:', err);
      setAddresses(prev);
      Alert.alert('Error', 'Failed to delete address');
      await fetchBuyerAddresses();
    }
  };

  const MoveToNewAddress = () => {
    setModalVisible(false);
    navigation.navigate('AddNewAddress');
  };

  // Proceed to payment
  const handleProceedToPayment = () => {
    if (!selectedAddress) {
      Alert.alert('Address Missing', 'Please select a delivery address');
      return;
    }
    if (products.length === 0) {
      Alert.alert('Cart Empty', 'Please add items first');
      return;
    }
    const totals = computeTotals();
    const totalItems = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const amountToPay = totals.totalAmount;

    navigation.navigate('Payment', {
      addressId: selectedAddress.id,
      deliveryType: 'Delivery',
      comments: comments || 'Deliver before 8 PM please',
      paymentMethod: 'UPI',
      totalAmount: Number(amountToPay.toFixed(2)),
      totalItems: totalItems.toString(),
    });
  };
  const computeTotals = () => {
    const subtotal = products.reduce((sum, p) => sum + (Number(p.price) || 0) * (p.quantity || 0), 0);
    if (serverPriceDetails && serverPriceDetails.totalAmount !== undefined && serverPriceDetails.totalAmount !== null) {
      const serverSubtotal = Number(serverPriceDetails.totalMRP ?? subtotal);
      const serverDelivery = Number(serverPriceDetails.deliveryCharge ?? 0);
      const serverTotal = Number(serverPriceDetails.totalAmount ?? (serverSubtotal + serverDelivery));
      const couponDiscount = appliedCoupon ? Number(appliedCoupon.previewDiscount || 0) : Number(serverPriceDetails.couponDiscount || 0);
      const adjustedTotal = Math.max(0, serverTotal - (couponDiscount || 0));

      return {
        subtotal: Number(serverSubtotal.toFixed(2)),
        couponDiscount: Number(couponDiscount.toFixed(2)),
        deliveryCharge: Number(serverDelivery.toFixed(2)),
        totalAmount: Number(adjustedTotal.toFixed(2)),
        usedServer: true,
      };
    }

    if (appliedCoupon && (appliedCoupon.previewDiscount || appliedCoupon.previewDiscount === 0)) {
      const deliveryChargeFallback = 0;
      const couponDiscount = Number(appliedCoupon.previewDiscount || 0);
      const total = Math.max(0, subtotal - couponDiscount + deliveryChargeFallback);
      return {
        subtotal: Number(subtotal.toFixed(2)),
        couponDiscount: Number(couponDiscount.toFixed(2)),
        deliveryCharge: Number(deliveryChargeFallback.toFixed(2)),
        totalAmount: Number(total.toFixed(2)),
        usedServer: false,
      };
    }

    const couponDiscount = 0;
    const deliveryChargeFallback = 0;
    const total = subtotal - couponDiscount + deliveryChargeFallback;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      couponDiscount: Number(couponDiscount.toFixed(2)),
      deliveryCharge: Number(deliveryChargeFallback.toFixed(2)),
      totalAmount: Number(total.toFixed(2)),
      usedServer: false,
    };
  };

  // Modal handlers
  const openModal = () => {
    setModalVisible(true);
    Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  };
  const closeModal = () => {
    Animated.timing(slideAnim, { toValue: 300, duration: 300, useNativeDriver: true }).start(() => setModalVisible(false));
  };
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) slideAnim.setValue(gestureState.dy);
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 100) closeModal();
      else Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
    },
  });

  // Product card
  const ProductCard = ({ product }) => {
    const updating = !!updatingQuantities[product.id];
    return (
      <View style={styles.productCard}>
        <View style={styles.mainContainer}>
          <TouchableOpacity
            onPress={() => {
              const pid = product?._id || product?.id;
              if (!pid) {
                Alert.alert('Error', 'Product id missing');
                return;
              }
              navigation.navigate('ViewProduct', { productId: pid, product });
            }}
          >
            <Image source={product.image} style={styles.productImage} resizeMode="stretch" />
          </TouchableOpacity>
          <View style={styles.productDetails}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDescription}>{product.description}</Text>
            <Text style={styles.productPrice}>MRP ₹{Number(product.price).toFixed(2)}</Text>

            <TouchableOpacity style={styles.deleteBtn} onPress={() => removeProduct(product.id)}>
              <Image source={require('../assets/via-farm-img/icons/deleteBtn.png')} />
            </TouchableOpacity>

            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => decreaseQuantity(product.id)}
                disabled={updating}
              >
                <Text style={styles.quantityText}>-</Text>
              </TouchableOpacity>

              <View style={{ justifyContent: 'center', alignItems: 'center', minWidth: 40 }}>
                {updating ? <ActivityIndicator size="small" /> : <Text style={styles.quantityNumber}>{product.quantity}</Text>}
              </View>

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => increaseQuantity(product.id)}
                disabled={updating}
              >
                <Text style={styles.quantityText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.deliveryRow}>
              <Text style={styles.deliveryText}>{product.deliveryDate}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );

  if (products.length === 0)
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <TouchableOpacity style={styles.shopButton} onPress={() => navigation.goBack()}>
          <Text style={styles.shopButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    );

  const totalsForRender = computeTotals();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Image source={require('../assets/via-farm-img/icons/groupArrow.png')} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Review Order</Text>
        <Text />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Deliver to Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deliver to</Text>
          <View style={styles.addressContainer}>
            <View style={styles.location}>
              <Image source={require('../assets/via-farm-img/icons/loca.png')} />
              <Text style={styles.addressText}>
                {selectedAddress ? `${selectedAddress.name}, ${selectedAddress.pincode || selectedAddress.pincode}` : 'Select delivery address'}
              </Text>
            </View>
            <TouchableOpacity onPress={openModal}>
              <Text style={styles.changeText}>Change ?</Text>
            </TouchableOpacity>
          </View>
        </View>

        {products.length > 0 && <Text style={styles.deliveryDate}>{products[0].deliveryDate || 'Delivered soon'}</Text>}

        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}

        {/* Donation */}
        <View style={styles.donationContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: normalizeFont(13), color: '#333', flex: 1 }}>Do you want to donate?</Text>

            <TouchableOpacity
              onPress={() => setWantDonation(!wantDonation)}
              style={{
                width: scale(24),
                height: scale(24),
                borderRadius: moderateScale(12),
                borderWidth: 2,
                borderColor: wantDonation ? '#4CAF50' : '#999',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {wantDonation && <View style={{ width: scale(12), height: scale(12), borderRadius: moderateScale(6), backgroundColor: '#4CAF50' }} />}
            </TouchableOpacity>
          </View>

          {wantDonation && (
            <View style={{ marginTop: moderateScale(12) }}>
              <Text style={{ fontSize: normalizeFont(12), color: '#555', marginBottom: moderateScale(4) }}>Enter donation amount</Text>
              <TextInput
                placeholder="Enter amount (₹)"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: moderateScale(8),
                  paddingHorizontal: moderateScale(10),
                  paddingVertical: moderateScale(8),
                  fontSize: normalizeFont(16),
                  color: '#333',
                }}
              />
            </View>
          )}
        </View>

        {/* Coupon Dropdown + Input */}
        <View style={styles.couponContainer}>
          <View style={styles.couponSection}>
            <Image source={require('../assets/via-farm-img/icons/promo-code.png')} />
            <View style={{ flex: 1 }}>
              <Text style={styles.couponTitle}>Have a Coupon?</Text>
              <Text style={styles.couponSubtitle}>Apply now and Save Extra!</Text>
            </View>
            <TouchableOpacity style={{ padding: 8 }} onPress={() => setCouponModalVisible(true)}>
              <Text style={{ color: '#007AFF', fontWeight: '600' }}>View Coupons</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.couponInputContainer}>
            <TextInput
              style={styles.couponInput}
              placeholder="Enter your coupon code"
              placeholderTextColor="#999"
              value={couponCode}
              onChangeText={(t) => {
                setCouponCode(t.toUpperCase());
                const matched = availableCoupons.find((c) => String(c.code || '').toUpperCase() === String(t).toUpperCase());
                if (matched) {
                  const previewDiscount = computeDiscountForCoupon(matched, serverPriceDetails?.totalMRP ?? computeLocalSubtotal());
                  setAppliedCoupon({ code: matched.code, id: matched._id, discountRaw: matched.discount, previewDiscount });
                } else {
                  if (!appliedCoupon?.serverApplied) setAppliedCoupon(null);
                }
              }}
              autoCapitalize="characters"
            />

            {!appliedCoupon ? (
              <TouchableOpacity style={styles.Button} onPress={applyCoupon} disabled={applyingCoupon}>
                {applyingCoupon ? <ActivityIndicator /> : <Text style={{ color: '#fff', fontSize: normalizeFont(12) }}>Apply</Text>}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.Button} onPress={removeCoupon} disabled={applyingCoupon}>
                {applyingCoupon ? <ActivityIndicator /> : <Text style={{ color: '#fff' }}>Remove</Text>}
              </TouchableOpacity>
            )}
          </View>

          {appliedCoupon && (
            <View style={styles.appliedCouponRow}>
              <Text style={styles.appliedCouponText}>
                Applied: {appliedCoupon.code} {appliedCoupon.previewDiscount ? `- ₹${Number(appliedCoupon.previewDiscount).toFixed(2)}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Coupons modal (centered, attractive) */}
        <Modal visible={couponModalVisible} transparent animationType="fade" onRequestClose={() => setCouponModalVisible(false)}>
          <View style={styles.centeredOverlay}>
            <Pressable style={styles.modalBackground} onPress={() => setCouponModalVisible(false)} />
            <View style={styles.centeredCouponModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose a Coupon</Text>
                <TouchableOpacity onPress={() => setCouponModalVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={{ paddingHorizontal: moderateScale(16), paddingBottom: moderateScale(16), paddingTop: moderateScale(8) }}>
                {couponFetching ? (
                  <ActivityIndicator />
                ) : (
                  <FlatList
                    data={availableCoupons}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => {
                      const subtotal = serverPriceDetails?.totalMRP ?? computeLocalSubtotal();
                      const discountValue = computeDiscountForCoupon(item, subtotal);
                      return (
                        <TouchableOpacity style={styles.couponItem} onPress={() => onSelectCouponFromList(item)}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: '700' }}>{item.code}</Text>
                            <Text style={{ color: '#666' }}>{item.appliesTo?.join?.(', ') || 'All Products'}</Text>
                            <Text style={{ color: '#666', marginTop: 6 }}>
                              {item.discount?.type === 'Percentage' ? `${item.discount.value}% off` : `₹${item.discount.value} off`} • Min ₹{item.minimumOrder || 0}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontWeight: '700' }}>Save</Text>
                            <Text style={{ color: '#333', marginTop:moderateScale(6) }}>₹{discountValue.toFixed(2)}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#666' }}>No coupons</Text>}
                    ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                  />
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* Price details */}
        <View style={styles.priceSection}>
          <Text style={styles.priceTitle}>Price Details</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total MRP</Text>
            <Text style={styles.priceValue}>₹{totalsForRender.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Coupon Discount</Text>
            <Text style={styles.priceValue}>₹{(-totalsForRender.couponDiscount).toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Charge</Text>
            <Text style={styles.priceValue}>₹{totalsForRender.deliveryCharge.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{totalsForRender.totalAmount.toFixed(2)}</Text>
          </View>
          {totalsForRender.usedServer && <Text style={{ fontSize: normalizeFont(10), color: '#666', marginTop: moderateScale(6) }}>Using server-calculated charges</Text>}
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments</Text>
          <TextInput
            style={styles.commentsInput}
            placeholder="Instructions / Comments for the vendor"
            placeholderTextColor="#999"
            multiline
            value={comments}
            onChangeText={setComments}
          />
        </View>

        <SuggestionCard />
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Card */}
      <View style={styles.bottomPaymentCard}>
        <View style={styles.paymentLeft}>
          <Text style={styles.totalPrice}>₹{totalsForRender.totalAmount.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.proceedButton} onPress={handleProceedToPayment}>
          <Image source={require('../assets/via-farm-img/icons/UpArrow.png')} />
          <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
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
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.addressList} showsVerticalScrollIndicator={false}>
              {addresses.map((address) => (
                <TouchableOpacity
                  key={address.id}
                  style={[styles.addressItem, selectedAddress?.id === address.id && styles.selectedAddressItem]}
                  onPress={() => handleAddressSelect(address)}
                >
                  <View style={styles.radioContainer}>
                    <View style={[styles.radioOuter, selectedAddress?.id === address.id && styles.radioOuterSelected]}>
                      {selectedAddress?.id === address.id && <View style={styles.radioInner} />}
                    </View>
                  </View>
                  <View style={styles.addressDetails}>
                    <Text style={styles.addressName}>
                      {address.name}, {address.pincode}
                    </Text>
                    <Text style={styles.addressText}>{address.address}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(10) }}>
                    <TouchableOpacity
                      onPress={() => {
                        closeModal();
                        setTimeout(() => {
                          navigation.navigate('aditAddress', {
                            address: {
                              id: address.id,
                              pincode: address.pincode,
                              houseNumber: address.houseNumber || '',
                              locality: address.locality || '',
                              city: address.city || '',
                              district: address.district || '',
                              isDefault: address.isDefault || false,
                              name: address.name || 'Buyer',
                            },
                          });
                        }, 300);
                      }}
                    >
                      <Image source={require('../assets/via-farm-img/icons/editicon.png')} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={async () => {
                        await deleteAddress(address);
                      }}
                    >
                      <Image source={require('../assets/via-farm-img/icons/deleteBtn.png')} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

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

export default ReviewOrder;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(30),
  },
  mainContainer: {
    flexDirection: 'row',
    gap: scale(12),
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: normalizeFont(16),
    color: '#666',
    marginBottom: moderateScale(12),
  },
  shopButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  productImage: {
    width: scale(155),
    height: scale(128),
    borderRadius: 8,
  },
  productDetails: {
    flex: 1,
  },
  deleteBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    padding: moderateScale(5),
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  headerText: {
    fontSize: normalizeFont(13),
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: moderateScale(10),
  },
  scrollContent: {
    paddingBottom: moderateScale(120),
  },
  bottomSpacer: {
    height: scale(20),
  },
  section: {
    marginBottom: moderateScale(15),
  },
  sectionTitle: {
    fontSize: normalizeFont(14),
    fontWeight: '600',
    marginBottom: moderateScale(8),
    color: '#000',
  },
  addressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  addressText: {
    fontSize: normalizeFont(11),
    color: '#333',
  },
  changeText: {
    fontSize: normalizeFont(12),
    color: '#007AFF',
    fontWeight: '500',
  },
  deliveryDate: {
    fontSize: normalizeFont(12),
    color: 'rgba(66, 66, 66, 1)',
    marginBottom: moderateScale(15),
    marginTop: moderateScale(5),
  },
  productCard: {
    backgroundColor: '#f8f8f8',
    padding: moderateScale(8),
    borderRadius: 8,
    marginBottom: moderateScale(15),
  },
  productName: {
    fontSize: normalizeFont(13),
    fontWeight: '600',
    color: '#000',
  },
  productDescription: {
    fontSize: normalizeFont(12),
    color: '#666',
    marginTop: moderateScale(2),
  },
  productPrice: {
    fontSize: normalizeFont(12),
    fontWeight: '600',
    color: '#000',
    marginTop: moderateScale(4),
  },
  deliveryRow: {
    flexDirection: 'row',
    fontSize: normalizeFont(10),
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: moderateScale(2),
  },
  deliveryText: {
    fontSize: normalizeFont(10),
    color: '#666',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 5,
    bottom: 0,
    position: 'absolute',
    marginTop: moderateScale(60),
    borderWidth: 1,
    borderColor: '#000',
    paddingHorizontal: moderateScale(4),
    paddingVertical: moderateScale(4),
  },
  quantityButton: {
    paddingHorizontal: 8,
  },
  quantityText: {
    fontSize: normalizeFont(13),
    fontWeight: '600',
    color: '#000',
  },
  quantityNumber: {
    fontSize: normalizeFont(12),
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  couponContainer: {
    marginTop: moderateScale(10),
    marginBottom: moderateScale(10),
  },
  couponSection: {
    marginTop: moderateScale(15),
    marginBottom: moderateScale(10),
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  couponTitle: {
    fontSize: normalizeFont(12),
    fontWeight: '600',
    color: 'rgba(1, 151, 218, 1)',
  },
  couponSubtitle: {
    fontSize: normalizeFont(12),
    color: 'rgba(1, 151, 218, 1)',
    marginTop: 2,
  },
  couponInputContainer: {
    marginBottom: moderateScale(15),
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
  },
  couponInput: {
    borderWidth: scale(2),
    borderColor: 'rgba(1, 151, 218, 1)',
    borderRadius: 8,
    padding: moderateScale(12),
    fontSize: moderateScale(11),
    width: '80%',
  },
  Button: {
    backgroundColor: '#28a745',
    padding: moderateScale(14),
    borderRadius: 10,
  },
  appliedCouponRow: {
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(8),
  },
  appliedCouponText: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  donationContainer: {
    marginVertical: moderateScale(16),
    padding: moderateScale(12),
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: moderateScale(10),
    backgroundColor: '#fff',
  },
  priceSection: {
    backgroundColor: '#F8F8F8',
    padding: moderateScale(15),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(20),
  },
  priceTitle: {
    fontSize: normalizeFont(12),
    fontWeight: '600',
    color: '#000',
    marginBottom: moderateScale(12),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  priceLabel: {
    fontSize: normalizeFont(12),
    color: '#666',
  },
  priceValue: {
    fontSize: normalizeFont(12),
    color: '#000',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: moderateScale(8),
    paddingTop: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  totalLabel: {
    fontSize: normalizeFont(12),
    fontWeight: '600',
    color: '#000',
  },
  totalValue: {
    fontSize: normalizeFont(12),
    fontWeight: '600',
    color: '#000',
  },
  commentsSection: {
    marginBottom: moderateScale(20),
  },
  commentsTitle: {
    fontSize: normalizeFont(12),
    fontWeight: '600',
    color: '#000',
    marginBottom: moderateScale(10),
  },
  commentsInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    fontSize: normalizeFont(12),
    height: scale(80),
    textAlignVertical: 'top',
  },
  bottomPaymentCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(15),
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
  totalPrice: {
    fontSize: normalizeFont(15),
    fontWeight: '700',
    color: '#000',
  },
  proceedButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(13),
    borderRadius: moderateScale(8),
    minWidth: scale(180),
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: normalizeFont(12),
    fontWeight: '600',
  },
  // Modal styles
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
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    maxHeight: '100%',
    borderWidth: 2,
    borderColor: 'rgba(255, 202, 40, 1)',
  },
  dragHandle: {
    width: scale(40),
    height: scale(4),
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: moderateScale(8),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: normalizeFont(15),
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: moderateScale(4),
  },
  addressList: {
    maxHeight: scale(300),
    paddingHorizontal: moderateScale(20),
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: moderateScale(15),
    borderBottomWidth: 1,
    borderWidth: 2,
    padding: moderateScale(10),
    borderColor: 'rgba(0, 0, 0, 0.2)',
    marginBottom: moderateScale(15),
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  selectedAddressItem: {
    backgroundColor: '#fff',
  },
  radioContainer: {
    marginRight: moderateScale(12),
    marginTop: 2,
  },
  radioOuter: {
    width: scale(20),
    height: scale(20),
    borderRadius: moderateScale(10),
    borderWidth: scale(2),
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
  addressDetails: {
    flex: 1,
  },
  addressName: {
    fontSize: normalizeFont(12),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(4),
  },
  addressText: {
    fontSize: normalizeFont(12),
    color: '#666',
    lineHeight: scale(20),
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(15),
  },
  NewAddress: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    flexDirection: 'row',
    padding: moderateScale(10),
    borderRadius: moderateScale(10),
  },
  addAddressButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: normalizeFont(12),
    marginLeft: moderateScale(8),
  },

  // coupon modal centered styles
  centeredOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredCouponModal: {
    width: '90%',
    maxHeight: '70%',
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
  couponItem: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponModal: {
    marginHorizontal: moderateScale(20),
    marginTop: moderateScale(80),
    borderRadius: moderateScale(12),
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
});
