import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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

// ✅ Base URL
const API_BASE = 'https://viafarm-1.onrender.com';

const AddNewAddress = () => {
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    pincode: '',
    houseNumber: '',
    locality: '',
    city: '',
    district: '',
  });

  const [isDefaultAddress, setIsDefaultAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 📍 Get Current Location and Autofill Address
  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        setLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // 🔍 Reverse Geocode (convert lat/lng to address)
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (geocode && geocode.length > 0) {
        const addr = geocode[0];
        setFormData({
          houseNumber: addr.name || '',
          locality: addr.street || '',
          city: addr.city || addr.subregion || '',
          district: addr.district || addr.region || '',
          pincode: addr.postalCode || '',
        });
      } else {
        Alert.alert('Error', 'Unable to fetch address from location.');
      }
    } catch (error) {
      console.error('Location Error:', error);
      Alert.alert('Error', 'Failed to fetch current location.');
    } finally {
      setLocating(false);
    }
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

      const res = await axios.post(`${API_BASE}/api/buyer/addresses`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // console.log('Address Add Response:', res.data);

      if (res.data.success) {
        Alert.alert('Success', 'Address added successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Error', res.data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Add Address Error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add address');
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
        <Text style={styles.headerTitle}>Add New Address</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 📍 Use Current Location */}
        <View style={styles.locationBox}>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleUseCurrentLocation}
            disabled={locating}
          >
            <Ionicons name="location" size={20} color="#3b82f6" />
            <Text style={styles.locationText}>
              {locating ? 'Fetching location...' : 'Use Current Location'}
            </Text>
            {locating && <ActivityIndicator size="small" color="#3b82f6" style={{ marginLeft: 10 }} />}
          </TouchableOpacity>
        </View>

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
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// 💅 Styles
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
  locationBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#e8f0ff',
  },
  locationButton: { flexDirection: 'row', alignItems: 'center' },
  locationText: {
    marginLeft: 8,
    color: '#3b82f6',
    fontWeight: '600',
  },
});

export default AddNewAddress;
