import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from "react-native";

const API_BASE = "https://viafarm-1.onrender.com";
const { width } = Dimensions.get('window');

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

      if (res.data.success) {
        const data = res.data.data;
        setStats([
          { label: "All Orders", value: data.totalOrders },
          { label: "All Revenue", value: `${data.totalRevenueCompleted}` },
          { label: "Today Orders", value: data.todayOrders },
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
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default Chart;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal:moderateScale(10),
    marginTop: moderateScale(20),
  },
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: '100%',
    maxWidth: scale(500), 
  },
  card: {
    backgroundColor: "#f9f8f3",
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(10),
    borderRadius: 12,
    borderWidth: scale(1),
    borderColor: "#5c3d2e",
    alignItems: "center",
    justifyContent: "center",
    flex: 1, 
    marginHorizontal: moderateScale(5),
    minHeight: scale(70), 
  },
  label: {
    fontSize:normalizeFont(12), 
    color: "#333",
    marginBottom: scale(5),
    textAlign: 'center',
  },
  value: {
    fontSize:normalizeFont(12), 
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