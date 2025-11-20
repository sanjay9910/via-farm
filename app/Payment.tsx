// PaymentScreen.js (Complete Updated Version)
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, normalizeFont, scale } from "./Responsive";

const API_BASE = "https://viafarm-1.onrender.com";

export default function PaymentScreen({ route, navigation }) {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [polling, setPolling] = useState(false);
  const [paid, setPaid] = useState(false);

  const pollRef = useRef(null);
  const attemptsRef = useRef(0);

  const { addressId, deliveryType, comments, paymentMethod } = route?.params || {};

  // Stronger success detection
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
      console.log("isPaymentSuccessful error:", e);
    }
    return false;
  };

  // Try multiple endpoints
  const tryEndpointsForStatus = async (orderId, token, extraUrls = []) => {
    const candidateEndpoints = [
      `${API_BASE}/api/buyer/orders/${orderId}/status`,
      `${API_BASE}/api/buyer/orders/${orderId}`,
      `${API_BASE}/api/buyer/orders/status?orderId=${orderId}`,
      `${API_BASE}/api/buyer/orders/status/${orderId}`,
      `${API_BASE}/api/buyer/orders/${orderId}/payments`,
      `${API_BASE}/api/buyer/payments?orderId=${orderId}`,
      `${API_BASE}/api/buyer/payments/${orderId}`,
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
          // console.log("✓ Status endpoint success:", url);
          return { url, data: res.data };
        }
      } catch (err) {
        console.log(`✗ Tried ${url.split('/').pop()}:`, err?.response?.status || err?.code);
      }
    }
    return null;
  };

  // Create order & get QR
  useEffect(() => {
    let mounted = true;
    const createOrderAndGetQR = async () => {
      try {
        const body = {
          deliveryType: deliveryType || "Delivery",
          addressId: addressId || "691d9b1408f3a17e4162434b",
          comments: comments || "Deliver before 8 PM please",
          paymentMethod: paymentMethod || "UPI",
        };

      console.log("bod kya aa raha hai",body)

        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          Alert.alert("Error", "Please login again.");
          if (mounted) setLoading(false);
          return;
        }

        // console.log("📝 Creating order...");
        const response = await axios.post(`${API_BASE}/api/buyer/orders/place`, body, {
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${token}` 
          },
        });

        // console.log("✓ Order created:", response.data);

        const pInfo = response.data?.payments?.length 
          ? response.data.payments[0] 
          : (response.data.payment || response.data);

        if (mounted && pInfo) {
          const discoveredUrls = [];
          const scan = (obj) => {
            if (!obj || typeof obj !== "object") return;
            for (const k of Object.keys(obj)) {
              const v = obj[k];
              if (typeof v === "string" && (v.startsWith("http") || v.includes("/api/"))) {
                const candidate = v.startsWith("http") 
                  ? v 
                  : `${API_BASE}${v.startsWith("/") ? "" : "/"}${v}`;
                discoveredUrls.push(candidate);
              } else if (typeof v === "object") {
                scan(v);
              }
            }
          };
          scan(response.data);
          pInfo._discoveredStatusUrls = discoveredUrls;
          setPaymentInfo({ ...pInfo });
        } else {
          // console.log("⚠️ No payment info in response");
          Alert.alert("Warning", "Order created but payment details not returned");
        }
      } catch (error) {
        console.log("❌ Order creation error:", error?.response?.data || error.message);
        Alert.alert(
          "Error", 
          error?.response?.data?.message || error?.message || "Failed to create order"
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    createOrderAndGetQR();
    return () => {
      mounted = false;
    };
  }, [addressId, deliveryType, comments, paymentMethod]);

  // Polling effect
  useEffect(() => {
    const orderId = paymentInfo?.orderId || paymentInfo?._id || paymentInfo?.id;
    const paymentId = paymentInfo?.paymentId || paymentInfo?.id;

    if (!orderId && !paymentId && !paymentInfo) {
      return;
    }

    const POLL_INTERVAL = 3000;
    const MAX_ATTEMPTS = 40;

    attemptsRef.current = 0;
    setPolling(true);

    const poll = async () => {
      attemptsRef.current += 1;
      if (attemptsRef.current > MAX_ATTEMPTS) {
        if (pollRef.current) clearInterval(pollRef.current);
        setPolling(false);
        // console.log("⏹️ Polling stopped - max attempts reached");
        return;
      }

      try {
        const token = await AsyncStorage.getItem("userToken");

        const extra = paymentInfo?._discoveredStatusUrls 
          ? [...paymentInfo._discoveredStatusUrls] 
          : [];
        
        if (paymentId) {
          extra.unshift(`${API_BASE}/api/buyer/payments/${paymentId}`);
          extra.unshift(`${API_BASE}/api/buyer/payments/${paymentId}/status`);
        }
        
        if (orderId) {
          extra.unshift(`${API_BASE}/api/buyer/orders/${orderId}`);
          extra.unshift(`${API_BASE}/api/buyer/orders/${orderId}/status`);
        }

        // console.log(`🔄 Poll attempt ${attemptsRef.current}/${MAX_ATTEMPTS}`);
        const found = await tryEndpointsForStatus(orderId || paymentId, token, extra);

        if (!found) {
          // console.log("⏳ No endpoint response, retrying...");
          return;
        }

        // console.log("📊 Response data:", found.data);

        // Check if payment is successful
        if (isPaymentSuccessful(found.data)) {
          setPaid(true);
          setPolling(false);
          if (pollRef.current) clearInterval(pollRef.current);
          
          // console.log("✅ PAYMENT SUCCESSFUL DETECTED!");
          Alert.alert(
            "✅ Payment Successful!",
            "Your payment has been confirmed. You can now proceed or contact support if you have any questions.",
            [{ text: "OK" }]
          );
          return;
        }

        // Check payments array
        if (found.data?.payments) {
          for (const p of found.data.payments) {
            if (isPaymentSuccessful(p)) {
              setPaid(true);
              setPolling(false);
              if (pollRef.current) clearInterval(pollRef.current);
              // console.log("✅ PAYMENT FOUND IN ARRAY!");
              Alert.alert(
                "✅ Payment Successful!",
                "Your payment has been confirmed.",
                [{ text: "OK" }]
              );
              return;
            }
          }
        }

        // Check for failure
        const maybeStatus = (
          found.data && 
          (found.data.status || found.data.paymentStatus || found.data.message)
        );
        
        if (
          maybeStatus && 
          typeof maybeStatus === "string" && 
          maybeStatus.toLowerCase().includes("fail")
        ) {
          if (pollRef.current) clearInterval(pollRef.current);
          setPolling(false);
          Alert.alert("❌ Payment Failed", "Please try again or contact support.");
          return;
        }
      } catch (err) {
        // console.log("⚠️ Poll error:", err?.message);
      }
    };

    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      setPolling(false);
    };
  }, [paymentInfo]);

  // Copy to clipboard
  const copyToClipboard = async (text) => {
    try {
      await Clipboard.setStringAsync(String(text));
      // Alert.alert("✅ Copied!", "UPI ID copied to clipboard");
    } catch (err) {
      Alert.alert("Copy", String(text));
    }
  };

  // Share/Download QR
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
      Alert.alert("Share QR", "Please take a screenshot to save the QR code");
    }
  };

  // Manual mark as paid button
  const handlePaymentDone = () => {
    Alert.alert(
      "Payment Confirmation",
      "Have you already completed the payment from your UPI app?",
      [
        { text: "Not Yet", style: "cancel" },
        {
          text: "Yes, I Paid",
          style: "default",
          onPress: () => {
            setPaid(true);
            setPolling(false);
            if (pollRef.current) clearInterval(pollRef.current);
            Alert.alert(
              "✅ Thank You!",
              "Your payment has been recorded. Vendor will confirm shortly."
            );
          },
        },
      ]
    );
  };

  // Go to Donate page
  const goToDonate = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    router.push("/Donate");
  };

  // Close payment screen
  const handleClosePage = () => {
    Alert.alert(
      "Close Payment Screen?",
      "Are you sure? Your order is saved.",
      [
        { text: "Stay Here", style: "cancel" },
        {
          text: "Close",
          style: "destructive",
          onPress: () => {
            if (pollRef.current) clearInterval(pollRef.current);
            setPolling(false);
            navigation.goBack();
          },
        },
      ]
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  if (loading) {
    return (
      <View 
        style={{ 
          flex: 1, 
          justifyContent: "center", 
          alignItems: "center", 
          backgroundColor: "#fff" 
        }}
      >
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text 
          style={{ 
            marginTop: moderateScale(10), 
            fontSize: normalizeFont(16), 
            color: "#000" 
          }}
        >
          Generating payment QR...
        </Text>
      </View>
    );
  }

  if (!paymentInfo) {
    return (
      <View 
        style={{ 
          flex: 1, 
          justifyContent: "center", 
          alignItems: "center", 
          padding: moderateScale(20), 
          backgroundColor: "#fff" 
        }}
      >
        <Text 
          style={{ 
            fontSize: normalizeFont(16), 
            color: "#d32f2f", 
            textAlign: "center" 
          }}
        >
          No payment info found. Please try again.
        </Text>
        <TouchableOpacity
          style={{
            marginTop: moderateScale(20),
            backgroundColor: "#007bff",
            paddingVertical: moderateScale(10),
            paddingHorizontal: moderateScale(20),
            borderRadius: moderateScale(8),
          }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { amount, upiId, qrCode } = paymentInfo;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:moderateScale(20)}}>
        <TouchableOpacity onPress={goBack}>
          <Image source={require("../assets/via-farm-img/icons/groupArrow.png")} />
        </TouchableOpacity>
        <Text>Payment</Text>
        <Text></Text>
      </View>
      <ScrollView 
        contentContainerStyle={{ 
          paddingHorizontal: moderateScale(16), 
          paddingVertical: moderateScale(16),
          paddingBottom: moderateScale(30),
        }}
      >
        {/* Status Badge */}
        {/* <View 
          style={{ 
            marginBottom: moderateScale(20), 
            padding: moderateScale(12), 
            backgroundColor: paid ? "#e6ffed" : polling ? "#e3f2fd" : "#f8f9fa", 
            borderRadius: moderateScale(10), 
            borderLeftWidth: 4, 
            borderLeftColor: paid ? "#4CAF50" : polling ? "#2196F3" : "#dee2e6" 
          }}
        >
          <Text 
            style={{ 
              fontSize: normalizeFont(13), 
              fontWeight: "700", 
              color: paid ? "#1b5e20" : polling ? "#0d47a1" : "#495057" 
            }}
          >
            {paid ? "✓ Payment Confirmed" : polling ? "⏳ Waiting for Payment..." : "📱 Ready to Pay"}
          </Text>
        </View> */}

        {/* QR Code Section */}
        {qrCode ? (
          <View 
            style={{ 
              alignItems: "center", 
              marginBottom: moderateScale(24), 
              backgroundColor: "#f8f9fa", 
              padding: moderateScale(16), 
              borderRadius: moderateScale(12),
              borderWidth: 1,
              borderColor: "#e9ecef",
            }}
          >
            <Image
              source={{ uri: qrCode }}
              style={{ 
                width: scale(260), 
                height: scale(260), 
                borderRadius: moderateScale(12), 
                borderWidth: 2, 
                borderColor: "#dee2e6" 
              }}
            />
            <Text 
              style={{ 
                marginTop: moderateScale(12), 
                fontSize: normalizeFont(12), 
                color: "#6c757d", 
                textAlign: "center",
                fontWeight: "500",
              }}
            >
              Scan this QR code with your UPI app to pay
            </Text>
          </View>
        ) : (
          <View 
            style={{ 
              alignItems: "center", 
              marginBottom: moderateScale(24), 
              backgroundColor: "#f8f9fa", 
              padding: moderateScale(40), 
              borderRadius: moderateScale(12) 
            }}
          >
            <Text style={{ color: "#6c757d", fontSize: normalizeFont(12) }}>
              QR Code not available
            </Text>
          </View>
        )}

        {/* Amount Section */}
        <View style={{ alignItems: "center", marginBottom: moderateScale(24) }}>
          <Text style={{ fontSize: normalizeFont(10), color: "#6c757d", marginBottom: moderateScale(4) }}>
            Total Amount
          </Text>
          <Text 
            style={{ 
              fontSize: normalizeFont(26), 
              fontWeight: "800", 
              color: "#28a745" 
            }}
          >
            ₹{amount}
          </Text>
        </View>

        {/* UPI ID Section */}
        <View 
          style={{ 
            backgroundColor: "#f8f9fa", 
            padding: moderateScale(16), 
            borderRadius: moderateScale(10), 
            marginBottom: moderateScale(20), 
            borderWidth: 1, 
            borderColor: "#e9ecef" 
          }}
        >
          <Text 
            style={{ 
              fontSize: normalizeFont(11), 
              color: "#6c757d", 
              marginBottom: moderateScale(6), 
              fontWeight: "600" 
            }}
          >
            UPI ID (Manual Payment)
          </Text>
          <Text 
            style={{ 
              fontSize: normalizeFont(13), 
              fontWeight: "600", 
              color: "#000", 
              marginBottom: moderateScale(14), 
              fontFamily: "monospace",
              backgroundColor: "#fff",
              padding: moderateScale(8),
              borderRadius: moderateScale(6),
            }}
          >
            {upiId}
          </Text>

          <View style={{ flexDirection: "row", gap: moderateScale(10) }}>
            <TouchableOpacity
              style={{ 
                flex: 1, 
                borderWidth:2,
                borderColor:'rgba(255, 202, 40, 0.5)',
                paddingVertical: moderateScale(12), 
                borderRadius: moderateScale(8), 
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => copyToClipboard(upiId)}
            >
              <Text 
                style={{ 
                  color: "#000", 
                  fontSize: normalizeFont(12), 
                  fontWeight: "600" 
                }}
              >
                 Copy UPI ID
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ 
                flex: 1, 
                borderWidth:2,
                borderColor:'rgba(255, 202, 40, 0.5)',
                paddingVertical: moderateScale(12), 
                borderRadius: moderateScale(8), 
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={downloadQRCode}
            >
              <Text 
                style={{ 
                  color: "#000", 
                  fontSize: normalizeFont(12), 
                  fontWeight: "600" 
                }}
              >
                 Share QR
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instructions */}
        {/* <View 
          style={{ 
            backgroundColor: "#fff3cd", 
            padding: moderateScale(14), 
            borderRadius: moderateScale(8), 
            marginBottom: moderateScale(20), 
            borderLeftWidth: 4, 
            borderLeftColor: "#ff9800" 
          }}
        >
          <Text 
            style={{ 
              fontSize: normalizeFont(12), 
              fontWeight: "700", 
              color: "#856404", 
              marginBottom: moderateScale(8) 
            }}
          >
            📋 How to Pay:
          </Text>
          <Text 
            style={{ 
              fontSize: normalizeFont(11), 
              color: "#856404", 
              lineHeight: 18,
              fontWeight: "500",
            }}
          >
            1. Scan the QR with your UPI app, or{"\n"}
            2. Copy UPI ID and enter in your app, or{"\n"}
            3. Pay ₹{amount} to {upiId}{"\n\n"}
            4. Tap "I Have Paid" when done
          </Text>
        </View> */}

        {/* Action Buttons */}
        <TouchableOpacity
          style={{
            backgroundColor:'rgba(76, 175, 80, 1)',
            paddingVertical: moderateScale(14),
            borderRadius: moderateScale(8),
            alignItems: "center",
            marginBottom: moderateScale(10),
            opacity: paid ? 0.6 : 1,
          }}
          onPress={handlePaymentDone}
          disabled={paid}
        >
          <Text 
            style={{ 
              color: "#fff", 
              fontSize: normalizeFont(14), 
              fontWeight: "700" 
            }}
          >
            {paid ? "✓ Payment Completed" : " I Have Paid"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: "rgba(76, 175, 80, 1)",
            paddingVertical: moderateScale(14),
            borderRadius: moderateScale(8),
            alignItems: "center",
            marginBottom: moderateScale(10),
            marginTop: moderateScale(10),
          }}
          onPress={goToDonate}
        >
          <Text 
            style={{ 
              color: "#fff", 
              fontSize: normalizeFont(14), 
              fontWeight: "700" 
            }}
          >
             Continue to Donate Page
          </Text>
        </TouchableOpacity>

        {/* Polling Indicator */}
        {polling && (
          <View style={{ alignItems: "center", paddingVertical: moderateScale(14) }}>
            <ActivityIndicator size="small" color="#2196F3" />
            <Text 
              style={{ 
                marginTop: moderateScale(8), 
                fontSize: normalizeFont(11), 
                color: "#2196F3",
                fontWeight: "500",
              }}
            >
              🔄 Checking payment status...
            </Text>
          </View>
        )}

        {/* Footer Message */}
        <View 
          style={{ 
            marginTop: moderateScale(20), 
            paddingTop: moderateScale(16), 
            borderTopWidth: 1, 
            borderTopColor: "#e9ecef" 
          }}
        >
          <Text 
            style={{ 
              fontSize: normalizeFont(11), 
              color: "#6c757d", 
              textAlign: "center", 
              lineHeight: 18,
              fontWeight: "500",
            }}
          >
            💬 Contact vendor directly if you have questions{"\n"}
            📞 Your order details have been saved
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}