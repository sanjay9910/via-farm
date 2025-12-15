import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
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
import { moderateScale, normalizeFont, scale } from '../Responsive';

const API_BASE = 'https://viafarm-1.onrender.com/api/auth';

const VerifyOtpWithLogin = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const navigation = useNavigation();
  const route = useRoute();
  const mobileNumber = route.params?.mobileNumber || '';
  const otpInputs = useRef([]);

  // Timer for resend OTP
  React.useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (value, index) => {
    // accept only digits
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 3) {
      otpInputs.current[index + 1]?.focus();
    }

    if (digit && index === 3) {
      // small timeout to ensure state updated before verify
      setTimeout(() => {
        handleVerifyOtp();
      }, 150);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  // Save token to AsyncStorage
  const saveTokenToStorage = async (token, userData) => {
    try {
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      console.log('Token saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving token:', error);
      return false;
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');

    if (otpString.length !== 4) {
      Alert.alert('Error', 'Please enter the complete 4-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${API_BASE}/verify-otp-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobileNumber: mobileNumber,
          otp: otpString,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseText = await response.text();
      let data = {};

      if (responseText && responseText.trim() !== '') {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
          Alert.alert('Error', 'Invalid response from server');
          return;
        }
      }

      if (response.ok) {
        if (data.status === 'success') {
          const tokenSaved = await saveTokenToStorage(
            data.data.token,
            data.data.user
          );

          if (tokenSaved) {
            Alert.alert('Success', data.message || 'Login successful');

            const userRole = data.data.user?.role;

            if (userRole === 'Vendor') {
              navigation.reset({
                index: 0,
                routes: [{ name: '(vendors)' }],
              });
            } else if (userRole === 'Buyer') {
              navigation.reset({
                index: 0,
                routes: [{ name: '(tabs)' }],
              });
            } else {
              console.warn('User role not specified, defaulting to buyer tabs');
              navigation.reset({
                index: 0,
                routes: [{ name: '(tabs)' }],
              });
            }
          } else {
            Alert.alert('Error', 'Failed to save login data');
          }
        } else {
          Alert.alert('Error', data.message || 'OTP verification failed');
        }
      } else {
        Alert.alert(
          'Error',
          data.message || `OTP verification failed. Status: ${response.status}`
        );
      }
    } catch (error) {
      console.error('OTP verification error:', error);

      if (error.name === 'AbortError') {
        Alert.alert('Timeout', 'Request timed out. Please try again.');
      } else if (error.message && error.message.includes('Network')) {
        Alert.alert('Network Error', 'Please check your internet connection.');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE}/request-otp-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobileNumber: mobileNumber,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let data = {};

      if (responseText && responseText.trim() !== '') {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
        }
      }

      if (response.ok) {
        Alert.alert(
          'Success',
          data.message || 'OTP has been resent to your mobile number'
        );
        setTimer(60);
        setOtp(['', '', '', '']);
        if (otpInputs.current[0]) {
          otpInputs.current[0].focus();
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      if (error.name === 'AbortError') {
        Alert.alert('Timeout', 'Request timed out. Please try again.');
      } else {
        Alert.alert('Error', 'Network error. Please try again.');
      }
    } finally {
      setResendLoading(false);
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
              <Text allowFontScaling={false} style={styles.heading}>Verify OTP</Text>
              <Text allowFontScaling={false} style={styles.subtitle}>
                Enter the 4-digit OTP sent to your mobile number
              </Text>

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                  allowFontScaling={false}
                    key={index}
                    style={[styles.otpInput, digit && styles.otpInputFilled]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    ref={(ref) => (otpInputs.current[index] = ref)}
                    selectTextOnFocus
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                <Text allowFontScaling={false} style={styles.buttonText}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Text>
              </TouchableOpacity>

              <View style={styles.resendContainer}>
                <Text allowFontScaling={false} style={styles.resendText}>Didn't receive OTP? </Text>
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={timer > 0 || resendLoading}
                >
                  <Text
                  allowFontScaling={false}
                    style={[
                      styles.resendButtonText,
                      (timer > 0 || resendLoading) && styles.resendButtonDisabled,
                    ]}
                  >
                    {resendLoading ? 'Sending...' : `Resend ${timer > 0 ? `(${timer}s)` : ''}`}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text allowFontScaling={false} style={styles.backButtonText}>Change Mobile Number</Text>
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
    width: scale(300),
    height: scale(300),
    resizeMode: 'contain',
    marginBottom: moderateScale(-60),
  },
  card: {
    height: '80%',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    padding: moderateScale(28),
    marginTop: moderateScale(90),
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
  },
  heading: {
    fontSize: normalizeFont(15),
    fontWeight: '600',
    marginBottom: moderateScale(8),
  },
  subtitle: {
    fontSize: normalizeFont(12),
    textAlign: 'center',
    marginBottom: moderateScale(18),
    color: '#666',
    lineHeight: scale(22),
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(30),
    paddingHorizontal: moderateScale(20),
  },
  otpInput: {
    borderWidth: 1,
    marginLeft:moderateScale(17),
    borderColor: '#ddd',
    borderRadius: moderateScale(12),
    width: scale(50),
    height: scale(50),
    textAlign: 'center',
    fontSize: normalizeFont(15),
    backgroundColor: '#f9f9f9',
    fontWeight: 'bold',
  },
  otpInputFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    marginTop: moderateScale(10),
    marginHorizontal: moderateScale(20),
    width: '70%',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: normalizeFont(13),
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(20),
  },
  resendText: {
    color: '#666',
    fontSize: normalizeFont(12),
  },
  resendButtonText: {
    color: '#007AFF',
    fontSize: normalizeFont(12),
    fontWeight: '600',
  },
  resendButtonDisabled: {
    color: '#ccc',
  },
  backButton: {
    marginTop: moderateScale(20),
    alignItems: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: normalizeFont(12),
  },
});

export default VerifyOtpWithLogin;
