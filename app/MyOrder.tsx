
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MyOrdersScreen = () => {
    // State Management
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState(null);

    // Review Modal States
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [uploadedImages, setUploadedImages] = useState([]);
    const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
    const [submitLoading, setSubmitLoading] = useState(false);

    const navigation = useNavigation();

    // API Configuration
    const API_BASE = 'https://393rb0pp-5000.inc1.devtunnels.ms';
    const API_ENDPOINT = `${API_BASE}/api/buyer/orders`;

    // Get status display text
    const getStatusDisplay = (status) => {
        const statusMap = {
            'Paid': 'Delivered',
            'In-process': 'Picked Up',
            'Pending': 'Pending',
            'Cancelled': 'Cancelled',
            'Completed':'Completed',
        };
        return statusMap[status] || status;
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
        return `On ${date.toLocaleDateString('en-US', options)}`;
    };

    // Transform API data to component format
    const transformOrderData = (apiOrders) => {
        return apiOrders.map(order => {
            return {
                id: order._id,
                orderId: order.orderId,
                status: getStatusDisplay(order.orderStatus),
                date: formatDate(order.createdAt),
                orderStatus: order.orderStatus,
                totalPrice: order.totalPrice,
                orderType: order.orderType,
                items: (order.items || []).map(item => ({
                    id: item._id,
                    productName: item.product?.name || 'Unknown Product',
                    productImage: item.product?.images?.[0] || 'https://via.placeholder.com/150',
                    quantity: item.quantity || 0,
                    price:item.product?.price|| 10,
                    productId: item.product?._id,
                    vendorName: item.vendor?.name || 'Unknown Vendor',
                    canReview: order.orderStatus === 'Paid' || order.orderStatus === 'In-process',
                    rating: 0
                }))
            };
        });
    };

    // Fetch Orders from API
    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get token from AsyncStorage
            const token = await AsyncStorage.getItem('userToken');
            
            if (!token) {
                throw new Error('No authentication token found. Please login again.');
            }

            // API call with authorization header
            const response = await axios.get(API_ENDPOINT, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success && response.data.orders) {
                const transformedOrders = transformOrderData(response.data.orders);
                setOrders(transformedOrders);
            } else {
                throw new Error('Invalid response format from server');
            }

        } catch (error) {
            console.error('Error fetching orders:', error);
            
            if (error.response?.status === 401) {
                setError('Session expired. Please login again.');
                Alert.alert('Session Expired', 'Please login again to continue.', [
                    { text: 'OK', onPress: () => navigation.navigate('login') }
                ]);
            } else if (error.response?.status === 404) {
                setOrders([]);
            } else {
                setError(error.message || 'Failed to fetch orders');
            }

        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchOrders();
    }, []);

    // Pull to refresh
    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    // Handle star rating for product
    const handleStarRating = (orderId, itemId, starIndex) => {
        const updatedOrders = orders.map(order => {
            if (order.id === orderId) {
                return {
                    ...order,
                    items: order.items.map(item => {
                        if (item.id === itemId) {
                            return { ...item, rating: starIndex + 1 };
                        }
                        return item;
                    })
                };
            }
            return order;
        });
        setOrders(updatedOrders);
        Alert.alert('Rating Updated', `You rated this item ${starIndex + 1} star${starIndex > 0 ? 's' : ''}`);
    };

    // Open Review Modal
    const openReviewModal = (orderId, productId) => {
        setSelectedOrderId(orderId);
        setSelectedProductId(productId);
        setReviewModalVisible(true);
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    // Close Review Modal
    const closeReviewModal = () => {
        Animated.timing(slideAnim, {
            toValue: SCREEN_HEIGHT,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setReviewModalVisible(false);
            setReviewRating(0);
            setReviewText('');
            setUploadedImages([]);
            setSelectedOrderId(null);
            setSelectedProductId(null);
        });
    };

    // Handle Review Rating in Modal
    const handleReviewRating = (rating) => {
        setReviewRating(rating);
    };

    // Submit Review
    const submitReview = async () => {
  if (reviewRating === 0) {
    Alert.alert('Rating Required', 'Please select a rating before submitting.');
    return;
  }

  try {
    setSubmitLoading(true);

    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      Alert.alert('Error', 'User not logged in. Please log in again.');
      setSubmitLoading(false);
      return;
    }

    // Ensure we have a product id: use selectedProductId or fallback from selectedOrderId
    let productId = selectedProductId;
    if (!productId && selectedOrderId) {
      const selectedOrder = orders.find(o => o.id === selectedOrderId || o.orderId === selectedOrderId);
      const firstItem = selectedOrder?.allItems?.[0] || selectedOrder?.items?.[0];
      productId = firstItem?.product?._id ?? firstItem?.product?.id ?? firstItem?.productId;
    }

    if (!productId) {
      Alert.alert('Error', 'Product id missing. Cannot submit review.');
      setSubmitLoading(false);
      return;
    }

    // Build FormData (works for images & text)
    const form = new FormData();
    form.append('orderId', selectedOrderId || '');
    form.append('productId', productId);
    form.append('rating', String(reviewRating));
    form.append('comment', reviewText || '');

    if (Array.isArray(uploadedImages) && uploadedImages.length > 0) {
      uploadedImages.forEach((img) => {
        const uri = img.uri || img.uriString || (img.assets && img.assets[0]?.uri);
        if (!uri) return;
        const filename = uri.split('/').pop().split('?')[0];
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1].toLowerCase() : 'jpg';
        const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : `image/${ext}`;

        form.append('images', {
          uri,
          name: filename,
          type: mime,
        });
      });
    }

    const response = await axios.post(
      `${API_BASE}/api/buyer/reviews/${productId}`,
      form,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      }
    );

    console.log('Kya Ja raha hai REview me (response):', response.data);

    if (response.status === 200 || response.status === 201 || response.data?.success) {
      Alert.alert('Review Submitted', 'Thank you for your review!');
      closeReviewModal();
    } else {
      console.warn('Review API returned non-success:', response.data);
      Alert.alert('Error', response.data?.message || 'Failed to submit review. Please try again.');
    }
  } catch (err) {
    console.error('Error submitting review:', err.response?.data ?? err.message ?? err);
    const serverMsg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null);
    Alert.alert('Error', serverMsg || 'Failed to submit review. Please try again.');
  } finally {
    setSubmitLoading(false);
  }
};




    // Request camera and gallery permissions
    const requestPermissions = async () => {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
            Alert.alert('Permission Required', 'Please grant camera and photo library permissions to upload images.');
            return false;
        }
        return true;
    };

    // Handle image selection
    const selectImage = async () => {
        if (uploadedImages.length >= 5) {
            Alert.alert('Limit Reached', 'You can upload maximum 5 images.');
            return;
        }

        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        Alert.alert(
            'Select Image',
            'Choose an option',
            [
                { text: 'Camera', onPress: () => openCamera() },
                { text: 'Gallery', onPress: () => openGallery() },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    // Open camera
    const openCamera = async () => {
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                setUploadedImages(prev => [...prev, result.assets[0]]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to open camera. Please try again.');
        }
    };

    // Open gallery
    const openGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                setUploadedImages(prev => [...prev, result.assets[0]]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to open gallery. Please try again.');
        }
    };

    // Remove uploaded image
    const removeImage = (index) => {
        Alert.alert(
            'Remove Image',
            'Are you sure you want to remove this image?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        setUploadedImages(prev => prev.filter((_, i) => i !== index));
                    }
                }
            ]
        );
    };

    // Handle write review
    const handleWriteReview = (orderId, productId) => {
        openReviewModal(orderId, productId);
    };

    // Handle product item press
    const handleProductPress = (orderId, productId) => {
        try {
            navigation.navigate('ViewOrderProduct', { orderId: orderId, productId: productId });
        } catch (error) {
            console.error('Navigation error:', error);
            Alert.alert('Error', 'Unable to open product details. Please try again.');
        }
    };

    // Real-time search filter using useMemo for performance
    const filteredOrders = useMemo(() => {
        if (!searchQuery.trim()) {
            return orders;
        }

        const searchLower = searchQuery.toLowerCase().trim();
        
        return orders.filter(order => {
            return (
                order.orderId.toLowerCase().includes(searchLower) ||
                order.status.toLowerCase().includes(searchLower) ||
                order.items.some(item => 
                    item.productName.toLowerCase().includes(searchLower) ||
                    item.vendorName.toLowerCase().includes(searchLower)
                )
            );
        });
    }, [orders, searchQuery]);

    // Get status color
    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'delivered':
                return '#4CAF50';
            case 'picked up':
                return '#FF9800';
            case 'cancelled':
                return '#F44336';
            case 'pending':
                return '#2196F3';
            default:
                return '#666';
        }
    };

    const backOrder = () => {
        navigation.navigate("profile");
    };

    // Clear search
    const clearSearch = () => {
        setSearchQuery('');
    };

    // Render star rating for each product
    const renderStarRating = (order, item) => {
        return (
            <View style={styles.ratingContainer}>
                <Text style={styles.rateText}>Rate this Item <Text style={styles.required}>*</Text> </Text>
                <View style={styles.ratingDiv}>
                    <View style={styles.starsContainer}>
                        {[0, 1, 2, 3, 4].map((starIndex) => (
                            <TouchableOpacity
                                key={starIndex}
                                onPress={() => handleStarRating(order.id, item.id, starIndex)}
                                style={styles.starButton}
                            >
                                <Ionicons 
                                    name={starIndex < item.rating ? "star" : "star-outline"} 
                                    size={24} 
                                    color={starIndex < item.rating ? "#FFD700" : "#E0E0E0"} 
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.reviewButton}
                        onPress={() => handleWriteReview(order.id, item.productId)}
                    >
                        <Text style={styles.reviewButtonText}>Write a review</Text>
                        <Ionicons name="chevron-forward" size={16} color="#2196F3" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // Render Review Modal Stars
    const renderModalStars = () => {
        return (
            <View style={styles.modalStarsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => handleReviewRating(star)}
                        style={styles.modalStarButton}
                    >
                        <Ionicons
                            name={star <= reviewRating ? "star" : "star-outline"}
                            size={36}
                            color={star <= reviewRating ? "#FFD700" : "#E0E0E0"}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    // Render single product item within an order
const renderProductItem = ({ item: order, index: orderIndex }) => (
  <View key={order.id || order.orderId} style={styles.orderCard}>
    {/* Products List */}
    <View>
      {Array.isArray(order.items) && order.items.length > 0 ? (
        order.items.map((product, productIndex) => (
          <View key={product.id || product.productId || `${order.id || order.orderId}_p_${productIndex}`}>
            {/* --- Order Header: show only once, before the first product of this order --- */}
            {productIndex === 0 && (
              <View style={styles.orderHeader}>
                <View>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                    {order.status}
                  </Text>
                  <Text style={styles.orderIdText}>{order.orderId}</Text>
                </View>
                <Text style={styles.dateText}>{order.date}</Text>
              </View>
            )}

            {/* Product Info */}
            <TouchableOpacity
              style={styles.productContainer}
              onPress={() => handleProductPress(order.id || order.orderId, product.productId)}
              activeOpacity={0.9}
            >
              <Image source={{ uri: product.productImage || 'https://via.placeholder.com/150' }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productDescription} numberOfLines={1}>
                  {product.productName || product.name || 'Unnamed product'}
                </Text>
                <Text style={styles.productDescription}>Price: ₹{product.price ?? '0'}</Text>
                <Text style={styles.productDescription}>Qty: {product.quantity ?? product.qty ?? 1}</Text>
                {/* vendor name if present */}
                {product.vendorName ? <Text style={styles.vendorName}>By: {product.vendorName}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            {/* Rating Section (if product-level review is allowed). 
                Using your existing renderStarRating signature — you passed (order, product) earlier */}
            {product.canReview && renderStarRating(order, product)}

            {/* Separator between products (except after last product) */}
            {productIndex < (order.items.length - 1) && <View style={styles.productSeparator} />}
          </View>
        ))
      ) : (
        // fallback when order has no items
        <View style={{ paddingVertical: 8 }}>
          <Text style={{ color: '#666' }}>No products in this order</Text>
        </View>
      )}
    </View>

    {/* Price Info - shown after all products for this order */}
    <View style={styles.priceContainer}>
      <Text style={styles.priceLabel}>Total Price:</Text>
      <Text style={styles.priceValue}>₹{order.totalPrice ?? 0}</Text>
    </View>
  </View>
);

    // Loading component
    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={backOrder} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Orders</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading orders...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Main render
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={backOrder} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Orders</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search Product, Status, Order ID..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Search Results Counter */}
            {searchQuery.length > 0 && (
                <View style={styles.searchResultsContainer}>
                    <Text style={styles.searchResultsText}>
                        {filteredOrders.length} result{filteredOrders.length !== 1 ? 's' : ''} found for "{searchQuery}"
                    </Text>
                    {filteredOrders.length > 0 && (
                        <TouchableOpacity onPress={clearSearch}>
                            <Text style={styles.clearAllText}>Clear</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Orders List */}
            {error && filteredOrders.length === 0 && !searchQuery ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#F44336" style={styles.emptyIcon} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : filteredOrders.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons
                        name={searchQuery ? "search" : "receipt-outline"}
                        size={64}
                        color="#ccc"
                        style={styles.emptyIcon}
                    />
                    <Text style={styles.emptyText}>
                        {searchQuery ? 'No results found' : 'No orders found'}
                    </Text>
                    <Text style={styles.emptySubText}>
                        {searchQuery
                            ? `No orders match "${searchQuery}". Try different keywords.`
                            : 'Your orders will appear here'
                        }
                    </Text>
                    {searchQuery && (
                        <TouchableOpacity style={styles.clearSearchButton} onPress={clearSearch}>
                            <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    renderItem={({ item, index }) => renderProductItem({ item, index })}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
                    }
                />
            )}

            {/* Review Modal */}
            <Modal
                visible={reviewModalVisible}
                transparent={true}
                animationType="none"
                onRequestClose={closeReviewModal}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={closeReviewModal}
                    />
                    <Animated.View
                        style={[
                            styles.modalContainer,
                            {
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        {/* Modal Handle */}
                        <View style={styles.modalHandle} />

                        {/* Modal Content */}
                        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                            {/* Product Image Section */}
                            <View style={styles.modalProductSection}>
                                <View style={styles.modalProductImageContainer}>
                                    <Image
                                        source={{
                                            uri: selectedOrderId && selectedProductId ?
                                                orders.find(order => order.id === selectedOrderId)?.items.find(item => item.productId === selectedProductId)?.productImage :
                                                'https://via.placeholder.com/150'
                                        }}
                                        style={styles.modalProductImage}
                                    />
                                </View>
                            </View>

                            {/* Rating Section */}
                            <Text style={styles.modalRateText}>
                                Rate this item <Text style={styles.modalRequired}>*</Text>
                            </Text>
                            {renderModalStars()}

                            {/* Image Upload Section */}
                            <Text style={styles.modalImageText}>Add images of the product</Text>

                            {/* Uploaded Images Display */}
                            {uploadedImages.length > 0 && (
                                <View style={styles.uploadedImagesContainer}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {uploadedImages.map((image, index) => (
                                            <View key={index} style={styles.uploadedImageWrapper}>
                                                <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
                                                <TouchableOpacity
                                                    style={styles.removeImageButton}
                                                    onPress={() => removeImage(index)}
                                                >
                                                    <Ionicons name="close-circle" size={20} color="#FF4444" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            <TouchableOpacity style={styles.modalImageUpload} onPress={selectImage}>
                                <View style={styles.modalImageUploadContent}>
                                    <Ionicons name="camera-outline" size={32} color="#999" />
                                    <Text style={styles.modalImageUploadText}>
                                        Add other photos of your product (max 5)
                                    </Text>
                                    <Text style={styles.modalImageCount}>
                                        {uploadedImages.length}/5 images uploaded
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* Review Text Section */}
                            <Text style={styles.modalReviewText}>Write a review</Text>
                            <TextInput
                                style={styles.modalReviewInput}
                                placeholder="Share your experience with this product..."
                                placeholderTextColor="#999"
                                value={reviewText}
                                onChangeText={setReviewText}
                                multiline={true}
                                numberOfLines={6}
                                textAlignVertical="top"
                            />

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={styles.modalSubmitButton}
                                onPress={submitReview}
                            >
                                <Text style={styles.modalSubmitButtonText}>✓ Submit</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },

    // Header Styles
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    placeholder: {
        width: 32,
    },

    ratingDiv: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    // Search Styles
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        gap: 12,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    clearButton: {
        marginLeft: 8,
        padding: 2,
    },
    filterButton: {
        padding: 12,
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },

    // Search Results Counter
    searchResultsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f8f8f8',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    searchResultsText: {
        fontSize: 14,
        color: '#666',
    },
    clearAllText: {
        fontSize: 14,
        color: '#2196F3',
        fontWeight: '600',
    },

    // List Styles
    listContainer: {
        padding: 16,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    // Order Header
    orderHeader: {
        marginBottom: 16,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 12,
        color: '#666',
    },

    // Product Section
    productContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 377,
        height: 79,
        marginBottom: 16,
        backgroundColor: 'rgba(249, 249, 249, 1)',
        padding: 15,
        borderRadius: 10,
    },
    productImage: {
        width:60,
        height:60,
        borderRadius: 3,
        marginRight: 12,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    productDescription: {
        fontSize:15,
        color: '#666',
    },

    // Rating Section
    rateText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
    },
    required: {
        color: '#f44336',
        fontSize: 19,
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 7,
        gap: 3,
    },
    starButton: {
        padding: 2,
    },
    reviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
    },
    reviewButtonText: {
        fontSize: 14,
        color: '#2196F3',
        marginRight: 4,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalBackdrop: {
        flex: 1,
    },
    modalContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: SCREEN_HEIGHT * 0.88,
        borderWidth: 2,
        borderColor: 'rgba(255, 202, 40, 0.5)',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    modalContent: {
        padding: 10,
        paddingBottom: 40,
        flex: 1,
    },
    modalProductSection: {
        alignItems: 'center',
        marginBottom: 10,
    },
    modalProductImageContainer: {
        width: 110,
        height: 110,
        borderRadius: 60,
        overflow: 'hidden',
        backgroundColor: '#FFF',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    modalProductImage: {
        width: '100%',
        height: '100%',
    },
    modalRateText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 12,
        fontWeight: '500',
    },
    modalRequired: {
        color: '#f44336',
        fontSize: 16,
    },
    modalStarsContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        justifyContent: 'flex-start',
        gap: 8,
    },
    modalStarButton: {
        padding: 4,
    },
    modalImageText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 12,
        fontWeight: '500',
    },
    modalImageUpload: {
        borderWidth: 2,
        borderColor: 'rgba(255, 202, 40, 0.5)',
        borderRadius: 8,
        padding: 20,
        marginBottom: 24,
        backgroundColor: '#fff',
    },
    modalImageUploadContent: {
        alignItems: 'center',
    },
    modalImageUploadText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
    },
    modalImageCount: {
        fontSize: 10,
        color: '#666',
        textAlign: 'center',
        marginTop: 4,
        fontWeight: '500',
    },
    uploadedImagesContainer: {
        marginBottom: 16,
    },
    uploadedImageWrapper: {
        position: 'relative',
        marginRight: 12,
    },
    uploadedImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
    },
    removeImageButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#FFF',
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    modalReviewText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 12,
        fontWeight: '500',
    },
    modalReviewInput: {
        borderWidth: 1,
        borderColor: 'rgba(255, 202, 40, 0.5)',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#333',
        backgroundColor: '#FFF',
        marginBottom: 24,
        minHeight: 100,
    },
    modalSubmitButton: {
        backgroundColor: 'rgba(76, 175, 80, 1)',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalSubmitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },

    // Loading & Error States
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
        paddingHorizontal: 20,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
    },
    errorText: {
        fontSize: 16,
        color: '#f44336',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyIcon: {
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    clearSearchButton: {
        marginTop: 16,
        backgroundColor: '#2196F3',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    clearSearchButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    priceContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 10,
  paddingHorizontal: 8,
  marginTop: 12,
  backgroundColor: '#fafafa',    // subtle background to separate section
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#f0f0f0',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 4,
  elevation: 1,
},

priceLabel: {
  fontSize: 14,
  color: '#666',
  fontWeight: '500',
},

priceValue: {
  fontSize: 16,
  color: '#222',
  fontWeight: '700',
},
});

export default MyOrdersScreen;