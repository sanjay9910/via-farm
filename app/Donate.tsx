
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, normalizeFont, scale } from "./Responsive";

const API_BASE = "https://viafarm-1.onrender.com";
const DONATION_ENDPOINT = "/api/buyer/donation";
const { width, height } = Dimensions.get("window");

export default function Donate({ onBack, onProceed }) {
  const router = useRouter();
  const [amount, setAmount] = useState("50");
  const [loading, setLoading] = useState(false);

  const [paymentData, setPaymentData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copiedUPI, setCopiedUPI] = useState(false);

  const [thankYouVisible, setThankYouVisible] = useState(false);
  const thankYouTimerRef = useRef(null);
  const pollRef = useRef(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    return () => {
      if (thankYouTimerRef.current) clearTimeout(thankYouTimerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Detect payment success
  const isPaymentSuccessful = (resData) => {
    if (!resData) return false;
    try {
      const s = (v) => (typeof v === "string" ? v.toLowerCase() : v);
      if (typeof resData.status === "string" && s(resData.status).includes("paid")) return true;
      if (resData.paid === true) return true;
      if (resData.isPaid === true) return true;
      if (typeof resData.paymentStatus === "string" && s(resData.paymentStatus).includes("paid")) return true;
      if (resData.success === true && resData.paid === true) return true;
      if (resData.data && isPaymentSuccessful(resData.data)) return true;
    } catch (e) {
      console.log("Payment detection error:", e);
    }
    return false;
  };

  // Check payment status
  const checkPaymentStatus = async (donationId, token) => {
    const endpoints = [
      `${API_BASE}/api/buyer/donations/${donationId}/status`,
      `${API_BASE}/api/buyer/donations/${donationId}`,
      `${API_BASE}/api/donations/${donationId}/status`,
    ];

    for (const url of endpoints) {
      try {
        const res = await axios.get(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 8000,
        });
        if (res?.data) {
          return res.data;
        }
      } catch (err) {
        console.log(`Tried ${url.split("/").pop()}:`, err?.response?.status || err?.code);
      }
    }
    return null;
  };

  // Start polling for payment
  const startPaymentPolling = async (donationId) => {
    const POLL_INTERVAL = 3000;
    const MAX_ATTEMPTS = 40;
    attemptsRef.current = 0;

    // clear any previous poll just in case
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    const poll = async () => {
      attemptsRef.current += 1;
      if (attemptsRef.current > MAX_ATTEMPTS) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        console.log("Polling stopped (max attempts reached).");
        return;
      }

      try {
        const token = await AsyncStorage.getItem("userToken");
        const statusData = await checkPaymentStatus(donationId, token);

        if (statusData && isPaymentSuccessful(statusData)) {
          // stop polling
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }

          // show success alert and finish flow
          Alert.alert("✅ Donation Successful!", "Thank you for your generous support!", [
            { text: "OK", onPress: () => handleFinishAfterDonation() },
          ]);

          // also call handleFinishAfterDonation in case user dismissed alert differently
          // (but avoid duplicate calls)
          return;
        }
      } catch (err) {
        console.log("Poll error:", err?.message);
      }
    };

    // run first immediately then set interval
    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL);
  };

  const handleProceed = async () => {
    let numeric = 0;
    try {
      numeric = parseFloat(String(amount || "").trim());
    } catch (e) {
      numeric = 0;
    }

    if (isNaN(numeric) || numeric <= 0) {
      Alert.alert("❌ Invalid Amount", "Please enter a valid donation amount (₹1 or more).");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("❌ Not Authenticated", "Please login first to make a donation.");
        setLoading(false);
        return;
      }

      console.log("📝 Creating donation for ₹" + numeric);

      const body = {
        amount: numeric,
        paymentMethod: "UPI",
      };

      const resp = await axios.post(`${API_BASE}${DONATION_ENDPOINT}`, body, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      });

      console.log("✓ Donation created:", resp.data);

      if (resp?.data?.success) {
        setPaymentData(resp.data);
        setModalVisible(true);

        if (resp.data.donationId) {
          startPaymentPolling(resp.data.donationId);
        }
      } else {
        Alert.alert("❌ Donation Failed", resp?.data?.message || "Unable to create donation.");
      }
    } catch (err) {
      console.error("Donation error:", err?.response?.data || err.message);
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to create donation";
      Alert.alert("❌ Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUPI = (upi) => {
    if (!upi) {
      Alert.alert("Error", "UPI ID not available.");
      return;
    }
    Clipboard.setStringAsync(upi);
    setCopiedUPI(true);
    setTimeout(() => setCopiedUPI(false), 2500);
    Alert.alert("✅ Copied!", "UPI ID copied to clipboard.");
  };

  const handleDownloadQR = async (qr) => {
    try {
      if (!qr) {
        Alert.alert("Error", "QR Code not available.");
        return;
      }

      setDownloading(true);

      const filename = `donation_qr_${paymentData?.donationId || Date.now()}.png`;
      const localUri = `${FileSystem.documentDirectory}${filename}`;

      if (typeof qr === "string" && qr.startsWith("data:")) {
        const base64 = qr.split(",")[1];
        if (!base64) throw new Error("Invalid base64 data");

        await FileSystem.writeAsStringAsync(localUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else if (typeof qr === "string" && (qr.startsWith("http://") || qr.startsWith("https://"))) {
        const download = await FileSystem.downloadAsync(qr, localUri);
        if (!download || !download.uri) throw new Error("Download failed");
      } else {
        throw new Error("Invalid QR format");
      }

      // Share the file if available; otherwise just inform saved
      const canShare = !!(Sharing && Sharing.isAvailableAsync);
      if (canShare && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(localUri, {
          mimeType: "image/png",
          dialogTitle: "Save QR Code",
        });
        Alert.alert("✅ QR Code Ready!", "File is ready to share or save");
      } else {
        Alert.alert("✅ Saved!", "QR Code saved to app document folder");
      }
    } catch (e) {
      console.error("Download QR error:", e);
      Alert.alert("Error", e?.message || "Failed to save QR code. Please take a screenshot instead.");
    } finally {
      setDownloading(false);
    }
  };

  // This function will show thank you modal then navigate to home WITHOUT logging out.
  const handleFinishAfterDonation = () => {
    // Clear polling and modal
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    // Close payment modal and show thank you
    setModalVisible(false);
    setThankYouVisible(true);

    if (thankYouTimerRef.current) clearTimeout(thankYouTimerRef.current);

    // After 2.5s navigate to home. Use replace so user can't go back to the donate screen.
    thankYouTimerRef.current = setTimeout(() => {
      setThankYouVisible(false);
      try {
        // Navigate to index/home without logging out
        // replace prevents back navigation to donate screen
        router.replace("/");
      } catch (e) {
        console.warn("Router navigation failed:", e);
        // fallback to push
        try {
          router.push("/");
        } catch (err) {
          console.warn("Router push fallback failed:", err);
        }
      }
    }, 2500);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onPress={() => (onBack ? onBack() : router.back())} 
            style={styles.backBtn}
          >
            <Text allowFontScaling={false} style={styles.backIcon}>✕</Text>
          </TouchableOpacity>
          <Text allowFontScaling={false} style={styles.headerTitle}>Support ViaFarm</Text>
          <View style={{ width: scale(36) }} />
        </View>

        {/* Main Content */}
        <ScrollView 
          style={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text allowFontScaling={false} style={styles.heroEmoji}>❤️</Text>
            <Text allowFontScaling={false} style={styles.heroTitle}>Make a Difference</Text>
            <Text allowFontScaling={false} style={styles.heroSubtitle}>
              Your donation helps us provide fresh, sustainable produce to communities in need
            </Text>
          </View>

          {/* Impact Section */}
          <View style={styles.impactSection}>
            <Text allowFontScaling={false} style={styles.sectionTitle}>Your Impact</Text>
            <View style={styles.impactGrid}>
              <View style={styles.impactCard}>
                <Text allowFontScaling={false} style={styles.impactNumber}>🌱</Text>
                <Text allowFontScaling={false} style={styles.impactLabel}>Fresh Produce</Text>
              </View>
              <View style={styles.impactCard}>
                <Text allowFontScaling={false} style={styles.impactNumber}>👨‍🌾</Text>
                <Text allowFontScaling={false} style={styles.impactLabel}>Support Farmers</Text>
              </View>
              <View style={styles.impactCard}>
                <Text allowFontScaling={false} style={styles.impactNumber}>🌍</Text>
                <Text allowFontScaling={false} style={styles.impactLabel}>Sustainability</Text>
              </View>
              <View style={styles.impactCard}>
                <Text allowFontScaling={false} style={styles.impactNumber}>💚</Text>
                <Text allowFontScaling={false} style={styles.impactLabel}>Community</Text>
              </View>
            </View>
          </View>

          {/* Why Donate */}
          <View style={styles.whyDonateSection}>
            <Text style={styles.sectionTitle}>Why Donate to ViaFarm?</Text>
            <View style={styles.reasonCard}>
              <Text allowFontScaling={false} style={styles.reasonIcon}>✓</Text>
              <View style={styles.reasonContent}>
                <Text allowFontScaling={false} style={styles.reasonTitle}>Direct Impact</Text>
                <Text allowFontScaling={false} style={styles.reasonDesc}>Your donation directly supports local farmers and communities</Text>
              </View>
            </View>
            <View style={styles.reasonCard}>
              <Text style={styles.reasonIcon}>✓</Text>
              <View style={styles.reasonContent}>
                <Text allowFontScaling={false} style={styles.reasonTitle}>Transparency</Text>
                <Text allowFontScaling={false} style={styles.reasonDesc}>100% transparent - see exactly where your donation goes</Text>
              </View>
            </View>
            <View style={styles.reasonCard}>
              <Text style={styles.reasonIcon}>✓</Text>
              <View style={styles.reasonContent}>
                <Text allowFontScaling={false} style={styles.reasonTitle}>Sustainable Future</Text>
                <Text allowFontScaling={false} style={styles.reasonDesc}>Help us build a sustainable agricultural ecosystem</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Sheet */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
          style={styles.bottomWrapper}
        >
          <View style={styles.sheet}>
            <Text allowFontScaling={false} style={styles.sheetTitle}>Choose Your Donation</Text>

            {/* Quick Amounts */}
            <View style={styles.quickAmounts}>
              {["25", "50", "100", "500"].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.quickBtn, amount === amt && styles.quickBtnActive]}
                  onPress={() => setAmount(amt)}
                  activeOpacity={0.7}
                >
                  <Text allowFontScaling={false} style={[styles.quickBtnText, amount === amt && styles.quickBtnTextActive]}>
                    ₹{amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Amount Input */}
            <View style={styles.inputRow}>
              <View style={styles.rupeeBox}>
                <Text allowFontScaling={false} style={styles.rupeeText}>₹</Text>
              </View>
              <TextInput
              allowFontScaling={false}
                value={amount}
                onChangeText={(t) => {
                  const filtered = t.replace(/[^0-9.]/g, "");
                  setAmount(filtered);
                }}
                keyboardType="decimal-pad"
                placeholder="Enter custom amount"
                style={styles.amountInput}
                placeholderTextColor="#999"
              />
            </View>

            {/* Info Text */}
            <Text allowFontScaling={false} style={styles.infoText}>
              💡 Even small donations make a big difference in farmers' lives
            </Text>

            {/* Proceed Button */}
            <TouchableOpacity
              style={[styles.proceedBtn, loading && { opacity: 0.7 }]}
              onPress={handleProceed}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text allowFontScaling={false} style={styles.proceedBtnText}>
                  Donate ₹{amount || "0"} Now
                </Text>
              )}
            </TouchableOpacity>

            {/* Footer */}
            <Text allowFontScaling={false} style={styles.footerNote}>Secure UPI payment • Protected by encryption</Text>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* Payment Modal */}
      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        transparent 
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={paymentModalStyles.overlay}>
          <View style={paymentModalStyles.panel}>
            <ScrollView 
              contentContainerStyle={paymentModalStyles.scrollContent}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
            >
              {/* Header */}
              <Text allowFontScaling={false} style={paymentModalStyles.title}>Complete Your Donation</Text>
              <Text allowFontScaling={false} style={paymentModalStyles.subtitle}>₹{paymentData?.amount || amount}</Text>

              {/* QR Code */}
              <View style={paymentModalStyles.qrBox}>
                {paymentData?.qrCode ? (
                  <Image 
                    source={{ uri: paymentData.qrCode }} 
                    style={paymentModalStyles.qrImage} 
                    resizeMode="contain"
                  />
                ) : (
                  <ActivityIndicator size="large" color="#34a853" />
                )}
              </View>
              <View style={paymentModalStyles.manualSection}>
                <Text allowFontScaling={false} style={paymentModalStyles.sectionLabel}>UPI ID (Manual Payment):</Text>
                <View style={paymentModalStyles.upiBox}>
                  <Text allowFontScaling={false} style={paymentModalStyles.upiText}>{paymentData?.upiId ?? "—"}</Text>
                  <TouchableOpacity
                    style={paymentModalStyles.upiCopyBtn}
                    onPress={() => handleCopyUPI(paymentData?.upiId)}
                  >
                    <Text allowFontScaling={false} style={paymentModalStyles.upiCopyText}>
                      {copiedUPI ? "✓" : "Copy"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={paymentModalStyles.actionButtonsContainer}>
                <TouchableOpacity
                  style={[paymentModalStyles.actionButton, { backgroundColor: "rgba(76, 175, 80, 1)" }]}
                  onPress={handleFinishAfterDonation}
                >
                  <Text allowFontScaling={false} style={paymentModalStyles.actionText}>✓ I Have Paid</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[paymentModalStyles.actionButton, { backgroundColor: "#f0f0f0" }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text allowFontScaling={false} style={[paymentModalStyles.actionText, { color: "#333" }]}>← Back</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Thank You Modal */}
      <Modal visible={thankYouVisible} transparent animationType="fade">
        <View style={thankYouModalStyles.overlay}>
          <View style={thankYouModalStyles.card}>
            <Text allowFontScaling={false} style={thankYouModalStyles.largeEmoji}>💚</Text>
            <Text style={thankYouModalStyles.thanksTitle}>Thank You!</Text>
            <Text allowFontScaling={false} style={thankYouModalStyles.thanksSubtitle}>
              Your donation of ₹{paymentData?.amount || amount} will help us serve the community better
            </Text>
            <Text allowFontScaling={false} style={thankYouModalStyles.thanksBig}>We Really Appreciate It 🙏</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* Responsive Styles */
const isSmallScreen = width < 350;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8f9fa" },
  container: { flex: 1, justifyContent: "space-between" },

  headerRow: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  backBtn: { width: scale(36), height: scale(36), alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: normalizeFont(20), color: "#333", fontWeight: "600" },
  headerTitle: { fontSize: normalizeFont(14), fontWeight: "700", color: "#222" },

  scrollContent: { flex: 1 },

  heroSection: {
    paddingVertical: moderateScale(24),
    paddingHorizontal: moderateScale(16),
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  heroEmoji: { fontSize: normalizeFont(25), marginBottom: moderateScale(12) },
  heroTitle: { 
    fontSize:normalizeFont(15), 
    fontWeight: "800", 
    color: "#222", 
    marginBottom: moderateScale(8), 
    textAlign: "center" 
  },
  heroSubtitle: { 
    fontSize: normalizeFont(11), 
    color: "#666", 
    textAlign: "center", 
    lineHeight: moderateScale(20),
    paddingHorizontal: moderateScale(8),
  },

  impactSection: {
    paddingVertical: moderateScale(20),
    paddingHorizontal: moderateScale(12),
    backgroundColor: "#fff",
    marginVertical: moderateScale(8),
  },
  sectionTitle: { 
    fontSize: normalizeFont(14), 
    fontWeight: "700", 
    color: "#222", 
    marginBottom: moderateScale(12) 
  },
  impactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  impactCard: {
    width: "48%",
    backgroundColor: "#f8f9fa",
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(8),
    borderRadius: moderateScale(10),
    alignItems: "center",
    marginBottom: moderateScale(10),
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  impactNumber: { fontSize: normalizeFont(20), marginBottom: moderateScale(6) },
  impactLabel: { fontSize: normalizeFont(10), fontWeight: "600", color: "#333", textAlign: "center" },

  whyDonateSection: {
    paddingVertical: moderateScale(20),
    paddingHorizontal: moderateScale(12),
    backgroundColor: "#fff",
    marginVertical: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  reasonCard: {
    flexDirection: "row",
    paddingVertical:  moderateScale(12),
    paddingHorizontal: moderateScale(10),
    backgroundColor: "#f8f9fa",
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(10),
    alignItems: "flex-start",
    borderLeftWidth: moderateScale(4),
    borderLeftColor: "#34a853",
  },
  reasonIcon: { fontSize: normalizeFont(14), fontWeight: "700", color: "#34a853", marginRight: moderateScale(10), marginTop: 2 },
  reasonContent: { flex: 1 },
  reasonTitle: { fontSize: normalizeFont(11), fontWeight: "700", color: "#222", marginBottom: 3 },
  reasonDesc: { fontSize: normalizeFont(11), color: "#666", lineHeight: scale(16) },

  bottomWrapper: {},
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(18),
    paddingBottom: Platform.OS === "ios" ? 32 : 20,
    borderLeftWidth:2,
    borderRightWidth:2,
    borderTopWidth:2,
    borderColor: "rgba(255, 202, 40, 0.5)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(12),
    // elevation: 8,
  },

  sheetTitle: { 
    fontSize:normalizeFont(14), 
    fontWeight: "700", 
    color: "#222", 
    marginBottom: moderateScale(14) 
  },

  quickAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: moderateScale(14),
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(6),
    borderRadius: moderateScale(10),
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  quickBtnActive: { backgroundColor: "#34a853", borderColor: "#2e7d32" },
  quickBtnText: { fontSize: isSmallScreen ? 12 : 13, fontWeight: "700", color: "#666" },
  quickBtnTextActive: { color: "#fff" },

  inputRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  rupeeBox: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(11),
    borderRadius: moderateScale(10),
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(10),
  },
  rupeeText: { fontSize: normalizeFont(12), fontWeight: "700", color: "#333" },
  amountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(11),
    paddingHorizontal: moderateScale(12),
    fontSize: normalizeFont(12),
    color: "#222",
    backgroundColor: "#f8f9fa",
  },

  infoText: {
    fontSize: normalizeFont(11),
    color: "#666",
    textAlign: "center",
    marginBottom: moderateScale(14),
    fontWeight: "500",
  },

  proceedBtn: {
    backgroundColor: "#34a853",
    paddingVertical: moderateScale(13),
    borderRadius: moderateScale(10),
    alignItems: "center",
    marginBottom: moderateScale(10),
    shadowColor: "#34a853",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  proceedBtnText: { color: "#fff", fontWeight: "700", fontSize: normalizeFont(13) },

  footerNote: { fontSize: normalizeFont(10), color: "#999", textAlign: "center", fontWeight: "500" },
});

/* Payment Modal Styles - Responsive */
const paymentModalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  panel: {
    backgroundColor: "#fff",
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    borderWidth:2,
    borderColor:'rgba(255, 202, 40, 1)',
    paddingTop: moderateScale(8),
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: height * 0.85,
  },
  scrollContent: {
    alignItems: "center",
    paddingVertical: moderateScale(20),
    paddingHorizontal: normalizeFont(16),
  },
  title: { fontSize: normalizeFont(18), fontWeight: "800", marginBottom: moderateScale(4), textAlign: "center", color: "#222" },
  subtitle: { fontSize: normalizeFont(22), fontWeight: "700", color: "#34a853", marginBottom: normalizeFont(14), textAlign: "center" },

  qrBox: {
    width: width < 320 ? 240 : 280,
    height: width < 320 ? 240 : 280,
    borderRadius: 14,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: moderateScale(12),
  },
  qrImage: { 
    width: width < 320 ? 200 : 240, 
    height: width < 320 ? 200 : 240, 
    borderRadius: moderateScale(10) 
  },

  instructionBox: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
    marginHorizontal: 0,
    marginVertical: moderateScale(12),
    borderLeftWidth: 4,
    borderLeftColor: "#2196f3",
  },
  instructionTitle: { fontSize: normalizeFont(12), fontWeight: "700", color: "#1565c0", marginBottom: moderateScale(8) },
  instructionText: { fontSize: normalizeFont(11), color: "#1565c0", lineHeight: normalizeFont(18), fontWeight: "500" },

  manualSection: {
    backgroundColor: "#fff3cd",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
    marginHorizontal: 0,
    marginVertical: moderateScale(12),
    borderLeftWidth: 4,
    width:'80%',
    borderLeftColor: "#ff9800",
  },
  sectionLabel: { fontSize: normalizeFont(11), fontWeight: "700", color: "#856404", marginBottom: moderateScale(10) },
  upiBox: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical:moderateScale(9),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(8),
    alignItems: "center",
    borderWidth: 1,
    gap:10,
    borderColor: "#ffb74d",
  },
  upiText: { flex: 1, fontSize: normalizeFont(12), fontWeight: "600", color: "#222", fontFamily: "monospace" },
  upiCopyBtn: { paddingHorizontal: moderateScale(9), paddingVertical: moderateScale(5), backgroundColor: "#ff9800", borderRadius: 6 },
  upiCopyText: { color: "#fff", fontWeight: "700", fontSize: normalizeFont(10) },

  actionButtonsContainer: {
    width: "100%",
    marginTop: normalizeFont(14),
    gap: 10,
  },
  actionButton: {
    backgroundColor: "#2196f3",
    paddingVertical: normalizeFont(10),
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { color: "#fff", fontWeight: "700", fontSize: normalizeFont(13) },

  infoBox: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal:moderateScale(14),
    paddingVertical: moderateScale(12),
    marginHorizontal: 0,
    marginTop: moderateScale(14),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  infoLabel: { fontSize: normalizeFont(10), fontWeight: "600", color: "#666" },
  infoValue: { fontSize: normalizeFont(11), fontWeight: "700", color: "#222", marginTop: normalizeFont(3), marginBottom: normalizeFont(8) },
});

/* Thank You Modal Styles - Responsive */
const thankYouModalStyles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: "rgba(76, 175, 80, 1)", 
    alignItems: "center", 
    justifyContent: "center",
    padding: moderateScale(16),
  },
  card: {
    width: "100%",
    maxWidth:scale(300),
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(32),
    paddingHorizontal: moderateScale(24),
    backgroundColor: "#fff",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(12),
  },
  largeEmoji: { 
    fontSize: normalizeFont(52), 
    marginBottom: moderateScale(16),
  },
  thanksTitle: { 
    fontSize: normalizeFont(22), 
    fontWeight: "800", 
    marginBottom: moderateScale(8),
    color: "#222",
    textAlign: "center"
  },
  thanksSubtitle: { 
    fontSize: normalizeFont(13), 
    color: "#666", 
    textAlign: "center",
    lineHeight: normalizeFont(20),
    marginBottom: moderateScale(14),
    fontWeight: "500"
  },
  thanksBig: {
    fontSize: normalizeFont(15),
    fontWeight: "700",
    color: "#34a853",
    textAlign: "center",
  }
});