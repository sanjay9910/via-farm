// HeaderWithLocation.js
import { moderateScale, normalizeFont, scale } from "@/app/Responsive";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Location from "expo-location";
import { useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE = "https://viafarm-1.onrender.com";

// Reverse Geocoding Function (OpenStreetMap Nominatim)
const reverseGeocodeLocation = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          "User-Agent": "ViafarmApp/1.0.0 (Location Service)",
        },
        timeout: 10000,
      }
    );

    const data = response.data || {};
    const address = data.address || {};

    return {
      pinCode: address.postcode || "",
      houseNumber: address.road || address.street || "",
      locality: address.town || address.village || address.suburb || "",
      city: address.city || address.county || "",
      district: address.county || address.district || "",
      latitude,
      longitude,
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return {
      pinCode: "",
      houseNumber: "",
      locality: "",
      city: "",
      district: "",
      latitude,
      longitude,
    };
  }
};

// ============ EditLocationModal Component ============
const EditLocationModal = ({ visible, onClose, initialData, onSubmit }) => {
  const [pinCode, setPinCode] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [deliveryRadius, setDeliveryRadius] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      setPinCode(initialData.pinCode || "");
      setHouseNumber(initialData.houseNumber || "");
      setLocality(initialData.locality || "");
      setCity(initialData.city || "");
      setDistrict(initialData.district || "");
      setDeliveryRadius(String(initialData.deliveryRadius || "").replace("km", ""));
      setLatitude(initialData.latitude || null);
      setLongitude(initialData.longitude || null);
    }
  }, [visible, initialData]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to use this feature.");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Permission error:", error);
      Alert.alert("Error", "Could not request location permission");
      return false;
    }
  };

  const handleUseCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    setFetchingLocation(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude: lat, longitude: lng } = location.coords || {};
      setLatitude(lat);
      setLongitude(lng);

      const geocodedAddress = await reverseGeocodeLocation(lat, lng);

      if (geocodedAddress) {
        setPinCode(geocodedAddress.pinCode);
        setHouseNumber(geocodedAddress.houseNumber);
        setLocality(geocodedAddress.locality);
        setCity(geocodedAddress.city);
        setDistrict(geocodedAddress.district);

        if (geocodedAddress.city) {
          Alert.alert("Success", "Location fetched successfully!");
        } else {
          Alert.alert(
            "Info",
            "Location coordinates received. Please fill in the address details manually."
          );
        }
      }
    } catch (error) {
      console.error("Location fetch error:", error);
      let errorMessage = "Could not fetch current location";
      if (error.code === "LOCATION_TIMEOUT") {
        errorMessage = "Location request timed out. Please try again.";
      } else if (error.code === "LOCATION_UNAVAILABLE") {
        errorMessage = "Location service is unavailable.";
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleSearchLocation = () => {
    Alert.alert("Search Location", "Location search feature coming soon. Use 'Use my current location' for now.");
  };

  const handleSubmit = async () => {
    if (!pinCode || !houseNumber || !locality || !city || !district) {
      Alert.alert("Error", "Please fill all required address fields.");
      return;
    }

    const radiusInt = parseInt(deliveryRadius, 10);
    if (isNaN(radiusInt) || radiusInt < 0 || radiusInt > 10000) {
      Alert.alert("Error", "Delivery radius must be a valid number between 0 and 10,000.");
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

      const response = await axios.put(`${API_BASE}/api/vendor/update-location`, body, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });

      if (response.data && response.data.success) {
        Alert.alert("Success", "Location updated successfully!");
        onSubmit && onSubmit(response.data.data);
        onClose && onClose();
      } else {
        Alert.alert("Error", (response.data && response.data.message) || "Something went wrong!");
      }
    } catch (error) {
      console.log("Location update error:", error);
      let errorMessage = "Failed to update location. Please try again later.";
      if (error.response) {
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = "Invalid data submitted. Please check pin code and delivery radius.";
        }
      }
      Alert.alert("Error", errorMessage);
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
              <Image source={require("../../assets/via-farm-img/icons/groupArrow.png")} />
            </TouchableOpacity>
            <Text style={modalStyles.headerTitle} allowFontScaling={false}>Location</Text>
            <View style={{ width: scale(40) }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={modalStyles.scrollViewContent}>
            <Text style={modalStyles.sectionTitle} allowFontScaling={false}>Your Address</Text>

            <TouchableOpacity
              style={[modalStyles.locationButton, fetchingLocation && modalStyles.locationButtonDisabled]}
              onPress={handleUseCurrentLocation}
              disabled={fetchingLocation}
            >
              {fetchingLocation ? (
                <>
                  <ActivityIndicator size="small" color="#00B0FF" style={{ marginRight: moderateScale(10) }} />
                  <Text style={modalStyles.locationButtonText} allowFontScaling={false}>Fetching location...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="locate" size={18} color="#00B0FF" />
                  <Text style={modalStyles.locationButtonText} allowFontScaling={false}>Use my current location</Text>
                  <Ionicons name="chevron-forward" size={16} color="#00B0FF" />
                </>
              )}
            </TouchableOpacity>

            <TextInput
              style={modalStyles.textInput}
              placeholder="Pin Code *"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={6}
              value={pinCode}
              onChangeText={setPinCode}
              allowFontScaling={false}
            />

            <TextInput
              style={modalStyles.textInput}
              placeholder="House number/Block/Street *"
              placeholderTextColor="#999"
              value={houseNumber}
              onChangeText={setHouseNumber}
              allowFontScaling={false}
            />

            <TextInput
              style={modalStyles.textInput}
              placeholder="Locality/Town *"
              placeholderTextColor="#999"
              value={locality}
              onChangeText={setLocality}
              allowFontScaling={false}
            />

            <View style={modalStyles.modalRow}>
              <TextInput
                style={[modalStyles.textInput, modalStyles.halfInput]}
                placeholder="City *"
                placeholderTextColor="#999"
                value={city}
                onChangeText={setCity}
                allowFontScaling={false}
              />
              <TextInput
                style={[modalStyles.textInput, modalStyles.halfInput]}
                placeholder="District *"
                placeholderTextColor="#999"
                value={district}
                onChangeText={setDistrict}
                allowFontScaling={false}
              />
            </View>

            <Text style={modalStyles.sectionTitle} allowFontScaling={false}>Delivery Region</Text>
            <View style={modalStyles.deliveryRow}>
              <Text style={modalStyles.uptoText} allowFontScaling={false}>Upto</Text>
              <TextInput
                style={modalStyles.deliveryInput}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={deliveryRadius}
                onChangeText={setDeliveryRadius}
                allowFontScaling={false}
              />
              <Text style={modalStyles.kmsText} allowFontScaling={false}>kms</Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={modalStyles.updateButton}
            onPress={handleSubmit}
            disabled={loading || fetchingLocation}
          >
            {loading ? (
              <ActivityIndicator color="#fff" style={{ marginRight: moderateScale(8) }} />
            ) : (
              <Image source={require("../../assets/via-farm-img/icons/updateDetails.png")} />
            )}
            <Text style={modalStyles.updateButtonText} allowFontScaling={false}>
              {loading ? "Updating..." : "Update Details"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ============ Header Component ============
const Header = () => {
  const [address, setAddress] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    fetchVendorAddress();
  }, []);

  const fetchVendorAddress = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE}/api/vendor/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });

      if (response.data && response.data.success && response.data.user) {
        setAddress(response.data.user.address || {});
      }
    } catch (error) {
      console.error("Address fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationUpdate = (updatedData) => {
    setAddress(updatedData || {});
    fetchVendorAddress();
  };

  const handleNotification = () => {
    navigation.navigate("Notification");
  };

  const handleLocationPress = () => {
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity style={styles.locationWrapper} onPress={handleLocationPress}>
          <View style={styles.row}>
            <Text style={styles.cityText} allowFontScaling={false}>
              {address?.city || "Unknown City"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#000" style={{ marginLeft: 4 }} />
          </View>
          <Text style={styles.subText} allowFontScaling={false}>
            {address?.locality ? `${address.locality}, ${address.city}` : "Tap to add location"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bellWrapper} onPress={handleNotification}>
          <Ionicons name="notifications-outline" size={22} color="#555" />
        </TouchableOpacity>
      </View>

      <EditLocationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        initialData={address}
        onSubmit={handleLocationUpdate}
      />
    </>
  );
};

export default Header;

// ============ Styles ============
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    backgroundColor: "#fff",
  },
  locationWrapper: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  cityText: {
    fontSize: normalizeFont(15),
    fontWeight: "600",
    color: "#000",
  },
  subText: {
    fontSize: normalizeFont(12),
    color: "#555",
    marginTop: moderateScale(1),
  },
  bellWrapper: {
    backgroundColor: "#f5f5f5",
    padding: moderateScale(8),
    borderRadius: 50,
    marginLeft: moderateScale(10),
  },
});

// ============ Modal Styles ============
const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderLeftWidth: 2,
    borderColor: "rgba(255, 202, 40, 1)",
    maxHeight: "85%",
    paddingBottom: moderateScale(15),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(15),
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerIcon: {
    width: moderateScale(40),
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: normalizeFont(17),
    fontWeight: "600",
    color: "#333",
  },
  scrollViewContent: {
    paddingVertical: moderateScale(15),
    paddingHorizontal: moderateScale(20),
  },
  sectionTitle: {
    fontSize: normalizeFont(14),
    fontWeight: "600",
    color: "#333",
    marginBottom: moderateScale(15),
    marginTop: moderateScale(5),
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(15),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(12),
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  locationButtonDisabled: {
    opacity: 0.7,
  },
  locationButtonText: {
    flex: 1,
    fontSize: normalizeFont(13),
    color: "#00B0FF",
    marginLeft: moderateScale(10),
    fontWeight: "500",
  },
  coordinatesBox: {
    backgroundColor: "#f0f8ff",
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    borderLeftWidth: 4,
    borderLeftColor: "#00B0FF",
    marginBottom: moderateScale(15),
  },
  coordinatesText: {
    fontSize: normalizeFont(13),
    color: "#00B0FF",
    fontWeight: "500",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    color: "#333",
    fontSize: normalizeFont(14),
    backgroundColor: "#f9f9f9",
    marginBottom: moderateScale(15),
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: moderateScale(10),
  },
  halfInput: {
    flex: 1,
    marginBottom: moderateScale(15),
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#00B0FF",
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(4),
    backgroundColor: "#fff",
    marginBottom: moderateScale(20),
  },
  uptoText: {
    fontSize: normalizeFont(13),
    color: "#666",
    marginRight: moderateScale(10),
  },
  deliveryInput: {
    flex: 1,
    fontSize: normalizeFont(14),
    color: "#333",
    paddingVertical: moderateScale(10),
    textAlign: "center",
  },
  kmsText: {
    fontSize: normalizeFont(13),
    color: "#666",
    marginLeft: moderateScale(10),
  },
  updateButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    gap: moderateScale(6),
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: moderateScale(15),
    borderRadius: moderateScale(12),
    marginHorizontal: moderateScale(20),
    marginBottom: moderateScale(10),
    marginTop: moderateScale(10),
  },
  updateButtonText: {
    color: "#fff",
    fontSize: normalizeFont(15),
    fontWeight: "600",
  },
});
