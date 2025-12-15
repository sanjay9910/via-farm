import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

const FORGET_API_BASE = "https://viafarm-1.onrender.com";

const SetPasswordAfterForget = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();

  const mobileNumber = route.params?.mobileNumber || "";

  const handleSetPassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert("Error", "Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert("Error", "Please confirm your password");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (!mobileNumber) {
      Alert.alert("Error", "Mobile number is missing");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${FORGET_API_BASE}/api/auth/password`, {
        mobileNumber,
        password: newPassword,
        confirmPassword: confirmPassword,
      });

      // success flow
      if (response.data?.status === "success") {
        Alert.alert("Success", response.data.message || "Password reset successful!", [
          { text: "OK", onPress: () => navigation.navigate("login") },
        ]);
      } else {
        Alert.alert("Error", response.data?.message || "Failed to reset password");
      }
    } catch (error) {
      console.error("Reset Password Error:", error);
      const errorMessage =
        error.response?.data?.message || "Something went wrong. Please try again.";
      Alert.alert("Error", errorMessage);
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
              <Text allowFontScaling={false} style={styles.heading}>Set New Password</Text>
              <Text allowFontScaling={false} style={styles.subtitle}>Create a strong password for your account</Text>

              <View style={styles.inputContainer}>
                <Text allowFontScaling={false} style={styles.label}>New Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                  allowFontScaling={false}
                    style={styles.passwordInput}
                    placeholder="Enter new password"
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowNewPassword((s) => !s)}
                    disabled={loading}
                  >
                    <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={22} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text allowFontScaling={false} style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                  allowFontScaling={false}
                    style={styles.passwordInput}
                    placeholder="Confirm your password"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword((s) => !s)}
                    disabled={loading}
                  >
                    <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={22} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* <View style={styles.requirements}>
                <Text style={styles.requirementsTitle}>Password requirements</Text>
                <Text style={styles.requirementItem}>• At least 6 characters</Text>
                <Text style={styles.requirementItem}>• Avoid using easily guessable words</Text>
              </View> */}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSetPassword}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Set Password</Text>}
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
    width: scale(310),
    height: scale(310),
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
  heading: {
    fontSize: normalizeFont(15),
    fontWeight: "600",
    marginBottom: moderateScale(8),
  },
  subtitle: {
    fontSize: normalizeFont(12),
    color: "#666",
    textAlign: "center",
    marginBottom: moderateScale(18),
    lineHeight: scale(20),
  },
  inputContainer: {
    width: "100%",
    marginBottom: moderateScale(14),
  },
  label: {
    fontSize: normalizeFont(12),
    fontWeight: "600",
    color: "#333",
    marginBottom: moderateScale(8),
    marginLeft: 2,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: moderateScale(10),
    backgroundColor: "#fdfdfd",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
    fontSize: normalizeFont(13),
  },
  eyeIcon: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
  },
  requirements: {
    backgroundColor: "#F0F8FF",
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginVertical: moderateScale(12),
    width: "100%",
  },
  requirementsTitle: {
    fontSize: normalizeFont(13),
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: moderateScale(6),
  },
  requirementItem: {
    fontSize: normalizeFont(12),
    color: "#666",
    marginBottom: moderateScale(2),
  },
  button: {
    backgroundColor: "rgba(76, 175, 80, 1)",
    padding: moderateScale(15),
    borderRadius: moderateScale(12),
    width: "70%",
    alignItems: "center",
    marginTop: moderateScale(8),
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: normalizeFont(13),
    fontWeight: "600",
  },
});

export default SetPasswordAfterForget;
