import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height, width } = Dimensions.get('window');

const API_BASE = 'https://393rb0pp-5000.inc1.devtunnels.ms';

// --- NEW Component: EditProfileModal (Bottom Sheet Style) ---
const EditProfileModal = ({ visible, onClose, initialData, onUpdate }) => {
    // Initialize states with current user info
    const [name, setName] = useState(initialData?.name || '');
    const [mobileNumber, setMobileNumber] = useState(initialData?.phone || '');
    const [upiId, setUpiId] = useState(initialData?.upiId || '');
    const [profileImageUri, setProfileImageUri] = useState(initialData?.image || null); // To handle image selection

    const handleSubmit = () => {
        if (!name || !mobileNumber || !upiId) {
            Alert.alert('Error', 'Please fill all required fields.');
            return;
        }
        
        // Mock Update Logic
        onUpdate({ name, mobileNumber, upiId, profileImageUri });
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal
            animationType="slide" 
            transparent={true}
            visible={visible} 
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={modalStyles.modalOverlay}
                activeOpacity={1}
                onPress={onClose} 
            >
                <View 
                    style={modalStyles.modalContainer} 
                    onStartShouldSetResponder={() => true} 
                >
                    
                    {/* Header */}
                    <View style={modalStyles.header}>
                        <TouchableOpacity onPress={onClose} style={modalStyles.headerIcon}>
                            <Text style={modalStyles.iconText}>←</Text> 
                        </TouchableOpacity>
                        <Text style={modalStyles.headerTitle}>Edit Details</Text>
                        <View style={{ width: 40 }} /> 
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={modalStyles.scrollViewContent}>

                        <Text style={modalStyles.smallText}>* marks important fields</Text>

                        {/* Profile Picture Upload Area */}
                        <View style={modalStyles.labelContainer}>
                            <Text style={modalStyles.label}>Profile Picture</Text>
                            <TouchableOpacity 
                                style={modalStyles.profileUploadBox}
                                onPress={() => Alert.alert('Image Picker', 'Open gallery/camera to choose file')} // Mock action
                            >
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

                        {/* Name */}
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

                        {/* Mobile No. */}
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

                        {/* UPI ID (NEWLY ADDED FIELD) */}
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
                        
                        <View style={{ height: 30 }} />

                    </ScrollView>

                    {/* Update Button */}
                    <TouchableOpacity style={modalStyles.updateButton} onPress={handleSubmit}>
                        <Ionicons name="reload-outline" size={20} color="#fff" style={{marginRight: 8}} />
                        <Text style={modalStyles.updateButtonText}>Update Details</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};


// --- VendorProfile Component ---
const VendorProfile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editLocationModalVisible, setEditLocationModalVisible] = useState(false);
  // --- NEW STATE for Edit Profile Modal ---
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false); 
  // ----------------------------------------
  const navigation = useNavigation();

  const getAvatarLetter = (name) => {
    if (name && name.length > 0) return name.charAt(0).toUpperCase();
    return 'U';
  };

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('No token found');
        return;
      }

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

  const ProfileMenuItem = ({ icon, title, subtitle, onPress }) => (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#666" />
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

  // Handlers
  const handleMyLocationPress = () => {
    setEditLocationModalVisible(true);
  };
  const handleEditProfilePress = () => { // NEW Handler
    setEditProfileModalVisible(true);
  };
  const handleSupportPress = () => {
   navigation.navigate("CustomerSupport");
  };
  const policy = () => {
   navigation.navigate("Privacy&Policy");
  };
  const About = () => {
   navigation.navigate("AboutUs");
  };
  const Rate = () => {
   navigation.navigate("RateUs");
  };
  const handleMyCoupons = () => {
   navigation.navigate("MyCoupons");
  };

  const handleProfileUpdate = (updatedData) => {
    // Mock update state logic
    setUserInfo(prev => ({
        ...prev,
        name: updatedData.name,
        phone: updatedData.mobileNumber,
        upiId: updatedData.upiId,
        image: updatedData.profileImageUri || prev.image
    }));
    Alert.alert("Success", "Your profile details have been updated!");
  };

  const handleLocationUpdate = (data) => {
    console.log("Location Updated:", data);
    Alert.alert("Success", "Your location details have been updated!");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Info Section */}
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
            <TouchableOpacity 
                style={styles.editButtonContainer}
                onPress={handleEditProfilePress} // NEW onPress handler
            >
              <Image source={require('../../assets/via-farm-img/icons/editicon.png')} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <ProfileMenuItem 
            icon="location-outline" 
            title="My Location" 
            subtitle="Add/Edit your location" 
            onPress={handleMyLocationPress} 
          />
          <ProfileMenuItem icon="pricetag-outline" title="My Coupons" subtitle="Your available discount coupons" onPress={handleMyCoupons} />
          <ProfileMenuItem 
            icon="headset-outline" 
            title="Customer Support" 
            subtitle="We are happy to assist you!"
            onPress={handleSupportPress}
          />
          <ProfileMenuItem icon="shield-checkmark-outline" title="Privacy Policy" subtitle="We care about your safety" onPress={policy} />
          <ProfileMenuItem icon="information-circle-outline" title="About Us" subtitle="Get to know about us" onPress={About} />
          <ProfileMenuItem icon="star-outline" title="Rate Us" subtitle="Rate your experience on Play Store" onPress={Rate} />
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={async () => {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            navigation.navigate('Login'); 
          }}>
            <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- 1. Edit Location Modal Integration (from previous request) --- */}
      <EditLocationModal 
        visible={editLocationModalVisible} 
        onClose={() => setEditLocationModalVisible(false)}
        onSubmit={handleLocationUpdate}
      />
      
      {/* --- 2. NEW Edit Profile Modal Integration --- */}
      {userInfo && (
        <EditProfileModal 
            visible={editProfileModalVisible} 
            onClose={() => setEditProfileModalVisible(false)}
            initialData={userInfo}
            onUpdate={handleProfileUpdate}
        />
      )}
      {/* ------------------------------------------- */}

    </SafeAreaView>
  );
};

export default VendorProfile;

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
  iconContainer: { width: 35, height: 35, borderRadius: 8, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuItemText: { flex: 1 },
  menuItemTitle: { fontSize: 16, fontWeight: '500', color: '#333' },
  menuItemSubtitle: { fontSize: 13, color: '#666' },
  logoutSection: { paddingHorizontal: 16, paddingVertical: 20, marginBottom: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  logoutButton: { backgroundColor: '#4CAF50', flexDirection: 'row', width: '70%', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3 },
  logoutIcon: { marginRight: 8 },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});


// --- Reused Modal Styles (Applied to both Location and Profile Modals) ---
const modalStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(162, 153, 153, 0.7)', 
        justifyContent: 'flex-end', 
    },
    modalContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 202, 40, 0.5)',
        paddingHorizontal: 16,
        paddingBottom: 20,
        maxHeight: height * 0.9, 
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        textAlign: 'center',
        flex: 1,
    },
    headerIcon: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: {
        fontSize: 28,
        color: '#000',
        fontWeight: '300',
    },
    scrollViewContent: {
        paddingTop: 15,
        paddingBottom: 20,
    },
    smallText: {
        fontSize: 13,
        color: '#FF9800', // Yellow/Orange color for asterisk info
        marginBottom: 10,
    },
    labelContainer: {
        marginTop: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    textInput: {
        height: 50,
        borderWidth: 1,
        borderColor: '#f4e8b3', 
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#000',
    },
    // --- Profile Picture Specific Styles ---
    profileUploadBox: {
        height: 120,
        borderWidth: 1,
        borderColor: '#f4e8b3', 
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chooseFileText: {
        fontSize: 14,
        color: '#999',
        marginTop: 5,
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        resizeMode: 'cover',
    },
    // ----------------------------------------
    updateButton: {
        backgroundColor: '#4CAF50', 
        paddingVertical: 15,
        borderRadius: 10,
        marginTop: 20, 
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    updateButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Location-specific styles (for context, kept here from previous request)
    addressActionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 15,
        gap: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 15
    },
    addressAction: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addressActionText: {
        fontSize: 14,
        color: '#007AFF',
        marginLeft: 5,
        fontWeight: '500'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15, 
    },
    halfInput: {
        width: '48%', 
    },
});

// --- Edit Location Modal (Included for completeness/context) ---
const EditLocationModal = ({ visible, onClose, onSubmit }) => {
    const [pinCode, setPinCode] = useState('');
    const [houseNumber, setHouseNumber] = useState('');
    const [locality, setLocality] = useState('');
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');

    const handleSubmit = () => {
        if (!pinCode || !houseNumber || !locality || !city || !district) {
            Alert.alert('Error', 'Please fill all required fields before updating.');
            return;
        }
        onSubmit({ pinCode, houseNumber, locality, city, district });
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal
            animationType="slide" 
            transparent={true}
            visible={visible} 
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={modalStyles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View 
                    style={modalStyles.modalContainer} 
                    onStartShouldSetResponder={() => true} 
                >
                    
                    {/* Header */}
                    <View style={modalStyles.header}>
                        <TouchableOpacity onPress={onClose} style={modalStyles.headerIcon}>
                            <Text style={modalStyles.iconText}>←</Text> 
                        </TouchableOpacity>
                        <Text style={modalStyles.headerTitle}>Edit Location</Text>
                        <View style={{ width: 40 }} /> 
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={modalStyles.scrollViewContent}>

                        <Text style={[modalStyles.smallText, {marginTop: 0}]}>Address</Text>
                        
                        {/* Use Current Location & Search Location */}
                        <View style={modalStyles.addressActionRow}>
                            <TouchableOpacity style={modalStyles.addressAction} onPress={() => Alert.alert('Location', 'Fetching current location...')}>
                                <Ionicons name="locate-outline" size={18} color="#007AFF" />
                                <Text style={modalStyles.addressActionText}>Use my current location</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={modalStyles.addressAction} onPress={() => Alert.alert('Location', 'Opening search screen...')}>
                                <Ionicons name="search-outline" size={18} color="#007AFF" />
                                <Text style={modalStyles.addressActionText}>Search Location</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {/* Pin Code */}
                        <Text style={modalStyles.label}>Pin Code *</Text>
                        <TextInput 
                            style={[modalStyles.textInput, {marginBottom: 15, marginTop: 0}]}
                            placeholder="Pin Code *"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                            value={pinCode}
                            onChangeText={setPinCode}
                        />

                        {/* House number/Block/Street */}
                        <Text style={modalStyles.label}>House number/Block/Street *</Text>
                        <TextInput 
                            style={[modalStyles.textInput, {marginBottom: 15, marginTop: 0}]}
                            placeholder="House number/Block/Street *"
                            placeholderTextColor="#999"
                            value={houseNumber}
                            onChangeText={setHouseNumber}
                        />

                        {/* Locality/Town */}
                        <Text style={modalStyles.label}>Locality/Town *</Text>
                        <TextInput 
                            style={[modalStyles.textInput, {marginBottom: 15, marginTop: 0}]}
                            placeholder="Locality/Town *"
                            placeholderTextColor="#999"
                            value={locality}
                            onChangeText={setLocality}
                        />

                        {/* City & District (Row) */}
                        <View style={modalStyles.row}>
                            <View style={modalStyles.halfInput}>
                                <Text style={modalStyles.label}>City *</Text>
                                <TextInput 
                                    style={modalStyles.textInput}
                                    placeholder="City *"
                                    placeholderTextColor="#999"
                                    value={city}
                                    onChangeText={setCity}
                                />
                            </View>

                            <View style={modalStyles.halfInput}>
                                <Text style={modalStyles.label}>District *</Text>
                                <TextInput 
                                    style={modalStyles.textInput}
                                    placeholder="District *"
                                    placeholderTextColor="#999"
                                    value={district}
                                    onChangeText={setDistrict}
                                />
                            </View>
                        </View>
                        
                        <View style={{ height: 30 }} />

                    </ScrollView>

                    {/* Submit Button */}
                    <TouchableOpacity style={modalStyles.updateButton} onPress={handleSubmit}>
                        <Ionicons name="reload-outline" size={20} color="#fff" style={{marginRight: 8}} />
                        <Text style={modalStyles.updateButtonText}>Update Details</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};