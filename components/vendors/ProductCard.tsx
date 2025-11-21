import { moderateScale, normalizeFont, scale } from "@/app/Responsive";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import ProductModal from "../vendors/ProductEditModel";

const API_BASE = "https://viafarm-1.onrender.com";
const { width } = Dimensions.get("window");

// --- ProductCard Component with Edit Modal ---

const ProductCard = ({ item, onDelete, onStockUpdate, onEdit }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isStockDropdownOpen, setIsStockDropdownOpen] = useState(false);
  const [stockDropdownPosition, setStockDropdownPosition] = useState({ x: 0, y: 0 });
  const [updatingStock, setUpdatingStock] = useState(false);
  const menuButtonRef = useRef(null);
  const stockButtonRef = useRef(null);
  const router = useRouter();

  const handleMenuPress = () => {
    if (menuButtonRef.current) {
      menuButtonRef.current.measureInWindow((x, y, width, height) => {
        setMenuPosition({
          x: x - 140,
          y: y + height + 4,
        });
        setIsMenuOpen(true);
      });
    }
  };

  const handleStockPress = () => {
    if (stockButtonRef.current) {
      stockButtonRef.current.measureInWindow((x, y, width, height) => {
        setStockDropdownPosition({
          x: x - 80,
          y: y + height + 4,
        });
        setIsStockDropdownOpen(true);
      });
    }
  };

  const handleEdit = () => {
    setIsMenuOpen(false);
    if (onEdit) {
      onEdit(item);
    }
  };

  const handleDelete = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "User not logged in!");
        return;
      }

      const tokenData = JSON.parse(atob(token.split(".")[1]));
      const userRole = tokenData.role;

      let deleteUrl = "";
      if (userRole === "Vendor") {
        deleteUrl = `${API_BASE}/api/vendor/products/${item._id}`;
      } else if (userRole === "Admin") {
        deleteUrl = `${API_BASE}/api/admin/products/${item._id}`;
      } else {
        Alert.alert("Permission Denied", "Only vendors or admins can delete products.");
        return;
      }

      Alert.alert(
        "Delete Product",
        "Are you sure you want to delete this product?",
        [
          { text: "Cancel", style: "cancel", onPress: () => setIsMenuOpen(false) },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                const response = await axios.delete(deleteUrl, {
                  headers: { Authorization: `Bearer ${token}` },
                });

                if (response.data?.success) {
                  Alert.alert("Success", "Product deleted successfully!");
                  if (onDelete) onDelete(item._id);
                } else {
                  Alert.alert("Error", response.data?.message || "Failed to delete");
                }
              } catch (error) {
                console.log("Delete error:", error.response?.data || error.message);
                if (error.response?.status === 403) {
                  Alert.alert(
                    "Unauthorized",
                    "Your account is not allowed to delete this product."
                  );
                } else {
                  Alert.alert("Error", "Something went wrong while deleting");
                }
              } finally {
                setIsMenuOpen(false);
              }
            },
          },
        ]
      );
    } catch (err) {
      console.log("Error:", err);
      Alert.alert("Error", "Unexpected error occurred");
    }
  };

  const handleStockChange = async (newStatus) => {
    setIsStockDropdownOpen(false);
    setUpdatingStock(true);

    try {
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        Alert.alert("Error", "User not logged in!");
        setUpdatingStock(false);
        return;
      }

      let response = null;
      let lastError = null;

      try {
        response = await axios.patch(
          `${API_BASE}/api/vendor/products/${item._id}/status`,
          { status: newStatus },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );
      } catch (err) {
        lastError = err;
        try {
          response = await axios.patch(
            `${API_BASE}/api/vendor/products/${item._id}`,
            { status: newStatus },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              timeout: 10000,
            }
          );
        } catch (err2) {
          lastError = err2;
          try {
            response = await axios.put(
              `${API_BASE}/api/vendor/products/${item._id}`,
              { status: newStatus },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                timeout: 10000,
              }
            );
          } catch (err3) {
            lastError = err3;
          }
        }
      }

      if (response && response.data && response.data.success) {
        Alert.alert("Success", `Product marked as ${newStatus}`);
        onStockUpdate(item._id, newStatus);
      } else {
        throw lastError || new Error("Failed to update status");
      }
    } catch (error) {
      console.log("Stock update error:", error);

      if (error.response?.status === 401) {
        Alert.alert("Error", "Authentication failed. Please login again.");
      } else if (error.response?.status === 404) {
        Alert.alert("Error", "API endpoint not found. Please check server.");
      } else if (error.response?.status === 403) {
        Alert.alert("Error", "You don't have permission to update this product.");
      } else if (error.response?.status === 500) {
        Alert.alert(
          "Server Error",
          error.response?.data?.message || "Internal server error"
        );
      } else if (error.code === "ECONNABORTED") {
        Alert.alert("Timeout", "Request took too long.");
      } else if (error.message === "Network Error") {
        Alert.alert("Network Error", "Cannot connect to server.");
      } else {
        Alert.alert("Error", "Something went wrong while updating stock");
      }
    } finally {
      setUpdatingStock(false);
    }
  };

const viewPage = () => {
  // push using query param — this is reliable with expo-router
  router.push(`/VendorViewProduct?productId=${item._id || item.id}`);
};

  return (
    <TouchableOpacity style={cardStyles.card} onPress={viewPage}> 
      <Image
        source={{ uri: item.images?.[0] }}
        style={cardStyles.image}
        resizeMode="cover"
      />
      <Text style={{position:'absolute',bottom:moderateScale(5),left:moderateScale(5),color:'#fff',flexDirection:'row',alignItems:'center',gap:15,fontWeight:'bold', backgroundColor:'rgba(141, 141, 141, 0.6)',borderRadius:moderateScale(10),paddingVertical:4,paddingHorizontal:5}}>
       <Text><Image source={require("../../assets/via-farm-img/icons/satar.png")} style={{paddingTop:moderateScale(5)}} /></Text> 
        <Text>5.0</Text> 
      </Text>
      <View style={cardStyles.details}>
        <View style={cardStyles.header}>
          <Text style={cardStyles.productName}>{item.name}</Text>
          <TouchableOpacity
            ref={menuButtonRef}
            style={cardStyles.menuButton}
            onPress={handleMenuPress}
            disabled={updatingStock}
          >
            <Feather name="more-vertical" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={cardStyles.row}>
          <Text style={cardStyles.label}>Category</Text>
          <Text style={cardStyles.colon}>:</Text>
          <Text style={cardStyles.value}>{item.category}</Text>
        </View>

        <View style={cardStyles.row}>
          <Text style={cardStyles.label}>Price</Text>
          <Text style={cardStyles.colon}>:</Text>
          <Text style={cardStyles.value}>
            ₹ {item.price}/ {item.unit === "pc" ? `1${item.unit}` : item.unit} {item.weightPerPiece}
          </Text>
        </View>
        
        <Text style={cardStyles.uploadDate}>
          Uploaded on {new Date(item.datePosted).toLocaleDateString()}
        </Text>

        <View style={cardStyles.stockContainer}>
          <TouchableOpacity
            ref={stockButtonRef}
            style={[
              cardStyles.stockBadge,
              item.status === "In Stock"
                ? cardStyles.inStock
                : cardStyles.outOfStock,
              updatingStock && cardStyles.stockBadgeDisabled
            ]}
            onPress={handleStockPress}
            disabled={updatingStock}
          >
            {updatingStock ? (
              <>
                <ActivityIndicator size="small" color={item.status === "In Stock" ? "#22c55e" : "#ef4444"} />
                <Text style={[cardStyles.stockText, cardStyles.updatingText]}>
                  Updating...
                </Text>
              </>
            ) : (
              <>
                <View
                  style={[
                    cardStyles.stockDot,
                    item.status === "In Stock"
                      ? cardStyles.inStockDot
                      : cardStyles.outOfStockDot,
                  ]}
                />
                <Text
                  style={[
                    cardStyles.stockText,
                    item.status === "In Stock"
                      ? cardStyles.inStockText
                      : cardStyles.outOfStockText,
                  ]}
                >
                  {item.status}
                </Text>
                <Feather
                  name="chevron-down"
                  size={16}
                  color={item.status === "In Stock" ? "#22c55e" : "#ef4444"}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Modal (Edit, Delete) */}
      <Modal
        visible={isMenuOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <TouchableOpacity
          style={cardStyles.modalOverlayTransparent}
          activeOpacity={1}
          onPress={() => setIsMenuOpen(false)}
        >
          <View
            style={[
              cardStyles.menuPopup,
              {
                position: "absolute",
                top: menuPosition.y,
                left: menuPosition.x,
              },
            ]}
          >
            <TouchableOpacity
              style={cardStyles.menuItem}
              onPress={handleEdit}
            >
              <Feather name="edit-2" size={18} color="#374151" />
              <Text style={cardStyles.menuItemText}>Edit</Text>
            </TouchableOpacity>

            <View style={cardStyles.menuDivider} />

            <TouchableOpacity
              style={cardStyles.menuItem}
              onPress={handleDelete}
            >
              <Feather name="trash-2" size={18} color="#ef4444" />
              <Text style={[cardStyles.menuItemText, cardStyles.deleteText]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Stock Dropdown Modal */}
      <Modal
        visible={isStockDropdownOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsStockDropdownOpen(false)}
      >
        <TouchableOpacity
          style={cardStyles.modalOverlayTransparent}
          activeOpacity={1}
          onPress={() => setIsStockDropdownOpen(false)}
        >
          <View
            style={[
              cardStyles.stockDropdown,
              {
                position: "absolute",
                top: stockDropdownPosition.y,
                left: stockDropdownPosition.x,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                cardStyles.stockOption,
                item.status === "In Stock" && cardStyles.stockOptionActive,
              ]}
              onPress={() => handleStockChange("In Stock")}
            >
              <View style={[cardStyles.stockDot, cardStyles.inStockDot]} />
              <Text style={[cardStyles.stockOptionText, cardStyles.inStockText]}>
                In Stock
              </Text>
            </TouchableOpacity>

            <View style={cardStyles.stockDivider} />

            <TouchableOpacity
              style={[
                cardStyles.stockOption,
                item.status === "Out of Stock" && cardStyles.stockOptionActive,
              ]}
              onPress={() => handleStockChange("Out of Stock")}
            >
              <View style={[cardStyles.stockDot, cardStyles.outOfStockDot]} />
              <Text style={[cardStyles.stockOptionText, cardStyles.outOfStockText]}>
                Out of Stock
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
};


const stockOptions = ["Out of Stock", "In Stock"];
const dateOptions = ["Today", "Last 7 Days", "Last 30 Days", "All Time"];
const amountOptions = ["Low to High", "High to Low"];

const ProductFilter = ({
  selectedCategory,
  setSelectedCategory,
  stockFilter,
  setStockFilter,
  dateFilter,
  setDateFilter,
  amountFilter,
  setAmountFilter,
  applyFilters,
  handleCategoryChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [ categories ,setAllCategory] = useState([]);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    stock: false,
    date: false,
    amount: false,
  });

  const slideAnim = useRef(new Animated.Value(width)).current;
  const dropdownButtonRef = useRef(null);

  useEffect(()=>{
  const   getAllCategory = async ()=>{
    try{
     const token = await AsyncStorage.getItem("userToken");
     const catRes = await axios.get(`${API_BASE}/api/admin/manage-app/categories`,{
      headers:{
       Authorization:`Bearer ${token}`
      },
     });

     const onlyNames = catRes.data?.categories?.map((item) => item.name) || [];
     setAllCategory(onlyNames)
    }catch(error){
      console.log("Error",error)
    }
  }
  getAllCategory();
},[])


  useEffect(() => {
    if (isFilterOpen) {
      slideAnim.setValue(width);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
  }, [isFilterOpen]);

  const openDropdown = () => {
    dropdownButtonRef.current?.measure((fx, fy, w, h, px, py) => {
      setDropdownPos({ top: py + h, left: px, width: w });
      setIsDropdownOpen(true);
    });
  };

  const onCategorySelect = (category) => {
    setSelectedCategory(category);
    handleCategoryChange(category);
    setIsDropdownOpen(false);
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleApplyFilters = () => {
    applyFilters();
    setIsFilterOpen(false);
  };

  return (
    <View style={filterStyles.container}>
      <Text style={filterStyles.title}>My Products</Text>

      <View style={filterStyles.controls}>
        <TouchableOpacity
          ref={dropdownButtonRef}
          style={filterStyles.dropdownButton}
          onPress={openDropdown}
          activeOpacity={0.7}
        >
          <Text style={filterStyles.dropdownText}>{selectedCategory}</Text>
          <Feather name="chevron-down" size={18} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity
          style={filterStyles.filterButton}
          onPress={() => setIsFilterOpen(true)}
          activeOpacity={0.7}
        >
          <Image
            source={require("../../assets/via-farm-img/icons/filter.png")}
            style={{ width: 20, height: 20 }}
          />
        </TouchableOpacity>
      </View>



<Modal
  visible={isDropdownOpen}
  transparent={true}
  animationType="fade"
  onRequestClose={() => setIsDropdownOpen(false)}
>
  <TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
    <View style={filterStyles.modalOverlay}>
      <View
        style={[
          filterStyles.dropdownMenu,
          {
            position: "absolute",
            top:scale(216),
            left: dropdownPos.left,
            width: dropdownPos.width,
            maxHeight: scale(300), 
            overflow: "hidden",
          },
        ]}
      >
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator
          contentContainerStyle={{ paddingVertical: 4 }}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                filterStyles.dropdownItem,
                selectedCategory === category && filterStyles.dropdownItemActive,
              ]}
              onPress={() => {
                onCategorySelect(category);
                setIsDropdownOpen(false); // close after select
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  filterStyles.dropdownItemText,
                  selectedCategory === category && filterStyles.dropdownItemTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  </TouchableWithoutFeedback>
</Modal>




      <Modal
        animationType="none"
        transparent={true}
        visible={isFilterOpen}
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <TouchableOpacity
          style={filterStyles.filterOverlay}
          activeOpacity={1}
          onPress={() => setIsFilterOpen(false)}
        >
          <Animated.View
            style={[
              filterStyles.filterModal,
              { transform: [{ translateX: slideAnim }] },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={filterStyles.modalHeader}>
              <Text style={filterStyles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setIsFilterOpen(false)}>
                <Text style={filterStyles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={filterStyles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <View style={filterStyles.filterSection}>
                <TouchableOpacity
                  style={filterStyles.filterHeader}
                  onPress={() => toggleSection("stock")}
                >
                  <Text style={filterStyles.filterTitle}>Stock</Text>
                  <Text
                    style={[
                      filterStyles.chevron,
                      expandedSections.stock && filterStyles.chevronRotated,
                    ]}
                  >
                    ›
                  </Text>
                </TouchableOpacity>
                {expandedSections.stock && (
                  <View style={filterStyles.filterOptions}>
                    {stockOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={filterStyles.radioOption}
                        onPress={() => setStockFilter(option)}
                      >
                        <View
                          style={[
                            filterStyles.radioCircle,
                            stockFilter === option &&
                            filterStyles.radioCircleSelected,
                          ]}
                        >
                          {stockFilter === option && (
                            <View style={filterStyles.radioSelected} />
                          )}
                        </View>
                        <Text
                          style={[
                            filterStyles.optionText,
                            stockFilter === option &&
                            filterStyles.optionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={filterStyles.filterSection}>
                <TouchableOpacity
                  style={filterStyles.filterHeader}
                  onPress={() => toggleSection("date")}
                >
                  <Text style={filterStyles.filterTitle}>By Date</Text>
                  <Text
                    style={[
                      filterStyles.chevron,
                      expandedSections.date && filterStyles.chevronRotated,
                    ]}
                  >
                    ›
                  </Text>
                </TouchableOpacity>
                {expandedSections.date && (
                  <View style={filterStyles.filterOptions}>
                    {dateOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={filterStyles.radioOption}
                        onPress={() => setDateFilter(option)}
                      >
                        <View
                          style={[
                            filterStyles.radioCircle,
                            dateFilter === option &&
                            filterStyles.radioCircleSelected,
                          ]}
                        >
                          {dateFilter === option && (
                            <View style={filterStyles.radioSelected} />
                          )}
                        </View>
                        <Text
                          style={[
                            filterStyles.optionText,
                            dateFilter === option &&
                            filterStyles.optionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={filterStyles.filterSection}>
                <TouchableOpacity
                  style={filterStyles.filterHeader}
                  onPress={() => toggleSection("amount")}
                >
                  <Text style={filterStyles.filterTitle}>Amount</Text>
                  <Text
                    style={[
                      filterStyles.chevron,
                      expandedSections.amount && filterStyles.chevronRotated,
                    ]}
                  >
                    ›
                  </Text>
                </TouchableOpacity>
                {expandedSections.amount && (
                  <View style={filterStyles.filterOptions}>
                    {amountOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={filterStyles.radioOption}
                        onPress={() => setAmountFilter(option)}
                      >
                        <View
                          style={[
                            filterStyles.radioCircle,
                            amountFilter === option &&
                            filterStyles.radioCircleSelected,
                          ]}
                        >
                          {amountFilter === option && (
                            <View style={filterStyles.radioSelected} />
                          )}
                        </View>
                        <Text
                          style={[
                            filterStyles.optionText,
                            amountFilter === option &&
                            filterStyles.optionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={filterStyles.modalFooter}>
              <TouchableOpacity
                style={filterStyles.applyButton}
                onPress={handleApplyFilters}
              >
                <Text style={filterStyles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// --- ProductList Component with Edit Modal ---

const ProductList = ({ refreshbut }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [amountFilter, setAmountFilter] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    stock: "",
    date: "",
    amount: "",
    category: "All",
  });

  // Edit Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      const res = await axios.get(`${API_BASE}/api/vendor/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (error) {
      console.log("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (newCategory) => {
    setAppliedFilters((prev) => ({
      ...prev,
      category: newCategory,
    }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters((prev) => ({
      ...prev,
      stock: stockFilter,
      date: dateFilter,
      amount: amountFilter,
    }));
  };

  const handleStockUpdate = (productId, newStatus) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product._id === productId
          ? { ...product, status: newStatus }
          : product
      )
    );
  };

  const handleDeleteFromList = (id) => {
    setProducts((prev) => prev.filter((item) => item._id !== id));
  };

  // Edit Modal Handlers
  const handleEditProduct = (product) => {
    // Convert product data to match modal format
    const formattedProduct = {
      id: product._id,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      uploadedOn: new Date(product.datePosted).toLocaleDateString(),
      image: product.images?.[0] || "",
      status: product.status || "In Stock",
      category: product.category || "Fruits",
    };
    setSelectedProduct(formattedProduct);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedProduct(null);
  };

  const submitModal = (updatedProduct) => {
    // Update the product in the list
    const updatedList = products.map((item) =>
      item._id === updatedProduct.id 
        ? {
            ...item,
            name: updatedProduct.name,
            price: updatedProduct.price,
            quantity: updatedProduct.quantity,
            status: updatedProduct.status,
            category: updatedProduct.category,
          }
        : item
    );
    setProducts(updatedList);
    closeModal();
    // Optionally refetch to sync with server
    fetchProducts();
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    const categoryToFilter =
      appliedFilters.category === "All" ? null : appliedFilters.category;
    if (categoryToFilter) {
      filtered = filtered.filter((item) => item.category === categoryToFilter);
    }

    const stockToFilter = appliedFilters.stock;
    if (stockToFilter && stockToFilter !== "") {
      filtered = filtered.filter((item) => item.status === stockToFilter);
    }

    if (appliedFilters.amount === "Low to High") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (appliedFilters.amount === "High to Low") {
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [products, appliedFilters]);

  useEffect(() => {
    fetchProducts();
  }, [refreshbut]);

  // Refetch when modal closes
  useEffect(() => {
    if (!modalVisible) {
      // Optional: refetch to ensure sync
    }
  }, [modalVisible]);

  return (
    <View style={{ flex: 1 }}>
      <ProductFilter
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        amountFilter={amountFilter}
        setAmountFilter={setAmountFilter}
        applyFilters={handleApplyFilters}
        handleCategoryChange={handleCategoryChange}
      />

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="rgba(255,202,40,1)" />
          <Text style={{ marginTop: 12, color: "#666" }}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onDelete={handleDeleteFromList}
              onStockUpdate={handleStockUpdate}
              onEdit={handleEditProduct}
            />
          )}
          contentContainerStyle={cardStyles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20, color: "#666" }}>
              No products found matching your filters.
            </Text>
          }
        />
      )}

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

export default ProductList;

// ---- STYLES ----
export const cardStyles = StyleSheet.create({
  listContainer: { padding: moderateScale(16), gap: moderateScale(16) },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: moderateScale(16),
    borderWidth: moderateScale(2),
    borderColor: "rgba(255, 202, 40, 1)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: Platform.OS === "ios" ? 0.08 : 0.16,
    shadowRadius: moderateScale(8),
    elevation: moderateScale(3),
  },

  image: { width: moderateScale(150), height: "100%", minHeight: moderateScale(180) },

  details: { flex: 1, padding: moderateScale(8), justifyContent: "space-between" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: moderateScale(8),
  },

  productName: {
    fontSize: normalizeFont(14),
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
    marginRight: moderateScale(8),
  },

  menuButton: { padding: moderateScale(4) },

  row: { flexDirection: "row", alignItems: "center", marginBottom: moderateScale(6) },

  label: { fontSize: normalizeFont(12), color: "#6b7280", width: moderateScale(80) },

  colon: { fontSize: normalizeFont(12), color: "#6b7280", marginHorizontal: moderateScale(8) },

  value: { fontSize: normalizeFont(12), color: "#374151", fontWeight: "500", flex: 1 },

  uploadDate: {
    fontSize: normalizeFont(11),
    color: "#9ca3af",
    marginTop: moderateScale(4),
    marginBottom: moderateScale(12),
  },

  stockContainer: { flexDirection: "row", alignItems: "center" },

  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(5),
    borderRadius: moderateScale(8),
    borderWidth: moderateScale(1),
    gap: moderateScale(6),
  },

  stockBadgeDisabled: {
    opacity: 0.7,
  },

  inStock: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  outOfStock: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },

  stockDot: { width: moderateScale(8), height: moderateScale(8), borderRadius: moderateScale(4) },
  inStockDot: { backgroundColor: "#22c55e" },
  outOfStockDot: { backgroundColor: "#ef4444" },

  stockText: { fontSize: normalizeFont(12), fontWeight: "500" },
  inStockText: { color: "#22c55e" },
  outOfStockText: { color: "#ef4444" },
  updatingText: { color: "#6b7280" },

  modalOverlayTransparent: { flex: 1, backgroundColor: "transparent" },

  menuPopup: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(6),
    minWidth: moderateScale(50),
    paddingVertical: moderateScale(5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowOpacity: Platform.OS === "ios" ? 0.2 : 0.28,
    shadowRadius: moderateScale(12),
    elevation: moderateScale(10),
    borderWidth: moderateScale(1),
    borderColor: "rgba(255, 202, 40, 1)",
    marginLeft: moderateScale(60),
    marginTop: moderateScale(-26),
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(6),
    gap: moderateScale(12),
  },

  menuItemText: { fontSize: normalizeFont(13), color: "#374151", fontWeight: "500" },
  deleteText: { color: "#ef4444" },

  menuDivider: { height: moderateScale(1), backgroundColor: "#f3f4f6", marginHorizontal: moderateScale(8) },

  stockDropdown: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(8),
    minWidth: moderateScale(100),
    paddingVertical: moderateScale(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowOpacity: Platform.OS === "ios" ? 0.2 : 0.28,
    shadowRadius: moderateScale(12),
    elevation: moderateScale(10),
    marginLeft: moderateScale(40),
    borderWidth: moderateScale(1),
    borderColor: "rgba(255, 202, 40, 1)",
  },

  stockOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    gap: moderateScale(8),
  },

  stockOptionActive: {
    backgroundColor: "#f3f4f6",
  },

  stockOptionText: {
    fontSize: normalizeFont(14),
    fontWeight: "500",
  },

  stockDivider: {
    height: moderateScale(1),
    backgroundColor: "#f3f4f6",
    marginHorizontal: moderateScale(8),
  },
});

export const filterStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    backgroundColor: "#fff",
    zIndex: 10,
  },

  title: { fontSize: normalizeFont(14), fontWeight: "600", color: "#374151" },

  controls: { flexDirection: "row", alignItems: "center", gap: moderateScale(10) },

  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(32),
    paddingVertical: moderateScale(5),
    paddingHorizontal: moderateScale(5),
    backgroundColor: "#fff",
    borderWidth: moderateScale(1),
    borderColor: "rgba(0,0,0,0.3)",
    borderRadius: moderateScale(8),
    minWidth: moderateScale(110),
  },

  dropdownText: { fontSize: normalizeFont(13), color: "#374151", fontWeight: "400" },

  filterButton: {
    padding: moderateScale(10),
    backgroundColor: "#fff",
    borderWidth: moderateScale(1),
    borderColor: "#d1d5db",
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
  },

  modalOverlay: { flex: 1 },

  dropdownMenu: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowOpacity: Platform.OS === "ios" ? 0.15 : 0.22,
    shadowRadius: moderateScale(12),
    elevation: moderateScale(8),
    overflow: "hidden",
    borderWidth: moderateScale(1),
    height:scale(200),
    borderColor: "rgba(0,0,0,0.3)",
  },

  dropdownItem: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(8),
    borderBottomWidth: moderateScale(1),
    borderBottomColor: "#f3f4f6",
  },

  dropdownItemActive: { backgroundColor: "#f3f4f6"},

  dropdownItemText: { fontSize: normalizeFont(11), color: "#374151"},

  dropdownItemTextActive: { fontWeight: "600", color: "#111827" },

  filterOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  filterModal: {
    position: "absolute",
    right: 0,
    top: moderateScale(280),
    bottom: moderateScale(80),
    width: moderateScale(250),
    backgroundColor: "#fff",
    borderTopLeftRadius: moderateScale(20),
    borderBottomLeftRadius: moderateScale(20),
    borderWidth: moderateScale(2),
    borderColor: "rgba(255,202,40,1)",
    elevation: moderateScale(10),
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: moderateScale(15),
    borderBottomWidth: moderateScale(1),
    borderBottomColor: "#f0f0f0",
  },

  modalTitle: { fontSize: normalizeFont(14), fontWeight: "600", color: "#333" },

  closeButton: { fontSize: moderateScale(22), color: "#333" },

  modalBody: { flex: 1, backgroundColor: "#fff", padding: moderateScale(20) },

  filterSection: { borderBottomWidth: moderateScale(1), borderBottomColor: "#f5f5f5" },

  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(13),
  },

  filterTitle: { fontSize: normalizeFont(13), fontWeight: "500", color: "#333" },

  chevron: { fontSize: moderateScale(14), color: "#666", transform: [{ rotate: "90deg" }] },

  chevronRotated: { transform: [{ rotate: "270deg" }] },

  filterOptions: { paddingBottom: moderateScale(16) },

  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(10),
  },

  radioCircle: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(10),
    borderWidth: moderateScale(2),
    borderColor: "#d1d5db",
    marginRight: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
  },

  radioCircleSelected: { borderColor: "#22c55e" },

  radioSelected: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: "#22c55e",
  },

  optionText: { fontSize: normalizeFont(12), color: "#6b7280" },
  optionTextSelected: { color: "#1f2937", fontWeight: "600" },

  modalFooter: { padding: moderateScale(17), borderTopWidth: moderateScale(1), borderTopColor: "#f0f0f0" },

  applyButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(8),
    alignItems: "center",
  },

  applyButtonText: { color: "#fff", fontSize: normalizeFont(13), fontWeight: "600" },
});