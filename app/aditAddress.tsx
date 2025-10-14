import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE = 'https://393rb0pp-5000.inc1.devtunnels.ms';

const EditAddress = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Address passed from previous screen
  const { address } = route.params;

  const [formData, setFormData] = useState({
    pincode: '',
    houseNumber: '',
    locality: '',
    city: '',
    district: '',
  });

  const [isDefaultAddress, setIsDefaultAddress] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  if (address) {
    setFormData({
      pincode: address.pincode || '',
      houseNumber: address.houseNumber || '',
      locality: address.locality || '',
      city: address.city || '',
      district: address.district || '',
    });
    setIsDefaultAddress(address.isDefault || false);
  }
}, [address]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const requiredFields = ['pincode', 'houseNumber', 'locality', 'city', 'district'];
      const missing = requiredFields.filter((f) => !formData[f]);
      if (missing.length > 0) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      setLoading(true);

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      const payload = {
        pinCode: formData.pincode,
        houseNumber: formData.houseNumber,
        locality: formData.locality,
        city: formData.city,
        district: formData.district,
        isDefault: isDefaultAddress,
      };

      // 🔹 Dynamic endpoint using address.id
      const res = await axios.put(`${API_BASE}/api/buyer/addresses/${address.id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.data.success) {
        Alert.alert('Success', 'Address updated successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Error', res.data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Edit Address Error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update address');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigation.goBack();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Address</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Address Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Details</Text>

          <TextInput
            style={styles.textInput}
            placeholder="Pin Code"
            keyboardType="number-pad"
            value={formData.pincode}
            onChangeText={(value) => handleInputChange('pincode', value)}
            placeholderTextColor="#999"
            maxLength={6}
          />

          <TextInput
            style={styles.textInput}
            placeholder="House Number / Block / Street"
            value={formData.houseNumber}
            onChangeText={(value) => handleInputChange('houseNumber', value)}
            placeholderTextColor="#999"
          />

          <TextInput
            style={styles.textInput}
            placeholder="Locality / Town"
            value={formData.locality}
            onChangeText={(value) => handleInputChange('locality', value)}
            placeholderTextColor="#999"
          />

          <View style={styles.row}>
            <TextInput
              style={[styles.textInput, styles.halfInput]}
              placeholder="City"
              value={formData.city}
              onChangeText={(value) => handleInputChange('city', value)}
              placeholderTextColor="#999"
            />
            <TextInput
              style={[styles.textInput, styles.halfInput]}
              placeholder="District"
              value={formData.district}
              onChangeText={(value) => handleInputChange('district', value)}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.switchContainer}>
            <Switch
              value={isDefaultAddress}
              onValueChange={setIsDefaultAddress}
              trackColor={{ false: '#f0f0f0', true: '#3b82f6' }}
              thumbColor="#fff"
            />
            <Text style={styles.switchLabel}>Make this my default address</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Update'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// 💅 Styles (same as AddNewAddress)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  scrollView: { paddingHorizontal: 16 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { flex: 1, marginRight: 8 },
  switchContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  switchLabel: { marginLeft: 8, fontSize: 14 },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: { color: '#555', fontWeight: '500' },
  saveButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    marginLeft: 10,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});

export default EditAddress;
