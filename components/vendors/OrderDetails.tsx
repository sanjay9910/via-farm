// OrdersScreen.js
import React, { useEffect, useState } from "react";
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const sampleOrders = [
  {
    id: "12345",
    buyer: "Sanchit Sharma",
    contact: "9999999999",
    item: "Mango (Chausa)",
    quantity: "10kg",
    price: "$1200",
    deliveredAt: "29/09/2025 | 10:30 AM",
    status: "Completed",
  },
  {
    id: "12346",
    buyer: "Sanchit Sharma",
    contact: "9999999999",
    item: "Mango (Chausa)",
    quantity: "10kg",
    price: "$1200",
    deliveredAt: "29/09/2025 | 10:30 AM",
    status: "Completed",
  },
];

// Reusable card component
const OrderCard = ({ order }) => {
  return (
    <View style={styles.cardOuter}>
      {/* Green badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Delivery</Text>
      </View>

      <View style={styles.cardInner}>
        <Text style={styles.orderTitle}>Order#{order.id}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Buyer</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{order.buyer}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Contact No.</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{order.contact}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Item</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{order.item}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Quantity</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{order.quantity}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Price</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{order.price}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Delivered</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{order.deliveredAt}</Text>
        </View>

        <View style={[styles.row, { alignItems: "center", marginTop: 8 }]}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.colon}>:</Text>

          {/* fake dropdown to match UI */}
          <TouchableOpacity style={styles.dropdown}>
            <Text style={styles.dropdownText}>{order.status} ▾</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState(sampleOrders);

  useEffect(() => {
    // --- Replace this with your API call ---
    // Example:
    // fetch('https://your-api.com/orders/today')
    //   .then(res => res.json())
    //   .then(data => setOrders(data))
    //   .catch(err => console.log(err));
    //
    // For now using sampleOrders so UI renders exactly like image.
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Today’s Orders</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See All &gt;</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  seeAll: {
    color: "#0AA1FF",
    fontSize: 13,
  },
  container: {
    paddingHorizontal: 12,
    paddingBottom: 30,
  },

  /* Outer card with yellow border and rounded corners */
  cardOuter: {
    marginTop:15,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#E8B83A", // yellow/gold border
    backgroundColor: "transparent",
    // shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },

  /* inner white area */
  cardInner: {
    borderRadius: 14,
    backgroundColor: "#fff",
    padding: 12,
    paddingTop: 18,
    position: "relative",
  },

badge: {
  position: "absolute",
  right:0,
  top: 10,
  backgroundColor: "#1F9A3F",
  paddingHorizontal: 12,
  paddingVertical: 4,
  borderTopLeftRadius: 10,
  borderBottomLeftRadius: 10,
  borderTopRightRadius: 0,
  borderBottomRightRadius: 0,
  zIndex: 10,
},
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  orderTitle: {
    fontWeight: "700",
    marginBottom: 8,
    fontSize: 14,
    color: "#222",
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 4,
  },
  label: {
    width: 110,
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  colon: {
    width: 10,
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: "#222",
    fontWeight: "600",
  },

  dropdown: {
    borderWidth: 1,
    borderColor: "#E6E6E6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 130,
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
  },
});
