import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Checkbox from "expo-checkbox";
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from "react";
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
  View
} from "react-native";

const BASE_URL = "https://393rb0pp-5000.inc1.devtunnels.ms";

const ProductModal = ({ visible, onClose, onSubmit, product }) => {
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

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setPrice(product.price?.toString() || "");
      setQuantity(product.quantity?.toString() || "");
      setCategory(product.category || "Fruit");
      setUnit(product.unit || "piece");
      setVariety(product.variety || "");
      setDescription(product.description || "");
      setAllIndiaDelivery(product.allIndiaDelivery || false);
      setImages(product.images || []);
    }
  }, [product]);

  // Pick images from gallery (local URIs)
  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission denied to access gallery!');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5 - images.length,
        quality: 0.5,
      });

      if (!result.canceled) {
        let selected = result.assets || [];
        setImages(prev => [...prev, ...selected.map(img => img.uri)]);
      }
    } catch (err) {
      console.log(err);
      alert('Failed to select images.');
    }
  };

  // Update product API call
  const handleUpdateProduct = async () => {
    if (!product || !product._id) {
      alert("Product ID missing. Cannot update.");
      return;
    }

    if (!name || !category || !unit || !variety || !price || !quantity) {
      alert("Please fill all mandatory fields!");
      return;
    }

    setLoading(true);
    try {
      // Get token saved after login
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        alert("User not authorized. Please login again.");
        return;
      }

      const updatedProduct = {
        name,
        category,
        unit,
        variety,
        price: Number(price),
        quantity: Number(quantity),
        description,
        allIndiaDelivery,
        images, // Make sure these are valid URLs; for local files, you need to upload first
      };

      const response = await axios.put(
        `${BASE_URL}/api/vendor/products/${product._id}`,
        updatedProduct,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Product updated successfully");
        onSubmit(response.data.data); // send updated product back
        onClose();
      } else {
        Alert.alert("Error", response.data.message || "Failed to update product");
      }
    } catch (error) {
      console.log("Update product error:", error.response || error.message);
      Alert.alert("Error", "Something went wrong while updating the product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Pressable onPress={onClose}>
                <Ionicons name="arrow-back" size={24} color="#000" />
              </Pressable>
              <Text style={styles.headerText}>Update Product Details</Text>
              <View style={{ width: 24 }} />
            </View>

            <Text style={styles.smallNote}>* marks important fields</Text>

            <Text style={styles.label}>Product Name *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Product Name" />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Category *</Text>
                <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Fruit / Vegetable" />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>Variety *</Text>
                <TextInput style={styles.input} value={variety} onChangeText={setVariety} placeholder="Variety name" />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Price *</Text>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="200"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="1"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>Unit *</Text>
                <TextInput style={styles.input} value={unit} onChangeText={setUnit} placeholder="piece / kg / dozen" />
              </View>
            </View>

            <Text style={styles.label}>Add Images *</Text>
            <TouchableOpacity style={styles.imageUpload} onPress={pickImages}>
              <Ionicons name="folder-outline" size={32} color="#777" />
              <Text style={styles.imageUploadText}>Add photos of your product (max 5)</Text>
            </TouchableOpacity>

            <ScrollView horizontal style={{ marginVertical: 8 }}>
              {images.map((img, idx) => (
                <Image key={idx} source={{ uri: img }} style={styles.previewImage} />
              ))}
            </ScrollView>

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Write product details here"
              multiline
            />

            <View style={styles.checkboxRow}>
              <Checkbox value={allIndiaDelivery} onValueChange={setAllIndiaDelivery} />
              <Text style={{ marginLeft: 8 }}>All India Delivery</Text>
            </View>

            <View style={styles.updateDetails}>
              <TouchableOpacity style={styles.submitBtn} onPress={handleUpdateProduct} disabled={loading}>
                {loading && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
                <Image source={require('../../assets/via-farm-img/icons/updateDetails.png')} />
                <Text style={styles.submitText}>Update Details</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ProductModal;

const styles = StyleSheet.create({
  overlay: { 
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end'
  },
  modalContainer: { 
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16
  },
  header: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  headerText: { 
    fontSize: 18,
    fontWeight: '600',
    color: '#000'
  },
  smallNote: { 
    fontSize: 12,
    color: '#777',
    marginBottom: 10
  },
  label: { 
    fontSize: 14,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 4,
    color: '#333'
  },
  input: { 
    borderWidth: 1,
    borderColor: '#f0c96a',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 8
  },
  row: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  flex1: { 
    flex: 1,
    marginRight: 8
  },
  checkboxRow: { 
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12
  },
  updateDetails:{
   flexDirection:'row',
   justifyContent:'center',
   alignContent:'center',
  },
  submitBtn: { 
    backgroundColor: 'rgba(76, 175, 80, 1)',
    width:'70%',
    borderRadius:10,
    paddingVertical: 14,
    flexDirection:'row',
    justifyContent:'center',
    alignContent:'center',
    gap:5,
    marginTop: 20,
    alignItems: 'center'
  },
  submitText: { 
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  imageUpload: { 
    borderWidth: 1,
    borderColor: '#f0c96a',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4
  },
  imageUploadText: { 
    fontSize: 12,
    color: '#777',
    marginTop: 4,
    textAlign: 'center'
  },
  previewImage: { 
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8
  },
});
