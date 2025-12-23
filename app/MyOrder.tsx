// MyOrdersScreen.jsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
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
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, normalizeFont, scale } from './Responsive';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

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
                setError('No authentication token found. Please login again.');
                navigation.navigate('login');
                return;
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

        } catch (err) {
            console.error('Error fetching orders:', err);
            const status = err?.response?.status;
            if (status === 401) {
                setError('Session expired. Please login again.');
                navigation.navigate('login');
            } else if (status === 404) {
                setOrders([]);
            } else {
                setError(err.message || 'Failed to fetch orders');
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
        // Silent update - no alert
        console.log(`Rated item ${itemId} in order ${orderId} as ${starIndex + 1}`);
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
            setError(null);
        });
    };

    const handleReviewRating = (rating) => {
        setReviewRating(rating);
    };

    // Submit Review
    const submitReview = async () => {
        if (reviewRating === 0) {
            // no alert — set error state for UI feedback
            setError('Please select a rating before submitting.');
            return;
        }

        try {
            setSubmitLoading(true);
            setError(null);

            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                setError('User not logged in. Please log in again.');
                setSubmitLoading(false);
                navigation.navigate('login');
                return;
            }

            let productId = selectedProductId;
            if (!productId && selectedOrderId) {
                const selectedOrder = orders.find(o => o.id === selectedOrderId || o.orderId === selectedOrderId);
                const firstItem = selectedOrder?.items?.[0];
                productId = firstItem?.productId;
            }

            if (!productId) {
                setError('Product id missing. Cannot submit review.');
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
                console.log('Review submitted successfully');
                closeReviewModal();
                // optionally refresh orders to reflect review - keep lightweight:
                fetchOrders();
            } else {
                setError(response.data?.message || 'Failed to submit review. Please try again.');
                console.warn('Review submit failed response:', response.data);
            }
        } catch (err) {
            console.error('Error submitting review:', err.response?.data ?? err.message ?? err);
            const serverMsg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : null);
            setError(serverMsg || 'Failed to submit review. Please try again.');
        } finally {
            setSubmitLoading(false);
        }
    };

    // Request permissions
    const requestPermissions = async () => {
        try {
            const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
            const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
                setError('Please grant camera and photo library permissions to upload images.');
                console.warn('Permissions not granted:', { cameraStatus, galleryStatus });
                return false;
            }
            return true;
        } catch (err) {
            console.error('Permission request error:', err);
            setError('Permission error. Please try again.');
            return false;
        }
    };

    // Handle image selection
    const selectImage = async () => {
        if (uploadedImages.length >= 5) {
            setError('You can upload maximum 5 images.');
            console.warn('Upload limit reached');
            return;
        }

        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        // Default to open gallery for fast flow. If you want camera by default replace with openCamera()
        await openGallery();
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
            console.error('Failed to open camera:', error);
            setError('Failed to open camera. Please try again.');
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
            console.error('Failed to open gallery:', error);
            setError('Failed to open gallery. Please try again.');
        }
    };

    const removeImage = (index) => {
        // immediate removal without confirmation (as requested)
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
        console.log(`Image at index ${index} removed`);
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
        } catch (err) {
            console.error('Navigation error:', err);
            setError('Unable to open order details. Please try again.');
        }
    };

    // Navigate to product details
    const handleProductPress = (orderId, productId) => {
        try {
            navigation.navigate('ViewOrderProduct', {
                orderId: orderId,
                productId: productId
            });
        } catch (err) {
            console.error('Navigation error:', err);
            setError('Unable to open product details. Please try again.');
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
                <Text allowFontScaling={false} style={styles.rateText}>Rate this Item</Text>
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
                                    size={moderateScale(15)}
                                    color={starIndex < ratingVal ? "#FFD700" : "#E0E0E0"}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.reviewButton}
                        onPress={() => handleWriteReview(order.id, item.productId)}
                    >
                        <Text
                            allowFontScaling={false}
                            style={styles.reviewButtonText}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            Write a review
                        </Text>
                        <Ionicons name="chevron-forward" size={moderateScale(14)} color="#2196F3" />
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
                            size={moderateScale(20)}
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
                                        <View style={styles.orderHeaderLeft}>
                                            <Text allowFontScaling={false} style={[styles.statusText, { color: getStatusColor(order.status) }]} numberOfLines={1}>
                                                {order.status}
                                            </Text>
                                            <Text allowFontScaling={false} style={styles.orderIdText} numberOfLines={1}>{order.orderId}</Text>
                                        </View>
                                        <Text allowFontScaling={false} style={styles.dateText} numberOfLines={1}>{order.date}</Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={styles.productContainer}
                                    onPress={() => handleProductPress(order.id || order.orderId, product.productId)}
                                    activeOpacity={0.9}
                                >
                                    <Image source={{ uri: product.productImage || 'https://via.placeholder.com/150' }} style={styles.productImage} />
                                    <View style={styles.productInfo}>
                                        <Text allowFontScaling={false} style={styles.productName} numberOfLines={2}>
                                            {product.productName || product.name || 'Unnamed product'}
                                        </Text>
                                        <Text allowFontScaling={false} style={styles.productDescription} numberOfLines={1}>Price: ₹{product.price ?? '0'}</Text>
                                        <Text allowFontScaling={false} style={styles.productDescription} numberOfLines={1}>Qty: {product.quantity ?? product.qty ?? 1}</Text>
                                        {product.vendorName ? <Text allowFontScaling={false} style={styles.vendorText} numberOfLines={1}>By: {product.vendorName}</Text> : null}
                                    </View>
                                    <Ionicons name="chevron-forward" size={moderateScale(18)} color="#666" style={styles.chevronIcon} />
                                </TouchableOpacity>

                                {product.canReview && renderStarRating(order, product)}

                                {productIndex < (order.items.length - 1) && <View style={styles.productSeparator} />}
                            </View>
                        ))
                    ) : (
                        <View style={{ paddingVertical: moderateScale(8) }}>
                            <Text allowFontScaling={false} style={{ color: '#666', fontSize: normalizeFont(11) }}>No products in this order</Text>
                        </View>
                    )}
                </View>

                <View style={styles.priceContainer}>
                    <Text allowFontScaling={false} style={styles.priceLabel}>Total Price:</Text>
                    <Text allowFontScaling={false} style={styles.priceValue}>₹{order.totalPrice ?? 0}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={backOrder} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={moderateScale(24)} color="#333" />
                    </TouchableOpacity>
                    <Text allowFontScaling={false} style={styles.headerTitle}>My Orders</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text allowFontScaling={false} style={styles.loadingText}>Loading orders...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={backOrder} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={moderateScale(24)} color="#333" />
                </TouchableOpacity>
                <Text allowFontScaling={false} style={styles.headerTitle}>My Orders</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={moderateScale(18)} color="#999" style={styles.searchIcon} />
                    <TextInput
                        allowFontScaling={false}
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
                            <Ionicons name="close-circle" size={moderateScale(18)} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {searchQuery.length > 0 && (
                <View style={styles.searchResultsContainer}>
                    <Text allowFontScaling={false} style={styles.searchResultsText} numberOfLines={1}>
                        {filteredOrders.length} result{filteredOrders.length !== 1 ? 's' : ''} found
                    </Text>
                    {filteredOrders.length > 0 && (
                        <TouchableOpacity onPress={clearSearch}>
                            <Text allowFontScaling={false} style={styles.clearAllText}>Clear</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Inline error bar (non-blocking) */}
            {error ? (
                <View style={{ paddingHorizontal: moderateScale(14), paddingVertical: moderateScale(8), backgroundColor: '#fff8f8' }}>
                    <Text allowFontScaling={false} style={{ color: '#D32F2F', fontSize: normalizeFont(12) }}>{error}</Text>
                </View>
            ) : null}

            {filteredOrders.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons
                        name={searchQuery ? "search" : "receipt-outline"}
                        size={moderateScale(56)}
                        color="#ccc"
                        style={styles.emptyIcon}
                    />
                    <Text allowFontScaling={false} style={styles.emptyText}>
                        {searchQuery ? 'No results found' : 'No orders found'}
                    </Text>
                    <Text allowFontScaling={false} style={styles.emptySubText}>
                        {searchQuery
                            ? 'Try different keywords'
                            : 'Your orders will appear here'
                        }
                    </Text>
                    {searchQuery && (
                        <TouchableOpacity style={styles.clearSearchButton} onPress={clearSearch}>
                            <Text allowFontScaling={false} style={styles.clearSearchButtonText}>Clear Search</Text>
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

                            <Text allowFontScaling={false} style={styles.modalRateText}>
                                Rate this item <Text style={styles.modalRequired}>*</Text>
                            </Text>
                            {renderModalStars()}

                            <Text allowFontScaling={false} style={styles.modalImageText}>Add images of the product</Text>

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
                                                    <Ionicons name="close-circle" size={moderateScale(18)} color="#FF4444" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            <TouchableOpacity style={styles.modalImageUpload} onPress={selectImage}>
                                <View style={styles.modalImageUploadContent}>
                                    <Ionicons name="camera-outline" size={moderateScale(28)} color="#999" />
                                    <Text allowFontScaling={false} style={styles.modalImageUploadText}>
                                        Add photos (max 5)
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <Text
                                allowFontScaling={false}
                                style={styles.reviewButtonText}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                Write a review
                            </Text>
                            <TextInput
                                allowFontScaling={false}
                                style={styles.modalReviewInput}
                                placeholder="Share your experience..."
                                placeholderTextColor="#999"
                                value={reviewText}
                                onChangeText={setReviewText}
                                multiline={true}
                                numberOfLines={5}
                                textAlignVertical="top"
                            />

                            <TouchableOpacity
                                style={[styles.modalSubmitButton, submitLoading && styles.modalSubmitButtonDisabled]}
                                onPress={submitReview}
                                disabled={submitLoading}
                            >
                                <Text allowFontScaling={false} style={styles.modalSubmitButtonText}>
                                    {submitLoading ? 'Submitting...' : ' Submit'}
                                </Text>
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
        paddingHorizontal: moderateScale(14),
        paddingVertical: moderateScale(12),
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        padding: moderateScale(4),
        minWidth: scale(32),
    },
    headerTitle: {
        fontSize: normalizeFont(13),
        fontWeight: '600',
        color: '#333',
    },
    placeholder: {
        width: scale(32),
    },

    // Search Styles
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: moderateScale(14),
        paddingVertical: moderateScale(8),
        backgroundColor: '#fff',
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: moderateScale(8),
        paddingHorizontal: moderateScale(10),
        height: moderateScale(38),
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    searchIcon: {
        marginRight: moderateScale(6),
    },
    searchInput: {
        flex: 1,
        fontSize: normalizeFont(11),
        color: '#333',
        paddingVertical: 0,
    },
    clearButton: {
        marginLeft: moderateScale(6),
        padding: moderateScale(2),
    },

    // Search Results Counter
    searchResultsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: moderateScale(14),
        paddingVertical: moderateScale(6),
        backgroundColor: '#f8f8f8',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    searchResultsText: {
        flex: 1,
        fontSize: normalizeFont(12),
        color: '#666',
        marginRight: moderateScale(8),
    },
    clearAllText: {
        fontSize: normalizeFont(12),
        color: '#2196F3',
        fontWeight: '600',
    },

    // List Styles
    listContainer: {
        padding: moderateScale(10),
        paddingBottom: moderateScale(20),
    },
    orderCardTouchable: {
        marginBottom: moderateScale(12),
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: moderateScale(10),
        padding: moderateScale(12),
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.08,
        shadowRadius: moderateScale(3),
        elevation: 2,
    },

    // Order Header
    orderHeader: {
        marginBottom: moderateScale(10),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    orderHeaderLeft: {
        flex: 1,
        marginRight: moderateScale(8),
    },
    statusText: {
        fontSize: normalizeFont(13),
        fontWeight: '600',
        marginBottom: moderateScale(2),
    },
    orderIdText: {
        fontSize: normalizeFont(11),
        color: '#666',
    },
    dateText: {
        fontSize: normalizeFont(10),
        color: '#666',
        textAlign: 'right',
    },

    // Product Section
    productContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        minHeight: moderateScale(90),
        marginBottom: moderateScale(10),
        backgroundColor: '#f9f9f9',
        padding: moderateScale(10),
        borderRadius: moderateScale(8),
    },
    productImage: {
        width: moderateScale(65),
        height: moderateScale(65),
        borderRadius: moderateScale(6),
        marginRight: moderateScale(10),
        backgroundColor: '#f0f0f0',
    },
    productInfo: {
        flex: 1,
        justifyContent: 'center',
        paddingRight: moderateScale(4),
    },
    productName: {
        fontSize: normalizeFont(13),
        fontWeight: '600',
        color: '#333',
        marginBottom: moderateScale(3),
        lineHeight: normalizeFont(16),
    },
    productDescription: {
        fontSize: normalizeFont(11),
        paddingVertical: moderateScale(1),
        color: '#333',
        lineHeight: normalizeFont(14),
    },
    vendorText: {
        fontSize: normalizeFont(11),
        color: '#666',
        marginTop: moderateScale(1),
        lineHeight: normalizeFont(14),
    },
    chevronIcon: {
        marginLeft: moderateScale(4),
    },

    // Rating Section
    ratingContainer: {
        marginTop: moderateScale(8),
        width: '100%',
    },
    ratingDiv: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    rateText: {
        fontSize: normalizeFont(12),
        color: '#333',
        fontWeight: '500',
    },
    starsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(2),
    },
    starButton: {
        padding: moderateScale(2),
    },
    reviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: moderateScale(4),
    },

    reviewButtonText: {
        fontSize: normalizeFont(13),
        color: '#2196F3',
        marginRight: moderateScale(3),
    },
    // Product Separator
    productSeparator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: moderateScale(10),
    },

    // Price Container
    priceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: moderateScale(8),
        paddingHorizontal: moderateScale(10),
        marginTop: moderateScale(8),
        backgroundColor: '#fafafa',
        borderRadius: moderateScale(6),
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    priceLabel: {
        fontSize: normalizeFont(12),
        color: '#666',
        fontWeight: '500',
    },
    priceValue: {
        fontSize: normalizeFont(14),
        color: '#222',
        fontWeight: '700',
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
        borderTopLeftRadius: moderateScale(18),
        borderTopRightRadius: moderateScale(18),
        maxHeight: SCREEN_HEIGHT * 0.90,
        borderWidth: moderateScale(1),
        borderColor: 'rgba(255, 202, 40, 0.5)',
    },
    modalHandle: {
        width: moderateScale(35),
        height: moderateScale(4),
        backgroundColor: '#E0E0E0',
        borderRadius: moderateScale(2),
        alignSelf: 'center',
        marginTop: moderateScale(10),
        marginBottom: moderateScale(6),
    },
    modalContent: {
        padding: moderateScale(14),
        paddingBottom: moderateScale(30),
        flex: 1,
        width: '100%'
    },
    modalProductSection: {
        alignItems: 'center',
        marginBottom: moderateScale(12),
    },
    modalProductImageContainer: {
        width: moderateScale(95),
        height: moderateScale(95),
        borderRadius: moderateScale(50),
        overflow: 'hidden',
        backgroundColor: '#FFF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.08,
        shadowRadius: moderateScale(3),
    },
    modalProductImage: {
        width: '100%',
        height: '100%',
    },
    modalRateText: {
        fontSize: normalizeFont(10),
        color: '#333',
        marginBottom: moderateScale(10),
        fontWeight: '500',
    },
    modalRequired: {
        color: '#f44336',
        fontSize: normalizeFont(14),
    },
    modalStarsContainer: {
        flexDirection: 'row',
        marginBottom: moderateScale(5),
        justifyContent: 'flex-start',
        gap: moderateScale(4),
    },
    modalStarButton: {
        padding: moderateScale(2),
    },
    modalImageText: {
        fontSize: normalizeFont(13),
        color: '#333',
        marginBottom: moderateScale(10),
        fontWeight: '500',
    },
    modalImageUpload: {
        borderWidth: moderateScale(2),
        borderColor: 'rgba(255, 202, 40, 0.5)',
        borderRadius: moderateScale(8),
        paddingHorizontal: moderateScale(14),
        marginBottom: moderateScale(16),
        backgroundColor: '#fff',
    },
    modalImageUploadContent: {
        alignItems: 'center',
    },
    modalImageUploadText: {
        fontSize: normalizeFont(11),
        color: '#999',
        textAlign: 'center',
        margin: moderateScale(6),
    },
    modalImageCount: {
        fontSize: normalizeFont(10),
        color: '#666',
        textAlign: 'center',
        marginTop: moderateScale(3),
        fontWeight: '500',
    },
    uploadedImagesContainer: {
        marginBottom: moderateScale(10),
    },
    uploadedImageWrapper: {
        position: 'relative',
        marginRight: moderateScale(10),
    },
    uploadedImage: {
        width: moderateScale(65),
        height: moderateScale(65),
        borderRadius: moderateScale(6),
        backgroundColor: '#F5F5F5',
    },
    removeImageButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#FFF',
        borderRadius: moderateScale(12),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.12,
        shadowRadius: moderateScale(2),
    },
    modalReviewText: {
        fontSize: normalizeFont(13),
        color: '#333',
        marginBottom: moderateScale(10),
        fontWeight: '500',
    },
    modalReviewInput: {
        borderWidth: 1,
        borderColor: 'rgba(255, 202, 40, 0.5)',
        borderRadius: moderateScale(8),
        padding: moderateScale(10),
        fontSize: normalizeFont(12),
        color: '#333',
        backgroundColor: '#FFF',
        marginBottom: moderateScale(16),
        minHeight: moderateScale(90),
        textAlignVertical: 'top',
    },
    modalSubmitButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: moderateScale(12),
        borderRadius: moderateScale(8),
        alignItems: 'center',
    },
    modalSubmitButtonDisabled: {
        opacity: 0.6,
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
        paddingVertical: moderateScale(30),
        paddingHorizontal: moderateScale(20),
    },
    loadingText: {
        fontSize: normalizeFont(13),
        color: '#666',
        marginTop: moderateScale(10),
    },
    errorText: {
        fontSize: normalizeFont(13),
        color: '#f44336',
        textAlign: 'center',
        marginBottom: moderateScale(12),
        paddingHorizontal: moderateScale(10),
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(9),
        borderRadius: moderateScale(6),
    },
    retryButtonText: {
        color: '#fff',
        fontSize: normalizeFont(12),
        fontWeight: '600',
    },
    emptyIcon: {
        marginBottom: moderateScale(10),
    },
    emptyText: {
        fontSize: normalizeFont(12),
        fontWeight: '600',
        color: '#333',
        marginBottom: moderateScale(6),
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: normalizeFont(12),
        color: '#666',
        textAlign: 'center',
        lineHeight: normalizeFont(17),
        paddingHorizontal: moderateScale(20),
    },
    clearSearchButton: {
        marginTop: moderateScale(12),
        backgroundColor: '#2196F3',
        paddingHorizontal: moderateScale(18),
        paddingVertical: moderateScale(9),
        borderRadius: moderateScale(6),
    },
    clearSearchButtonText: {
        color: '#fff',
        fontSize: normalizeFont(12),
        fontWeight: '600',
    },
});

export default MyOrdersScreen;
