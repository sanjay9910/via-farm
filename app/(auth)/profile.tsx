import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { moderateScale, normalizeFont, scale } from '../Responsive';

export default function ProfileScreen() {
  const { completeProfile } = useContext(AuthContext);
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const router = useRouter();

  const [name, setName] = useState('');
  const [role, setRole] = useState('Buyer'); 
  const [loading, setLoading] = useState(false);

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      setLoading(true);
      const profileData = {
        mobileNumber: mobile,
        name: name.trim(),
        role,
      };

      const res = await completeProfile(profileData);

      // support both res.status and res.data shapes
      if (res?.status === 'success' || res?.data?.status === 'success' || res?.data) {
        Alert.alert('Success', 'Profile completed successfully!', [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/login');
            },
          },
        ]);
      } else {
        Alert.alert('Error', res?.message || 'Failed to complete profile');
      }
    } catch (err: any) {
      console.error('Profile save error:', err);
      Alert.alert('Error', err?.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* LOGO */}
            <Image
              style={styles.logoImage}
              source={require('../../assets/via-farm-img/icons/logo.png')}
            />

            {/* CARD */}
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.title}>Complete Your Profile</Text>
                <Text style={styles.subtitle}>Just one more step to get started</Text>

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
                      editable={!loading}
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Select Your Role</Text>
                    <View style={styles.roleContainer}>
                      <TouchableOpacity
                        style={[styles.roleButton, role === 'Buyer' && styles.roleButtonActive]}
                        onPress={() => setRole('Buyer')}
                        disabled={loading}
                      >
                        <Text style={[styles.roleText, role === 'Buyer' && styles.roleTextActive]}>
                          Buyer
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.roleButton, role === 'Vendor' && styles.roleButtonActive]}
                        onPress={() => setRole('Vendor')}
                        disabled={loading}
                      >
                        <Text style={[styles.roleText, role === 'Vendor' && styles.roleTextActive]}>
                          Vendor
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Mobile Number</Text>
                    <View style={styles.mobileInfo}>
                      <Text style={styles.mobileNumber}>{mobile}</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.completeButton, loading && styles.buttonDisabled]}
                  onPress={saveProfile}
                  disabled={loading}
                >
                  <Text style={styles.completeButtonText}>
                    {loading ? 'Please wait...' : 'Complete Profile'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
    padding: moderateScale(0),
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
    overflow: 'hidden',
  },
  cardContent: {
    padding: moderateScale(28),
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: normalizeFont(15),
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: moderateScale(8),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: normalizeFont(12),
    color: '#666',
    textAlign: 'center',
    marginBottom: moderateScale(20),
  },
  form: {
    width: '100%',
    marginBottom: moderateScale(20),
  },
  inputContainer: {
    marginBottom: moderateScale(18),
    width: '100%',
  },
  label: {
    fontSize: normalizeFont(12),
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(8),
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    fontSize: normalizeFont(12),
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
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
    paddingVertical: moderateScale(16),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  roleButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    borderColor: 'rgba(76, 175, 80, 1)',
  },
  roleText: {
    fontSize: normalizeFont(12),
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
    paddingVertical: moderateScale(12),
    marginTop: moderateScale(4),
  },
  mobileNumber: {
    fontSize: normalizeFont(13),
    fontWeight: '600',
    color: '#333',
  },
  completeButton: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(16),
    width: '70%',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginTop: moderateScale(8),
  },
  completeButtonText: {
    color: '#fff',
    fontSize: normalizeFont(13),
    fontWeight: '700',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
});
