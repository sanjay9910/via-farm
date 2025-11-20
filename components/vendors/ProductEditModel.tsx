// ProductEditModal.js
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Checkbox from "expo-checkbox";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
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

import { moderateScale, normalizeFont, scale } from "@/app/Responsive";

const API_HOST = "https://viafarm-1.onrender.com";
const CATEGORY_API = "/api/admin/manage-app/categories";
const VARIETY_API = "/api/admin/variety";
const UPDATE_PRODUCT_API = "/api/vendor/products";

const api = axios.create({
  baseURL: API_HOST,
  timeout: 30000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      let token = await AsyncStorage.getItem("userToken");
      if (token) {
        token = token.replace(/^"|"$/g, "");
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn("Error reading token for request interceptor", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const unitOptions = ["kg", "pc", "ltr", "dozen"];

const getProductId = (product) => {
  if (!product) return null;
  return product.id ?? product._id ?? product.productId ?? null;
};

const normalizeUnitForDropdown = (unit) => {
  if (!unit) return "";
  const u = String(unit).toLowerCase();
  if (u === "piece" || u === "pieces") return "pc";
  if (u === "pc" || u === "pcs") return "pc";
  if (u === "kg" || u === "kilogram" || u === "kilograms") return "kg";
  if (u === "ltr" || u === "liter" || u === "litre") return "ltr";
  if (u === "dozen") return "dozen";
  return u; // fallback — if it's one of the options it will match, else it will show as text
};

const ProductEditModal = ({ visible, onClose, onUpdated, product }) => {
  // form fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState(""); // we store category as name (like AddProduct)
  const [unit, setUnit] = useState("");
  const [variety, setVariety] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [allIndiaDelivery, setAllIndiaDelivery] = useState(false);
  const [weightPerPiece, setWeightPerPiece] = useState("");

  // images
  const [existingImages, setExistingImages] = useState([]); // remote urls
  const [newImages, setNewImages] = useState([]); // local assets/uris

  const [loading, setLoading] = useState(false);

  // dropdown & data lists
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isVarietyDropdownOpen, setIsVarietyDropdownOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [allVarieties, setAllVarieties] = useState([]);
  const [varietyOptions, setVarietyOptions] = useState([]);
  const [varietyLoading, setVarietyLoading] = useState(false);

  // store original ids if provided (useful to map)
  const [initialCategoryId, setInitialCategoryId] = useState(null);
  const [initialVarietyId, setInitialVarietyId] = useState(null);

  useEffect(() => {
    fetchCategoriesAndVarieties();
  }, []);

  // populate form when product changes (basic initial fill)
  useEffect(() => {
    if (product) {
      setName(product.name ?? "");
      setPrice(product.price != null ? String(product.price) : "");
      setQuantity(product.quantity != null ? String(product.quantity) : "");
      // category: could be object, id or name. We'll try to set name; if id present we'll store id to map later.
      if (product.category) {
        if (typeof product.category === "object") {
          setCategory(product.category.name ?? "");
          setInitialCategoryId(product.category._id ?? product.category.id ?? null);
        } else {
          // string — could be name or id
          // we tentatively set the string, but also save as id to map after fetch
          setCategory(String(product.category));
          setInitialCategoryId(String(product.category));
        }
      } else {
        setCategory("");
        setInitialCategoryId(null);
      }

      // variety: could be object, id or name.
      if (product.variety) {
        if (typeof product.variety === "object") {
          setVariety(product.variety.name ?? "");
          setInitialVarietyId(product.variety._id ?? product.variety.id ?? null);
        } else {
          setVariety(String(product.variety));
          setInitialVarietyId(String(product.variety));
        }
      } else {
        setVariety("");
        setInitialVarietyId(null);
      }

      setUnit(normalizeUnitForDropdown(product.unit ?? ""));
      setDescription(product.description ?? "");
      setAllIndiaDelivery(Boolean(product.allIndiaDelivery));
      setWeightPerPiece(product.weightPerPiece ?? "");

      // normalize product.images to strings
      if (Array.isArray(product.images)) {
        const normalized = product.images
          .map((i) => {
            if (!i) return null;
            if (typeof i === "string") return i;
            if (typeof i === "object") return i.url ?? i.path ?? null;
            return String(i);
          })
          .filter(Boolean);
        setExistingImages(normalized);
      } else {
        setExistingImages([]);
      }
      setNewImages([]);
    } else {
      resetForm();
    }
  }, [product]);

  // Once categories/varieties are fetched, try to map initialCategoryId/initialVarietyId to names (if needed)
  useEffect(() => {
    if (categories.length > 0 && initialCategoryId) {
      // find by _id or name match
      const found = categories.find((c) => c._id === initialCategoryId || c.id === initialCategoryId || c.name === initialCategoryId || String(c._id) === String(initialCategoryId));
      if (found) {
        setCategory(found.name);
      }
    }
  }, [categories, initialCategoryId]);

  useEffect(() => {
    if (allVarieties.length > 0 && initialVarietyId) {
      const found = allVarieties.find((v) => v._id === initialVarietyId || v.id === initialVarietyId || v.name === initialVarietyId || String(v._id) === String(initialVarietyId));
      if (found) {
        setVariety(found.name);
      }
    }
  }, [allVarieties, initialVarietyId]);

  // when category changes -> update variety options
  useEffect(() => {
    if (!category) {
      setVarietyOptions(allVarieties.map((v) => v.name));
      // keep current variety if it exists in list, else reset
      if (!allVarieties.some((v) => v.name === variety)) setVariety("");
    } else {
      filterVarietiesForCategory(category);
    }
  }, [category, allVarieties]);

  const fetchCategoriesAndVarieties = async () => {
    setCategoriesLoading(true);
    setVarietyLoading(true);
    try {
      const [catRes, varRes] = await Promise.all([api.get(CATEGORY_API), api.get(VARIETY_API)]);
      // categories
      if (catRes.data && Array.isArray(catRes.data.categories)) setCategories(catRes.data.categories);
      else if (Array.isArray(catRes.data)) setCategories(catRes.data);
      else setCategories([]);

      // varieties
      if (varRes.data && Array.isArray(varRes.data.varieties)) {
        setAllVarieties(varRes.data.varieties);
        setVarietyOptions(varRes.data.varieties.map((v) => v.name));
      } else if (Array.isArray(varRes.data)) {
        setAllVarieties(varRes.data);
        setVarietyOptions(varRes.data.map((v) => v.name));
      } else {
        setAllVarieties([]);
        setVarietyOptions([]);
      }
    } catch (err) {
      console.error("fetchCategoriesAndVarieties error:", err);
      const status = err?.response?.status;
      if (status === 401) Alert.alert("Unauthorized", "Session expired. Please login again.");
      else if (status === 403) Alert.alert("Forbidden", "No permission to fetch categories/varieties.");
      else Alert.alert("Error", "Failed to load categories/varieties.");
      setCategories([]);
      setAllVarieties([]);
      setVarietyOptions([]);
    } finally {
      setCategoriesLoading(false);
      setVarietyLoading(false);
    }
  };

  const filterVarietiesForCategory = (selectedCategory) => {
    setVarietyLoading(true);
    try {
      const filtered = allVarieties.filter((v) => {
        if (!v || !v.category) return false;
        // v.category can be string id or object with name/_id
        if (typeof v.category === "string") {
          // match with selectedCategory either by name or id
          return v.category === selectedCategory || v.category === selectedCategory._id;
        } else if (typeof v.category === "object") {
          const catName = (v.category.name || "").toLowerCase();
          const catId = v.category._id ?? v.category.id;
          return (catName === selectedCategory.toLowerCase()) || (String(catId) === String(selectedCategory));
        }
        return false;
      });

      const names = filtered.length > 0 ? filtered.map((f) => f.name) : [];
      setVarietyOptions(names);
      // if the existing variety value is not in the new list, reset it (but keep if it exists)
      if (variety && !names.includes(variety)) {
        setVariety("");
      }
    } catch (err) {
      console.error("filterVarietiesForCategory error:", err);
      setVarietyOptions([]);
      setVariety("");
    } finally {
      setVarietyLoading(false);
    }
  };

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Permission to access gallery is required!");
        return;
      }

      const remaining = Math.max(0, 5 - (existingImages.length + newImages.length));
      if (remaining <= 0) {
        Alert.alert("Limit reached", "Maximum 5 images allowed.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.8,
      });

      const cancelled = result.canceled ?? result.cancelled ?? false;
      if (!cancelled) {
        const selected = result.assets || (result.selected ? result.selected : []);
        setNewImages((prev) => [...prev, ...selected.map((s) => s.uri || s)]);
      }
    } catch (err) {
      console.error("pickImages error:", err);
      Alert.alert("Error", "Failed to select images.");
    }
  };

  const removeExistingImage = (index) => setExistingImages((prev) => prev.filter((_, i) => i !== index));
  const removeNewImage = (index) => setNewImages((prev) => prev.filter((_, i) => i !== index));

  const validate = () => {
    if (!name.trim()) return Alert.alert("Error", "Please enter product name");
    if (!category.trim()) return Alert.alert("Error", "Please select category");
    if (!variety.trim()) return Alert.alert("Error", "Please select variety");
    if (!price.trim() || isNaN(price)) return Alert.alert("Error", "Please enter valid price");
    if (!quantity.trim() || isNaN(quantity)) return Alert.alert("Error", "Please enter valid quantity");
    if (!unit.trim()) return Alert.alert("Error", "Please select unit (kg/pc/ltr/dozen)");

    const normalizedUnit = unit.trim().toLowerCase();
    if (normalizedUnit === "pc" && !weightPerPiece.trim()) return Alert.alert("Error", "Please enter weight per piece for pc unit");

    if (existingImages.length + newImages.length === 0) return Alert.alert("Error", "Please add at least one image");

    return true;
  };

  const handleUpdate = async () => {
    if (!validate()) return;
    const prodId = getProductId(product);
    if (!prodId) {
      Alert.alert("Error", "Product id missing.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("category", category.trim());
      formData.append("variety", variety.trim());
      formData.append("unit", unit.trim());
      formData.append("price", parseFloat(price.trim()));
      formData.append("quantity", parseFloat(quantity.trim()));
      formData.append("description", description.trim() || "");
      formData.append("allIndiaDelivery", String(Boolean(allIndiaDelivery)));
      if ((unit || "").toLowerCase() === "pc" && weightPerPiece.trim()) {
        formData.append("weightPerPiece", weightPerPiece.trim());
      }

      // existingImages as JSON array (backend expected)
      formData.append("existingImages", JSON.stringify(existingImages));
      // If backend expects repeated fields instead:
      // existingImages.forEach(url => formData.append('existingImages', url));

      // append new images as files
      newImages.forEach((uri, idx) => {
        const fileUri = Platform.OS === "ios" ? uri.replace("file://", "") : uri;
        const filename = fileUri.split("/").pop() || `image_${idx}.jpg`;
        const fileType = filename.split(".").pop()?.toLowerCase() || "jpg";
        const mimeType = fileType === "jpg" || fileType === "jpeg" ? "image/jpeg" : fileType === "png" ? "image/png" : `image/${fileType}`;
        formData.append("images", {
          uri: Platform.OS === "android" ? uri : `file://${fileUri}`,
          name: filename,
          type: mimeType,
        });
      });

      const res = await api.put(`${UPDATE_PRODUCT_API}/${prodId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });

      if (res.data?.success) {
        Alert.alert("Success", "Product updated successfully!");
        if (onUpdated) onUpdated(res.data.data ?? res.data);
        if (onClose) onClose();
      } else {
        Alert.alert("Error", res.data?.message || "Update failed");
      }
    } catch (err) {
      console.error("Update product error:", err);
      const status = err?.response?.status;
      if (status === 401) Alert.alert("Session expired", "Please login again.");
      else if (status === 413) Alert.alert("Images too large", "Try smaller images or fewer images.");
      else if (err?.code === "ECONNABORTED") Alert.alert("Timeout", "Request timed out. Try again.");
      else Alert.alert("Error", err?.response?.data?.message || "Failed to update product.");
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
    setWeightPerPiece("");
    setExistingImages([]);
    setNewImages([]);
    setInitialCategoryId(null);
    setInitialVarietyId(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.header}>
              <Pressable onPress={() => !loading && onClose()}>
                <Ionicons name="arrow-back" size={24} color="#000" />
              </Pressable>
              <Text style={styles.headerText}>Edit Product</Text>
              <View style={{ width: 24 }} />
            </View>

            <Text style={styles.smallNote}>* marks important fields</Text>

            <Text style={styles.label}>Product Name *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g., Kashmiri Apples" editable={!loading} />

            <View style={styles.row}>
              <View style={{ flex: 1, position: "relative", marginRight: moderateScale(8) }}>
                <Text style={styles.label}>Category *</Text>
                <TouchableOpacity
                  style={[styles.input, styles.pickerInput]}
                  onPress={() => !categoriesLoading && setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  disabled={loading || categoriesLoading}
                >
                  <Text style={{ fontSize: normalizeFont(10), color: category ? "#000" : "#999" }}>
                    {category || "Select Category"}
                  </Text>
                  <Ionicons name={isCategoryDropdownOpen ? "chevron-up" : "chevron-down"} size={15} color="#333" />
                </TouchableOpacity>

                {isCategoryDropdownOpen && (
                  <View style={styles.dropdownBelowInput}>
                    {categoriesLoading ? (
                      <View style={styles.dropdownOption}><ActivityIndicator size="small" /></View>
                    ) : categories.length > 0 ? (
                      <ScrollView nestedScrollEnabled style={{ maxHeight: moderateScale(150) }}>
                        {categories.map((cat) => (
                          <TouchableOpacity
                            key={cat._id}
                            style={[styles.dropdownOption, category === cat.name && styles.dropdownOptionSelected]}
                            onPress={() => {
                              setCategory(cat.name);
                              setIsCategoryDropdownOpen(false);
                            }}
                          >
                            <Text style={{ fontSize: normalizeFont(10) }}>{cat.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    ) : (
                      <View style={styles.dropdownOption}><Text style={{ color: "#999" }}>No categories available</Text></View>
                    )}
                  </View>
                )}
              </View>

              <View style={{ flex: 1, position: "relative" }}>
                <Text style={styles.label}>Variety *</Text>
                <TouchableOpacity
                  style={[styles.input, styles.pickerInput]}
                  onPress={() => !varietyLoading && setIsVarietyDropdownOpen(!isVarietyDropdownOpen)}
                  disabled={loading || varietyLoading}
                >
                  <Text style={{ fontSize: normalizeFont(10), color: variety ? "#000" : "#999" }}>
                    {variety || (category ? "Select Variety" : "All Varieties")}
                  </Text>
                  <Ionicons name={isVarietyDropdownOpen ? "chevron-up" : "chevron-down"} size={15} color="#333" />
                </TouchableOpacity>

                {isVarietyDropdownOpen && (
                  <View style={styles.dropdownBelowInput}>
                    {varietyLoading ? (
                      <View style={styles.dropdownOption}><ActivityIndicator size="small" /></View>
                    ) : varietyOptions.length > 0 ? (
                      <ScrollView nestedScrollEnabled style={{ maxHeight: moderateScale(150) }}>
                        {varietyOptions.map((varName, idx) => (
                          <TouchableOpacity
                            key={`${varName}-${idx}`}
                            style={[styles.dropdownOption, variety === varName && styles.dropdownOptionSelected]}
                            onPress={() => {
                              setVariety(varName);
                              setIsVarietyDropdownOpen(false);
                            }}
                          >
                            <Text style={{ fontSize: normalizeFont(10) }}>{varName}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    ) : (
                      <View style={styles.dropdownOption}><Text style={{ color: "#999" }}>No varieties available</Text></View>
                    )}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Price (₹) *</Text>
                <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="eg.0" keyboardType="numeric" editable={!loading} />
              </View>

              <View style={styles.flex1}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} placeholder="eg.0" keyboardType="numeric" editable={!loading} />
              </View>

              <View style={{ flex: 1, position: "relative" }}>
                <Text style={styles.label}>Unit *</Text>
                <TouchableOpacity style={[styles.input, styles.pickerInput]} onPress={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)} disabled={loading}>
                  <Text style={{ fontSize: normalizeFont(10), color: unit ? "#000" : "#999" }}>{unit || "Select Unit"}</Text>
                  <Ionicons name={isUnitDropdownOpen ? "chevron-up" : "chevron-down"} size={15} color="#333" />
                </TouchableOpacity>

                {isUnitDropdownOpen && (
                  <View style={styles.dropdownBelowInput}>
                    {unitOptions.map((opt) => (
                      <TouchableOpacity key={opt} style={[styles.dropdownOption, unit === opt && styles.dropdownOptionSelected]} onPress={() => { setUnit(opt); setIsUnitDropdownOpen(false); }}>
                        <Text style={{ fontSize: normalizeFont(10) }}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {(unit || "").toLowerCase() === "pc" && (
              <View>
                <Text style={styles.label}>Weight Per Piece *</Text>
                <TextInput style={styles.input} value={weightPerPiece} onChangeText={setWeightPerPiece} placeholder="e.g., 400g or 0.4kg" editable={!loading} />
                <Text style={styles.helperText}>Enter weight of one piece (e.g., 400gm, 0.5kg)</Text>
              </View>
            )}

            <Text style={styles.label}>Images</Text>

            {/* Existing images */}
            {existingImages.length > 0 && (
              <ScrollView horizontal style={{ marginVertical: moderateScale(8) }}>
                {existingImages.map((url, idx) => (
                  <View key={`ex-${idx}`} style={styles.imagePreviewContainer}>
                    <Image source={{ uri: url }} style={styles.previewImage} />
                    {!loading && (
                      <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeExistingImage(idx)}>
                        <Ionicons name="close-circle" size={22} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}

            {/* New images */}
            {newImages.length > 0 && (
              <ScrollView horizontal style={{ marginVertical: moderateScale(8) }}>
                {newImages.map((uri, idx) => (
                  <View key={`new-${idx}`} style={styles.imagePreviewContainer}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    {!loading && (
                      <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeNewImage(idx)}>
                        <Ionicons name="close-circle" size={22} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                    <View style={{ position: "absolute", bottom: 4, left: 6, backgroundColor: "#00000060", paddingHorizontal: 6, borderRadius: 6 }}>
                      <Text style={{ color: "#fff", fontSize: normalizeFont(10) }}>New</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity style={[styles.imageUpload, (loading || existingImages.length + newImages.length >= 5) && styles.imageUploadDisabled]} onPress={pickImages} disabled={loading || existingImages.length + newImages.length >= 5}>
              <Ionicons name="folder-outline" size={28} color="#777" />
              <Text style={styles.imageUploadText}>{existingImages.length + newImages.length >= 5 ? "Maximum 5 images reached" : `Add photos (${existingImages.length + newImages.length}/5)`}</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, { height: moderateScale(80), textAlignVertical: "top" }]} value={description} onChangeText={setDescription} placeholder="Write product details here (optional)" multiline editable={!loading} />

            <View style={styles.checkboxRow}>
              <Checkbox value={allIndiaDelivery} onValueChange={setAllIndiaDelivery} disabled={loading} />
              <Text style={{ marginLeft: moderateScale(8), fontSize: normalizeFont(12) }}>All India Delivery</Text>
            </View>

            <View style={styles.submitContainer}>
              <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleUpdate} disabled={loading} activeOpacity={loading ? 1 : 0.7}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : (<>
                  <Feather name="check-circle" size={18} color="#fff" />
                  <Text style={styles.submitText}>Update Product</Text>
                </>)}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ProductEditModal;

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
    height: scale(54),
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
    borderWidth: 2,
    borderColor: "rgba(255, 202, 40, 1)",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
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

  dropdownBelowInput: {
    borderWidth: moderateScale(1),
    borderColor: "#22c55e",
    borderRadius: moderateScale(10),
    backgroundColor: "#fff",
    position: "absolute",
    top: moderateScale(66),
    left: 0,
    right: 0,
    zIndex: 1000,
    overflow: "hidden",
    maxHeight: moderateScale(200),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: Platform.OS === "ios" ? 0.1 : 0.15,
    shadowRadius: moderateScale(4),
    elevation: 10,
  },

  dropdownOption: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    borderBottomWidth: moderateScale(0.5),
    borderBottomColor: "#e8f5e9",
  },

  dropdownOptionSelected: {
    backgroundColor: "#f0f0f0",
  },

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
    gap: scale(5),
    alignContent: "center",
    marginTop: moderateScale(20),
    marginBottom: moderateScale(10),
    alignItems: "center",
  },

  submitBtnDisabled: {
    opacity: 0.6,
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

  imageUploadText: {
    marginTop: moderateScale(8),
    color: "#777",
    fontSize: normalizeFont(10),
  },

  imagePreviewContainer: {
    position: "relative",
    marginRight: moderateScale(8),
  },

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

  helperText: {
    fontSize: normalizeFont(10),
    color: "#777",
    marginBottom: moderateScale(4),
  },
});
