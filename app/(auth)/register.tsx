import { useNavigation, useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { moderateScale, normalizeFont, scale } from '../Responsive';


export default function RegisterScreen() {
  const { signup } = useContext(AuthContext);
  const [mobile, setMobile] = useState('');
  const router = useRouter();
  const navigation = useNavigation();

  const handleSignup = async () => {
    if (!mobile || mobile.length < 10) {
      Alert.alert('Error', 'Please enter a valid mobile number');
      return;
    }
    
    try {
      // console.log('Calling signup with mobile:', mobile); 
      const res = await signup(mobile);
      console.log('Signup response:', res); 
      
      if (res.status === 'success') {
        Alert.alert('OTP Sent', `OTP: ${res.otp}`, [
          {
            text: 'OK',
            onPress: () => {
              router.push(`/(auth)/register-otp?mobile=${mobile}`);
            }
          }
        ]);
      } else {
        Alert.alert('Error', res.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Signup error:', err); 
      Alert.alert('Error', err.message || 'Something went wrong');
    }
  };


  const loginPage=()=>{
    navigation.navigate('login')
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image style={{width:250,height:250}} source={require("../../assets/via-farm-img/icons/logo.png")} />
      </View>
      
      <View style={styles.formContainer}>
        <View style={styles.formCard}>
          <Text style={styles.title}>Create an Account</Text>
          
          <Text style={styles.subtitle}>
            We will send you an <Text style={styles.boldText}>One Time Password</Text>
          </Text>
          <Text style={styles.subtitle}>on this mobile number</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Enter Mobile Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter 10 digit mobile number"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="numeric"
              placeholderTextColor="#999"
              maxLength={10}
            />
          </View>
          
          <TouchableOpacity style={styles.otpButton} onPress={handleSignup}>
            <Text style={styles.otpButtonText}> Get OTP</Text>
          </TouchableOpacity>
          
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={loginPage}>
              <Text style={styles.signInLink}>Sign In</Text>
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
    fontSize: normalizeFont(48),
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 2,
  },
  formContainer: {
    flex: 2,
    justifyContent: 'flex-start',
  },
  formCard: {
    backgroundColor: '#fff',
    borderWidth:2,
    borderColor: "rgba(255, 202, 40, 1)",
    borderRadius: moderateScale(20),
    height:'130%',
    padding: moderateScale(30),
    shadowColor: '#000',
    shadowOffset: {
      width:scale(3),
      height: scale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: normalizeFont(16),
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: moderateScale(20),
  },
  subtitle: {
    fontSize: normalizeFont(12),
    color: '#666',
    textAlign: 'center',
    lineHeight: scale(20),
  },
  boldText: {
    fontWeight: 'bold',
    color: '#333',
  },
  inputContainer: {
    marginTop: moderateScale(30),
    marginBottom: moderateScale(25),
  },
  inputLabel: {
    fontSize: normalizeFont(13),
    color: '#333',
    marginBottom: moderateScale(8),
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: moderateScale(15),
    fontSize: normalizeFont(13),
    backgroundColor: '#fafafa',
    color: '#333',
  },
  otpButton: {
    backgroundColor: '#4CAF50',
    borderRadius: moderateScale(8),
    paddingVertical: moderateScale(15),
    paddingHorizontal: moderateScale(20),
    alignItems: 'center',
    marginBottom: moderateScale(20),
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  otpButtonText: {
    color: '#fff',
    fontSize: normalizeFont(13),
    fontWeight: '600',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(10),
  },
  signInText: {
    fontSize: normalizeFont(12),
    color: '#666',
  },
  signInLink: {
    fontSize: normalizeFont(13),
    color: '#007AFF',
    fontWeight: '500',
  },
});