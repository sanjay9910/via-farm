// import { Ionicons } from "@expo/vector-icons";
// import { useNavigation } from "expo-router";
// import React, { useContext, useState } from "react";
// import {
//   Alert,
//   Image,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { AuthContext } from "../context/AuthContext";
// import { saveToken } from "../utility/Storage";

// export default function LoginScreen() {
//   const navigation = useNavigation();
//   const [mobile, setMobile] = useState("7777777777");
//   const [password, setPassword] = useState("1234567");
//   const { login, user } = useContext(AuthContext);

//   const handleLogin = async () => {
//     if (!mobile.trim()) {
//       Alert.alert("Error", "Please enter mobile number");
//       return;
//     }
//     if (!password.trim()) {
//       Alert.alert("Error", "Please enter password");
//       return;
//     }
//     if (mobile.length !== 10) {
//       Alert.alert("Error", "Please enter valid 10-digit mobile number");
//       return;
//     }

//     try {
//       const response = await login(mobile, password);

//       if (response.status === "success") {
//         saveToken(response?.data.token);
//         // Get user role from response
//         const userRole = response.data?.user?.role;

//         if (userRole === "Vendor") {
//           navigation.reset({
//             index: 0,
//             routes: [{ name: "(vendors)" }],
//           });
//         } else if (userRole === "Buyer") {
//           navigation.reset({
//             index: 0,
//             routes: [{ name: "(tabs)" }],
//           });
//         } else {
//           Alert.alert("Error", "Invalid user role");
//         }
//       } else {
//         Alert.alert("Error", response.message || "Invalid credentials");
//       }
//     } catch (err) {
//       console.error("Login error:", err);
//       Alert.alert(
//         "Error",
//         err.response?.data?.message || "Something went wrong, try again later"
//       );
//     }
//   };

//   const handleOtpLogin = () => {
//     navigation.navigate("loginWithOtp");
//   };

//   const ForgetPassword = () => {
//     navigation.navigate("forget-password");
//   };

//   const registerNew = () => {
//     navigation.navigate("register");
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* LOGO */}
//       <Image style={{width:200,height:200}} source={require("../../assets/via-farm-img/icons/logo.png")} />
//       {/* Card */}
//       <View style={styles.card}>
//         {/* Heading */}
//         <Text style={styles.heading}>Welcome Back !</Text>

//         {/* Mobile Number Field */}
//         <View style={styles.inputContainer}>
//           <Text style={styles.label}>Mobile Number</Text>
//           <TextInput
//             keyboardType="numeric"
//             value={mobile}
//             onChangeText={setMobile}
//             style={styles.input}
//           />
//         </View>

//         {/* Password Field */}
//         <View style={styles.inputContainer}>
//           <Text style={styles.label}>Password</Text>
//           <TextInput
//             secureTextEntry
//             value={password}
//             onChangeText={setPassword}
//             style={styles.input}
//           />
//         </View>

//         {/* Forgot Password */}
//         <TouchableOpacity style={styles.forgotWrapper} onPress={ForgetPassword}>
//           <Text style={styles.forgotText}>Forgot password?</Text>
//         </TouchableOpacity>

//         {/* Login Button */}
//         <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
//           <Ionicons name="log-in-outline" size={20} color="#fff" />
//           <Text style={styles.loginText}>Login</Text>
//         </TouchableOpacity>

//         {/* Login with OTP */}
//         <TouchableOpacity style={styles.otpBtn} onPress={handleOtpLogin}>
//           <Ionicons name="key-outline" size={20} color="green" />
//           <Text style={styles.otpText}>Login with OTP</Text>
//         </TouchableOpacity>

//         {/* SignUp */}
//         <TouchableOpacity style={styles.signupWrapper}>
//           <Text style={styles.signupText}>Don't have an account? </Text>
//           <TouchableOpacity onPress={registerNew}>
//             <Text style={styles.signupLink}>Sign Up</Text>
//           </TouchableOpacity>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//     alignItems: "center",
//     justifyContent: "flex-start",
//     paddingTop: 160,
//   },
//   logo: {
//     fontSize: 45,
//     fontWeight: "bold",
//     marginBottom: 40,
//   },
//   card: {
//     width: "100%",
//     height: "100%",
//     backgroundColor: "#fff",
//     borderRadius: 20,
//     padding: 30,
//     marginTop: 80,
//     borderWidth: 1,
//     borderColor: "rgba(255, 202, 40, 1)",
//     elevation: 5,
//     shadowColor: "rgba(255, 202, 40, 1)",
//     shadowOpacity: 0.1,
//     shadowRadius: 5,
//     shadowOffset: { width: 0, height: 2 },
//     alignItems: "center",
//   },
//   heading: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 25,
//   },
//   inputContainer: {
//     width: "100%",
//     marginBottom: 15,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#333",
//     marginBottom: 8,
//     marginLeft: 2,
//   },
//   input: {
//     width: "100%",
//     height: 50,
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 10,
//     paddingHorizontal: 12,
//     backgroundColor: "#fdfdfd",
//     fontSize: 16,
//   },
//   forgotWrapper: {
//     width: "100%",
//     alignItems: "flex-end",
//     marginBottom: 20,
//   },
//   forgotText: {
//     color: "#007AFF",
//     fontSize: 13,
//   },
//   loginBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     width: "70%",
//     height: 50,
//     borderRadius: 10,
//     backgroundColor: "rgba(76, 175, 80, 1)",
//     marginBottom: 15,
//   },
//   loginText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//     marginLeft: 8,
//   },
//   otpBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     width: "70%",
//     height: 50,
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: "green",
//     marginBottom: 20,
//   },
//   otpText: {
//     color: "green",
//     fontSize: 16,
//     fontWeight: "600",
//     marginLeft: 8,
//   },
//   signupWrapper: {
//     flexDirection: "row",
//     marginTop: 10,
//   },
//   signupText: {
//     fontSize: 14,
//     color: "#555",
//   },
//   signupLink: {
//     fontSize: 14,
//     color: "#007AFF",
//     fontWeight: "600",
//   },
// });


import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React, { useContext, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import { saveToken } from "../utility/Storage";

export default function LoginScreen() {
  const navigation = useNavigation();
  const [mobile, setMobile] = useState("7777777777");
  const [password, setPassword] = useState("1234567");
  const { login, user } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!mobile.trim()) {
      Alert.alert("Error", "Please enter mobile number");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Error", "Please enter password");
      return;
    }
    if (mobile.length !== 10) {
      Alert.alert("Error", "Please enter valid 10-digit mobile number");
      return;
    }

    try {
      const response = await login(mobile, password);

      if (response.status === "success") {
        saveToken(response?.data.token);
        // Get user role from response
        const userRole = response.data?.user?.role;

        if (userRole === "Vendor") {
          navigation.reset({
            index: 0,
            routes: [{ name: "(vendors)" }],
          });
        } else if (userRole === "Buyer") {
          navigation.reset({
            index: 0,
            routes: [{ name: "(tabs)" }],
          });
        } else {
          Alert.alert("Error", "Invalid user role");
        }
      } else {
        Alert.alert("Error", response.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Something went wrong, try again later"
      );
    }
  };

  const handleOtpLogin = () => {
    navigation.navigate("loginWithOtp");
  };

  const ForgetPassword = () => {
    navigation.navigate("forget-password");
  };

  const registerNew = () => {
    navigation.navigate("register");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* LOGO */}
      <Image
        style={styles.logoImage}
        source={require("../../assets/via-farm-img/icons/logo.png")}
      />

      {/* Card */}
      <View style={styles.card}>
        {/* Heading */}
        <Text style={styles.heading}>Welcome Back !</Text>

        {/* Mobile Number Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            keyboardType="numeric"
            value={mobile}
            onChangeText={setMobile}
            style={styles.input}
          />
        </View>

        {/* Password Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
        </View>

        {/* Forgot Password */}
        <TouchableOpacity style={styles.forgotWrapper} onPress={ForgetPassword}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Ionicons name="log-in-outline" size={20} color="#fff" />
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>

        {/* Login with OTP */}
        <TouchableOpacity style={styles.otpBtn} onPress={handleOtpLogin}>
          <Ionicons name="key-outline" size={20} color="green" />
          <Text style={styles.otpText}>Login with OTP</Text>
        </TouchableOpacity>

        {/* SignUp */}
        <View style={styles.signupWrapper}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={registerNew}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
 container: {
  flex: 1,
  backgroundColor: "#fff",
  alignItems: "center",
  paddingTop: Platform.OS === "ios" ? 40 : 30,
  paddingBottom: 0,
  marginBottom: 0,
},

  // logoImage: responsive, contained, and slightly overlaps the card for a modern look
  logoImage: {
    width: 250,
    height: 250,
    resizeMode: "contain",
    marginBottom: -60, 
  },

  card: {
    width: "100%",
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    marginTop:60,
    marginBottom:-35,
    borderWidth:1,
    borderColor: "rgba(255, 202, 40, 1)",
    elevation: 6,
    shadowColor: "rgba(0,0,0,0.08)",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    alignItems: "center",
  },

  heading: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 25,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginLeft: 2,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fdfdfd",
    fontSize: 16,
  },
  forgotWrapper: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 20,
  },
  forgotText: {
    color: "#007AFF",
    fontSize: 13,
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "70%",
    height: 50,
    borderRadius: 10,
    backgroundColor: "rgba(76, 175, 80, 1)",
    marginBottom: 15,
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  otpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "70%",
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "green",
    marginBottom: 20,
  },
  otpText: {
    color: "green",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  signupWrapper: {
    flexDirection: "row",
    marginTop: 10,
  },
  signupText: {
    fontSize: 14,
    color: "#555",
  },
  signupLink: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
});
