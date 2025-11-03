import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Clipboard,
    Image,
    Modal,
    ScrollView,
    Share,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const API_BASE = "https://viafarm-1.onrender.com";

export default function PaymentScreen({ route, navigation }) {
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [polling, setPolling] = useState(false);

  const pollRef = useRef(null);
  const attemptsRef = useRef(0);
  const successTimeoutRef = useRef(null);

  const { addressId, deliveryType, comments, paymentMethod } = route?.params || {};

  // robust success detector
  const isPaymentSuccessful = (resData) => {
    if (!resData) return false;
    try {
      if (typeof resData.status === "string" && resData.status.toLowerCase().includes("paid")) return true;
      if (resData.paid === true) return true;
      if (resData.isPaid === true) return true;
      if (resData.payment_confirmed === true) return true;
      if (typeof resData.paymentStatus === "string" && resData.paymentStatus.toLowerCase().includes("paid")) return true;
      if (resData.success === true && (resData.paid === true || (typeof resData.status === "string" && resData.status.toLowerCase().includes("paid")))) return true;
      if (resData.data && isPaymentSuccessful(resData.data)) return true;
    } catch (e) {
      // ignore
    }
    return false;
  };

  // show modal then navigate after 3s — uses navigation.reset for reliability
  const showSuccessThenNavigate = () => {
    // clear polling
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    // clear previous timeout
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);

    console.log("Payment success detected -> showing modal and will navigate in 3s");
    setShowSuccessModal(true);

    // 3s delay then reset navigation to Donate
    successTimeoutRef.current = setTimeout(() => {
      setShowSuccessModal(false);
      // reset navigation stack to Donate screen (replace whole stack)
      try {
        navigation.reset({
          index: 0,
          routes: [{ name: "Donate" }],
        });
      } catch (err) {
        // fallback to replace if reset fails for any reason
        navigation.replace("Donate");
      }
    }, 3000);
  };

  // try candidate endpoints (and given URLs) until one returns 2xx
  const tryEndpointsForStatus = async (orderId, token, extraUrls = []) => {
    const candidateEndpoints = [
      `${API_BASE}/api/buyer/orders/${orderId}/status`,
      `${API_BASE}/api/buyer/orders/${orderId}`,
      `${API_BASE}/api/buyer/orders/status?orderId=${orderId}`,
      `${API_BASE}/api/buyer/orders/status/${orderId}`,
      `${API_BASE}/api/buyer/orders/${orderId}/payments`,
      `${API_BASE}/api/buyer/payments?orderId=${orderId}`,
      `${API_BASE}/api/orders/${orderId}/status`,
      `${API_BASE}/api/orders/${orderId}`,
      `${API_BASE}/orders/${orderId}`,
      `${API_BASE}/order/${orderId}`,
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
        if (res && res.status >= 200 && res.status < 300) {
          return { url, data: res.data };
        }
      } catch (err) {
        // skip HTML 404 pages and continue
        console.log(`tryEndpointsForStatus: tried ${url} ->`, err?.response?.status, err?.response?.data || err?.message);
      }
    }
    return null;
  };

  // Create order & get QR — and immediately check for any embedded success indicators or URLs
  useEffect(() => {
    let mounted = true;
    const createOrderAndGetQR = async () => {
      try {
        const body = {
          deliveryType: deliveryType || "Delivery",
          addressId: addressId || "68ee30dbe5123aab550b6828",
          comments: comments || "Deliver before 8 PM please",
          paymentMethod: paymentMethod || "UPI",
        };

        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          Alert.alert("Error", "Please login again.");
          if (mounted) setLoading(false);
          return;
        }

        const response = await axios.post(`${API_BASE}/api/buyer/orders/place`, body, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });

        console.log("createOrder response (full):", response.data);

        // If response contains direct success info, act immediately
        if (isPaymentSuccessful(response.data)) {
          if (mounted) {
            setPaymentInfo(response.data?.payments?.[0] || response.data);
            showSuccessThenNavigate();
            setLoading(false);
            return;
          }
        }

        // set paymentInfo if present (payments array or payment object)
        const pInfo = response.data?.payments?.length ? response.data.payments[0] : (response.data.payment || response.data);
        if (mounted && pInfo) setPaymentInfo(pInfo);

        // store array of possible URLs found inside response to try first during polling
        const discoveredUrls = [];
        const scanObjectForUrls = (obj) => {
          if (!obj || typeof obj !== "object") return;
          for (const k of Object.keys(obj)) {
            const v = obj[k];
            if (typeof v === "string" && (v.startsWith("http") || v.includes("/api/"))) {
              const candidate = v.startsWith("http") ? v : `${API_BASE}${v.startsWith("/") ? "" : "/"}${v}`;
              discoveredUrls.push(candidate);
            } else if (typeof v === "object") {
              scanObjectForUrls(v);
            }
          }
        };
        scanObjectForUrls(response.data);

        if (mounted && pInfo) {
          pInfo._discoveredStatusUrls = discoveredUrls;
          setPaymentInfo({ ...pInfo });
        }

        if (!pInfo) {
          Alert.alert("Error", "Unable to get payment details from server response. Check console logs.");
        }
      } catch (error) {
        console.log("createOrder error:", error?.response?.data || error.message);
        Alert.alert("Error", "Failed to create order");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    createOrderAndGetQR();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressId, deliveryType, comments, paymentMethod]);

  // Polling effect — uses discovered URLs first, then fallback list
  useEffect(() => {
    const orderId = paymentInfo?.orderId || paymentInfo?._id || paymentInfo?.id;
    if (!orderId && !paymentInfo) return;

    const MAX_POLL_ATTEMPTS = 40;
    const POLL_INTERVAL_MS = 3000;

    attemptsRef.current = 0;
    setPolling(true);

    const poll = async () => {
      if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
        if (pollRef.current) clearInterval(pollRef.current);
        setPolling(false);
        return;
      }
      attemptsRef.current += 1;

      try {
        const token = await AsyncStorage.getItem("userToken");

        const extra = paymentInfo?._discoveredStatusUrls || [];
        if (paymentInfo?.paymentId) {
          extra.unshift(`${API_BASE}/api/buyer/payments/${paymentInfo.paymentId}`);
          extra.unshift(`${API_BASE}/api/buyer/payments/${paymentInfo.paymentId}/status`);
        }

        const found = await tryEndpointsForStatus(orderId, token, extra);

        if (!found) {
          console.log("poll: no matched endpoint yet (attempt " + attemptsRef.current + ")");
          return;
        }

        console.log("poll matched endpoint:", found.url, found.data);

        if (isPaymentSuccessful(found.data)) {
          // ensure only one navigation flow
          showSuccessThenNavigate();
          return;
        }

        const maybeStatus = (found.data && (found.data.status || found.data.paymentStatus || found.data.message));
        if (maybeStatus && typeof maybeStatus === "string" && maybeStatus.toLowerCase().includes("fail")) {
          if (pollRef.current) clearInterval(pollRef.current);
          setPolling(false);
          Alert.alert("Payment failed", "Backend reports payment failed. Please try again.");
          return;
        }
      } catch (err) {
        console.log("poll generic error:", err?.response?.data || err?.message);
      }
    };

    // start polling
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    poll();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      setPolling(false);
    };
  }, [paymentInfo]);

  // manual verify — uses same tryEndpointsForStatus
  const manualVerifyNow = async () => {
    const orderId = paymentInfo?.orderId || paymentInfo?._id || paymentInfo?.id;
    if (!orderId && !paymentInfo) {
      Alert.alert("Error", "Order ID not available");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("userToken");
      const extra = paymentInfo?._discoveredStatusUrls || [];
      if (paymentInfo?.paymentId) {
        extra.unshift(`${API_BASE}/api/buyer/payments/${paymentInfo.paymentId}`);
        extra.unshift(`${API_BASE}/api/buyer/payments/${paymentInfo.paymentId}/status`);
      }

      const found = await tryEndpointsForStatus(orderId, token, extra);
      if (!found) {
        Alert.alert("Not Found", "Could not find a status endpoint for this order. Check console logs for create-order response keys/URLs.");
        return;
      }

      console.log("manual verify matched endpoint:", found.url, found.data);

      if (isPaymentSuccessful(found.data)) {
        showSuccessThenNavigate();
      } else {
        const backendMsg = found.data?.message || found.data?.status || found.data?.paymentStatus || JSON.stringify(found.data);
        Alert.alert("Not Paid Yet", backendMsg.toString());
      }
    } catch (err) {
      console.log("manual verify error:", err?.response?.data || err?.message);
      Alert.alert("Error", "Failed to verify payment. Check console logs.");
    }
  };

  // copy to clipboard
  const copyToClipboard = (text) => {
    try {
      Clipboard.setString(text);
      Alert.alert("Copied!", "UPI ID copied to clipboard");
    } catch (err) {
      Alert.alert("Copied!", text);
    }
  };

  // share QR
  const downloadQRCode = async () => {
    if (!paymentInfo?.qrCode) {
      Alert.alert("Error", "QR Code not available");
      return;
    }
    try {
      await Share.share({
        message: `UPI Payment Details:\nUPI ID: ${paymentInfo.upiId}\nAmount: ₹${paymentInfo.amount}`,
        url: paymentInfo.qrCode,
        title: "Payment QR Code",
      });
    } catch (error) {
      Alert.alert("Download QR Code", "Please take a screenshot to save the QR code");
    }
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 10, fontSize: 16 }}>Generating payment QR...</Text>
      </View>
    );
  }

  if (!paymentInfo) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ fontSize: 16, color: "#d32f2f" }}>No payment info found</Text>
      </View>
    );
  }

  const { amount, upiId, qrCode } = paymentInfo;

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 30, color: "#000" }}>Payment</Text>

      {qrCode ? (
        <View style={{ alignItems: "center", marginBottom: 30 }}>
          <Image source={{ uri: qrCode }} style={{ width: 280, height: 280, borderRadius: 12, borderWidth: 1, borderColor: "#dee2e6" }} />
        </View>
      ) : (
        <View style={{ alignItems: "center", marginBottom: 30, padding: 40, backgroundColor: "#f8f9fa", borderRadius: 12 }}>
          <Text style={{ color: "#6c757d", fontSize: 16 }}>QR Code not available</Text>
        </View>
      )}

      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 12 }}>Amount ₹{amount} </Text>
      </View>

      <View style={{ backgroundColor: "#f8f9fa", padding: 20, borderRadius: 12, marginBottom: 25, borderWidth: 1, borderColor: "#e9ecef" }}>
        <Text style={{ fontSize: 16, color: "#6c757d", marginBottom: 8 }}>UPI Id</Text>
        <Text style={{ fontSize: 18, fontWeight: "600", color: "#000", marginBottom: 20 }}>{upiId}</Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: "#007bff", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, marginRight: 10, alignItems: "center" }} onPress={downloadQRCode}>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>Download QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ flex: 1, backgroundColor: "#28a745", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, marginLeft: 10, alignItems: "center" }} onPress={() => copyToClipboard(upiId)}>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>Copy UPI Id</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 16, alignItems: "center" }}>
          <TouchableOpacity onPress={manualVerifyNow} style={{ paddingVertical: 10, paddingHorizontal: 18, backgroundColor: "#ff9800", borderRadius: 8 }}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>I Have Paid — Verify Now</Text>
          </TouchableOpacity>

          <Text style={{ marginTop: 8, color: "#6c757d", fontSize: 12 }}>{polling ? "Waiting for payment confirmation..." : "Tap 'I Have Paid' if payment done"}</Text>
        </View>
      </View>

      <Modal visible={showSuccessModal} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ width: 280, padding: 24, backgroundColor: "#fff", borderRadius: 12, alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 8 }}>Payment Successful</Text>
            <Text style={{ color: "#6c757d", textAlign: "center", marginBottom: 16 }}>Done — Redirecting to Donate...</Text>
            <ActivityIndicator size="small" />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
