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
import { moderateScale, normalizeFont, scale } from './Responsive';

// ✅ Base URL
const API_BASE = 'https://viafarm-1.onrender.com';

const AddNewAddress = () => {
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    pinCode: '',
    houseNumber: '',
    locality: '',
    city: '',
    district: '',
    state: '',
    latitude: 0,
    longitude: 0,
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

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;

      // 🔍 Reverse Geocode (convert lat/lng to address)
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (geocode && geocode.length > 0) {
        const addr = geocode[0];
        setFormData({
          houseNumber: addr.name || addr.street || '',
          locality: addr.street || addr.subregion || '',
          city: addr.city || addr.subregion || '',
          district: addr.district || addr.region || addr.county || '',
          state: addr.region || addr.state || '',
          pinCode: addr.postalCode || '',
          latitude: latitude,
          longitude: longitude,
        });
        Alert.alert('Success', 'Location fetched successfully!');
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
      // ✅ Validation with correct field names
      const requiredFields = ['pinCode', 'houseNumber', 'locality', 'city', 'district', 'state'];
      const missing = requiredFields.filter((f) => !formData[f] || !formData[f].trim());
      
      if (missing.length > 0) {
        Alert.alert('Error', `Please fill all required fields: ${missing.join(', ')}`);
        return;
      }

      setLoading(true);

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'User not logged in. Please login again.');
        navigation.replace('login');
        return;
      }

      // ✅ Exact payload format that API expects
      const payload = {
        pinCode: formData.pinCode.trim(),
        houseNumber: formData.houseNumber.trim(),
        locality: formData.locality.trim(),
        city: formData.city.trim(),
        district: formData.district.trim(),
        state: formData.state.trim(),
        isDefault: isDefaultAddress,
        // Send coordinates separately - backend will create location
        latitude: parseFloat(String(formData.latitude || 28.0)),
        longitude: parseFloat(String(formData.longitude || 77.0)),
      };

      // console.log('📤 Sending Address Payload:', payload);

      const res = await axios.post(
        `${API_BASE}/api/buyer/addresses`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      console.log('✅ Server Response:', res.data);

      if (res.data.success) {
        Alert.alert('Success', 'Address added successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', res.data.message || 'Failed to add address');
      }
    } catch (error) {
      console.error('❌ Add Address Error:', error);

      let errorMessage = 'Failed to add address. Please try again.';

      if (axios.isAxiosError(error)) {
        // Server error
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response?.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.response?.status === 400) {
          errorMessage = 'Invalid data. Please check all fields.';
        } else if (error.response?.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          await AsyncStorage.removeItem('userToken');
          navigation.replace('login');
          return;
        } else if (error.response?.status === 403) {
          errorMessage = 'You do not have permission to add addresses.';
        }

        console.error('Status:', error.response?.status);
        console.error('Response Data:', error.response?.data);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
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
        <Text allowFontScaling={false} style={styles.headerTitle}>Add New Address</Text>
        <View style={{ width: scale(24) }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 📍 Use Current Location */}
        <View style={styles.locationBox}>
          <TouchableOpacity
            style={[styles.locationButton, locating && styles.locationButtonDisabled]}
            onPress={handleUseCurrentLocation}
            disabled={locating}
          >
            <Ionicons name="location" size={20} color="#3b82f6" />
            <Text allowFontScaling={false} style={styles.locationText}>
              {locating ? 'Fetching location...' : 'Use Current Location'}
            </Text>
            {locating && <ActivityIndicator size="small" color="#3b82f6" style={{ marginLeft: moderateScale(10) }} />}
          </TouchableOpacity>
        </View>

        {/* Address Form */}
        <View style={styles.section}>
          <Text allowFontScaling={false} style={styles.sectionTitle}>Address Details *</Text>

          <TextInput
            style={styles.textInput}
            placeholder="Pin Code *"
            keyboardType="number-pad"
            value={formData.pinCode}
            onChangeText={(value) => handleInputChange('pinCode', value)}
            placeholderTextColor="#999"
            maxLength={6}
            editable={!loading}
            allowFontScaling={false}
          />

          <TextInput
            style={styles.textInput}
            placeholder="House Number / Block / Street *"
            value={formData.houseNumber}
            onChangeText={(value) => handleInputChange('houseNumber', value)}
            placeholderTextColor="#999"
            editable={!loading}
            allowFontScaling={false}
          />

          <TextInput
            style={styles.textInput}
            placeholder="Locality / Town *"
            value={formData.locality}
            onChangeText={(value) => handleInputChange('locality', value)}
            placeholderTextColor="#999"
            editable={!loading}
            allowFontScaling={false}
          />

          <View style={styles.row}>
            <TextInput
              style={[styles.textInput, styles.halfInput]}
              placeholder="City *"
              value={formData.city}
              onChangeText={(value) => handleInputChange('city', value)}
              placeholderTextColor="#999"
              editable={!loading}
              allowFontScaling={false}
            />
            <TextInput
              style={[styles.textInput, styles.halfInput]}
              placeholder="District *"
              value={formData.district}
              onChangeText={(value) => handleInputChange('district', value)}
              placeholderTextColor="#999"
              editable={!loading}
              allowFontScaling={false}
            />
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="State *"
            value={formData.state}
            onChangeText={(value) => handleInputChange('state', value)}
            placeholderTextColor="#999"
            editable={!loading}
            allowFontScaling={false}
          />

          <View style={styles.switchContainer}>
            <Switch
              value={isDefaultAddress}
              onValueChange={setIsDefaultAddress}
              trackColor={{ false: '#f0f0f0', true: '#3b82f6' }}
              thumbColor="#fff"
              disabled={loading}
            />
            <Text allowFontScaling={false} style={styles.switchLabel}>Make this my default address</Text>
          </View>
        </View>

        <View style={{ height: scale(100) }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={handleCancel}
          disabled={loading}
        >
          <Text allowFontScaling={false} style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
          ) : null}
          <Text allowFontScaling={false} style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Address'}
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
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: { padding: moderateScale(4) },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: normalizeFont(14), fontWeight: '600' },
  scrollView: { paddingHorizontal: moderateScale(16) },
  section: { marginTop: moderateScale(20) },
  sectionTitle: { fontSize: normalizeFont(13), fontWeight: '600', marginBottom: moderateScale(10) },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    fontSize: normalizeFont(12),
    marginBottom: moderateScale(10),
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { flex: 1, marginRight: moderateScale(8) },
  switchContainer: { flexDirection: 'row', alignItems: 'center', marginTop:moderateScale(10) },
  switchLabel: { marginLeft: moderateScale(8), fontSize: normalizeFont(12) },
  footer: {
    flexDirection: 'row',
    padding: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding:moderateScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  cancelButtonText: { color: '#555', fontWeight: '500' },
  saveButton: {
    flex: 1,
    backgroundColor: 'rgba(76, 175, 80, 1)',
    marginLeft: moderateScale(10),
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  locationBox: {
    marginTop: moderateScale(10),
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    backgroundColor: '#e8f0ff',
  },
  locationButton: { flexDirection: 'row', alignItems: 'center' },
  locationText: {
    marginLeft: moderateScale(8),
    color: '#3b82f6',
    fontSize:normalizeFont(12),
    fontWeight: '600',
  },
});

export default AddNewAddress;
