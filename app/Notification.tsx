import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  PixelRatio,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;
const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;
const normalizeFont = (size) => {
  const newSize = moderateScale(size);
  if (Platform.OS === "ios") {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
};

const BASE_URL = "https://viafarm-1.onrender.com";
const NOTIFICATIONS_ENDPOINT = "/api/notifications";

/* ---------------- NotificationCard ---------------- */
const NotificationCard = ({ item, onPressCta }) => (
  <View style={styles.cardContainer}>
    <View style={styles.cardInner}>
      <Image
        source={require("../assets/via-farm-img/icons/logo.png")}
        style={styles.cardImage}
        resizeMode="cover"
      />

      <View style={styles.cardTextWrap}>
        <View style={styles.rowTop}>
          <Text style={styles.cardDate}>{item.date}</Text>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Text numberOfLines={2} style={styles.cardMessage}>
          {item.message}
        </Text>
      </View>
    </View>
  </View>
);

/* ---------------- Exported Screen ---------------- */
export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  const mapServerNotificationToItem = (n, index) => {
    const baseId = n._id || n.id || `notif-${index}`;
    const id = `${String(baseId)}-${index}`;

    const data = n.data || {};
    const orderId = data.orderId || null;
    const productId = data.productId || null;

    const isOrderNotification = !!orderId;
    const isProductNotification = !!productId;

    console.log(' Notification:', {
      title: n.title,
      orderId,
      productId,
      isOrderNotification,
      isProductNotification,
      action: data.action,
      type: data.type,
    });

    return {
      id,
      rawId: n._id || n.id || null,
      title: n.title || "No title",
      message: n.message || "",
      date: formatDate(n.createdAt),
      image: data.image || n.image || null,
      ctaText: isOrderNotification ? "View Order" : isProductNotification ? "View Product" : null,
      ctaType: isOrderNotification ? "order" : isProductNotification ? "product" : null,
      raw: n,
      parsed: {
        data,
        orderId,
        productId,
      },
    };
  };

  const handleInvalidToken = async () => {
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("userData");
    Alert.alert("Session expired", "Please login again.");
    router.replace("/login");
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      const config = { timeout: 12000, headers: {} };
      if (token) config.headers.Authorization = `Bearer ${token}`;

      let res;
      try {
        res = await axios.get(`${BASE_URL}${NOTIFICATIONS_ENDPOINT}`, config);
      } catch (err) {
        if (err?.response?.status === 401) {
          console.warn("Token invalid (401). Redirecting to login.");
          await handleInvalidToken();
          return;
        }
        throw err;
      }

      const payload = res?.data;
      let arr = [];
      if (payload?.success && Array.isArray(payload.notifications)) {
        arr = payload.notifications;
      } else if (Array.isArray(payload)) {
        arr = payload;
      } else {
        console.warn("Unexpected notifications payload:", payload);
        arr = [];
      }

      const mapped = arr.map((n, idx) => mapServerNotificationToItem(n, idx));
      setNotifications(mapped);
    } catch (err) {
      console.error("fetchNotifications error:", (err && err.message) || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  /* ------------- CTA handler - FIXED FOR API RESPONSE ------------- */
  const handleCta = async (item) => {
    try {
      const { parsed } = item;
      const orderId = parsed?.orderId || null;
      const productId = parsed?.productId || null;

      console.log('🔗 CTA Handler:', {
        ctaType: item.ctaType,
        orderId,
        productId,
      });

      if (item.ctaType === "order" && orderId) {
        console.log('Opening Order:', orderId);
        
        try {
          await router.push({
            pathname: "/ViewOrderProduct",
            params: { 
              orderId: String(orderId),
            },
          });
          return;
        } catch (e) {
          console.warn("Navigation to ViewOrderProduct failed:", e);
          
          // Try alternative routes
          try {
            await router.push(`/OrderDetails?orderId=${encodeURIComponent(orderId)}`);
            return;
          } catch (err) {
            console.warn("OrderDetails route failed:", err);
          }

          try {
            await router.push(`/order/${encodeURIComponent(orderId)}`);
            return;
          } catch (err) {
            console.warn("Order route failed:", err);
          }

          // Show alert with order ID
          Alert.alert("Order Details", `Order ID: ${orderId}`, [{ text: "OK" }]);
          return;
        }
      }

      // ✅ PRODUCT NOTIFICATION - Navigate with productId
      if (item.ctaType === "product" && productId) {
        console.log('Opening Product:', productId);
        
        try {
          await router.push({
            pathname: "/ViewProduct",
            params: { 
              productId: String(productId),
            },
          });
          return;
        } catch (e) {
          console.warn("Navigation to ViewProduct failed:", e);
          
          try {
            await router.push(`/product/${encodeURIComponent(productId)}`);
            return;
          } catch (err) {
            console.warn("Product route failed:", err);
          }

          Alert.alert("Error", "Unable to open product. Please try again.");
          return;
        }
      }

      // Default: no action CTA
      console.log('No actionable CTA for this notification');
      Alert.alert("Info", item?.title ?? "Notification", [{ text: "OK" }]);
    } catch (err) {
      console.error("handleCta error:", err);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={{ color: "#999", fontSize: normalizeFont(14) }}>No notifications yet</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Image
            source={require("../assets/via-farm-img/icons/groupArrow.png")}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: moderateScale(40) }} />
      </View>

      {loading && notifications.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => String(item.id ?? `i-${index}`)}
          contentContainerStyle={[styles.listContent, notifications.length === 0 && { flex: 1 }]}
          renderItem={({ item }) => <NotificationCard item={item} onPressCta={handleCta} />}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    height: moderateScale(60),
    paddingHorizontal: moderateScale(16),
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0,
    backgroundColor: "#fff",
  },
  backIcon: {
    width: moderateScale(22),
    height: moderateScale(22),
  },
  headerTitle: {
    fontSize: normalizeFont(14),
    fontWeight: "700",
    color: "#222",
    textAlign: "center",
  },
  listContent: { padding: moderateScale(16), paddingTop: moderateScale(18), paddingBottom: moderateScale(40) },
  cardContainer: {
    marginBottom: moderateScale(16),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    backgroundColor: "rgba(249, 249, 249, 1)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: moderateScale(6),
    shadowOffset: { width: 0, height: moderateScale(2) },
    elevation: 1,
  },
  cardInner: { flexDirection: "row", padding: moderateScale(10), alignItems: "center" },
  cardImage: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(10),
    marginRight: moderateScale(12),
    backgroundColor: "#f4f4f4",
  },
  cardTextWrap: { flex: 1 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: moderateScale(6) },
  cardTitle: { fontSize: normalizeFont(12), fontWeight: "600", color: "#222", flex: 1, paddingRight: moderateScale(8) },
  cardDate: { fontSize: normalizeFont(11), color: "#9aa0a6", alignSelf: "flex-start" },
  cardMessage: { fontSize: normalizeFont(11), color: "#9a9a9a", marginBottom: moderateScale(10) },
  ctaText: { color: "rgba(76, 175, 80, 1)", fontWeight: "600", marginTop: 0, marginRight: 0, fontSize: normalizeFont(12) },
  empty: { marginTop: moderateScale(40), alignItems: "center" },
});
