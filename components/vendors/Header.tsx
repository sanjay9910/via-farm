import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const API_BASE = "https://393rb0pp-5000.inc1.devtunnels.ms";
const API_ENDPOINT = "/api/vendor/update-location";

const Header = () => {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);
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

      const response = await axios.get(`${API_BASE}${API_ENDPOINT}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.data.address) {
        setAddress(response.data.data.address);
      } else {
        Alert.alert("Error", "Failed to fetch address details");
      }
    } catch (error) {
      console.error("Address fetch error:", error);
      Alert.alert("Error", "Unable to fetch vendor address");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  }

  const notification = ()=>{
    navigation.navigate('Notification')
  }

  return (
    <View style={styles.container}>
      {/* Left: Location info */}
      <View>
        <View style={styles.row}>
          <Text style={styles.cityText}>
            {address?.city || "Unknown City"}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#000" style={{ marginLeft: 4 }} />
        </View>
        <Text style={styles.subText}>
          {address?.locality
            ? `${address.locality}, ${address.city}`
            : "No locality info"}
        </Text>
      </View>

      {/* Right: Notification bell */}
      <TouchableOpacity style={styles.bellWrapper} onPress={notification}>
        <Ionicons name="notifications-outline" size={22} color="#555" />
      </TouchableOpacity>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  cityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  subText: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
  },
  bellWrapper: {
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 50,
  },
});
