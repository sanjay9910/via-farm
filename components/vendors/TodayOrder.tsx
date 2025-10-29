import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import OrderCard from "./OrderCard"; // path correct hona chahiye

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
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data && res.data.success) {
        const formattedOrders = (res.data.data || []).map((o) => {
          const products = Array.isArray(o.products) ? o.products : [];

          // Build item string: "ProductName (unit) xquantity"
          const itemNames = products.length
            ? products
                .map((p, idx) => {
                  const prod = p.product || {};
                  const name = prod.name || `Product-${idx + 1}`;
                  const unit = prod.unit || "N/A";
                  const qty = p.quantity ?? 0;
                  return `${name} | ${p.quantity} ${unit}`;
                })
                .join(", ")
            : "No products";

          // Total quantity (sum of product quantities)
          const totalQuantity = products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);

          // Units list (comma separated, unique)
          const units = Array.from(
            new Set(
              products
                .map((p) => (p.product && p.product.unit ? p.product.unit : null))
                .filter(Boolean)
            )
          ).join(", ") || "N/A";

          // Delivered / pickup time display
          const deliveredAt = o.pickupSlot
            ? new Date(o.pickupSlot).toLocaleString()
            : o.shippingAddress && o.shippingAddress.createdAt
            ? new Date(o.createdAt || o.updatedAt || o.shippingAddress.updatedAt || o.shippingAddress.createdAt).toLocaleString()
            : "N/A";

          return {
            id: o._id || o.orderId,
            orderId: o.orderId || o._id,
            buyer: o.buyer?.name || "Unknown Buyer",
            contact: o.buyer?.mobileNumber || "N/A",
            item: itemNames,
            orderType: o.orderType || "N/A",
            quantity: totalQuantity.toString(), 
            units, 
               comments: o.comments || "",
            paymentMethod:o.paymentMethod,
            price: `₹${Number(o.totalPrice || 0)}`,
            deliveredAt,
            status: o.orderStatus || "Pending",
            raw: o,
          };
        });

        setOrders(formattedOrders);
      } else {
        console.warn("Orders API response:", res.data);
        Alert.alert("Error", res.data?.message || "Could not fetch orders");
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
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Today’s Orders</Text>
        <TouchableOpacity onPress={fetchOrders}>
          <Text style={styles.seeAll}>Refresh</Text>
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
            <Text style={{ textAlign: "center", marginTop: 20, color: "#666" }}>
              No orders today
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    marginBottom: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  seeAll: { color: "rgba(1, 151, 218, 1)", fontSize: 13 },
  container: { paddingHorizontal: 12, paddingBottom: 30 },
});
