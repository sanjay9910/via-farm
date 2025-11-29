import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, normalizeFont, scale } from "../Responsive";

const API_BASE = "https://viafarm-1.onrender.com/api/auth";

const LoginOtp = () => {
  const [mobileNumber, setMobileNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleGetOtp = async () => {
    // Basic validation
    if (!mobileNumber) {
      Alert.alert("Error", "Please enter your mobile number");
      return;
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobileNumber)) {
      Alert.alert("Error", "Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE}/request-otp-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobileNumber: mobileNumber.trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let data = {};

      if (responseText && responseText.trim() !== "") {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("JSON Parse Error:", parseError);
        }
      }

      if (response.ok) {
        // Extract OTP from response if available
        let otpFromResponse = "";

        if (data.otp) {
          otpFromResponse = data.otp;
        } else if (data.data && data.data.otp) {
          otpFromResponse = data.data.otp;
        }

        if (otpFromResponse) {
          Alert.alert(
            "OTP Sent Successfully",
            `OTP has been sent to your mobile number.\n\nYour OTP: ${otpFromResponse}`,
            [
              {
                text: "OK",
                onPress: () => {
                  navigation.navigate("VerifyOtpWithLogin", {
                    mobileNumber: mobileNumber.trim(),
                  });
                },
              },
            ]
          );
        } else {
          Alert.alert("Success", "OTP has been sent to your mobile number", [
            {
              text: "OK",
              onPress: () => {
                navigation.navigate("VerifyOtpWithLogin", {
                  mobileNumber: mobileNumber.trim(),
                });
              },
            },
          ]);
        }
      } else {
        Alert.alert("Error", data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Get OTP error:", error);

      if (error.name === "AbortError") {
        Alert.alert("Timeout", "Request timed out. Please try again.");
      } else if (error.message && error.message.includes("Network")) {
        Alert.alert("Network Error", "Please check your internet connection.");
      } else {
        Alert.alert("Error", "Failed to send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* LOGO */}
            <Image
              style={styles.logoImage}
              source={require("../../assets/via-farm-img/icons/logo.png")}
            />

            {/* Card */}
            <View style={styles.card}>
              <Text style={styles.heading}>Login with OTP</Text>
              <Text style={styles.subtitle}>
                Enter your mobile number to receive OTP for login
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your 10-digit mobile number"
                  placeholderTextColor="#999"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus={true}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleGetOtp}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Sending OTP..." : "Get OTP"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 40 : 30,
    paddingBottom: moderateScale(20),
  },
  logoImage: {
    width: scale(200),
    height: scale(200),
    resizeMode: "contain",
    marginBottom: moderateScale(-60),
  },
  card: {
    height: "80%",
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: moderateScale(20),
    padding: moderateScale(28),
    marginTop: moderateScale(90),
    marginBottom: moderateScale(20),
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 3,
    borderColor: "rgba(255, 202, 40, 1)",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -4 },
    alignItems: "center",
  },
  heading: {
    fontSize: normalizeFont(15),
    fontWeight: "600",
    marginBottom: moderateScale(8),
  },
  subtitle: {
    fontSize: normalizeFont(12),
    textAlign: "center",
    marginBottom: moderateScale(18),
    color: "#666",
    lineHeight: scale(22),
  },
  inputContainer: {
    width: "100%",
    marginBottom: moderateScale(15),
  },
  label: {
    fontSize: normalizeFont(12),
    fontWeight: "600",
    color: "#333",
    marginBottom: moderateScale(8),
    marginLeft: 2,
  },
  input: {
    width: "100%",
    height: scale(50),
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    backgroundColor: "#fdfdfd",
    fontSize: normalizeFont(15),
  },
  button: {
    width: "70%",
    padding: moderateScale(14),
    borderRadius: moderateScale(10),
    backgroundColor: "rgba(76, 175, 80, 1)",
    alignItems: "center",
    marginTop: moderateScale(8),
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: normalizeFont(15),
    fontWeight: "600",
  },
  backButton: {
    marginTop: moderateScale(18),
    alignItems: "center",
  },
  backButtonText: {
    color: "#007AFF",
    fontSize: normalizeFont(13),
  },
});

export default LoginOtp;
