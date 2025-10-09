import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { router, useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal, Platform, ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');
const API_BASE = 'https://393rb0pp-5000.inc1.devtunnels.ms';

// ---------------- EditProfileModal ----------------
const EditProfileModal = ({ visible, onClose, initialData, onUpdate }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [mobileNumber, setMobileNumber] = useState(initialData?.phone || '');
  const [upiId, setUpiId] = useState(initialData?.upiId || '');
  const [profileImageUri, setProfileImageUri] = useState(initialData?.image || null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access gallery is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setProfileImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!name || !mobileNumber || !upiId) {
      Alert.alert('Error', 'Please fill all required fields.');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'User not authenticated.');
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append('name', name);
      formData.append('mobileNumber', mobileNumber);
      formData.append('upiId', upiId);

      if (profileImageUri) {
        const filename = profileImageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('profilePicture', {
          uri: Platform.OS === 'android' ? profileImageUri : profileImageUri.replace('file://', ''),
          name: filename,
          type,
        } as any);
      }

      const response = await axios.put(`${API_BASE}/api/vendor/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        onUpdate({
          name: response.data.data.name,
          mobileNumber: response.data.data.mobileNumber,
          upiId: response.data.data.upiId,
          profileImageUri: response.data.data.profilePicture,
        });
        Alert.alert('Success', 'Profile updated successfully!');
        onClose();
      } else {
        Alert.alert('Error', response.data.message || 'Something went wrong!');
      }
    } catch (error) {
      console.log('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={modalStyles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={modalStyles.modalContainer} onStartShouldSetResponder={() => true}>
          <View style={modalStyles.header}>
            <TouchableOpacity onPress={onClose} style={modalStyles.headerIcon}>
              <Text style={modalStyles.iconText}>←</Text>
            </TouchableOpacity>
            <Text style={modalStyles.headerTitle}>Edit Details</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={modalStyles.scrollViewContent}>
            <Text style={modalStyles.smallText}>* marks important fields</Text>

            <View style={modalStyles.labelContainer}>
              <Text style={modalStyles.label}>Profile Picture</Text>
              <TouchableOpacity style={modalStyles.profileUploadBox} onPress={pickImage}>
                {profileImageUri ? (
                  <Image source={{ uri: profileImageUri }} style={modalStyles.uploadedImage} />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={30} color="#ccc" />
                    <Text style={modalStyles.chooseFileText}>Choose a file</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={modalStyles.labelContainer}>
              <Text style={modalStyles.label}>Name *</Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="Your Name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={modalStyles.labelContainer}>
              <Text style={modalStyles.label}>Mobile No. *</Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="9999999999"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                maxLength={10}
                value={mobileNumber}
                onChangeText={setMobileNumber}
              />
            </View>

            <View style={modalStyles.labelContainer}>
              <Text style={modalStyles.label}>UPI ID *</Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="e.g. yourname@bank"
                placeholderTextColor="#999"
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
              />
            </View>
          </ScrollView>

          <TouchableOpacity style={modalStyles.updateButton} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" style={{ marginRight: 8 }} /> : <Ionicons name="reload-outline" size={20} color="#fff" style={{ marginRight: 8 }} />}
            <Text style={modalStyles.updateButtonText}>{loading ? 'Updating...' : 'Update Details'}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ---------------- EditLocationModal ----------------
const EditLocationModal = ({ visible, onClose, onSubmit, initialData }) => {
  const [pinCode, setPinCode] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [street, setStreet] = useState('');
  const [loading, setLoading] = useState(false);

  // 🧠 Pre-fill existing address data when modal opens
  useEffect(() => {
    if (visible && initialData) {
      setPinCode(initialData.pinCode || '');
      setHouseNumber(initialData.houseNumber || '');
      setLocality(initialData.locality || '');
      setCity(initialData.city || '');
      setDistrict(initialData.district || '');
      setState(initialData.state || '');
      setStreet(initialData.street || '');
    }
  }, [visible, initialData]);

  const handleSubmit = async () => {
    if (!pinCode || !houseNumber || !locality || !city || !district) {
      Alert.alert('Error', 'Please fill all required fields.');
      return;
    }
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'User not authenticated.');
        setLoading(false);
        return;
      }

      const body = {
        street: street || houseNumber,
        city,
        state,
        zip: pinCode,
        pinCode,
        houseNumber,
        locality,
        district,
      };

      const response = await axios.put(`${API_BASE}/api/vendor/update-location`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        Alert.alert('Success', 'Location updated successfully!');
        onSubmit(response.data.address);
        onClose();
      } else {
        Alert.alert('Error', response.data.message || 'Something went wrong!');
      }
    } catch (error) {
      console.log('Location update error:', error);
      Alert.alert('Error', 'Failed to update location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
<Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={modalStyles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={modalStyles.modalContainer} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={modalStyles.header}>
            <TouchableOpacity onPress={onClose} style={modalStyles.headerIcon}>
              <Text style={modalStyles.iconText}>←</Text>
            </TouchableOpacity>
            <Text style={modalStyles.headerTitle}>Edit Location</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Content */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={modalStyles.scrollViewContent}>
            <Text style={[modalStyles.smallText, { marginTop: 0 }]}>Address</Text>

            {/* Use Current Location & Search Location */}
            <View style={modalStyles.addressActionRow}>
              <TouchableOpacity
                style={modalStyles.addressAction}
                onPress={() => Alert.alert('Location', 'Fetching current location...')}
              >
                <Ionicons name="locate-outline" size={18} color="#007AFF" />
                <Text style={modalStyles.addressActionText}>Use my current location</Text>
              </TouchableOpacity>
            </View>

            {/* Street */}
            <Text style={modalStyles.label}>Street</Text>
            <TextInput
              style={[modalStyles.textInput, { marginBottom: 15, marginTop: 0 }]}
              placeholder="Street (optional)"
              placeholderTextColor="#999"
              value={street}
              onChangeText={setStreet}
            />

            {/* House number/Block/Street */}
            <Text style={modalStyles.label}>House number/Block/Street *</Text>
            <TextInput
              style={[modalStyles.textInput, { marginBottom: 15, marginTop: 0 }]}
              placeholder="House number/Block/Street *"
              placeholderTextColor="#999"
              value={houseNumber}
              onChangeText={setHouseNumber}
            />

            {/* Locality/Town */}
            <Text style={modalStyles.label}>Locality/Town *</Text>
            <TextInput
              style={[modalStyles.textInput, { marginBottom: 15, marginTop: 0 }]}
              placeholder="Locality/Town *"
              placeholderTextColor="#999"
              value={locality}
              onChangeText={setLocality}
            />

            {/* City */}
            <Text style={modalStyles.label}>City *</Text>
            <TextInput
              style={[modalStyles.textInput, { marginBottom: 15, marginTop: 0 }]}
              placeholder="City *"
              placeholderTextColor="#999"
              value={city}
              onChangeText={setCity}
            />

            {/* District */}
            <Text style={modalStyles.label}>District *</Text>
            <TextInput
              style={[modalStyles.textInput, { marginBottom: 15, marginTop: 0 }]}
              placeholder="District *"
              placeholderTextColor="#999"
              value={district}
              onChangeText={setDistrict}
            />

            {/* State */}
            <Text style={modalStyles.label}>State</Text>
            <TextInput
              style={[modalStyles.textInput, { marginBottom: 15, marginTop: 0 }]}
              placeholder="State"
              placeholderTextColor="#999"
              value={state}
              onChangeText={setState}
            />

            {/* Pin Code */}
            <Text style={modalStyles.label}>Pin Code *</Text>
            <TextInput
              style={[modalStyles.textInput, { marginBottom: 20, marginTop: 0 }]}
              placeholder="Pin Code *"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={pinCode}
              onChangeText={setPinCode}
            />
          </ScrollView>

          {/* Submit Button */}
          <TouchableOpacity style={modalStyles.updateButton} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="reload-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            )}
            <Text style={modalStyles.updateButtonText}>
              {loading ? 'Updating...' : 'Update Details'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};
// ---------------- VendorProfile ----------------
const VendorProfile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editLocationModalVisible, setEditLocationModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const navigation = useNavigation();

  const getAvatarLetter = (name) => (name && name.length > 0 ? name.charAt(0).toUpperCase() : 'U');

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const res = await axios.get(`${API_BASE}/api/vendor/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const user = res.data.user;
        setUserInfo({
          name: user.name,
          phone: user.mobileNumber,
          upiId: user.upiId,
          image: user.profilePicture,
        });
      }
    } catch (error) {
      console.log('Error fetching profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileUpdate = (updatedData) => {
    setUserInfo((prev) => ({
      ...prev,
      name: updatedData.name,
      phone: updatedData.mobileNumber,
      upiId: updatedData.upiId,
      image: updatedData.profileImageUri || prev.image,
    }));
  };

  const ProfileMenuItem = ({ icon, title, subtitle, onPress }) => (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={25} color="#666" />
        </View>
        <View style={styles.menuItemText}>
          <Text style={styles.menuItemTitle}>{title}</Text>
          <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {userInfo?.image ? (
                <Image source={{ uri: userInfo.image }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{getAvatarLetter(userInfo?.name)}</Text>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userInfo?.name}</Text>
              <Text style={styles.userPhone}>+91 {userInfo?.phone}</Text>
              <Text style={styles.userRole}>{userInfo?.upiId}</Text>
            </View>
            <TouchableOpacity style={styles.editButtonContainer} onPress={() => setEditProfileModalVisible(true)}>
              <Image source={require("../../assets/via-farm-img/icons/editicon.png")} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.menuSection}>
          <ProfileMenuItem icon="location-outline" title="My Location" subtitle="Add/Edit your location" onPress={() => setEditLocationModalVisible(true)} />
          <ProfileMenuItem icon="pricetag-outline" title="My Coupons" subtitle="Your available discount coupons" onPress={() => navigation.navigate("MyCoupons")} />
          <ProfileMenuItem icon="language" title="Language" subtitle="Select your preferred language" onPress={() => navigation.navigate("Language")} />
          <ProfileMenuItem icon="headset-outline" title="Customer Support" subtitle="We are happy to assist you!" onPress={() => navigation.navigate("CustomerSupport")} />
          <ProfileMenuItem icon="shield-checkmark-outline" title="Terms & Conditions" subtitle="We care about your safety" onPress={() => navigation.navigate("Privacy&Policy")} />
          <ProfileMenuItem icon="information-circle-outline" title="About Us" subtitle="Get to know about us" onPress={() => navigation.navigate("AboutUs")} />
          <ProfileMenuItem icon="star-outline" title="Rate Us" subtitle="Rate your experience on Play Store" onPress={() => navigation.navigate("RateUs")} />
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userData');
              router.replace('/login');
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {userInfo && (
        <EditProfileModal
          visible={editProfileModalVisible}
          onClose={() => setEditProfileModalVisible(false)}
          initialData={userInfo}
          onUpdate={handleProfileUpdate}
        />
      )}

      <EditLocationModal
  visible={editLocationModalVisible}
  onClose={() => setEditLocationModalVisible(false)}
  initialData={userInfo?.address} // <-- pass saved address
  onSubmit={(updatedAddress) => {
    console.log('Updated address:', updatedAddress);
    Alert.alert('Success', 'Address updated successfully!');
  }}
/>
    </SafeAreaView>
  );
};

export default VendorProfile;

// ---------------- Styles ----------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  profileSection: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 20, marginBottom: 10, borderRadius: 12, padding: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFB4A2', justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 60, height: 60, borderRadius: 30 },
  avatarText: { fontSize: 24, fontWeight: '600', color: '#fff' },
  userInfo: { flex: 1, marginLeft: 15 },
  userName: { fontSize: 18, fontWeight: '600', color: '#333' },
  userPhone: { fontSize: 14, color: '#666' },
  userRole: { fontSize: 12, color: '#4CAF50', fontWeight: '500', marginTop: 2 },
  editButtonContainer: { padding: 8 },
  menuSection: { backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 5, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 } },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { width: 45, height: 45, borderRadius: 50, backgroundColor: 'rgba(141, 110, 99, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: 'rgba(141, 110, 99, 0.2)' },
  menuItemText: { flex: 1 },
  menuItemTitle: { fontSize: 16, fontWeight: '500', color: '#333' },
  menuItemSubtitle: { fontSize: 13, color: '#666' },
  logoutSection: { paddingHorizontal: 16, paddingVertical: 20, marginBottom: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  logoutButton: { backgroundColor: '#4CAF50', flexDirection: 'row', width: '70%', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3 },
  logoutIcon: { marginRight: 8 },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

const modalStyles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(162, 153, 153, 0.7)', justifyContent: 'flex-end' },
  modalContainer: { 
    width: '100%', 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    borderWidth: 2, 
    borderColor: 'rgba(255, 202, 40, 0.2)', 
    maxHeight: height - 80, 
    paddingBottom: 15 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#ddd' 
  },
  headerIcon: { width: 40, justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 22, color: '#4CAF50', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  scrollViewContent: { paddingVertical: 15, paddingHorizontal: 20 },
  smallText: { fontSize: 12, color: '#999', marginBottom: 10 },

  labelContainer: { marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 5 },

  textInput: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    paddingVertical: 12, 
    color: '#333', 
    fontSize: 14, 
    backgroundColor: '#f9f9f9' 
  },

  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { flex: 0.48 },

  addressActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  addressAction: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e6f0ff', padding: 10, borderRadius: 12 },
  addressActionText: { fontSize: 13, color: '#007AFF', marginLeft: 6 },

  updateButton: { 
    backgroundColor: '#4CAF50', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 15, 
    borderRadius: 12, 
    marginHorizontal: 20, 
    marginBottom: 10 
  },
  updateButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    profileUploadBox: { borderWidth: 1, borderColor: '#ccc', borderRadius: 12, height: 150, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  uploadedImage: { width: '100%', height: '100%', borderRadius: 8 },
});
