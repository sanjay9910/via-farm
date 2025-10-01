import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MyRecentListing = () => {
    const [listingsData, setListingsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const BASE_URL = 'https://393rb0pp-5000.inc1.devtunnels.ms';
    
    // Fetch data from API
    const fetchRecentProducts = async () => {
        try {
            setLoading(true);
            console.log('Fetching data from API...');
            
            const response = await fetch(`${BASE_URL}/api/vendor/recent-products`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': 'Bearer YOUR_TOKEN' // Agar token required hai
                },
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('API Response:', JSON.stringify(result, null, 2));
            
            // Response structure check karo
            let productsArray = [];
            
            if (Array.isArray(result)) {
                // Agar direct array mila
                productsArray = result;
            } else if (result.data && Array.isArray(result.data)) {
                // Agar { data: [] } format mein hai
                productsArray = result.data;
            } else if (result.products && Array.isArray(result.products)) {
                // Agar { products: [] } format mein hai
                productsArray = result.products;
            } else if (result.items && Array.isArray(result.items)) {
                // Agar { items: [] } format mein hai
                productsArray = result.items;
            } else {
                console.log('Unexpected response format:', result);
                throw new Error('Unexpected API response format');
            }
            
            // Transform API data
            const transformedData = productsArray.map((item, index) => ({
                id: item._id || index.toString(),
                name: item.name || 'No Name',
                price: `₹${item.price || 0}`,
                quantity: item.quantity?.toString() || '0',
                uploadedOn: new Date(item.datePosted || item.createdAt).toLocaleDateString('en-GB'),
                image: item.images && item.images.length > 0 ? item.images[0] : 'https://picsum.photos/id/1/150/150'
            }));
            
            console.log('Transformed data:', transformedData);
            setListingsData(transformedData);
            setLoading(false);
            
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecentProducts();
    }, []);

    // Temporary data agar API work na kare
    const temporaryData = [
        {
            id: '1',
            name: 'Organic Apples',
            price: '₹6000',
            quantity: '411',
            uploadedOn: '26/09/2025',
            image: 'https://res.cloudinary.com/dppe3ni5z/image/upload/v1758887369/product-images/rgbonkwcsoaan0zrj8fl.jpg'
        },
        {
            id: '2',
            name: 'Fresh Mangoes',
            price: '₹250',
            quantity: '50',
            uploadedOn: '25/09/2025',
            image: 'https://picsum.photos/id/1011/150/150'
        },
        {
            id: '3',
            name: 'Green Bananas',
            price: '₹120',
            quantity: '75',
            uploadedOn: '24/09/2025',
            image: 'https://picsum.photos/id/102/150/150'
        }
    ];

    const renderListingItem = ({ item }) => (
        <View style={styles.listingCard}>
            <View style={styles.cardContent}>
                {/* Left side image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: item.image }}
                        style={styles.itemImage}
                        resizeMode="cover"
                    />
                </View>

                {/* Right side content */}
                <View style={styles.textContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.priceQuantityContainer}>
                            <Text style={styles.priceText}>{item.price}</Text>
                            <Text style={styles.quantity}>{item.quantity} units</Text>
                        </View>
                    </View>

                    <View style={styles.detailsContainer}>
                        <Text style={styles.uploadLabel}>Uploaded on:</Text>
                        <Text style={styles.uploadValue}>{item.uploadedOn}</Text>
                    </View>

                    <View style={styles.brand}>
                        <Image 
                            source={require('../../assets/via-farm-img/icons/satar.png')} 
                            style={styles.starIcon}
                        />
                        <Text style={styles.deliveryText}>All India Delivery</Text>
                    </View>

                    {/* Edit Button */}
                    <View style={styles.editBtn}>
                        <TouchableOpacity style={styles.dropdownBtn}>
                            <Text style={styles.dropdownText}>•••</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.editButton}>
                            <Image 
                                source={require('../../assets/via-farm-img/icons/editicon.png')} 
                                style={styles.editIcon}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    // Loading state
    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerText}>My Recent Listings</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>See All &gt;</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="rgba(255, 202, 40, 1)" />
                    <Text style={styles.loadingText}>Loading products...</Text>
                </View>
            </View>
        );
    }

    // Error state - Temporary data show karega
    if (error) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerText}>My Recent Listings</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>See All &gt;</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.errorNote}>
                    <Text style={styles.errorNoteText}>Note: Using sample data - {error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchRecentProducts}>
                        <Text style={styles.retryText}>Retry API</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={temporaryData}
                    horizontal
                    renderItem={renderListingItem}
                    keyExtractor={item => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.flatListContent}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>My Recent Listings</Text>
                <TouchableOpacity>
                    <Text style={styles.seeAllText}>See All &gt;</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={listingsData.length > 0 ? listingsData : temporaryData}
                horizontal
                renderItem={renderListingItem}
                keyExtractor={item => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.flatListContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No products found</Text>
                    </View>
                }
            />
        </View>
    );
};

export default MyRecentListing;

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
        backgroundColor: '#fff',
        flex: 1,
    },
    editBtn: {
        flexDirection: 'row',
        justifyContent: "space-between",
        alignItems: 'center',
        marginTop: 8,
    },
    dropdownBtn: {
        padding: 8,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
    },
    dropdownText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    brand: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 4,
    },
    starIcon: {
        width: 16,
        height: 16,
    },
    editIcon: {
        width: 20,
        height: 20,
    },
    deliveryText: {
        fontSize: 12,
        color: '#666',
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    seeAllText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    flatListContent: {
        paddingHorizontal: 16,
    },
    listingCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginRight: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 202, 40, 1)',
        width: Dimensions.get("window").width * 0.8,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    textContainer: {
        flex: 1,
        paddingRight: 12,
        paddingVertical: 8,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    priceQuantityContainer: {
        alignItems: 'flex-end',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(66, 66, 66, 1)',
        flex: 1,
        marginRight: 8,
    },
    priceText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    quantity: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    detailsContainer: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 4,
    },
    uploadLabel: {
        fontSize: 12,
        color: '#666',
    },
    uploadValue: {
        fontSize: 12,
        color: '#000',
        fontWeight: '500',
    },
    imageContainer: {
        width: 120,
        height: 140,
    },
    itemImage: {
        width: '100%',
        height: '100%',
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        borderTopLeftRadius: 6,
        borderBottomLeftRadius: 6,
    },
    editButton: {
        padding: 6,
        borderRadius: 4,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorNote: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF3CD',
        marginBottom: 8,
        alignItems: 'center',
    },
    errorNoteText: {
        fontSize: 12,
        color: '#856404',
        textAlign: 'center',
        marginBottom: 8,
    },
    retryButton: {
        backgroundColor: 'rgba(255, 202, 40, 1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    retryText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#000',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
});