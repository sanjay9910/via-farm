// components/OrderCard.js
import React, { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet as RNStyleSheet,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

// Status lists: one for pickup, one for delivery
const PICKUP_STATUS_OPTIONS = [
  "In-process",
  "Confirmed",
  "Ready For Pickup",
  "Completed",
  "Cancelled",
];

const DELIVERY_STATUS_OPTIONS = [
  "In-process",
  "Confirmed",
  "Out For Delivery",
  "Completed",
  "Cancelled",
];

const LABEL_WIDTH = 110;
const COLON_WIDTH = 10;
const CARD_PADDING = 10;

const OrderCard = ({ order = {}, onStatusChange }) => {
  // choose initial status: prefer order.status, fallback to first appropriate option or "Pending"
  const deliveryType = (order.deliveryType || order.orderType || "").toString().toLowerCase();
  const statusList =
    deliveryType === "pickup" || deliveryType === "pick-up" || deliveryType === "pick up"
      ? PICKUP_STATUS_OPTIONS
      : DELIVERY_STATUS_OPTIONS;

  const initialStatus =
    order.status && typeof order.status === "string"
      ? order.status
      : statusList.length
      ? statusList[0]
      : "Pending";

  const [status, setStatus] = useState(initialStatus);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [statusBtnLayout, setStatusBtnLayout] = useState(null);

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
          <Text style={styles.badgeText}>{order.orderType || order.deliveryType || ""}</Text>
        </View>

        <View style={styles.cardInner}>
          <Text style={styles.orderTitle}>{order.orderId || order.id || ""}</Text>

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
                // save layout (relative to cardInner)
                setStatusBtnLayout({ x, y, width, height });
              }}
            >
              <Text style={styles.dropdownText}>{status}</Text>
              <Image
                source={require("../../assets/via-farm-img/icons/downArrow.png")}
                style={styles.arrowIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Inline dropdown panel shown directly under status button */}
          {dropdownVisible && statusBtnLayout && (
            <Pressable style={styles.backdrop} onPress={closeDropdown}>
              <View
                style={[
                  styles.dropdownPanel,
                  {
                    top: statusBtnLayout.y + statusBtnLayout.height + 6, // small gap
                    left: statusBtnLayout.x,
                    width: Math.max(statusBtnLayout.width, 140),
                  },
                ]}
              >
                {statusList.map((opt) => {
                  const isSelected = opt === status;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.optionRow, isSelected && styles.optionSelected]}
                      onPress={() => handleSelectStatus(opt)}
                      activeOpacity={0.7}
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
  wrapper: { paddingHorizontal:5},
  cardOuter: {
    marginTop:15,
    borderRadius:20,
    paddingVertical:2,
    borderWidth:1,
    borderColor: "rgba(255, 202, 40, 1)",
  },
  cardInner: {
    borderRadius:20,
    backgroundColor: "#fff",
    padding: CARD_PADDING,
    position: "relative",
    overflow: "visible",
    zIndex: 0,
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
    zIndex: 10,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  orderTitle: { fontWeight: "700", marginBottom: 6, fontSize: 14, color: "#222" },
  row: { flexDirection: "row", alignItems: "flex-start", marginVertical: 3 },
  label: { width: LABEL_WIDTH, fontSize: 14, color: "#666", },
  colon: { width: COLON_WIDTH, fontSize: 14, color: "#666", fontWeight: "600" },
  value: { flex: 1, fontSize: 14, color: "#222", fontWeight: "600" },

  dropdown: {
    borderWidth: 1,
    borderColor: "#E6E6E6",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "center",
    // gap not supported on all RN versions, use margin on children instead
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 150,
    alignItems: "center",
  },
  dropdownText: { fontSize: 13, color: "#333", fontWeight: "600", marginRight: 6 },
  arrowIcon: { width: 14, height: 14 },

  /* backdrop covers the cardInner so clicks outside dropdownPanel close it */
  backdrop: {
    ...RNStyleSheet.absoluteFillObject,
    // keep transparent, but ensure it sits above card content
    backgroundColor: "transparent",
    zIndex: 998,
  },
  dropdownPanel: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 20,
    zIndex: 999,
    left:10,
  },
  optionRow: { paddingVertical: 10, paddingHorizontal: 8, alignItems: "center" },
  optionSelected: { backgroundColor: "#f1f7ee" },
  optionText: { fontSize: 15, color: "#333", textAlign: "center" },
  optionTextSelected: { color: "#1F9A3F", fontWeight: "700" },
});
