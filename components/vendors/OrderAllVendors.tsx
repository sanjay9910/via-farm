// screens/AllOrders.js
import { moderateScale, normalizeFont, scale } from "@/app/Responsive";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, View, } from "react-native";
import OrderCard from "../vendors/OrderCard";
import OrderFilter from "../vendors/filter/OrderFilter";

const API_BASE = "https://viafarm-1.onrender.com";
const { width, height } = Dimensions.get("window");

export default function AllOrders() {
  const [orders, setOrders] = useState([]); 
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({
    sortBy: "",
    priceRange: 5000,
    statusFilter: "",
    dateFilter: ""
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.log("No token found!");
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_BASE}/api/vendor/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      if (res.data && (res.data.success && Array.isArray(res.data.data) || Array.isArray(res.data.orders) || Array.isArray(res.data.data))) {
        const source = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data.orders) ? res.data.orders : res.data.data);
        const formattedOrders = (source || []).map((o) => {
          const products = Array.isArray(o.products) ? o.products : (Array.isArray(o.items) ? o.items : []);

          const itemNames = products.length
            ? products
                .map((p, idx) => {
                  const prod = p.product || {};
                  const name = prod.name || `Product-${idx + 1}`;
                  const unit = prod.unit || "N/A";
                  const qty = p.quantity ?? 0;
                  return `${name} | ${qty} ${unit}`;
                })
                .join(", ")
            : "N/A";

          const uniqueUnits = Array.from(
            new Set(
              products
                .map((p) => p.product?.unit || p.unit)
                .filter(Boolean)
            )
          ).join(", ") || "N/A";

          const totalQty = products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);

          return {
            // primary id used for API calls should be DB _id
            id: o._id || o.id || o.orderId || "N/A",
            orderId: o.orderId || o._id,
            buyer: (o.buyer && (o.buyer.name || o.buyer)) || (o.buyerName || "N/A"),
            contact: (o.buyer && o.buyer.mobileNumber) || o.shippingAddress?.mobileNumber || o.contact || "N/A",
            item: itemNames,
            quantity: totalQty.toString(),
            units: uniqueUnits,
            price: o.totalPrice ? `₹${o.totalPrice}` : "₹0",
            orderType: o.orderType || "N/A",
            paymentMethod: o.paymentMethod || "N/A",
            comments: o.comments || "",
            totalPrice: o.totalPrice || Number(o.total) || 0,
            deliveredAt: o.createdAt ? new Date(o.createdAt).toLocaleString() : "N/A",
            status: o.orderStatus || o.status || "Pending",
            productsRaw: products,
            originalDate: o.createdAt || o.updatedAt || null,
            __updating: false 
          };
        });

        setOrders(formattedOrders);
        setFilteredOrders(formattedOrders);
      } else {
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (error) {
      console.log("Error fetching orders:", error);
      Alert.alert("Error", "Failed to fetch orders. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if (!orderId) {
      console.warn("Missing orderId for status update");
      return;
    }
    const prevOrders = [...orders];
    const optimistic = (list) =>
      list.map((o) => (o.id === orderId ? { ...o, status: newStatus, __updating: true } : o));

    setOrders((prev) => optimistic(prev));
    setFilteredOrders((prev) => optimistic(prev));

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) throw new Error("User token missing");

      const url = `${API_BASE}/api/vendor/orders/${orderId}/update-status`;
      const payload = { status: newStatus };
      const resp = await axios.put(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      });

      if (!(resp && resp.status >= 200 && resp.status < 300 && (resp.data?.success || resp.data))) {
        throw new Error("Unexpected server response");
      }

      const updated = resp.data?.data ?? resp.data ?? {};
      const serverStatus = updated.orderStatus ?? updated.status ?? newStatus;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: serverStatus, __updating: false } : o
        )
      );
      setFilteredOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: serverStatus, __updating: false } : o
        )
      );

    } catch (err) {
      console.error("Status update error:", err);

      // revert to previous state
      setOrders(prevOrders);
      setFilteredOrders(prevOrders);

      // error messaging
      if (err?.response) {
        const status = err.response.status;
        const msg = err.response.data?.message || JSON.stringify(err.response.data);
        console.warn("Axios response status:", status, "data:", msg);
        if (status === 401) {
          Alert.alert("Authentication", "Session expired or unauthorized. Please login again.");
        } else if (status === 403) {
          Alert.alert("Forbidden", "You don't have permission to update this order.");
        } else if (status === 404) {
          Alert.alert("Not Found", "Order endpoint not found. Check server.");
        } else {
          Alert.alert("Update failed", `Server returned ${status}: ${msg}`);
        }
      } else if (err.code === "ECONNABORTED") {
        Alert.alert("Timeout", "Request timed out. Try again.");
      } else {
        Alert.alert("Update failed", err.message || "Could not update order status");
      }
    }
  };

  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchText, filters, orders]);

  const applyFiltersAndSearch = () => {
    let result = [...orders];

    if (searchText.trim()) {
      const searchTerm = searchText.toLowerCase().trim();
      result = result.filter(order =>
        (order.buyer || "").toLowerCase().includes(searchTerm) ||
        (order.contact || "").includes(searchTerm) ||
        (order.item || "").toLowerCase().includes(searchTerm)
      );
    }

    if (filters.statusFilter) {
      result = result.filter(order =>
        (order.status || "").toLowerCase().includes(filters.statusFilter.toLowerCase())
      );
    }

    if (filters.priceRange < 5000) {
      result = result.filter(order =>
        order.totalPrice <= filters.priceRange
      );
    }

    if (filters.dateFilter) {
      const now = new Date();
      let startDate = new Date();

      switch (filters.dateFilter) {
        case 'Today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'Last 7 days':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'Last 30 days':
          startDate.setDate(now.getDate() - 30);
          break;
        case 'Last 3 months':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'Last 6 months':
          startDate.setMonth(now.getMonth() - 6);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        result = result.filter(order => {
          const orderDate = new Date(order.originalDate);
          return orderDate >= startDate;
        });
      }
    }

    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'Price - high to low':
          result.sort((a, b) => b.totalPrice - a.totalPrice);
          break;
        case 'Price - low to high':
          result.sort((a, b) => a.totalPrice - b.totalPrice);
          break;
        case 'Newest Arrivals':
        case 'Freshness':
          result.sort((a, b) => new Date(b.originalDate) - new Date(a.originalDate));
          break;
        default:
          break;
      }
    }

    setFilteredOrders(result);
  };

  const handleSearchChange = (text) => setSearchText(text);
  const handleFilterApply = (newFilters) => setFilters(newFilters);

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

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <OrderFilter
          onSearchChange={handleSearchChange}
          onFilterApply={handleFilterApply}
          searchText={searchText}
        />
      </View>

      {filteredOrders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.noOrdersText}>
            {searchText || Object.values(filters).some(f => f)
              ? " No orders found"
              : "No orders match your search/filters."}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.ordersContainer}
          showsVerticalScrollIndicator={true}
        >
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginBottom: moderateScale(60),
    paddingBottom: moderateScale(8),
  },

  headerContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    zIndex: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(3),
    paddingHorizontal: scale(12),
    paddingVertical: moderateScale(8),
  },

  scrollView: {
    flex: 1,
  },

  ordersContainer: {
    paddingHorizontal: scale(12),
    paddingBottom: moderateScale(20),
    paddingTop: moderateScale(8),
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: scale(12),
  },

  noOrdersText: {
    fontSize: normalizeFont(18),
    color: "#666",
    textAlign: "center",
    lineHeight: normalizeFont(22),
    paddingHorizontal: scale(8),
  },

  listItemFullWidth: {
    width: Math.min(width - scale(24), scale(1100)),
    alignSelf: "center",
  },
});
