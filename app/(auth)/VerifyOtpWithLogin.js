import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const API_BASE = 'https://viafarm-1.onrender.comapi/auth';

const VerifyOtpWithLogin = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const navigation = useNavigation();
  const route = useRoute();
  const { mobileNumber } = route.params;
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
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      otpInputs.current[index + 1].focus();
    }

    if (value && index === 3) {
      handleVerifyOtp();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1].focus();
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

      // console.log('Sending OTP verification request...');
      
      const response = await fetch(`${API_BASE}/verify-otp-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobileNumber: mobileNumber,
          otp: otpString,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // console.log('Response status:', response.status);
      
      const responseText = await response.text();
      // console.log('Response text:', responseText);
      
      let data = {};

      if (responseText && responseText.trim() !== '') {
        try {
          data = JSON.parse(responseText);
          // console.log('Parsed data:', data);
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
          Alert.alert('Error', 'Invalid response from server');
          return;
        }
      }

      if (response.ok) {
        if (data.status === 'success') {
          // Save token and user data to AsyncStorage
          const tokenSaved = await saveTokenToStorage(
            data.data.token, 
            data.data.user
          );

          if (tokenSaved) {
            Alert.alert('Success', data.message || 'Login successful');
            
            // console.log('Token saved:', data.data.token);
            // console.log('User data saved:', data.data.user);
            
            // Check user role and navigate accordingly
            const userRole = data.data.user?.role;
            
            if (userRole === 'Vendor') {
              // Navigate to vendor tabs
              navigation.reset({
                index: 0,
                routes: [{ name: '(vendors)' }],
              });
            } else if (userRole === 'Buyer') {
              // Navigate to buyer tabs
              navigation.reset({
                index: 0,
                routes: [{ name: '(tabs)' }],
              });
            } else {
              // Fallback to buyer tabs if role is not specified
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
        Alert.alert('Error', data.message || `OTP verification failed. Status: ${response.status}`);
      }

    } catch (error) {
      console.error('OTP verification error:', error);
      
      if (error.name === 'AbortError') {
        Alert.alert('Timeout', 'Request timed out. Please try again.');
      } else if (error.message.includes('Network')) {
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
        signal: controller.signal
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
        Alert.alert('Success', data.message || 'OTP has been resent to your mobile number');
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
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 4-digit OTP sent to your mobile number
          </Text>
          <Text style={styles.mobileNumber}>+91 {mobileNumber}</Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled
                ]}
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
            <Text style={styles.buttonText}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Text>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Didn't receive OTP?{' '}
            </Text>
            <TouchableOpacity
              onPress={handleResendOtp}
              disabled={timer > 0 || resendLoading}
            >
              <Text style={[
                styles.resendButtonText,
                (timer > 0 || resendLoading) && styles.resendButtonDisabled
              ]}>
                {resendLoading ? 'Sending...' : `Resend ${timer > 0 ? `(${timer}s)` : ''}`}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Change Mobile Number</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#666',
    lineHeight: 22,
  },
  mobileNumber: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    width: 60,
    height: 60,
    textAlign: 'center',
    fontSize: 20,
    backgroundColor: '#f9f9f9',
    fontWeight: 'bold',
  },
  otpInputFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    color: '#666',
    fontSize: 16,
  },
  resendButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButtonDisabled: {
    color: '#ccc',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});

export default VerifyOtpWithLogin;