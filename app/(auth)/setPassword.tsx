import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';

export default function SetPasswordScreen(): JSX.Element {
  const { newPassword } = useContext(AuthContext);
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const router = useRouter();
  const [password, setPasswordText] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSetPassword = async (): Promise<void> => {
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      // console.log('Setting password for mobile:', mobile);
      const res = await newPassword(mobile, password , confirmPassword);
      // console.log('Set password response:', res);
      
      if (res.status === 'success') {
        Alert.alert('Success', 'Password set successfully!', [
          {
            text: 'OK',
            onPress: (): void => {
              router.push(`/(auth)/profile?mobile=${mobile}`);
            }
          }
        ]);
      } else {
        Alert.alert('Error', res.message || 'Failed to set password');
      }
    } catch (err: any) {
      console.error('Set password error:', err);
      Alert.alert('Error', err.message || 'Something went wrong');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>LOGO</Text>
      </View>
      
      <View style={styles.formContainer}>
        <View style={styles.formCard}>
          <View style={styles.topBorder} />
          <View style={styles.cardContent}>
            <Text style={styles.title}>Set Password</Text>
            <Text style={styles.subtitle}>Create a secure password for your account</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Enter Password</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Minimum 6 characters"
                value={password}
                onChangeText={setPasswordText}
                secureTextEntry={!showPassword}
                placeholderTextColor="#999"
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
              />
            </View>

            <TouchableOpacity 
              style={styles.showPasswordContainer} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.showPasswordText}>
                {showPassword ? '🙈 Hide Password' : '👁️ Show Password'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.continueButton} onPress={handleSetPassword}>
              <Text style={styles.continueButtonText}>Continue</Text>
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
    backgroundColor: '#f5f5f5',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 2,
  },
  formContainer: {
    flex: 2,
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    height: '130%',
    borderWidth:2,
    borderColor:'#FFD700',
    shadowColor: '#000',
    shadowOffset: {
      width: 5,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  topBorder: {
    width: '100%',
    height: 3,
    backgroundColor: '#FFD700',
  },
  cardContent: {
    padding: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  showPasswordContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  showPasswordText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});