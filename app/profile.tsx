import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import * as Location from 'expo-location';
import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
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
import { moderateScale, normalizeFont, scale } from "./Responsive";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const API_BASE = 'https://viafarm-1.onrender.com';

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
  const [state, setState] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [savedLocation, setSavedLocation] = useState(null);

  useEffect(() => {
    loadProfile();
    loadSavedLocation();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await fetchBuyerProfile();

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

  const loadSavedLocation = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const response = await axios.put(`${API_BASE}/api/buyer/location`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (response.data.success && response.data.data) {
        const locationData = response.data.data;
        setSavedLocation(locationData);

        setPinCode(locationData.pinCode || "");
        setHouseNumber(locationData.houseNumber || "");
        setLocality(locationData.locality || "");
        setCity(locationData.city || "");
        setDistrict(locationData.district || "");
        setState(locationData.state || "");
        setLatitude(locationData.latitude || null);
        setLongitude(locationData.longitude || null);
      }
    } catch (error) {
      console.error("Error loading saved location:", error);
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

  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true);

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        setGettingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      setLatitude(latitude);
      setLongitude(longitude);

      let geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (geocode.length > 0) {
        const address = geocode[0];
        setCity(address.city || "");
        setDistrict(address.district || address.subregion || "");
        setState(address.region || "");
        setPinCode(address.postalCode || "");
        setLocality(address.street || address.name || "");

        Alert.alert("Success", "Location fetched successfully!");
      }

    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Error", "Failed to get current location. Please try again.");
    } finally {
      setGettingLocation(false);
    }
  };

  const handleLocationPress = () => {
    if (!savedLocation) {
      setPinCode("");
      setHouseNumber("");
      setLocality("");
      setCity("");
      setDistrict("");
      setState("");
      setLatitude(null);
      setLongitude(null);
    }

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

  const handleUpdateLocation = async () => {
    try {
      if (!pinCode || !houseNumber || !locality || !city || !district || !state) {
        Alert.alert("Error", "Please fill all required fields");
        return;
      }



      setUpdatingLocation(true);

      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "User not authenticated");
        setUpdatingLocation(false);
        return;
      }

      const locationData = {
        pinCode: pinCode.trim(),
        houseNumber: houseNumber.trim(),
        locality: locality.trim(),
        city: city.trim(),
        district: district.trim(),
        state: state.trim(),
        latitude: latitude || 0,
        longitude: longitude || 0
      };

      console.log("Sending location data:", locationData);

      const response = await axios.put(`${API_BASE}/api/buyer/location`, locationData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data.success) {
        // Update saved location state
        setSavedLocation(locationData);

        handleCloseLocationModal();
        Alert.alert("Success", "Location updated successfully!");
      } else {
        Alert.alert("Error", response.data.message || "Failed to update location");
      }
    } catch (error) {
      console.error("Location update error:", error);

      if (error.code === 'ECONNABORTED' || error.response?.status === 408) {
        Alert.alert("Timeout", "Request took too long. Please check your internet connection and try again.");
      } else if (error.response?.status === 401) {
        Alert.alert("Authentication Error", "Please login again.");
        await logout();
        router.replace("/login");
      } else {
        Alert.alert(
          "Error",
          error.response?.data?.message || "Failed to update location. Please try again."
        );
      }
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
    navigation.navigate("Terms&Condition");
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


  const goHome = ()=>{
    navigation.navigate("(tabs)")
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.profile}>
        <TouchableOpacity onPress={goHome}>
          <Image source={require("../assets/via-farm-img/icons/groupArrow.png")} />
        </TouchableOpacity>
        <Text style={{ fontWeight: 700, fontSize: normalizeFont(14) }}>My Profile</Text>
        <Text></Text>
      </View>
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
              <TouchableOpacity
                onPress={handleEditProfile}
                style={styles.editButtonContainer}
              >
                <Image source={require("../assets/via-farm-img/icons/editicon.png")} />
              </TouchableOpacity>
            </View>

          </View>
        </View>

        <View style={styles.menuSection}>
          <ProfileMenuItem
            icon="location-outline"
            title="My Address"
            subtitle={savedLocation ? "Edit your saved location" : "Add your location"}
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
            title="Terms & Condition"
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
          <View style={styles.modalBackground}>
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
                  {/* <Text style={styles.backButtonText}>←</Text> */}
                  <Image source={require("../assets/via-farm-img/icons/groupArrow.png")} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Edit Details</Text>
                <View style={styles.placeholder} />
              </View>

              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={{ fontSize: normalizeFont(12) }}>* marks important fields</Text>

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
                      <ActivityIndicator size="small" color="#fff" style={{ marginRight: moderateScale(8) }} />
                    ) : (
                      <Ionicons name="reload-outline" size={20} color="#fff" style={{ marginRight: moderateScale(8) }} />
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
          <View style={styles.modalBackground}>
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
                  <Image source={require("../assets/via-farm-img/icons/groupArrow.png")} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {savedLocation ? "Edit Address" : "Add Address"}
                </Text>
                <View style={styles.placeholder} />
              </View>

              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.locationModalContent}
              >
                <Text style={styles.addressHeading}>
                  {savedLocation ? "Edit your saved address" : "Enter your address details"}
                </Text>

                <View style={styles.addressActionRow}>
                  <TouchableOpacity
                    style={[
                      styles.addressAction,
                      gettingLocation && styles.addressActionDisabled
                    ]}
                    onPress={getCurrentLocation}
                    disabled={gettingLocation}
                  >
                    {gettingLocation ? (
                      <ActivityIndicator size="small" color="#007AFF" />
                    ) : (
                      <Ionicons name="locate-outline" size={18} color="#007AFF" />
                    )}
                    <Text style={styles.addressActionText}>
                      {gettingLocation ? 'Getting Location...' : 'Use my current location'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {savedLocation && (
                  <View style={styles.savedLocationNote}>
                  </View>
                )}

                <View style={styles.fieldContainer}>
                  {/* <Text style={styles.fieldLabel}>Pin Code *</Text> */}
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
                  {/* <Text style={styles.fieldLabel}>House number/Block/Street *</Text> */}
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
                  {/* <Text style={styles.fieldLabel}>Locality/Town *</Text> */}
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
                    {/* <Text style={styles.fieldLabel}>City *</Text> */}
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
                    {/* <Text style={styles.fieldLabel}>District *</Text> */}
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

                <View style={styles.fieldContainer}>
                  {/* <Text style={styles.fieldLabel}>State *</Text> */}
                  <TextInput
                    style={styles.textInput}
                    value={state}
                    onChangeText={setState}
                    placeholder="State *"
                    placeholderTextColor="#999"
                    editable={!updatingLocation}
                  />
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
                      <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    )}
                    <Text style={styles.updateButtonText}>
                      {updatingLocation ? 'Saving...' : 'Save Location'}
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
    marginHorizontal: moderateScale(16),
    marginTop: moderateScale(20),
    marginBottom: moderateScale(10),
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
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
    width: scale(50),
    height: scale(50),
    borderRadius: moderateScale(30),
    backgroundColor: "#FFB4A2",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: scale(50),
    height: scale(50),
    borderRadius: moderateScale(30),
  },
  avatarText: {
    fontSize: normalizeFont(20),
    fontWeight: "600",
    color: "#fff",
  },
  userInfo: {
    flex: 1,
    marginLeft: moderateScale(15),
  },
  userName: {
    fontSize: normalizeFont(15),
    fontWeight: "600",
    color: "#333",
  },
  userPhone: {
    fontSize: normalizeFont(12),
    color: "#666",
  },
  userRole: {
    fontSize: normalizeFont(10),
    color: "#4CAF50",
    fontWeight: "500",
    marginTop: 2,
  },
  editButtonContainer: {
    // padding: moderateScale(8),
    right:moderateScale(-5),
    bottom:moderateScale(-5),
    position: 'absolute'
  },
  menuSection: {
    backgroundColor: "#fff",
    marginHorizontal: moderateScale(16),
    marginVertical: moderateScale(5),
    borderRadius: moderateScale(12),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: scale(45),
    height: scale(45),
    borderRadius: 50,
    backgroundColor: 'rgba(141, 110, 99, 0.1)',
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(15),
    borderWidth: 1,
    borderColor: 'rgba(141, 110, 99, 0.2)',
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: normalizeFont(13),
    fontWeight: "500",
    color: "#333",
  },
  menuItemSubtitle: {
    fontSize: normalizeFont(13),
    color: "#666",
  },
  logoutSection: {
    paddingHorizontal: moderateScale(13),
    paddingVertical: moderateScale(18),
    marginBottom: moderateScale(20),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: moderateScale(10),
  },
  logoutButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    width: "60%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(20),
    borderRadius: moderateScale(10),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  logoutIcon: {
    marginRight: moderateScale(8),
  },
  logoutText: {
    fontSize: normalizeFont(16),
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
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: '100%',
    backgroundColor: "#fff",
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    borderRightWidth: 2,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: 'rgba(255, 202, 40, 1)',
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(15),
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  backButton: {
    width: scale(40),
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: normalizeFont(22),
    color: "#4CAF50",
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: normalizeFont(15),
    fontWeight: "600",
    color: "#333",
  },
  placeholder: {
    width: scale(40),
  },
  modalContent: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(15),
  },
  locationModalContent: {
    paddingBottom: moderateScale(30),
  },
  fieldContainer: {
    marginBottom: moderateScale(15),
  },
  fieldLabel: {
    fontSize: normalizeFont(11),
    fontWeight: "500",
    color: "#333",
    marginBottom: moderateScale(5),
  },
  imagePickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: moderateScale(12),
    height: scale(150),
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  profilePreview: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(8),
  },
  imagePickerText: {
    fontSize: normalizeFont(10),
    color: "#999",
    marginTop: moderateScale(8),
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
    color: "#333",
    fontSize: normalizeFont(12),
    backgroundColor: '#f9f9f9',
  },
  updateButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: moderateScale(15),
    borderRadius: moderateScale(12),
    marginTop: moderateScale(10),
    width: "70%",
  },
  updateButtonDisabled: {
    backgroundColor: "#a5d6a7",
  },
  updateButtonText: {
    fontSize: normalizeFont(14),
    fontWeight: "600",
    color: "#fff",
  },
  addressHeading: {
    fontSize: normalizeFont(12),
    color: "#999",
    marginBottom: moderateScale(15),
  },
  addressActionRow: {
    marginBottom: moderateScale(15),
  },
  addressAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f0ff',
    paddingVertical: moderateScale(15),
    padding: moderateScale(10),
    borderRadius: moderateScale(12),
    flex: 0.48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'blue',
  },
  addressActionDisabled: {
    opacity: 0.6,
  },
  addressActionText: {
    fontSize: normalizeFont(12),
    color: '#007AFF',
    marginLeft: 6,
  },
  coordinatesContainer: {
    backgroundColor: '#f0f8ff',
    padding: moderateScale(10),
    borderRadius: 8,
    marginBottom: moderateScale(15),
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  coordinatesText: {
    fontSize: normalizeFont(12),
    color: '#007AFF',
    fontWeight: '500',
  },
  locationBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: moderateScale(20),
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(22),
    paddingVertical: moderateScale(5),
  },
  fieldRowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: moderateScale(15),
  },
  fieldHalf: {
    width: "48%",
  }
});

ProfileScreen.options = {
  headerShown: false,
};

export default ProfileScreen;