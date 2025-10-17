import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';

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

            {mobile && (
              <View style={styles.mobileInfo}>
                <Text style={styles.mobileLabel}>Mobile Number</Text>
                <Text style={styles.mobileNumber}>{mobile}</Text>
              </View>
            )}
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
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
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
    gap: 12,
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 20,
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
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  roleTextActive: {
    color: '#fff',
  },
  mobileInfo: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  mobileLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  mobileNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  completeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 18,
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
    fontSize: 18,
    fontWeight: 'bold',
  },
});