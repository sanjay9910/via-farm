// components/OrderCard.js
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const OrderCard = ({ order }) => {
  return (
    <View>
    <View style={styles.cardOuter}>
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
          <TouchableOpacity style={styles.dropdown}>
            <Text style={styles.dropdownText}>{order.status} ▾</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
    </View>
  );
};

export default OrderCard;

// styles yahan bhi same
const styles = StyleSheet.create({
  cardOuter: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#E8B83A",
    backgroundColor: "transparent",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  cardInner: {
    borderRadius: 14,
    backgroundColor: "#fff",
    padding: 10, 

    position: "relative",
  },
  badge: {
    position: "absolute",
    right: 0,
    top: 10, 
    backgroundColor: "#1F9A3F",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    zIndex: 10,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  orderTitle: { fontWeight: "700", marginBottom: 6, fontSize: 14, color: "#222" }, 
  row: { flexDirection: "row", alignItems: "flex-start", marginVertical: 2 }, 
  label: { width: 110, fontSize: 14, color: "#666", fontWeight: "600" },
  colon: { width: 10, fontSize: 14, color: "#666", fontWeight: "600" },
  value: { flex: 1, fontSize: 14, color: "#222", fontWeight: "600" },
  dropdown: { borderWidth: 1, borderColor: "#E6E6E6", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, minWidth: 130, alignItems: "center" },
  dropdownText: { fontSize: 13, color: "#333", fontWeight: "600" },
});
