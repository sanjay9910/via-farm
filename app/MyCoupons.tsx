import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// --- API Configuration ---
const API_BASE_URL = 'https://393rb0pp-5000.inc1.devtunnels.ms';
const API_ENDPOINTS = {
    GET_COUPONS: '/api/vendor/coupons',
    CREATE_COUPON: '/api/vendor/coupons/create',
    UPDATE_COUPON: '/api/vendor/coupons/',
    DELETE_COUPON: '/api/vendor/coupons/'
};

// Helper Function to format Date
const formatDate = (isoDate) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

// Helper to convert Date to DD/MM/YYYY
const formatDateToDisplay = (date) => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

// --- Dropdown Component for Discount Percentage ---
const DiscountDropdown = ({ visible, onSelect, value, onClose }) => {
    const percentages = [5, 10, 15, 20, 25, 50];

    if (!visible) return null;

    return (
        <View style={dropdownStyles.dropdownContainer}>
            {percentages.map((percent) => (
                <TouchableOpacity
                    key={percent}
                    style={[
                        dropdownStyles.dropdownOption,
                        value === percent && dropdownStyles.selectedOption
                    ]}
                    onPress={() => {
                        onSelect(percent);
                        onClose();
                    }}
                >
                    <Text style={[
                        dropdownStyles.dropdownText,
                        value === percent && dropdownStyles.selectedText
                    ]}>
                        {percent}%
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

// --- Dropdown Component for Product Categories ---
const CategoryDropdown = ({ visible, onSelect, value, onClose }) => {
    const categories = [
        'All Products',
        'Fruits',
        'Vegetables', 
        'Plants',
        'Seeds',
        'Handicrafts'
    ];

    if (!visible) return null;

    return (
        <View style={dropdownStyles.dropdownContainer}>
            {categories.map((category) => (
                <TouchableOpacity
                    key={category}
                    style={[
                        dropdownStyles.dropdownOption,
                        value === category && dropdownStyles.selectedOption
                    ]}
                    onPress={() => {
                        onSelect(category);
                        onClose();
                    }}
                >
                    <Text style={[
                        dropdownStyles.dropdownText,
                        value === category && dropdownStyles.selectedText
                    ]}>
                        {category}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

// --- Modal Content Form Component ---
const CouponForm = ({ 
    title, 
    initialData, 
    onClose, 
    onSubmit,
    submitButtonText,
    loading = false
}) => {
    const [couponCode, setCouponCode] = useState(initialData?.code || '');
    const initialDiscount = initialData?.discount ? parseInt(initialData.discount.replace('%', '')) : 10;
    const [discount, setDiscount] = useState(initialDiscount);
    const [minimumOrder, setMinimumOrder] = useState(initialData?.minimumOrder || ''); 
    const [startDate, setStartDate] = useState(initialData?.startDate ? new Date(initialData.startDate) : new Date());
    const [expiryDate, setExpiryDate] = useState(initialData?.validTill ? new Date(initialData.validTill) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const [appliesTo, setAppliesTo] = useState(initialData?.appliesTo || 'All Products');
    const [discountDropdownVisible, setDiscountDropdownVisible] = useState(false);
    const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

    const handleFormSubmit = () => {
        // Validation
        if (!couponCode.trim()) {
            Alert.alert('Error', 'Please enter coupon code.');
            return;
        }
        if (!discount || discount < 1 || discount > 100) {
            Alert.alert('Error', 'Please enter a valid discount between 1-100%.');
            return;
        }
        if (!minimumOrder || parseInt(minimumOrder) < 0) {
            Alert.alert('Error', 'Please enter valid minimum order amount.');
            return;
        }

        // Date validation
        if (expiryDate <= startDate) {
            Alert.alert('Error', 'Expiry date must be after start date.');
            return;
        }

        if (startDate < new Date()) {
            Alert.alert('Error', 'Start date cannot be in the past.');
            return;
        }

        const couponData = {
            code: couponCode.trim(),
            discount: {
                value: parseInt(discount),
                type: "Percentage"
            },
            appliesTo: appliesTo,
            validFrom: startDate.toISOString(),
            validTill: expiryDate.toISOString(),
            minimumOrder: parseInt(minimumOrder),
            applicableId: null,
            appliesToRef: null,
            category: null
        };

        // Include ID for edit mode
        if (initialData?.id) {
            couponData.id = initialData.id;
        }

        onSubmit(couponData);
    };

    // Handle discount input change
    const handleDiscountChange = (text) => {
        const numericValue = text.replace(/[^0-9]/g, '');
        if (numericValue === '' || (numericValue <= 100 && numericValue.length <= 3)) {
            setDiscount(numericValue === '' ? '' : parseInt(numericValue));
        }
    };

    // Handle minimum order input change
    const handleMinimumOrderChange = (text) => {
        const numericValue = text.replace(/[^0-9]/g, '');
        setMinimumOrder(numericValue);
    };

    // Date picker handlers
    const onStartDateChange = (event, selectedDate) => {
        setShowStartDatePicker(false);
        if (selectedDate) {
            setStartDate(selectedDate);
        }
    };

    const onExpiryDateChange = (event, selectedDate) => {
        setShowExpiryDatePicker(false);
        if (selectedDate) {
            setExpiryDate(selectedDate);
        }
    };

    return (
        <Modal
            animationType="slide" 
            transparent={true}
            visible={true} 
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={createModalStyles.modalOverlay}
                activeOpacity={1}
                onPress={() => { 
                    onClose();
                    setDiscountDropdownVisible(false);
                    setCategoryDropdownVisible(false);
                }} 
            >
                <View 
                    style={createModalStyles.modalContainer} 
                    onStartShouldSetResponder={() => true}
                    onResponderRelease={() => {
                        setDiscountDropdownVisible(false);
                        setCategoryDropdownVisible(false);
                    }} 
                >
                    
                    {/* Header */}
                    <View style={createModalStyles.header}>
                        <TouchableOpacity onPress={onClose} style={createModalStyles.headerIcon}>
                            <Text style={createModalStyles.iconText}>←</Text> 
                        </TouchableOpacity>
                        <Text style={createModalStyles.headerTitle}>{title}</Text>
                        <View style={{ width: 40 }} /> 
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={createModalStyles.scrollViewContent}>

                        {/* Coupon Code */}
                        <Text style={createModalStyles.label}>Coupon Code *</Text>
                        <View style={createModalStyles.inputGroup}>
                            <TextInput 
                                style={createModalStyles.textInput}
                                placeholder="E.g., FESTIVE20"
                                placeholderTextColor="#999"
                                value={couponCode}
                                onChangeText={setCouponCode}
                                maxLength={20}
                                editable={!initialData?.id}
                            />
                            <Text style={createModalStyles.starIcon}>✨</Text>
                        </View>

                        {/* Discount & Minimum Order (Row) */}
                        <View style={createModalStyles.row}>
                            <View style={createModalStyles.halfInput}>
                                <Text style={createModalStyles.label}>Discount *</Text>
                                <View style={createModalStyles.discountInputWrapper}>
                                    <View style={createModalStyles.discountInputGroup}>
                                        <TextInput 
                                            style={[createModalStyles.textInput, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                                            keyboardType="numeric"
                                            value={String(discount)}
                                            onChangeText={handleDiscountChange}
                                            placeholder="20"
                                            placeholderTextColor="#999"
                                        />
                                        
                                        <TouchableOpacity 
                                            style={createModalStyles.discountDropdown}
                                            onPress={() => setDiscountDropdownVisible(!discountDropdownVisible)}
                                        >
                                            <Text style={createModalStyles.discountText}>%</Text>
                                            <Text style={createModalStyles.dropdownArrow}>
                                                {discountDropdownVisible ? '↑' : '↓'} 
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    
                                    <DiscountDropdown
                                        visible={discountDropdownVisible}
                                        onSelect={setDiscount}
                                        value={discount}
                                        onClose={() => setDiscountDropdownVisible(false)}
                                    />
                                </View>
                            </View>

                            <View style={createModalStyles.halfInput}>
                                <Text style={createModalStyles.label}>Minimum Order *</Text>
                                <TextInput 
                                    style={createModalStyles.textInput}
                                    keyboardType="numeric"
                                    value={minimumOrder}
                                    onChangeText={handleMinimumOrderChange}
                                    placeholder="e.g. 100"
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>

                        {/* Start Date & Expiry Date (Row) */}
                        <View style={createModalStyles.row}>
                            <View style={createModalStyles.halfInput}>
                                <Text style={createModalStyles.label}>Start Date *</Text>
                                <TouchableOpacity 
                                    style={createModalStyles.textInput}
                                    onPress={() => setShowStartDatePicker(true)}
                                >
                                    <Text style={createModalStyles.dateText}>
                                        {formatDateToDisplay(startDate)}
                                    </Text>
                                </TouchableOpacity>
                                {showStartDatePicker && (
                                    <DateTimePicker
                                        value={startDate}
                                        mode="date"
                                        display="default"
                                        onChange={onStartDateChange}
                                        minimumDate={new Date()}
                                    />
                                )}
                            </View>

                            <View style={createModalStyles.halfInput}>
                                <Text style={createModalStyles.label}>Expiry Date *</Text>
                                <TouchableOpacity 
                                    style={createModalStyles.textInput}
                                    onPress={() => setShowExpiryDatePicker(true)}
                                >
                                    <Text style={createModalStyles.dateText}>
                                        {formatDateToDisplay(expiryDate)}
                                    </Text>
                                </TouchableOpacity>
                                {showExpiryDatePicker && (
                                    <DateTimePicker
                                        value={expiryDate}
                                        mode="date"
                                        display="default"
                                        onChange={onExpiryDateChange}
                                        minimumDate={new Date(startDate.getTime() + 24 * 60 * 60 * 1000)}
                                    />
                                )}
                            </View>
                        </View>

                        {/* Applicable On (Dropdown) */}
                        <Text style={createModalStyles.label}>Applicable on *</Text>
                        <View style={[createModalStyles.inputGroup, { zIndex: 100 }]}>
                            <View style={createModalStyles.categoryInputWrapper}>
                                <TouchableOpacity 
                                    style={[createModalStyles.textInput, createModalStyles.dropdown]}
                                    onPress={() => setCategoryDropdownVisible(!categoryDropdownVisible)}
                                >
                                    <Text style={createModalStyles.dropdownText}>{appliesTo}</Text>
                                    <Text style={createModalStyles.dropdownArrow}>
                                        {categoryDropdownVisible ? '↑' : '↓'}
                                    </Text>
                                </TouchableOpacity>
                                
                                <CategoryDropdown
                                    visible={categoryDropdownVisible}
                                    onSelect={setAppliesTo}
                                    value={appliesTo}
                                    onClose={() => setCategoryDropdownVisible(false)}
                                />
                            </View>
                        </View>
                        
                        <View style={{ height: 30 }} />

                    </ScrollView>

                    {/* Submit Button */}
                    <TouchableOpacity 
                        style={[
                            createModalStyles.createButton,
                            loading && createModalStyles.createButtonDisabled
                        ]} 
                        onPress={handleFormSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={createModalStyles.createButtonText}>{submitButtonText}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

// Simplified wrappers for clarity
const CreateCouponModal = (props) => (
    <CouponForm 
        title="Create a Coupon" 
        submitButtonText="Create Coupon" 
        initialData={{}} 
        {...props} 
    />
);

const EditCouponModal = (props) => (
    <CouponForm 
        title="Edit Coupon" 
        submitButtonText="Update Coupon" 
        {...props} 
    />
);

const MyCoupons = () => {
    // API data state
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [originalCoupons, setOriginalCoupons] = useState([]); 
    const [createLoading, setCreateLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    
    // Status Filter State
    const [filterStatus, setFilterStatus] = useState('all'); 
    const [filterDropdownVisible, setFilterDropdownVisible] = useState(false); 

    // Three dots modal states
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
    const threeDotsRefs = useRef({});

    // Modals for Create/Edit
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false); 

    // --- Get Auth Token ---
    const getAuthToken = async () => {
        try {
            let token = await AsyncStorage.getItem('userToken');
            const HARDCODED_TOKEN = "YOUR_ACTUAL_VALID_TOKEN_HERE"; 
            if (!token || token === HARDCODED_TOKEN) {
                token = HARDCODED_TOKEN;
            }
            if (token === "YOUR_ACTUAL_VALID_TOKEN_HERE" || !token) {
                throw new Error("Please log in, or update the HARDCODED_TOKEN in the code for testing.");
            }
            return token;
        } catch (error) {
            throw error;
        }
    };

    // --- API Fetch Logic ---
    const fetchCoupons = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await getAuthToken();

            const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.GET_COUPONS}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data && response.data.success) {
                const fetchedCoupons = response.data.data.map(coupon => ({
                    id: coupon._id,
                    code: coupon.code,
                    discount: `${coupon.discount.value}%`, 
                    appliesTo: coupon.appliesTo,
                    startDate: formatDate(coupon.startDate || coupon.validFrom),
                    validTill: formatDate(coupon.expiryDate || coupon.validTill), 
                    minimumOrder: coupon.minimumOrder?.toString() || '0',
                    status: coupon.status 
                }));
                
                setOriginalCoupons(fetchedCoupons); 
                setCoupons(fetchedCoupons); 
            } else {
                setError(response.data.message || "Failed to fetch coupons.");
            }
        } catch (err) {
            console.error("API Fetch Error:", err.response?.data || err.message);
            setError("Could not load coupons. Please check the token validity or network connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    // --- Create Coupon API Integration ---
    const handleCreateCoupon = async (couponData) => {
        setCreateLoading(true);
        try {
            const token = await getAuthToken();

            const response = await axios.post(
                `${API_BASE_URL}${API_ENDPOINTS.CREATE_COUPON}`,
                couponData,
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.success) {
                Alert.alert('Success', 'Coupon created successfully!');
                
                // Add new coupon to the list
                const newCoupon = {
                    id: response.data.data._id,
                    code: response.data.data.code,
                    discount: `${response.data.data.discount.value}%`,
                    appliesTo: response.data.data.appliesTo,
                    startDate: formatDate(response.data.data.startDate || response.data.data.validFrom),
                    validTill: formatDate(response.data.data.expiryDate || response.data.data.validTill),
                    minimumOrder: response.data.data.minimumOrder?.toString() || '0',
                    status: response.data.data.status
                };

                setOriginalCoupons(prev => [newCoupon, ...prev]);
                setCreateModalVisible(false);
            } else {
                Alert.alert('Error', response.data.message || 'Failed to create coupon.');
            }
        } catch (err) {
            console.error("Create Coupon Error:", err.response?.data || err.message);
            const errorMessage = err.response?.data?.message || 'Failed to create coupon. Please try again.';
            Alert.alert('Error', errorMessage);
        } finally {
            setCreateLoading(false);
        }
    };

    // --- Update Coupon API Integration ---
    const handleUpdateCoupon = async (couponData) => {
        setUpdateLoading(true);
        try {
            const token = await getAuthToken();

            const response = await axios.put(
                `${API_BASE_URL}${API_ENDPOINTS.UPDATE_COUPON}${couponData.id}`,
                couponData,
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.success) {
                Alert.alert('Success', 'Coupon updated successfully!');
                
                // Update coupon in the list
                const updatedCoupon = {
                    id: response.data.data._id,
                    code: response.data.data.code,
                    discount: `${response.data.data.discount.value}%`,
                    appliesTo: response.data.data.appliesTo,
                    startDate: formatDate(response.data.data.startDate || response.data.data.validFrom),
                    validTill: formatDate(response.data.data.expiryDate || response.data.data.validTill),
                    minimumOrder: response.data.data.minimumOrder?.toString() || '0',
                    status: response.data.data.status
                };

                setOriginalCoupons(prev => 
                    prev.map(coupon => 
                        coupon.id === updatedCoupon.id ? updatedCoupon : coupon
                    )
                );
                setEditModalVisible(false);
            } else {
                Alert.alert('Error', response.data.message || 'Failed to update coupon.');
            }
        } catch (err) {
            console.error("Update Coupon Error:", err.response?.data || err.message);
            const errorMessage = err.response?.data?.message || 'Failed to update coupon. Please try again.';
            Alert.alert('Error', errorMessage);
        } finally {
            setUpdateLoading(false);
        }
    };

    // --- Delete Coupon API Integration ---
    const handleDeleteCoupon = async (couponId) => {
        setDeleteLoading(true);
        try {
            const token = await getAuthToken();

            const response = await axios.delete(
                `${API_BASE_URL}${API_ENDPOINTS.DELETE_COUPON}${couponId}`,
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data && response.data.success) {
                Alert.alert('Success', 'Coupon deleted successfully!');
                
                // Remove coupon from the list
                setOriginalCoupons(prev => prev.filter(coupon => coupon.id !== couponId));
            } else {
                Alert.alert('Error', response.data.message || 'Failed to delete coupon.');
            }
        } catch (err) {
            console.error("Delete Coupon Error:", err.response?.data || err.message);
            const errorMessage = err.response?.data?.message || 'Failed to delete coupon. Please try again.';
            Alert.alert('Error', errorMessage);
        } finally {
            setDeleteLoading(false);
            setActionModalVisible(false);
        }
    };

    // --- Filtering Logic ---
    const getFilteredCoupons = () => {
        if (filterStatus === 'all') {
            return originalCoupons;
        }
        const statusToMatch = filterStatus.toLowerCase();
        return originalCoupons.filter(coupon => coupon.status.toLowerCase() === statusToMatch);
    };

    // Update the displayed coupons whenever the filter status changes
    useEffect(() => {
        setCoupons(getFilteredCoupons());
    }, [filterStatus, originalCoupons]); 

    const handleThreeDotsPress = (coupon) => {
        const ref = threeDotsRefs.current[coupon.id];
        if (ref) {
            ref.measure((fx, fy, width, height, px, py) => {
                setModalPosition({
                    x: px - 100,
                    y: py + height + 5
                });
                setSelectedCoupon(coupon);
                setActionModalVisible(true);
            });
        }
    };

    const handleEdit = () => {
        setActionModalVisible(false); 
        setEditModalVisible(true);    
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Coupon',
            `Are you sure you want to delete coupon "${selectedCoupon?.code}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive', 
                    onPress: () => handleDeleteCoupon(selectedCoupon.id)
                }
            ]
        );
    };

    const handleOpenCreateModal = () => {
        setCreateModalVisible(true); 
    };

    const handleBack = () => {
        // Navigation logic here
        console.log('Go back pressed');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Main Coupons Screen UI */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.headerIcon}>
                        <Text style={styles.iconText}>←</Text> 
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Coupons</Text>
                </View>
                
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.createButton} onPress={handleOpenCreateModal}>
                        <Text style={styles.createButtonText}>+ Create a Coupon</Text>
                    </TouchableOpacity>
                    
                    {/* Filter Dropdown */}
                    <View style={styles.filterDropdownWrapper}>
                        <TouchableOpacity 
                            style={styles.statusFilter} 
                            onPress={() => setFilterDropdownVisible(!filterDropdownVisible)}
                        >
                            <Text style={styles.statusFilterText}>
                                {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Coupons
                            </Text>
                            <Text style={styles.dropdownArrow}>▼</Text>
                        </TouchableOpacity>

                        {filterDropdownVisible && (
                            <View style={styles.filterOptionsContainer}>
                                {['all', 'active', 'expired'].map(status => (
                                    <TouchableOpacity
                                        key={status}
                                        style={styles.filterOption}
                                        onPress={() => {
                                            setFilterStatus(status);
                                            setFilterDropdownVisible(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.filterOptionText,
                                            filterStatus === status && { fontWeight: 'bold', color: '#4CAF50' }
                                        ]}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                {/* Loading/Error/List */}
                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                        <Text style={{ marginTop: 10, color: '#666' }}>Loading Coupons...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.errorText}>Error: {error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={fetchCoupons}>
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : coupons.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.noCouponsText}>No {filterStatus === 'all' ? '' : filterStatus} coupons found.</Text>
                        <Text style={styles.noCouponsSubText}>Tap 'Create a Coupon' to add one.</Text>
                    </View>
                ) : (
                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        {coupons.map((coupon) => (
                            <View key={coupon.id} style={styles.couponCard}>
                                <View style={styles.cardContent}>
                                    <View style={styles.textRow}>
                                        <Text style={styles.couponLabel}>Code</Text>
                                        <Text style={styles.couponDivider}>:</Text>
                                        <Text style={styles.couponValue}>{coupon.code}</Text>
                                    </View>
                                    <View style={styles.textRow}>
                                        <Text style={styles.couponLabel}>Discount</Text>
                                        <Text style={styles.couponDivider}>:</Text>
                                        <Text style={styles.couponValue}>{coupon.discount}</Text>
                                    </View>
                                    <View style={styles.textRow}>
                                        <Text style={styles.couponLabel}>Applies to</Text>
                                        <Text style={styles.couponDivider}>:</Text>
                                        <Text style={styles.couponValue}>{coupon.appliesTo}</Text>
                                    </View>
                                    <View style={styles.textRow}>
                                        <Text style={styles.couponLabel}>Valid Till</Text>
                                        <Text style={styles.couponDivider}>:</Text>
                                        <Text style={styles.couponValue}>{coupon.validTill}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity 
                                    ref={(ref) => (threeDotsRefs.current[coupon.id] = ref)}
                                    style={styles.threeDots} 
                                    onPress={() => handleThreeDotsPress(coupon)}
                                >
                                    <Text style={styles.threeDotsText}>⋮</Text>
                                </TouchableOpacity>
                                <View style={[styles.statusContainer, coupon.status.toLowerCase() === 'active' ? styles.activeStatus : styles.expiredStatus]}>
                                    <Text style={[styles.statusText, coupon.status.toLowerCase() === 'active' ? styles.activeStatusText : styles.expiredStatusText]}>
                                        {coupon.status}
                                    </Text>
                                </View>
                            </View>
                        ))}
                        <View style={{ height: 50 }} />
                    </ScrollView>
                )}
                
                {/* Three Dots Action Modal */}
                <Modal
                    animationType="fade" 
                    transparent={true} 
                    visible={actionModalVisible} 
                    onRequestClose={() => setActionModalVisible(false)}
                >
                    <TouchableOpacity 
                        style={styles.modalOverlay} 
                        activeOpacity={1} 
                        onPress={() => setActionModalVisible(false)}
                    >
                        <View style={[styles.modalContent, { top: modalPosition.y, left: modalPosition.x }]}>
                            <TouchableOpacity 
                                style={styles.modalOption} 
                                onPress={handleEdit}
                                disabled={deleteLoading}
                            >
                                {updateLoading && selectedCoupon ? (
                                    <ActivityIndicator size="small" color="#4CAF50" />
                                ) : (
                                    <Text style={styles.modalOptionText}>✏️ Edit</Text>
                                )}
                            </TouchableOpacity>
                            <View style={styles.modalDivider} />
                            <TouchableOpacity 
                                style={styles.modalOption} 
                                onPress={handleDelete}
                                disabled={deleteLoading}
                            >
                                {deleteLoading && selectedCoupon ? (
                                    <ActivityIndicator size="small" color="#FF3B30" />
                                ) : (
                                    <Text style={[styles.modalOptionText, styles.deleteText]}>🗑️ Delete</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>

            {/* Create Coupon Modal */}
            {createModalVisible && (
                <CreateCouponModal 
                    onClose={() => setCreateModalVisible(false)} 
                    onSubmit={handleCreateCoupon}
                    loading={createLoading}
                />
            )}

            {/* Edit Coupon Modal */}
            {editModalVisible && selectedCoupon && (
                <EditCouponModal 
                    onClose={() => setEditModalVisible(false)} 
                    onSubmit={handleUpdateCoupon}
                    initialData={selectedCoupon}
                    loading={updateLoading}
                />
            )}
        </SafeAreaView>
    );
};

// --- Dropdown Styles ---
const dropdownStyles = StyleSheet.create({
    dropdownContainer: {
        position: 'absolute',
        top: 50, 
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        zIndex: 10,
        maxHeight: 200, 
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
    },
    dropdownOption: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center',
    },
    selectedOption: {
        backgroundColor: '#e8f5e8',
    },
    dropdownText: {
        fontSize: 14,
        color: '#333',
    },
    selectedText: {
        fontWeight: 'bold',
        color: '#4CAF50',
    }
});

// --- Styles for the Main Screen ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, paddingHorizontal: 16 },
    header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    headerIcon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    iconText: { fontSize: 28, color: '#000', fontWeight: '300' },
    headerTitle: { fontSize: 20, fontWeight: '600', color: '#000', flex: 1, textAlign: 'center' },
    
    actionRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16,
        zIndex: 2,
    },
    createButton: { 
        backgroundColor: '#fff', 
        paddingHorizontal: 16, 
        paddingVertical: 10, 
        borderRadius: 8, 
        borderWidth: 1, 
        borderColor: 'rgba(76, 175, 80, 1)',
    },
    createButtonText: { 
        color: '#4CAF50', 
        fontWeight: '600', 
        fontSize: 16, 
    },
    
    filterDropdownWrapper: {
        position: 'relative',
        zIndex: 3,
        width: 150,
    },
    statusFilter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    statusFilterText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    dropdownArrow: {
        fontSize: 12,
        color: '#666',
    },
    filterOptionsContainer: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
        overflow: 'hidden',
    },
    filterOption: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    filterOptionText: {
        fontSize: 14,
        color: '#333',
    },

    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 16, color: '#FF3B30', textAlign: 'center', marginBottom: 15 },
    retryButton: { backgroundColor: '#4CAF50', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    retryButtonText: { color: '#fff', fontWeight: 'bold' },
    noCouponsText: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 5 },
    noCouponsSubText: { fontSize: 14, color: '#666' },
    scrollView: { flex: 1 },
    couponCard: { 
        backgroundColor: '#fff', 
        borderRadius: 8, 
        padding: 16, 
        marginBottom: 15, 
        borderWidth: 1, 
        borderColor: '#e0e0e0', 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 2, 
        elevation: 3, 
        position: 'relative', 
        minHeight: 135,
    },
    cardContent: { flex: 1, marginRight: 40 },
    textRow: { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-start' },
    couponLabel: { fontSize: 14, color: '#666', width: 90 },
    couponDivider: { fontSize: 14, color: '#666', marginRight: 8 },
    couponValue: { fontSize: 14, fontWeight: '500', color: '#000', flexShrink: 1 },
    threeDots: { position: 'absolute', top: 10, right: 10, padding: 8 },
    threeDotsText: { fontSize: 24, fontWeight: 'bold', color: '#666' },
    statusContainer: { 
        position: 'absolute', 
        bottom: 16, 
        right: 16, 
        paddingHorizontal: 12, 
        paddingVertical: 4, 
        borderRadius: 6, 
    },
    activeStatus: { backgroundColor: '#4CAF50' },
    expiredStatus: { backgroundColor: '#777777' },
    statusText: { fontSize: 12, fontWeight: '600', color: '#fff', textTransform: 'capitalize' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.2)',},
    modalContent: { 
        position: 'absolute', 
        backgroundColor: 'white', 
        borderRadius: 8, 
        minWidth: 140,
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.25, 
        shadowRadius: 3.84, 
        elevation: 5, 
        overflow: 'hidden', 
    },
    modalOption: { 
        paddingVertical: 12, 
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalOptionText: { fontSize: 16, color: '#000' },
    deleteText: { color: '#FF3B30' },
    modalDivider: { height: 1, backgroundColor: '#f0f0f0' },
});

// --- Styles for Create Coupon Modal ---
const createModalStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(162, 153, 153, 0.7)', 
        justifyContent: 'flex-end', 
    },
    modalContainer: {
        width: '100%',
        height: '83%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 202, 40, 0.5)',
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        textAlign: 'center',
        flex: 1,
    },
    headerIcon: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: {
        fontSize: 28,
        color: '#000',
        fontWeight: '300',
    },
    scrollViewContent: {
        paddingTop: 15,
        paddingBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginTop: 15,
        marginBottom: 8,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1, 
    },
    textInput: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderColor: '#f4e8b3', 
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#000',
        justifyContent: 'center',
    },
    dateText: {
        fontSize: 16,
        color: '#000',
    },
    starIcon: {
        position: 'absolute',
        right: 15,
        fontSize: 18,
        color: '#FFD700', 
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
        zIndex: 5, 
    },
    halfInput: {
        width: '48%', 
    },
    discountInputWrapper: { 
        position: 'relative',
        zIndex: 10, 
    },
    categoryInputWrapper: {
        position: 'relative',
        zIndex: 100,
        width: '100%',
    },
    discountInputGroup: {
        flexDirection: 'row',
        height: 50,
        alignItems: 'center',
    },
    discountDropdown: {
        width: 60,
        height: 50,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#f4e8b3',
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 5,
        marginLeft: -1,
    },
    discountText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    dropdownArrow: {
        fontSize: 16,
        color: '#666',
        marginLeft: 5,
    },
    dropdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 15,
    },
    dropdownText: {
        fontSize: 16,
        color: '#000',
    },
    createButton: {
        backgroundColor: '#4CAF50', 
        paddingVertical: 15,
        borderRadius: 10,
        marginTop: 20, 
        alignItems: 'center',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    createButtonDisabled: {
        backgroundColor: '#A5D6A7',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default MyCoupons;