import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";
import PromoCard from "../../common/PromCard";

const BASE_URL = "https://393rb0pp-5000.inc1.devtunnels.ms";
const ENDPOINT =
  "/api/admin/public/manage-app/banners/placement/SearchPageAd";


const INTERNAL_API_KEY = ""; // e.g. "12345-internal-key"

const ExploreNow = () => {
  const [banner, setBanner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchBanner = async () => {
      setLoading(true);
      setError(null);

      try {
        // 🔹 1. Get stored token from AsyncStorage
        const token = await AsyncStorage.getItem("userToken");

        // 🔹 2. Prepare headers
        const headers: any = {
          "Content-Type": "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        if (INTERNAL_API_KEY) headers["X-Internal-Api-Key"] = INTERNAL_API_KEY;

        // 🔹 3. Make the API call
        const res = await fetch(BASE_URL + ENDPOINT, {
          headers,
        });

        console.log("Banner fetch status:", res.status);

        // 🔹 4. Handle 401 case cleanly
        if (res.status === 401) {
          throw new Error("Unauthorized: Invalid or expired token.");
        }

        if (!res.ok) {
          throw new Error(`Network error (${res.status})`);
        }

        const json = await res.json();

        if (
          json &&
          json.success &&
          Array.isArray(json.data) &&
          json.data.length > 0
        ) {
          if (!cancelled) setBanner(json.data[0]);
        } else {
          if (!cancelled) setError("No banner found.");
        }
      } catch (err: any) {
        console.error("Banner fetch error:", err.message);
        if (!cancelled)
          setError(err.message || "Error loading banner. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBanner();

    return () => {
      cancelled = true;
    };
  }, []);

  const handlePress = () => {
    if (banner && banner.link) {
      Linking.openURL(banner.link).catch(() =>
        Alert.alert("Error", "Could not open link")
      );
    } else {
      Alert.alert("No link", "This banner does not have a valid link.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!banner) {
    return (
      <View style={styles.center}>
        <Text style={styles.infoText}>No banner available.</Text>
      </View>
    );
  }

  return (
    <PromoCard
      image={banner.imageUrl || ""}
      title={banner.title || "Special Offer"}
      buttonText="Get Now"
      onPress={handlePress}
    />
  );
};

export default ExploreNow;

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
  infoText: {
    color: "#666",
    textAlign: "center",
  },
});
