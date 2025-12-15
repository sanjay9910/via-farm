import { useNavigation, useRouter } from "expo-router";
import { useContext, useState } from "react";
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
import { AuthContext } from "../context/AuthContext";
import { moderateScale, normalizeFont, scale } from "../Responsive";

export default function RegisterScreen() {
  const { signup } = useContext(AuthContext);
  const [mobile, setMobile] = useState("");
  const router = useRouter();
  const navigation = useNavigation();

  const handleSignup = async () => {
    if (!mobile || mobile.length < 10) {
      Alert.alert("Error", "Please enter a valid mobile number");
      return;
    }

    try {
      const res = await signup(mobile);
      console.log("Signup response:", res);

      if (res.status === "success") {
        Alert.alert("OTP Sent", `OTP: ${res.otp}`, [
          {
            text: "OK",
            onPress: () => {
              router.push(`/(auth)/register-otp?mobile=${mobile}`);
            },
          },
        ]);
      } else {
        Alert.alert("Error", res.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Signup error:", err);
      Alert.alert("Error", err.message || "Something went wrong");
    }
  };

  const loginPage = () => {
    navigation.navigate("login");
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
              <Text style={styles.title}>Create an Account</Text>

              <Text allowFontScaling={false} style={styles.subtitle}>
                We will send you an{" "}
                <Text allowFontScaling={false} style={styles.boldText}>One Time Password</Text>
              </Text>
              <Text allowFontScaling={false} style={styles.subtitle}>on this mobile number</Text>

              <View style={styles.inputContainer}>
                <Text allowFontScaling={false} style={styles.inputLabel}>Enter Mobile Number</Text>
                <TextInput
                allowFontScaling={false}
                  style={styles.textInput}
                  placeholder="Enter 10 digit mobile number"
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                  maxLength={10}
                />
              </View>

              <TouchableOpacity style={styles.otpButton} onPress={handleSignup}>
                <Text allowFontScaling={false} style={styles.otpButtonText}>Get OTP</Text>
              </TouchableOpacity>

              <View style={styles.signInContainer}>
                <Text allowFontScaling={false} style={styles.signInText}>Already have an account? </Text>
                <TouchableOpacity onPress={loginPage}>
                  <Text allowFontScaling={false} style={styles.signInLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
    width: scale(300),
    height: scale(300),
    resizeMode: "contain",
    marginBottom: moderateScale(-60),
  },
  card: {
    height: "80%",
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: moderateScale(20),
    padding: moderateScale(28),
    marginTop: moderateScale(60),
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
  title: {
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: moderateScale(12),
  },
  subtitle: {
    fontSize: normalizeFont(12),
    color: "#666",
    textAlign: "center",
    lineHeight: scale(20),
  },
  boldText: {
    fontWeight: "bold",
    color: "#333",
  },
  inputContainer: {
    width: "100%",
    marginTop: moderateScale(30),
    marginBottom: moderateScale(18),
  },
  inputLabel: {
    fontSize: normalizeFont(13),
    color: "#333",
    marginBottom: moderateScale(8),
    fontWeight: "500",
    marginLeft: 2,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: moderateScale(10),
    padding: moderateScale(14),
    fontSize: normalizeFont(13),
    backgroundColor: "#fafafa",
    color: "#333",
  },
  otpButton: {
    backgroundColor: "rgba(76, 175, 80, 1)",
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(20),
    alignItems: "center",
    marginTop: moderateScale(18),
    shadowColor: "rgba(76, 175, 80, 0.25)",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
    width: "70%",
  },
  otpButtonText: {
    color: "#fff",
    fontSize: normalizeFont(13),
    fontWeight: "600",
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: moderateScale(16),
  },
  signInText: {
    fontSize: normalizeFont(12),
    color: "#666",
  },
  signInLink: {
    fontSize: normalizeFont(13),
    color: "#007AFF",
    fontWeight: "500",
  },
});
