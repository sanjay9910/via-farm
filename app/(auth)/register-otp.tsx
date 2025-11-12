import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { moderateScale, normalizeFont, scale } from '../Responsive';

export default function RegisterOtpScreen(): JSX.Element {
  const { verifyOtp } = useContext(AuthContext);
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    console.log('RegisterOtpScreen loaded with mobile:', mobile);
  }, [mobile]);

  const handleOtpChange = (value: string, index: number): void => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
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
      // console.log('Verifying OTP:', otpString, 'for mobile:', mobile);
      const res = await verifyOtp(mobile, otpString);
      // console.log('Verify response:', res);
      
      if (res.status === 'success') {
        Alert.alert('Success', 'OTP Verified Successfully!', [
          {
            text: 'OK',
            onPress: (): void => {
              router.push(`/(auth)/setPassword?mobile=${mobile}`);
            }
          }
        ]);
      } else {
        Alert.alert('Error', res.message || 'Invalid OTP');
      }
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      Alert.alert('Error', err.message || 'Something went wrong');
    }
  };

  const handleResendOTP = (): void => {
    Alert.alert('Resend OTP', 'OTP has been resent to your mobile number');
    setOtp(['', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
       <Image style={{width:250,height:250}}  source={require("../../assets/via-farm-img/icons/logo.png")} />
      </View>
      
      <View style={styles.formContainer}>
        <View style={styles.formCard}>
          <View style={styles.topBorder} />
          <View style={styles.cardContent}>
            <Text style={styles.title}>OTP Verification</Text>
            
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  autoFocus={index === 0}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: moderateScale(60),
  },
  logoText: {
    fontSize: normalizeFont(10),
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 2,
  },
  formContainer: {
    flex: 2,
    justifyContent: 'flex-start',
    paddingTop: moderateScale(20),
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    width:'100%',
    borderWidth:2,
    borderColor:'#FFD700',
    height: '130%',
    shadowColor: '#000',
    shadowOffset: {
      width: scale(5),
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  topBorder: {
    width: '100%',
    height: scale(3),
    backgroundColor: '#FFD700',
  },
  cardContent: {
    padding: scale(30),
  },
  title: {
    fontSize: normalizeFont(16),
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: moderateScale(40),
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(30),
    paddingHorizontal: moderateScale(10),
  },
  otpInput: {
    width: scale(50),
    height: scale(50),
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: moderateScale(12),
    fontSize: normalizeFont(16),
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#fafafa',
    textAlign: 'center',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(30),
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
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: moderateScale(15),
    paddingHorizontal: moderateScale(20),
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: normalizeFont(14),
    fontWeight: '600',
  },
});
