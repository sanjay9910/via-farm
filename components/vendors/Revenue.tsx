import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const API_BASE = "https://393rb0pp-5000.inc1.devtunnels.ms";

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
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", flex:1 }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {stats.map((item, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
};

export default Chart;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 20,
  },
  card: {
    backgroundColor: "#f9f8f3",
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#5c3d2e",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
    marginHorizontal: 5,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
});
