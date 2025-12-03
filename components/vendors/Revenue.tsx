import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, PixelRatio, StyleSheet, Text, View } from "react-native";

const API_BASE = "https://viafarm-1.onrender.com";
const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { moderateScale, normalizeFont, scale } from "@/app/Responsive";

const Chart = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.log("No token found, login first");
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_BASE}/api/vendor/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        const data = res.data.data || {};
        setStats([
          { label: "All Orders", value: data.totalOrders ?? 0 },
          { label: "All Revenue", value: data.totalRevenueCompleted ?? 0 },
          { label: "Today Orders", value: data.todayOrders ?? 0 },
        ]);
      }
    } catch (error) {
      console.log("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // responsive font helper
  const responsiveFont = (baseSize) => {
    // baseScale relative to guideline width (375)
    const baseScale = SCREEN_WIDTH / 375;
    // clamp so fonts do not become absurdly large or tiny
    const clampedScale = Math.min(Math.max(baseScale, 0.85), 1.45);
    // normalizeFont already applies pixel-ratio adjustments
    const normalized = normalizeFont(baseSize);
    // apply extra clamped scale and round to nearest pixel
    const scaled = Math.round(PixelRatio.roundToNearestPixel(normalized * clampedScale));
    return scaled;
  };

  // dynamic styles that use responsiveFont
  const styles = createStyles(responsiveFont);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.cardsContainer}>
        {stats.map((item, index) => (
          <View key={index} style={styles.card}>
            <Text allowFontScaling={true} style={styles.label}>{item.label}</Text>
            <Text allowFontScaling={true} style={styles.value}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default Chart;

// Create styles using responsiveFont callback
function createStyles(responsiveFont) {
  // sizing tuned to respond to width/height slightly
  const containerPadding = moderateScale(10);
  const cardMinHeight = scale(70);
  const maxContainerWidth = Math.min(scale(500), SCREEN_WIDTH - moderateScale(20));

  return StyleSheet.create({
    mainContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: containerPadding,
      marginTop: moderateScale(5),
    },
    cardsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: '100%',
      maxWidth: maxContainerWidth,
    },
    card: {
      backgroundColor: "#f9f8f3",
      paddingVertical: moderateScale(14),
      borderRadius:moderateScale(12),
      borderWidth: scale(1),
      borderColor: "grey",
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      marginHorizontal: moderateScale(5),
      minHeight: cardMinHeight,
    },
    label: {
      fontSize: responsiveFont(9), 
      color: "#333",
      marginBottom: scale(5),
      textAlign: 'center',
    },
    value: {
      fontSize: responsiveFont(9), 
      fontWeight: "bold",
      color: "#000",
      textAlign: 'center',
    },
    loadingContainer: {
      justifyContent: "center",
      alignItems: "center",
      flex: 1
    },
  });
}
