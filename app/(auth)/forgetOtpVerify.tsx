import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { moderateScale, normalizeFont, scale } from '../Responsive';

const FORGET_API_BASE = 'https://viafarm-1.onrender.com';

const ForgetOtpVerify = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  
  const { mobileNumber, otp: receivedOtp } = route.params || {};

  // Refs for input fields
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  useEffect(() => {
    // Auto focus on first input
    inputRefs[0].current?.focus();
  }, []);

  const handleOtpChange = (value, index) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.join('');

    // Validate OTP
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
          mobileNumber: mobileNumber,
          otp: otpValue,
        }
      );

      console.log('Verify OTP Response:', response.data);

      if (response.data.status === 'success') {
        Alert.alert('Success', 'OTP verified successfully', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to set password page
              navigation.navigate('setPasswordAfterForget', {
                mobileNumber: mobileNumber,
              });
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Verify OTP Error:', error);

      if (error.response) {
        const errorMessage = error.response.data?.message || 'Invalid OTP';
        Alert.alert('Error', errorMessage);
      } else if (error.request) {
        Alert.alert('Error', 'Network error. Please check your connection');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again');
      }
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
          mobileNumber: mobileNumber,
        }
      );

      if (response.data.status === 'success' && response.data.otp) {
        Alert.alert('Success', `New OTP sent: ${response.data.otp}`);
        // Clear current OTP
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 4-digit code sent to
        </Text>
        {/* <Text style={styles.phone}>{mobileNumber}</Text> */}

        {/* {receivedOtp && (
          <View style={styles.otpDisplayContainer}>
            <Text style={styles.otpDisplayText}>Your OTP: {receivedOtp}</Text>
          </View>
        )} */}

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={inputRefs[index]}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
              ]}
              maxLength={1}
              keyboardType="number-pad"
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              editable={!loading}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerifyOTP}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendOTP}
          disabled={loading}>
          <Text style={styles.resendText}>
            Didn't receive code? <Text style={styles.resendLink}>Resend</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding:moderateScale(20),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius:moderateScale(12),
    padding:moderateScale(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius:moderateScale(8),
    elevation: 5,
  },
  title: {
    fontSize:normalizeFont(15),
    fontWeight: 'bold',
    color: '#333',
    marginBottom:moderateScale(8),
    textAlign: 'center',
  },
  subtitle: {
    fontSize:normalizeFont(12),
    color: '#666',
    marginBottom:moderateScale(7),
    textAlign: 'center',
  },
  phone: {
    fontSize:normalizeFont(13),
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom:moderateScale(24),
  },
  otpDisplayContainer: {
    backgroundColor: '#E8F5E9',
    padding:moderateScale(12),
    borderRadius:moderateScale(8),
    marginBottom:moderateScale(20),
  },
  otpDisplayText: {
    fontSize:normalizeFont(13),
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom:moderateScale(24),
  },
  otpInput: {
    width:scale(50),
    height:scale(50),
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius:moderateScale(12),
    fontSize:normalizeFont(15),
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#fafafa',
  },
  otpInputFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  button: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    borderRadius:moderateScale(8),
    paddingVertical:moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom:moderateScale(16),
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize:normalizeFont(13),
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical:moderateScale(8),
  },
  resendText: {
    fontSize:normalizeFont(11),
    color: '#666',
  },
  resendLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default ForgetOtpVerify;