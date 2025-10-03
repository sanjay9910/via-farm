import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import OrderCard from "./OrderCard"; // Make sure path is correct

const API_BASE = "https://393rb0pp-5000.inc1.devtunnels.ms";

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "User not logged in!");
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_BASE}/api/vendor/orders/today`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        const formattedOrders = res.data.data.map((o) => ({
          id: o.orderId,
          buyer: o.buyer.name,
          contact: o.buyer.mobileNumber || "N/A",
          item: o.products
            .map((p) => `${p.product.name} (${p.product.variety})`)
            .join(", "),
          quantity: o.products.map((p) => p.quantity).join(", "),
          price: `$${o.totalPrice}`,
          deliveredAt: o.pickupSlot ? new Date(o.pickupSlot).toLocaleString() : "N/A",
          status: o.orderStatus,
        }));

        setOrders(formattedOrders);
      } else {
        Alert.alert("Error", "Could not fetch orders");
      }
    } catch (error) {
      console.log("Fetch Orders Error:", error);
      Alert.alert("Error", "Something went wrong while fetching orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Today’s Orders</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See All &gt;</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#0AA1FF" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {orders.length > 0 ? (
            orders.map((o) => <OrderCard key={o.id} order={o} />)
          ) : (
            <Text style={{ textAlign: "center", marginTop: 20, color: "#666" }}>No orders today</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 14, marginBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  seeAll: { color: "#0AA1FF", fontSize: 13 },
  container: { paddingHorizontal: 12, paddingBottom: 30 },
});
