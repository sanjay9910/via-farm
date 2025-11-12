import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { moderateScale, normalizeFont, scale } from '../Responsive';

export default function ProfileScreen() {
  const { completeProfile } = useContext(AuthContext);
  const { mobile } = useLocalSearchParams();
  const router = useRouter();

  const [name, setName] = useState('');
  const [role, setRole] = useState('Buyer'); // Backend enum: 'Buyer' or 'Vendor'

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    
    try {
      const profileData = {
        mobileNumber: mobile, 
        name: name.trim(),    
        role: role, 
      };
      
      // console.log('Sending profile data:', profileData);
      
      const res = await completeProfile(profileData);
      
      if (res.status === 'success' || res.data) {
        Alert.alert('Success', 'Profile completed successfully!');
        
        // ROLE KE BASIS PE NAVIGATE KARO
        if (role === 'Buyer') {
          router.replace('/(tabs)'); 
        } else if (role === 'Vendor') {
          router.replace('/(vendors)'); 
        }
      }
    } catch (err) {
      console.error('Profile save error:', err);
      Alert.alert('Error', err.message || 'Failed to complete profile');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>Just one more step to get started</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput 
                style={styles.input}
                placeholder="Enter your full name" 
                value={name} 
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Your Role</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity 
                  style={[styles.roleButton, role === 'Buyer' && styles.roleButtonActive]}
                  onPress={() => setRole('Buyer')}
                >
                  <Text style={[styles.roleText, role === 'Buyer' && styles.roleTextActive]}>
                   Buyer
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.roleButton, role === 'Vendor' && styles.roleButtonActive]}
                  onPress={() => setRole('Vendor')}
                >
                  <Text style={[styles.roleText, role === 'Vendor' && styles.roleTextActive]}>
                     Vendor
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* {mobile && (
              <View style={styles.mobileInfo}>
                <Text style={styles.mobileLabel}>Mobile Number</Text>
                <Text style={styles.mobileNumber}>{mobile}</Text>
              </View>
            )} */}
          </View>

          <TouchableOpacity style={styles.completeButton} onPress={saveProfile}>
            <Text style={styles.completeButtonText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(40),
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: moderateScale(40),
  },
  title: {
    fontSize: normalizeFont(18),
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: normalizeFont(13),
    color: '#666',
    textAlign: 'center',
  },
  form: {
    marginBottom: moderateScale(40),
  },
  inputContainer: {
    marginBottom: moderateScale(24),
  },
  label: {
    fontSize: normalizeFont(13),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(8),
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
    fontSize: normalizeFont(13),
    color: '#333',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: scale(12),
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(20),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  roleButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
  },
  roleText: {
    fontSize: normalizeFont(13),
    fontWeight: '600',
    color: '#666',
  },
  roleTextActive: {
    color: '#fff',
  },
  mobileInfo: {
    backgroundColor: '#f0f0f0',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
    marginTop: moderateScale(8),
  },
  mobileLabel: {
    fontSize: normalizeFont(11),
    color: '#666',
    marginBottom: moderateScale(4),
  },
  mobileNumber: {
    fontSize: normalizeFont(16),
    fontWeight: '600',
    color: '#333',
  },
  completeButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(18),
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: normalizeFont(15),
    fontWeight: 'bold',
  },
});