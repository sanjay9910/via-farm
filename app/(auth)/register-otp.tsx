import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { moderateScale, normalizeFont, scale } from '../Responsive';

export default function RegisterOtpScreen(): JSX.Element {
  const { verifyOtp } = useContext(AuthContext);
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // auto-focus first input when screen mounts
    setTimeout(() => inputRefs.current[0]?.focus(), 200);
    console.log('RegisterOtpScreen loaded with mobile:', mobile);
  }, [mobile]);

  const handleOtpChange = (value: string, index: number): void => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number): void => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (): Promise<void> => {
    const otpString = otp.join('');
    if (!otpString || otpString.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit OTP');
      return;
    }

    try {
      const res = await verifyOtp(mobile, otpString);

      if (res.status === 'success') {
        Alert.alert('Success', 'OTP Verified Successfully!', [
          {
            text: 'OK',
            onPress: (): void => {
              router.push(`/(auth)/setPassword?mobile=${mobile}`);
            },
          },
        ]);
      } else {
        Alert.alert('Error', res.message || 'Invalid OTP');
      }
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      Alert.alert('Error', err?.message || 'Something went wrong');
    }
  };

  const handleResendOTP = (): void => {
    // Keep behaviour same as before; just show alert and reset inputs
    Alert.alert('Resend OTP', 'OTP has been resent to your mobile number');
    setOtp(['', '', '', '']);
    setTimeout(() => inputRefs.current[0]?.focus(), 200);
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
                <Text style={styles.title}>OTP Verification</Text>

                <Text style={styles.subtitle}>
                  Enter the 4-digit code sent to <Text style={styles.bold}>{mobile}</Text>
                </Text>

                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      style={styles.otpInput}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                      autoFocus={index === 0}
                      returnKeyType="done"
                    />
                  ))}
                </View>

                <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>Did not receive OTP? </Text>
                  <TouchableOpacity onPress={handleResendOTP}>
                    <Text style={styles.resendLink}>Resend OTP</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
                  <Text style={styles.verifyButtonText}>✓ Verify & Proceed</Text>
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
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 30,
    paddingBottom: moderateScale(20),
  },
  logoImage: {
    width: scale(200),
    height: scale(200),
    resizeMode: 'contain',
    marginBottom: moderateScale(-60),
  },
  card: {
    height: '80%',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    padding: moderateScale(0),
    marginTop: moderateScale(60),
    marginBottom: moderateScale(20),
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 3,
    borderColor: 'rgba(255, 202, 40, 1)',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -4 },
    alignItems: 'center',
    overflow: 'hidden',
  },
  topBorder: {
    width: '100%',
    height: scale(3),
    backgroundColor: 'rgba(255, 202, 40, 1)',
  },
  cardContent: {
    padding: moderateScale(28),
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: normalizeFont(16),
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: moderateScale(12),
  },
  subtitle: {
    fontSize: normalizeFont(12),
    color: '#666',
    textAlign: 'center',
    marginBottom: moderateScale(14),
    lineHeight: scale(20),
  },
  bold: {
    fontWeight: '600',
    color: '#333',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(30),
    paddingHorizontal: moderateScale(20),
    width: '100%',
  },
  otpInput: {
    width: scale(50),
    height: scale(50),
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: moderateScale(12),
    fontSize: normalizeFont(16),
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#fdfdfd',
    textAlign: 'center',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(20),
  },
  resendText: {
    fontSize: normalizeFont(12),
    color: '#666',
  },
  resendLink: {
    fontSize: normalizeFont(12),
    color: '#007AFF',
    fontWeight: '500',
  },
  verifyButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    padding: moderateScale(14),
    borderRadius: moderateScale(12),
    width: '70%',
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: normalizeFont(14),
    fontWeight: '600',
  },
});
