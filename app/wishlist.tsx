import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from 'expo-router';
import { goBack } from "expo-router/build/global-state/routing";
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MyWishlist = () => {
    const [selectedOption, setSelectedOption] = useState('All');
    const animation = useRef(new Animated.Value(0)).current;
    const navigation = useNavigation();

    const [wishlistData, setWishlistData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filteredData, setFilteredData] = useState([]);

    const API_BASE = "https://viafarm-1.onrender.com";
    const API_ENDPOINT = "/api/buyer/wishlist";

    // Function to fetch data from your API
    const fetchWishlistData = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = await AsyncStorage.getItem("userToken");
            console.log("📦 Retrieved Token:", token);

            if (!token) {
                throw new Error("No token found. Please login again.");
            }

            const response = await fetch(`${API_BASE}${API_ENDPOINT}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const json = await response.json();
            console.log("🧾 FULL Wishlist API Response:", json);
            console.log("📦 Wishlist Items:", json?.data?.items);

            if (!response.ok || !json.success) {
                throw new Error(json.message || `HTTP error! status: ${response.status}`);
            }

            const items = json?.data?.items || [];

            // Map the API data to match your card structure
            const mappedData = items.map((item, index) => {
                const mappedId = item.id || item._id || item.productId || `tmp-${index}`;
                return {
                    id: mappedId,
                    productId: item.productId || item.id || item._id || mappedId, // ensure productId exists
                    image: item.image,
                    name: item.name,
                    variety: item.variety,
                    vendorName: item.vendor?.name || "Ashok Sharma",
                    distance: item.vendor?.distance || "12 kms away",
                    price: `₹${item.price}`,
                    unit: `/${item.unit}`,
                    pricePerUnit: item.pricePerUnit || `${item.price} /kg`,
                    rating: item.rating || "4.5",
                    inCart: !!item.inCart,
                    category: item.category || 'Fruits'
                };
            });

            console.log("🔄 Mapped Data:", mappedData);
            setWishlistData(mappedData);
            setFilteredData(mappedData);
        } catch (error) {
            console.error('Error fetching wishlist data:', error);
            setError(error.message);
            setWishlistData([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlistData();
    }, []);

    // Remove from wishlist (API) and local state
    const handleRemoveFromWishlist = async (item) => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            if (!token) throw new Error("No token found. Please login again.");

            const itemId = item.productId || item.id;
            console.log("🗑️ Removing wishlist item:", item, "using id:", itemId);

            const response = await fetch(`${API_BASE}/api/buyer/wishlist/${itemId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const json = await response.json();
            console.log("🗑️ Remove Wishlist Response:", json);

            if (!response.ok || !json.success) {
                throw new Error(json.message || `Failed to remove item`);
            }

            // Remove item from local state by mapped id
            setWishlistData(prev => prev.filter(w => String(w.id) !== String(item.id)));
            setFilteredData(prev => prev.filter(w => String(w.id) !== String(item.id)));

            Alert.alert('Success', 'Item removed from wishlist successfully');
        } catch (error) {
            console.error('❌ Error removing from wishlist:', error);
            Alert.alert('Error', error.message || 'Failed to remove item from wishlist');
        }
    };

    // Add to cart (optimistic update)
    const handleAddToCart = async (item) => {
        const productId = item.productId || item.id;
        // Optimistically update UI
        setWishlistData(prev => prev.map(w => (String(w.id) === String(item.id) ? { ...w, inCart: true } : w)));
        setFilteredData(prev => prev.map(w => (String(w.id) === String(item.id) ? { ...w, inCart: true } : w)));

        try {
            const token = await AsyncStorage.getItem("userToken");
            if (!token) throw new Error("No token found. Please login again.");

            const requestBody = { productId, quantity: 1 };
            const response = await fetch(`${API_BASE}/api/buyer/cart/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            const json = await response.json();
            console.log("🛒 Add to Cart Response:", json);

            if (!response.ok || !json.success) {
                // rollback UI
                setWishlistData(prev => prev.map(w => (String(w.id) === String(item.id) ? { ...w, inCart: false } : w)));
                setFilteredData(prev => prev.map(w => (String(w.id) === String(item.id) ? { ...w, inCart: false } : w)));
                throw new Error(json.message || `Failed to add item to cart`);
            }

            // success already reflected in UI
            Alert.alert('Success', 'Item added to cart successfully');
        } catch (error) {
            console.error('❌ Error adding to cart:', error);
            Alert.alert('Error', error.message || 'Failed to add item to cart');
        }
    };

    // Remove from cart (optimistic update)
    const handleRemoveFromCart = async (item) => {
        const productId = item.productId || item.id;
        // Optimistically update UI
        setWishlistData(prev => prev.map(w => (String(w.id) === String(item.id) ? { ...w, inCart: false } : w)));
        setFilteredData(prev => prev.map(w => (String(w.id) === String(item.id) ? { ...w, inCart: false } : w)));

        try {
            const token = await AsyncStorage.getItem("userToken");
            if (!token) throw new Error("No token found. Please login again.");

            const response = await fetch(`${API_BASE}/api/buyer/cart/${productId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const json = await response.json();
            console.log("🗑️ Remove from Cart Response:", json);

            if (!response.ok || !json.success) {
                // rollback UI
                setWishlistData(prev => prev.map(w => (String(w.id) === String(item.id) ? { ...w, inCart: true } : w)));
                setFilteredData(prev => prev.map(w => (String(w.id) === String(item.id) ? { ...w, inCart: true } : w)));
                throw new Error(json.message || `Failed to remove item from cart`);
            }

            Alert.alert('Success', 'Item removed from cart successfully');
        } catch (error) {
            console.error('❌ Error removing from cart:', error);
            Alert.alert('Error', error.message || 'Failed to remove item from cart');
        }
    };

    // Toggle add/remove cart with confirmation for removal
    const handleCartAction = (item) => {
        if (item.inCart) {
            Alert.alert(
                'Remove from Cart',
                'Are you sure you want to remove this item from your cart?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => handleRemoveFromCart(item) },
                ]
            );
        } else {
            handleAddToCart(item);
        }
    };

    const toggleDropdown = () => {
        Animated.timing(animation, {
            toValue: animation._value === 0 ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const dropdownHeight = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 180],
    });

    const borderWidth = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const options = ['All', 'Fruits', 'Vegetable', 'Seeds', 'Plants', 'Handicrafts'];

    const handleSelect = (option) => {
        setSelectedOption(option);

        if (option === 'All') {
            setFilteredData(wishlistData);
        } else {
            const filtered = wishlistData.filter(item =>
                item.category?.toLowerCase().includes(option.toLowerCase()) ||
                item.name?.toLowerCase().includes(option.toLowerCase())
            );
            setFilteredData(filtered);
        }

        toggleDropdown();
    };

    const confirmRemove = (item) => {
        Alert.alert(
            'Remove from Wishlist',
            'Are you sure you want to remove this item from your wishlist?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => handleRemoveFromWishlist(item) },
            ]
        );
    };

    const renderCard = ({ item, index }) => (
        <View style={styles.card}>
            <TouchableOpacity
                style={styles.closeButton}
                onPress={() => confirmRemove(item)}
            >
                <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            {item.image ? (
                <Image
                    source={{ uri: item.image }}
                    style={styles.cardImage}
                    resizeMode="cover"
                />
            ) : (
                <View style={[styles.cardImage, styles.placeholderImage]}>
                    <Text style={styles.placeholderText}>No Image</Text>
                </View>
            )}

            <View style={styles.productInfo}>
                <Text style={styles.productName}>
                    {item.name} {item.variety}
                </Text>

                <Text style={styles.vendorText}>
                    by {item.vendorName}
                </Text>

                <Text style={styles.distanceText}>
                    {item.distance}
                </Text>

                <Text style={styles.pricePerUnit}>
                    {item.pricePerUnit}
                </Text>
            </View>

            <TouchableOpacity
                style={[
                    styles.cartButton,
                    item.inCart ? styles.removeButton : styles.addButton
                ]}
                onPress={() => handleCartAction(item)}
            >
                <Text style={styles.cartButtonText}>
                    {item.inCart ? 'Move to Cart' : 'Add to Cart'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderLoading = () => (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading wishlist...</Text>
        </View>
    );

    const renderError = () => (
        <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchWishlistData}
            >
                <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
        </View>
    );

    const renderEmptyWishlist = () => (
        <View style={styles.centerContainer}>
            <Image
                source={{
                    uri: "https://cdn-icons-png.flaticon.com/512/4076/4076549.png",
                }}
                style={styles.emptyImage}
            />
            <Text style={styles.emptyText}>Your wishlist is empty</Text>
            <Text style={styles.emptySubText}>Add items to see them here</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.backArrow}>
                    <TouchableOpacity onPress={goBack}>
                        <Image source={require("../assets/via-farm-img/icons/groupArrow.png")} />
                    </TouchableOpacity>
                    <Text style={styles.text}>My Wishlist</Text>
                </View>
                <View style={styles.filterWrapper}>
                    <TouchableOpacity
                        style={styles.filterBtn}
                        onPress={toggleDropdown}
                    >
                        <View style={styles.filterExpand}>
                            <Text style={styles.filterText}>{selectedOption}</Text>
                            <Image width={50} source={require('../assets/via-farm-img/icons/expandArrow.png')} />
                        </View>
                    </TouchableOpacity>

                    <Animated.View
                        style={[
                            styles.dropdown,
                            {
                                height: dropdownHeight,
                                borderWidth: borderWidth,
                            },
                        ]}
                    >
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={styles.dropdownItem}
                                onPress={() => handleSelect(option)}
                            >
                                <Text style={styles.dropdownText}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </View>
            </View>

            {loading ? (
                renderLoading()
            ) : error ? (
                renderError()
            ) : filteredData.length === 0 ? (
                selectedOption === 'All' ? (
                    renderEmptyWishlist()
                ) : (
                    <View style={styles.centerContainer}>
                        <Text style={styles.emptyText}>No items found for {selectedOption}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => handleSelect('All')}
                        >
                            <Text style={styles.retryButtonText}>Show All</Text>
                        </TouchableOpacity>
                    </View>
                )
            ) : (
                <FlatList
                    data={filteredData}
                    renderItem={renderCard}
                    keyExtractor={(item) => String(item.id ?? item.productId ?? Math.random())}
                    numColumns={2}
                    contentContainerStyle={styles.flatListContent}
                    showsVerticalScrollIndicator={false}
                    refreshing={loading}
                    onRefresh={fetchWishlistData}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    filterExpand: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        justifyContent: 'space-around',
    },
    backArrow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 30,
        justifyContent: 'space-around',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    text: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
    },
    filterWrapper: {
        position: 'relative',
        minWidth: 120,
    },
    filterBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(66, 66, 66, 0.7)',
    },
    filterText: {
        color: 'rgba(66, 66, 66, 0.7)',
        textAlign: 'center',
    },
    dropdown: {
        overflow: 'hidden',
        backgroundColor: '#fff',
        borderColor: 'rgba(66, 66, 66, 0.7)',
        borderRadius: 6,
        position: 'absolute',
        top: 35,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    dropdownItem: {
        padding: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(66, 66, 66, 0.7)',
    },
    dropdownText: {
        color: 'rgba(66, 66, 66, 0.7)',
    },
    flatListContent: {
        paddingHorizontal: 8,
        paddingVertical: 10,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.2)',
        margin: 6,
        flex: 1,
        maxWidth: '47%',
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    closeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    closeButtonText: {
        fontSize: 18,
        color: '#666',
        fontWeight: 'bold',
        lineHeight: 18,
    },
    cardImage: {
        width: '100%',
        height: 120,
        backgroundColor: '#f0f0f0',
    },
    placeholderImage: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#666',
        fontSize: 12,
    },
    productInfo: {
        padding: 12,
        paddingBottom: 8,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    vendorText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    distanceText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 6,
    },
    pricePerUnit: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    cartButton: {
        marginHorizontal: 12,
        marginBottom: 12,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    addButton: {
        backgroundColor: 'rgba(76, 175, 80, 1)',
    },
    removeButton: {
        backgroundColor: '#4CAF50',
    },
    cartButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
    },
    emptyImage: {
        width: 100,
        height: 100,
        opacity: 0.6,
    },
});

export default MyWishlist;
