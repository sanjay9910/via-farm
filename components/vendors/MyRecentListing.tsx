import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
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

const API_BASE = "https://393rb0pp-5000.inc1.devtunnels.ms";
const { width } = Dimensions.get("window");

const MyRecentListing = () => {
  const [listingsData, setListingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [isStockDropdownOpen, setIsStockDropdownOpen] = useState(false);
  const [stockDropdownPosition, setStockDropdownPosition] = useState({ x: 0, y: 0 });
  const [currentProductId, setCurrentProductId] = useState(null);
  const stockButtonRefs = useRef({});

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
          quantity: product.quantity,
          uploadedOn: new Date(product.datePosted).toLocaleDateString(),
          image: product.images[0] || "",
          status: product.status,
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

  // Stock Dropdown - Fixed version
  const openStockDropdown = (productId) => {
    const ref = stockButtonRefs.current[productId];
    console.log("Opening dropdown for product:", productId, "Ref:", ref);
    
    if (ref) {
      ref.measureInWindow((x, y, width, height) => {
        console.log("Button position:", { x, y, width, height });
        setStockDropdownPosition({ 
          x: x - 60, 
          y: y + height + 5 
        });
        setCurrentProductId(productId);
        setIsStockDropdownOpen(true);
      });
    } else {
      console.log("Ref not found for product:", productId);
    }
  };

  const handleStockChange = async (newStatus) => {
    if (!currentProductId) {
      Alert.alert("Error", "No product selected");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "User not logged in!");
        return;
      }

      console.log("Updating stock for:", currentProductId, "to:", newStatus);
      console.log("API Endpoint:", `${API_BASE}/api/vendor/products/${currentProductId}/status`);

      const res = await axios.patch(
        `${API_BASE}/api/vendor/products/${currentProductId}/status`,
        { status: newStatus },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log("API Response:", res.data);

      if (res.data.success) {
        const updatedList = listingsData.map((item) =>
          item.id === currentProductId ? { ...item, status: newStatus } : item
        );
        setListingsData(updatedList);
        Alert.alert("Success", "Stock status updated successfully!");
      } else {
        Alert.alert("Error", res.data.message || "Failed to update stock status");
      }
    } catch (error) {
      console.log("Stock update error:", error);
      console.log("Error response:", error.response?.data);
      
      if (error.response?.status === 404) {
        Alert.alert("Error", "API endpoint not found. Please check the server.");
      } else if (error.response?.status === 401) {
        Alert.alert("Error", "Authentication failed. Please login again.");
      } else {
        Alert.alert("Error", "Something went wrong while updating stock");
      }
    } finally {
      setIsStockDropdownOpen(false);
      setCurrentProductId(null);
    }
  };

  const renderItem = ({ item }) => {
    const circleColor = item.status.toLowerCase() === "in stock" ? "#22c55e" : "#ef4444";

    return (
      <View style={styles.listingCard}>
        <View style={styles.cardContent}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
          </View>

          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.priceQuantityContainer}>
                <Text style={styles.priceText}>₹{item.price}</Text>
                <Text style={styles.quantity}>{item.quantity} units</Text>
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
              {/* Stock dropdown */}
              <TouchableOpacity
                ref={(ref) => {
                  stockButtonRefs.current[item.id] = ref;
                }}
                style={styles.dropdownBtn}
                onPress={() => openStockDropdown(item.id)}
              >
                <View style={styles.statusRow}>
                  <View style={[styles.statusCircle, { backgroundColor: circleColor }]} />
                  <Text style={[styles.statusText, { color: circleColor }]}>{item.status}</Text>
                </View>
              </TouchableOpacity>

              {/* Edit button */}
              <TouchableOpacity style={styles.editButton} onPress={() => openModal(item)}>
                <Image
                  source={require("../../assets/via-farm-img/icons/editicon.png")}
                  style={styles.editIcon}
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
      <ActivityIndicator 
        size="large" 
        color="rgba(255,202,40,1)" 
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }} 
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRowContainer}>
        <Text style={styles.headerTitle}>My Recent Listings</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See All &gt;</Text>
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

      {/* Stock Dropdown Modal - Fixed */}
      <Modal
        visible={isStockDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsStockDropdownOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsStockDropdownOpen(false)}>
          <View style={styles.modalOverlay}>
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
    paddingVertical: 16, 
    backgroundColor: "#fff", 
    flex: 1 
  },
  headerRowContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 16, 
    marginBottom: 12 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#333" 
  },
  seeAll: { 
    fontSize: 13, 
    color: "#0AA1FF" 
  },
  flatListContent: { 
    paddingHorizontal: 16 
  },
  listingCard: { 
    backgroundColor: "#fff", 
    borderRadius: 8, 
    marginRight: 15, 
    borderWidth: 1, 
    borderColor: "rgba(255, 202, 40, 1)", 
    width: width * 0.8 
  },
  cardContent: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12 
  },
  imageContainer: { 
    width: 120, 
    height: 140 
  },
  itemImage: { 
    width: "100%", 
    height: "100%", 
    borderTopLeftRadius: 6, 
    borderBottomLeftRadius: 6 
  },
  textContainer: { 
    flex: 1, 
    paddingRight: 12, 
    paddingVertical: 8 
  },
  headerRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "flex-start", 
    marginBottom: 8 
  },
  itemName: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#424242", 
    flex: 1, 
    marginRight: 8 
  },
  priceQuantityContainer: { 
    alignItems: "flex-end" 
  },
  priceText: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#2E7D32" 
  },
  quantity: { 
    fontSize: 12, 
    color: "#666", 
    marginTop: 2 
  },
  detailsContainer: { 
    flexDirection: "row", 
    gap: 4, 
    marginBottom: 4 
  },
  uploadLabel: { 
    fontSize: 12, 
    color: "#666" 
  },
  uploadValue: { 
    fontSize: 12, 
    color: "#000", 
    fontWeight: "500" 
  },
  startAllIndia: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 5, 
    marginVertical: 4 
  },
  txetAll: { 
    fontSize: 13 
  },
  editBtn: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginTop: 8 
  },
  dropdownBtn: { 
    padding: 6, 
    borderRadius: 6, 
    borderWidth: 1, 
    borderColor: "rgba(0, 0, 0, 0.3)" 
  },
  statusRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6 
  },
  statusCircle: { 
    width: 10, 
    height: 10, 
    borderRadius: 5 
  },
  statusText: { 
    fontSize: 14, 
    fontWeight: "500" 
  },
  editButton: { 
    padding: 6, 
    borderRadius: 4 
  },
  editIcon: { 
    width: 20, 
    height: 20 
  },

  // Stock dropdown styles - Fixed
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  stockDropdown: { 
    backgroundColor: "#fff", 
    borderRadius: 8, 
    minWidth: 150, 
    paddingVertical: 8, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 12, 
    elevation: 10, 
    borderWidth: 1, 
    borderColor: "rgba(255, 202, 40, 1)",
    zIndex: 1000,
  },
  stockOption: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    gap: 8 
  },
  stockOptionText: { 
    fontSize: 14, 
    fontWeight: "500" 
  },
  stockDivider: { 
    height: 1, 
    backgroundColor: "#f3f4f6", 
    marginHorizontal: 8 
  },
  stockDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4 
  },
});