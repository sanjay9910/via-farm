import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ProductModal from "../../components/vendors/ProductEditModel";

const API_BASE = "https://393rb0pp-5000.inc1.devtunnels.ms";

const MyRecentListing = () => {
  const [listingsData, setListingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch products from API
  const fetchProducts = async () => {
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

  const renderItem = ({ item }) => {
    const circleColor =
      item.status.toLowerCase() === "in stock" ? "#2E7D32" : "#FFD700";

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
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.priceQuantityContainer}>
                <Text style={styles.priceText}>₹{item.price}</Text>
                <Text style={styles.quantity}>{item.quantity}units</Text>
              </View>
            </View>

            <View style={styles.detailsContainer}>
              <Text style={styles.uploadLabel}>Uploaded on:</Text>
              <Text style={styles.uploadValue}>{item.uploadedOn}</Text>
            </View>

            <View style={styles.startAllIndia}>
              <Image
                source={require("../../assets/via-farm-img/icons/satar.png")}
              />
              <Text style={styles.txetAll}>All India Delivery</Text>
            </View>

            <View style={styles.editBtn}>
              <TouchableOpacity style={styles.dropdownBtn}>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusCircle,
                      { backgroundColor: circleColor },
                    ]}
                  />
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openModal(item)}
              >
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

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        color="rgba(255,202,40,1)"
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      />
    );

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
  container: { paddingVertical: 16, backgroundColor: "#fff", flex: 1 },
  headerRowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  seeAll: { fontSize: 13, color: "#0AA1FF" },
  flatListContent: { paddingHorizontal: 16 },
  listingCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginRight: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 202, 40, 1)",
    width: Dimensions.get("window").width * 0.8,
  },
  cardContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  imageContainer: { width: 120, height: 140 },
  itemImage: {
    width: "100%",
    height: "100%",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  textContainer: { flex: 1, paddingRight: 12, paddingVertical: 8 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(66, 66, 66, 1)",
    flex: 1,
    marginRight: 8,
  },
  priceQuantityContainer: {
    alignItems: "flex-end",
    position: "absolute",
    marginLeft: 145,
  },
  priceText: { fontSize: 16, fontWeight: "bold", color: "#2E7D32" },
  quantity: { fontSize: 12, color: "#666", marginTop: 2 },
  detailsContainer: { flexDirection: "row", gap: 4, marginBottom: 4 },
  uploadLabel: { fontSize: 12, color: "#666" },
  uploadValue: { fontSize: 12, color: "#000", fontWeight: "500" },
  startAllIndia: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginVertical: 4,
  },
  txetAll: { fontSize: 13 },
  editBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  dropdownBtn: {
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.3)",
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusCircle: { width: 10, height: 10, borderRadius: 5 },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 202, 40, 1)",
  },
  editButton: { padding: 6, borderRadius: 4 },
  editIcon: { width: 20, height: 20 },
});
