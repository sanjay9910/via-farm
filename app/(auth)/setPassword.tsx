import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { moderateScale, normalizeFont, scale } from '../Responsive';

export default function SetPasswordScreen(): JSX.Element {
  const { newPassword } = useContext(AuthContext);
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const router = useRouter();
  const [password, setPasswordText] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSetPassword = async (): Promise<void> => {
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!mobile) {
      Alert.alert('Error', 'Mobile not found');
      return;
    }

    try {
      setLoading(true);
      const res = await newPassword(password, confirmPassword);

      if (res?.status === 'success') {
        Alert.alert('Success', res.message || 'Password set successfully!', [
          {
            text: 'OK',
            onPress: (): void => {
              router.push(`/(auth)/profile?mobile=${mobile}`);
            },
          },
        ]);
      } else {
        Alert.alert('Error', res?.message || 'Failed to set password');
      }
    } catch (err: any) {
      console.error('Set password error:', err);
      Alert.alert('Error', err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
              source={require('../../assets/via-farm-img/icons/logo.png')}
            />

            {/* Card */}
            <View style={styles.card}>
              <View style={styles.topBorder} />
              <View style={styles.cardContent}>
                <Text style={styles.title}>Set Password</Text>
                <Text style={styles.subtitle}>
                  Create a secure password for your account
                </Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Enter Password</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChangeText={setPasswordText}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#999"
                    editable={!loading}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#999"
                    editable={!loading}
                    returnKeyType="done"
                  />
                </View>

                <TouchableOpacity
                  style={styles.showPasswordContainer}
                  onPress={() => setShowPassword((s) => !s)}
                  disabled={loading}
                >
                  <Text style={styles.showPasswordText}>
                    {showPassword ? '🙈 Hide Password' : '👁️ Show Password'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.continueButton, loading && styles.buttonDisabled]}
                  onPress={handleSetPassword}
                  disabled={loading}
                >
                  <Text style={styles.continueButtonText}>
                    {loading ? 'Please wait...' : 'Continue'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: moderateScale(24) }} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? moderateScale(32) : moderateScale(20),
    paddingBottom: moderateScale(24),
  },
  logoImage: {
    width: scale(160), 
    height: scale(160),
    resizeMode: 'contain',
    marginBottom: moderateScale(8),
    marginTop: moderateScale(8),
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: moderateScale(18),
    padding: 0,
    marginTop: moderateScale(12),
    marginBottom: moderateScale(8),
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 3,
    borderColor: 'rgba(255, 202, 40, 1)',
    // elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: moderateScale(220),
    flexShrink: 1,
  },
  cardContent: {
    padding: moderateScale(18),
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: normalizeFont(15),
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: moderateScale(8),
  },
  subtitle: {
    fontSize: normalizeFont(12),
    color: '#666',
    textAlign: 'center',
    marginBottom: moderateScale(12),
    lineHeight: scale(20),
    paddingHorizontal: moderateScale(6),
  },
  inputContainer: {
    width: '100%',
    marginBottom: moderateScale(15),
  },
  inputLabel: {
    fontSize: normalizeFont(13),
    color: '#333',
    marginBottom: moderateScale(6),
    fontWeight: '500',
    marginLeft: 2,
  },
  textInput: {
    width: '100%',
    height: scale(48),
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    backgroundColor: '#fdfdfd',
    fontSize: normalizeFont(13),
  },
  showPasswordContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  showPasswordText: {
    fontSize: normalizeFont(12),
    color: '#007AFF',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(10),
    width: '70%',
    alignItems: 'center',
    marginTop: moderateScale(6),
  },
  continueButtonText: {
    color: '#fff',
    fontSize: normalizeFont(13),
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
});
