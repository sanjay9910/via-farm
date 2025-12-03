import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useState } from 'react';
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

const ForgetPassword = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleGetOTP = async () => {
    if (!mobileNumber || mobileNumber.trim().length === 0) {
      Alert.alert('Error', 'Please enter mobile number');
      return;
    }

    if (mobileNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
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

      if (response.data.status === 'success') {
        if (!response.data.otp) {
          Alert.alert('Error', 'This number is not registered');
          return;
        }

        Alert.alert(
          'OTP Sent Successfully',
          `Your OTP is: ${response.data.otp}`,
          [
            {
              text: 'OK',
              onPress: () =>
                navigation.navigate('forgetOtpVerify', {
                  mobileNumber: mobileNumber.trim(),
                  otp: response.data.otp,
                }),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Something went wrong');
      }
    } catch (error) {
      if (error.response) {
        const msg =
          error.response.data?.message || 'This number is not registered';
        Alert.alert('Error', msg);
      } else if (error.request) {
        Alert.alert('Error', 'Network error. Please check your connection');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again');
      }
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
              <Text style={styles.heading}>Forget Password</Text>
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
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Get OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* SAME DESIGN STYLE AS ALL OTHER AUTH SCREENS */
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
    fontSize: normalizeFont(12),
    fontWeight: '600',
    marginBottom: moderateScale(8),
  },
  subtitle: {
    fontSize: normalizeFont(10),
    color: '#666',
    textAlign: 'center',
    marginBottom: moderateScale(18),
    // lineHeight: scale(20),
  },
  inputContainer: {
    width: '100%',
    marginBottom: moderateScale(18),
  },
  label: {
    fontSize: normalizeFont(10),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(8),
    marginLeft: 2,
  },
  input: {
    width: '100%',
    // height: scale(50),
    paddingVertical:moderateScale(10),
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    backgroundColor: '#fdfdfd',
    fontSize: normalizeFont(11),
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
    fontSize: normalizeFont(10),
    fontWeight: '600',
  },
});

export default ForgetPassword;
