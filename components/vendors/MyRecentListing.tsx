import { moderateScale, normalizeFont, scale } from "@/app/Responsive";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "expo-router";
import React, { useEffect, useRef, useState, } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import ProductModal from "../../components/vendors/ProductEditModel";


const API_BASE = "https://viafarm-1.onrender.com";
const { width } = Dimensions.get("window");

const MyRecentListing = () => {
  const [listingsData, setListingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [isStockDropdownOpen, setIsStockDropdownOpen] = useState(false);
  const [stockDropdownPosition, setStockDropdownPosition] = useState({ x: 0, y: 0 });
  const [currentProductId, setCurrentProductId] = useState(null);
  const [updatingStock, setUpdatingStock] = useState(false);
  const stockButtonRefs = useRef({});
  const navigation = useNavigation();
  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "User not logged in!");
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_BASE}/api/vendor/recent-products`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const formattedData = res.data.products.map((product) => ({
          id: product._id,
          name: product.name,
          price: product.price,
          unit: product.unit,
          weightPerPiece:product.weightPerPiece,
          quantity: product.quantity,
          uploadedOn: new Date(product.datePosted).toLocaleDateString(),
          image: product.images[0] || "",
          status: product.status || "In Stock",
        }));
        setListingsData(formattedData);
      } else {
        Alert.alert("Error", "Could not fetch recent products");
      }
    } catch (error) {
      console.log("API Error:", error);
      Alert.alert("Error", "Something went wrong while fetching products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Refresh list when modal closes
  useEffect(() => {
    if (!modalVisible) {
      fetchProducts();
    }
  }, [modalVisible]);

  // Modal handlers
  const openModal = (product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedProduct(null);
  };

  const submitModal = (updatedProduct) => {
    const updatedList = listingsData.map((item) =>
      item.id === updatedProduct.id ? updatedProduct : item
    );
    setListingsData(updatedList);
    closeModal();
  };

  const viewAll = () => {
    navigation.navigate("MyRecentlyAllProduct");
  };


  // Stock Dropdown Handler
  const openStockDropdown = (productId) => {
    const ref = stockButtonRefs.current[productId];
    
    if (ref) {
      ref.measureInWindow((x, y, width, height) => {
        setStockDropdownPosition({ 
          x: x - 60, 
          y: y + height + 5 
        });
        setCurrentProductId(productId);
        setIsStockDropdownOpen(true);
      });
    }
  };

  // Stock Status Update Handler
  const handleStockChange = async (newStatus) => {
    if (!currentProductId) {
      Alert.alert("Error", "No product selected");
      return;
    }

    // Close dropdown immediately
    setIsStockDropdownOpen(false);
    
    // Start loading
    setUpdatingStock(true);

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "User not logged in!");
        setUpdatingStock(false);
        setCurrentProductId(null);
        return;
      }

      // Try multiple API methods
      let response = null;
      let lastError = null;

      // Method 1: PATCH /api/vendor/products/:id/status
      try {
        response = await axios.patch(
          `${API_BASE}/api/vendor/products/${currentProductId}/status`,
          { status: newStatus },
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
      } catch (err) {
        lastError = err;
        
        // Method 2: PATCH /api/vendor/products/:id (without /status)
        try {
          response = await axios.patch(
            `${API_BASE}/api/vendor/products/${currentProductId}`,
            { status: newStatus },
            { 
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            }
          );
        } catch (err2) {
          lastError = err2;
          
          // Method 3: PUT /api/vendor/products/:id
          try {
            response = await axios.put(
              `${API_BASE}/api/vendor/products/${currentProductId}`,
              { status: newStatus },
              { 
                headers: { 
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                timeout: 10000
              }
            );
          } catch (err3) {
            lastError = err3;
          }
        }
      }

      // Check if any method succeeded
      if (response && response.data && response.data.success) {
        // Update local state WITHOUT removing product
        const updatedList = listingsData.map((item) =>
          item.id === currentProductId ? { ...item, status: newStatus } : item
        );
        setListingsData(updatedList);
        Alert.alert("Success", `Product marked as ${newStatus}`);
      } else {
        throw lastError || new Error("Failed to update status");
      }

    } catch (error) {
      console.log("Stock update error:", error);
      
      if (error.response?.status === 404) {
        Alert.alert("Error", "API endpoint not found. Please check server.");
      } else if (error.response?.status === 401) {
        Alert.alert("Error", "Authentication failed. Please login again.");
      } else if (error.response?.status === 403) {
        Alert.alert("Error", "You don't have permission to update this product.");
      } else if (error.response?.status === 500) {
        Alert.alert("Server Error", error.response?.data?.message || "Internal server error");
      } else if (error.code === 'ECONNABORTED') {
        Alert.alert("Timeout", "Request took too long.");
      } else if (error.message === 'Network Error') {
        Alert.alert("Network Error", "Cannot connect to server.");
      } else {
        Alert.alert("Error", "Something went wrong while updating stock");
      }
    } finally {
      setUpdatingStock(false);
      setCurrentProductId(null);
    }
  };

  const renderItem = ({ item }) => {
    const circleColor = item.status.toLowerCase() === "in stock" ? "#22c55e" : "#ef4444";
    const isCurrentlyUpdating = updatingStock && currentProductId === item.id;

    return (
      <View style={styles.listingCard}>
        <View style={styles.cardContent}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: item.image }} 
              style={styles.itemImage} 
              resizeMode="cover"
            />
          </View>

          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.priceQuantityContainer}>
                <Text style={styles.priceText}>₹{item.price}/{item.unit}</Text>
                <Text style={styles.quantity}>{item.weightPerPiece}</Text>
              </View>
            </View>

            <View style={styles.detailsContainer}>
              <Text style={styles.uploadLabel}>Uploaded on:</Text>
              <Text style={styles.uploadValue}>{item.uploadedOn}</Text>
            </View>

            <View style={styles.startAllIndia}>
              <Image source={require("../../assets/via-farm-img/icons/satar.png")} />
              <Text style={styles.txetAll}>All India Delivery</Text>
            </View>

            <View style={styles.editBtn}>
              {/* Stock dropdown with loading */}
              <TouchableOpacity
                ref={(ref) => {
                  stockButtonRefs.current[item.id] = ref;
                }}
                style={[
                  styles.dropdownBtn,
                  isCurrentlyUpdating && styles.dropdownBtnDisabled
                ]}
                onPress={() => openStockDropdown(item.id)}
                disabled={isCurrentlyUpdating}
              >
      
                {isCurrentlyUpdating ? (
                  <View style={styles.statusRow}>
                    <ActivityIndicator size="small" color="rgba(255,202,40,1)" />
                    <Text style={styles.statusTextUpdating}>Updating...</Text>
                  </View>
                ) : (
                  <View style={styles.statusRow}>
                    <View style={[styles.statusCircle, { backgroundColor: circleColor }]} />
                    <Text style={[styles.statusText, { color: circleColor }]}>{item.status}</Text>
                  </View>
                )}
                 <Image source={require("../../assets/via-farm-img/icons/downArrow.png")} />
              </TouchableOpacity>

              {/* Edit button */}
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => openModal(item)}
                disabled={isCurrentlyUpdating}
              >
                <Image
                  source={require("../../assets/via-farm-img/icons/editicon.png")}
                  style={[
                    styles.editIcon,
                    isCurrentlyUpdating && styles.editIconDisabled
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator 
          size="large" 
          color="rgba(255,202,40,1)" 
        />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (listingsData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No products found</Text>
        <Text style={styles.emptySubText}>Start adding products to see them here</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRowContainer}>
        <Text style={styles.headerTitle}>My Recent Listings</Text>
        <TouchableOpacity onPress={viewAll} style={{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:5,}}>
          <Text style={styles.seeAll}>See All</Text>
          <Image  source={require("../../assets/via-farm-img/icons/see.png")} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={listingsData}
        horizontal
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
      />

      {/* Stock Dropdown Modal */}
      <Modal
        visible={isStockDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsStockDropdownOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsStockDropdownOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.stockDropdown,
                  { 
                    position: 'absolute',
                    top: stockDropdownPosition.y, 
                    left: stockDropdownPosition.x 
                  },
                ]}
              >
                <TouchableOpacity 
                  style={styles.stockOption} 
                  onPress={() => handleStockChange("In Stock")}
                >
                  <View style={[styles.stockDot, { backgroundColor: "#22c55e" }]} />
                  <Text style={styles.stockOptionText}>In Stock</Text>
                </TouchableOpacity>
                
                <View style={styles.stockDivider} />
                
                <TouchableOpacity 
                  style={styles.stockOption} 
                  onPress={() => handleStockChange("Out of Stock")}
                >
                  <View style={[styles.stockDot, { backgroundColor: "#ef4444" }]} />
                  <Text style={styles.stockOptionText}>Out of Stock</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Product Edit Modal */}
      {selectedProduct && (
        <ProductModal
          visible={modalVisible}
          onClose={closeModal}
          onSubmit={submitModal}
          product={selectedProduct}
        />
      )}
    </View>
  );
};

export default MyRecentListing;

const styles = StyleSheet.create({
  container: {
    paddingVertical: moderateScale(16),
    backgroundColor: "#fff",
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: moderateScale(12),
    fontSize: normalizeFont(12),
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: scale(20),
  },
  emptyText: {
    fontSize: normalizeFont(12),
    fontWeight: "600",
    color: "#333",
    marginBottom: moderateScale(8),
  },
  emptySubText: {
    fontSize: normalizeFont(12),
    color: "#666",
    textAlign: "center",
  },
  headerRowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(16),
    marginBottom: moderateScale(12),
  },
  headerTitle: {
    fontSize: normalizeFont(15),
    fontWeight: "700",
    color: "#333",
  },
  seeAll: {
    fontSize: normalizeFont(12),
    color: "rgba(1, 151, 218, 1)",
  },
  flatListContent: {
    paddingHorizontal: scale(12),
  },
  listingCard: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(8),
    marginRight: scale(15),
    borderWidth: 1,
    borderColor: "rgba(255, 202, 40, 1)",
    width: Math.min(width * 0.94, scale(520)), 
    alignSelf: "center",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
  },
  imageContainer: {
    width: scale(120),
    height: moderateScale(150),
  },
  itemImage: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: moderateScale(6),
    borderBottomLeftRadius: moderateScale(6),
    resizeMode: "cover",
  },
  textContainer: {
    flex: 1,
    paddingRight: scale(12),
    paddingVertical: moderateScale(4),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: moderateScale(8),
  },
  itemName: {
    fontSize: normalizeFont(12),
    fontWeight: "600",
    color: "#424242",
    flex: 1,
    marginRight: scale(8),
  },
  priceQuantityContainer: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: normalizeFont(12),
    fontWeight: "700",
    color: "#2E7D32",
  },
  quantity: {
    fontSize: normalizeFont(10),
    color: "#666",
    marginTop: moderateScale(2),
  },
  detailsContainer: {
    flexDirection: "row",
    gap: moderateScale(4),
    marginBottom: moderateScale(4),
    flexWrap: "wrap",
  },
  uploadLabel: {
    fontSize: normalizeFont(10),
    color: "#666",
  },
  uploadValue: {
    fontSize: normalizeFont(12),
    color: "#000",
    fontWeight: "500",
  },
  startAllIndia: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
    marginVertical: moderateScale(4),
  },
  txetAll: {
    fontSize: normalizeFont(10),
  },
  editBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: moderateScale(8),
  },
  dropdownBtn: {
    padding: moderateScale(3),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    width:scale(89),
    borderColor: "rgba(0, 0, 0, 0.3)",
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(5),
  },
  dropdownBtnDisabled: {
    opacity: 0.6,
    borderColor: "rgba(0, 0, 0, 0.15)",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },
  statusCircle: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
  },
  statusText: {
    fontSize: normalizeFont(11),
    fontWeight: "500",
  },
  statusTextUpdating: {
    fontSize: normalizeFont(12),
    fontWeight: "500",
    color: "#666",
  },
  editButton: {
    padding: moderateScale(6),
    borderRadius: moderateScale(4),
  },
  editIcon: {
    width: scale(20),
    height: scale(20),
  },
  editIconDisabled: {
    opacity: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  stockDropdown: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(8),
    minWidth: scale(60),
    paddingVertical: moderateScale(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(12),
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 202, 40, 1)",
    zIndex: 1000,
  },
  stockOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    gap: moderateScale(8),
  },
  stockOptionText: {
    fontSize: normalizeFont(12),
    fontWeight: "500",
    color: "#374151",
  },
  stockDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginHorizontal: moderateScale(8),
  },
  stockDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },
});