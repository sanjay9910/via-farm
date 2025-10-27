// components/OrderCard.js
import React, { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const STATUS_OPTIONS = ["Completed", "Pending", "Cancelled", "In-process"];
const LABEL_WIDTH = 110; // same as styles.label width
const COLON_WIDTH = 10; // same as styles.colon width
const CARD_PADDING = 10; // same as cardInner padding

const OrderCard = ({ order, onStatusChange }) => {
  const [status, setStatus] = useState(order.status || "Pending");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [statusBtnLayout, setStatusBtnLayout] = useState(null); // { x, y, width, height }

  const openDropdown = () => setDropdownVisible(true);
  const closeDropdown = () => setDropdownVisible(false);

  const handleSelectStatus = (newStatus) => {
    setStatus(newStatus);
    setDropdownVisible(false);

    if (typeof onStatusChange === "function") {
      try {
        onStatusChange(order.orderId || order.id || order._id, newStatus);
      } catch (e) {
        console.warn("onStatusChange error:", e);
      }
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.cardOuter}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{order.orderType}</Text>
        </View>

        <View style={styles.cardInner}>
          <Text style={styles.orderTitle}>{order.orderId}</Text>

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
            <Text style={styles.label}>Price</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{order.price}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Schedul</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{order.deliveredAt}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Payment</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{order.paymentMethod}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Comment</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{order.comments}</Text>
          </View>

          {/* Status row */}
          <View style={[styles.row, { alignItems: "center", marginTop: 8 }]}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.colon}>:</Text>

            <TouchableOpacity
              style={styles.dropdown}
              onPress={openDropdown}
              activeOpacity={0.8}
              onLayout={(e) => {
                const { x, y, width, height } = e.nativeEvent.layout;
                setStatusBtnLayout({ x, y, width, height });
              }}
            >
              <Text style={styles.dropdownText}>{status}</Text> 
              <Text><Image source={require('../../assets/via-farm-img/icons/downArrow.png')} /></Text>
            </TouchableOpacity>
          </View>

          {/* Inline dropdown panel shown directly under status button */}
          {dropdownVisible && statusBtnLayout && (
            <Pressable style={styles.backdrop} onPress={closeDropdown}>
              <View
                style={[
                  styles.dropdownPanel,
                  {
                    // position relative to the cardInner: place just below the status button
                    top: statusBtnLayout.y + statusBtnLayout.height + 4, // 4px gap
                    left: statusBtnLayout.x, // align left edge to button's left
                    width: statusBtnLayout.width, // match button width
                  },
                ]}
              >
                {STATUS_OPTIONS.map((opt) => {
                  const isSelected = opt === status;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.optionRow, isSelected && styles.optionSelected]}
                      onPress={() => handleSelectStatus(opt)}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

export default OrderCard;

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 12 },
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
    padding: CARD_PADDING,
    position: "relative",
    overflow: "visible", 
    zIndex:0,
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
  label: { width: LABEL_WIDTH, fontSize: 14, color: "#666", fontWeight: "600" },
  colon: { width: COLON_WIDTH, fontSize: 14, color: "#666", fontWeight: "600" },
  value: { flex: 1, fontSize: 14, color: "#222", fontWeight: "600" },

  dropdown: {
    borderWidth: 1,
    borderColor: "#E6E6E6",
    paddingHorizontal: 10,
    flexDirection:'row',
    alignContent:'center',
    justifyContent:'center',
    gap:5,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 130,
    alignItems: "center",
  },
  dropdownText: { fontSize: 13, color: "#333", fontWeight: "600" },

  /* Inline dropdown panel (absolute inside cardInner) */
  backdrop: {
    position: "absolute",
    top:20,
    left:10,
    right:0,
    bottom:0,
  },
  dropdownPanel: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius:5,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 20, 
    zIndex: 9999,
  },
  optionRow: { paddingVertical: 10, paddingHorizontal: 12, alignItems: "center" },
  optionSelected: { backgroundColor: "#f1f7ee" },
  optionText: { fontSize: 15, color: "#333", textAlign: "center" },
  optionTextSelected: { color: "#1F9A3F", fontWeight: "700" },
});
