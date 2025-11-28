import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { moderateScale, normalizeFont } from '../Responsive';

const FORGET_API_BASE = 'https://viafarm-1.onrender.com';

const ForgetPassword = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleGetOTP = async () => {
    // Validate mobile number
    if (!mobileNumber || mobileNumber.trim().length === 0) {
      Alert.alert('Error', 'Please enter mobile number');
      return;
    }

    if (mobileNumber.length < 10) {
      Alert.alert('Error', 'Please enter valid mobile number');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${FORGET_API_BASE}/api/auth/forgot-password`,
        {
          mobileNumber: mobileNumber.trim(),
        }
      );

      // console.log('Forget Password Response:', response.data);

      if (response.data.status === 'success') {
        // Check if OTP is null or undefined
        if (!response.data.otp || response.data.otp === null) {
          Alert.alert('Error', 'This number is not registered');
          return;
        }

        // Show OTP in alert
        Alert.alert(
          'OTP Sent Successfully',
          `Your OTP is: ${response.data.otp}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to verify OTP page with mobile number
                navigation.navigate('forgetOtpVerify', {
                  mobileNumber: mobileNumber.trim(),
                  otp: response.data.otp,
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Forget Password Error:', error);

      if (error.response) {
        // Server responded with error
        const errorMessage = error.response.data?.message || 'Account does not exist';
        
        if (error.response.status === 404 || errorMessage.toLowerCase().includes('not found')) {
          Alert.alert('Error', 'This number is not registered');
        } else {
          Alert.alert('Error', errorMessage);
        }
      } else if (error.request) {
        // Request made but no response
        Alert.alert('Error', 'Network error. Please check your connection');
      } else {
        // Something else happened
        Alert.alert('Error', 'Something went wrong. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Forget Password</Text>
        <Text style={styles.subtitle}>
          Enter your mobile number to receive OTP
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your mobile number"
            keyboardType="phone-pad"
            value={mobileNumber}
            onChangeText={setMobileNumber}
            maxLength={10}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleGetOTP}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Get OTP</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
    fontSize: normalizeFont(12),
    color: '#666',
    marginBottom:moderateScale(24),
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom:moderateScale(20),
  },
  label: {
    fontSize:normalizeFont(12),
    fontWeight: '600',
    color: '#333',
    marginBottom:moderateScale(8),
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius:moderateScale(8),
    paddingHorizontal:moderateScale(16),
    paddingVertical:moderateScale(12),
    fontSize:normalizeFont(12),
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    borderRadius:moderateScale(8),
    paddingVertical:moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop:moderateScale(8),
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize:normalizeFont(13),
    fontWeight: '600',
  },
});

export default ForgetPassword;