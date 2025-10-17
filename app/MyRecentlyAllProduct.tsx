import AsyncStorage from "@react-native-async-storage/async-storage";
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
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import ProductModal from "../components/vendors/ProductEditModel";

const API_BASE = "https://393rb0pp-5000.inc1.devtunnels.ms";

const AllRecently = () => {
  const [listingsData, setListingsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isStockDropdownOpen, setIsStockDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [stockDropdownPosition, setStockDropdownPosition] = useState({ x: 0, y: 0 });
  const [categoryDropdownPosition, setCategoryDropdownPosition] = useState({ x: 0, y: 0 });
  const [actionMenuPosition, setActionMenuPosition] = useState({ x: 0, y: 0 });
  const [currentProductId, setCurrentProductId] = useState(null);
  const [updatingStock, setUpdatingStock] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const stockButtonRefs = useRef({});
  const actionMenuRefs = useRef({});
  const categoryButtonRef = useRef(null);
  const navigation = useNavigation();

  const categories = [
    "All Categories",
    "Fruits",
    "Vegetables",
    "Plants",
    "Seeds",
    "Handicrafts",
  ];

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
          status: product.status || "In Stock",
          category: product.category || "Fruits",
        }));
        setListingsData(formattedData);
        setFilteredData(formattedData);
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

  useEffect(() => {
    if (!modalVisible) {
      fetchProducts();
    }
  }, [modalVisible]);

  // Filter products by category
  useEffect(() => {
    if (selectedCategory === "All Categories") {
      setFilteredData(listingsData);
    } else {
      const filtered = listingsData.filter((item) => item.category === selectedCategory);
      setFilteredData(filtered);
    }
  }, [selectedCategory, listingsData]);

  // Modal handlers
  const openModal = (product) => {
    setSelectedProduct(product);
    setModalVisible(true);
    setIsActionMenuOpen(false);
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

  // Stock dropdown
  const openStockDropdown = (productId) => {
    const ref = stockButtonRefs.current[productId];
    if (ref) {
      ref.measureInWindow((x, y, width, height) => {
        setStockDropdownPosition({ x: x - 60, y: y + height + 5 });
        setCurrentProductId(productId);
        setIsStockDropdownOpen(true);
      });
    }
  };

  // Category dropdown
  const openCategoryDropdown = () => {
    if (categoryButtonRef.current) {
      categoryButtonRef.current.measureInWindow((x, y, width, height) => {
        setCategoryDropdownPosition({ x: x, y: y + height + 5 });
        setIsCategoryDropdownOpen(true);
      });
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setIsCategoryDropdownOpen(false);
  };

  // Action menu (3 dots)
  const openActionMenu = (productId) => {
    const ref = actionMenuRefs.current[productId];
    if (ref) {
      ref.measureInWindow((x, y, width, height) => {
        setActionMenuPosition({ x: x - 100, y: y + height + 5 });
        setCurrentProductId(productId);
        setIsActionMenuOpen(true);
      });
    }
  };

  const handleEdit = () => {
    const product = listingsData.find(item => item.id === currentProductId);
    if (product) {
      openModal(product);
    }
  };

  const handleDelete = async () => {
    if (!currentProductId) {
      Alert.alert("Error", "No product selected");
      return;
    }

    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setIsActionMenuOpen(false)
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("userToken");
              if (!token) {
                Alert.alert("Error", "User not logged in!");
                return;
              }

              const response = await axios.delete(
                `${API_BASE}/api/vendor/products/${currentProductId}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (response.data.success) {
                Alert.alert("Success", "Product deleted successfully");
                // Remove from local state
                const updatedList = listingsData.filter(item => item.id !== currentProductId);
                setListingsData(updatedList);
              } else {
                Alert.alert("Error", "Failed to delete product");
              }
            } catch (error) {
              console.log("Delete error:", error);
              Alert.alert("Error", "Something went wrong while deleting product");
            } finally {
              setIsActionMenuOpen(false);
              setCurrentProductId(null);
            }
          }
        }
      ]
    );
  };

  const handleStockChange = async (newStatus) => {
    if (!currentProductId) {
      Alert.alert("Error", "No product selected");
      return;
    }

    setIsStockDropdownOpen(false);
    setUpdatingStock(true);

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "User not logged in!");
        setUpdatingStock(false);
        setCurrentProductId(null);
        return;
      }

      let response = null;
      let lastError = null;

      // Method 1: PATCH /status
      try {
        response = await axios.patch(
          `${API_BASE}/api/vendor/products/${currentProductId}/status`,
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );
      } catch (err) {
        lastError = err;

        // Method 2: PATCH /products/:id
        try {
          response = await axios.patch(
            `${API_BASE}/api/vendor/products/${currentProductId}`,
            { status: newStatus },
            { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
          );
        } catch (err2) {
          lastError = err2;

          // Method 3: PUT /products/:id
          try {
            response = await axios.put(
              `${API_BASE}/api/vendor/products/${currentProductId}`,
              { status: newStatus },
              { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
            );
          } catch (err3) {
            lastError = err3;
          }
        }
      }

      if (response?.data?.success) {
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
        Alert.alert("Error", "API endpoint not found. Check server!");
      } else if (error.response?.status === 401) {
        Alert.alert("Error", "Authentication failed. Please login again.");
      } else {
        Alert.alert("Error", "Something went wrong while updating stock");
      }
    } finally {
      setUpdatingStock(false);
      setCurrentProductId(null);
    }
  };

  const renderCard = (item) => {
    const circleColor = item.status.toLowerCase() === "in stock" ? "#22c55e" : "#ef4444";
    const isCurrentlyUpdating = updatingStock && currentProductId === item.id;

    return (
      <View key={item.id} style={styles.listingCard}>
        <View style={styles.cardContent}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.priceQuantityContainer}>
                <Text style={styles.priceText}>₹{item.price}</Text>
                <Text style={styles.quantity}>{item.quantity} units</Text>
              </View>
            </View>
            <View style={styles.detailsContainer}>
              <Text style={styles.uploadLabel}>Uploaded on:</Text>
              <Text style={styles.uploadValue}>{item.uploadedOn}</Text>
            </View>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryLabel}>Category:</Text>
              <Text style={styles.categoryValue}>{item.category}</Text>
            </View>
            <View style={styles.startAllIndia}>
              <Text style={styles.txetAll}>All India Delivery</Text>
            </View>
            <View style={styles.editBtn}>
              <TouchableOpacity
                ref={(ref) => {
                  stockButtonRefs.current[item.id] = ref;
                }}
                style={[styles.dropdownBtn, isCurrentlyUpdating && styles.dropdownBtnDisabled]}
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
              </TouchableOpacity>

              {/* Three Dots Menu Button */}
              <TouchableOpacity
                ref={(ref) => {
                  actionMenuRefs.current[item.id] = ref;
                }}
                style={styles.threeDotsButton}
                onPress={() => openActionMenu(item.id)}
              >
                <Text style={styles.threeDotsText}>⋮</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Recent Products</Text>
      </View>

      <TouchableOpacity ref={categoryButtonRef} style={styles.categoryDropdownButton} onPress={openCategoryDropdown}>
        <Text style={styles.categoryDropdownText}>{selectedCategory}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="rgba(255,202,40,1)" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        {filteredData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubText}>
              {selectedCategory !== "All Categories"
                ? `No products in ${selectedCategory} category`
                : "Start adding products to see them here"}
            </Text>
          </View>
        ) : (
          filteredData.map((item) => renderCard(item))
        )}
      </ScrollView>

      {/* Stock Dropdown Modal */}
      <Modal visible={isStockDropdownOpen} transparent={true} animationType="fade" onRequestClose={() => setIsStockDropdownOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setIsStockDropdownOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.stockDropdown, { position: "absolute", top: stockDropdownPosition.y, left: stockDropdownPosition.x }]}>
                <TouchableOpacity style={styles.stockOption} onPress={() => handleStockChange("In Stock")}>
                  <View style={[styles.stockDot, { backgroundColor: "#22c55e" }]} />
                  <Text style={styles.stockOptionText}>In Stock</Text>
                </TouchableOpacity>
                <View style={styles.stockDivider} />
                <TouchableOpacity style={styles.stockOption} onPress={() => handleStockChange("Out of Stock")}>
                  <View style={[styles.stockDot, { backgroundColor: "#ef4444" }]} />
                  <Text style={styles.stockOptionText}>Out of Stock</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Category Dropdown Modal */}
      <Modal visible={isCategoryDropdownOpen} transparent={true} animationType="fade" onRequestClose={() => setIsCategoryDropdownOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setIsCategoryDropdownOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.categoryDropdown, { position: "absolute", top: categoryDropdownPosition.y, left: categoryDropdownPosition.x }]}>
                {categories.map((category, index) => (
                  <View key={category}>
                    <TouchableOpacity
                      style={[styles.categoryOption, category === selectedCategory && styles.categoryOptionSelected]}
                      onPress={() => handleCategorySelect(category)}
                    >
                      <Text style={[styles.categoryOptionText, category === selectedCategory && styles.categoryOptionTextSelected]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                    {index < categories.length - 1 && <View style={styles.categoryDivider} />}
                  </View>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Action Menu Modal (3 dots) */}
      <Modal visible={isActionMenuOpen} transparent={true} animationType="fade" onRequestClose={() => setIsActionMenuOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setIsActionMenuOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.actionMenu, { position: "absolute", top: actionMenuPosition.y, left: actionMenuPosition.x }]}>
                <TouchableOpacity style={styles.actionOption} onPress={handleEdit}>
                  <Text style={styles.actionOptionText}>✏️ Edit</Text>
                </TouchableOpacity>
                <View style={styles.actionDivider} />
                <TouchableOpacity style={styles.actionOption} onPress={handleDelete}>
                  <Text style={[styles.actionOptionText, styles.deleteText]}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Product Edit Modal */}
      {selectedProduct && <ProductModal visible={modalVisible} onClose={closeModal} onSubmit={submitModal} product={selectedProduct} />}
    </View>
  );
};

export default AllRecently;

const styles = StyleSheet.create({
  container: {
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
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },

  // Header Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
    paddingTop: 80,
    backgroundColor: "#fff",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
  },
  backIcon: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  categoryDropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0",
    minWidth: 140,
  },
  categoryDropdownText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginRight: 8,
    minWidth: 140,
    maxWidth: 140,
  },
  dropdownArrow: {
    fontSize: 14,
    color: "#666",
    fontWeight: "bold",
  },

  // Card Styles
  listingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 202, 40, 0.3)",
    width: "100%",
    elevation: 4,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageContainer: {
    width: 120,
    height: 140,
    backgroundColor: "#f8f9fa",
  },
  itemImage: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  textContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#424242",
    flex: 1,
    marginRight: 8,
  },
  priceQuantityContainer: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  quantity: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  detailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  uploadLabel: {
    fontSize: 12,
    color: "#666",
  },
  uploadValue: {
    fontSize: 12,
    color: "#000",
    fontWeight: "500",
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 12,
    color: "#666",
  },
  categoryValue: {
    fontSize: 12,
    color: "#000",
    fontWeight: "500",
  },
  startAllIndia: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  txetAll: {
    fontSize: 13,
    color: "#666",
  },
  editBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  dropdownBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.2)",
    backgroundColor: "#fff",
    minWidth: 120,
  },
  dropdownBtnDisabled: {
    opacity: 0.6,
    borderColor: "rgba(0,0,0,0.1)",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusTextUpdating: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },

  // Three Dots Menu Styles
  threeDotsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  threeDotsText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    transform: [{ rotate: '90deg' }],
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  stockDropdown: {
    backgroundColor: "#fff",
    borderRadius: 12,
    minWidth: 160,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 202, 40, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  stockOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  stockOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  stockDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#f3f4f6",
    marginHorizontal: 12,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Action Menu Styles
  actionMenu: {
    backgroundColor: "#fff",
    borderRadius: 12,
    minWidth: 140,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 202, 40, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  actionOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  deleteText: {
    color: "#ef4444",
  },
  actionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#f3f4f6",
    marginHorizontal: 12,
  },

  // Category Dropdown Styles
  categoryDropdown: {
    backgroundColor: "#fff",
    borderRadius: 12,
    minWidth: 180,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 202, 40, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  categoryOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  categoryOptionSelected: {
    backgroundColor: "rgba(255, 202, 40, 0.1)",
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  categoryOptionTextSelected: {
    color: "rgba(255, 202, 40, 1)",
    fontWeight: "600",
  },
  categoryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#f3f4f6",
    marginHorizontal: 12,
  },
});