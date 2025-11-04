import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import OrderCard from "./OrderCard"; // path correct hona chahiye

const API_BASE = "https://viafarm-1.onrender.com";

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
        timeout: 10000,
      });

      if (res.data && (res.data.success || res.data.data || Array.isArray(res.data))) {
        const source = res.data.data ?? res.data.orders ?? res.data;
        const formattedOrders = (source || []).map((o) => {
          const products = Array.isArray(o.products) ? o.products : (Array.isArray(o.items) ? o.items : []);

          const itemNames = products.length
            ? products
                .map((p, idx) => {
                  const prod = p.product || {};
                  const name = prod.name || `Product-${idx + 1}`;
                  const unit = prod.unit || prod?.unit || "N/A";
                  const qty = p.quantity ?? 0;
                  return `${name} | ${qty} ${unit}`;
                })
                .join(", ")
            : "No products";

          const totalQuantity = products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);

          const units = Array.from(
            new Set(
              products
                .map((p) => (p.product && p.product.unit ? p.product.unit : null))
                .filter(Boolean)
            )
          ).join(", ") || "N/A";

          const deliveredAt = o.pickupSlot
            ? (o.pickupSlot.date ? `${o.pickupSlot.date} ${o.pickupSlot.startTime ?? ""}` : String(o.pickupSlot))
            : (o.createdAt ? new Date(o.createdAt).toLocaleString() : "N/A");

          return {
            id: o._id || o.id || o.orderId || `${Math.random().toString(36).slice(2, 9)}`,
            orderId: o.orderId || o._id,
            buyer: o.buyer?.name || (typeof o.buyer === 'string' ? o.buyer : "Unknown Buyer"),
            contact: o.buyer?.mobileNumber || o.shippingAddress?.mobileNumber || o.contact || "N/A",
            item: itemNames,
            orderType: o.orderType || "N/A",
            quantity: totalQuantity.toString(),
            units,
            comments: o.comments || "",
            paymentMethod: o.paymentMethod || "N/A",
            price: `₹${Number(o.totalPrice || o.total || 0)}`,
            deliveredAt,
            status: o.orderStatus || o.status || "Pending",
            raw: o,
            __updating: false, // used to show spinner on a particular order while updating
          };
        });

        setOrders(formattedOrders);
      } else {
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

  // Status update flow: optimistic update + PATCH to backend
  const handleStatusChange = async (orderId, newStatus) => {
    if (!orderId) {
      console.warn("Missing orderId for status update");
      return;
    }

    // Snapshot to revert on failure
    const prevOrders = [...orders];

    // Optimistic update
    const optimistic = (list) =>
      list.map((o) => (o.id === orderId ? { ...o, status: newStatus, __updating: true } : o));

    setOrders((prev) => optimistic(prev));

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) throw new Error("User token missing");

      const candidateUrls = [
        `${API_BASE}/api/vendor/orders/${orderId}/update-status`,
        `${API_BASE}/api/vendor/orders/${orderId}/status`,
        `${API_BASE}/api/vendor/orders/${orderId}`,
        `${API_BASE}/api/orders/${orderId}/update-status`,
        `${API_BASE}/api/orders/${orderId}`,
      ];

      const payload = { status: newStatus };
      let lastErr = null;
      let successfulResp = null;
      let usedUrl = null;

      for (let i = 0; i < candidateUrls.length; i++) {
        const url = candidateUrls[i];
        try {
          // console.log("[StatusUpdate] Trying PATCH", url, "payload:", JSON.stringify(payload));
          const resp = await axios.put(url, payload, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            timeout: 10000,
          });

          if (resp && resp.status >= 200 && resp.status < 300) {
            successfulResp = resp;
            usedUrl = url;
            break;
          } else {
            lastErr = new Error(`Non-2xx response ${resp?.status}`);
          }
        } catch (err) {
          lastErr = err;
          if (err?.response?.status === 404) {
            console.warn(`[StatusUpdate] ${url} returned 404 — trying next candidate`);
            continue;
          } else {
            console.warn(`[StatusUpdate] ${url} failed:`, err?.response?.status ?? err.message);
            continue;
          }
        }
      }

      if (!successfulResp) throw lastErr || new Error("All endpoint attempts failed");

      // console.log("[StatusUpdate] Success from", usedUrl, successfulResp.status, successfulResp.data);

      const updated = successfulResp.data?.data ?? successfulResp.data ?? {};
      const serverStatus = updated.orderStatus ?? updated.status ?? newStatus;

      // Apply server-confirmed status and clear updating flag
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: serverStatus, __updating: false } : o)));
    } catch (err) {
      console.error("Status update error:", err);

      // revert
      setOrders(prevOrders);

      // user-friendly alerts
      if (err?.response) {
        const st = err.response.status;
        const data = err.response.data;
        if (st === 401) {
          Alert.alert("Authentication", "Session expired or unauthorized. Please login again.");
        } else if (st === 403) {
          Alert.alert("Forbidden", "You don't have permission to update this order.");
        } else if (st === 404) {
          Alert.alert("Not Found", "Order endpoint not found (404). Check order id and backend route.");
        } else {
          Alert.alert("Update failed", `Server returned ${st}: ${data?.message || JSON.stringify(data)}`);
        }
      } else if (err.code === "ECONNABORTED") {
        Alert.alert("Timeout", "Request timed out. Try again.");
      } else {
        Alert.alert("Update failed", err.message || "Could not update order status");
      }
    }
  };

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
            orders.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                onStatusChange={handleStatusChange} 
              />
            ))
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