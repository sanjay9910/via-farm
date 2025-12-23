// VendorsDetails.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale, normalizeFont, scale } from './Responsive';

const API = 'https://viafarm-1.onrender.com';
const COORDS = '?buyerLat=28.70&buyerLng=77.22';
const CARD_COLUMNS = 2;
const CARD_MARGIN = 10;

/** Robust FarmImage */
const FarmImage = ({ item, onPress }: any) => {
  let uri = null;
  if (!item) uri = 'https://via.placeholder.com/120';
  else if (typeof item === 'string') uri = item;
  else if (item?.url) uri = item.url;
  else if (item?.image) uri = item.image;
  else if (item?.src) uri = item.src;
  else if (item?.path) uri = item.path;
  else uri = 'https://via.placeholder.com/120';

  return (
    <TouchableOpacity style={{ marginRight: 8 }} activeOpacity={0.85} onPress={() => onPress(uri)}>
      <Image
        source={{ uri }}
        style={{ width: scale(80), height: scale(80), borderRadius: moderateScale(8), backgroundColor: '#eee' }}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
};

/** Review small card */
const ReviewCard = ({ item }: any) => (
  <View style={styles.reviewCard}>
    <View style={styles.header}>
      <Image
        source={{ uri: item?.user?.profilePicture || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View style={{ flex: 1, marginLeft: moderateScale(10) }}>
        <Text allowFontScaling={false} style={styles.name}>{item?.user?.name || 'Anonymous'}</Text>
        <Text allowFontScaling={false} style={styles.rating}>
          ⭐{item?.rating != null ? Number(item.rating).toFixed(1) : 'N/A'}
        </Text>
      </View>
      <Text allowFontScaling={false} style={styles.date}>
        {item?.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : ''}
      </Text>
    </View>
    {item?.comment && <Text allowFontScaling={false} style={styles.comment}>{item.comment}</Text>}
  </View>
);

const ProductCardLocal = ({
  item,
  isFavorite,
  onToggleFavorite,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity,
  onPress,
  cardWidth,
}: any) => {
  const qty = cartQuantity || 0;
  const inCart = qty > 0;

  const imageUri =
    item?.image ||
    (Array.isArray(item?.images) && item.images.length > 0 && item.images[0]) ||
    'https://via.placeholder.com/150/FFA500/FFFFFF?text=No+Image';

  const distance =
    item?.distanceFromVendor ?? item?.distance ?? item?.vendor?.distanceFromVendor ?? null;

  const status = item?.status ?? (item?.stock === 0 ? 'Out of Stock' : 'In Stock');

  const rating = (typeof item?.rating === 'number') ? item.rating : (item?.rating ? Number(item.rating) : 0);

  // quantity modal state
  const [qtyModalVisible, setQtyModalVisible] = useState(false);
  const [editQuantity, setEditQuantity] = useState(String(qty));

  // keep in sync if parent cartQuantity changes
  useEffect(() => {
    setEditQuantity(String(qty));
  }, [qty]);

  const openQtyModal = (e?: any) => {
    e?.stopPropagation?.();
    setEditQuantity(String(qty));
    setQtyModalVisible(true);
  };
  const closeQtyModal = () => setQtyModalVisible(false);

  const applyQuantityChange = () => {
    const parsed = parseInt(String(editQuantity).replace(/\D/g, ''), 10);
    const newQty = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    const delta = newQty - (qty || 0);
    if (delta === 0) {
      closeQtyModal();
      return;
    }
    try {
      onUpdateQuantity && onUpdateQuantity(item, delta);
    } catch (err) {
      console.error('applyQuantityChange error', err);
    } finally {
      closeQtyModal();
    }
  };

  const incrementEdit = () => {
    const v = parseInt(editQuantity || '0', 10) || 0;
    setEditQuantity(String(v + 1));
  };
  const decrementEdit = () => {
    const v = parseInt(editQuantity || '0', 10) || 0;
    setEditQuantity(String(Math.max(0, v - 1)));
  };

  return (
    <View style={[cardStyles.container, { width: cardWidth }]}>
      <TouchableOpacity style={cardStyles.card} activeOpacity={0.85} onPress={() => onPress && onPress(item)}>
        <View style={[cardStyles.imageContainer, { height: cardStyles.imageHeight }]}>
          <Image source={{ uri: imageUri }} style={cardStyles.productImage} resizeMode="cover" />

          <TouchableOpacity
            style={cardStyles.favoriteButton}
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleFavorite && onToggleFavorite(item);
            }}
          >
               <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={moderateScale(24)}
              color={isFavorite ? "#ff4757" : "#fff"}
              style={{
                textShadowColor: "rgba(0,0,0,0.7)",
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 3,
              }}
            />
          </TouchableOpacity>

          <View style={cardStyles.ratingContainer}>
            <Ionicons name="star" size={scale(12)} color="#FFD700" />
            <Text allowFontScaling={false} style={cardStyles.ratingText}>{rating ? Number(rating).toFixed(1) : '0.0'}</Text>
          </View>
        </View>

        <View style={cardStyles.cardContent}>
          <Text allowFontScaling={false} style={cardStyles.productTitle} numberOfLines={1}>
            {item?.name ?? 'Unnamed product'}
          </Text>

          <Text allowFontScaling={false} style={cardStyles.productVeriety} numberOfLines={1}>
            Variety: {item?.variety ?? 'Unnamed product'}
          </Text>

          {/* <View style={{ flexDirection: 'row', alignItems: 'center', gap:moderateScale(6), marginTop: moderateScale(6) }}>
            <Image source={require('../assets/via-farm-img/icons/loca.png')} />
            <Text allowFontScaling={false} style={{ fontSize: normalizeFont(11), color: '#444' }}>{distance ?? '0.0 km'}</Text>
          </View> */}

          <View style={cardStyles.priceContainer}>
            <Text allowFontScaling={false} style={cardStyles.productUnit}>₹{item?.price ?? '0'}</Text>
            <Text allowFontScaling={false} style={cardStyles.productUnit}>/{item?.unit ?? 'unit'}</Text>
            {item?.weightPerPiece ? <Text style={cardStyles.productUnit}>/{item.weightPerPiece}</Text> : null}
          </View>

          <View style={cardStyles.buttonContainer}>
            {!inCart ? (
              <TouchableOpacity
                style={[cardStyles.addToCartButton, status !== 'In Stock' && cardStyles.disabledButton]}
                activeOpacity={0.8}
                disabled={status !== 'In Stock'}
                onPress={(e) => {
                  e.stopPropagation?.();
                  onAddToCart && onAddToCart(item);
                }}
              >
                <Text allowFontScaling={false} style={cardStyles.addToCartText}>{status === 'In Stock' ? 'Add to Cart' : status}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={openQtyModal}
                  onLongPress={(e) => {
                    e.stopPropagation?.();
                    openQtyModal(e);
                  }}
                >
                  <View style={cardStyles.quantityContainer}>
                    <TouchableOpacity
                      style={cardStyles.quantityButton}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        onUpdateQuantity && onUpdateQuantity(item, -1);
                      }}
                    >
                      <Ionicons name="remove" size={scale(16)} color="rgba(76, 175, 80, 1)" />
                    </TouchableOpacity>

                    <View style={cardStyles.quantityValueContainer}>
                      <Text allowFontScaling={false} style={cardStyles.quantityText}>{qty}</Text>
                    </View>

                    <TouchableOpacity
                      style={cardStyles.quantityButton}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        onUpdateQuantity && onUpdateQuantity(item, 1);
                      }}
                    >
                      <Ionicons name="add" size={scale(16)} color="rgba(76, 175, 80, 1)" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {/* Quantity edit modal */}
                <Modal visible={qtyModalVisible} animationType="fade" transparent onRequestClose={closeQtyModal}>
                  <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={closeQtyModal}>
                    <View style={[modalStyles.modalWrap, { maxWidth: Math.min(420, Dimensions.get('window').width - moderateScale(40)) }]}>
                      <Text allowFontScaling={false} style={modalStyles.modalTitle}>Add quantity</Text>

                      <View style={modalStyles.editRow}>
                        <TouchableOpacity style={modalStyles.pickerBtn} onPress={decrementEdit}>
                          <Ionicons name="remove" size={scale(18)} color="#111" />
                        </TouchableOpacity>

                        <TextInput
                        allowFontScaling={false}
                          style={modalStyles.qtyInput}
                          keyboardType="number-pad"
                          value={String(editQuantity)}
                          onChangeText={(t) => setEditQuantity(t.replace(/[^0-9]/g, ''))}
                          maxLength={6}
                          placeholder="0"
                          placeholderTextColor="#999"
                        />

                        <TouchableOpacity style={modalStyles.pickerBtn} onPress={incrementEdit}>
                          <Ionicons name="add" size={scale(18)} color="#111" />
                        </TouchableOpacity>
                      </View>

                      <View style={modalStyles.modalActions}>
                        <TouchableOpacity style={modalStyles.cancelBtn} onPress={closeQtyModal}>
                          <Text allowFontScaling={false} style={modalStyles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={modalStyles.okBtn} onPress={applyQuantityChange}>
                          <Text allowFontScaling={false} style={modalStyles.okText}>OK</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Modal>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

/* ------------------------------------------------------------------
   VendorsDetails main screen component
   ------------------------------------------------------------------ */
const VendorsDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params: any = (route as any).params || {};
  const vendorId = params?.vendorId;

  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();

  // responsive card width for 2 columns
  const horizontalPadding = moderateScale(10) * 2; 
  const columnGap = moderateScale(10);
  const cardWidth = Math.max(120, Math.floor((window.width - horizontalPadding - columnGap) / CARD_COLUMNS));

  const [vendor, setVendor] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [farmImage, setFarmImage] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [favorites, setFavorites] = useState<Set<any>>(new Set());
  const [cartItems, setCartItems] = useState<Record<string, any>>({});

  const [categories, setCategories] = useState<any[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const animation = useRef(new Animated.Value(0)).current;

  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // helpers
  const getVendorRating = (r: any) => {
    const numeric = typeof r === 'string' ? parseFloat(r) : r;
    if (numeric === null || numeric === undefined || Number.isNaN(numeric)) return 5.0;
    return numeric;
  };

  // fetch vendor + products
  const fetchVendor = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('userToken');
      const resp = await axios.get(`${API}/api/buyer/vendor/${vendorId}${COORDS}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        timeout: 15000,
      });
      const data = resp?.data ?? {};

      const vendorData = data?.data?.vendor ?? data?.vendor ?? null;
      const reviewsList = data?.data?.reviews?.list ?? data?.data?.reviews ?? data?.reviews?.list ?? data?.reviews ?? [];
      const farmImagesList = vendorData?.farmImages ?? data?.data?.farmImages ?? data?.farmImages ?? [];
      const listedProducts = data?.data?.listedProducts ?? data?.listedProducts ?? [];

      if (!vendorData) throw new Error('Vendor not found');

      setVendor(vendorData);
      setReviews(Array.isArray(reviewsList) ? reviewsList : []);
      setFarmImage(Array.isArray(farmImagesList) ? farmImagesList : []);
      setProducts(Array.isArray(listedProducts) ? listedProducts : []);
    } catch (err: any) {
      console.error('fetchVendor error', err);
      setError(err?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const resp = await axios.get(`${API}/api/admin/manage-app/categories`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        timeout: 10000,
      });
      const cats = Array.isArray(resp?.data?.categories) ? resp.data.categories : [];
      const names = cats.map((c: any) => (typeof c.name === 'string' ? c.name.trim() : String(c._id || c).trim())).filter(Boolean);
      const unique = ['All', ...Array.from(new Set(names))];
      setCategories(unique);
      if (!unique.includes(selectedCategory)) setSelectedCategory('All');
    } catch (err) {
      console.error('fetchCategories error', err);
      setCategories(['All']);
      setSelectedCategory('All');
    }
  };

  const fetchWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const res = await axios.get(`${API}/api/buyer/wishlist`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) {
        const wishlistItems = res.data.data?.items ?? [];
        const favIds = new Set(wishlistItems.map((it: any) => it.productId || it._id || it.id));
        setFavorites(favIds);
      }
    } catch (err) {
      console.error('fetchWishlist error', err);
    }
  };

  const fetchCart = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      const res = await axios.get(`${API}/api/buyer/cart`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data?.success) {
        const items = res.data.data?.items ?? [];
        const map: Record<string, any> = {};
        items.forEach((it: any) => {
          const productId = it.productId || it._id || it.id;
          const cartItemId = it._id || it.id || it.cartItemId || productId;
          map[productId] = { quantity: it.quantity || it.qty || 1, cartItemId };
        });
        setCartItems(map);
      }
    } catch (err) {
      console.error('fetchCart error', err);
    }
  };

  useEffect(() => {
    if (vendorId) {
      fetchVendor();
      fetchCategories();
      fetchWishlist();
      fetchCart();
    }
  }, [vendorId]);

  const openDropdown = () => {
    setShowDropdown(true);
    Animated.timing(animation, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const closeDropdown = () => {
    Animated.timing(animation, { toValue: 0, duration: 180, useNativeDriver: false }).start(() => setShowDropdown(false));
  };
  const toggleDropdown = () => (showDropdown ? closeDropdown() : openDropdown());

  // image viewer
  const openImageViewer = (imageUri: string) => {
    setSelectedImage(imageUri);
    setImageViewerVisible(true);
  };
  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImage(null);
  };

  // wishlist handlers (optimistic)
  const addToWishlist = async (product: any) => {
    if (!product) return;
    const productId = product._id || product.id;
    setFavorites((prev) => new Set(prev).add(productId));

    (async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          setFavorites((prev) => { const s = new Set(prev); s.delete(productId); return s; });
          return;
        }
        const body = {
          productId,
          name: product.name,
          image: product.images?.[0] || product.image || '',
          price: product.price,
          category: product.categoryName || 'Uncategorized',
          variety: product.variety || 'Standard',
          unit: product.unit || 'kg',
        };
        const res = await axios.post(`${API}/api/buyer/wishlist/add`, body, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.data?.success) {
          setFavorites((prev) => { const s = new Set(prev); s.delete(productId); return s; });
        }
      } catch (err) {
        console.error('addToWishlist error', err);
        setFavorites((prev) => { const s = new Set(prev); s.delete(productId); return s; });
      }
    })();
  };

  const removeFromWishlist = async (product: any) => {
    if (!product) return;
    const productId = product._id || product.id;
    const prev = new Set(favorites);
    setFavorites((p) => { const s = new Set(p); s.delete(productId); return s; });

    (async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          setFavorites(prev);
          return;
        }
        const res = await axios.delete(`${API}/api/buyer/wishlist/${productId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.data?.success) setFavorites(prev);
      } catch (err) {
        console.error('removeFromWishlist error', err);
        setFavorites(prev);
      }
    })();
  };

  const handleToggleFavorite = (product: any) => {
    const productId = product._id || product.id;
    if (favorites.has(productId)) removeFromWishlist(product);
    else addToWishlist(product);
  };

  // cart handlers (optimistic)
  const handleAddToCart = (product: any) => {
    if (!product) return;
    const productId = product._id || product.id;
    if (cartItems[productId]) return;

    const prevCart = { ...cartItems };
    setCartItems((prev) => ({ ...prev, [productId]: { quantity: 1, cartItemId: productId } }));

    (async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          setCartItems(prevCart);
          return;
        }
        const body = {
          productId,
          name: product.name,
          image: (product.images && product.images[0]) || product.image || '',
          price: product.price,
          quantity: 1,
          category: product.category || '',
          variety: product.variety || '',
          unit: product.unit || '',
        };
        const res = await axios.post(`${API}/api/buyer/cart/add`, body, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data?.success) {
          const serverId = res.data.data?._id || productId;
          setCartItems((prev) => ({ ...prev, [productId]: { quantity: prev[productId]?.quantity || 1, cartItemId: serverId } }));
        } else {
          setCartItems(prevCart);
          await fetchCart();
        }
      } catch (err) {
        console.error('handleAddToCart error', err);
        setCartItems(prevCart);
        await fetchCart();
      }
    })();
  };

  const handleUpdateQuantity = (product: any, delta: number) => {
    if (!product) return;
    const productId = product._id || product.id;
    const current = cartItems[productId];

    if (!current) {
      if (delta > 0) handleAddToCart(product);
      return;
    }

    const newQty = (current.quantity || 0) + delta;

    if (newQty < 1) {
      const prevCart = { ...cartItems };
      setCartItems((prev) => { const next = { ...prev }; delete next[productId]; return next; });

      (async () => {
        try {
          const token = await AsyncStorage.getItem('userToken');
          if (!token) {
            setCartItems(prevCart);
            return;
          }
          const res = await axios.delete(`${API}/api/buyer/cart/${current.cartItemId}`, { headers: { Authorization: `Bearer ${token}` } });
          if (!res.data?.success) {
            setCartItems(prevCart);
            await fetchCart();
          }
        } catch (err) {
          console.error('handleUpdateQuantity remove error', err);
          setCartItems(prevCart);
          await fetchCart();
        }
      })();

      return;
    }

    const previous = { ...current };
    setCartItems((prev) => ({ ...prev, [productId]: { ...current, quantity: newQty } }));

    (async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          setCartItems((prev) => ({ ...prev, [productId]: previous }));
          return;
        }
        const res = await axios.put(`${API}/api/buyer/cart/${current.cartItemId}/quantity`, { quantity: newQty }, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.data?.success) {
          // fallback
          try {
            await axios.put(`${API}/api/buyer/cart/update`, { cartItemId: current.cartItemId, quantity: newQty }, { headers: { Authorization: `Bearer ${token}` } });
          } catch (inner) {
            console.error('fallback update failed', inner);
            setCartItems((prev) => ({ ...prev, [productId]: previous }));
            await fetchCart();
          }
        }
        await fetchCart();
      } catch (err) {
        console.error('handleUpdateQuantity update error', err);
        setCartItems((prev) => ({ ...prev, [productId]: previous }));
        await fetchCart();
      }
    })();
  };

  // navigation
  const openProductDetails = (product: any) => {
    try {
      const productId = product?._id || product?.id;
      if (!productId) {
        console.error('Product id missing');
        return;
      }
      (navigation as any).navigate('ViewProduct', { productId, product });
    } catch (err) {
      console.error('openProductDetails error', err);
    }
  };

  // UI guards
  if (loading)
    return (
      <View style={styles.containerRoot}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text allowFontScaling={false} style={{ marginTop: 8 }}>Loading...</Text>
        </View>
      </View>
    );

  if (error || !vendor)
    return (
      <View style={styles.containerRoot}>
        <View style={styles.center}>
          <Text allowFontScaling={false} style={styles.errorHeader}>Error</Text>
          <Text allowFontScaling={false}>{error}</Text>
        </View>
      </View>
    );

  const v = vendor;
  const image = v?.profilePicture || 'https://picsum.photos/800/600';

  // filtered products
  const filteredProducts = selectedCategory === 'All' ? products : products.filter((p: any) => {
    const c = (p?.category || p?.categoryName || '').toString().toLowerCase();
    return c === selectedCategory.toString().toLowerCase();
  });

  const allReviewImages = reviews.reduce((acc: string[], review: any) => {
    const imgs = review?.images;
    if (!imgs) return acc;
    if (Array.isArray(imgs)) {
      imgs.forEach((it: any) => {
        if (typeof it === 'string') acc.push(it);
        else if (it?.url) acc.push(it.url);
        else if (it?.image) acc.push(it.image);
      });
    }
    return acc;
  }, []);

  const ListHeader = () => (
    <View style={{ width: '100%', paddingBottom: moderateScale(10), backgroundColor: '#fff', overflow: 'visible', zIndex: 9999 }}>
      <View style={styles.imageBox}>
        <Image source={{ uri: image }} style={styles.image} resizeMode='stretch' />
        <TouchableOpacity style={[styles.backBtn, { top: insets.top + 10 }]} onPress={() => (navigation as any).goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.cardContainer]}>
        <View style={styles.rowBetween}>
          <Text allowFontScaling={false} style={styles.vendorName}>{v?.name}</Text>
          <View style={styles.ratingBox}>
            <Image source={require('../assets/via-farm-img/icons/satar.png')} />
            <Text allowFontScaling={false} style={styles.ratingText}>{getVendorRating(v?.rating).toFixed(1)}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Image source={require('../assets/via-farm-img/icons/loca.png')} />
          <Text allowFontScaling={false} style={styles.location}>{v?.locationText ?? 'Unknown'}</Text>
        </View>

        <Text allowFontScaling={false} style={styles.aboutHeader}>About the vendor</Text>
        <Text allowFontScaling={false} style={styles.about}>{v?.about ?? 'No information available.'}</Text>
      </View>

      {/* farm images */}
      <View style={{ backgroundColor: '#fff', paddingVertical: 10, marginTop: allReviewImages.length > 0 ? 0 : 10 }}>
        {farmImage.length > 0 && (
          <FlatList
            data={farmImage}
            renderItem={({ item }) => <FarmImage item={item} onPress={openImageViewer} />}
            keyExtractor={(item: any, idx: number) => (typeof item === 'string' ? item : item?._id ? item._id.toString() : idx.toString())}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: moderateScale(10) }}
          />
        )}
      </View>

      {allReviewImages.length > 0 && (
        <View style={{ backgroundColor: '#fff', paddingVertical: moderateScale(10), paddingLeft: moderateScale(10) }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text allowFontScaling={false} style={styles.sectionHeader}>
              Reviews <Text  allowFontScaling={false} style={{ fontSize: normalizeFont(12), fontWeight: '400' }}>({reviews.length} reviews)</Text>
            </Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('SeeAllReview', { vendor: v, reviews })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingRight: moderateScale(5) }}>
                <Text allowFontScaling={false} style={{ color: 'rgba(1,151,218,1)', fontWeight: '600', fontSize: normalizeFont(13) }}>See All</Text>
                <Image source={require('../assets/via-farm-img/icons/see.png')} />
              </View>
            </TouchableOpacity>
          </View>

          <FlatList
            data={allReviewImages}
            horizontal
            keyExtractor={(item: any, idx: number) => `review-img-${idx}`}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={0.8} onPress={() => openImageViewer(item)}>
                <Image source={{ uri: item }} style={{ width: scale(80), height: scale(80), marginRight: moderateScale(8), borderRadius: moderateScale(8) }} />
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* small reviews list */}
      <View style={{ backgroundColor: '#fff', paddingVertical: moderateScale(10), marginTop: allReviewImages.length > 0 ? 0 : 10 }}>
        {reviews.length > 0 ? (
          <FlatList
            data={reviews}
            horizontal
            keyExtractor={(item: any, idx: number) => item?._id ? item._id.toString() : String(idx)}
            renderItem={({ item }) => <ReviewCard item={item} />}
            showsHorizontalScrollIndicator={false}
            // contentContainerStyle={{ paddingHorizontal: moderateScale(10) }}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Image style={{ width: scale(70), height: scale(70) }} source={require('../assets/via-farm-img/icons/empty.png')} />
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Image key={i} style={{ width: scale(25), height: scale(25) }} source={require('../assets/via-farm-img/icons/satar.png')} />
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={[styles.productsHeaderContainer]}>
        <Text allowFontScaling={false} style={[styles.sectionHeader, { marginLeft: 0, marginVertical: 0 }]}>Listing Product</Text>

        <View style={styles.filterWrapper}>
          <TouchableOpacity style={styles.filterBtn} onPress={toggleDropdown} activeOpacity={0.8}>
            <View style={styles.filterExpand}>
              <Text allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail" style={styles.filterText}>{selectedCategory}</Text>
              <Ionicons name={showDropdown ? 'chevron-up' : 'chevron-down'} size={normalizeFont(14)} color="#666" />
            </View>
          </TouchableOpacity>

          <Animated.View
            pointerEvents={showDropdown ? 'auto' : 'none'}
            style={[
              styles.dropdown,
              {
                height: animation.interpolate({ inputRange: [0, 1], outputRange: [0, moderateScale(240)] }),
                borderWidth: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                opacity: animation,
                position: 'absolute',
                left: 0,
                right: 0,
                top: -208,
              },
            ]}
          >
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.dropdownScrollContent} nestedScrollEnabled>
              {Array.isArray(categories) && categories.length > 0 ? (
                categories.map((cat: any) => {
                  const isSelected = String(cat).toLowerCase() === String(selectedCategory).toLowerCase();
                  return (
                    <TouchableOpacity key={String(cat)} style={[styles.dropdownItem, isSelected && styles.selectedDropdownItem]} activeOpacity={0.7} onPress={() => { setSelectedCategory(cat); closeDropdown(); }}>
                      <Text allowFontScaling={false} style={[styles.dropdownText, isSelected && styles.selectedDropdownText]}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text allowFontScaling={false} style={{ padding: moderateScale(12) }}>No categories</Text>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <FlatList
        style={styles.containerRoot}
        data={filteredProducts}
        ListHeaderComponent={<ListHeader />}
        renderItem={({ item }) => {
          const productId = item?._id || item?.id || String(item?.name);
          const isFavorite = favorites.has(productId);
          const cartQuantity = cartItems[productId]?.quantity || 0;

          return (
            <ProductCardLocal
              item={item}
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
              cartQuantity={cartQuantity}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              onPress={openProductDetails}
              cardWidth={cardWidth}
            />
          );
        }}
        keyExtractor={(item, index) => (item?._id ? item._id.toString() : index.toString())}
        numColumns={CARD_COLUMNS}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: CARD_MARGIN, gap: moderateScale(10) }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: moderateScale(40), backgroundColor: '#fff' }}
        ListEmptyComponent={() =>
          !loading && (
            <View style={{ padding: moderateScale(20), alignItems: 'center' }}>
              <Text allowFontScaling={false} style={{ color: '#444' }}>No products available.</Text>
            </View>
          )
        }
      />

      {/* image viewer */}
      <Modal visible={imageViewerVisible} transparent animationType="fade" onRequestClose={closeImageViewer}>
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity style={styles.imageViewerBackdrop} activeOpacity={1} onPress={closeImageViewer} />
          <View style={styles.imageViewerContent}>
            {selectedImage && <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} resizeMode="stretch" />}
            <TouchableOpacity style={styles.closeButton} onPress={closeImageViewer} activeOpacity={0.7}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

/* ---------------------------
   Styles
   --------------------------- */

const styles = StyleSheet.create({
  containerRoot: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(20),
  },
  header:{
    flexDirection:'row',
    // alignItems:'center',
    justifyContent:'space-between',
  },
  errorHeader: {
    fontSize: normalizeFont(1),
    fontWeight: '700',
    marginBottom: moderateScale(8),
  },
  imageBox: {
    width: '100%',
    height: scale(350),
    backgroundColor: '#f6f6f6',
  },
  image: { width: '100%', height: '100%' },
  backBtn: {
    position: 'absolute',
    left: moderateScale(12),
    padding: moderateScale(6),
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: moderateScale(20),
  },
  cardContainer: { padding: moderateScale(12), backgroundColor: '#fff' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vendorName: { fontSize: normalizeFont(15), fontWeight: '700', color: '#222' },
  ratingBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'grey',gap:3, borderRadius:moderateScale(10), padding:moderateScale(5) },
  ratingText: { fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: moderateScale(8) },
  location: { marginLeft: moderateScale(6), color: '#666', fontSize: moderateScale(11) },
  aboutHeader: { marginTop: moderateScale(8), fontWeight: '600' },
  about: { marginTop: moderateScale(6), color: '#444', fontSize: moderateScale(11) },
  sectionHeader: { fontSize: normalizeFont(14), marginTop: moderateScale(10), marginBottom: moderateScale(10), fontWeight: '600' },
  productsHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: moderateScale(10), paddingTop: moderateScale(12), paddingBottom: moderateScale(6) },
  filterWrapper: { position: 'relative', minWidth: moderateScale(120) },
  filterBtn: { paddingHorizontal: moderateScale(12), paddingVertical: moderateScale(8), borderRadius: moderateScale(6), borderWidth: 1, borderColor: 'rgba(66,66,66,0.7)' },
  filterExpand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  filterText: { color: 'rgba(66,66,66,0.9)', textAlign: 'center', fontSize: normalizeFont(11), marginRight: moderateScale(6), maxWidth: moderateScale(90) },
  dropdown: { overflow: 'hidden', backgroundColor: '#fff', borderColor: 'rgba(66,66,66,0.7)', borderRadius: moderateScale(6), zIndex: 99999, elevation: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 10 },
  dropdownScrollContent: { paddingVertical: moderateScale(6) },
  dropdownItem: { padding: moderateScale(12), borderBottomWidth: 1, borderBottomColor: 'rgba(66,66,66,0.06)' },
  selectedDropdownItem: { backgroundColor: 'rgba(76,175,80,0.08)' },
  dropdownText: { color: 'rgba(66,66,66,0.9)', fontSize: normalizeFont(11) },
  selectedDropdownText: { color: '#4CAF50', fontWeight: '600' },
  reviewCard: { padding: moderateScale(10), marginLeft:moderateScale(10), backgroundColor: 'rgba(255,253,246,1)', borderRadius: moderateScale(8), borderWidth: 1, borderColor: '#f0f0f0' },
  avatar: { width: scale(42), height: scale(42), borderRadius: moderateScale(22) },
  name: { fontWeight: '600', fontSize: normalizeFont(12) },
  rating: { color: '#444', fontSize: 12 },
  date: { color: '#888', fontSize: normalizeFont(11) },
  comment: { marginTop: moderateScale(8), color: '#444', fontSize: normalizeFont(11) },
  imageViewerContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  imageViewerBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  imageViewerContent: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  fullScreenImage: { width: '90%', height: '100%' },
  closeButton: { position: 'absolute', top: moderateScale(40), right: moderateScale(20), width: moderateScale(45), height: moderateScale(45), borderRadius: moderateScale(22.5), backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
});

/* ---------------------------
   Card styles
   --------------------------- */
const cardStyles = StyleSheet.create({
  container: {  marginTop: moderateScale(12), marginBottom: moderateScale(8) },
  card: { backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', shadowColor: 'grey', shadowOpacity: 0.1, shadowRadius: 4, borderWidth:1, borderColor: 'grey', elevation: 7, shadowOffset: { width: 0, height: 3 } },
  imageContainer: { width: '100%', height: scale(140), backgroundColor: '#f6f6f6' },
  imageHeight: scale(135),
  productImage: { width: '100%', height: '100%', borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  favoriteButton: { position: 'absolute', top: moderateScale(2), right: moderateScale(2), borderRadius: moderateScale(16), width: scale(30), height: scale(30), justifyContent: 'center', alignItems: 'center' },
  ratingContainer: { position: 'absolute', bottom: moderateScale(10), backgroundColor: 'rgba(141,141,141,0.6)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: moderateScale(8), paddingVertical: moderateScale(4), borderRadius: moderateScale(14) },
  ratingText: { color: '#fff', fontSize: normalizeFont(11),  fontWeight: '600' },
  cardContent: { paddingHorizontal: moderateScale(10), paddingVertical: moderateScale(10) },
  productTitle: { fontSize: normalizeFont(13), fontWeight: '600', color: '#2b2b2b' },
  productVeriety: { color: 'rgba(66,66,66,0.7)', fontSize: normalizeFont(12),marginTop:moderateScale(5) },
  productSubtitle: { fontSize: normalizeFont(12), color: '#666', marginBottom: moderateScale(8), height: scale(20) },
  priceContainer: { flexDirection: 'row', alignItems: 'flex-end', marginTop: moderateScale(5) },
  productPrice: { fontSize: normalizeFont(13), fontWeight: '800', color: '#666' },
  productUnit: { fontSize: normalizeFont(12), color: '#666', marginBottom: moderateScale(2) },
  buttonContainer: { marginTop: moderateScale(6), alignItems: 'stretch' },
  addToCartButton: { backgroundColor: 'rgba(76,175,80,1)', borderRadius: 8, paddingVertical: moderateScale(10), alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  disabledButton: { backgroundColor: '#cccccc' },
  addToCartText: { color: '#fff', fontSize: normalizeFont(13), fontWeight: '700' },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(76,175,80,1)', borderRadius: 8, paddingHorizontal: moderateScale(4), height: scale(36), minWidth: scale(120), backgroundColor: '#fff' },
  quantityButton: { width: scale(36), height: scale(36), alignItems: 'center', justifyContent: 'center' },
  quantityValueContainer: { minWidth: scale(48), paddingHorizontal: moderateScale(6), height: scale(36), alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(76,175,80,1)', flexDirection: 'row' },
  quantityText: { fontSize: normalizeFont(16), color: 'rgba(76,175,80,1)', fontWeight: '700', textAlign: 'center' },
});

/* Modal styles for quantity edit */
const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: moderateScale(20) },
  modalWrap: { maxWidth: moderateScale(360), backgroundColor: '#fff', borderRadius: moderateScale(10), padding: moderateScale(16), elevation: 10, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  modalTitle: { fontSize: normalizeFont(14), fontWeight: '700', color: '#222', marginBottom: moderateScale(12), textAlign: 'center' },
  editRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: moderateScale(12), marginBottom: moderateScale(14) },
  pickerBtn: { paddingVertical: moderateScale(8), paddingHorizontal: moderateScale(10), borderRadius: moderateScale(8), borderWidth: 1, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa' },
  qtyInput: { flex: 1, minHeight: moderateScale(44), borderWidth: 1, borderColor: '#eee', borderRadius: moderateScale(8), textAlign: 'center', fontSize: normalizeFont(16), paddingVertical: moderateScale(8) },
  modalActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: moderateScale(8) },
  cancelBtn: { paddingVertical: moderateScale(10), paddingHorizontal: moderateScale(14), borderRadius: moderateScale(8), width: '40%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: moderateScale(1), borderColor: 'rgba(76,175,80,1)' },
  cancelText: { color: '#666', fontSize: normalizeFont(13) },
  okBtn: { backgroundColor: 'rgba(76,175,80,1)', paddingVertical: moderateScale(10), paddingHorizontal: moderateScale(14), borderRadius: moderateScale(8), width: '40%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  okText: { color: '#fff', fontWeight: '700', fontSize: normalizeFont(13) },
});

export default VendorsDetails;


// export default VendorsDetails;


// import { Ionicons } from '@expo/vector-icons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import axios from 'axios';
// import React, { useEffect, useRef, useState } from 'react';
// import {
//   ActivityIndicator,
//   Alert,
//   Dimensions,
//   FlatList,
//   Image,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View
// } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import ProductCard from '../components/common/ProductCard';
// import { moderateScale, normalizeFont, scale } from './Responsive';

// const { width } = Dimensions.get('window');
// const API = 'https://viafarm-1.onrender.com';
// const COORDS = '?buyerLat=28.70&buyerLng=77.22';

// const CARD_MARGIN = 10;
// const CARD_COLUMNS = 2;
// const CARD_WIDTH = (width - CARD_MARGIN * (CARD_COLUMNS * 2)) / CARD_COLUMNS;

// /** Robust FarmImage - unchanged */
// const FarmImage = ({ item }) => {
//   let uri = null;
//   if (!item) uri = 'https://via.placeholder.com/120';
//   else if (typeof item === 'string') uri = item;
//   else if (item?.url) uri = item.url;
//   else if (item?.image) uri = item.image;
//   else if (item?.src) uri = item.src;
//   else if (item?.path) uri = item.path;
//   else uri = 'https://via.placeholder.com/120';

//   return (
//     <TouchableOpacity style={{ marginRight: 8 }} activeOpacity={0.85}>
//       <Image
//         source={{ uri }}
//         style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: '#eee' }}
//         resizeMode="cover"
//       />
//     </TouchableOpacity>
//   );
// };

// const ReviewCard = ({ item }) => (
//   <TouchableOpacity style={styles.reviewCard} activeOpacity={0.8}>
//     <View style={styles.header}>
//       <Image
//         source={{ uri: item?.user?.profilePicture || 'https://via.placeholder.com/50' }}
//         style={styles.avatar}
//       />
//       <View style={{ flex: 1, marginLeft: 10 }}>
//         <Text style={styles.name}>{item?.user?.name || 'Anonymous'}</Text>
//         <Text style={styles.rating}>
//           ⭐ {item?.rating != null
//             ? Number(item.rating).toFixed(item.rating % 1 === 0 ? 1 : 1)
//             : 'N/A'}
//         </Text>
//       </View>
//       <Text style={styles.date}>
//         {item?.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : ''}
//       </Text>
//     </View>
//     {item?.comment && <Text style={styles.comment}>{item.comment}</Text>}
//   </TouchableOpacity>
// );

// const VendorsDetails = () => {
//   const insets = useSafeAreaInsets();
//   const navigation = useNavigation();
//   const { params } = useRoute();
//   const vendorId = params?.vendorId;

//   const [vendor, setVendor] = useState(null);
//   const [reviews, setReviews] = useState([]);
//   const [farmImage, setFarmImage] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // wishlist & cart state
//   const [favorites, setFavorites] = useState(new Set());
//   const [cartItems, setCartItems] = useState({});

//   const [selectedCategory, setSelectedCategory] = useState('All');
//   const dropdownButtonRef = useRef(null);

//   // ----- helper function -----
//   const getVendorRating = (r) => {
//     const numeric = typeof r === 'string' ? parseFloat(r) : r;
//     if (numeric === null || numeric === undefined || numeric === 0 || Number.isNaN(numeric)) {
//       return 5.0;
//     }
//     return numeric;
//   };

//   // ----- fetch vendor & product data -----
//   const fetchVendor = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const token = await AsyncStorage.getItem('userToken');
//       const resp = await axios.get(`${API}/api/buyer/vendor/${vendorId}${COORDS}`, {
//         headers: token ? { Authorization: `Bearer ${token}` } : undefined,
//       });
//       const data = resp?.data ?? {};

//       const vendorData = data?.data?.vendor ?? data?.vendor ?? null;
//       const reviewsList = data?.data?.reviews?.list ?? data?.data?.reviews ?? data?.reviews?.list ?? data?.reviews ?? [];
//       const farmImagesList = vendorData?.farmImages ?? data?.data?.farmImages ?? data?.farmImages ?? [];
//       const listedProducts = data?.data?.listedProducts ?? data?.listedProducts ?? [];

//       if (!vendorData) throw new Error('Vendor not found');

//       setVendor(vendorData);
//       setReviews(Array.isArray(reviewsList) ? reviewsList : []);
//       setFarmImage(Array.isArray(farmImagesList) ? farmImagesList : []);
//       setProducts(Array.isArray(listedProducts) ? listedProducts : []);
//     } catch (e) {
//       setError(e?.message ?? 'Something went wrong');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ----- wishlist endpoints -----
//   const fetchWishlist = async () => {
//     try {
//       const token = await AsyncStorage.getItem('userToken');
//       if (!token) return;
//       const res = await axios.get(`${API}/api/buyer/wishlist`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       if (res.data?.success) {
//         const wishlistItems = res.data.data?.items ?? [];
//         const favoriteIds = new Set(wishlistItems.map((it) => it.productId || it._id || it.id));
//         setFavorites(favoriteIds);
//       }
//     } catch (err) {
//       console.error('fetchWishlist error', err);
//     }
//   };

//   // ----- cart endpoints -----
//   const fetchCart = async () => {
//     try {
//       const token = await AsyncStorage.getItem('userToken');
//       if (!token) return;
//       const res = await axios.get(`${API}/api/buyer/cart`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       if (res.data?.success) {
//         const items = res.data.data?.items ?? [];
//         const map = {};
//         items.forEach((it) => {
//           const productId = it.productId || it._id || it.id;
//           map[productId] = { quantity: it.quantity || 1, cartItemId: it._id || it.id };
//         });
//         setCartItems(map);
//       }
//     } catch (err) {
//       console.error('fetchCart error', err);
//     }
//   };

//   useEffect(() => {
//     if (vendorId) {
//       fetchVendor();
//       fetchWishlist();
//       fetchCart();
//     }
//   }, [vendorId]);

//   // ----- wishlist handlers -----
//   const addToWishlist = async (product) => {
//     try {
//       const token = await AsyncStorage.getItem('userToken');
//       if (!token) {
//         Alert.alert('Login Required', 'Please login to add items to wishlist');
//         return;
//       }
//       const productId = product._id || product.id;
//       const body = {
//         productId,
//         name: product.name,
//         image: product.images?.[0] || product.image || '',
//         price: product.price,
//         category: product.category || 'Uncategorized',
//         variety: product.variety || 'Standard',
//         unit: product.unit || 'kg'
//       };
//       const res = await axios.post(`${API}/api/buyer/wishlist/add`, body, {
//         headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
//       });
//       if (res.data?.success) {
//         setFavorites(prev => new Set(prev).add(productId));
//         Alert.alert('Success', 'Added to wishlist!');
//       }
//     } catch (err) {
//       console.error('addToWishlist error', err);
//       if (err.response?.status === 400) {
//         const productId = product._id || product.id;
//         setFavorites(prev => new Set(prev).add(productId));
//         Alert.alert('Info', 'Already in wishlist');
//       } else {
//         Alert.alert('Error', 'Failed to add to wishlist');
//       }
//     }
//   };

//   const removeFromWishlist = async (product) => {
//     try {
//       const token = await AsyncStorage.getItem('userToken');
//       if (!token) return;
//       const productId = product._id || product.id;
//       const res = await axios.delete(`${API}/api/buyer/wishlist/${productId}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       if (res.data?.success) {
//         setFavorites(prev => {
//           const next = new Set(prev);
//           next.delete(productId);
//           return next;
//         });
//         Alert.alert('Removed', 'Removed from wishlist');
//       }
//     } catch (err) {
//       console.error('removeFromWishlist error', err);
//       Alert.alert('Error', 'Failed to remove from wishlist');
//     }
//   };

//   const handleToggleFavorite = async (product) => {
//     const productId = product._id || product.id;
//     if (favorites.has(productId)) {
//       await removeFromWishlist(product);
//     } else {
//       await addToWishlist(product);
//     }
//   };

//   // ----- cart handlers -----
//   const handleAddToCart = async (product) => {
//     try {
//       const token = await AsyncStorage.getItem('userToken');
//       if (!token) {
//         Alert.alert('Login Required', 'Please login to add items to cart');
//         return;
//       }
//       const productId = product._id || product.id;
//       const body = {
//         productId,
//         name: product.name,
//         image: product.images?.[0] || product.image || '',
//         price: product.price,
//         quantity: 1,
//         category: product.category || 'Uncategorized',
//         variety: product.variety || 'Standard',
//         unit: product.unit || 'kg'
//       };
//       const res = await axios.post(`${API}/api/buyer/cart/add`, body, {
//         headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
//       });
//       if (res.data?.success) {
//         setCartItems(prev => ({ ...prev, [productId]: { quantity: 1, cartItemId: res.data.data?._id || productId } }));
//         Alert.alert('Success', 'Added to cart!');
//       }
//     } catch (err) {
//       console.error('handleAddToCart error', err);
//       if (err.response?.status === 400) {
//         await fetchCart();
//         Alert.alert('Info', 'Product is already in cart');
//       } else {
//         Alert.alert('Error', 'Failed to add to cart');
//       }
//     }
//   };

//   const handleUpdateQuantity = async (product, change) => {
//     try {
//       const token = await AsyncStorage.getItem('userToken');
//       if (!token) {
//         Alert.alert('Login Required', 'Please login to update cart');
//         return;
//       }
//       const productId = product._id || product.id;
//       const current = cartItems[productId];
//       if (!current) return;
//       const newQty = current.quantity + change;

//       if (newQty < 1) {
//         const res = await axios.delete(`${API}/api/buyer/cart/${current.cartItemId}`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         if (res.data?.success) {
//           setCartItems(prev => {
//             const next = { ...prev };
//             delete next[productId];
//             return next;
//           });
//           Alert.alert('Removed', 'Item removed from cart');
//         }
//       } else {
//         setCartItems(prev => ({ ...prev, [productId]: { ...current, quantity: newQty } }));
//         const res = await axios.put(`${API}/api/buyer/cart/${current.cartItemId}/quantity`, { quantity: newQty }, {
//           headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
//         });
//         if (!res.data?.success) {
//           setCartItems(prev => ({ ...prev, [productId]: current }));
//           Alert.alert('Error', 'Failed to update quantity');
//         }
//       }
//     } catch (err) {
//       console.error('handleUpdateQuantity error', err);
//       await fetchCart();
//       Alert.alert('Error', 'Failed to update quantity');
//     }
//   };

//   // ----- navigation to product details -----
//   const openProductDetails = (product) => {
//     const productId = product?._id || product?.id;
//     if (!productId) {
//       Alert.alert('Error', 'Product id missing');
//       return;
//     }
//     navigation.navigate('ViewProduct', { productId, product });
//   };

//   // ---- small helpers & UI guards ----
//   if (loading)
//     return (
//       <View style={styles.containerRoot}>
//         <View style={styles.center}>
//           <ActivityIndicator size="large" color="#4CAF50" />
//           <Text style={{ marginTop: 8 }}>Loading...</Text>
//         </View>
//       </View>
//     );

//   if (error || !vendor)
//     return (
//       <View style={styles.containerRoot}>
//         <View style={styles.center}>
//           <Text style={styles.errorHeader}>Error</Text>
//           <Text>{error}</Text>
//         </View>
//       </View>
//     );

//   const v = vendor;
//   const image = v.profilePicture || 'https://picsum.photos/800/600';

//   const filteredProducts =
//     selectedCategory === 'All'
//       ? products
//       : products.filter((p) => p.category === selectedCategory);

//   const allReviewImages = reviews.reduce((acc, review) => {
//     const imgs = review?.images;
//     if (!imgs) return acc;
//     if (Array.isArray(imgs)) {
//       imgs.forEach((it) => {
//         if (typeof it === 'string') acc.push(it);
//         else if (it?.url) acc.push(it.url);
//         else if (it?.image) acc.push(it.image);
//       });
//     }
//     return acc;
//   }, []);

//   const ListHeader = () => (
//     <View style={{ width: '100%', paddingBottom: 10, backgroundColor: '#fff' }}>
//       <View style={styles.imageBox}>
//         <Image source={{ uri: image }} style={styles.image} />
//         <TouchableOpacity
//           style={[styles.backBtn, { top: insets.top + 10 }]}
//           onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.cardContainer}>
//         <View style={styles.rowBetween}>
//           <Text style={styles.vendorName}>{v.name}</Text>
//           <View style={styles.ratingBox}>
//             <Image source={require("../assets/via-farm-img/icons/satar.png")} />
//             <Text style={styles.ratingText}>
//               {getVendorRating(v.rating).toFixed(1, "0")}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.row}>
//           <Image source={require("../assets/via-farm-img/icons/loca.png")} />
//           <Text style={styles.location}>
//             {v.locationText ?? 'Unknown'}
//           </Text>
//         </View>
//         <Text style={styles.aboutHeader}>About the vendor</Text>
//         <Text style={styles.about}>{v.about ?? 'No information available.'}</Text>
//       </View>

//       {/* FarmImage */}
//       <View style={{ backgroundColor: '#fff', paddingVertical: 10, marginTop: allReviewImages.length > 0 ? 0 : 10 }}>
//         {farmImage.length > 0 ? (
//           <FlatList
//             data={farmImage}
//             renderItem={({ item }) => <FarmImage item={item} />}
//             keyExtractor={(item, index) =>
//               typeof item === 'string' ? item : item?._id ? item._id.toString() : index.toString()
//             }
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             contentContainerStyle={{ paddingHorizontal: 10 }}
//           />
//         ) : (
//           <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//             {/* <Text style={styles.noReviewText}>No farm images.</Text> */}
//           </View>
//         )}
//       </View>

//       {allReviewImages.length > 0 && (
//         <View style={{ backgroundColor: '#fff', paddingVertical: 10, paddingLeft: 10 }}>
//           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
//             <Text style={styles.sectionHeader}>Reviews <Text style={{ fontSize: normalizeFont(13), fontWeight: (400), }}>({reviews.length} reviews)</Text> </Text>
//             <TouchableOpacity
//               onPress={() =>
//                 navigation.navigate('SeeAllReview', {
//                   vendor,
//                   reviews,
//                 })
//               }>
//               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingRight: 5 }}>
//                 <Text style={{ color: 'rgba(1, 151, 218, 1)', fontWeight: '600', fontSize: normalizeFont(12) }}>See All</Text>
//                 <Image source={require("../assets/via-farm-img/icons/see.png")} />
//               </View>
//             </TouchableOpacity>
//           </View>
//           <FlatList
//             data={allReviewImages}
//             horizontal
//             keyExtractor={(item, idx) => `review-img-${idx}`}
//             renderItem={({ item }) => (
//               <Image source={{ uri: item }} style={{ width: 80, height: 80, marginRight: 8, borderRadius: 8 }} />
//             )}
//             showsHorizontalScrollIndicator={false}
//           />
//         </View>
//       )}

//       {/* Reviews */}
//       <View style={{ backgroundColor: '#fff', paddingVertical: 10, marginTop: allReviewImages.length > 0 ? 0 : 10 }}>
//         {reviews.length > 0 ? (
//           <FlatList
//             data={reviews}
//             renderItem={({ item }) => <ReviewCard item={item} />}
//             keyExtractor={(item, index) => (item?._id ? item._id.toString() : index.toString())}
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             contentContainerStyle={{ paddingHorizontal: 10 }}
//           />
//         ) : (
//           <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//             <Image style={{ width: 70, height: 70 }} source={require('../assets/via-farm-img/icons/empty.png')} />
//             <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
//               <Image style={{ width: 25, height: 25 }} source={require("../assets/via-farm-img/icons/satar.png")} />
//               <Image style={{ width: 25, height: 25 }} source={require("../assets/via-farm-img/icons/satar.png")} />
//               <Image style={{ width: 25, height: 25 }} source={require("../assets/via-farm-img/icons/satar.png")} />
//               <Image style={{ width: 25, height: 25 }} source={require("../assets/via-farm-img/icons/satar.png")} />
//               <Image style={{ width: 25, height: 25 }} source={require("../assets/via-farm-img/icons/satar.png")} />
//             </View>
//             {/* <Text style={styles.noReviewText}>No reviews yet.</Text> */}
//           </View>
//         )}
//       </View>

//       <View style={styles.productsHeaderContainer}>
//         <Text style={[styles.sectionHeader, { marginLeft: 0, marginVertical: 0 }]}>
//           Listing Product
//         </Text>
//         <TouchableOpacity
//           ref={dropdownButtonRef}
//           style={styles.dropdownButton}
//           onPress={() => { /* your dropdown handler */ }}>
//           <Text style={styles.dropdownButtonText}>{selectedCategory}</Text>
//           <Ionicons name="chevron-down" size={20} color="#555" />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );

//   return (
//     <FlatList
//       style={styles.containerRoot}
//       data={filteredProducts}
//       ListHeaderComponent={<ListHeader />}
//       renderItem={({ item }) => {
//         const productId = item?._id || item?.id;
//         const isFavorite = favorites.has(productId);
//         const cartQuantity = cartItems[productId]?.quantity || 0;

//         return (
//           <ProductCard
//             id={item?._id}
//             title={item?.name || 'Unnamed Product'}
//             subtitle={item?.variety || ''}
//             price={item?.price || 0}
//             rating={item?.rating || 0}
//             image={item?.images?.[0] || 'https://via.placeholder.com/150'}
//             width={CARD_WIDTH}
//             onPress={() => openProductDetails(item)}
//             onAddToCart={() => handleAddToCart(item)}
//             onToggleFavorite={() => handleToggleFavorite(item)}
//             onUpdateQuantity={(diff) => handleUpdateQuantity(item, diff)}
//             cartQuantity={cartQuantity}
//             isFavorite={isFavorite}
//           />
//         );
//       }}
//       keyExtractor={(item, index) => (item?._id ? item._id.toString() : index.toString())}
//       numColumns={CARD_COLUMNS}
//       columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: CARD_MARGIN }}
//       showsVerticalScrollIndicator={false}
//       contentContainerStyle={{ paddingBottom: 40, backgroundColor: '#fff' }}
//       ListEmptyComponent={
//         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//           {/* <Image style={{ width: 120, height: 120 }} source={require('../')} /> */}
//           <Text>No products available.</Text>
//         </View>
//       }
//     />
//   );
// };

// const styles = StyleSheet.create({
//   containerRoot: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
//   errorHeader: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#D32F2F',
//     marginBottom: 10,
//   },
//   imageBox: {
//     width: '100%',
//     height: 250,
//   },
//   image: {
//     width: '100%',
//     height: '100%',
//     resizeMode: 'cover',
//   },
//   backBtn: {
//     position: 'absolute',
//     left: 10,
//     backgroundColor: 'rgba(0,0,0,0.4)',
//     borderRadius: 20,
//     padding: 5,
//   },
//   cardContainer: {
//     padding: 15,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//     marginBottom: 10,
//   },
//   rowBetween: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 5,
//   },
//   vendorName: {
//     fontSize: normalizeFont(16),
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   ratingBox: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: scale(4),
//     borderRadius: 8,
//     paddingHorizontal: 6,
//     paddingVertical: 3,
//     borderWidth: 1,
//     borderColor: '#4CAF50',
//   },
//   ratingText: {
//     color: '#000',
//     fontWeight: 'bold',
//   },
//   row: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//     gap: scale(3),
//   },
//   location: {
//     marginLeft: 5,
//     fontSize: normalizeFont(12),
//     color: 'rgba(66, 66, 66, 0.7)',
//   },
//   aboutHeader: {
//     fontSize: normalizeFont(13),
//     fontWeight: 'bold',
//     marginTop: moderateScale(5),
//     color: '#333',
//   },
//   about: {
//     fontSize: normalizeFont(12),
//     color: '#555',
//     marginTop: 5,
//     lineHeight: scale(15),
//   },
//   sectionHeader: {
//     fontSize: normalizeFont(16),
//     fontWeight: 'bold',
//     color: '#333',
//     marginVertical: 10,
//     marginLeft: 10,
//   },
//   noReviewText: {
//     textAlign: 'center',
//     color: '#757575',
//     paddingVertical: 10,
//   },
//   reviewCard: {
//     backgroundColor: 'rgba(255, 253, 246, 1)',
//     borderRadius: 8,
//     padding: moderateScale(15),
//     marginRight: moderateScale(10),
//     width: scale(300),
//     borderWidth: 1,
//     borderColor: '#eee',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 5,
//   },
//   avatar: {
//     width: scale(40),
//     height: scale(40),
//     borderRadius: 20,
//   },
//   name: {
//     fontWeight: 'bold',
//     fontSize: normalizeFont(12),
//   },
//   rating: {
//     fontSize: normalizeFont(12),
//     color: '#FFC107',
//     marginTop:moderateScale(4),
//   },
//   date: {
//     fontSize: normalizeFont(12),
//     color: '#9E9E9E',
//   },
//   comment: {
//     fontSize: normalizeFont(12),
//     color: '#555',
//     marginTop: 5,
//   },
//   productsHeaderContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 10,
//     marginTop: 10,
//     backgroundColor: '#fff',
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   dropdownButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 8,
//     backgroundColor: '#f0f0f0',
//     borderRadius: 5,
//     borderWidth: 1,
//     borderColor: '#ccc',
//     minWidth: 120,
//   },
//   dropdownButtonText: {
//     fontSize: 16,
//     marginRight: 5,
//     color: '#333',
//     fontWeight: '600',
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.1)',
//   },
//   modalContent: {
//     backgroundColor: '#fff',
//     borderRadius: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//     maxHeight: 235,
//     minWidth: 100,
//   },
//   modalScrollView: {
//     paddingVertical: 5,
//   },
//   modalItem: {
//     padding: 10,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   modalItemSelected: {
//     backgroundColor: '#e8f5e9',
//   },
//   modalItemText: {
//     fontSize: 16,
//     color: '#333',
//   },
//   modalItemTextSelected: {
//     fontWeight: 'bold',
//     color: '#4CAF50',
//   },
// });


