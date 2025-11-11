import { moderateScale, normalizeFont, scale } from "@/app/Responsive";
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
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

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
                    <Text style={{fontSize:moderateScale(10)}}>{unit || "Select Unit"}</Text>
                    <Ionicons name={isUnitDropdownOpen ? "chevron-up" : "chevron-down"} size={15} color="#000" />
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
                <Text style={{ marginLeft: 8 ,fontSize:normalizeFont(12)}}>All India Delivery</Text>
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

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: moderateScale(3),
    borderColor: "#22c55e",
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    margin: moderateScale(12),
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: Platform.OS === "ios" ? 0.1 : 0.3,
    shadowRadius: moderateScale(4),
    elevation: 3,
  },

  content: { flex: 1, paddingRight: moderateScale(10) },

  title: {
    fontSize: normalizeFont(15),
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: moderateScale(6),
  },

  subtitle: {
    fontSize: normalizeFont(11),
    color: "#6b7280",
  },

  iconContainer: {
    width: scale(55),
    height:scale(54),
    borderRadius: moderateScale(28),
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowOpacity: Platform.OS === "ios" ? 0.3 : 0.4,
    shadowRadius: moderateScale(8),
    elevation: 5,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderTopLeftRadius: moderateScale(16),
    borderTopRightRadius: moderateScale(16),
    padding: moderateScale(13),
    borderWidth:2,
    borderColor:'rgba(255, 202, 40, 1)',
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(8),
  },

  headerText: {
    fontSize: normalizeFont(12),
    fontWeight: "600",
    color: "#000",
  },

  smallNote: {
    fontSize: normalizeFont(11),
    color: "#777",
    marginBottom: moderateScale(10),
  },

  label: {
    fontSize: normalizeFont(10),
    fontWeight: "500",
    marginTop: moderateScale(10),
    marginBottom: moderateScale(4),
    color: "#333",
  },

  input: {
    borderWidth: moderateScale(1),
    borderColor: "#f0c96a",
    borderRadius: moderateScale(10),
    padding: moderateScale(12),
    backgroundColor: "#fff",
    marginBottom: moderateScale(8),
    fontSize: normalizeFont(10),
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: moderateScale(4),
  },

  flex1: { flex: 1, marginRight: moderateScale(8) },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: moderateScale(10),
  },

  submitContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignContent: "center",
  },

  submitBtn: {
    backgroundColor: "#22c55e",
    width: "70%",
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(14),
    flexDirection: "row",
    justifyContent: "center",
    gap:scale(5),
    alignContent: "center",
    marginTop: moderateScale(20),
    marginBottom: moderateScale(10),
    alignItems: "center",
  },

  submitText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: normalizeFont(12),
  },

  imageUpload: {
    borderWidth: moderateScale(1),
    borderColor: "#f0c96a",
    borderRadius: moderateScale(10),
    padding: moderateScale(16),
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(4),
    backgroundColor: "#fff",
  },

  imageUploadDisabled: {
    backgroundColor: "#f3f4f6",
    opacity: 0.7,
  },

  imageUploadText: { marginTop: moderateScale(8), color: "#777", fontSize: normalizeFont(10) },

  imagePreviewContainer: { position: "relative", marginRight: moderateScale(8) },

  previewImage: {
    width: moderateScale(65),
    height: moderateScale(65),
    borderRadius: moderateScale(8),
  },

  removeImageBtn: {
    position: "absolute",
    top: -moderateScale(6),
    right: -moderateScale(6),
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(4),
  },

  helperText: { fontSize: normalizeFont(10), color: "#777", marginBottom: moderateScale(4) },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(8),
    width: moderateScale(140),
    elevation: 6,
  },

  dropdownOption: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(15),
  },

  dropdownBelowInput: {
    width: moderateScale(114),
    marginTop: moderateScale(30),
    position: "absolute",
    borderWidth: moderateScale(1),
    borderColor: "#f0c96a",
    borderRadius: moderateScale(10),
    backgroundColor: "#fff",
    overflow: "hidden",
    zIndex: 100,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: Platform.OS === "ios" ? 0.15 : 0.2,
    shadowRadius: moderateScale(4),
  },
});