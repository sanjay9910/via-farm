import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "./context/AuthContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const API_BASE = 'https://393rb0pp-5000.inc1.devtunnels.ms';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { user, fetchBuyerProfile, logout } = useContext(AuthContext);

  const [userInfo, setUserInfo] = useState({
    name: "",
    phone: "",
    image: null,
    role: "",
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editImage, setEditImage] = useState(null);
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [locationSlideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));

  // Location form states
  const [pinCode, setPinCode] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
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
          name: userData.name || "",
          phone: userData.mobileNumber || userData.phone || "",
          image: userData.profilePicture || userData.image || null,
          role: userData.role || "",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      if (user) {
        setUserInfo({
          name: user.name || "",
          phone: user.mobileNumber || user.phone || "",
          image: user.profilePicture || user.image || null,
          role: user.role || "",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access gallery is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setEditImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
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

      if (!editPhone || editPhone.trim().length !== 10) {
        Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
        return;
      }

      setUpdating(true);

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'User not authenticated.');
        setUpdating(false);
        return;
      }

      const formData = new FormData();
      formData.append('name', editName.trim());
      formData.append('mobileNumber', editPhone.trim());

      // Add profile picture if selected
      if (editImage && editImage.startsWith('file://')) {
        const filename = editImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        
        formData.append('profilePicture', {
          uri: Platform.OS === 'android' ? editImage : editImage.replace('file://', ''),
          name: filename,
          type,
        });
      }

      const response = await axios.put(`${API_BASE}/api/buyer/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.data) {
        const updatedUser = response.data.data;

        setUserInfo({
          name: updatedUser.name,
          phone: updatedUser.mobileNumber,
          image: updatedUser.profilePicture,
          role: userInfo.role,
        });

        handleCloseModal();
        Alert.alert('Success', 'Profile updated successfully!');
        await loadProfile();
      } else {
        Alert.alert('Error', response.data.message || 'Something went wrong!');
      }
    } catch (error) {
      console.error('Update error:', error.response?.data || error.message);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update profile. Please try again.'
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleLocationPress = () => {
    setPinCode("");
    setHouseNumber("");
    setLocality("");
    setCity("");
    setDistrict("");
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
    Alert.alert(
      "Feature Coming Soon",
      "Current location feature will be available soon!"
    );
  };

  const handleSearchLocation = () => {
    Alert.alert(
      "Feature Coming Soon",
      "Search location feature will be available soon!"
    );
  };

  const handleUpdateLocation = async () => {
    try {
      if (!pinCode || !houseNumber || !locality || !city || !district) {
        Alert.alert("Error", "Please fill all required fields");
        return;
      }

      setUpdatingLocation(true);

      const token = await AsyncStorage.getItem("userToken");
      const locationData = {
        pinCode: pinCode.trim(),
        houseNumber: houseNumber.trim(),
        locality: locality.trim(),
        city: city.trim(),
        district: district.trim(),
      };

      // Add your location update API call here when ready
      // const response = await axios.put(`${API_BASE}/api/buyer/location`, locationData, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });

      handleCloseLocationModal();
      Alert.alert("Success", "Location updated successfully!");
    } catch (error) {
      console.error("Location update error:", error);
      Alert.alert("Error", "Failed to update location");
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
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("userToken");
            await logout();
            router.replace("/login");
            console.log("✅ Successfully logged out and navigated to login");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  const ProfileMenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
  }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#666" />
        </View>
        <View style={styles.menuItemText}>
          <Text style={styles.menuItemTitle}>{title}</Text>
          <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {showArrow && <Ionicons name="chevron-forward" size={18} color="#ccc" />}
    </TouchableOpacity>
  );

  const getAvatarLetter = () => {
    if (userInfo.name && userInfo.name.length > 0) {
      return userInfo.name.charAt(0).toUpperCase();
    }
    return "U";
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
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {userInfo.image ? (
                <Image
                  source={{ uri: userInfo.image }}
                  style={styles.avatarImage}
                  onError={(e) =>
                    console.log("Image load error:", e.nativeEvent.error)
                  }
                />
              ) : (
                <Text style={styles.avatarText}>{getAvatarLetter()}</Text>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userInfo.name || "User"}</Text>
              <Text style={styles.userPhone}>
                +91 {userInfo.phone || "N/A"}
              </Text>
              {userInfo.role && (
                <Text style={styles.userRole}>{userInfo.role}</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleEditProfile}
              style={styles.editButtonContainer}
            >
              <Image source={require("../assets/via-farm-img/icons/editicon.png")} />
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
            <Ionicons
              name="log-out-outline"
              size={20}
              color="#fff"
              style={styles.logoutIcon}
            />
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
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={handleCloseModal}
        >
          <View 
            style={styles.modalBackground}
            onStartShouldSetResponder={() => false}
          >
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  style={styles.backButton}
                >
                  <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Edit Details</Text>
                <View style={styles.placeholder} />
              </View>

              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.fieldNote}>* marks important fields</Text>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Profile Picture</Text>
                  <TouchableOpacity
                    style={styles.imagePickerContainer}
                    onPress={pickImage}
                    activeOpacity={0.7}
                  >
                    {editImage ? (
                      <Image
                        source={{ uri: editImage }}
                        style={styles.profilePreview}
                      />
                    ) : (
                      <>
                        <Ionicons
                          name="cloud-upload-outline"
                          size={40}
                          color="#ccc"
                        />
                        <Text style={styles.imagePickerText}>
                          Choose a file
                        </Text>
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
                    placeholder="Your Name"
                    placeholderTextColor="#999"
                    editable={!updating}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Mobile No. *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="9999999999"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!updating}
                  />
                </View>

                <View style={styles.locationBtn}>
                  <TouchableOpacity
                    style={[
                      styles.updateButton,
                      updating && styles.updateButtonDisabled,
                    ]}
                    onPress={handleUpdateDetails}
                    disabled={updating}
                    activeOpacity={0.7}
                  >
                    {updating ? (
                      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                    ) : (
                      <Ionicons name="reload-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    )}
                    <Text style={styles.updateButtonText}>
                      {updating ? 'Updating...' : 'Update Details'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Location Modal */}
      <Modal
        visible={locationModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={handleCloseLocationModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={handleCloseLocationModal}
        >
          <View 
            style={styles.modalBackground}
            onStartShouldSetResponder={() => true}
          >
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ translateY: locationSlideAnim }],
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={handleCloseLocationModal}
                  style={styles.backButton}
                >
                  <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Edit Location</Text>
                <View style={styles.placeholder} />
              </View>

              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.addressHeading}>Address</Text>

                <View style={styles.addressActionRow}>
                  <TouchableOpacity
                    style={styles.addressAction}
                    onPress={handleUseCurrentLocation}
                  >
                    <Ionicons name="locate-outline" size={18} color="#007AFF" />
                    <Text style={styles.addressActionText}>Use my current location</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addressAction}
                    onPress={handleSearchLocation}
                  >
                    <Ionicons name="search-outline" size={18} color="#007AFF" />
                    <Text style={styles.addressActionText}>Search Location</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Pin Code *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={pinCode}
                    onChangeText={setPinCode}
                    placeholder="Pin Code *"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    maxLength={6}
                    editable={!updatingLocation}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>House number/Block/Street *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={houseNumber}
                    onChangeText={setHouseNumber}
                    placeholder="House number/Block/Street *"
                    placeholderTextColor="#999"
                    editable={!updatingLocation}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Locality/Town *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={locality}
                    onChangeText={setLocality}
                    placeholder="Locality/Town *"
                    placeholderTextColor="#999"
                    editable={!updatingLocation}
                  />
                </View>

                <View style={styles.fieldRowContainer}>
                  <View style={styles.fieldHalf}>
                    <Text style={styles.fieldLabel}>City *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={city}
                      onChangeText={setCity}
                      placeholder="City *"
                      placeholderTextColor="#999"
                      editable={!updatingLocation}
                    />
                  </View>
                  <View style={styles.fieldHalf}>
                    <Text style={styles.fieldLabel}>District *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={district}
                      onChangeText={setDistrict}
                      placeholder="District *"
                      placeholderTextColor="#999"
                      editable={!updatingLocation}
                    />
                  </View>
                </View>

                <View style={styles.locationBtn}>
                  <TouchableOpacity
                    style={[
                      styles.updateButton,
                      updatingLocation && styles.updateButtonDisabled,
                    ]}
                    onPress={handleUpdateLocation}
                    disabled={updatingLocation}
                    activeOpacity={0.7}
                  >
                    {updatingLocation ? (
                      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                    ) : (
                      <Ionicons name="reload-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    )}
                    <Text style={styles.updateButtonText}>
                      {updatingLocation ? 'Updating...' : 'Update Details'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFB4A2",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  userPhone: {
    fontSize: 14,
    color: "#666",
  },
  userRole: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
    marginTop: 2,
  },
  editButtonContainer: {
    padding: 8,
  },
  menuSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 50,
    backgroundColor: 'rgba(141, 110, 99, 0.1)',
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 1,
    borderColor: 'rgba(141, 110, 99, 0.2)',
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: "#666",
  },
  logoutSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    width: "70%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(162, 153, 153, 0.7)",
    justifyContent: "flex-end",
  },
  modalBackground: {
    flex: 1,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    bottom:0,
    borderWidth: 2,
    borderColor: 'rgba(255, 202, 40, 0.2)',
    maxHeight: SCREEN_HEIGHT - 80,
    paddingBottom: 15,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  backButton: {
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 22,
    color: "#4CAF50",
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  fieldNote: {
    fontSize: 12,
    color: "#999",
    marginBottom: 10,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 5,
  },
  imagePickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  profilePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imagePickerText: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#333",
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  updateButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    width: "70%",
  },
  updateButtonDisabled: {
    backgroundColor: "#a5d6a7",
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  addressHeading: {
    fontSize: 12,
    color: "#999",
    marginBottom: 15,
  },
  addressActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  addressAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f0ff',
    padding: 10,
    borderRadius: 12,
    flex: 0.48,
  },
  addressActionText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 6,
  },
  locationBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  fieldRowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  fieldHalf: {
    width: "48%",
  },
});

ProfileScreen.options = {
  headerShown: false,
};

export default ProfileScreen;