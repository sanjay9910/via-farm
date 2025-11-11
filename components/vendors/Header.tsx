import { moderateScale, normalizeFont } from "@/app/Responsive";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Location from "expo-location";
import { useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const API_BASE = "https://viafarm-1.onrender.com";

// Reverse Geocoding Function
const reverseGeocodeLocation = async (latitude, longitude) => {
  try {
    // Using OpenStreetMap Nominatim API (free, no key required)
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          "User-Agent": "ViafarmApp/1.0.0 (Location Service)",
        },
        timeout: 10000,
      }
    );

    const data = response.data;
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
    // Return with just coordinates if geocoding fails
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

  // Prefill values when modal opens
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

  // Request Location Permissions
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to use this feature."
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error("Permission error:", error);
      Alert.alert("Error", "Could not request location permission");
      return false;
    }
  };

  // Get Current Location
  const handleUseCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    setFetchingLocation(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude: lat, longitude: lng } = location.coords;
      console.log("Current Location:", lat, lng);

      setLatitude(lat);
      setLongitude(lng);

      // Reverse Geocode to get address details
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

  // Search Location (Placeholder for now)
  const handleSearchLocation = () => {
    Alert.alert(
      "Search Location",
      "Location search feature coming soon. Use 'Use my current location' for now."
    );
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!pinCode || !houseNumber || !locality || !city || !district) {
      Alert.alert("Error", "Please fill all required address fields.");
      return;
    }

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
        <View
          style={modalStyles.modalContainer}
          onStartShouldSetResponder={() => true}
        >
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
              style={[
                modalStyles.locationButton,
                fetchingLocation && modalStyles.locationButtonDisabled,
              ]}
              onPress={handleUseCurrentLocation}
              disabled={fetchingLocation}
            >
              {fetchingLocation ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#00B0FF"
                    style={{ marginRight: 10 }}
                  />
                  <Text style={modalStyles.locationButtonText}>
                    Fetching location...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="locate" size={18} color="#00B0FF" />
                  <Text style={modalStyles.locationButtonText}>
                    Use my current location
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#00B0FF" />
                </>
              )}
            </TouchableOpacity>

            {/* <TouchableOpacity
              style={modalStyles.locationButton}
              onPress={handleSearchLocation}
            >
              <Ionicons name="search" size={18} color="#00B0FF" />
              <Text style={modalStyles.locationButtonText}>Search Location</Text>
              <Ionicons name="chevron-forward" size={16} color="#00B0FF" />
            </TouchableOpacity> */}

            {/* Coordinates Display */}
            {/* {latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined && (
              <View style={modalStyles.coordinatesBox}>
                <Text style={modalStyles.coordinatesText}>
                  📍 Lat: {typeof latitude === 'number' ? latitude.toFixed(6) : latitude} | Lng: {typeof longitude === 'number' ? longitude.toFixed(6) : longitude}
                </Text>
              </View>
            )} */}

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

          {/* Submit Button */}
          <TouchableOpacity
            style={modalStyles.updateButton}
            onPress={handleSubmit}
            disabled={loading || fetchingLocation}
          >
            {loading ? (
              <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons
                name="reload-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
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

// ============ Header Component ============
const Header = () => {
  const [address, setAddress] = useState(null);
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
        console.log("No token found");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE}/api/vendor/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.user) {
        setAddress(response.data.user.address || {});
      } else {
        console.log("Failed to fetch address");
      }
    } catch (error) {
      console.error("Address fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationUpdate = (updatedData) => {
    setAddress(updatedData);
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
        {/* Left: Location info */}
        <TouchableOpacity
          style={styles.locationWrapper}
          onPress={handleLocationPress}
        >
          <View style={styles.row}>
            <Text style={styles.cityText}>
              {address?.city || "Unknown City"}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color="#000"
              style={{ marginLeft: 4 }}
            />
          </View>
          <Text style={styles.subText}>
            {address?.locality
              ? `${address.locality}, ${address.city}`
              : "Tap to add location"}
          </Text>
        </TouchableOpacity>

        {/* Right: Notification bell */}
        <TouchableOpacity
          style={styles.bellWrapper}
          onPress={handleNotification}
        >
          <Ionicons name="notifications-outline" size={22} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Location Modal */}
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
    fontSize: normalizeFont(13),
    fontWeight: "600",
    color: "#000",
  },
  subText: {
    fontSize: normalizeFont(10),
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
    borderWidth: 2,
    borderColor: "rgba(255, 202, 40, 0.2)",
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
  iconText: {
    fontSize: normalizeFont(22),
    color: "#4CAF50",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: normalizeFont(16),
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
    fontSize: normalizeFont(12),
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
    fontSize: normalizeFont(11),
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
  row: {
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
    fontSize: normalizeFont(12),
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
    fontSize: normalizeFont(12),
    color: "#666",
    marginLeft: moderateScale(10),
  },
  updateButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
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
    fontSize: normalizeFont(14),
    fontWeight: "600",
  },
});