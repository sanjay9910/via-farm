import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const API_BASE = "https://393rb0pp-5000.inc1.devtunnels.ms";

const ProductCard = ({ item, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const menuButtonRef = useRef(null);

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

  const handleDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await axios.delete(`${API_BASE}/api/vendor/products/${item._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        Alert.alert('Success', 'Product deleted successfully');
        onDelete(item._id); // Remove product from list in parent
      } else {
        Alert.alert('Error', 'Failed to delete product');
      }
    } catch (error) {
      console.log("Delete error:", error);
      Alert.alert('Error', 'Something went wrong while deleting');
    } finally {
      setIsMenuOpen(false);
    }
  };

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: item.images?.[0] }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.details}>
        <View style={styles.header}>
          <Text style={styles.productName}>{item.name}</Text>
          <TouchableOpacity
            ref={menuButtonRef}
            style={styles.menuButton}
            onPress={handleMenuPress}
          >
            <Feather name="more-vertical" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Category</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{item.category}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Price</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>₹ {item.price}/{item.unit}</Text>
        </View>

        <Text style={styles.uploadDate}>
          Uploaded on {new Date(item.datePosted).toLocaleDateString()}
        </Text>

        <View style={styles.stockContainer}>
          <View style={[
            styles.stockBadge,
            item.status === 'In Stock' ? styles.inStock : styles.outOfStock
          ]}>
            <View style={[
              styles.stockDot,
              item.status === 'In Stock' ? styles.inStockDot : styles.outOfStockDot
            ]} />
            <Text style={[
              styles.stockText,
              item.status === 'In Stock' ? styles.inStockText : styles.outOfStockText
            ]}>
              {item.status}
            </Text>
            <Feather
              name="chevron-down"
              size={16}
              color={item.status === 'In Stock' ? '#22c55e' : '#ef4444'}
            />
          </View>
        </View>
      </View>

      <Modal
        visible={isMenuOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlayTransparent}
          activeOpacity={1}
          onPress={() => setIsMenuOpen(false)}
        >
          <View style={[
            styles.menuPopup,
            { position: 'absolute', top: menuPosition.y, left: menuPosition.x }
          ]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { setIsMenuOpen(false); console.log('Edit clicked'); }}
            >
              <Feather name="edit-2" size={18} color="#374151" />
              <Text style={styles.menuItemText}>Edit</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { setIsMenuOpen(false); console.log('Hide clicked'); }}
            >
              <Feather name="eye-off" size={18} color="#374151" />
              <Text style={styles.menuItemText}>Hide</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDelete} // DELETE WORKING
            >
              <Feather name="trash-2" size={18} color="#ef4444" />
              <Text style={[styles.menuItemText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
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

  const handleDeleteFromList = (id) => {
    setProducts((prev) => prev.filter((item) => item._id !== id));
  };

  React.useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <ProductCard item={item} onDelete={handleDeleteFromList} />
      )}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default ProductList;

// ---- STYLES ----
const styles = StyleSheet.create({
  listContainer: { padding: 16, gap: 16 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, borderWidth: 2, borderColor: '#fbbf24', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  image: { width: 150, height: '100%', minHeight: 180 },
  details: { flex: 1, padding: 16, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  productName: { fontSize: 20, fontWeight: '700', color: '#1f2937', flex: 1, marginRight: 8 },
  menuButton: { padding: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 14, color: '#6b7280', width: 80 },
  colon: { fontSize: 14, color: '#6b7280', marginHorizontal: 8 },
  value: { fontSize: 14, color: '#374151', fontWeight: '500', flex: 1 },
  uploadDate: { fontSize: 13, color: '#9ca3af', marginTop: 4, marginBottom: 12 },
  stockContainer: { flexDirection: 'row', alignItems: 'center' },
  stockBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, gap: 6 },
  inStock: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  outOfStock: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  inStockDot: { backgroundColor: '#22c55e' },
  outOfStockDot: { backgroundColor: '#ef4444' },
  stockText: { fontSize: 14, fontWeight: '500' },
  inStockText: { color: '#22c55e' },
  outOfStockText: { color: '#ef4444' },
  modalOverlayTransparent: { flex: 1, backgroundColor: 'transparent' },
  menuPopup: { 
  backgroundColor: '#fff',
  borderRadius: 6,
  minWidth: 100, 
 paddingVertical: 8,
 shadowColor: '#000',
 shadowOffset: { width: 0, height: 4 },
 shadowOpacity: 0.2, shadowRadius: 12,
 elevation: 10,
 borderWidth: 1,
 borderColor: 'rgba(255, 202, 40, 1)',
 marginLeft:60,
 marginTop:-26,
},
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 6, gap: 12 },
  menuItemText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  deleteText: { color: '#ef4444' },
  menuDivider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 8 },
});
