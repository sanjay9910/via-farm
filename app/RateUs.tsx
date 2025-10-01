import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COMPANY_NAME = 'Your Company Name';
const APP_STORE_LINK = 'https://play.google.com/store/apps/details?id=your.app.id'; // replace with your app link

const RateUs = ({ navigation }) => {
  const openStore = async () => {
    try {
      const supported = await Linking.canOpenURL(APP_STORE_LINK);
      if (supported) await Linking.openURL(APP_STORE_LINK);
      else Alert.alert('Error', 'Unable to open the store link.');
    } catch (err) {
      Alert.alert('Error', 'Something went wrong while opening the store.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (navigation?.goBack ? navigation.goBack() : null)}
        >
          <Ionicons name="chevron-back" size={22} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Us</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Enjoying {COMPANY_NAME}?</Text>
          <Text style={styles.subtitle}>
            Your feedback means a lot! Rate our app and help us improve our services.
            By sharing your experience, you help us deliver fresh fruits, seeds, vegetables,
            plants, and handicrafts even better.
          </Text>

          <TouchableOpacity style={styles.rateButton} onPress={openStore}>
            <Text style={styles.rateButtonText}>Rate Now ⭐</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            Thank you for supporting {COMPANY_NAME}! Your reviews help us grow and serve you better.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default RateUs;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e6edf3',
    backgroundColor: '#fff',
  },
  backButton: { padding: 8, marginRight: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#06203a', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#475569', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  rateButton: {
    backgroundColor: 'green',
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 16,
  },
  rateButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  note: { fontSize: 12, color: '#334155', textAlign: 'center', lineHeight: 18 },
});
