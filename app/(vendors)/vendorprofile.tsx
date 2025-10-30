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
  Modal,
  Platform,
  ScrollView,
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

// ---------------- EditLocationModal (Updated Design) ----------------


const EditLocationModal = ({ visible, onClose, onSubmit, initialData }) => {
  const [pinCode, setPinCode] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [deliveryRadius, setDeliveryRadius] = useState(""); // numeric input only
  const [loading, setLoading] = useState(false);

  // ✅ Prefill values when editing
  useEffect(() => {
    if (visible && initialData) {
      setPinCode(initialData.pinCode || "");
      setHouseNumber(initialData.houseNumber || "");
      setLocality(initialData.locality || "");
      setCity(initialData.city || "");
      setDistrict(initialData.district || "");
      setDeliveryRadius(
        String(initialData.deliveryRadius || "").replace("km", "")
      );
      setLatitude(initialData.latitude || null);
      setLongitude(initialData.longitude || null);
    }
  }, [visible, initialData]);

  // 🧭 Optional: Use device location (future use)
  const handleUseCurrentLocation = () => {
    Alert.alert("Location", "Fetching current location feature coming soon...");
  };

  // 🔍 Optional: Search location (future use)
  const handleSearchLocation = () => {
    Alert.alert("Search", "Search location feature coming soon...");
  };

  // ✅ Final Submit
  const handleSubmit = async () => {
    if (!pinCode || !houseNumber || !locality || !city || !district) {
      Alert.alert("Error", "Please fill all required address fields.");
      return;
    }

    // Validate radius
    const radiusInt = parseInt(deliveryRadius, 10);
    if (isNaN(radiusInt) || radiusInt < 0 || radiusInt > 10000) {
      Alert.alert(
        "Error",
        "Delivery radius must be a valid number between 0 and 10,000."
      );
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "User not authenticated.");
        setLoading(false);
        return;
      }

      // ✅ Properly formatted body for API
      const body = {
        pinCode,
        houseNumber,
        locality,
        city,
        district,
        latitude: latitude || 0,
        longitude: longitude || 0,
        deliveryRegion: `${radiusInt}km`,
      };

      console.log("Sending Location Update Body:", body);

      const response = await axios.put(
        `${API_BASE}/api/vendor/update-location`,
        body,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Location updated successfully!");

        // Pass updated location data to parent component
        onSubmit(response.data.data);
        onClose();
      } else {
        Alert.alert("Error", response.data.message || "Something went wrong!");
      }
    } catch (error) {
      console.log("Location update error:", error);

      let errorMessage = "Failed to update location. Please try again later.";

      if (error.response) {
        console.log("Server Response:", error.response.data);
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage =
            "Invalid data submitted. Please check pin code and delivery radius.";
        }
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };



  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <TouchableOpacity
        style={modalStyles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={modalStyles.modalContainer} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={modalStyles.header}>
            <TouchableOpacity onPress={onClose} style={modalStyles.headerIcon}>
              <Text style={modalStyles.iconText}>←</Text>
            </TouchableOpacity>
            <Text style={modalStyles.headerTitle}>Edit Location & Charges</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Scrollable Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={modalStyles.scrollViewContent}
          >
            <Text style={modalStyles.sectionTitle}>Your Address</Text>

            {/* Location Actions */}
            <TouchableOpacity
              style={modalStyles.locationButton}
              onPress={handleUseCurrentLocation}
            >
              <Ionicons name="locate" size={18} color="#00B0FF" />
              <Text style={modalStyles.locationButtonText}>Use my current location</Text>
              <Ionicons name="chevron-forward" size={16} color="#00B0FF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={modalStyles.locationButton}
              onPress={handleSearchLocation}
            >
              <Ionicons name="search" size={18} color="#00B0FF" />
              <Text style={modalStyles.locationButtonText}>Search Location</Text>
              <Ionicons name="chevron-forward" size={16} color="#00B0FF" />
            </TouchableOpacity>

            {/* Address Inputs */}
            <TextInput
              style={modalStyles.textInput}
              placeholder="Pin Code *"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={6}
              value={pinCode}
              onChangeText={setPinCode}
            />

            <TextInput
              style={modalStyles.textInput}
              placeholder="House number/Block/Street *"
              placeholderTextColor="#999"
              value={houseNumber}
              onChangeText={setHouseNumber}
            />

            <TextInput
              style={modalStyles.textInput}
              placeholder="Locality/Town *"
              placeholderTextColor="#999"
              value={locality}
              onChangeText={setLocality}
            />

            <View style={modalStyles.row}>
              <TextInput
                style={[modalStyles.textInput, modalStyles.halfInput]}
                placeholder="City *"
                placeholderTextColor="#999"
                value={city}
                onChangeText={setCity}
              />
              <TextInput
                style={[modalStyles.textInput, modalStyles.halfInput]}
                placeholder="District *"
                placeholderTextColor="#999"
                value={district}
                onChangeText={setDistrict}
              />
            </View>

            {/* Delivery Region */}
            <Text style={modalStyles.sectionTitle}>Delivery Region</Text>
            <View style={modalStyles.deliveryRow}>
              <Text style={modalStyles.uptoText}>Upto</Text>
              <TextInput
                style={modalStyles.deliveryInput}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={deliveryRadius}
                onChangeText={setDeliveryRadius}
              />
              <Text style={modalStyles.kmsText}>kms</Text>
            </View>
          </ScrollView>

          {/* Submit */}
          <TouchableOpacity
            style={modalStyles.updateButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="reload-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            )}
            <Text style={modalStyles.updateButtonText}>
              {loading ? "Updating..." : "Update Details"}
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
          status:user.status,
          phone: user.mobileNumber,
          upiId: user.upiId,
          image: user.profilePicture,
          address: user.address || {},
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

  const handleLocationUpdate = (updatedAddress) => {
    setUserInfo((prev) => ({
      ...prev,
      address: updatedAddress,
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
              <Text style={styles.userRole}>{userInfo?.status}</Text>
            </View>
            <TouchableOpacity 
              style={styles.editButtonContainer} 
              onPress={() => setEditProfileModalVisible(true)}
            >
              <Image source={require("../../assets/via-farm-img/icons/editicon.png")} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.menuSection}>
          <ProfileMenuItem 
            icon="location-outline" 
            title="Manage Location & Charges" 
            subtitle="Add/Edit your location" 
            onPress={() => setEditLocationModalVisible(true)} 
          />
          <ProfileMenuItem 
            icon="pricetag-outline" 
            title="My Coupons" 
            subtitle="Your available discount coupons" 
            onPress={() => navigation.navigate("MyCoupons")} 
          />
          <ProfileMenuItem 
            icon="language" 
            title="Language" 
            subtitle="Select your preferred language" 
            onPress={() => navigation.navigate("Language")} 
          />
          <ProfileMenuItem 
            icon="headset-outline" 
            title="Customer Support" 
            subtitle="We are happy to assist you!" 
            onPress={() => navigation.navigate("CustomerSupport")} 
          />
          <ProfileMenuItem 
            icon="shield-checkmark-outline" 
            title="Terms & Conditions" 
            subtitle="We care about your safety" 
            onPress={() => navigation.navigate("Privacy&Policy")} 
          />
          <ProfileMenuItem 
            icon="information-circle-outline" 
            title="About Us" 
            subtitle="Get to know about us" 
            onPress={() => navigation.navigate("AboutUs")} 
          />
          <ProfileMenuItem 
            icon="star-outline" 
            title="Rate Us" 
            subtitle="Rate your experience on Play Store" 
            onPress={() => navigation.navigate("RateUs")} 
          />
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
        <>
          <EditProfileModal
            visible={editProfileModalVisible}
            onClose={() => setEditProfileModalVisible(false)}
            initialData={userInfo}
            onUpdate={handleProfileUpdate}
          />

          <EditLocationModal
            visible={editLocationModalVisible}
            onClose={() => setEditLocationModalVisible(false)}
            initialData={userInfo?.address}
            onSubmit={handleLocationUpdate}
          />
        </>
      )}
    </SafeAreaView>
  );
};

export default VendorProfile;

// ---------------- Styles ----------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  profileSection: { 
    backgroundColor: '#fff', 
    marginHorizontal: 16, 
    marginTop: 20, 
    marginBottom: 10, 
    borderRadius: 12, 
    padding: 20, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2 
  },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#FFB4A2', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarImage: { width: 60, height: 60, borderRadius: 30 },
  avatarText: { fontSize: 24, fontWeight: '600', color: '#fff' },
  userInfo: { flex: 1, marginLeft: 15 },
  userName: { fontSize: 18, fontWeight: '600', color: '#333' },
  userPhone: { fontSize: 14, color: '#666' },
  userRole: { fontSize: 12, color: '#4CAF50', fontWeight: '500', marginTop: 2 },
  editButtonContainer: { padding: 8 },
  menuSection: { 
    backgroundColor: '#fff', 
    marginHorizontal: 16, 
    marginVertical: 5, 
    borderRadius: 12, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 } 
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#f0f0f0' 
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { 
    width: 45, 
    height: 45, 
    borderRadius: 50, 
    backgroundColor: 'rgba(141, 110, 99, 0.1)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15, 
    borderWidth: 1, 
    borderColor: 'rgba(141, 110, 99, 0.2)' 
  },
  menuItemText: { flex: 1 },
  menuItemTitle: { fontSize: 16, fontWeight: '500', color: '#333' },
  menuItemSubtitle: { fontSize: 13, color: '#666' },
  logoutSection: { 
    paddingHorizontal: 16, 
    paddingVertical: 20, 
    marginBottom: 20, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 20 
  },
  logoutButton: { 
    backgroundColor: '#4CAF50', 
    flexDirection: 'row', 
    width: '70%', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 20, 
    borderRadius: 12, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 3 
  },
  logoutIcon: { marginRight: 8 },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

const modalStyles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'flex-end' 
  },
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

  // Section Title
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333', 
    marginBottom: 15, 
    marginTop: 5 
  },

  // Location Buttons
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  locationButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#00B0FF',
    marginLeft: 10,
    fontWeight: '500',
  },

  labelContainer: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 8 },

  textInput: { 
    borderWidth: 1, 
    borderColor: '#e0e0e0', 
    borderRadius: 8, 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    color: '#333', 
    fontSize: 14, 
    backgroundColor: '#f9f9f9',
    marginBottom: 15,
  },

  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    gap: 10,
  },
  halfInput: { 
    flex: 1,
    marginBottom: 15,
  },

  // Delivery Region Row
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00B0FF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 4,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  uptoText: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  deliveryInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 10,
    textAlign: 'center',
  },
  kmsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },

  updateButton: { 
    backgroundColor: '#4CAF50', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 15, 
    borderRadius: 12, 
    marginHorizontal: 20, 
    marginBottom: 10,
    marginTop: 10,
  },
  updateButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  profileUploadBox: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 12, 
    height: 150, 
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden' 
  },
  uploadedImage: { width: '100%', height: '100%', borderRadius: 8 },
  chooseFileText: { fontSize: 14, color: '#999', marginTop: 8 },
});