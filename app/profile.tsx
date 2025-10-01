import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from './context/AuthContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, fetchBuyerProfile, logout } = useContext(AuthContext);

  const [userInfo, setUserInfo] = useState({
    name: '',
    phone: '',
    image: null,
    role: ''
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [locationSlideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));

  // Location form states
  const [pinCode, setPinCode] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [updatingLocation, setUpdatingLocation] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await fetchBuyerProfile();
      
      console.log("Profile Data Received:", profileData);
      
      if (profileData) {
        const userData = profileData.user || profileData;
        
        setUserInfo({
          name: userData.name || '',
          phone: userData.mobileNumber || userData.phone || '',
          image: userData.profilePicture|| userData.image || null,
          role: userData.role || ''
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      if (user) {
        setUserInfo({
          name: user.name || '',
          phone: user.mobileNumber || user.phone || '',
          image: user.profilePicture || user.image || null,
          role: user.role || ''
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setEditImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleEditProfile = () => {
    setEditName(userInfo.name);
    setEditPhone(userInfo.phone);
    setEditImage(userInfo.image);
    setEditModalVisible(true);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseModal = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setEditModalVisible(false);
    });
  };

  const handleUpdateDetails = async () => {
    try {
      if (!editName || !editName.trim()) {
        Alert.alert('Error', 'Name is required');
        return;
      }

      setUpdating(true);

      const token = await AsyncStorage.getItem('userToken');
      const updateData = {
        name: editName.trim(),
        mobileNumber: editPhone.trim(),
        profilePicture: editImage
      };

      const res = await axios.put(
        'https://393rb0pp-5000.inc1.devtunnels.ms/api/buyer/profile',
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (res.data.success) {
        setUserInfo({
          name: editName,
          phone: editPhone,
          image: editImage,
          role: userInfo.role
        });
        
        handleCloseModal();
        Alert.alert('Success', 'Profile updated successfully!');
        await loadProfile();
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleLocationPress = () => {
    setPinCode('');
    setHouseNumber('');
    setLocality('');
    setCity('');
    setDistrict('');
    setLocationModalVisible(true);

    Animated.timing(locationSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseLocationModal = () => {
    Animated.timing(locationSlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setLocationModalVisible(false);
    });
  };

  const handleUseCurrentLocation = () => {
    Alert.alert('Feature Coming Soon', 'Current location feature will be available soon!');
  };

  const handleSearchLocation = () => {
    Alert.alert('Feature Coming Soon', 'Search location feature will be available soon!');
  };

  const handleUpdateLocation = async () => {
    try {
      if (!pinCode || !houseNumber || !locality || !city || !district) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      setUpdatingLocation(true);

      // Replace with your actual API endpoint
      const token = await AsyncStorage.getItem('userToken');
      const locationData = {
        pinCode: pinCode.trim(),
        houseNumber: houseNumber.trim(),
        locality: locality.trim(),
        city: city.trim(),
        district: district.trim()
      };

      // Uncomment when API is ready
      // const res = await axios.put(
      //   'YOUR_API_ENDPOINT/location',
      //   locationData,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );

      // if (res.data.success) {
        handleCloseLocationModal();
        Alert.alert('Success', 'Location updated successfully!');
      // }

    } catch (error) {
      console.error('Location update error:', error);
      Alert.alert('Error', 'Failed to update location');
    } finally {
      setUpdatingLocation(false);
    }
  };

  const handleWishlistPress = () => {
    navigation.navigate("wishlist");
  };

  const handleOrdersPress = () => {
    navigation.navigate("MyOrder");
  };

  const handleSupportPress = () => {
   navigation.navigate("CustomerSupport");
  };

  const handlePrivacyPress = () => {
    navigation.navigate("Privacy&Policy");
  };

  const handleAboutPress = () => {
    navigation.navigate("AboutUs");
  };

  const handleRatePress = () => {
    navigation.navigate("RateUs");
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            const rootNavigation = navigation.getParent() || navigation;
            rootNavigation.reset({
              index: 0,
              routes: [{ name: 'login' }],
            });
          }
        }
      ]
    );
  };

  const ProfileMenuItem = ({ icon, title, subtitle, onPress, showArrow = true }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#666" />
        </View>
        <View style={styles.menuItemText}>
          <Text style={styles.menuItemTitle}>{title}</Text>
          <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={18} color="#ccc" />
      )}
    </TouchableOpacity>
  );

  const getAvatarLetter = () => {
    if (userInfo.name && userInfo.name.length > 0) {
      return userInfo.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {userInfo.image ? (
                <Image 
                  source={{ uri: userInfo.image }} 
                  style={styles.avatarImage}
                  onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
                />
              ) : (
                <Text style={styles.avatarText}>{getAvatarLetter()}</Text>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userInfo.name || 'User'}</Text>
              <Text style={styles.userPhone}>+91 {userInfo.phone || 'N/A'}</Text>
              {userInfo.role && (
                <Text style={styles.userRole}>{userInfo.role}</Text>
              )}
            </View>
            <TouchableOpacity onPress={handleEditProfile} style={styles.editButtonContainer}>
              <Ionicons name="create-outline" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.menuSection}>
          <ProfileMenuItem
            icon="location-outline"
            title="My Location"
            subtitle="Add/Edit your location"
            onPress={handleLocationPress}
          />

          <ProfileMenuItem
            icon="heart-outline"
            title="My Wishlist"
            subtitle="Your most loved products"
            onPress={handleWishlistPress}
          />

          <ProfileMenuItem
            icon="bag-outline"
            title="My Orders"
            subtitle="View/track your orders"
            onPress={handleOrdersPress}
          />

          <ProfileMenuItem
            icon="headset-outline"
            title="Customer Support"
            subtitle="We are happy to assist you!"
            onPress={handleSupportPress}
          />

          <ProfileMenuItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            subtitle="We care about your safety"
            onPress={handlePrivacyPress}
          />

          <ProfileMenuItem
            icon="information-circle-outline"
            title="About Us"
            subtitle="Get to know about us"
            onPress={handleAboutPress}
          />

          <ProfileMenuItem
            icon="star-outline"
            title="Rate Us"
            subtitle="Rate your experience on Play Store"
            onPress={handleRatePress}
          />
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={handleCloseModal}
          />
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseModal} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Details</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldNote}>* marks important fields</Text>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Profile Picture</Text>
                <TouchableOpacity 
                  style={styles.imagePickerContainer}
                  onPress={pickImage}
                  activeOpacity={0.7}
                >
                  {editImage ? (
                    <Image source={{ uri: editImage }} style={styles.profilePreview} />
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={40} color="#4CAF50" />
                      <Text style={styles.imagePickerText}>Tap to choose photo</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your name"
                  editable={!updating}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Mobile No. *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Enter mobile number"
                  keyboardType="numeric"
                  maxLength={10}
                  editable={!updating}
                />
              </View>

             <View style={styles.locationBtn}>
              <TouchableOpacity 
                style={[styles.updateButton, updating && styles.updateButtonDisabled]} 
                onPress={handleUpdateDetails}
                disabled={updating}
                activeOpacity={0.7}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Image source={require('../assets/via-farm-img/icons/updateDetails.png')} />
                    <Text style={styles.updateButtonText}>Update Details</Text>
                  </>
                )}
              </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Location Modal */}
      <Modal
        visible={locationModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={handleCloseLocationModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={handleCloseLocationModal}
          />
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY: locationSlideAnim }]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseLocationModal} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Location</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.addressHeading}>Address</Text>

              <TouchableOpacity 
                style={styles.locationActionButton}
                onPress={handleUseCurrentLocation}
                activeOpacity={0.7}
              >
                <Ionicons name="locate" size={20} color="#00BCD4" />
                <Text style={styles.locationActionText}>Use my current location</Text>
                <Ionicons name="chevron-forward" size={18} color="#00BCD4" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.locationActionButton}
                onPress={handleSearchLocation}
                activeOpacity={0.7}
              >
                <Ionicons name="search" size={20} color="#00BCD4" />
                <Text style={styles.locationActionText}>Search Location</Text>
                <Ionicons name="chevron-forward" size={18} color="#00BCD4" />
              </TouchableOpacity>

              <View style={styles.fieldContainer}>
                <TextInput
                  style={styles.textInput}
                  value={pinCode}
                  onChangeText={setPinCode}
                  placeholder="Pin Code *"
                  keyboardType="numeric"
                  maxLength={6}
                  editable={!updatingLocation}
                />
              </View>

              <View style={styles.fieldContainer}>
                <TextInput
                  style={styles.textInput}
                  value={houseNumber}
                  onChangeText={setHouseNumber}
                  placeholder="House number/Block/Street *"
                  editable={!updatingLocation}
                />
              </View>

              <View style={styles.fieldContainer}>
                <TextInput
                  style={styles.textInput}
                  value={locality}
                  onChangeText={setLocality}
                  placeholder="Locality/Town *"
                  editable={!updatingLocation}
                />
              </View>

              <View style={styles.fieldRowContainer}>
                <View style={styles.fieldHalf}>
                  <TextInput
                    style={styles.textInput}
                    value={city}
                    onChangeText={setCity}
                    placeholder="City *"
                    editable={!updatingLocation}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <TextInput
                    style={styles.textInput}
                    value={district}
                    onChangeText={setDistrict}
                    placeholder="District *"
                    editable={!updatingLocation}
                  />
                </View>
              </View>

              <View style={styles.locationBtn}>
              <TouchableOpacity 
                style={[styles.updateButton, updatingLocation && styles.updateButtonDisabled]} 
                onPress={handleUpdateLocation}
                disabled={updatingLocation}
                activeOpacity={0.7}
              >
                {updatingLocation ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                      <Image source={require('../assets/via-farm-img/icons/updateDetails.png')} />
                    <Text style={styles.updateButtonText}>Update Details</Text>
                  </>
                )}
              </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFB4A2',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  editButtonContainer: {
    padding: 8,
  },
  menuSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 35,
    height: 35,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  logoutSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 20,
    flexDirection:'row',
    justifyContent:'center',
    alignItems:'center',
    marginTop:20,
  },
  logoutButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    width:'70%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical:20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackground: {
    flex: 1,
    marginBottom: 100,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 600,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  fieldNote: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  imagePickerContainer: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  profilePreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePickerText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  updateButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 30,
    width:'70%',
  },
  updateButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  updateIcon: {
    marginRight: 8,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  addressHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  locationActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  locationBtn:{
   flexDirection:'row',
   justifyContent:'center',
   alignItems:'center',
  },
  locationActionText: {
    fontSize: 16,
    color: 'rgba(1, 151, 218, 1)',
    marginLeft: 10,
    flex: 1,
  },
  fieldRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  fieldHalf: {
    width: '48%',
  },
});

ProfileScreen.options = {
  headerShown: false,
};

export default ProfileScreen;