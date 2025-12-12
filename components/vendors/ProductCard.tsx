// ProductList.jsx
import { moderateScale, normalizeFont, scale } from "@/app/Responsive";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
    if (menuButtonRef.current && menuButtonRef.current.measureInWindow) {
      menuButtonRef.current.measureInWindow((x, y, w, h) => {
        setMenuPosition({
          x: Math.max(8, x - 140),
          y: y + h + 4,
        });
        setIsMenuOpen(true);
      });
    } else {
      // fallback open at center
      setMenuPosition({ x: width / 2 - moderateScale(60), y: moderateScale(120) });
      setIsMenuOpen(true);
    }
  };

  const handleStockPress = () => {
    if (stockButtonRef.current && stockButtonRef.current.measureInWindow) {
      stockButtonRef.current.measureInWindow((x, y, w, h) => {
        setStockDropdownPosition({
          x: Math.max(8, x - 80),
          y: y + h + 4,
        });
        setIsStockDropdownOpen(true);
      });
    } else {
      setStockDropdownPosition({ x: width / 2 - moderateScale(40), y: moderateScale(120) });
      setIsStockDropdownOpen(true);
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
        console.log("Delete attempted but user not logged in.");
        setIsMenuOpen(false);
        return;
      }

      let userRole = null;
      try {
        const payload = token.split(".")[1];
        const decoded = BufferFromBase64(payload);
        userRole = decoded?.role ?? null;
      } catch (err) {
        // ignore decoding issues
      }

      const vendorPath = `${API_BASE}/api/vendor/products/${item._id || item.id}`;
      const adminPath = `${API_BASE}/api/admin/products/${item._id || item.id}`;
      const deleteUrl = userRole === "Admin" ? adminPath : vendorPath;

      // optimistic UI update
      if (onDelete) onDelete(item._id || item.id);

      axios
        .delete(deleteUrl, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        })
        .then((response) => {
          if (!(response.data && (response.data.success || response.status === 200 || response.status === 204))) {
            console.log("Delete response not success:", response.data);
          } else {
            console.log("Product deleted on server:", item._id || item.id);
          }
        })
        .catch((error) => {
          console.log("Delete error:", error?.response?.data || error?.message || error);
        })
        .finally(() => {
          setIsMenuOpen(false);
        });
    } catch (err) {
      console.log("Unexpected delete error:", err);
      setIsMenuOpen(false);
    }
  };

  const handleStockChange = async (newStatus) => {
    setIsStockDropdownOpen(false);
    setUpdatingStock(true);

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.log("Stock update attempted but user not logged in.");
        setUpdatingStock(false);
        return;
      }

      if (onStockUpdate) onStockUpdate(item._id || item.id, newStatus);

      const tryEndpoints = [
        {
          method: "patch",
          url: `${API_BASE}/api/vendor/products/${item._id || item.id}/status`,
          data: { status: newStatus },
        },
        {
          method: "patch",
          url: `${API_BASE}/api/vendor/products/${item._id || item.id}`,
          data: { status: newStatus },
        },
        {
          method: "put",
          url: `${API_BASE}/api/vendor/products/${item._id || item.id}`,
          data: { status: newStatus },
        },
      ];

      let succeeded = false;
      for (let ep of tryEndpoints) {
        try {
          const resp = await axios({
            method: ep.method,
            url: ep.url,
            data: ep.data,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          });
          if (resp && (resp.data?.success || resp.status === 200 || resp.status === 204)) {
            succeeded = true;
            console.log("Stock update succeeded at:", ep.url);
            break;
          }
        } catch (err) {
          console.log("Stock endpoint failed:", ep.url, err?.response?.status || err?.message || err);
        }
      }

      if (!succeeded) {
        console.log("All stock endpoints failed for", item._id || item.id);
      }
    } catch (error) {
      console.log("Stock update unexpected error:", error);
    } finally {
      setUpdatingStock(false);
    }
  };

  const viewPage = () => {
    router.push(`/VendorViewProduct?productId=${(item._id || item.id)}`);
  };

  return (
    <TouchableOpacity style={cardStyles.card} onPress={viewPage} activeOpacity={0.9}>
      <Image
        source={{ uri: (item.images && item.images[0]) || item.image || undefined }}
        style={cardStyles.image}
        resizeMode="stretch"
        // defaultSource={require("../assets/via-farm-img/placeholder.png")}
      />
      <View style={{
        position: 'absolute',
        bottom: moderateScale(6),
        left: moderateScale(6),
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.46)',
        borderRadius: moderateScale(10),
        paddingVertical: 4,
        paddingHorizontal: 8
      }}>
        <Image style={{ width: scale(10), height: scale(15) }} source={require("../../assets/via-farm-img/icons/satar.png")} />
        <Text allowFontScaling={false} style={{ color: '#fff', fontSize: normalizeFont(11), width: '100%' }}>5.0</Text>
      </View>
      <View style={cardStyles.details}>
        <View style={cardStyles.header}>
          <Text allowFontScaling={false} numberOfLines={2} ellipsizeMode="tail" style={cardStyles.productName}>{item.name}</Text>
          <TouchableOpacity
            ref={menuButtonRef}
            style={cardStyles.menuButton}
            onPress={(e) => {
              e.stopPropagation?.();
              handleMenuPress();
            }}
            disabled={updatingStock}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="more-vertical" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={cardStyles.row}>
          <Text allowFontScaling={false} style={cardStyles.label}>Category</Text>
          <Text allowFontScaling={false} style={cardStyles.colon}>:</Text>
          <Text allowFontScaling={false} numberOfLines={1} style={cardStyles.value}>{item.category || item.category?.name || "—"}</Text>
        </View>

        <View style={cardStyles.row}>
          <Text allowFontScaling={false} style={cardStyles.label}>Price</Text>
          <Text allowFontScaling={false} style={cardStyles.colon}>:</Text>
          <Text allowFontScaling={false} style={cardStyles.value}>
            ₹{(typeof item.price === "number" ? item.price : (item.price || "0"))}/{item.unit ? (item.unit === "pc" ? `1${item.unit}` : item.unit) : "—"} {item.weightPerPiece || ""}
          </Text>
        </View>

        <Text allowFontScaling={false} style={cardStyles.uploadDate}>
          Uploaded on {item.datePosted ? new Date(item.datePosted).toLocaleDateString() : "—"}
        </Text>

        <View style={cardStyles.stockContainer}>
          <TouchableOpacity
            ref={stockButtonRef}
            style={[
              cardStyles.stockBadge,
              (item.status === "In Stock" || item.status === "in stock") ? cardStyles.inStock : cardStyles.outOfStock,
              updatingStock && cardStyles.stockBadgeDisabled,
            ]}
            onPress={(e) => {
              e.stopPropagation?.();
              handleStockPress();
            }}
            disabled={updatingStock}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            {updatingStock ? (
              <>
                <ActivityIndicator size="small" color={(item.status === "In Stock" || item.status === "in stock") ? "#22c55e" : "#ef4444"} />
                <Text allowFontScaling={false} style={[cardStyles.stockText, cardStyles.updatingText]}>Updating...</Text>
              </>
            ) : (
              <>
                <View
                  style={[
                    cardStyles.stockDot,
                    (item.status === "In Stock" || item.status === "in stock")
                      ? cardStyles.inStockDot
                      : cardStyles.outOfStockDot,
                  ]}
                />
                <Text
                  allowFontScaling={false}
                  style={[
                    cardStyles.stockText,
                    (item.status === "In Stock" || item.status === "in stock")
                      ? cardStyles.inStockText
                      : cardStyles.outOfStockText,
                  ]}
                >
                  {item.status || "In Stock"}
                </Text>
                <Feather
                  name="chevron-down"
                  size={16}
                  color={(item.status === "In Stock" || item.status === "in stock") ? "#22c55e" : "#ef4444"}
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
        <TouchableOpacity style={cardStyles.modalOverlayTransparent} activeOpacity={1} onPress={() => setIsMenuOpen(false)}>
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
              onPress={(e) => {
                e.stopPropagation?.();
                handleEdit();
              }}
            >
              <Feather name="edit-2" size={18} color="#374151" />
              <Text allowFontScaling={false} style={cardStyles.menuItemText}>Edit</Text>
            </TouchableOpacity>

            <View style={cardStyles.menuDivider} />

            <TouchableOpacity
              style={cardStyles.menuItem}
              onPress={(e) => {
                e.stopPropagation?.();
                handleDelete();
              }}
            >
              <Feather name="trash-2" size={18} color="#ef4444" />
              <Text allowFontScaling={false} style={[cardStyles.menuItemText, cardStyles.deleteText]}>Delete</Text>
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
        <TouchableOpacity style={cardStyles.modalOverlayTransparent} activeOpacity={1} onPress={() => setIsStockDropdownOpen(false)}>
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
                (item.status === "In Stock" || item.status === "in stock") && cardStyles.stockOptionActive,
              ]}
              onPress={() => handleStockChange("In Stock")}
            >
              <View style={[cardStyles.stockDot, cardStyles.inStockDot]} />
              <Text allowFontScaling={false} style={[cardStyles.stockOptionText, cardStyles.inStockText]}>In Stock</Text>
            </TouchableOpacity>

            <View style={cardStyles.stockDivider} />

            <TouchableOpacity
              style={[
                cardStyles.stockOption,
                (item.status === "Out of Stock" || item.status === "out of stock") && cardStyles.stockOptionActive,
              ]}
              onPress={() => handleStockChange("Out of Stock")}
            >
              <View style={[cardStyles.stockDot, cardStyles.outOfStockDot]} />
              <Text allowFontScaling={false} style={[cardStyles.stockOptionText, cardStyles.outOfStockText]}>Out of Stock</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
};

// helper to decode base64 safely in RN (polyfill)
function BufferFromBase64(b64) {
  try {
    if (!b64) return {};
    if (typeof atob === "function") {
      const jsonStr = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(jsonStr);
    }
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const str = Buffer.from(b64, "base64").toString("utf8");
      return JSON.parse(str);
    }
    const decoded = global && typeof global.atob === "function" ? global.atob(b64) : null;
    if (decoded) return JSON.parse(decoded);
    return {};
  } catch (err) {
    console.log("Base64 decode failed:", err);
    return {};
  }
}

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
  const [categories, setAllCategory] = useState(["All"]);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    stock: false,
    date: false,
    amount: false,
  });

  const slideAnim = useRef(new Animated.Value(width)).current;
  const dropdownButtonRef = useRef(null);

  useEffect(()=>{
    const getAllCategory = async ()=>{
      try{
        const token = await AsyncStorage.getItem("userToken");
        const catRes = await axios.get(`${API_BASE}/api/admin/manage-app/categories`,{
          headers:{
            Authorization:`Bearer ${token}`
          },
          timeout: 10000,
        });

        const onlyNames = catRes.data?.categories?.map((item) => item.name).filter(Boolean) || [];
        const unique = Array.from(new Set(["All", ...onlyNames]));
        setAllCategory(unique);
      }catch(error){
        console.log("Error fetching categories:", error?.message ?? error);
        setAllCategory(["All"]);
      }
    };
    getAllCategory();
  },[]);


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
    if (dropdownButtonRef.current && dropdownButtonRef.current.measure) {
      dropdownButtonRef.current.measure((fx, fy, w, h, px, py) => {
        setDropdownPos({ top: py + h + moderateScale(6), left: px, width: w });
        setIsDropdownOpen(true);
      });
    } else {
      setDropdownPos({ top: moderateScale(220), left: moderateScale(16), width: moderateScale(160) });
      setIsDropdownOpen(true);
    }
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
      <Text allowFontScaling={false} style={filterStyles.title}>My Products</Text>

      <View style={filterStyles.controls}>
        <TouchableOpacity
          ref={dropdownButtonRef}
          style={filterStyles.dropdownButton}
          onPress={openDropdown}
          activeOpacity={0.7}
        >
          <Text allowFontScaling={false} style={filterStyles.dropdownText}>{selectedCategory}</Text>
          <Feather name="chevron-down" size={18} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity
          style={filterStyles.filterButton}
          onPress={() => setIsFilterOpen(true)}
          activeOpacity={0.7}
        >
          <Image source={require("../../assets/via-farm-img/icons/fltr.png")} style={{ width: 20, height: 20 }} />
        </TouchableOpacity>
      </View>

      <Modal visible={isDropdownOpen} transparent={true} animationType="fade" onRequestClose={() => setIsDropdownOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
          <View style={filterStyles.modalOverlay}>
            <View
              style={[
                filterStyles.dropdownMenu,
                {
                  position: "absolute",
                  top: dropdownPos.top || scale(220),
                  left: dropdownPos.left || moderateScale(16),
                  width: dropdownPos.width || moderateScale(160),
                  maxHeight: scale(300),
                  overflow: "hidden",
                },
              ]}
            >
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator contentContainerStyle={{ paddingVertical: 4 }}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={String(category)}
                    style={[
                      filterStyles.dropdownItem,
                      selectedCategory === category && filterStyles.dropdownItemActive,
                    ]}
                    onPress={() => onCategorySelect(category)}
                    activeOpacity={0.7}
                  >
                    <Text allowFontScaling={false} style={[
                      filterStyles.dropdownItemText,
                      selectedCategory === category && filterStyles.dropdownItemTextActive,
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal animationType="none" transparent={true} visible={isFilterOpen} onRequestClose={() => setIsFilterOpen(false)}>
        <TouchableOpacity style={filterStyles.filterOverlay} activeOpacity={1} onPress={() => setIsFilterOpen(false)}>
          <Animated.View style={[filterStyles.filterModal, { transform: [{ translateX: slideAnim }] }]} onStartShouldSetResponder={() => true}>
            <View style={filterStyles.modalHeader}>
              <Text allowFontScaling={false} style={filterStyles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setIsFilterOpen(false)}>
                <Text allowFontScaling={false} style={filterStyles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={filterStyles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={filterStyles.filterSection}>
                <TouchableOpacity style={filterStyles.filterHeader} onPress={() => toggleSection("stock")}>
                  <Text allowFontScaling={false} style={filterStyles.filterTitle}>Stock</Text>
                  <Text allowFontScaling={false} style={[filterStyles.chevron, expandedSections.stock && filterStyles.chevronRotated]}>›</Text>
                </TouchableOpacity>
                {expandedSections.stock && (
                  <View style={filterStyles.filterOptions}>
                    {stockOptions.map((option) => (
                      <TouchableOpacity key={option} style={filterStyles.radioOption} onPress={() => setStockFilter(option)}>
                        <View style={[filterStyles.radioCircle, stockFilter === option && filterStyles.radioCircleSelected]}>
                          {stockFilter === option && <View style={filterStyles.radioSelected} />}
                        </View>
                        <Text allowFontScaling={false} style={[filterStyles.optionText, stockFilter === option && filterStyles.optionTextSelected]}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={filterStyles.filterSection}>
                <TouchableOpacity style={filterStyles.filterHeader} onPress={() => toggleSection("date")}>
                  <Text allowFontScaling={false} style={filterStyles.filterTitle}>By Date</Text>
                  <Text allowFontScaling={false} style={[filterStyles.chevron, expandedSections.date && filterStyles.chevronRotated]}>›</Text>
                </TouchableOpacity>
                {expandedSections.date && (
                  <View style={filterStyles.filterOptions}>
                    {dateOptions.map((option) => (
                      <TouchableOpacity key={option} style={filterStyles.radioOption} onPress={() => setDateFilter(option)}>
                        <View style={[filterStyles.radioCircle, dateFilter === option && filterStyles.radioCircleSelected]}>
                          {dateFilter === option && <View style={filterStyles.radioSelected} />}
                        </View>
                        <Text allowFontScaling={false} style={[filterStyles.optionText, dateFilter === option && filterStyles.optionTextSelected]}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={filterStyles.filterSection}>
                <TouchableOpacity style={filterStyles.filterHeader} onPress={() => toggleSection("amount")}>
                  <Text allowFontScaling={false} style={filterStyles.filterTitle}>Amount</Text>
                  <Text allowFontScaling={false} style={[filterStyles.chevron, expandedSections.amount && filterStyles.chevronRotated]}>›</Text>
                </TouchableOpacity>
                {expandedSections.amount && (
                  <View style={filterStyles.filterOptions}>
                    {amountOptions.map((option) => (
                      <TouchableOpacity key={option} style={filterStyles.radioOption} onPress={() => setAmountFilter(option)}>
                        <View style={[filterStyles.radioCircle, amountFilter === option && filterStyles.radioCircleSelected]}>
                          {amountFilter === option && <View style={filterStyles.radioSelected} />}
                        </View>
                        <Text allowFontScaling={false} style={[filterStyles.optionText, amountFilter === option && filterStyles.optionTextSelected]}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={filterStyles.modalFooter}>
              <TouchableOpacity style={filterStyles.applyButton} onPress={handleApplyFilters}>
                <Text allowFontScaling={false} style={filterStyles.applyButtonText}>Apply Filters</Text>
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
        timeout: 15000,
      });
      if (res.data && res.data.success) {
        setProducts(res.data.data || []);
      } else if (res.data && Array.isArray(res.data)) {
        setProducts(res.data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.log("Error fetching products:", error?.message ?? error);
      setProducts([]);
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
        (product._id || product.id) === productId
          ? { ...product, status: newStatus }
          : product
      )
    );
  };

  const handleDeleteFromList = (id) => {
    setProducts((prev) => prev.filter((item) => (item._id || item.id) !== id));
  };

  const handleEditProduct = (product) => {
    const formattedProduct = {
      id: product._id || product.id,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      uploadedOn: product.datePosted ? new Date(product.datePosted).toLocaleDateString() : "",
      image: (product.images && product.images[0]) || product.image || "",
      status: product.status || "In Stock",
      category: (product.category && (product.category.name || product.category)) || "Fruits",
    };
    setSelectedProduct(formattedProduct);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedProduct(null);
  };

  const submitModal = (updatedProduct) => {
    const updatedList = products.map((item) =>
      (item._id || item.id) === updatedProduct.id
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
    fetchProducts();
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    const categoryToFilter =
      appliedFilters.category === "All" ? null : appliedFilters.category;
    if (categoryToFilter) {
      filtered = filtered.filter((item) => {
        const cat = item.category;
        if (!cat) return false;
        if (typeof cat === "string") return cat === categoryToFilter;
        if (typeof cat === "object") return (cat.name || "") === categoryToFilter;
        return false;
      });
    }

    const stockToFilter = appliedFilters.stock;
    if (stockToFilter && stockToFilter !== "") {
      filtered = filtered.filter((item) => (item.status || "").toLowerCase() === stockToFilter.toLowerCase());
    }

    if (appliedFilters.amount === "Low to High") {
      filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (appliedFilters.amount === "High to Low") {
      filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }

    return filtered;
  }, [products, appliedFilters]);

  useEffect(() => {
    fetchProducts();
  }, [refreshbut]);

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
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="rgba(255,202,40,1)" />
          <Text allowFontScaling={false} style={{ marginTop: moderateScale(12), color: "#666", fontSize: normalizeFont(12) }}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => String(item._id || item.id)}
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
            <Text allowFontScaling={false} style={{ textAlign: "center", marginTop: moderateScale(20), color: "#666", fontSize: normalizeFont(12) }}>
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
  listContainer: { paddingHorizontal: moderateScale(16), gap: moderateScale(16) },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: moderateScale(20),
    borderWidth: moderateScale(1),
    borderColor: "rgba(255, 202, 40, 1)",
    overflow: "hidden",
    height: scale(157),
  },

  image: { width: moderateScale(155), height: "100%", minHeight: moderateScale(120), backgroundColor: "#f3f4f6" },

  details: { flex: 1, padding: moderateScale(8), justifyContent: "space-between" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: moderateScale(8),
  },

  productName: {
    fontSize: normalizeFont(12), // bumped +1
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
    marginRight: moderateScale(8),
  },

  row: { flexDirection: "row", alignItems: "center", marginBottom: moderateScale(1) },

  label: { fontSize: normalizeFont(11), color: "#6b7280", width: moderateScale(55) }, // bumped +1

  colon: { fontSize: normalizeFont(11), color: "#6b7280", marginHorizontal: moderateScale(8) }, // bumped +1

  value: { fontSize: normalizeFont(11), color: "#6b7280", fontWeight: "500", flex: 1 }, // bumped +1

  uploadDate: {
    fontSize: normalizeFont(10), // bumped +1
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

  stockText: { fontSize: normalizeFont(11), fontWeight: "500" }, // bumped +1
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

  menuItemText: { fontSize: normalizeFont(12), color: "#374151", fontWeight: "500" }, // bumped +1
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
    fontSize: normalizeFont(11), // bumped +1
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
    paddingVertical: moderateScale(10),
    backgroundColor: "#fff",
    zIndex: 10,
  },

  title: { fontSize: normalizeFont(15), fontWeight: "600", color: "#374151" }, // bumped +1

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

  dropdownText: { fontSize: normalizeFont(12), color: "#374151", fontWeight: "400" }, // bumped +1

  filterButton: {
    padding: moderateScale(5),
    backgroundColor: "#fff",
    borderWidth: moderateScale(1),
    borderColor: "grey",
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
  },

  modalOverlay: { flex: 1 },

  dropdownMenu: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(10),
    shadowColor: "#000",
    paddingVertical: moderateScale(3),
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowOpacity: Platform.OS === "ios" ? 0.15 : 0.22,
    shadowRadius: moderateScale(12),
    elevation: moderateScale(8),
    overflow: "hidden",
    borderWidth: moderateScale(1),
    height: scale(200),
    borderColor: "rgba(0,0,0,0.3)",
  },

  dropdownItem: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(8),
    borderBottomWidth: moderateScale(1),
    borderBottomColor: "#f3f4f6",
  },

  dropdownItemActive: { backgroundColor: "#f3f4f6"},

  dropdownItemText: { fontSize: normalizeFont(12), color: "#374151"}, // bumped +1

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
    bottom: moderateScale(0),
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

  modalTitle: { fontSize: normalizeFont(13), fontWeight: "600", color: "#333" }, // bumped +1

  closeButton: { fontSize: normalizeFont(14), color: "#333" },

  modalBody: { flex: 1, backgroundColor: "#fff" },

  filterSection: { borderBottomWidth: moderateScale(1), borderBottomColor: "#f5f5f5" },

  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(16)
  },

  filterTitle: { fontSize: normalizeFont(11), fontWeight: "500", color: "#333" }, // bumped +1

  chevron: { fontSize: moderateScale(14), color: "#666", transform: [{ rotate: "90deg" }] },

  chevronRotated: { transform: [{ rotate: "270deg" }] },

  filterOptions: { paddingBottom: moderateScale(16), paddingHorizontal: 16 },

  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(10),
  },

  radioCircle: {
    width: moderateScale(15),
    height: moderateScale(15),
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

  optionText: { fontSize: normalizeFont(11), color: "#6b7280" }, // bumped +1
  optionTextSelected: { color: "#1f2937", fontWeight: "600" },

  modalFooter: { padding: moderateScale(17), borderTopWidth: moderateScale(1), borderTopColor: "#f0f0f0" },

  applyButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(8),
    alignItems: "center",
  },

  applyButtonText: { color: "#fff", fontSize: normalizeFont(11), fontWeight: "600" }, // bumped +1
});
