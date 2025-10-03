import { Feather, Ionicons } from '@expo/vector-icons';
import Checkbox from "expo-checkbox";
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const AddProduct = () => {
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

  const handleSubmit = () => {
    const newProduct = {
      name,
      category,
      unit,
      variety,
      price,
      quantity,
      description,
      allIndiaDelivery,
      images,
    };
    console.log('New Product:', newProduct);
    // YAHA APNA API CALL LAGAO
    setModalVisible(false);
    // Reset form
    resetForm();
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

      {/* Product Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <Pressable onPress={() => setModalVisible(false)}>
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
                placeholder="Product Name" 
              />

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Text style={styles.label}>Category *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={category} 
                    onChangeText={setCategory} 
                    placeholder="Fruit / Vegetable" 
                  />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.label}>Variety *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={variety} 
                    onChangeText={setVariety} 
                    placeholder="Variety name" 
                  />
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
                  <TextInput 
                    style={styles.input} 
                    value={unit} 
                    onChangeText={setUnit} 
                    placeholder="piece / kg / dozen" 
                  />
                </View>
              </View>

              {/* Image Upload */}
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

              <View style={styles.submitContainer}>
                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                  <Feather name="check-circle" size={20} color="#fff" />
                  <Text style={styles.submitText}>Add Product</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#22c55e',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  // Modal Styles
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
  submitContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignContent: 'center',
  },
  submitBtn: { 
    backgroundColor: '#22c55e',
    width: '70%',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
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