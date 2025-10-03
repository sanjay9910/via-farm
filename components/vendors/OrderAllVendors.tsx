import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import OrderCard from "./OrderCard";

const API_BASE = "https://393rb0pp-5000.inc1.devtunnels.ms";

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.log("No token found!");
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_BASE}/api/vendor/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success && Array.isArray(res.data.data)) {
        // Transform API response to match OrderCard props
        const formattedOrders = res.data.data.map((o) => {
          return {
            _id: o._id,
            id: o.orderId,
            buyer: o.buyer?.name || "N/A",
            contact: o.shippingAddress?.mobileNumber || "N/A",
            item:
              o.products && o.products.length > 0
                ? o.products.map((p) => p.product?.name).join(", ")
                : "N/A",
            quantity:
              o.products && o.products.length > 0
                ? o.products.map((p) => p.quantity).join(", ")
                : "N/A",
            price:
              o.products && o.products.length > 0
                ? o.products.map((p) => `₹${p.price}`).join(", ")
                : `₹${o.totalPrice || 0}`,
            deliveredAt: o.date ? new Date(o.date).toLocaleString() : "N/A",
            status: o.orderStatus || o.status || "N/A",
          };
        });

        setOrders(formattedOrders);
      } else {
        console.log("Failed to fetch orders:", res.data.message || "Unknown error");
      }
    } catch (error) {
      console.log("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No orders found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {orders.map((order) => (
        <OrderCard key={order._id} order={order} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: "#fff",
  },
  container: {
    padding: 12,
    paddingBottom: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
