import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { moderateScale, normalizeFont, scale } from '../Responsive';

const FORGET_API_BASE = 'https://viafarm-1.onrender.com';

const ForgetOtpVerify = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();

  const { mobileNumber } = route.params || {};

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleOtpChange = (value, index) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const updatedOtp = [...otp];
    updatedOtp[index] = digit;
    setOtp(updatedOtp);

    if (digit && index < 3) inputRefs[index + 1].current?.focus();
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.join('');

    if (otpValue.length !== 4) {
      Alert.alert('Error', 'Please enter complete 4-digit OTP');
      return;
    }

    if (!mobileNumber) {
      Alert.alert('Error', 'Mobile number not found');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${FORGET_API_BASE}/api/auth/reset-password`,
        {
          mobileNumber,
          otp: otpValue,
        }
      );

      if (response.data.status === 'success') {
        Alert.alert('Success', 'OTP verified successfully', [
          {
            text: 'OK',
            onPress: () =>
              navigation.navigate('setPasswordAfterForget', {
                mobileNumber,
              }),
          },
        ]);
      } else {
        Alert.alert('Error', response.data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Verify OTP Error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'Something went wrong. Please try again'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);

    try {
      const response = await axios.post(
        `${FORGET_API_BASE}/api/auth/forgot-password`,
        {
          mobileNumber,
        }
      );

      if (response.data.status === 'success') {
        Alert.alert('Success', `New OTP sent: ${response.data.otp}`);
        setOtp(['', '', '', '']);
        inputRefs[0].current?.focus();
      } else {
        Alert.alert('Error', 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP Error:', error);
      Alert.alert('Error', 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* LOGO */}
            <Image
              style={styles.logoImage}
              source={require('../../assets/via-farm-img/icons/logo.png')}
            />

            {/* CARD */}
            <View style={styles.card}>
              <Text style={styles.heading}>Verify OTP</Text>
              <Text style={styles.subtitle}>
                Enter the 4-digit OTP sent to your mobile number
              </Text>

              {/* OTP Inputs */}
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={inputRefs[index]}
                    style={[styles.otpInput, digit && styles.otpInputFilled]}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={digit}
                    onChangeText={(val) => handleOtpChange(val, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    editable={!loading}
                  />
                ))}
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>

              {/* Resend OTP */}
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendOTP}
                disabled={loading}
              >
                <Text style={styles.resendText}>
                  Didn’t receive code?{' '}
                  <Text style={styles.resendLink}>Resend</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* SAME DESIGN AS LOGIN PAGE */
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
    padding: moderateScale(28),
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
  },
  heading: {
    fontSize: normalizeFont(15),
    fontWeight: '600',
    marginBottom: moderateScale(8),
  },
  subtitle: {
    fontSize: normalizeFont(12),
    color: '#666',
    textAlign: 'center',
    marginBottom: moderateScale(25),
    lineHeight: scale(20),
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(25),
    paddingHorizontal: moderateScale(20),
  },
  otpInput: {
    width: scale(50),
    height: scale(50),
    marginLeft:moderateScale(20),
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: moderateScale(12),
    backgroundColor: '#fdfdfd',
    textAlign: 'center',
    fontSize: normalizeFont(15),
    fontWeight: 'bold',
  },
  otpInputFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    padding: moderateScale(15),
    borderRadius: moderateScale(12),
    width: '70%',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: normalizeFont(13),
    fontWeight: '600',
  },
  resendButton: {
    marginTop: moderateScale(15),
  },
  resendText: {
    color: '#666',
    fontSize: normalizeFont(12),
  },
  resendLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default ForgetOtpVerify;
