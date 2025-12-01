
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { goBack } from "expo-router/build/global-state/routing";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


// ---------- CONFIG ----------
const BASE_URL = "https://viafarm-1.onrender.com"; 
const moderateScale = (v) => Math.round(v); 
const scale = (v) => Math.round(v);
const normalizeFont = (v) => Math.round(v);

// ---------- component ----------
export default function PickupOnlinePayment() {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params || {};
  const orderPayload = params.orderPayload || null;
  const initialAmount = params.amount ?? null;

  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [polling, setPolling] = useState(false);
  const [paid, setPaid] = useState(false);

  const pollRef = useRef(null);
  const attemptsRef = useRef(0);

  const normalizeDate = (d) => {
    if (!d) return d;
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const m = d.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return d;
  };

  // DEBUG wrapper to inspect request & response
  async function createPickupOrderDebug(payload) {
    console.log("→ [DEBUG] POST /api/buyer/pickuporder payload:", JSON.stringify(payload, null, 2));
    try {
      const token = await AsyncStorage.getItem("userToken");
      console.log("→ [DEBUG] token present?:", !!token);
      const res = await axios.post(`${BASE_URL}/api/buyer/pickuporder`, payload, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        timeout: 20000,
      });
      console.log("← [DEBUG] /api/buyer/pickuporder response:", res.status, res.data);
      return res;
    } catch (err) {
      console.error("✖ pickuporder error (full):", err);
      if (err.response) {
        console.error("✖ pickuporder response status:", err.response.status);
        console.error("✖ pickuporder response data:", JSON.stringify(err.response.data, null, 2));
        Alert.alert("Order failed", err.response.data?.message || JSON.stringify(err.response.data));
      } else if (err.request) {
        console.error("✖ pickuporder no response (request):", err.request);
        Alert.alert("Network error", "No response from server. Check your connection.");
      } else {
        console.error("✖ pickuporder other error:", err.message);
        Alert.alert("Error", err.message);
      }
      throw err;
    }
  }

  // Try multiple endpoints for status detection
  const tryEndpointsForStatus = async (id, token, extraUrls = []) => {
    const candidateEndpoints = [
      `${BASE_URL}/api/buyer/orders/${id}/status`,
      `${BASE_URL}/api/buyer/orders/${id}`,
      `${BASE_URL}/api/buyer/orders/status?orderId=${id}`,
      `${BASE_URL}/api/buyer/orders/status/${id}`,
      `${BASE_URL}/api/buyer/orders/${id}/payments`,
      `${BASE_URL}/api/buyer/payments?orderId=${id}`,
      `${BASE_URL}/api/buyer/payments/${id}`,
      `${BASE_URL}/api/orders/${id}/status`,
      `${BASE_URL}/api/orders/${id}`,
      `${BASE_URL}/orders/${id}`,
      `${BASE_URL}/order/${id}`,
    ];

    const allCandidates = [...extraUrls, ...candidateEndpoints];

    for (let i = 0; i < allCandidates.length; i++) {
      const url = allCandidates[i];
      if (!url) continue;
      try {
        const res = await axios.get(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 8000,
        });
        if (res && res.status >= 200 && res.status < 300) return { url, data: res.data };
      } catch (err) {
      }
    }
    return null;
  };

  // detect payment success robustly
  const isPaymentSuccessful = (resData) => {
    if (!resData) return false;
    try {
      const s = (v) => (typeof v === "string" ? v.toLowerCase() : v);
      if (typeof resData.status === "string" && s(resData.status).includes("paid")) return true;
      if (resData.paid === true) return true;
      if (resData.isPaid === true) return true;
      if (resData.payment_confirmed === true) return true;
      if (typeof resData.paymentStatus === "string" && s(resData.paymentStatus).includes("paid")) return true;
      if (resData.success === true && (resData.paid === true || (typeof resData.status === "string" && s(resData.status).includes("paid")))) return true;
      if (resData.data && isPaymentSuccessful(resData.data)) return true;
      if (Array.isArray(resData.payments)) {
        for (const p of resData.payments) if (isPaymentSuccessful(p)) return true;
      }
      if (resData.payment && isPaymentSuccessful(resData.payment)) return true;
    } catch (e) {
      // ignore
    }
    return false;
  };

  useEffect(() => {
    let mounted = true;

    const createPickup = async () => {
      if (!orderPayload) {
        setLoading(false);
        Alert.alert("Error", "Missing order details. Please try again.");
        return;
      }

      setLoading(true);
      setPaymentInfo(null);
      setPolling(false);
      setPaid(false);

      const payload = {
        pickupSlot: {
          date: normalizeDate(orderPayload.pickupSlot?.date),
          startTime: orderPayload.pickupSlot?.startTime,
          endTime: orderPayload.pickupSlot?.endTime,
        },
        paymentMethod:
          (orderPayload.paymentMethod || "UPI").toUpperCase() === "ONLINE"
            ? "UPI"
            : ((orderPayload.paymentMethod || "UPI").toUpperCase() === "UPI" ? "UPI" : (orderPayload.paymentMethod || "UPI")),
      };

      try {
        const res = await createPickupOrderDebug(payload); 
        if (!mounted) return;
        const data = res.data || {};

        if (!data.success) {
          Alert.alert("Order Failed", data.message || "Could not create pickup order.");
          setLoading(false);
          return;
        }

        const pObj = Array.isArray(data.payments) && data.payments.length ? data.payments[0] : (data.payment || null);

        const info = {
          amount: data.amountToPay ?? (pObj && pObj.amount) ?? initialAmount,
          upiId: pObj?.upiId || pObj?.upiID || pObj?.upi_id || null,
          qrCode: pObj?.qrCode || pObj?.qr || data.qrCode || null,
          upiUrl: pObj?.upiUrl || pObj?.upi_url || null,
          orderIds: data.orderIds || (data.orderId ? [data.orderId] : undefined),
          raw: data,
          _discoveredStatusUrls: [],
        };

        const discovered = [];
        const scan = (obj) => {
          if (!obj || typeof obj !== "object") return;
          for (const k of Object.keys(obj)) {
            const v = obj[k];
            if (typeof v === "string" && (v.startsWith("http") || v.includes("/api/"))) {
              const candidate = v.startsWith("http") ? v : `${BASE_URL}${v.startsWith("/") ? "" : "/"}${v}`;
              discovered.push(candidate);
            } else if (typeof v === "object") {
              scan(v);
            }
          }
        };
        scan(data);
        info._discoveredStatusUrls = discovered;

        setPaymentInfo(info);
        setTimeout(() => setPolling(true), 600);
      } catch (err) {
      } finally {
        if (mounted) setLoading(false);
      }
    };

    createPickup();
    return () => {
      mounted = false;
    };
  }, [orderPayload]);

  useEffect(() => {
    if (!paymentInfo) return;

    const orderId = paymentInfo.orderIds ? paymentInfo.orderIds[0] : (paymentInfo._id || paymentInfo.orderId);
    const paymentId = paymentInfo.paymentId || paymentInfo.id;

    const POLL_INTERVAL = 3000;
    const MAX_ATTEMPTS = 40;
    attemptsRef.current = 0;
    setPolling(true);

    const poll = async () => {
      attemptsRef.current += 1;
      if (attemptsRef.current > MAX_ATTEMPTS) {
        if (pollRef.current) clearInterval(pollRef.current);
        setPolling(false);
        return;
      }

      try {
        const token = await AsyncStorage.getItem("userToken");
        const extra = paymentInfo._discoveredStatusUrls ? [...paymentInfo._discoveredStatusUrls] : [];

        if (paymentId) {
          extra.unshift(`${BASE_URL}/api/buyer/payments/${paymentId}`);
          extra.unshift(`${BASE_URL}/api/buyer/payments/${paymentId}/status`);
        }
        if (orderId) {
          extra.unshift(`${BASE_URL}/api/buyer/orders/${orderId}`);
          extra.unshift(`${BASE_URL}/api/buyer/orders/${orderId}/status`);
        }

        const found = await tryEndpointsForStatus(orderId || paymentId, token, extra);
        if (!found) return;

        const data = found.data;
        if (isPaymentSuccessful(data)) {
          setPaid(true);
          setPolling(false);
          if (pollRef.current) clearInterval(pollRef.current);
          Alert.alert("Payment confirmed", "Your payment has been confirmed.");
          return;
        }

        if (data?.payments) {
          for (const p of data.payments) {
            if (isPaymentSuccessful(p)) {
              setPaid(true);
              setPolling(false);
              if (pollRef.current) clearInterval(pollRef.current);
              Alert.alert("Payment confirmed", "Your payment has been confirmed.");
              return;
            }
          }
        }

        const maybeStatus = (data && (data.status || data.paymentStatus || data.message));
        if (maybeStatus && typeof maybeStatus === "string" && maybeStatus.toLowerCase().includes("fail")) {
          if (pollRef.current) clearInterval(pollRef.current);
          setPolling(false);
          Alert.alert("Payment failed", "Payment failed. Try again.");
          return;
        }
      } catch (err) {
        // ignore
      }
    };

    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      setPolling(false);
    };
  }, [paymentInfo]);

  // UI actions
  const openUpi = async (upiUrl) => {
    if (!upiUrl) {
      Alert.alert("No UPI link", "UPI link not provided.");
      return;
    }
    try {
      const supported = await Linking.canOpenURL(upiUrl);
      if (supported) await Linking.openURL(upiUrl);
      else await Linking.openURL(upiUrl);
    } catch (err) {
      console.error("openUpi error", err);
      Alert.alert("Cannot open", "Your device may not support this link.");
    }
  };

  const copyText = async (text) => {
    try {
      if (Clipboard && Clipboard.setStringAsync) await Clipboard.setStringAsync(String(text));
      else if (Clipboard && Clipboard.setString) Clipboard.setString(String(text));
      Alert.alert("Copied", "Copied to clipboard");
    } catch (err) {
      console.error("copy error", err);
      Alert.alert("Copy failed", String(text));
    }
  };



const handlePaymentDone = () => {
  Alert.alert(
    "Confirm Payment",
    "Have you completed the payment?",
    [
      { text: "Not yet", style: "cancel" },
      {
        text: "Yes, I paid",
        onPress: () => {
          setPaid(true);
          setPolling(false);
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          navigation.navigate("index"); // or navigation.replace("index")
        },
      },
    ],
    { cancelable: true }
  );
};


  const downloadQRCode = async () => {
    if (!paymentInfo?.qrCode) {
      Alert.alert("No QR", "QR code not available");
      return;
    }
    try {
      await Share.share({
        message: `Payment to ${paymentInfo.upiId} Amount: ₹${paymentInfo.amount}`,
        url: paymentInfo.qrCode,
        title: "Payment QR",
      });
    } catch (err) {
      Alert.alert("Share", "Try screenshot to save the QR.");
    }
  };


  const goToDonate = () => {
    try {
      navigation.navigate("Donate");
    } catch (err) {
      navigation.goBack();
    }
  };

  // UI rendering
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 12 }}>Generating payment QR...</Text>
      </View>
    );
  }

  if (!paymentInfo) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#d32f2f" }}>No payment info. Please try again.</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { amount, upiId, qrCode, upiUrl } = paymentInfo;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Image source={require("../assets/via-farm-img/icons/groupArrow.png")} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View  />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* QR */}
        {qrCode ? (
          <View style={styles.qrBox}>
            <Image source={{ uri: qrCode }} style={styles.qrImage} />
            <Text style={styles.helper}>Scan this QR code with your UPI app to pay</Text>
          </View>
        ) : (
          <View style={styles.qrBox}>
            <Text style={styles.helper}>QR Code not available</Text>
          </View>
        )}

        {/* Amount */}
        <View style={styles.amountBox}>
          <Text style={{ color: "#6c757d", marginBottom:moderateScale(6) }}>Total Amount</Text>
          <Text style={styles.amount}>₹{amount}</Text>
        </View>

        {/* UPI ID */}
        <View style={styles.upiBox}>
          <Text style={{ color: "#6c757d", fontWeight: "600", marginBottom:moderateScale(8) }}>UPI ID (Manual)</Text>
          <Text style={styles.upiId}>{upiId || "-"}</Text>

          <View style={{ flexDirection: "row", marginTop:moderateScale(12) }}>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => copyText(upiId)}>
              <Text style={{ fontWeight: "600" }}>Copy UPI ID</Text>
            </TouchableOpacity>

            {/* {upiUrl ? (
              <TouchableOpacity style={[styles.btn, { marginLeft:moderateScale(12) }]} onPress={() => openUpi(upiUrl)}>
                <Text style={styles.btnText}>Open UPI App</Text>
              </TouchableOpacity>
            ) : null} */}
          </View>
        </View>

        {/* Action buttons */}
        <TouchableOpacity style={[styles.btn, { marginTop:moderateScale(18), opacity: paid ? 0.6 : 1 }]} onPress={handlePaymentDone} disabled={paid}>
          <Text style={styles.btnText}>{paid ? "✓ Payment Completed" : "I Have Paid"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, { marginTop:moderateScale(12) }]} onPress={goToDonate}>
          <Text style={styles.btnText}>Continue to Donate Page</Text>
        </TouchableOpacity>

        {polling && (
          <View style={{ marginTop:moderateScale(12), alignItems: "center" }}>
            <ActivityIndicator size="small" />
            <Text style={{ marginTop:moderateScale(8) }}>Checking payment status...</Text>
          </View>
        )}

        <View style={{ height:scale(40) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- styles ----------
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerBack: { color: "#2b8aef", fontWeight: "700", width: 60 },
  headerTitle: { fontWeight: "700", fontSize: normalizeFont(16) },
  container: { padding: moderateScale(16), alignItems: "stretch" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: moderateScale(16) },
  title: { fontSize: normalizeFont(18), fontWeight: "700", marginBottom: moderateScale(12) },
  qrBox: { alignItems: "center", padding: moderateScale(16), backgroundColor: "#f8f9fa", borderRadius: moderateScale(12), borderWidth: 1, borderColor: "#e9ecef" },
  qrImage: { width: scale(260), height: scale(260), borderRadius: moderateScale(8), marginBottom: moderateScale(10) },
  helper: { color: "#6c757d", fontSize: normalizeFont(13), textAlign: "center" },
  amountBox: { alignItems: "center", marginTop: moderateScale(18), marginBottom: moderateScale(16) },
  amount: { fontSize: normalizeFont(28), fontWeight: "800", color: "#28a745" },
  upiBox: { backgroundColor: "#fff", padding: moderateScale(14), borderRadius: moderateScale(10), borderWidth: 1, borderColor: "#e9ecef" },
  upiId: { fontFamily: "monospace", backgroundColor: "#fff", padding: moderateScale(8), marginBottom: moderateScale(4), borderRadius: moderateScale(6) },
  btn: { backgroundColor: "#28a745", paddingVertical: moderateScale(12), borderRadius: moderateScale(8), alignItems: "center", marginTop: moderateScale(8),paddingHorizontal:moderateScale(10) },
  btnText: { color: "#fff", fontWeight: "700" },
  outlineBtn: { flex: 1, borderWidth: 1, borderColor: "rgba(0,0,0,0.08)", paddingVertical: moderateScale(12), borderRadius: moderateScale(8), alignItems: "center" },
  button: { padding: moderateScale(12), backgroundColor: "#2b8aef", borderRadius: moderateScale(8), alignItems: "center", marginTop: moderateScale(8) },
});
