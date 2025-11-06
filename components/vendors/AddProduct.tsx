import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Checkbox from "expo-checkbox";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE = "https://viafarm-1.onrender.com/api/vendor";

const AddProduct = ({ refreshprops }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [variety, setVariety] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [allIndiaDelivery, setAllIndiaDelivery] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [weightPerPiece, setWeightPerPiece] = useState("");
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false); // dropdown toggle

  const unitOptions = ["kg", "pc", "ltr", "dozen"];

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Permission to access gallery is required!"
        );
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5 - images.length,
        quality: 0.8,
      });

      if (!result.canceled) {
        let selected = result.assets || [];
        setImages((prev) => [...prev, ...selected]);
      }
    } catch (err) {
      console.log("Image picker error:", err);
      Alert.alert("Error", "Failed to select images.");
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter product name");
      return;
    }
    if (!category.trim()) {
      Alert.alert("Error", "Please enter category");
      return;
    }
    if (!variety.trim()) {
      Alert.alert("Error", "Please enter variety");
      return;
    }
    if (!price.trim() || isNaN(price)) {
      Alert.alert("Error", "Please enter valid price");
      return;
    }
    if (!quantity.trim() || isNaN(quantity)) {
      Alert.alert("Error", "Please enter valid quantity");
      return;
    }
    if (!unit.trim()) {
      Alert.alert("Error", "Please select unit (kg/pc/ltr/dozen)");
      return;
    }

    const normalizedUnit = unit.trim().toLowerCase();

    if (normalizedUnit === "pc" && !weightPerPiece.trim()) {
      Alert.alert("Error", "Please enter weight per piece for pc unit");
      return;
    }

    if (images.length === 0) {
      Alert.alert("Error", "Please add at least one image");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "Please login first");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("category", category.trim());
      formData.append("variety", variety.trim());
      formData.append("price", parseFloat(price.trim()));
      formData.append("quantity", parseFloat(quantity.trim()));
      formData.append("unit", normalizedUnit);
      formData.append("description", description.trim() || "");
      formData.append("allIndiaDelivery", allIndiaDelivery);

      if (normalizedUnit === "pc" && weightPerPiece.trim()) {
        formData.append("weightPerPiece", weightPerPiece.trim());
      }

      images.forEach((image, index) => {
        const uri = image.uri;
        const uriParts = uri.split("/");
        const fileName = uriParts[uriParts.length - 1];
        const fileType = fileName.split(".").pop().toLowerCase();

        const file = {
          uri: uri,
          type: `image/${fileType === "jpg" ? "jpeg"  : fileType}`,
          name: fileName || `photo_${index}.${fileType}`,
        };

        formData.append("images", file);
      });

      const response = await axios.post(`${API_BASE}/products/add`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      });

      if (response.data.success) {
        Alert.alert("Success", "Product added successfully!", [
          {
            text: "OK",
            onPress: () => {
              setModalVisible(false);
              resetForm();
              if (refreshprops) refreshprops();
            },
          },
        ]);
      } else {
        Alert.alert("Error", response.data.message || "Failed to add product");
      }
    } catch (error) {
      console.error("Full error:", error);
      console.error("Error response:", error.response?.data);
      let errorMessage = "Failed to add product. Please try again.";

      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          errorMessage;

        if (error.response.status === 401) {
          errorMessage = "Session expired. Please login again.";
        } else if (error.response.status === 413) {
          errorMessage = "Images are too large. Please select smaller images.";
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.message || "Please check all fields and try again.";
        } else if (error.response.status === 500) {
          errorMessage = "Server error. Please check all fields and try again.";
        }
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.code === "ECONNABORTED") {
        errorMessage = "Request timeout. Please try again.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setCategory("");
    setUnit("");
    setVariety("");
    setQuantity("");
    setPrice("");
    setDescription("");
    setAllIndiaDelivery(false);
    setImages([]);
    setWeightPerPiece("");
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Add a Product</Text>
          <Text style={styles.subtitle}>
            Showcase your fresh produce or handmade items to more buyers
          </Text>
        </View>
        <View style={styles.iconContainer}>
          <Feather name="plus" size={28} color="#fff" />
        </View>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => !loading && setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <Pressable onPress={() => !loading && setModalVisible(false)}>
                  <Ionicons name="arrow-back" size={24} color="#000" />
                </Pressable>
                <Text style={styles.headerText}>Add Product Details</Text>
                <View style={{ width: 24 }} />
              </View>

              <Text style={styles.smallNote}>* marks important fields</Text>

              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Kashmiri Apples"
                editable={!loading}
              />

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={styles.label}>Category *</Text>
                  <TextInput
                    style={styles.input}
                    value={category}
                    onChangeText={setCategory}
                    placeholder="e.g., Fruits"
                    editable={!loading}
                  />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.label}>Variety *</Text>
                  <TextInput
                    style={styles.input}
                    value={variety}
                    onChangeText={setVariety}
                    placeholder="e.g., Royal Gala"
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={styles.label}>Price (₹) *</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="eg.0"
                    keyboardType="numeric"
                    editable={!loading}
                  />
                </View>

                <View style={styles.flex1}>
                  <Text style={styles.label}>Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="eg.0"
                    keyboardType="numeric"
                    editable={!loading}
                  />
                </View>




                <View style={styles.flex1}>
                  <Text style={styles.label}>Unit *</Text>

                  {/* Dropdown button */}
                  <TouchableOpacity
                    style={[
                      styles.input,
                      { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
                    ]}
                    onPress={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                    disabled={loading}
                  >
                    <Text>{unit || "Select Unit"}</Text>
                    <Ionicons name={isUnitDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color="#000" />
                  </TouchableOpacity>

                  {/* Dropdown list (shown just below input) */}
                  {isUnitDropdownOpen && (
                    <View style={styles.dropdownBelowInput}>
                      {unitOptions.map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.dropdownOption,
                            unit === opt && { backgroundColor: "#f0f0f0" },
                          ]}
                          onPress={() => {
                            setUnit(opt);
                            setIsUnitDropdownOpen(false);
                          }}
                        >
                          <Text>{opt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>



              </View>

              {unit.toLowerCase() === "pc" && (
                <View>
                  <Text style={styles.label}>Weight Per Piece *</Text>
                  <TextInput
                    style={styles.input}
                    value={weightPerPiece}
                    onChangeText={setWeightPerPiece}
                    placeholder="e.g., 400g or 0.4kg"
                    editable={!loading}
                  />
                  <Text style={styles.helperText}>
                    Enter weight of one piece (e.g., 400gm, 0.5kg, 200gram)
                  </Text>
                </View>
              )}

              <Text style={styles.label}>Add Images *</Text>
              <TouchableOpacity
                style={[
                  styles.imageUpload,
                  (loading || images.length >= 5) && styles.imageUploadDisabled,
                ]}
                onPress={pickImages}
                disabled={loading || images.length >= 5}
              >
                <Ionicons name="folder-outline" size={32} color="#777" />
                <Text style={styles.imageUploadText}>
                  {images.length >= 5
                    ? "Maximum 5 images reached"
                    : `Add photos of your product (${images.length}/5)`}
                </Text>
              </TouchableOpacity>

              {images.length > 0 && (
                <ScrollView horizontal style={{ marginVertical: 8 }}>
                  {images.map((img, idx) => (
                    <View key={idx} style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: img.uri }}
                        style={styles.previewImage}
                      />
                      {!loading && (
                        <TouchableOpacity
                          style={styles.removeImageBtn}
                          onPress={() => removeImage(idx)}
                        >
                          <Ionicons
                            name="close-circle"
                            size={24}
                            color="#ef4444"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Write product details here (optional)"
                multiline
                editable={!loading}
              />

              <View style={styles.checkboxRow}>
                <Checkbox
                  value={allIndiaDelivery}
                  onValueChange={setAllIndiaDelivery}
                  disabled={loading}
                />
                <Text style={{ marginLeft: 8 }}>All India Delivery</Text>
              </View>

              <View style={styles.submitContainer}>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    loading && styles.submitBtnDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={loading ? 1 : 0.7}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Feather name="check-circle" size={20} color="#fff" />
                      <Text style={styles.submitText}>Add Product</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default AddProduct;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#22c55e",
    borderRadius: 16,
    padding: 16,
    margin: 16,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: { flex: 1, paddingRight: 12 },
  title: { fontSize: 18, fontWeight: "700", color: "#1f2937", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#6b7280", lineHeight: 20 },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" },
  modalContainer: {
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  headerText: { fontSize: 18, fontWeight: "600", color: "#000" },
  smallNote: { fontSize: 12, color: "#777", marginBottom: 10 },
  label: { fontSize: 14, fontWeight: "500", marginTop: 10, marginBottom: 4, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#f0c96a",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  flex1: { flex: 1, marginRight: 8 },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  submitContainer: { flexDirection: "row", justifyContent: "center", alignContent: "center" },
  submitBtn: {
    backgroundColor: "#22c55e",
    width: "70%",
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignContent: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  imageUpload: {
    borderWidth: 1,
    borderColor: "#f0c96a",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    backgroundColor: "#fff",
  },
  imageUploadDisabled: { backgroundColor: "#f3f4f6", opacity: 0.7 },
  imageUploadText: { marginTop: 8, color: "#777" },
  imagePreviewContainer: { position: "relative", marginRight: 8 },
  previewImage: { width: 80, height: 80, borderRadius: 8 },
  removeImageBtn: { position: "absolute", top: -6, right: -6, backgroundColor: "#fff", borderRadius: 12 },
  helperText: { fontSize: 12, color: "#777", marginBottom: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    // paddingVertical: 6,
    width: 140,
    elevation: 6,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  dropdownBelowInput: {
    width: 130,
    marginTop:75,
    position:'absolute',
    borderWidth: 1,
    borderColor: "#f0c96a",
    borderRadius: 10,
    backgroundColor: "#fff",
    overflow: "hidden",
    zIndex:100,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});
