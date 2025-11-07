// app/Notification.tsx (fixed JS version — no TS annotations, ctaText font fixed)
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
// guideline based on iPhone X (375 x 812)
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

        {item.ctaText ? (
          <TouchableOpacity onPress={() => onPressCta(item)} activeOpacity={0.7}>
            <Text style={styles.ctaText}>
              {item.ctaText} <Text style={{ fontSize: normalizeFont(16) }}>→</Text>
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  </View>
);

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
    return {
      id,
      rawId: n._id || n.id || null,
      title: n.title || "No title",
      message: n.message || "",
      date: formatDate(n.createdAt),
      image: (n.data && n.data.image) || n.image || null,
      ctaText: n.data && n.data.orderIds ? "View Order" : null,
      ctaType: n.data && n.data.orderIds ? "order" : null,
      raw: n,
    };
  };

  const handleInvalidToken = async () => {
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("userData");
    Alert.alert("Session expired", "Please login again.");
    router.push("/login");
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

  const handleCta = (item) => {
    if (item.ctaType === "order") {
      const orderIds = item.raw?.data?.orderIds ?? [];
      if (orderIds.length > 0) {
        console.log("Open order:", orderIds[0]);
      }
    } else {
      console.log("CTA clicked:", item);
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
        <TouchableOpacity onPress={() => router.back()}>
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
          contentContainerStyle={styles.listContent}
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
