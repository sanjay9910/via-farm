// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import React, { useState } from 'react';
// import {
//   ActivityIndicator,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from 'react-native';

// // Define your API base URL
// const API_BASE = 'https://393rb0pp-5000.inc1.devtunnels.ms/api/auth';

// interface ProfileData {
//   name: string;
//   role: string;
// }

// interface User {
//   id: string;
//   name: string;
//   mobileNumber: string;
//   role: string;
// }

// interface UserProfileProps {
//   setUser: (user: User) => void;
//   onSuccess?: () => void;
// }

// const UserProfile: React.FC<UserProfileProps> = ({ setUser, onSuccess }) => {
//   const [formData, setFormData] = useState<ProfileData>({
//     name: '',
//     role: '',
//   });
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState<Partial<ProfileData>>({});
//   const [showRoleDropdown, setShowRoleDropdown] = useState(false);

//   const roles = [
//     { label: 'Student', value: 'vendors' },
//     { label: 'Teacher', value: 'buyer' },
//   ];

//   const createProfile = async (profileData: ProfileData) => {
//     try {
//       const { name, role } = profileData;
      
//       console.log("Calling createProfile API with:", { name, role });
      
//       const res = await axios.post(`${API_BASE}/complete-profile`, {
//         name,
//         role,
//       });

//       console.log("Full API response:", res.data);

//       if (res.data.status === 'success') {
//         const { token, user } = res.data.data;
//         await AsyncStorage.setItem('userToken', token);
//         await AsyncStorage.setItem('userData', JSON.stringify(user));
//         setUser(user);
//         console.log("Profile created successfully, token saved:", token);
//       }

//       return res.data;
//     } catch (err: any) {
//       console.error("CreateProfile error:", err.response?.data || err.message);
//       throw err;
//     }
//   };

//   const validateForm = (): boolean => {
//     const newErrors: Partial<ProfileData> = {};

//     if (!formData.name.trim()) {
//       newErrors.name = 'Name is required';
//     }

//     if (!formData.role) {
//       newErrors.role = 'Please select a role';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async () => {
//     if (!validateForm()) {
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await createProfile(formData);
      
//       if (response.status === 'success') {
//         Alert.alert(
//           'Success',
//           'Profile created successfully!',
//           [
//             {
//               text: 'OK',
//               onPress: () => {
//                 onSuccess?.();
//               },
//             },
//           ]
//         );
//       } else {
//         Alert.alert('Error', response.message || 'Failed to create profile');
//       }
//     } catch (error: any) {
//       Alert.alert(
//         'Error',
//         error.response?.data?.message || 'Failed to create profile. Please try again.'
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateFormData = (field: keyof ProfileData, value: string) => {
//     setFormData(prev => ({
//       ...prev,
//       [field]: value,
//     }));
    
//     // Clear error when user starts typing
//     if (errors[field]) {
//       setErrors(prev => ({
//         ...prev,
//         [field]: undefined,
//       }));
//     }
//   };

//   const handleRoleSelect = (roleValue: string) => {
//     updateFormData('role', roleValue);
//     setShowRoleDropdown(false);
//   };

//   const getSelectedRoleLabel = () => {
//     const selectedRole = roles.find(role => role.value === formData.role);
//     return selectedRole ? selectedRole.label : 'You are a';
//   };

//   return (
//     <KeyboardAvoidingView 
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       <ScrollView contentContainerStyle={styles.scrollContainer}>
//         <View style={styles.formContainer}>
//           {/* Logo */}
//           <View style={styles.logoContainer}>
//             <Text style={styles.logo}>LOGO</Text>
//           </View>

//           {/* Golden Line */}
//           <View style={styles.goldenLine} />

//           {/* Subtitle */}
//           <Text style={styles.subtitle}>Let us know more!</Text>

//           {/* Name Input */}
//           <View style={styles.inputContainer}>
//             <Text style={styles.label}>Name</Text>
//             <TextInput
//               style={[styles.input, errors.name && styles.inputError]}
//               placeholder=""
//               value={formData.name}
//               onChangeText={(value) => updateFormData('name', value)}
//               autoCapitalize="words"
//             />
//             {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
//           </View>

//           {/* Role Dropdown */}
//           <View style={styles.inputContainer}>
//             <TouchableOpacity 
//               style={[styles.dropdown, errors.role && styles.inputError]}
//               onPress={() => setShowRoleDropdown(!showRoleDropdown)}
//             >
//               <View style={styles.dropdownContent}>
//                 <View>
//                   <Text style={styles.dropdownLabel}>You are a</Text>
//                   <Text style={styles.dropdownValue}>
//                     {formData.role ? getSelectedRoleLabel() : 'Buyer'}
//                   </Text>
//                 </View>
//                 <Text style={styles.dropdownArrow}>⌄</Text>
//               </View>
//             </TouchableOpacity>
//             {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}

//             {/* Dropdown Options */}
//             {showRoleDropdown && (
//               <View style={styles.dropdownOptions}>
//                 {roles.map((role) => (
//                   <TouchableOpacity
//                     key={role.value}
//                     style={styles.dropdownOption}
//                     onPress={() => handleRoleSelect(role.value)}
//                   >
//                     <Text style={styles.dropdownOptionText}>{role.label}</Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             )}
//           </View>

//           {/* Submit Button */}
//           <TouchableOpacity
//             style={[styles.submitButton, loading && styles.submitButtonDisabled]}
//             onPress={handleSubmit}
//             disabled={loading}
//           >
//             {loading ? (
//               <ActivityIndicator color="#fff" size="small" />
//             ) : (
//               <Text style={styles.submitButtonText}>Save</Text>
//             )}
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f8f8',
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     paddingHorizontal: 20,
//   },
//   formContainer: {
//     backgroundColor: '#fff',
//     padding: 30,
//     borderRadius: 20,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//     marginVertical: 20,
//   },
//   logoContainer: {
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   logo: {
//     fontSize: 32,
//     fontWeight: 'bold',
//     color: '#000',
//     letterSpacing: 2,
//   },
//   goldenLine: {
//     height: 3,
//     backgroundColor: '#FFD700',
//     marginHorizontal: 20,
//     marginBottom: 30,
//     borderRadius: 2,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     marginBottom: 40,
//   },
//   inputContainer: {
//     marginBottom: 25,
//     position: 'relative',
//   },
//   label: {
//     fontSize: 14,
//     color: '#888',
//     marginBottom: 8,
//   },
//   input: {
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//     paddingVertical: 12,
//     fontSize: 16,
//     color: '#333',
//     backgroundColor: 'transparent',
//   },
//   inputError: {
//     borderBottomColor: '#ff4444',
//   },
//   dropdown: {
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//     paddingVertical: 12,
//   },
//   dropdownContent: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   dropdownLabel: {
//     fontSize: 14,
//     color: '#888',
//     marginBottom: 4,
//   },
//   dropdownValue: {
//     fontSize: 16,
//     color: '#333',
//   },
//   dropdownArrow: {
//     fontSize: 18,
//     color: '#666',
//   },
//   dropdownOptions: {
//     position: 'absolute',
//     top: '100%',
//     left: 0,
//     right: 0,
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 5,
//     zIndex: 1000,
//     marginTop: 5,
//   },
//   dropdownOption: {
//     paddingVertical: 15,
//     paddingHorizontal: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   dropdownOptionText: {
//     fontSize: 16,
//     color: '#333',
//   },
//   errorText: {
//     color: '#ff4444',
//     fontSize: 12,
//     marginTop: 5,
//   },
//   submitButton: {
//     backgroundColor: '#4CAF50',
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginTop: 20,
//   },
//   submitButtonDisabled: {
//     backgroundColor: '#ccc',
//   },
//   submitButtonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '600',
//   },
// });

// export default UserProfile;