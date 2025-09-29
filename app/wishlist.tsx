import { useNavigation } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
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
    const [selectedOption, setSelectedOption] = useState('FILTER');
    const animation = useRef(new Animated.Value(0)).current;
    const navigation = useNavigation();

    const [mangoData, setMangoData] = useState([
        {
            id: 1,
            image: "https://images.unsplash.com/photo-1574226516831-e1dff420e43e",
            name: "Mango",
            variety: "Chausa",
            price: "₹1200",
            unit: "/10kg",
            rating: "4.5",
            inCart: false
        },
        {
            id: 2,
            image: "https://images.unsplash.com/photo-1574226516831-e1dff420e43e",
            name: "Mango",
            variety: "Chausa",
            price: "₹1200",
            unit: "/10kg",
            rating: "4.5",
            inCart: false
        },
        {
            id: 3,
            image: "https://images.unsplash.com/photo-1574226516831-e1dff420e43e",
            name: "Mango",
            variety: "Chausa",
            price: "₹1200",
            unit: "/10kg",
            rating: "4.5",
            inCart: false
        },
        {
            id: 4,
            image: "https://images.unsplash.com/photo-1574226516831-e1dff420e43e",
            name: "Mango",
            variety: "Chausa",
            price: "₹1200",
            unit: "/10kg",
            rating: "4.5",
            inCart: false
        },
        {
            id: 5,
            image: "https://images.unsplash.com/photo-1574226516831-e1dff420e43e",
            name: "Apple",
            variety: "Chausa",
            price: "₹1200",
            unit: "/10kg",
            rating: "4.5",
            inCart: false
        },
        {
            id: 6,
            image: "https://images.unsplash.com/photo-1574226516831-e1dff420e43e",
            name: "Mango",
            variety: "Chausa",
            price: "₹1200",
            unit: "/10kg",
            rating: "4.5",
            inCart: false
        }
    ]);

    // Function to fetch data from your API
    const fetchWishlistData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Replace 'YOUR_API_ENDPOINT_HERE' with your actual API endpoint
            const response = await fetch('YOUR_API_ENDPOINT_HERE');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Map the API data to include inCart property if not present
            const mappedData = data.map(item => ({
                ...item,
                inCart: item.inCart || false // Default to false if not provided
            }));
            
            setWishlistData(mappedData);
        } catch (error) {
            console.error('Error fetching wishlist data:', error);
            setError(error.message);
            
            // Fallback data for development/testing
            const fallbackData = [
                {
                    id: 1,
                    image: 'https://via.placeholder.com/150',
                    name: "Mango",
                    variety: "Chausa",
                    price: "₹1200",
                    unit: "/10kg",
                    rating: "4.5",
                    inCart: false
                },
                {
                    id: 2,
                    image: "https://images.unsplash.com/photo-1574226516831-e1dff420e43e",
                    name: "Apple",
                    variety: "Red Delicious",
                    price: "₹800",
                    unit: "/5kg",
                    rating: "4.2",
                    inCart: false
                },
                {
                    id: 3,
                    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e",
                    name: "Orange",
                    variety: "Nagpur",
                    price: "₹600",
                    unit: "/8kg",
                    rating: "4.0",
                    inCart: false
                }
            ];
            setWishlistData(fallbackData);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlistData();
    }, []);

    // Function to handle add to cart
    const handleAddToCart = (id) => {
        const updatedData = wishlistData.map(item => {
            if (item.id === id) {
                return { ...item, inCart: true };
            }
            return item;
        });
        setWishlistData(updatedData);
        Alert.alert('Added to Cart', 'Item has been added to your cart');
    };


    const backProfile =()=>{
        navigation.navigate("profile")
    }

    // Function to handle move to cart (for items already in cart)
    const handleMoveToCart = (id) => {
        Alert.alert('Move to Cart', 'Item is already in your cart');
    };

    // Function to remove item from wishlist
    const handleRemoveFromWishlist = (id) => {
        Alert.alert(
            'Remove from Wishlist',
            'Are you sure you want to remove this item from your wishlist?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        const updatedData = wishlistData.filter(item => item.id !== id);
                        setWishlistData(updatedData);
                    },
                },
            ]
        );
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
        outputRange: [0, 120],
    });

    const borderWidth = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const options = ['Fruits', 'Vegetable', 'Seeds'];

    const handleSelect = (option) => {
        setSelectedOption(option);
        toggleDropdown();
    };

    // Render each card item
    const renderCard = ({ item, index }) => (
        <View style={styles.card}>
            {/* Close button */}
            <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => handleRemoveFromWishlist(item.id)}
            >
                <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            {/* Rating */}
            {item.rating && (
                <View style={styles.ratingContainer}>
                    <Text style={styles.starIcon}>⭐</Text>
                    <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
            )}

            {/* Product Image */}
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

            {/* Product Details */}
            <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name || 'Unknown Product'}</Text>
                {item.variety && (
                    <Text style={styles.productVariety}>Variety : {item.variety}</Text>
                )}
                <Text style={styles.productPrice}>
                    {item.price || '₹0'} 
                    {item.unit && <Text style={styles.productUnit}>{item.unit}</Text>}
                </Text>
            </View>

            {/* Add to Cart Button */}
            <TouchableOpacity
                style={[
                    styles.cartButton,
                    item.inCart ? styles.moveButton : styles.addButton
                ]}
                onPress={() => item.inCart ? handleMoveToCart(item.id) : handleAddToCart(item.id)}
            >
                <Text style={styles.cartButtonText}>
                    {item.inCart ? 'Move to Cart' : 'Move to Cart'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    // Loading component
    const renderLoading = () => (
        <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Loading wishlist...</Text>
        </View>
    );

    // Error component
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

    // Empty wishlist component
    const renderEmptyWishlist = () => (
        <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>Your wishlist is empty</Text>
            <Text style={styles.emptySubText}>Add items to see them here</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.backArrow}>
                    <TouchableOpacity onPress={backProfile}>
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

            {/* FlatList with 2 cards per row */}
            <FlatList
                data={mangoData}
                renderItem={renderCard}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                contentContainerStyle={styles.flatListContent}
                showsVerticalScrollIndicator={false}
            />
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
        padding: 12,
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
        borderRadius:10,
        borderWidth:1,
        borderColor:'rgba(0, 0, 0, 0.2)',
        margin: 6,
        flex: 1,
        maxWidth: '47%',
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
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
        shadowOffset: {
            width: 0,
            height: 1,
        },
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
    ratingContainer: {
        position: 'absolute',
        top:95,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    starIcon: {
        fontSize: 12,
        marginRight: 2,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },
    cardImage: {
        width: '100%',
        height: 120,
        backgroundColor: '#f0f0f0',
    },
    productInfo: {
        padding: 12,
        paddingBottom: 8,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    productVariety: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    productUnit: {
        fontSize: 12,
        fontWeight: 'normal',
        color: '#666',
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
    moveButton: {
        backgroundColor: '#4CAF50',
    },
    cartButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default MyWishlist;