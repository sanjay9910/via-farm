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
import { moderateScale, normalizeFont, scale } from './Responsive';

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
    const API_BASE = 'https://viafarm-1.onrender.com';
    const API_ENDPOINT = `${API_BASE}/api/buyer/orders`;

    // Get status display text
    const getStatusDisplay = (status) => {
        const statusMap = {
            'Paid': 'Delivered',
            'In-process': 'Picked Up',
            'Pending': 'Pending',
            'Cancelled': 'Cancelled',
            'Completed': 'Completed',
        };
        return statusMap[status] || status;
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
        return `${date.toLocaleDateString('en-US', options)}`;
    };

    // Transform API data to component format
    const transformOrderData = (apiOrders) => {
        return apiOrders.map(order => {
            const items = (order.items || []).map(item => {
                const productObj = item.product || {};
                const ratingFromApi = item.rating ?? item.reviewRating ?? productObj.rating ?? productObj.avgRating ?? 0;
                const numericRating = typeof ratingFromApi === 'string' ? parseFloat(ratingFromApi) : (ratingFromApi || 0);
                return {
                    id: item._id,
                    productName: productObj.name || item.productName || 'Unknown Product',
                    productImage: (productObj.images && productObj.images[0]) || productObj.image || item.image || 'https://via.placeholder.com/150',
                    quantity: item.quantity || 0,
                    price: productObj.price || item.price || 0,
                    productId: productObj._id || item.productId || item._id,
                    vendorName: item.vendor?.name || productObj.vendor?.name || 'Unknown Vendor',
                    canReview: (order.orderStatus === 'Paid' || order.orderStatus === 'In-process' || order.orderStatus === 'Completed'),
                    rating: Number.isFinite(numericRating) ? Math.max(0, Math.min(5, numericRating)) : 0
                };
            });

            return {
                id: order._id,
                orderId: order.orderId || (`#${order._id?.slice?.(0, 6) ?? ''}`),
                status: getStatusDisplay(order.orderStatus),
                date: formatDate(order.createdAt),
                orderStatus: order.orderStatus,
                totalPrice: order.totalPrice || order.total || 0,
                orderType: order.orderType,
                items,
                // Store full order data for passing to details screen
                fullOrder: order
            };
        });
    };

    // Fetch Orders from API
    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                throw new Error('No authentication token found. Please login again.');
            }

            const response = await axios.get(API_ENDPOINT, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && (response.data.orders || response.data.data)) {
                const apiOrderArray = response.data.orders ?? response.data.data;
                const transformedOrders = transformOrderData(apiOrderArray);
                setOrders(transformedOrders);
            } else if (response.data?.success && Array.isArray(response.data)) {
                const transformedOrders = transformOrderData(response.data);
                setOrders(transformedOrders);
            } else {
                setOrders([]);
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

            let productId = selectedProductId;
            if (!productId && selectedOrderId) {
                const selectedOrder = orders.find(o => o.id === selectedOrderId || o.orderId === selectedOrderId);
                const firstItem = selectedOrder?.items?.[0];
                productId = firstItem?.productId;
            }

            if (!productId) {
                Alert.alert('Error', 'Product id missing. Cannot submit review.');
                setSubmitLoading(false);
                return;
            }

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

            if (response.status === 200 || response.status === 201 || response.data?.success) {
                Alert.alert('Review Submitted', 'Thank you for your review!');
                closeReviewModal();
            } else {
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

    // Request permissions
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

    const handleWriteReview = (orderId, productId) => {
        openReviewModal(orderId, productId);
    };

    // Navigate to order details with full order data
    const handleOrderCardPress = (order) => {
        try {
            navigation.navigate('ViewOrderDetails', {
                order: order.fullOrder || order,
                orderId: order.id
            });
        } catch (error) {
            console.error('Navigation error:', error);
            Alert.alert('Error', 'Unable to open order details. Please try again.');
        }
    };

    // Navigate to product details
    const handleProductPress = (orderId, productId) => {
        try {
            navigation.navigate('ViewOrderProduct', {
                orderId: orderId,
                productId: productId
            });
        } catch (error) {
            console.error('Navigation error:', error);
            Alert.alert('Error', 'Unable to open product details. Please try again.');
        }
    };

    // Real-time search filter
    const filteredOrders = useMemo(() => {
        if (!searchQuery.trim()) {
            return orders;
        }

        const searchLower = searchQuery.toLowerCase().trim();

        return orders.filter(order => {
            return (
                (order.orderId || '').toLowerCase().includes(searchLower) ||
                (order.status || '').toLowerCase().includes(searchLower) ||
                order.items.some(item =>
                    (item.productName || '').toLowerCase().includes(searchLower) ||
                    (item.vendorName || '').toLowerCase().includes(searchLower)
                )
            );
        });
    }, [orders, searchQuery]);

    // Get status color
    const getStatusColor = (status) => {
        switch ((status || '').toLowerCase()) {
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

    const clearSearch = () => {
        setSearchQuery('');
    };

    // Render star rating
    const renderStarRating = (order, item) => {
        const ratingVal = Math.max(0, Math.min(5, Number(item.rating || 0)));

        return (
            <View style={styles.ratingContainer}>
                <Text style={styles.rateText}>Rate this Item </Text>
                <View style={styles.ratingDiv}>
                    <View style={styles.starsContainer}>
                        {[0, 1, 2, 3, 4].map((starIndex) => (
                            <TouchableOpacity
                                key={starIndex}
                                onPress={() => handleStarRating(order.id, item.id, starIndex)}
                                style={styles.starButton}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={starIndex < ratingVal ? "star" : "star-outline"}
                                    size={22}
                                    color={starIndex < ratingVal ? "#FFD700" : "#E0E0E0"}
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

    // Render modal stars
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

    // Render product item
    const renderProductItem = ({ item: order, index: orderIndex }) => (
        <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => handleOrderCardPress(order)}
            style={styles.orderCardTouchable}
            key={order.id || order.orderId}
        >
            <View style={styles.orderCard}>
                <View>
                    {Array.isArray(order.items) && order.items.length > 0 ? (
                        order.items.map((product, productIndex) => (
                            <View key={product.id || product.productId || `${order.id || order.orderId}_p_${productIndex}`}>
                                {productIndex === 0 && (
                                    <View style={styles.orderHeader}>
                                        <View>
                                            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                                                {order.status}
                                            </Text>
                                            <Text style={{ fontSize: normalizeFont(12) }}>{order.orderId}</Text>
                                        </View>
                                        <Text style={styles.dateText}>{order.date}</Text>
                                    </View>
                                )}

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
                                        {product.vendorName ? <Text style={{ fontSize: normalizeFont(12),color:'grey' }}>By: {product.vendorName}</Text> : null}
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#666" />
                                </TouchableOpacity>

                                {product.canReview && renderStarRating(order, product)}

                                {productIndex < (order.items.length - 1) && <View style={styles.productSeparator} />}
                            </View>
                        ))
                    ) : (
                        <View style={{ paddingVertical: 8 }}>
                            <Text style={{ color: '#666' }}>No products in this order</Text>
                        </View>
                    )}
                </View>

                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Total Price:</Text>
                    <Text style={styles.priceValue}>₹{order.totalPrice ?? 0}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={backOrder} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Orders</Text>
                <View style={styles.placeholder} />
            </View>

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
                        <View style={styles.modalHandle} />

                        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
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

                            <Text style={styles.modalRateText}>
                                Rate this item <Text style={styles.modalRequired}>*</Text>
                            </Text>
                            {renderModalStars()}

                            <Text style={styles.modalImageText}>Add images of the product</Text>

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

                            <TouchableOpacity
                                style={styles.modalSubmitButton}
                                onPress={submitReview}
                            >
                                <Text style={styles.modalSubmitButtonText}>{submitLoading ? 'Submitting...' : '✓ Submit'}</Text>
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
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(16),
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        padding: moderateScale(4),
    },
    headerTitle: {
        fontSize: normalizeFont(18),
        fontWeight: '600',
        color: '#333',
    },
    placeholder: {
        width: scale(32),
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
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(12),
        backgroundColor: '#fff',
        gap: scale(12),
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: scale(44),
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    searchIcon: {
        marginRight: moderateScale(8),
    },
    searchInput: {
        flex: 1,
        fontSize: normalizeFont(11),
        color: '#333',
    },
    clearButton: {
        marginLeft: moderateScale(8),
        padding: moderateScale(2),
    },
    filterButton: {
        padding: moderateScale(12),
        backgroundColor: '#f8f8f8',
        borderRadius: moderateScale(8),
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },

    // Search Results Counter
    searchResultsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(8),
        backgroundColor: '#f8f8f8',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    searchResultsText: {
        fontSize: normalizeFont(13),
        color: '#666',
    },
    clearAllText: {
        fontSize: normalizeFont(13),
        color: '#2196F3',
        fontWeight: '600',
    },

    // List Styles
    listContainer: {
        padding: moderateScale(16),
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        marginBottom: moderateScale(16),
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
        marginBottom: moderateScale(16),
    },
    statusText: {
        fontSize: normalizeFont(12),
        fontWeight: '600',
        marginBottom: moderateScale(4),
    },
    dateText: {
        fontSize: normalizeFont(11),
        color: '#666',
    },

    // Product Section
    productContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: scale(85),
        marginBottom: moderateScale(16),
        backgroundColor: 'rgba(249, 249, 249, 1)',
        padding: moderateScale(15),
        borderRadius: moderateScale(10),
    },
    productImage: {
        width: scale(75),
        height: scale(75),
        borderRadius: 3,
        marginRight: moderateScale(12),
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: normalizeFont(13),
        fontWeight: '600',
        color: '#333',
        marginBottom: moderateScale(4),
    },
    productDescription: {
        fontSize: normalizeFont(12),
        paddingVertical: 1,
        color: '#333',
    },

    // Rating Section
    rateText: {
        fontSize: normalizeFont(13),
        color: '#333',
        marginBottom: moderateScale(8),
    },
    required: {
        color: '#f44336',
        fontSize: normalizeFont(15),
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: moderateScale(7),
        gap: 3,
    },
    starButton: {
        padding: moderateScale(2),
    },
    reviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
    },
    reviewButtonText: {
        fontSize: normalizeFont(12),
        color: '#2196F3',
        marginRight: moderateScale(4),
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
        borderTopLeftRadius: moderateScale(20),
        borderTopRightRadius: moderateScale(20),
        maxHeight: SCREEN_HEIGHT * 0.88,
        borderWidth: 2,
        borderColor: 'rgba(255, 202, 40, 0.5)',
    },
    modalHandle: {
        width: scale(40),
        height: scale(4),
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: moderateScale(12),
        marginBottom: moderateScale(8),
    },
    modalContent: {
        padding: moderateScale(10),
        paddingBottom: moderateScale(40),
        flex: 1,
    },
    modalProductSection: {
        alignItems: 'center',
        marginBottom: moderateScale(10),
    },
    modalProductImageContainer: {
        width: scale(110),
        height: scale(110),
        borderRadius: moderateScale(60),
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
        fontSize: normalizeFont(12),
        color: '#333',
        marginBottom: moderateScale(12),
        fontWeight: '500',
    },
    modalRequired: {
        color: '#f44336',
        fontSize: normalizeFont(13),
    },
    modalStarsContainer: {
        flexDirection: 'row',
        marginBottom: moderateScale(24),
        justifyContent: 'flex-start',
        gap: moderateScale(8),
    },
    modalStarButton: {
        padding: moderateScale(4),
    },
    modalImageText: {
        fontSize: normalizeFont(14),
        color: '#333',
        marginBottom: moderateScale(12),
        fontWeight: '500',
    },
    modalImageUpload: {
        borderWidth: moderateScale(2),
        borderColor: 'rgba(255, 202, 40, 0.5)',
        borderRadius: 8,
        padding: moderateScale(20),
        marginBottom: moderateScale(24),
        backgroundColor: '#fff',
    },
    modalImageUploadContent: {
        alignItems: 'center',
    },
    modalImageUploadText: {
        fontSize: normalizeFont(10),
        color: '#999',
        textAlign: 'center',
        marginTop: moderateScale(8),
    },
    modalImageCount: {
        fontSize: normalizeFont(10),
        color: '#666',
        textAlign: 'center',
        marginTop: moderateScale(4),
        fontWeight: '500',
    },
    uploadedImagesContainer: {
        marginBottom: moderateScale(16),
    },
    uploadedImageWrapper: {
        position: 'relative',
        marginRight: moderateScale(12),
    },
    uploadedImage: {
        width: scale(70),
        height: scale(70),
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
    },
    removeImageButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#FFF',
        borderRadius: moderateScale(10),
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
        fontSize: normalizeFont(12),
        color: '#333',
        marginBottom: moderateScale(12),
        fontWeight: '500',
    },
    modalReviewInput: {
        borderWidth: 1,
        borderColor: 'rgba(255, 202, 40, 0.5)',
        borderRadius: moderateScale(8),
        padding: moderateScale(12),
        fontSize: normalizeFont(12),
        color: '#333',
        backgroundColor: '#FFF',
        marginBottom: moderateScale(24),
        minHeight: scale(100),
    },
    modalSubmitButton: {
        backgroundColor: 'rgba(76, 175, 80, 1)',
        paddingVertical: moderateScale(16),
        borderRadius: 8,
        alignItems: 'center',
    },
    modalSubmitButtonText: {
        color: '#FFF',
        fontSize: normalizeFont(13),
        fontWeight: '600',
    },

    // Loading & Error States
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: moderateScale(50),
        paddingHorizontal: moderateScale(20),
    },
    loadingText: {
        fontSize: normalizeFont(13),
        color: '#666',
        marginTop: moderateScale(12),
    },
    errorText: {
        fontSize: normalizeFont(13),
        color: '#f44336',
        textAlign: 'center',
        marginBottom: moderateScale(20),
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: moderateScale(20),
        paddingVertical: moderateScale(10),
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: normalizeFont(12),
        fontWeight: '600',
    },
    emptyIcon: {
        marginBottom: moderateScale(16),
    },
    emptyText: {
        fontSize: normalizeFont(15),
        fontWeight: '600',
        color: '#333',
        marginBottom: moderateScale(8),
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: normalizeFont(12),
        color: '#666',
        textAlign: 'center',
        lineHeight: scale(20),
    },
    clearSearchButton: {
        marginTop: moderateScale(16),
        backgroundColor: '#2196F3',
        paddingHorizontal: moderateScale(20),
        paddingVertical: moderateScale(10),
        borderRadius: moderateScale(8),
    },
    clearSearchButtonText: {
        color: '#fff',
        fontSize: normalizeFont(12),
        fontWeight: '600',
    },
    priceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: moderateScale(10),
        paddingHorizontal: moderateScale(8),
        marginTop: moderateScale(12),
        backgroundColor: '#fafafa',
        borderRadius: moderateScale(8),
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },

    priceLabel: {
        fontSize: normalizeFont(12),
        color: '#666',
        fontWeight: '500',
    },

    priceValue: {
        fontSize: normalizeFont(12),
        color: '#222',
        fontWeight: '700',
    },
});

export default MyOrdersScreen;