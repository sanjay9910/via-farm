import { Feather } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ProductCard = ({ item }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const menuButtonRef = useRef(null);

    const handleMenuPress = () => {
        if (menuButtonRef.current) {
            menuButtonRef.current.measure((fx, fy, width, height, px, py) => {
                setMenuPosition({
                    x: px - 140, // Menu width ke according adjust
                    y: py + height + 4
                });
                setIsMenuOpen(true);
            });
        }
    };

    return (
        <View style={styles.card}>
            {/* Product Image */}
            <Image
                source={{ uri: item.image }}
                style={styles.image}
                resizeMode="cover"
            />

            {/* Product Details */}
            <View style={styles.details}>
                {/* Product Name and Menu Icon */}
                <View style={styles.header}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <TouchableOpacity
                        ref={menuButtonRef}
                        style={styles.menuButton}
                        onPress={handleMenuPress}
                    >
                        <Feather name="more-vertical" size={20} color="#6b7280" />
                    </TouchableOpacity>
                </View>

                {/* Category */}
                <View style={styles.row}>
                    <Text style={styles.label}>Category</Text>
                    <Text style={styles.colon}>:</Text>
                    <Text style={styles.value}>{item.category}</Text>
                </View>

                {/* Price */}
                <View style={styles.row}>
                    <Text style={styles.label}>Price</Text>
                    <Text style={styles.colon}>:</Text>
                    <Text style={styles.value}>$ {item.price}/{item.unit}</Text>
                </View>

                {/* Upload Date */}
                <Text style={styles.uploadDate}>Uploaded on {item.uploadDate}</Text>

                {/* Stock Status */}
                <View style={styles.stockContainer}>
                    <View style={[
                        styles.stockBadge,
                        item.inStock ? styles.inStock : styles.outOfStock
                    ]}>
                        <View style={[
                            styles.stockDot,
                            item.inStock ? styles.inStockDot : styles.outOfStockDot
                        ]} />
                        <Text style={[
                            styles.stockText,
                            item.inStock ? styles.inStockText : styles.outOfStockText
                        ]}>
                            {item.inStock ? 'In Stock' : 'Out of Stock'}
                        </Text>
                        <Feather
                            name="chevron-down"
                            size={16}
                            color={item.inStock ? '#22c55e' : '#ef4444'}
                        />
                    </View>
                </View>
            </View>

            {/* Menu Popup Modal */}
            <Modal
                visible={isMenuOpen}
                transparent={true}
                animationType="none"
                onRequestClose={() => setIsMenuOpen(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlayTransparent}
                    activeOpacity={1}
                    onPress={() => setIsMenuOpen(false)}
                >
                    <View style={[
                        styles.menuPopup,
                        {
                            position: 'absolute',
                            top: menuPosition.y,
                            left: menuPosition.x,
                        }
                    ]}>
                        {/* Edit Option */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setIsMenuOpen(false);
                                // EDIT FUNCTION YAHA
                                console.log('Edit clicked');
                            }}
                        >
                            <Feather name="edit-2" size={18} color="#374151" />
                            <Text style={styles.menuItemText}>Edit</Text>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.menuDivider} />

                        {/* Hide Option */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setIsMenuOpen(false);
                                // HIDE FUNCTION YAHA
                                console.log('Hide clicked');
                            }}
                        >
                            <Feather name="eye-off" size={18} color="#374151" />
                            <Text style={styles.menuItemText}>Hide</Text>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.menuDivider} />

                        {/* Delete Option */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setIsMenuOpen(false);
                                // DELETE FUNCTION YAHA
                                console.log('Delete clicked');
                            }}
                        >
                            <Feather name="trash-2" size={18} color="#ef4444" />
                            <Text style={[styles.menuItemText, styles.deleteText]}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

// Main Component with FlatList
const ProductList = () => {
    // YAHA APNA API DATA AAYEGA
    const products = [
        {
            id: '1',
            name: 'Mango Chausa',
            image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400',
            category: 'Fruit',
            price: '20',
            unit: '',
            uploadDate: '11/08/2025',
            inStock: true,
        },
        // ADD MORE PRODUCTS HERE FROM API
    ];

    return (
        <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ProductCard item={item} />}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
        />
    );
};

export default ProductList;

const styles = StyleSheet.create({
    listContainer: {
        padding: 16,
        gap: 16,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#fbbf24',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    image: {
        width: 150,
        height: '100%',
        minHeight: 180,
    },
    details: {
        flex: 1,
        padding: 16,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    productName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
        flex: 1,
        marginRight: 8,
    },
    menuButton: {
        padding: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    label: {
        fontSize: 14,
        color: '#6b7280',
        width: 80,
    },
    colon: {
        fontSize: 14,
        color: '#6b7280',
        marginHorizontal: 8,
    },
    value: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
        flex: 1,
    },
    uploadDate: {
        fontSize: 13,
        color: '#9ca3af',
        marginTop: 4,
        marginBottom: 12,
    },
    stockContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    inStock: {
        backgroundColor: '#f0fdf4',
        borderColor: '#bbf7d0',
    },
    outOfStock: {
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
    },
    stockDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    inStockDot: {
        backgroundColor: '#22c55e',
    },
    outOfStockDot: {
        backgroundColor: '#ef4444',
    },
    stockText: {
        fontSize: 14,
        fontWeight: '500',
    },
    inStockText: {
        color: '#22c55e',
    },
    outOfStockText: {
        color: '#ef4444',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalOverlayTransparent: {
        flex: 1,
        backgroundColor: 'transparent',
        marginLeft:60,
        marginTop:-26,
    },
    menuPopup: {
        backgroundColor: '#ffffff',
        borderRadius:6,
        minWidth: 100,
        paddingVertical:8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 202, 40, 1)',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 6,
        gap: 12,
    },
    menuItemText: {
        fontSize:13,
        color: '#374151',
        fontWeight: '500',
    },
    deleteText: {
        color: '#000',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginHorizontal: 8,
    },
});