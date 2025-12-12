// Chart.jsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View
} from "react-native";

const API_BASE = "https://viafarm-1.onrender.com";

import { moderateScale, normalizeFont } from "@/app/Responsive";

const Chart = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));
  const mountedRef = useRef(true);

  // Track screen dimension changes
  useEffect(() => {
    mountedRef.current = true;
    const handler = ({ window }) => {
      if (mountedRef.current) setDimensions(window);
    };

    // Dimensions API shape differs between RN versions; use addEventListener when available
    const sub =
      typeof Dimensions.addEventListener === "function"
        ? Dimensions.addEventListener("change", handler)
        : Dimensions?.addListener?.("change", handler);

    return () => {
      mountedRef.current = false;
      try {
        // cleanup both possible subscription shapes
        if (sub && typeof sub.remove === "function") sub.remove();
        else if (typeof Dimensions.removeEventListener === "function")
          Dimensions.removeEventListener("change", handler);
      } catch (err) {
        // ignore cleanup errors
      }
    };
  }, []);

  const fetchDashboard = async () => {
    try {
      if (!mountedRef.current) return;
      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        // safe defaults when not logged in
        if (mountedRef.current) {
          setStats([
            { label: "All Orders", value: 0 },
            { label: "All Revenue", value: 0 },
            { label: "Today Orders", value: 0 },
          ]);
        }
        return;
      }

      const res = await axios.get(`${API_BASE}/api/vendor/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });

      const data = res?.data?.data ?? res?.data ?? {};
      if (mountedRef.current) {
        setStats([
          {
            label: "All Orders",
            value: Number(data.totalOrders ?? data.totalOrdersCompleted ?? 0),
          },
          {
            label: "All Revenue",
            value: Number(data.totalRevenueCompleted ?? data.totalRevenue ?? 0),
          },
          { label: "Today Orders", value: Number(data.todayOrders ?? 0) },
        ]);
      }
    } catch (error) {
      console.log("Error fetching dashboard:", error?.message ?? error);
      if (mountedRef.current) {
        // fallback safe defaults
        setStats([
          { label: "All Orders", value: 0 },
          { label: "All Revenue", value: 0 },
          { label: "Today Orders", value: 0 },
        ]);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Ensure at least 3 cards shown
  const cards =
    stats && stats.length > 0
      ? stats
      : [
          { label: "All Orders", value: 0 },
          { label: "All Revenue", value: 0 },
          { label: "Today Orders", value: 0 },
        ];

  // Format number nicely
  const formatValue = (item) => {
    if (String(item.label).toLowerCase().includes("revenue")) {
      const num = Number(item.value || 0);
      return `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    }
    return String(item.value ?? 0).toLocaleString();
  };

  // Determine if screen is very small
  const screenWidth = dimensions.width;
  const isVerySmall = screenWidth < 320;
  const isSmall = screenWidth < 360;

  return (
    <View style={styles.mainContainer}>
      <View style={styles.cardsContainer}>
        {cards.map((item, index) => (
          <View
            key={index}
            style={[
              styles.card,
              isVerySmall && styles.cardVerySmall,
              isSmall && !isVerySmall && styles.cardSmall,
            ]}
          >
            <Text
              style={[
                styles.label,
                isVerySmall && styles.labelVerySmall,
                isSmall && !isVerySmall && styles.labelSmall,
              ]}
              numberOfLines={1}
              allowFontScaling={false}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              ellipsizeMode="tail"
            >
              {item.label}
            </Text>

            <Text
              style={[
                styles.value,
                isVerySmall && styles.valueVerySmall,
                isSmall && !isVerySmall && styles.valueSmall,
              ]}
              numberOfLines={1}
              allowFontScaling={false}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              ellipsizeMode="tail"
            >
              {formatValue(item)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default Chart;

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
  },
  cardsContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    // gap isn't supported on some RN versions; use margin on card instead
  },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "rgba(252, 251, 246, 1)",
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(8),
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(108, 59, 28, 1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(3),
    elevation: 2,
    overflow: "hidden",
    marginHorizontal: moderateScale(4),
  },
  cardVerySmall: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(4),
  },
  cardSmall: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(6),
  },
  label: {
    fontSize: normalizeFont(12),
    color: "#555",
    marginBottom: moderateScale(6),
    textAlign: "center",
    lineHeight: normalizeFont(11),
    fontWeight: "500",
    flexShrink: 1,
    minWidth: 0,
  },
  labelVerySmall: {
    fontSize: normalizeFont(10),
    marginBottom: moderateScale(4),
    lineHeight: normalizeFont(12),
  },
  labelSmall: {
    fontSize: normalizeFont(11),
    marginBottom: moderateScale(5),
    lineHeight: normalizeFont(11),
  },
  value: {
    fontSize: normalizeFont(13),
    fontWeight: "700",
    color: "#222",
    textAlign: "center",
    flexShrink: 1,
    minWidth: 0,
  },
  valueVerySmall: {
    fontSize: normalizeFont(12),
    fontWeight: "600",
  },
  valueSmall: {
    fontSize: normalizeFont(14),
    fontWeight: "600",
  },
  loadingContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: moderateScale(30),
  },
  loadingText: {
    fontSize: normalizeFont(12),
    color: "#666",
    marginTop: moderateScale(8),
  },
});
