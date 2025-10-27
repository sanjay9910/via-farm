// Donate.js
import AsyncStorage from "@react-native-async-storage/async-storage";
// import Clipboard from "@react-native-clipboard/clipboard";
import axios from "axios";
import * as FileSystem from "expo-file-system";
// import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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

const API_BASE = "https://393rb0pp-5000.inc1.devtunnels.ms";
const DONATION_ENDPOINT = "/api/buyer/donation";

export default function Donate({ onBack, onProceed }) {
  const router = useRouter();
  const [amount, setAmount] = useState("20");
  const [loading, setLoading] = useState(false);

  // Payment modal state (shows server response)
  const [paymentData, setPaymentData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Small thank-you modal state
  const [thankYouVisible, setThankYouVisible] = useState(false);
  const thankYouTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      // cleanup timer on unmount
      if (thankYouTimerRef.current) clearTimeout(thankYouTimerRef.current);
    };
  }, []);

  const handleProceed = async () => {
    const numeric = parseFloat((amount || "").toString().trim()) || 0;
    if (numeric <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid donation amount.");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Not authenticated", "Please login to make a donation.");
        setLoading(false);
        return;
      }

      const body = {
        amount: numeric.toFixed(2).toString(),
        paymentMethod: "UPI",
      };

      const resp = await axios.post(`${API_BASE}${DONATION_ENDPOINT}`, body, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      });

      if (resp?.data?.success) {
        // show payment modal with server response
        setPaymentData(resp.data);
        setModalVisible(true);
      } else {
        Alert.alert("Donation failed", resp?.data?.message || "Unable to create donation.");
      }
    } catch (err) {
      console.error("Donation error:", err?.response?.data || err.message || err);
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to create donation. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUPI = (upi) => {
    if (!upi) {
      Alert.alert("No UPI", "UPI ID not available.");
      return;
    }
    Clipboard.setString(upi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert("Copied", "UPI ID copied to clipboard.");
  };

  const handleDownloadQR = async (qr) => {
    try {
      if (!qr) {
        Alert.alert("No QR", "QR not available to download.");
        return;
      }

      setDownloading(true);

      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Please allow media permissions to save the QR.");
        setDownloading(false);
        return;
      }

      const filename = `donation_qr_${paymentData?.donationId || Date.now()}.png`;
      const localUri = `${FileSystem.cacheDirectory}${filename}`;

      if (typeof qr === "string" && qr.startsWith("data:")) {
        const base64 = qr.split(",")[1] ?? "";
        await FileSystem.writeAsStringAsync(localUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else if (typeof qr === "string" && (qr.startsWith("http://") || qr.startsWith("https://"))) {
        const download = await FileSystem.downloadAsync(qr, localUri);
        if (!download || !download.uri) throw new Error("Download failed");
      } else {
        await FileSystem.writeAsStringAsync(localUri, qr, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      const asset = await MediaLibrary.createAssetAsync(localUri);
      try {
        await MediaLibrary.createAlbumAsync("ViaFarm", asset, false);
      } catch (e) {
        // album may already exist, ignore
      }

      Alert.alert("Saved", "QR Code saved to your gallery.");
    } catch (e) {
      console.error("Download QR error:", e);
      Alert.alert("Error", e?.message || "Failed to save QR.");
    } finally {
      setDownloading(false);
    }
  };

  // Called when user taps Done in payment modal after server success.
  // Show a small thank-you modal for 3 seconds, then navigate to index.
  const handleFinishAfterDonation = () => {
    setModalVisible(false);
    setThankYouVisible(true);

    // clear any previous timer
    if (thankYouTimerRef.current) clearTimeout(thankYouTimerRef.current);

    thankYouTimerRef.current = setTimeout(() => {
      setThankYouVisible(false);
      // call onProceed prop if provided (pass server paymentData)
      if (onProceed) {
        try {
          onProceed(paymentData);
        } catch (e) {
          console.warn("onProceed callback error:", e);
        }
      } else {
        // fallback navigation to index
        try {
          router.push("/index");
        } catch (e) {
          // if router not available, simply log
          console.warn("Router push failed:", e);
        }
      }
    }, 3000);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => (onBack ? onBack() : null)} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support Us</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Small message */}
        <View style={styles.helperRow}>
          <Text style={styles.helperText}>Payment Successfully done</Text>
        </View>

        {/* Bottom sheet */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.bottomWrapper}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Support Us</Text>
            <Text style={styles.sheetSubtitle}>If you like the app, you can donate us</Text>

            <View style={styles.inputRow}>
              <View style={styles.rupeeBox}>
                <Text style={styles.rupeeText}>₹</Text>
              </View>
              <TextInput
                value={amount}
                onChangeText={(t) => {
                  const filtered = t.replace(/[^0-9.]/g, "");
                  setAmount(filtered);
                }}
                keyboardType="numeric"
                placeholder="Enter amount"
                style={styles.amountInput}
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              style={[styles.proceedBtn, loading ? { opacity: 0.7 } : null]}
              onPress={handleProceed}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.proceedBtnText}>Proceed to Payment</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Payment Modal (server response) */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={modalStyles.overlay}>
            <View style={modalStyles.panel}>
              <ScrollView contentContainerStyle={{ alignItems: "center", paddingVertical: 20 }}>
                <Text style={modalStyles.title}>Complete Donation</Text>

                <View style={modalStyles.qrBox}>
                  {paymentData?.qrCode ? (
                    <Image source={{ uri: paymentData.qrCode }} style={modalStyles.qrImage} resizeMode="contain" />
                  ) : (
                    <Text style={{ color: "#666" }}>QR not available</Text>
                  )}
                </View>

                <Text style={modalStyles.smallLabel}>UPI id :</Text>
                <Text style={modalStyles.upiText}>{paymentData?.upiId ?? "—"}</Text>

                <View style={{ width: "100%", paddingHorizontal: 20, marginTop: 8 }}>
                  <TouchableOpacity style={modalStyles.actionButton} onPress={() => handleCopyUPI(paymentData?.upiId)}>
                    <Text style={modalStyles.actionText}>{copied ? "Copied!" : "Copy UPI ID"}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[modalStyles.actionButton, { marginTop: 10 }]} onPress={() => handleDownloadQR(paymentData?.qrCode)}>
                    {downloading ? <ActivityIndicator color="#fff" /> : <Text style={modalStyles.actionText}>Download QR Code</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[modalStyles.actionButton, { marginTop: 10, backgroundColor: "#eee" }]}
                    onPress={handleFinishAfterDonation}
                  >
                    <Text style={[modalStyles.actionText, { color: "#333" }]}>Done</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ height: 12 }} />
                <Text style={modalStyles.footerText}>Transaction Ref: {paymentData?.transactionRef ?? "—"}</Text>
                <Text style={modalStyles.footerText}>Amount: ₹{paymentData?.amount ?? amount}</Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Thank you modal (3 seconds) */}
        <Modal visible={thankYouVisible} transparent animationType="fade">
          <View style={thankModalStyles.overlay}>
            <View style={thankModalStyles.card}>
              <Text style={thankModalStyles.heart}>💚</Text>
              <Text style={thankModalStyles.thanksTitle}>Thank you!</Text>
              <Text style={thankModalStyles.thanksSubtitle}>We appreciate your donation.</Text>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, justifyContent: "space-between" },

  headerRow: {
    marginTop: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#333" },
  headerTitle: { fontSize: 16, fontWeight: "600", color: "#333" },

  helperRow: { flex: 1, alignItems: "center", justifyContent: "flex-start", paddingTop: 28 },
  helperText: { color: "#666", fontSize: 14 },

  bottomWrapper: {},
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: "#F3DFAA",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
  },

  sheetTitle: { fontSize: 16, fontWeight: "700", color: "#222", marginBottom: 6 },
  sheetSubtitle: { color: "#666", marginBottom: 12, fontSize: 13 },

  inputRow: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  rupeeBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  rupeeText: { fontSize: 18, fontWeight: "600", color: "#444" },
  amountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#222",
    backgroundColor: "#fff",
  },

  proceedBtn: { marginTop: 18, backgroundColor: "#2E7D32", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  proceedBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

/* Modal styles */
const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  panel: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    minHeight: 380,
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  qrBox: {
    width: 260,
    height: 260,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 8,
  },
  qrImage: { width: 220, height: 220, borderRadius: 8 },

  smallLabel: { textAlign: "center", color: "#888", marginTop: 6 },
  upiText: { textAlign: "center", fontWeight: "700", fontSize: 14, marginTop: 6 },

  actionButton: { backgroundColor: "#2E7D32", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  actionText: { color: "#fff", fontWeight: "700" },

  footerText: { textAlign: "center", color: "#666", marginTop: 8 },
});

/* Thank you modal styles */
const thankModalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  card: {
    width: 260,
    borderRadius: 12,
    padding: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    elevation: 6,
  },
  heart: { fontSize: 32, marginBottom: 8 },
  thanksTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  thanksSubtitle: { color: "#666", textAlign: "center" },
});
