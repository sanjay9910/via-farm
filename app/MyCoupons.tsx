import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { useNavigation } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, normalizeFont, scale } from "./Responsive";

// --- API Configuration ---
const API_BASE_URL = "https://viafarm-1.onrender.com";
const API_ENDPOINTS = {
  GET_COUPONS: "/api/vendor/coupons",
  CREATE_COUPON: "/api/vendor/coupons/create",
  UPDATE_COUPON: "/api/vendor/coupons/",
  DELETE_COUPON: "/api/vendor/coupons/",
  GET_PRODUCTS: "/api/vendor/products",
};

// Helper Function to format Date
const formatDate = (isoDate) => {
  if (!isoDate) return "N/A";
  const date = new Date(isoDate);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper to convert Date to DD/MM/YYYY
const formatDateToDisplay = (date) => {
  if (!date) return "";
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper to format date to YYYY-MM-DD for API
const formatDateForAPI = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// --- Enhanced Category Dropdown with Checkboxes and Product Dropdown ---
const CategoryProductDropdown = ({
  visible,
  selectedCategories,
  selectedProducts,
  onCategoryToggle,
  onProductSelect,
  onClose,
  products,
}) => {
  const categories = [
    "All Products",
    "Fruits",
    "Vegetables",
    "Plants",
    "Seeds",
    "Handicrafts",
  ];

  const [expandedCategory, setExpandedCategory] = useState(null);

  if (!visible) return null;

  const getProductsByCategory = (category) => {
    if (category === "All Products") return products;
    return products.filter((product) => product.category === category);
  };

  const isCategorySelected = (category) => {
    return selectedCategories.includes(category);
  };

  const isProductSelected = (productId) => {
    return selectedProducts.includes(productId);
  };

  return (
    <View style={dropdownStyles.dropdownContainer}>
      <ScrollView
        style={dropdownStyles.scrollView}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={true}
      >
        {categories.map((category) => {
          const categoryProducts = getProductsByCategory(category);
          const isExpanded = expandedCategory === category;

          return (
            <View key={category} style={dropdownStyles.categoryContainer}>
              <View style={dropdownStyles.categoryRow}>
                {/* Checkbox for category */}
                <TouchableOpacity
                  style={dropdownStyles.checkboxContainer}
                  onPress={() => onCategoryToggle(category)}
                >
                  <View
                    style={[
                      dropdownStyles.checkbox,
                      isCategorySelected(category) &&
                        dropdownStyles.checkboxSelected,
                    ]}
                  >
                    {isCategorySelected(category) && (
                      <Text style={dropdownStyles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={dropdownStyles.categoryText}>{category}</Text>
                </TouchableOpacity>

                {/* Dropdown arrow for products */}
                {category !== "All Products" && categoryProducts.length > 0 && (
                  <TouchableOpacity
                    style={dropdownStyles.expandButton}
                    onPress={() =>
                      setExpandedCategory(isExpanded ? null : category)
                    }
                  >
                    <Text style={dropdownStyles.expandArrow}>
                      {isExpanded ? "▲" : "▼"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Products dropdown */}
              {isExpanded && category !== "All Products" && (
                <View style={dropdownStyles.productsContainer}>
                  {categoryProducts.map((product) => (
                    <TouchableOpacity
                      key={product._id}
                      style={[
                        dropdownStyles.productRow,
                        isProductSelected(product._id) &&
                          dropdownStyles.productRowSelected,
                      ]}
                      onPress={() => onProductSelect(product._id, category)}
                    >
                      <Text
                        style={[
                          dropdownStyles.productText,
                          isProductSelected(product._id) &&
                            dropdownStyles.productTextSelected,
                        ]}
                      >
                        {product.name}
                      </Text>
                      {isProductSelected(product._id) && (
                        <Text style={dropdownStyles.productCheckmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
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
  loading = false,
}) => {
  const [couponCode, setCouponCode] = useState(initialData?.code || "");
  const initialDiscount = initialData?.discount
    ? parseInt(initialData.discount.replace("%", ""))
    : 10;
  const [discount, setDiscount] = useState(initialDiscount);
  const [minimumOrder, setMinimumOrder] = useState(
    initialData?.minimumOrder || ""
  );
  const [totalUsageLimit, setTotalUsageLimit] = useState(
    initialData?.totalUsageLimit?.toString() || "20"
  );
  const [usageLimitPerUser, setUsageLimitPerUser] = useState(
    initialData?.usageLimitPerUser?.toString() || "1"
  );

  // Parse dates properly from DD/MM/YYYY format
  const parseDisplayDate = (dateStr) => {
    if (!dateStr || dateStr === "N/A") return new Date();
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date(dateStr);
  };

  const [startDate, setStartDate] = useState(
    initialData?.startDate
      ? parseDisplayDate(initialData.startDate)
      : new Date()
  );
  const [expiryDate, setExpiryDate] = useState(
    initialData?.validTill
      ? parseDisplayDate(initialData.validTill)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );

  const [selectedCategories, setSelectedCategories] = useState(
    initialData?.appliesTo || []
  );
  const [selectedProducts, setSelectedProducts] = useState(
    initialData?.productIds || []
  );
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const getAuthToken = async () => {
    try {
      let token = await AsyncStorage.getItem("userToken");
      const HARDCODED_TOKEN = "YOUR_ACTUAL_VALID_TOKEN_HERE";
      if (!token || token === HARDCODED_TOKEN) {
        token = HARDCODED_TOKEN;
      }
      return token;
    } catch (error) {
      return null;
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const token = await getAuthToken();
      const response = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.GET_PRODUCTS}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data && response.data.success) {
        setProducts(response.data.data);
      }
    } catch (err) {
      console.error("Fetch Products Error:", err.response?.data || err.message);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleCategoryToggle = (category) => {
    if (category === "All Products") {
      // If "All Products" is selected, clear everything and select it
      if (selectedCategories.includes("All Products")) {
        setSelectedCategories([]);
        setSelectedProducts([]);
      } else {
        setSelectedCategories(["All Products"]);
        setSelectedProducts([]);
      }
    } else {
      // Remove "All Products" if any specific category is selected
      let updatedCategories = selectedCategories.filter(
        (cat) => cat !== "All Products"
      );

      if (updatedCategories.includes(category)) {
        // Deselect category
        updatedCategories = updatedCategories.filter((cat) => cat !== category);
        // Remove all products from this category
        const categoryProductIds = products
          .filter((p) => p.category === category)
          .map((p) => p._id);
        setSelectedProducts(
          selectedProducts.filter((id) => !categoryProductIds.includes(id))
        );
      } else {
        // Select category - but DON'T auto-select products
        updatedCategories.push(category);
      }

      setSelectedCategories(updatedCategories);
    }
  };

  const handleProductSelect = (productId, category) => {
    if (selectedProducts.includes(productId)) {
      // Deselect product
      const updatedProducts = selectedProducts.filter((id) => id !== productId);
      setSelectedProducts(updatedProducts);

      // Check if category should be deselected
      const categoryProducts = products.filter((p) => p.category === category);
      const hasOtherProductsFromCategory = categoryProducts.some(
        (p) => p._id !== productId && updatedProducts.includes(p._id)
      );

      if (!hasOtherProductsFromCategory) {
        setSelectedCategories(
          selectedCategories.filter((cat) => cat !== category)
        );
      }
    } else {
      // Select product
      setSelectedProducts([...selectedProducts, productId]);
      // Add category if not already added
      if (!selectedCategories.includes(category)) {
        setSelectedCategories([...selectedCategories, category]);
      }
    }
  };

  const getApplicableOnText = () => {
    if (selectedCategories.includes("All Products")) {
      return "All Products";
    }
    if (selectedProducts.length > 0) {
      return `${selectedProducts.length} Product(s) selected`;
    }
    if (selectedCategories.length > 0) {
      return selectedCategories.join(", ");
    }
    return "Select categories or products";
  };

  const handleFormSubmit = () => {
    if (!couponCode.trim()) {
      Alert.alert("Error", "Please enter coupon code.");
      return;
    }
    if (!discount || discount < 1 || discount > 100) {
      Alert.alert("Error", "Please enter a valid discount between 1-100%.");
      return;
    }
    if (!minimumOrder || parseInt(minimumOrder) < 0) {
      Alert.alert("Error", "Please enter valid minimum order amount.");
      return;
    }
    if (!totalUsageLimit || parseInt(totalUsageLimit) < 1) {
      Alert.alert("Error", "Please enter valid total usage limit.");
      return;
    }
    if (!usageLimitPerUser || parseInt(usageLimitPerUser) < 1) {
      Alert.alert("Error", "Please enter valid usage limit per user.");
      return;
    }
    if (expiryDate <= startDate) {
      Alert.alert("Error", "Expiry date must be after start date.");
      return;
    }
    if (startDate < new Date()) {
      Alert.alert("Error", "Start date cannot be in the past.");
      return;
    }
    if (
      selectedCategories.length === 0 &&
      !selectedCategories.includes("All Products")
    ) {
      Alert.alert("Error", "Please select at least one category or product.");
      return;
    }

    // Prepare final data - don't auto-select products for categories
    let finalSelectedProducts = [...selectedProducts];
    let finalSelectedCategories = [...selectedCategories];

    const couponData = {
      code: couponCode.trim().toUpperCase(),
      discountValue: parseInt(discount),
      discountType: "Percentage",
      minimumOrder: parseInt(minimumOrder),
      totalUsageLimit: parseInt(totalUsageLimit),
      usageLimitPerUser: parseInt(usageLimitPerUser),
      startDate: new Date(startDate).toISOString(),
      expiryDate: new Date(expiryDate).toISOString(),
      appliesTo: selectedCategories.includes("All Products")
        ? ["All Products"]
        : selectedCategories,
      productIds: finalSelectedProducts,
      status: "Active",
    };

    if (initialData?.id) {
      couponData.id = initialData.id;
    }

    onSubmit(couponData);
  };

  const handleDiscountChange = (text) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    if (
      numericValue === "" ||
      (numericValue <= 100 && numericValue.length <= 3)
    ) {
      setDiscount(numericValue === "" ? "" : parseInt(numericValue));
    }
  };

  const handleMinimumOrderChange = (text) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    setMinimumOrder(numericValue);
  };

  const handleTotalUsageLimitChange = (text) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    setTotalUsageLimit(numericValue);
  };

  const handleUsageLimitPerUserChange = (text) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    setUsageLimitPerUser(numericValue);
  };

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
          setCategoryDropdownVisible(false);
        }}
      >
        <View
          style={createModalStyles.modalContainer}
          onStartShouldSetResponder={() => true}
          onResponderRelease={() => setCategoryDropdownVisible(false)}
        >
          {/* Header */}
          <View style={createModalStyles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={createModalStyles.headerIcon}
            >
            <Image source={require("../assets/via-farm-img/icons/groupArrow.png")} />
            </TouchableOpacity>
            <Text style={createModalStyles.headerTitle}>{title}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={createModalStyles.scrollViewContent}
          >
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
                autoCapitalize="characters"
              />
              <Text style={createModalStyles.starIcon}>✨</Text>
            </View>

            {/* Discount & Minimum Order (Row) */}
            <View style={createModalStyles.row}>
              <View style={createModalStyles.halfInput}>
                <Text style={createModalStyles.label}>Discount *</Text>
                <View style={createModalStyles.discountInputGroup}>
                  <TextInput
                    style={[
                      createModalStyles.textInput,
                      {
                        flex: 1,
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                      },
                    ]}
                    keyboardType="numeric"
                    value={String(discount)}
                    onChangeText={handleDiscountChange}
                    placeholder="20"
                    placeholderTextColor="#999"
                  />
                  <View style={createModalStyles.discountDropdown}>
                    <Text style={createModalStyles.discountText}>%</Text>
                  </View>
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

            {/* Total Usage Limit & Usage Limit Per User (Row) */}
            <View style={createModalStyles.row}>
              <View style={createModalStyles.halfInput}>
                <Text style={createModalStyles.label}>Total Usage Limit *</Text>
                <TextInput
                  style={createModalStyles.textInput}
                  keyboardType="numeric"
                  value={totalUsageLimit}
                  onChangeText={handleTotalUsageLimitChange}
                  placeholder="e.g. 20"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={createModalStyles.halfInput}>
                <Text style={createModalStyles.label}>
                  Usage Limit Per User *
                </Text>
                <TextInput
                  style={createModalStyles.textInput}
                  keyboardType="numeric"
                  value={usageLimitPerUser}
                  onChangeText={handleUsageLimitPerUserChange}
                  placeholder="e.g. 1"
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
                    minimumDate={
                      new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
                    }
                  />
                )}
              </View>
            </View>

            {/* Applicable On (Dropdown with Checkboxes and Products) */}
            <Text style={createModalStyles.label}>Applicable on *</Text>
            <View style={[createModalStyles.inputGroup, { zIndex: 100 }]}>
              <View style={createModalStyles.categoryInputWrapper}>
                <TouchableOpacity
                  style={[
                    createModalStyles.textInput,
                    createModalStyles.dropdown,
                  ]}
                  onPress={() =>
                    setCategoryDropdownVisible(!categoryDropdownVisible)
                  }
                >
                  <Text
                    style={createModalStyles.dropdownText}
                    numberOfLines={1}
                  >
                    {getApplicableOnText()}
                  </Text>
                  <Text style={createModalStyles.dropdownArrow}>
                    {categoryDropdownVisible ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>

                <CategoryProductDropdown
                  visible={categoryDropdownVisible}
                  selectedCategories={selectedCategories}
                  selectedProducts={selectedProducts}
                  onCategoryToggle={handleCategoryToggle}
                  onProductSelect={handleProductSelect}
                  onClose={() => setCategoryDropdownVisible(false)}
                  products={products}
                />
              </View>
            </View>

            {productsLoading && (
              <Text style={createModalStyles.loadingText}>
                Loading products...
              </Text>
            )}

            <View style={{ height: 30 }} />
          </ScrollView>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              createModalStyles.createButton,
              loading && createModalStyles.createButtonDisabled,
            ]}
            onPress={handleFormSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={createModalStyles.createButtonText}>
                {submitButtonText}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// Simplified wrappers
const CreateCouponModal = (props) => (
  <CouponForm
    title="Create a Coupon"
    submitButtonText="Create Coupon"
    initialData={{}}
    {...props}
  />
);

const EditCouponModal = (props) => (
  <CouponForm title="Edit Coupon" submitButtonText="Update Coupon" {...props} />
);

const MyCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [originalCoupons, setOriginalCoupons] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDropdownVisible, setFilterDropdownVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const threeDotsRefs = useRef({});
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const navigation = useNavigation();

  const getAuthToken = async () => {
    try {
      let token = await AsyncStorage.getItem("userToken");
      const HARDCODED_TOKEN = "YOUR_ACTUAL_VALID_TOKEN_HERE";
      if (!token || token === HARDCODED_TOKEN) {
        token = HARDCODED_TOKEN;
      }
      if (token === "YOUR_ACTUAL_VALID_TOKEN_HERE" || !token) {
        throw new Error(
          "Please log in, or update the HARDCODED_TOKEN in the code for testing."
        );
      }
      return token;
    } catch (error) {
      throw error;
    }
  };

  const fetchCoupons = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      const response = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.GET_COUPONS}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data && response.data.success) {
        const fetchedCoupons = response.data.data.map((coupon) => ({
          id: coupon._id,
          code: coupon.code,
          discount: `${coupon.discount?.value || 0}%`,
          appliesTo: coupon.appliesTo || [],
          productIds: coupon.productIds || [],
          startDate: formatDate(coupon.startDate || coupon.validFrom),
          validTill: formatDate(coupon.expiryDate || coupon.validTill),
          minimumOrder: coupon.minimumOrder?.toString() || "0",
          totalUsageLimit: coupon.totalUsageLimit || 0,
          usageLimitPerUser: coupon.usageLimitPerUser || 0,
          status: coupon.status,
        }));

        setOriginalCoupons(fetchedCoupons);
        setCoupons(fetchedCoupons);
      } else {
        setError(response.data.message || "Failed to fetch coupons.");
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Could not load coupons. Please check your connection.";

      console.error("API Fetch Error:", error?.response?.data || errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (couponData) => {
    setCreateLoading(true);
    try {
      const token = await getAuthToken();
      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.CREATE_COUPON}`,
        couponData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.success) {
        Alert.alert("Success", "Coupon created successfully!");
        const newCoupon = {
          id: response.data.data._id,
          code: response.data.data.code,
          discount: `${response.data.data.discount.value}%`,
          appliesTo: response.data.data.appliesTo || [],
          productIds: response.data.data.productIds || [],
          startDate: formatDate(
            response.data.data.startDate || response.data.data.validFrom
          ),
          validTill: formatDate(
            response.data.data.expiryDate || response.data.data.validTill
          ),
          minimumOrder: response.data.data.minimumOrder?.toString() || "0",
          totalUsageLimit: response.data.data.totalUsageLimit || 0,
          usageLimitPerUser: response.data.data.usageLimitPerUser || 0,
          status: response.data.data.status,
        };

        setOriginalCoupons((prev) => [newCoupon, ...prev]);
        setCreateModalVisible(false);
      } else {
        Alert.alert(
          "Error",
          response.data.message || "Failed to create coupon."
        );
      }
    } catch (err) {
      console.error("Create Coupon Error:", err.response?.data || err.message);
      const errorMessage =
        err.response?.data?.message ||
        "Failed to create coupon. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateCoupon = async (couponData) => {
    setUpdateLoading(true);
    try {
      const token = await getAuthToken();
      const { id, ...updatePayload } = couponData;
      const response = await axios.put(
        `${API_BASE_URL}${API_ENDPOINTS.UPDATE_COUPON}${id}`,
        updatePayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.success) {
        Alert.alert("Success", "Coupon updated successfully!");
        const updatedCoupon = {
          id: response.data.data._id,
          code: response.data.data.code,
          discount: `${response.data.data.discount.value}%`,
          appliesTo: response.data.data.appliesTo || [],
          productIds: response.data.data.productIds || [],
          startDate: formatDate(
            response.data.data.startDate || response.data.data.validFrom
          ),
          validTill: formatDate(
            response.data.data.expiryDate || response.data.data.validTill
          ),
          minimumOrder: response.data.data.minimumOrder?.toString() || "0",
          totalUsageLimit: response.data.data.totalUsageLimit || 0,
          usageLimitPerUser: response.data.data.usageLimitPerUser || 0,
          status: response.data.data.status,
        };

        setOriginalCoupons((prev) =>
          prev.map((coupon) =>
            coupon.id === updatedCoupon.id ? updatedCoupon : coupon
          )
        );
        setEditModalVisible(false);
      } else {
        Alert.alert(
          "Error",
          response.data.message || "Failed to update coupon."
        );
      }
    } catch (err) {
      console.error("Update Coupon Error:", err.response?.data || err.message);
      const errorMessage =
        err.response?.data?.message ||
        "Failed to update coupon. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    setDeleteLoading(true);
    try {
      const token = await getAuthToken();
      
      // API endpoint fix - make sure it's correct
      const deleteEndpoint = `${API_BASE_URL}${API_ENDPOINTS.DELETE_COUPON}${couponId}`;
      console.log("Delete URL:", deleteEndpoint); // Debug log
      
      const response = await axios.delete(deleteEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Delete Response:", response.data); // Debug log

      if (response.data && response.data.success) {
        Alert.alert("Success", "Coupon deleted successfully!");
        
        // Update both coupon lists
        setOriginalCoupons((prev) =>
          prev.filter((coupon) => coupon.id !== couponId)
        );
        
        setCoupons((prev) =>
          prev.filter((coupon) => coupon.id !== couponId)
        );
        
      } else {
        Alert.alert(
          "Error",
          response.data?.message || "Failed to delete coupon. Please try again."
        );
      }
    } catch (err) {
      console.error("Delete Coupon Error:", err);
      
      // More detailed error logging
      if (err.response) {
        console.error("Response Error:", err.response.status, err.response.data);
      } else if (err.request) {
        console.error("Request Error:", err.request);
      } else {
        console.error("Error:", err.message);
      }

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to delete coupon. Please check your connection and try again.";
        
      Alert.alert("Error", errorMessage);
    } finally {
      setDeleteLoading(false);
      setActionModalVisible(false);
      setSelectedCoupon(null); // Reset selected coupon
    }
  };

  const getFilteredCoupons = () => {
    if (filterStatus === "all") {
      return originalCoupons;
    }
    const statusToMatch = filterStatus.toLowerCase();
    return originalCoupons.filter(
      (coupon) => coupon.status.toLowerCase() === statusToMatch
    );
  };

  useEffect(() => {
    setCoupons(getFilteredCoupons());
  }, [filterStatus, originalCoupons]);

  const handleThreeDotsPress = (coupon) => {
    const ref = threeDotsRefs.current[coupon.id];
    if (ref) {
      ref.measure((fx, fy, width, height, px, py) => {
        setModalPosition({
          x: px - 100,
          y: py + height + 5,
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
      "Delete Coupon",
      `Are you sure you want to delete coupon "${selectedCoupon?.code}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeleteCoupon(selectedCoupon.id),
        },
      ]
    );
  };

  const getAppliestoDisplay = (coupon) => {
    if (coupon.appliesTo.includes("All Products")) {
      return "All Products";
    }
    if (coupon.productIds && coupon.productIds.length > 0) {
      return `${coupon.productIds.length} Product(s)`;
    }
    return coupon.appliesTo.join(", ");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerIcon}
          >
           <Image source={require('../assets/via-farm-img/icons/groupArrow.png')} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Coupons</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setCreateModalVisible(true)}
          >
            <Text style={styles.createButtonText}>+ Create a Coupon</Text>
          </TouchableOpacity>

          <View style={styles.filterDropdownWrapper}>
            <TouchableOpacity
              style={styles.statusFilter}
              onPress={() => setFilterDropdownVisible(!filterDropdownVisible)}
            >
              <Text style={styles.statusFilterText}>
                {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}{" "}
                Coupons
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            {filterDropdownVisible && (
              <View style={styles.filterOptionsContainer}>
                {["all", "active", "expired"].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={styles.filterOption}
                    onPress={() => {
                      setFilterStatus(status);
                      setFilterDropdownVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filterStatus === status && {
                          fontWeight: "bold",
                          color: "#4CAF50",
                        },
                      ]}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={{ marginTop: 10, color: "#666" }}>
              Loading Coupons...
            </Text>
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
            <Text style={styles.noCouponsText}>
              No {filterStatus === "all" ? "" : filterStatus} coupons found.
            </Text>
            <Text style={styles.noCouponsSubText}>
              Tap 'Create a Coupon' to add one.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
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
                    <Text style={styles.couponValue}>
                      {getAppliestoDisplay(coupon)}
                    </Text>
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
                <View
                  style={[
                    styles.statusContainer,
                    coupon.status.toLowerCase() === "active"
                      ? styles.activeStatus
                      : styles.expiredStatus,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      coupon.status.toLowerCase() === "active"
                        ? styles.activeStatusText
                        : styles.expiredStatusText,
                    ]}
                  >
                    {coupon.status}
                  </Text>
                </View>
              </View>
            ))}
            <View style={{ height: 50 }} />
          </ScrollView>
        )}

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
            <View
              style={[
                styles.modalContent,
                { top: modalPosition.y, left: modalPosition.x },
              ]}
            >
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
                  <Text style={[styles.modalOptionText, styles.deleteText]}>
                    🗑️ Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

      {createModalVisible && (
        <CreateCouponModal
          onClose={() => setCreateModalVisible(false)}
          onSubmit={handleCreateCoupon}
          loading={createLoading}
        />
      )}

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
    position: "absolute",
    top: moderateScale(50),
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: moderateScale(12),
    borderWidth: scale(1),
    borderColor: "#4CAF50",
    zIndex: 10,
    maxHeight: moderateScale(350),
    marginBottom: moderateScale(100),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowOpacity: 0.15,
    shadowRadius: moderateScale(8),
    elevation: 8,
  },
  scrollView: {
    maxHeight: moderateScale(350),
  },
  categoryContainer: {
    borderBottomWidth: scale(1),
    borderBottomColor: "#f0f0f0",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(12),
    paddingHorizontal: scale(16),
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  checkbox: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(6),
    borderWidth: scale(2),
    borderColor: "#4CAF50",
    marginRight: moderateScale(12),
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#4CAF50",
  },
  checkmark: {
    color: "#fff",
    fontSize: normalizeFont(14),
    fontWeight: "bold",
  },
  categoryText: {
    fontSize: normalizeFont(16),
    color: "#333",
    fontWeight: "600",
  },
  expandButton: {
    padding: moderateScale(6),
    backgroundColor: "#f8f8f8",
    borderRadius: moderateScale(6),
  },
  expandArrow: {
    fontSize: normalizeFont(14),
    color: "#4CAF50",
    fontWeight: "bold",
  },
  productsContainer: {
    backgroundColor: "#f9f9f9",
    paddingLeft: moderateScale(48),
    borderTopWidth: scale(1),
    borderTopColor: "#e8e8e8",
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(10),
    paddingHorizontal: scale(16),
    borderBottomWidth: scale(1),
    borderBottomColor: "#e8e8e8",
  },
  productRowSelected: {
    backgroundColor: "#e8f5e8",
  },
  productText: {
    fontSize: normalizeFont(14),
    color: "#555",
    flex: 1,
  },
  productTextSelected: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  productCheckmark: {
    color: "#4CAF50",
    fontSize: normalizeFont(16),
    fontWeight: "bold",
    marginLeft: moderateScale(8),
  },
});

// --- Main Screen Styles (responsive) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: scale(14) },
  header: { flexDirection: "row", alignItems: "center", paddingVertical: moderateScale(10) },
  headerIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: { fontSize: normalizeFont(20), color: "#000", fontWeight: "300" },
  headerTitle: {
    fontSize: normalizeFont(17),
    fontWeight: "600",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(16),
    zIndex: 2,
  },
  createButton: {
    backgroundColor: "#fff",
    paddingHorizontal: scale(13),
    paddingVertical: moderateScale(9),
    borderRadius: moderateScale(8),
    borderWidth: scale(2),
    borderColor: "rgba(76, 175, 80, 1)",
  },
  createButtonText: {
    color: "#4CAF50",
    fontWeight: "600",
    fontSize: normalizeFont(14),
  },
  filterDropdownWrapper: {
    position: "relative",
    zIndex: 3,
    width: scale(150),
  },
  statusFilter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(10),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
    borderWidth: scale(1),
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  statusFilterText: {
    fontSize: normalizeFont(12),
    color: "#333",
    fontWeight: "500",
  },
  dropdownArrow: {
    fontSize: normalizeFont(11),
    color: "#666",
  },
  filterOptionsContainer: {
    position: "absolute",
    top: moderateScale(50),
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: moderateScale(8),
    borderWidth: scale(1),
    borderColor: "#4CAF50",
    marginBottom: moderateScale(100),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(3),
    elevation: 5,
  },
  filterOption: {
    padding: moderateScale(12),
    borderBottomWidth: scale(1),
    borderBottomColor: "#f0f0f0",
  },
  filterOptionText: {
    fontSize: normalizeFont(12),
    color: "#333",
  },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: {
    fontSize: normalizeFont(12),
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: moderateScale(15),
  },
  retryButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: scale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
  },
  retryButtonText: { color: "#fff", fontWeight: "bold", fontSize: normalizeFont(12) },
  noCouponsText: {
    fontSize: normalizeFont(14),
    fontWeight: "600",
    color: "#333",
    marginBottom: moderateScale(5),
  },
  noCouponsSubText: { fontSize: normalizeFont(12), color: "#666" },
  scrollView: { flex: 1 },
  couponCard: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(15),
    borderWidth: scale(1),
    borderColor: "#e8e8e8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(4),
    elevation: 3,
    position: "relative",
    minHeight: moderateScale(135),
  },
  cardContent: { flex: 1, marginRight: moderateScale(40) },
  textRow: { flexDirection: "row", marginBottom: moderateScale(4), alignItems: "flex-start" },
  couponLabel: { fontSize: normalizeFont(14), color: "#666", width: moderateScale(90) },
  couponDivider: { fontSize: normalizeFont(14), color: "#666", marginRight: moderateScale(8) },
  couponValue: {
    fontSize: normalizeFont(12),
    fontWeight: "500",
    color: "#000",
    flexShrink: 1,
  },
  threeDots: { position: "absolute", top: moderateScale(10), right: moderateScale(10), padding: moderateScale(8) },
  threeDotsText: { fontSize: normalizeFont(20), fontWeight: "bold", color: "#666" },
  statusContainer: {
    position: "absolute",
    bottom: moderateScale(16),
    right: moderateScale(16),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  activeStatus: { backgroundColor: "#4CAF50" },
  expiredStatus: { backgroundColor: "#777777" },
  statusText: {
    fontSize: normalizeFont(10),
    fontWeight: "600",
    color: "#fff",
    textTransform: "capitalize",
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.2)" },
  modalContent: {
    position: "absolute",
    backgroundColor: "white",
    borderRadius: moderateScale(8),
    minWidth: moderateScale(140),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(3.84),
    elevation: 5,
  },
  modalOption: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    flexDirection: "row",
    alignItems: "center",
  },
  modalOptionText: { fontSize: normalizeFont(16), color: "#000" },
  deleteText: { color: "#FF3B30" },
  modalDivider: { height: scale(1), backgroundColor: "#f0f0f0" },
});

// --- Create/Edit Modal Styles (responsive) ---
const createModalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(162, 153, 153, 0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
    height: "90%",
    backgroundColor: "#fff",
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    borderWidth: scale(2),
    borderColor: "rgba(255, 202, 40, 0.5)",
    paddingHorizontal: scale(16),
    paddingBottom: moderateScale(30),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(15),
    borderBottomWidth: scale(1),
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: normalizeFont(15),
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    flex: 1,
  },
  headerIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: normalizeFont(24),
    color: "#000",
    fontWeight: "300",
  },
  scrollViewContent: {
    paddingTop: moderateScale(15),
    paddingBottom: moderateScale(20),
  },
  label: {
    fontSize: normalizeFont(12),
    fontWeight: "600",
    color: "#333",
    marginTop: moderateScale(15),
    marginBottom: moderateScale(8),
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    zIndex: 1,
  },
  textInput: {
    // flex: 1,
    height: moderateScale(50),
    borderWidth: scale(1),
    borderColor: "#f4e8b3",
    backgroundColor: "#fff",
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(15),
    fontSize: normalizeFont(14),
    color: "#000",
    justifyContent: "center",
  },
  dateText: {
    fontSize: normalizeFont(14),
    color: "#000",
  },
  starIcon: {
    position: "absolute",
    right: moderateScale(15),
    fontSize: normalizeFont(16),
    color: "#FFD700",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: moderateScale(15),
    zIndex: 5,
  },
  halfInput: {
    width: "48%",
  },
  categoryInputWrapper: {
    position: "relative",
    zIndex: 100,
    width: "100%",
    paddingBottom: moderateScale(300),
  },
  discountInputGroup: {
    flexDirection: "row",
    height: moderateScale(50),
    alignItems: "center",
  },
  discountDropdown: {
    width: moderateScale(60),
    height: moderateScale(50),
    backgroundColor: "#fff",
    borderWidth: scale(1),
    borderColor: "#f4e8b3",
    borderTopRightRadius: moderateScale(8),
    borderBottomRightRadius: moderateScale(8),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -moderateScale(1),
  },
  discountText: {
    fontSize: normalizeFont(14),
    fontWeight: "600",
    color: "#333",
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: moderateScale(15),
  },
  dropdownText: {
    fontSize: normalizeFont(16),
    color: "#000",
  },
  loadingText: {
    fontSize: normalizeFont(12),
    color: "#666",
    marginTop: moderateScale(5),
    fontStyle: "italic",
  },
  createButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: moderateScale(15),
    borderRadius: moderateScale(10),
    marginTop: moderateScale(20),
    alignItems: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(5),
    elevation: 8,
  },
  createButtonDisabled: {
    backgroundColor: "#A5D6A7",
  },
  createButtonText: {
    color: "#fff",
    fontSize: normalizeFont(18),
    fontWeight: "bold",
  },
});

export default MyCoupons;