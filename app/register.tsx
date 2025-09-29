// import { useRouter } from 'expo-router';
// import React, { useContext, useState } from 'react';
// import { Alert, Button, TextInput, View } from 'react-native';
// import { AuthContext } from './context/AuthContext';

// export default function RegisterScreen() {
//   const { register, user } = useContext(AuthContext);
//   const router = useRouter();

//   const [name, setName] = useState('');
//   const [mobileNumber, setMobileNumber] = useState('');
//   const [password, setPassword] = useState('');

//   const handleRegister = async () => {
//     try {
//       await register({ name, mobileNumber, password, role: 'buyer' });
//       router.replace('/'); // Navigate to Home after successful login
//     } catch (error) {
//       Alert.alert('Error', error.message);
//     }
//   };

//   return (
//     <View style={{ padding: 20 }}>
//       <TextInput placeholder="Name" value={name} onChangeText={setName} />
//       <TextInput placeholder="Mobile Number" value={mobileNumber} onChangeText={setMobileNumber} keyboardType="numeric" />
//       <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
//       <Button title="Register" onPress={handleRegister} />
//     </View>
//   );
// }
