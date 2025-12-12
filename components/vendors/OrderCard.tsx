import { moderateScale, normalizeFont, scale } from "@/app/Responsive";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  StyleSheet as RNStyleSheet,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width, height } = Dimensions.get("window");
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
  const deliveryType = (order.deliveryType || order.orderType || "").toString().toLowerCase();
  const statusList =
    deliveryType === "pickup" || deliveryType === "pick-up" || deliveryType === "pick up"
      ? PICKUP_STATUS_OPTIONS
      : DELIVERY_STATUS_OPTIONS;

  const initialStatus =
    (order.status && typeof order.status === "string")
      ? order.status
      : (statusList.length ? statusList[0] : "Pending");

  const [status, setStatus] = useState(initialStatus);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [statusBtnLayout, setStatusBtnLayout] = useState(null);

  React.useEffect(() => {
    if (order && order.status && order.status !== status) {
      setStatus(order.status);
    }
  }, [order.status]);

  const openDropdown = () => {
    if (order.__updating) return;
    setDropdownVisible(true);
  };
  const closeDropdown = () => setDropdownVisible(false);

  const handleSelectStatus = (newStatus) => {
    setStatus(newStatus);
    setDropdownVisible(false);

    if (typeof onStatusChange === "function") {
      try {
        onStatusChange(order.id || order.orderId || order._id, newStatus);
      } catch (e) {
        console.warn("onStatusChange error:", e);
      }
    }
  };

  // compute constrained left for dropdown so it doesn't overflow the screen
  const computeDropdownLeft = (btnLayout, panelWidth) => {
    if (!btnLayout) return 8;
    const margin = moderateScale(8);
    const desiredLeft = btnLayout.x;
    const maxLeft = width - panelWidth - margin;
    const clamped = Math.min(Math.max(desiredLeft, margin), Math.max(maxLeft, margin));
    return clamped;
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.cardOuter}>
        <View style={styles.badge}>
          <Text allowFontScaling={false} style={styles.badgeText}>{order.orderType || order.deliveryType || ""}</Text>
        </View>

        <View style={styles.cardInner}>
          <Text allowFontScaling={false} style={styles.orderTitle}>{order.orderId || order.id || ""}</Text>

          <View style={styles.row}>
            <Text allowFontScaling={false} style={styles.label}>Buyer</Text>
            <Text allowFontScaling={false} style={styles.colon}>:</Text>
            <Text allowFontScaling={false} style={styles.value}>{order.buyer}</Text>
          </View>

          <View style={styles.row}>
            <Text allowFontScaling={false} style={styles.label}>Contact No.</Text>
            <Text allowFontScaling={false} style={styles.colon}>:</Text>
            <Text allowFontScaling={false} style={styles.value}>{order.contact}</Text>
          </View>

          <View style={styles.row}>
            <Text allowFontScaling={false} style={styles.label}>Item</Text>
            <Text allowFontScaling={false} style={styles.colon}>:</Text>
            <Text allowFontScaling={false} style={styles.value}>{order.item}</Text>
          </View>

          <View style={styles.row}>
            <Text allowFontScaling={false} style={styles.label}>Price</Text>
            <Text allowFontScaling={false} style={styles.colon}>:</Text>
            <Text allowFontScaling={false} style={styles.value}>{order.price}</Text>
          </View>

          <View style={styles.row}>
            <Text allowFontScaling={false} style={styles.label}>Schedul</Text>
            <Text allowFontScaling={false} style={styles.colon}>:</Text>
            <Text allowFontScaling={false} style={styles.value}>{order.deliveredAt}</Text>
          </View>

          <View style={styles.row}>
            <Text allowFontScaling={false} style={styles.label}>Payment</Text>
            <Text allowFontScaling={false} style={styles.colon}>:</Text>
            <Text allowFontScaling={false} style={styles.value}>{order.paymentMethod}</Text>
          </View>

          <View style={styles.row}>
            <Text allowFontScaling={false} style={styles.label}>Comment</Text>
            <Text allowFontScaling={false} style={styles.colon}>:</Text>
            <Text allowFontScaling={false} style={styles.value}>{order.comments}</Text>
          </View>

          {/* Status row */}
          <View style={[styles.row, { alignItems: "center", marginTop: moderateScale(8) }]}>
            <Text allowFontScaling={false} style={styles.label}>Status</Text>
            <Text allowFontScaling={false} style={styles.colon}>:</Text>

            {/* while updating, show spinner + text */}
            {order.__updating ? (
              <View style={[styles.dropdown, { flexDirection: "row", alignItems: "center" }]}>
                <ActivityIndicator size="small" color="#16a34a" style={{ marginRight: moderateScale(8) }} />
                <Text allowFontScaling={false} style={[styles.dropdownText, { opacity: 0.9 }]}>Updating...</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.dropdown}
                onPress={openDropdown}
                activeOpacity={0.8}
                onLayout={(e) => {
                  const { x, y, width: w, height: h } = e.nativeEvent.layout;
                  setStatusBtnLayout({ x, y, width: w, height: h });
                }}
              >
                <Text allowFontScaling={false} style={styles.dropdownText}>{status}</Text>
                <Image
                  source={require("../../assets/via-farm-img/icons/downArrow.png")}
                  style={styles.arrowIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Inline dropdown panel shown directly under status button */}
          {dropdownVisible && statusBtnLayout && (
            <Pressable style={styles.backdrop} onPress={closeDropdown}>
              {(() => {
                const panelWidth = Math.max(statusBtnLayout.width, moderateScale(140));
                const left = computeDropdownLeft(statusBtnLayout, panelWidth);
                const top = statusBtnLayout.y + statusBtnLayout.height + moderateScale(6);
                // clamp top so panel not go below screen bottom (simple clamp)
                const maxTop = height - moderateScale(48);
                const finalTop = Math.min(top, Math.max(moderateScale(8), maxTop - moderateScale(120)));

                return (
                  <View
                    style={[
                      styles.dropdownPanel,
                      {
                        top: finalTop,
                        left,
                        width: Math.min(panelWidth, Math.min(width - moderateScale(16), scale(420))),
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
                          activeOpacity={0.8}
                        >
                          <Text allowFontScaling={false} style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })()}
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

export default OrderCard;

const styles = StyleSheet.create({
  // wrapper: { paddingHorizontal: moderateScale(5) },

  cardOuter: {
    marginTop: moderateScale(15),
    borderRadius: moderateScale(20),
    paddingVertical: moderateScale(2),
    borderWidth: 1,
    zIndex: 1000,
    borderColor: "rgba(255, 202, 40, 1)",
  },

  cardInner: {
    borderRadius: moderateScale(20),
    backgroundColor: "#fff",
    padding: (typeof CARD_PADDING !== "undefined") ? moderateScale(CARD_PADDING) : moderateScale(12),
    position: "relative",
    overflow: "visible",
    zIndex: 0,
  },

  badge: {
    position: "absolute",
    right: 0,
    top: moderateScale(15),
    backgroundColor: "#1F9A3F",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(4),
    borderTopLeftRadius: moderateScale(10),
    borderBottomLeftRadius: moderateScale(10),
    zIndex: 10,
  },
  badgeText: { color: "#fff", fontSize: normalizeFont(10 + 2), fontWeight: "600" },

  orderTitle: {
    fontWeight: "700",
    marginBottom: moderateScale(6),
    fontSize: normalizeFont(12 + 2),
    color: "#222",
  },

  row: { flexDirection: "row", alignItems: "flex-start", marginVertical: moderateScale(3) },
  label: {
    width: (typeof LABEL_WIDTH !== "undefined") ? scale(LABEL_WIDTH) : scale(100),
    fontSize: normalizeFont(12 + 2),
    color: "#666",
  },
  colon: {
    width: (typeof COLON_WIDTH !== "undefined") ? scale(COLON_WIDTH) : scale(12),
    fontSize: normalizeFont(12 + 2),
    color: "#666",
    fontWeight: "600",
  },
  value: {
    flex: 1,
    fontSize: normalizeFont(12 + 2),
    color: "#222",
    fontWeight: "600",
  },

  dropdown: {
    borderWidth: scale(1),
    borderColor: "#E6E6E6",
    paddingHorizontal: moderateScale(10),
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    minWidth: Math.min(width * 0.32, scale(240)),
    alignItems: "center",
  },
  dropdownText: {
    fontSize: normalizeFont(12 + 2),
    color: "#333",
    fontWeight: "600",
    marginRight: moderateScale(6),
  },
  arrowIcon: { width: moderateScale(14), height: moderateScale(14) },

  backdrop: {
    ...RNStyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 998,
  },

  dropdownPanel: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: moderateScale(5),
    borderWidth: scale(1),
    borderColor: "#E6E6E6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(8),
    elevation: 20,
    zIndex: 999,
    left: moderateScale(10),
    maxWidth: Math.min(width * 0.9, scale(420)),
  },

  optionRow: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(8),
    alignItems: "center",
  },
  optionSelected: {
    backgroundColor: "#f1f7ee",
  },
  optionText: {
    fontSize: normalizeFont(12 + 2),
    color: "#333",
    textAlign: "center",
  },
  optionTextSelected: {
    color: "#1F9A3F",
    fontWeight: "700",
  },
});
