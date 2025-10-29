import SuggestionCard from '@/components/myCard/SuggestionCard'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { useNavigation, useRouter } from 'expo-router'
import { goBack } from 'expo-router/build/global-state/routing'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
import { SafeAreaView } from 'react-native-safe-area-context'

const API_BASE = 'https://393rb0pp-5000.inc1.devtunnels.ms';

const ReviewOrder = () => {
  const router = useRouter();
  const navigation = useNavigation();

  // States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // IMPORTANT: deliveryCharge will come from serverPriceDetails if available
  const [serverPriceDetails, setServerPriceDetails] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [pincode, setPincode] = useState('110098');
  const slideAnim = useState(new Animated.Value(300))[0];

  // Address states
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code: '', discount: 0 }

  // Fetch addresses from API
  useEffect(() => {
    fetchBuyerAddresses();
  }, []);

  const fetchBuyerAddresses = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Please login to view addresses');
        return;
      }

      const response = await axios.get(`${API_BASE}/api/buyer/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const fetchedAddresses = response.data.addresses.map((addr) => ({
          id: addr.id || addr._id,
          name: addr.name || 'Buyer',
          pincode: addr.pinCode || addr.pincode || '000000',
          address: `${addr.houseNumber || ''}, ${addr.locality || ''}, ${addr.city || ''}, ${addr.state || ''}`,
          isDefault: addr.isDefault || false,
        }));

        setAddresses(fetchedAddresses);
        const defaultAddr = fetchedAddresses.find((a) => a.isDefault) || fetchedAddresses[0];
        if (defaultAddr) setSelectedAddress(defaultAddr);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to load addresses');
      }
    } catch (error) {
      console.error('Error fetching buyer addresses:', error);
      Alert.alert('Error', 'Failed to load addresses');
    }
  };

  // Fetch products from API (and server price details)
  useEffect(() => {
    fetchCartProducts();
  }, []);

  const fetchCartProducts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Please login to view cart');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE}/api/buyer/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const cartItems = response.data.data?.items || [];
        const mappedProducts = cartItems.map((item) => ({
          id: item._id || item.id,
          productId: item.productId,
          name: item.name || 'Product',
          description: item.subtitle || item.variety || 'Fresh Product',
          // ensure numeric price
          price: Number(item.mrp || item.price || 0),
          quantity: item.quantity || 1,
          image: { uri: item.imageUrl },
          deliveryDate: item.deliveryText || 'Sep 25',
        }));

        setProducts(mappedProducts);

        // set server price details if provided (authoritative)
        const priceDetails = response.data.data?.priceDetails ?? null;
        if (priceDetails) {
          // ensure numbers
          setServerPriceDetails({
            totalMRP: Number(priceDetails.totalMRP ?? 0),
            couponDiscount: Number(priceDetails.couponDiscount ?? 0),
            deliveryCharge: Number(priceDetails.deliveryCharge ?? 0),
            totalAmount: Number(priceDetails.totalAmount ?? 0),
          });
        } else {
          setServerPriceDetails(null);
        }

        // If backend returns currently applied coupon info, capture it
        const applied = response.data.data?.appliedCoupon ?? response.data.data?.coupon ?? null;
        if (applied) {
          setAppliedCoupon({ code: applied.code || applied.couponCode || applied, discount: applied.discount || 0 });
          setCouponCode(applied.code || applied.couponCode || applied);
        }
      } else {
        Alert.alert('Error', response.data.message || 'Failed to load cart');
      }
    } catch (error) {
      console.error('Error fetching cart products:', error);
      Alert.alert('Error', 'Failed to load cart items');
    } finally {
      setLoading(false);
    }
  };

  // Totals calculation helper
  const computeTotals = () => {
    // subtotal computed from client-side product list (source of truth for items)
    const subtotal = products.reduce((sum, p) => sum + (Number(p.price) || 0) * (p.quantity || 0), 0);

    // If serverPriceDetails exists and server provides totalAmount, prefer server numbers
    if (serverPriceDetails && serverPriceDetails.totalAmount > 0) {
      return {
        subtotal: Number((serverPriceDetails.totalMRP ?? subtotal).toFixed(2)),
        couponDiscount: Number((serverPriceDetails.couponDiscount ?? 0).toFixed(2)),
        deliveryCharge: Number((serverPriceDetails.deliveryCharge ?? 0).toFixed(2)),
        totalAmount: Number((serverPriceDetails.totalAmount ?? subtotal).toFixed(2)),
        usedServer: true,
      };
    }

    // Fallback: client-side calculation (no server details)
    const couponDiscount = 0;
    const deliveryChargeFallback = 0; // If server doesn't provide delivery, default to 0 (avoid surprise)
    const total = subtotal - couponDiscount + deliveryChargeFallback;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      couponDiscount: Number(couponDiscount.toFixed(2)),
      deliveryCharge: Number(deliveryChargeFallback.toFixed(2)),
      totalAmount: Number(total.toFixed(2)),
      usedServer: false,
    };
  };

  // Apply coupon API integration
  const applyCoupon = async () => {
    if (!couponCode || couponCode.trim().length === 0) {
      Alert.alert('Invalid', 'Please enter a coupon code');
      return;
    }

    setApplyingCoupon(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Please login to apply coupon');
        setApplyingCoupon(false);
        return;
      }

      // Try multiple payload shapes because backend might expect different field names
      const payloadCandidates = [
        { couponCode: couponCode.trim() },
        { coupon: couponCode.trim() },
        { code: couponCode.trim() },
        // you can add more variations if your API expects nested objects
      ];

      let successResponse = null;
      let lastError = null;

      for (let i = 0; i < payloadCandidates.length; i++) {
        const payload = payloadCandidates[i];
        try {
          const res = await axios.post(
            `${API_BASE}/api/buyer/orders/place`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res?.data?.success) {
            successResponse = res;
            break;
          } else {
            // if API returns success: false, capture message and continue trying other shapes
            lastError = new Error(res?.data?.message || 'Coupon rejected by server');
            lastError.response = res;
          }
        } catch (err) {
          // Save last error and continue trying other payload shapes
          lastError = err;
          // If server returned JSON body, log it for debugging
          console.log('Coupon attempt error for payload', payload, err?.response?.status, err?.response?.data);
        }
      }

      if (!successResponse) {
        // All attempts failed — show useful message from server if available
        const serverMsg = lastError?.response?.data?.message || lastError?.message || 'Failed to apply coupon';
        Alert.alert('Coupon Error', serverMsg);
        setApplyingCoupon(false);
        return;
      }

      // Success — parse the returned pricing info defensively
      const res = successResponse;
      const priceDetails = res.data?.data?.priceDetails ?? res.data?.data?.price_detail ?? res.data?.data?.price ?? null;

      if (priceDetails) {
        setServerPriceDetails({
          totalMRP: Number(priceDetails.totalMRP ?? priceDetails.subtotal ?? 0),
          couponDiscount: Number(priceDetails.couponDiscount ?? priceDetails.couponDiscountAmount ?? priceDetails.discountAmount ?? 0),
          deliveryCharge: Number(priceDetails.deliveryCharge ?? 0),
          totalAmount: Number(priceDetails.totalAmount ?? priceDetails.total ?? 0),
        });
      } else {
        // If backend returned updated cart instead of priceDetails, re-sync cart
        await fetchCartProducts();
      }

      setAppliedCoupon({
        code: couponCode.trim(),
        discount: res.data?.data?.discountAmount ?? priceDetails?.couponDiscount ?? 0,
      });

      Alert.alert('Success', res.data?.message || 'Coupon applied successfully');
    } catch (err) {
      console.error('Unexpected error applying coupon:', err);
      const message = err?.response?.data?.message || err?.message || 'Failed to apply coupon';
      Alert.alert('Error', message);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = async () => {
    // If your backend has a remove endpoint, call it. If not, re-fetch cart without coupon.
    try {
      setApplyingCoupon(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Please login');
        setApplyingCoupon(false);
        return;
      }

      // defensive: try delete endpoint first
      try {
        const res = await axios.delete(`${API_BASE}/api/buyer/cart/remove-coupon`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data && res.data.success) {
          setAppliedCoupon(null);
          setCouponCode('');
          // refresh cart to get fresh price details
          await fetchCartProducts();
          Alert.alert('Removed', 'Coupon removed');
          return;
        }
      } catch (e) {
        // ignore — fallback to re-fetch
      }

      // fallback: refetch cart (backend should not include coupon then)
      setAppliedCoupon(null);
      setCouponCode('');
      await fetchCartProducts();
      Alert.alert('Removed', 'Coupon removed');
    } catch (err) {
      console.error('Error removing coupon:', err);
      Alert.alert('Error', 'Failed to remove coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Update quantity
  const updateQuantityInAPI = async (cartItemId, newQuantity) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.put(
        `${API_BASE}/api/buyer/cart/${cartItemId}/quantity`,
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.data.success) throw new Error('Failed to update quantity');
      // refresh local products and server price details to keep totals accurate
      fetchCartProducts();
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
      fetchCartProducts();
    }
  };

  const increaseQuantity = (id) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const newQuantity = product.quantity + 1;
    setProducts(products.map(p => p.id === id ? { ...p, quantity: newQuantity } : p));
    updateQuantityInAPI(id, newQuantity);
  };

  const decreaseQuantity = (id) => {
    const product = products.find(p => p.id === id);
    if (!product || product.quantity <= 1) return;
    const newQuantity = product.quantity - 1;
    setProducts(products.map(p => p.id === id ? { ...p, quantity: newQuantity } : p));
    updateQuantityInAPI(id, newQuantity);
  };

  const removeProduct = async (id) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.delete(`${API_BASE}/api/buyer/cart/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setProducts(products.filter(p => p.id !== id));
        // refresh server price details after removal
        fetchCartProducts();
        Alert.alert('Success', 'Item removed');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing product:', error);
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  // Proceed: use server-provided totalAmount when available
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

    // IMPORTANT: pass server's totalAmount if usedServer true, else pass client totalAmount
    const amountToPay = totals.totalAmount;

    navigation.navigate("Payment", {
      addressId: selectedAddress.id,
      deliveryType: "Delivery",
      comments: "Deliver before 8 PM please",
      paymentMethod: "UPI",
      totalAmount: Number(amountToPay.toFixed(2)), // ensure number
      totalItems: totalItems.toString(),
    });
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
  const handleAddressSelect = (addr) => {
    setSelectedAddress(addr);
    setPincode(addr.pincode);
    closeModal();
  };
  const MoveToNewAddress = () => {
    setModalVisible(false);
    navigation.navigate("AddNewAddress");
  };

  const ProductCard = ({ product }) => (
    <View style={styles.productCard}>
      <View style={styles.mainContainer}>
        <Image source={product.image} style={styles.productImage} />
        <View style={styles.productDetails}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productDescription}>{product.description}</Text>
          <Text style={styles.productPrice}>MRP ₹{Number(product.price).toFixed(2)}</Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => removeProduct(product.id)}>
            <Image source={require('../assets/via-farm-img/icons/deleteBtn.png')} />
          </TouchableOpacity>
          <View style={styles.deliveryRow}>
            <Text style={styles.deliveryText}>{product.deliveryDate}</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity style={styles.quantityButton} onPress={() => decreaseQuantity(product.id)}>
                <Text style={styles.quantityText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityNumber}>{product.quantity}</Text>
              <TouchableOpacity style={styles.quantityButton} onPress={() => increaseQuantity(product.id)}>
                <Text style={styles.quantityText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

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

  // compute totals for render
  const totalsForRender = computeTotals();

  return (
    <SafeAreaView style={styles.container}>
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
              <Text style={styles.addressText}>
                {selectedAddress ? `${selectedAddress.name}, ${selectedAddress.pincode}` : "Select delivery address"}
              </Text>
            </View>
            <TouchableOpacity onPress={openModal}>
              <Text style={styles.changeText}>Change ?</Text>
            </TouchableOpacity>
          </View>
        </View>

        {products.length > 0 && (
          <Text style={styles.deliveryDate}>{products[0].deliveryDate || 'Delivered soon'}</Text>
        )}

        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}

        {/* Coupon / promo area (integrated) */}
        <View style={styles.couponSection}>
          <Image source={require('../assets/via-farm-img/icons/promo-code.png')} />
          <View style={{ flex: 1 }}>
            <Text style={styles.couponTitle}>Have a Coupon?</Text>
            <Text style={styles.couponSubtitle}>Apply now and Save Extra!</Text>
          </View>
        </View>

        <View style={styles.couponInputContainer}>
          <TextInput
            style={styles.couponInput}
            placeholder="Enter your coupon code"
            placeholderTextColor="#999"
            value={couponCode}
            onChangeText={setCouponCode}
            autoCapitalize="characters"
          />

          {!appliedCoupon ? (
            <TouchableOpacity style={styles.Button} onPress={applyCoupon} disabled={applyingCoupon}>
              {applyingCoupon ? <ActivityIndicator /> : <Text style={{color:'#fff'}} >Apply</Text>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.Button} onPress={removeCoupon} disabled={applyingCoupon}>
              {applyingCoupon ? <ActivityIndicator /> : <Text style={{color:'#fff'}}>Remove</Text>}
            </TouchableOpacity>
          )}
        </View>

        {appliedCoupon && (
          <View style={styles.appliedCouponRow}>
            <Text style={styles.appliedCouponText}>Applied: {appliedCoupon.code} {appliedCoupon.discount ? `- ₹${Number(appliedCoupon.discount).toFixed(2)}` : ''}</Text>
          </View>
        )}

        {/* Price details: prefer server values */}
        <View style={styles.priceSection}>
          <Text style={styles.priceTitle}>Price Details</Text>
          <View style={styles.priceRow}><Text style={styles.priceLabel}>Total MRP</Text><Text style={styles.priceValue}>₹{totalsForRender.subtotal.toFixed(2)}</Text></View>
          <View style={styles.priceRow}><Text style={styles.priceLabel}>Coupon Discount</Text><Text style={styles.priceValue}>₹{(-totalsForRender.couponDiscount).toFixed(2)}</Text></View>
          <View style={styles.priceRow}><Text style={styles.priceLabel}>Delivery Charge</Text><Text style={styles.priceValue}>₹{totalsForRender.deliveryCharge.toFixed(2)}</Text></View>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Total Amount</Text><Text style={styles.totalValue}>₹{totalsForRender.totalAmount.toFixed(2)}</Text></View>
          {totalsForRender.usedServer && <Text style={{ fontSize: 12, color: '#666', marginTop: 6 }}>Using server-calculated charges</Text>}
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments</Text>
          <TextInput style={styles.commentsInput} placeholder="Instructions / Comments for the vendor" placeholderTextColor="#999" multiline />
        </View>

        <SuggestionCard />
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Card */}
      <View style={styles.bottomPaymentCard}>
        <View style={styles.paymentLeft}>
          {/* <Text style={styles.priceLabelBottom}>Price</Text> */}
          <Text style={styles.totalPrice}>₹{totalsForRender.totalAmount.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.proceedButton} onPress={handleProceedToPayment}>
          <Image source={require("../assets/via-farm-img/icons/UpArrow.png")} />
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
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}><Ionicons name="close" size={24} color="#666" /></TouchableOpacity>
            </View>

            <View style={styles.searchSection}>
              <View style={styles.pincodeInputContainer}>
                <TextInput style={styles.pincodeInput} placeholder="Enter Pincode" value={pincode} onChangeText={setPincode} />
                <TouchableOpacity style={styles.checkButton}><Text style={styles.checkButtonText}>Check Pincode</Text></TouchableOpacity>
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
                    <Text style={styles.addressName}>{address.name}, {address.pincode}</Text>
                    <Text style={styles.addressText}>{address.address}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, }}>
                    <TouchableOpacity
                      onPress={() => {
                        closeModal(); // first close the modal
                        setTimeout(() => {
                          // Pass all fields individually
                          navigation.navigate('aditAddress', {
                            address: {
                              id: address.id,
                              pincode: address.pincode,
                              houseNumber: addresses.houseNumber || '',
                              locality: addresses.locality || '',
                              city: address.city || '',
                              district: address.district || '',
                              isDefault: address.isDefault || false,
                              name: address.name || 'Buyer'
                            }
                          });
                        }, 300);
                      }}
                    >
                      <Image source={require('../assets/via-farm-img/icons/editicon.png')} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={async () => {
                        try {
                          const token = await AsyncStorage.getItem('userToken');
                          const res = await axios.delete(`${API_BASE}/api/buyer/addresses/${address.id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          if (res.data.success) {
                            Alert.alert('Deleted', 'Address deleted successfully');
                            fetchBuyerAddresses(); // refresh addresses
                          }
                        } catch (err) {
                          console.error(err);
                          Alert.alert('Error', 'Failed to delete address');
                        }
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
    paddingBottom: 30,
  },
  mainContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignContent: 'center',
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
    fontSize: 20,
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
    paddingHorizontal: 10,
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
    fontSize: 11,
    color: '#666',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 5,
    position: 'absolute',
    marginTop: 60,
    borderWidth: 1,
    borderColor: '#000',
  },
  quantityButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  couponInput: {
    borderWidth: 2,
    borderColor: 'rgba(1, 151, 218, 1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    width: '80%',
  },
  Button: {
    backgroundColor: '#28a745',
    padding:14,
    borderRadius: 10,
    // borderWidth:2,
    // borderColor:'#28a745',
  },
  donationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 10,
    gap: 20,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  donationText: {
    fontSize: 15,
    marginTop: 10,
    color: '#666',
    marginBottom: 10,
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
    fontSize: 16,
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
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 15,
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
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 8,
    minWidth: 180,
    flexDirection: 'row',
    gap: 10,
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