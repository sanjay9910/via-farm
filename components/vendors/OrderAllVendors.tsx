import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import OrderFilter from "../vendors/filter/OrderFilter";
import OrderCard from "./OrderCard";

const API_BASE = "https://viafarm-1.onrender.com";

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
    });

    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      const formattedOrders = res.data.data.map((o) => {
        const products = Array.isArray(o.products) ? o.products : [];

        // build item details properly
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

        // collect unique units
        const uniqueUnits = Array.from(
          new Set(
            products
              .map((p) => p.product?.unit)
              .filter(Boolean)
          )
        ).join(", ") || "N/A";

        // sum total quantity
        const totalQty = products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);

        return {
          id: o._id || o.orderId || "N/A",
          orderId: o.orderId || o._id,
          buyer: o.buyer?.name || "N/A",
          contact: o.buyer?.mobileNumber || o.shippingAddress?.mobileNumber || "N/A",
          item: itemNames, 
          quantity: totalQty.toString(),
          units: uniqueUnits, 
          price: o.totalPrice ? `₹${o.totalPrice}` : "₹0",
          orderType: o.orderType || "N/A",
          paymentMethod: o.paymentMethod || "N/A",
          comments: o.comments || "",
          totalPrice: o.totalPrice || 0,
          deliveredAt: o.createdAt ? new Date(o.createdAt).toLocaleString() : "N/A",
          status: o.orderStatus || "Pending",
          productsRaw: products, 
        };
      });

      setOrders(formattedOrders);
      setFilteredOrders(formattedOrders);
    } else {
      console.log("Failed to fetch orders:", res.data?.message || "Unknown error");
    }
  } catch (error) {
    console.log("Error fetching orders:", error);
  } finally {
    setLoading(false);
  }
};
  // Apply search and filters whenever they change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchText, filters, orders]);

  const applyFiltersAndSearch = () => {
    let result = [...orders];

    // Apply search filter
    if (searchText.trim()) {
      const searchTerm = searchText.toLowerCase().trim();
      result = result.filter(order => 
        order.buyer.toLowerCase().includes(searchTerm) ||
        order.contact.includes(searchTerm) ||
        order.item.toLowerCase().includes(searchTerm)
      );
    }

    // Apply status filter
    if (filters.statusFilter) {
      result = result.filter(order => 
        order.status.toLowerCase().includes(filters.statusFilter.toLowerCase())
      );
    }

    // Apply price range filter
    if (filters.priceRange < 5000) {
      result = result.filter(order => 
        order.totalPrice <= filters.priceRange
      );
    }

    // Apply date filter
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

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'Price - high to low':
          result.sort((a, b) => b.totalPrice - a.totalPrice);
          break;
        case 'Price - low to high':
          result.sort((a, b) => a.totalPrice - b.totalPrice);
          break;
        case 'Newest Arrivals':
          result.sort((a, b) => new Date(b.originalDate) - new Date(a.originalDate));
          break;
        case 'Freshness':
          // Assuming freshness means most recent
          result.sort((a, b) => new Date(b.originalDate) - new Date(a.originalDate));
          break;
        default:
          break;
      }
    }

    setFilteredOrders(result);
  };

  const handleSearchChange = (text) => {
    setSearchText(text);
  };

  const handleFilterApply = (newFilters) => {
    setFilters(newFilters);
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

  return (
    <View style={styles.container}>
      {/* Fixed Header with Search and Filter */}
      <View style={styles.headerContainer}>
        <OrderFilter 
          onSearchChange={handleSearchChange}
          onFilterApply={handleFilterApply}
          searchText={searchText}
        />
      </View>

      {/* Scrollable Orders List */}
      {filteredOrders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.noOrdersText}>
            {searchText || Object.values(filters).some(f => f) 
              ? "No orders match your search/filters" 
              : "No orders found."}
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.ordersContainer}
          showsVerticalScrollIndicator={true}
        >
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff" ,
    marginBottom:60,
  },
  headerContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    zIndex: 10, 
    elevation: 5,
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  scrollView: { 
    flex: 1,
  },
  ordersContainer: { 
    padding: 12, 
    paddingBottom: 20,
    paddingTop: 8, 
  },
  center: { 
    flexDirection:'row', 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor:'#ffff',
  },
  noOrdersText: {
    fontSize:20,
    color: "#666",
    textAlign: "center"
  }
});