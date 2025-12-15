import { useNavigation } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import React from "react";
import {
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, normalizeFont, scale } from "./Responsive";

const COMPANY_NAME = "Your Company Name";
const APP_STORE_LINK =
  "https://play.google.com/store/apps/details?id=your.app.id"; 

const RateUs = () => {
  const navigation = useNavigation();

  const openStore = async () => {
    try {
      const supported = await Linking.canOpenURL(APP_STORE_LINK);
      if (supported) await Linking.openURL(APP_STORE_LINK);
      else Alert.alert("Error", "Unable to open the store link.");
    } catch (err) {
      Alert.alert("Error", "Something went wrong while opening the store.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBack}
        >
          <Image source={require("../assets/via-farm-img/icons/groupArrow.png")} />
        </TouchableOpacity>

        <Text  allowFontScaling={false} numberOfLines={1} style={styles.headerTitle}>
          Rate Us
        </Text>

        {/* spacer to keep title centered */}
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text  allowFontScaling={false} style={styles.title}>Enjoying {COMPANY_NAME}?</Text>

          <Text  allowFontScaling={false} style={styles.subtitle}>
            Your feedback means a lot! Rate our app and help us improve our
            services. By sharing your experience, you help us deliver fresh
            fruits, seeds, vegetables, plants, and handicrafts even better.
          </Text>

          <TouchableOpacity style={styles.rateButton} onPress={openStore}>
            <Text  allowFontScaling={false} style={styles.rateButtonText}>Rate Now ⭐</Text>
          </TouchableOpacity>

          <Text  allowFontScaling={false} style={styles.note}>
            Thank you for supporting {COMPANY_NAME}! Your reviews help us grow
            and serve you better.
          </Text>
        </View>

        <View style={{ height: moderateScale(40) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default RateUs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? moderateScale(6) : 0,
  },

  header: {
    height: scale(60),
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e6edf3",
    backgroundColor: "#fff",
    paddingVertical: moderateScale(6),
  },

  backButton: {
    padding: moderateScale(8),
    marginRight: moderateScale(6),
    zIndex: 2,
  },

  headerTitle: {
    position: "absolute",
    left: moderateScale(0),
    right: moderateScale(0),
    textAlign: "center",
    fontSize: normalizeFont(16),
    fontWeight: "700",
    color: "#0f172a",
    alignSelf: "center",
    zIndex: 1,
  },

  headerRightSpacer: {
    width: moderateScale(36),
  },

  contentContainer: {
    padding: moderateScale(16),
    paddingBottom: moderateScale(40),
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(14),
    padding: moderateScale(20),
    // iOS shadow
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: moderateScale(12),
    shadowOffset: { width: 0, height: scale(6) },
    // Android elevation
    elevation: 4,
    alignItems: "center",
  },

  title: {
    fontSize: normalizeFont(15),
    fontWeight: "600",
    color: "#06203a",
    marginBottom: moderateScale(12),
    textAlign: "center",
  },

  subtitle: {
    fontSize: normalizeFont(14),
    color: "#475569",
    textAlign: "center",
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(20),
    paddingHorizontal: moderateScale(6),
  },

  rateButton: {
    backgroundColor: "green",
    paddingVertical: Platform.OS === "ios" ? moderateScale(14) : moderateScale(12),
    paddingHorizontal: moderateScale(30),
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(16),
  },

  rateButtonText: {
    color: "#fff",
    fontSize: normalizeFont(12),
    fontWeight: "600",
  },

  note: {
    fontSize: normalizeFont(11),
    color: "#334155",
    textAlign: "center",
    paddingHorizontal: moderateScale(8),
  },
});
