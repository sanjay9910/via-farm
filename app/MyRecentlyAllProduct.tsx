import { moderateScale, normalizeFont, scale } from "@/app/Responsive";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProductModal from "../components/vendors/ProductEditModel";
const { width, height } = Dimensions.get("window");

const API_BASE = "https://viafarm-1.onrender.com";

const clampPos = (x, y, w = width, h = height) => {
  // ensure popup stays inside screen with small margin
  const margin = moderateScale(8);
  let nx = x;
  let ny = y;
  if (nx < margin) nx = margin;
  if (ny < margin) ny = margin;
  if (nx > w - margin) nx = w - margin;
  if (ny > h - margin) ny = h - margin;
  return { x: nx, y: ny };
};

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
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setAllCategory] = useState(["All"]);

  const stockButtonRefs = useRef({});
  const actionMenuRefs = useRef({});
  const categoryButtonRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    const getAllCategory = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const catRes = await axios.get(`${API_BASE}/api/admin/manage-app/categories`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          timeout: 10000,
        });

        const onlyNames = (catRes.data?.categories || []).map((item) => item.name).filter(Boolean);
        // ensure "All" at start and unique
        const uniq = Array.from(new Set(["All", ...onlyNames]));
        setAllCategory(uniq.length ? uniq : ["All"]);
      } catch (error) {
        console.log("Error fetching categories:", error?.message || error);
        setAllCategory(["All"]);
      }
    };
    getAllCategory();
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.log("User not logged in - skipping fetchProducts");
        setListingsData([]);
        setFilteredData([]);
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_BASE}/api/vendor/recent-products`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });

      const products = res.data?.products || [];
      const formattedData = products.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        unit: product.unit || "",
        weightPerPiece: product.weightPerPiece || "",
        uploadedOn: product.datePosted ? new Date(product.datePosted).toLocaleDateString() : "",
        image: product.images && product.images.length ? product.images[0] : "",
        status: product.status || "In Stock",
        category: product.category || "Fruit",
        _raw: product,
      }));
      setListingsData(formattedData);
      setFilteredData(
        selectedCategory === "All"
          ? formattedData
          : formattedData.filter((d) => d.category === selectedCategory)
      );
    } catch (error) {
      console.log("Error fetching products:", error?.message || error);
      setListingsData([]);
      setFilteredData([]);
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

  useEffect(() => {
    if (selectedCategory === "All") {
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
    // update filtered data too
    setFilteredData((prev) => prev.map((i) => (i.id === updatedProduct.id ? updatedProduct : i)));
    closeModal();
  };

  // Stock dropdown
  const openStockDropdown = (productId) => {
    const ref = stockButtonRefs.current[productId];
    if (ref && ref.measureInWindow) {
      ref.measureInWindow((x, y, w, h) => {
        const pos = clampPos(x - moderateScale(60), y + h + moderateScale(5));
        setStockDropdownPosition({ x: pos.x, y: pos.y });
        setCurrentProductId(productId);
        setIsStockDropdownOpen(true);
      });
    } else {
      // fallback: just open in center
      const pos = clampPos(width / 2 - moderateScale(80), height / 2 - moderateScale(40));
      setStockDropdownPosition({ x: pos.x, y: pos.y });
      setCurrentProductId(productId);
      setIsStockDropdownOpen(true);
    }
  };

  // Category dropdown
  const openCategoryDropdown = () => {
    if (categoryButtonRef.current && categoryButtonRef.current.measureInWindow) {
      categoryButtonRef.current.measureInWindow((x, y, w, h) => {
        const pos = clampPos(x, y + h + moderateScale(5));
        setCategoryDropdownPosition({ x: pos.x, y: pos.y });
        setIsCategoryDropdownOpen(true);
      });
    } else {
      const pos = clampPos(moderateScale(16), moderateScale(80));
      setCategoryDropdownPosition({ x: pos.x, y: pos.y });
      setIsCategoryDropdownOpen(true);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category || "All");
    setIsCategoryDropdownOpen(false);
  };

  // Action menu (3 dots)
  const openActionMenu = (productId) => {
    const ref = actionMenuRefs.current[productId];
    if (ref && ref.measureInWindow) {
      ref.measureInWindow((x, y, w, h) => {
        const pos = clampPos(x - moderateScale(100), y + h + moderateScale(5));
        setActionMenuPosition({ x: pos.x, y: pos.y });
        setCurrentProductId(productId);
        setIsActionMenuOpen(true);
      });
    } else {
      const pos = clampPos(width - moderateScale(160), moderateScale(200));
      setActionMenuPosition({ x: pos.x, y: pos.y });
      setCurrentProductId(productId);
      setIsActionMenuOpen(true);
    }
  };

  const handleEdit = () => {
    const product = listingsData.find((item) => item.id === currentProductId);
    if (product) {
      openModal(product);
    } else {
      console.log("Edit requested but product not found:", currentProductId);
      setIsActionMenuOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!currentProductId) {
      console.log("Delete attempted but no product selected");
      setIsActionMenuOpen(false);
      return;
    }

    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            setIsActionMenuOpen(false);
            setCurrentProductId(null);
          },
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("userToken");
              if (!token) {
                console.log("Delete attempted but user not logged in");
                setIsActionMenuOpen(false);
                setCurrentProductId(null);
                return;
              }

              // optimistic UI remove
              setListingsData((prev) => prev.filter((item) => item.id !== currentProductId));
              setFilteredData((prev) => prev.filter((i) => i.id !== currentProductId));

              try {
                const response = await axios.delete(
                  `${API_BASE}/api/vendor/products/${currentProductId}`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 10000,
                  }
                );

                const ok =
                  (response && (response.status === 200 || response.status === 204)) ||
                  response?.data?.success;
                if (!ok) {
                  console.log("Delete not acknowledged by server, refetching", response?.data);
                  await fetchProducts();
                } else {
                  console.log("Deleted product on server:", currentProductId);
                }
              } catch (err) {
                console.log("Delete request failed, refetching:", err?.message || err);
                await fetchProducts();
              }
            } catch (error) {
              console.log("Unexpected delete error:", error);
            } finally {
              setIsActionMenuOpen(false);
              setCurrentProductId(null);
            }
          },
        },
      ]
    );
  };

  // Stock change (optimistic + try multiple endpoints; on full failure, resync)
  const handleStockChange = async (newStatus) => {
    if (!currentProductId) {
      console.log("Stock change attempted but no product selected");
      setIsStockDropdownOpen(false);
      return;
    }

    setIsStockDropdownOpen(false);
    setUpdatingStock(true);

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.log("Stock update attempted but user not logged in");
        setUpdatingStock(false);
        setCurrentProductId(null);
        return;
      }

      // optimistic update in UI
      setListingsData((prev) => prev.map((item) => (item.id === currentProductId ? { ...item, status: newStatus } : item)));
      setFilteredData((prev) => prev.map((i) => (i.id === currentProductId ? { ...i, status: newStatus } : i)));

      const tryEndpoints = [
        { method: "patch", url: `${API_BASE}/api/vendor/products/${currentProductId}/status`, data: { status: newStatus } },
        { method: "patch", url: `${API_BASE}/api/vendor/products/${currentProductId}`, data: { status: newStatus } },
        { method: "put", url: `${API_BASE}/api/vendor/products/${currentProductId}`, data: { status: newStatus } },
      ];

      let succeeded = false;
      for (let ep of tryEndpoints) {
        try {
          const resp = await axios({
            method: ep.method,
            url: ep.url,
            data: ep.data,
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            timeout: 10000,
          });
          if (resp && (resp.status === 200 || resp.status === 204 || resp.data?.success)) {
            succeeded = true;
            console.log("Stock update succeeded at:", ep.url);
            break;
          }
        } catch (err) {
          console.log("Stock endpoint failed:", ep.url, err?.response?.status || err?.message);
        }
      }

      if (!succeeded) {
        console.log("All stock endpoints failed, resyncing from server for product:", currentProductId);
        await fetchProducts();
      }
    } catch (error) {
      console.log("Stock update unexpected error:", error?.message || error);
      await fetchProducts();
    } finally {
      setUpdatingStock(false);
      setCurrentProductId(null);
    }
  };

  const handleCardPress = (item) => {
    try {
      if (navigation?.push) {
        navigation.push("VendorViewProduct", { productId: item.id, product: item._raw ?? item });
      } else if (navigation?.navigate) {
        navigation.navigate("VendorViewProduct", { productId: item.id, product: item._raw ?? item });
      } else {
        console.warn("Navigation method not found");
      }
    } catch (err) {
      console.log("Navigation error:", err);
      try {
        navigation.navigate("VendorViewProduct", { productId: item.id, product: item._raw ?? item });
      } catch (e) {
        console.log("Fallback navigation failed:", e);
      }
    }
  };

  // Render card — DESIGN MATCHED to screenshot
  const renderCard = (item) => {
    const lower = (item.status || "").toLowerCase();
    const circleColor = lower.includes("in stock") ? "#22c55e" : "#ef4444";
    const isCurrentlyUpdating = updatingStock && currentProductId === item.id;

    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.95}
        onPress={() => handleCardPress(item)}
        style={styles.listingCard}
      >
        <View style={styles.cardInner}>
          {/* Left image */}
          <View style={styles.leftImageWrap}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="stretch" />
            ) : (
              <View style={styles.noImage}>
                <Text allowFontScaling={false} style={{ color: "#999", fontSize: normalizeFont(12) }}>No image</Text>
              </View>
            )}

            {/* Rating badge bottom-left on image */}
            <View style={styles.ratingBadge}>
              <Image source={require("../assets/via-farm-img/icons/satar.png")} style={styles.starIcon} />
              <Text allowFontScaling={false} style={styles.ratingText}>4.5</Text>
            </View>
          </View>

          {/* Right content */}
          <View style={styles.rightContent}>
            <View style={styles.titleRow}>
              <Text allowFontScaling={false} style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>

              <TouchableOpacity
                ref={(ref) => {
                  actionMenuRefs.current[item.id] = ref;
                }}
                style={styles.dotsBtn}
                onPress={(e) => {
                  e && e.stopPropagation && e.stopPropagation();
                  openActionMenu(item.id);
                }}
              >
                <Image source={require("../assets/via-farm-img/icons/threeDot.png")} />
              </TouchableOpacity>
            </View>

            <View style={styles.infoRow}>
              <Text allowFontScaling={false} style={styles.infoLabel}>Category</Text>
              <Text allowFontScaling={false} style={styles.infoSeparator}>:</Text>
              <Text allowFontScaling={false} style={styles.infoValue}>{item.category}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text allowFontScaling={false} style={styles.infoLabel}>Price</Text>
              <Text allowFontScaling={false} style={styles.infoSeparator}>:</Text>
              <Text allowFontScaling={false} style={styles.infoValue}>₹{item.price}/{item.unit || "pc"}</Text>
            </View>

            <View style={styles.uploadRow}>
              <Text allowFontScaling={false} style={styles.uploadLabel}>Uploaded on</Text>
              <Text allowFontScaling={false} style={styles.uploadValue}>{item.uploadedOn}</Text>
            </View>

            {/* Stock pill */}
            <View style={styles.stockRow}>
              <TouchableOpacity
                ref={(ref) => {
                  stockButtonRefs.current[item.id] = ref;
                }}
                style={styles.stockPill}
                onPress={(e) => {
                  e && e.stopPropagation && e.stopPropagation();
                  openStockDropdown(item.id);
                }}
                disabled={isCurrentlyUpdating}
              >
                <View style={[styles.stockDot, { backgroundColor: circleColor }]} />
                <Text allowFontScaling={false} style={styles.stockText}>{item.status}</Text>
                <Image source={require("../assets/via-farm-img/icons/downArrow.png")} style={styles.downIcon} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={require("../assets/via-farm-img/icons/groupArrow.png")} />
        </TouchableOpacity>
        <Text allowFontScaling={false} style={styles.headerTitle}>Recent Listings</Text>
      </View>

      <TouchableOpacity ref={categoryButtonRef} style={styles.categoryDropdownButton} onPress={openCategoryDropdown}>
        <Text allowFontScaling={false} style={styles.categoryDropdownText}>{selectedCategory}</Text>
        <Text allowFontScaling={false} style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="rgba(255,202,40,1)" />
        <Text allowFontScaling={false} style={styles.loadingText}></Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <ScrollView contentContainerStyle={{ paddingHorizontal: moderateScale(16), paddingBottom: moderateScale(24) }}>
        {filteredData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text allowFontScaling={false} style={styles.emptyText}>No products found</Text>
            <Text allowFontScaling={false} style={styles.emptySubText}>
              {selectedCategory !== "All"
                ? `No products in ${selectedCategory} category`
                : "Start adding products to see them here"}
            </Text>
          </View>
        ) : (
          filteredData.map((item) => renderCard(item))
        )}
      </ScrollView>

      {/* Stock Dropdown Modal */}
      <Modal visible={isStockDropdownOpen} transparent animationType="fade" onRequestClose={() => setIsStockDropdownOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setIsStockDropdownOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.stockDropdown, { position: "absolute", top: stockDropdownPosition.y, left: stockDropdownPosition.x }]}>
                <TouchableOpacity style={styles.stockOption} onPress={() => handleStockChange("In Stock")}>
                  <View style={[styles.stockDot, { backgroundColor: "#22c55e" }]} />
                  <Text allowFontScaling={false} style={styles.stockOptionText}>In Stock</Text>
                </TouchableOpacity>
                <View style={styles.stockDivider} />
                <TouchableOpacity style={styles.stockOption} onPress={() => handleStockChange("Out of Stock")}>
                  <View style={[styles.stockDot, { backgroundColor: "#ef4444" }]} />
                  <Text allowFontScaling={false} style={styles.stockOptionText}>Out of Stock</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Category Dropdown Modal */}
      <Modal visible={isCategoryDropdownOpen} transparent animationType="fade" onRequestClose={() => setIsCategoryDropdownOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setIsCategoryDropdownOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.categoryDropdown, { position: "absolute", top: categoryDropdownPosition.y, left: categoryDropdownPosition.x, maxHeight: scale(300) }]}>
                <ScrollView showsVerticalScrollIndicator>
                  {(categories.length ? categories : ["All"]).map((category, index) => (
                    <View key={category + index}>
                      <TouchableOpacity
                        style={[styles.categoryOption, category === selectedCategory && styles.categoryOptionSelected]}
                        onPress={() => handleCategorySelect(category)}
                      >
                        <Text allowFontScaling={false} style={[styles.categoryOptionText, category === selectedCategory && styles.categoryOptionTextSelected]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                      {index < (categories.length ? categories.length : 1) - 1 && <View style={styles.categoryDivider} />}
                    </View>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Action Menu Modal (3 dots) */}
      <Modal visible={isActionMenuOpen} transparent animationType="fade" onRequestClose={() => setIsActionMenuOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setIsActionMenuOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.actionMenu, { position: "absolute", top: actionMenuPosition.y, left: actionMenuPosition.x }]}>
                <TouchableOpacity style={styles.actionOption} onPress={handleEdit}>
                  <Text allowFontScaling={false} style={styles.actionOptionText}>Edit</Text>
                </TouchableOpacity>
                <View style={styles.actionDivider} />
                <TouchableOpacity style={styles.actionOption} onPress={handleDelete}>
                  <Text allowFontScaling={false} style={[styles.actionOptionText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Product Edit Modal */}
      <ProductModal visible={modalVisible} onClose={closeModal} onSubmit={submitModal} product={selectedProduct} />
    </SafeAreaView>
  );
};

export default AllRecently;

/* styles (unchanged structurally, but uses moderateScale/normalizeFont for responsiveness) */
export const styles = StyleSheet.create({
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
    marginTop: moderateScale(12),
    fontSize: normalizeFont(12),
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: moderateScale(50),
    paddingHorizontal: moderateScale(20),
  },
  emptyText: {
    fontSize: normalizeFont(18),
    fontWeight: "600",
    color: "#333",
    marginBottom: moderateScale(8),
    textAlign: "center",
  },
  emptySubText: {
    fontSize: normalizeFont(10),
    color: "#666",
    textAlign: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: moderateScale(13),
    paddingVertical: moderateScale(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    padding: moderateScale(8),
    marginRight: moderateScale(12),
  },
  headerTitle: {
    fontSize: normalizeFont(13),
    fontWeight: "700",
    color: "#333",
  },
  dotsBtn: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
  },
  categoryDropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.3)",
    minWidth: moderateScale(120),
  },
  categoryDropdownText: {
    fontSize: normalizeFont(12),
    fontWeight: "500",
    color: "#333",
    marginRight: moderateScale(8),
    maxWidth: moderateScale(120),
  },
  dropdownArrow: {
    fontSize: normalizeFont(12),
    color: "#666",
    fontWeight: "bold",
  },

  // Card
  listingCard: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(14),
    borderWidth: 1.5,
    borderColor: "rgba(255,202,40,1)",
    width: Math.min(width * 0.95, moderateScale(920)),
    height: scale(150),
    alignSelf: "center",
    overflow: "hidden",
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Left image block
  leftImageWrap: {
    height: "100%",
    width: scale(145),
    borderTopLeftRadius: moderateScale(8),
    borderBottomLeftRadius: moderateScale(8),
    overflow: "hidden",
    backgroundColor: "#f3f3f3",
  },
  itemImage: {
    width: "100%",
    height: scale(155),
  },
  noImage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  ratingBadge: {
    position: "absolute",
    left: moderateScale(6),
    bottom: moderateScale(16),
    backgroundColor: "rgba(141,141,141,0.6)",
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(10),
    flexDirection: "row",
    alignItems: "center",
  },
  starIcon: {
    width: moderateScale(12),
    height: moderateScale(12),
  },
  ratingText: {
    color: "#fff",
    fontSize: normalizeFont(10),
    fontWeight: "600",
  },

  // Right content
  rightContent: {
    flex: 1,
    marginLeft: moderateScale(12),
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: normalizeFont(13),
    fontWeight: "700",
    color: "#222",
    flex: 1,
    marginRight: moderateScale(8),
  },
  dotsText: {
    fontSize: normalizeFont(20),
    color: "#666",
    fontWeight: "700",
  },

  // Label-value rows
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoLabel: {
    width: moderateScale(60),
    fontSize: normalizeFont(12),
    color: "#666",
    fontWeight: "500",
  },
  infoSeparator: {
    width: moderateScale(8),
    fontSize: normalizeFont(12),
    color: "#666",
  },
  infoValue: {
    flex: 1,
    fontSize: normalizeFont(12),
    color: "#666",
    fontWeight: "600",
  },

  uploadRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  uploadLabel: {
    fontSize: normalizeFont(12),
    color: "#666",
    marginRight: moderateScale(8),
  },
  uploadValue: {
    fontSize: normalizeFont(12),
    color: "#666",
    fontWeight: "500",
  },

  stockRow: {
    marginTop: moderateScale(7),
  },
  stockPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.3)",
    backgroundColor: "#fff",
    marginBottom: moderateScale(20),
  },
  stockDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(8),
  },
  stockText: {
    fontSize: normalizeFont(12),
    fontWeight: "600",
    marginRight: moderateScale(8),
    color: "#444",
  },
  downIcon: {
    width: moderateScale(12),
    height: moderateScale(12),
  },

  // Modal & dropdown styles (kept simple)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  stockDropdown: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(8),
    minWidth: moderateScale(140),
    paddingVertical: moderateScale(8),
    borderWidth: 1,
    marginLeft: moderateScale(10),
    borderColor: "rgba(255,202,40,1)",
    elevation: 6,
  },
  stockOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
  },
  stockOptionText: {
    fontSize: normalizeFont(12),
    fontWeight: "500",
    color: "#374151",
    marginLeft: moderateScale(8),
  },
  stockDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
  },

  // Action menu
  actionMenu: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(10),
    minWidth: moderateScale(120),
    paddingVertical: moderateScale(8),
    borderWidth: 1,
    borderColor: "rgba(255,202,40,0.3)",
    elevation: 6,
  },
  actionOption: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
  },
  actionOptionText: {
    fontSize: normalizeFont(10),
    fontWeight: "500",
    color: "#374151",
  },
  deleteText: {
    color: "#ef4444",
  },
  actionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#f3f4f6",
  },

  // Category dropdown
  categoryDropdown: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    minWidth: scale(123),
    paddingVertical: moderateScale(8),
    borderWidth: 1,
    borderColor: "rgba(255,202,40,0.3)",
    elevation: 6,
  },
  categoryOption: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
  },
  categoryOptionSelected: {
    backgroundColor: "rgba(255,202,40,0.08)",
  },
  categoryOptionText: {
    fontSize: normalizeFont(12),
    fontWeight: "500",
    color: "#374151",
  },
  categoryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#f3f4f6",
  },
});
