// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { createContext, useEffect, useState } from 'react';

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [address, setAddress] = useState([])

//   const API_BASE = 'https://viafarm-1.onrender.com/api/auth';
//   const API_BUYER_BASE = 'https://viafarm-1.onrender.com/api/buyer';

//   useEffect(() => {
//     const loadUser = async () => {
//       const token = await AsyncStorage.getItem('userToken');
//       const userData = await AsyncStorage.getItem('userData');
//       if (token && userData) setUser(JSON.parse(userData));
//       setLoading(false);
//     };
//     loadUser();
//   }, []);

//   // Fetch Buyer Profile
//   const fetchBuyerProfile = async () => {
//     try {
//       const token = await AsyncStorage.getItem('userToken');
//       if (!token) {
//         throw new Error('No token found');
//       }

//       const res = await axios.get(`${API_BUYER_BASE}/profile`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       // console.log("Buyer Profile Response:", res.data);

//       if (res.data.success || res.data.status === 'success') {
//         // Handle both response structures
//         const profileData = res.data.user || res.data.data;
        
//         // Update user state with profile data
//         setUser(profileData);
//         // Update AsyncStorage
//         await AsyncStorage.setItem('userData', JSON.stringify(profileData));
//         return profileData;
//       }

//       return res.data;
//     } catch (err) {
//       console.error("FetchBuyerProfile error:", err.response?.data || err.message);
//       throw err;
//     }
//   };

//   // Signup OTP
//   const signup = async (mobileNumber) => {
//     const res = await axios.post(`${API_BASE}/signup`, { mobileNumber });
//     return res.data;
//   };

//   // Verify OTP
//   const verifyOtp = async (mobileNumber, otp) => {
//     const res = await axios.post(`${API_BASE}/verify-otp`, { mobileNumber, otp });
//     return res.data;
//   };

//   // Complete Profile - Updated function
//   const completeProfile = async (profileData) => {
//     try {
//       const { mobileNumber, name, role } = profileData;
      
//       // console.log("Calling completeProfile API with:", { mobileNumber, name, role });

//       if (!name || !name.trim()) {
//         throw new Error('Name is required');
//       }
      
//       if (!mobileNumber) {
//         throw new Error('Mobile number is required');
//       }

//       const res = await axios.post(`${API_BASE}/complete-profile`, {
//         mobileNumber: mobileNumber.toString().trim(),
//         name: name.trim(),
//         role: role || 'buyer',
//       });

//       // console.log("Full API response:", res.data);

//       if (res.data.status === 'success') {
//         const { token, user } = res.data.data;
//         await AsyncStorage.setItem('userToken', token);
//         await AsyncStorage.setItem('userData', JSON.stringify(user));
//         setUser(user);
//         // console.log("Profile completed successfully, token saved:", token);
//       }

//       return res.data;
//     } catch (err) {
//       console.error("CompleteProfile error:", err.response?.data || err.message);
//       throw new Error(err.response?.data?.message || err.message || 'Profile completion failed');
//     }
//   };

//   // Create Profile
//   const createProfile = async (profileData) => {
//     try {
//       const { mobileNumber, name, password, role } = profileData;
      
//       // console.log("Calling createProfile API with:", { name, role });

//       const res = await axios.post(`${API_BASE}/complete-profile`, {
//         mobileNumber,
//         name,
//         password,
//         role,
//       });

//       // console.log("Full API response:", res.data);

//       if (res.data.status === 'success') {
//         const { token, user } = res.data.data;
//         await AsyncStorage.setItem('userToken', token);
//         await AsyncStorage.setItem('userData', JSON.stringify(user));
//         setUser(user);
//         // console.log("Profile created successfully, token saved:", token);
//       }

//       return res.data;
//     } catch (err) {
//       console.error("CreateProfile error:", err.response?.data || err.message);
//       throw err;
//     }
//   };

//   // Login
//   const login = async (mobileNumber, password) => {
//     const res = await axios.post(`${API_BASE}/login`, { mobileNumber, password });
//     if (res.data.status === 'success') {
//       const { token, user } = res.data.data;
//       await AsyncStorage.setItem('userToken', token);
//       await AsyncStorage.setItem('userData', JSON.stringify(user));
//       setUser(user);
      
//       // Fetch buyer profile after login if user is buyer
//       if (user.role === 'buyer') {
//         try {
//           await fetchBuyerProfile();
//           await fetchBuyerAddress();
//         } catch (error) {
//           console.log("Could not fetch buyer profile after login:", error);
//         }
//       }
//     }
    
//     // console.log("check", res);

//     return res.data;
//   };

//   // Set Password 
//   const newPassword = async (mobileNumber, password, confirmPassword) => {
//     try {
//       // console.log("Calling setPassword API with:", { mobileNumber, password, confirmPassword });

//       const res = await axios.post(`${API_BASE}/set-Password`, {
//         mobileNumber,
//         password,
//         confirmPassword,
//       });

//       // console.log("Full API response:", res.data);

//       const token = res.data?.data?.token || res.data?.token;
//       const user = res.data?.data?.user || res.data?.user;

//       if (res.data.status === 'success' && token && user) {
//         await AsyncStorage.setItem('userToken', token);
//         await AsyncStorage.setItem('userData', JSON.stringify(user));
//         setUser(user);
//         // console.log("Token saved successfully:", token);
//       } else {
//         console.warn("Token or user missing in API response:", res.data);
//       }

//       return res.data;
//     } catch (err) {
//       console.error("SetPassword error:", err.response?.data || err.message);
//       throw err;
//     }
//   };

//   const logout = async () => {
//     await AsyncStorage.removeItem('userToken');
//     await AsyncStorage.removeItem('userData');
//     setUser(null);
//   };

// const fetchBuyerAddress = async () => {
//   try {
//     const token = await AsyncStorage.getItem('userToken');
//     if (!token) throw new Error('No token found');

//     const res = await axios.get(`${API_BUYER_BASE}/addresses`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     // console.log("Buyer Address Response:", res.data);

//     if (res.data.success || res.data.status === 'success') {
//       // Extract all addresses
//       const allAddresses = res.data.addresses || [];

//       // Pick the default address (isDefault === true)
//       const defaultAddress = allAddresses.find(addr => addr.isDefault) || allAddresses[0];

//       // Save both all addresses and default
//       setAddress(defaultAddress || {}); // Keep only default address in state for easy use
//       await AsyncStorage.setItem('buyerAddress', JSON.stringify(defaultAddress));

//       return defaultAddress;
//     }

//     return res.data;
//   } catch (error) {
//     console.error("Address Fetching Error:", error.response?.data || error.message);
//     throw error;
//   }
// };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         loading,
//         signup,
//         verifyOtp,
//         completeProfile,
//         createProfile, 
//         login,
//         logout,
//         newPassword,
//         fetchBuyerProfile,
//         fetchBuyerAddress,
//         address,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };


// app/context/AuthContext.js
// app/context/AuthContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { registerForPushNotificationsAsync } from '../utility/notifications';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProviderComponent({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState(null); // keep single default address or null

  const API_BASE = 'https://viafarm-1.onrender.com/api/auth';
  const API_BUYER_BASE = 'https://viafarm-1.onrender.com/api/buyer';
  const API_ROOT = 'https://viafarm-1.onrender.com/api';

  // LOAD USER ON APP START
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userData = await AsyncStorage.getItem('userData');

        if (token && userData) {
          try {
            setUser(JSON.parse(userData));
          } catch (e) {
            console.warn('Failed to parse userData from storage', e);
            // cleanup corrupted data
            await AsyncStorage.removeItem('userData');
            setUser(null);
          }

          // REGISTER PUSH TOKEN SAFELY (best-effort)
          try {
            const expoPushToken = await registerForPushNotificationsAsync();
            if (expoPushToken) {
              await AsyncStorage.setItem('expoPushToken', expoPushToken);
              // best-effort send to server; ignore failure
              try {
                await axios.post(
                  `${API_ROOT}/push-tokens`,
                  { token: expoPushToken, platform: Platform.OS },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
              } catch (err) {
                console.warn('Failed to send push-token to server on load:', err?.message || err);
              }
            }
          } catch (err) {
            console.warn('Push token register on load failed:', err?.message || err);
          }
        }
      } catch (err) {
        console.warn('loadUser error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // FETCH BUYER PROFILE (graceful - returns profile or null / structured error)
  const fetchBuyerProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.warn('fetchBuyerProfile: No token present. Skipping fetch.');
        return null;
      }

      const res = await axios.get(`${API_BUYER_BASE}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res?.data?.success || res?.data?.status === 'success') {
        const profileData = res.data.user || res.data.data;
        setUser(profileData);
        await AsyncStorage.setItem('userData', JSON.stringify(profileData));
        return profileData;
      }

      // API replied but not success
      console.warn('fetchBuyerProfile: API responded with non-success', res.data);
      return res.data || null;
    } catch (err) {
      console.error('fetchBuyerProfile error:', err?.response?.data || err.message || err);
      // don't throw to avoid uncaught in callers — return a structured failure
      return { success: false, message: err?.response?.data?.message || err.message || 'Profile fetch failed' };
    }
  };

  // SIGNUP
  const signup = async (mobileNumber) => {
    const res = await axios.post(`${API_BASE}/signup`, { mobileNumber });
    return res.data;
  };

  // VERIFY OTP
  const verifyOtp = async (mobileNumber, otp) => {
    const res = await axios.post(`${API_BASE}/verify-otp`, { mobileNumber, otp });
    return res.data;
  };

  // COMPLETE PROFILE
  const completeProfile = async (profileData) => {
    try {
      const { mobileNumber, name, role } = profileData;

      if (!name?.trim()) throw new Error('Name is required');
      if (!mobileNumber) throw new Error('Mobile number is required');

      const res = await axios.post(`${API_BASE}/complete-profile`, {
        mobileNumber: mobileNumber.toString().trim(),
        name: name.trim(),
        role: role || 'buyer',
      });

      if (res?.data?.status === 'success') {
        const { token, user: returnedUser } = res.data.data;
        if (token && returnedUser) {
          await AsyncStorage.setItem('userToken', token);
          await AsyncStorage.setItem('userData', JSON.stringify(returnedUser));
          setUser(returnedUser);

          // REGISTER PUSH TOKEN (best-effort)
          try {
            const expoPushToken = await registerForPushNotificationsAsync();
            if (expoPushToken) {
              await AsyncStorage.setItem('expoPushToken', expoPushToken);
              try {
                await axios.post(
                  `${API_ROOT}/push-tokens`,
                  { token: expoPushToken, platform: Platform.OS },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
              } catch (err) {
                console.warn('Failed to send push-token to server after completeProfile:', err?.message || err);
              }
            }
          } catch (err) {
            console.warn('registerForPushNotificationsAsync failed after completeProfile:', err?.message || err);
          }
        }
      }

      return res.data;
    } catch (err) {
      console.error('CompleteProfile error:', err?.response?.data || err.message || err);
      // rethrow so UI can show error to user when needed
      throw err;
    }
  };

  // CREATE PROFILE
  const createProfile = async (profileData) => {
    try {
      const { mobileNumber, name, password, role } = profileData;

      const res = await axios.post(`${API_BASE}/complete-profile`, {
        mobileNumber,
        name,
        password,
        role,
      });

      if (res?.data?.status === 'success') {
        const { token, user: returnedUser } = res.data.data;
        if (token && returnedUser) {
          await AsyncStorage.setItem('userToken', token);
          await AsyncStorage.setItem('userData', JSON.stringify(returnedUser));
          setUser(returnedUser);

          // REGISTER PUSH TOKEN (best-effort)
          try {
            const expoPushToken = await registerForPushNotificationsAsync();
            if (expoPushToken) {
              await AsyncStorage.setItem('expoPushToken', expoPushToken);
              try {
                await axios.post(
                  `${API_ROOT}/push-tokens`,
                  { token: expoPushToken, platform: Platform.OS },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
              } catch (err) {
                console.warn('Failed to send push-token to server after createProfile:', err?.message || err);
              }
            }
          } catch (err) {
            console.warn('registerForPushNotificationsAsync failed after createProfile:', err?.message || err);
          }
        }
      }

      return res.data;
    } catch (err) {
      console.error('CreateProfile error:', err?.response?.data || err.message || err);
      throw err;
    }
  };

  // LOGIN
  const login = async (mobileNumber, password) => {
    try {
      const res = await axios.post(`${API_BASE}/login`, { mobileNumber, password });

      if (res?.data?.status === 'success') {
        const { token, user: returnedUser } = res.data.data;

        if (token && returnedUser) {
          await AsyncStorage.setItem('userToken', token);
          await AsyncStorage.setItem('userData', JSON.stringify(returnedUser));
          setUser(returnedUser);

          // REGISTER PUSH TOKEN (best-effort)
          try {
            const expoPushToken = await registerForPushNotificationsAsync();
            if (expoPushToken) {
              await AsyncStorage.setItem('expoPushToken', expoPushToken);
              try {
                await axios.post(
                  `${API_ROOT}/push-tokens`,
                  { token: expoPushToken, platform: Platform.OS },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
              } catch (err) {
                console.warn('Failed to send push-token to server after login:', err?.message || err);
              }
            }
          } catch (err) {
            console.warn('registerForPushNotificationsAsync failed after login:', err?.message || err);
          }

          // If buyer, fetch profile & address safely (no uncaught rejections)
          if (returnedUser.role === 'buyer') {
            try {
              await fetchBuyerProfile();
            } catch (err) {
              console.warn('fetchBuyerProfile failed after login:', err);
            }
            try {
              await fetchBuyerAddress();
            } catch (err) {
              console.warn('fetchBuyerAddress failed after login:', err);
            }
          }
        }
      }

      return res.data;
    } catch (err) {
      console.error('Login error:', err?.response?.data || err.message || err);
      throw err;
    }
  };

  // NEW PASSWORD
  const newPassword = async ( password, confirmPassword) => {
    try {
      const res = await axios.post(`${API_BASE}/password`, {
        password,
        confirmPassword,
      });

      const token = res.data?.data?.token;
      const returnedUser = res.data?.data?.user;

      if (res?.data?.status === 'success' && token && returnedUser) {
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(returnedUser));
        setUser(returnedUser);

        try {
          const expoPushToken = await registerForPushNotificationsAsync();
          if (expoPushToken) {
            await AsyncStorage.setItem('expoPushToken', expoPushToken);
            try {
              await axios.post(
                `${API_ROOT}/push-tokens`,
                { token: expoPushToken, platform: Platform.OS },
                { headers: { Authorization: `Bearer ${token}` } }
              );
            } catch (err) {
              console.warn('Failed to send push-token to server after newPassword:', err?.message || err);
            }
          }
        } catch (err) {
          console.warn('registerForPushNotificationsAsync failed after newPassword:', err?.message || err);
        }
      }

      return res.data;
    } catch (err) {
      console.error('newPassword error:', err?.response?.data || err.message || err);
      throw err;
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const expoPushToken = await AsyncStorage.getItem('expoPushToken');

      if (token && expoPushToken) {
        try {
          await axios.delete(`${API_ROOT}/push-tokens`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { token: expoPushToken },
          });
        } catch (err) {
          console.warn('Failed to delete push token on logout:', err?.message || err);
        }
      }

      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('expoPushToken');

      setUser(null);
      setAddress(null);
    } catch (err) {
      console.warn('logout error:', err);
    }
  };

  // FETCH ADDRESS (graceful)
  const fetchBuyerAddress = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.warn('fetchBuyerAddress: No token present. Skipping address fetch.');
        return null;
      }

      const res = await axios.get(`${API_BUYER_BASE}/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res?.data?.success || res?.data?.status === 'success') {
        const all = res.data.addresses || [];
        const def = all.find((a) => a.isDefault) || all[0] || null;

        setAddress(def || null);
        await AsyncStorage.setItem('buyerAddress', JSON.stringify(def || null));

        return def;
      }

      console.warn('fetchBuyerAddress: API responded non-success', res.data);
      return res.data || null;
    } catch (err) {
      console.error('fetchBuyerAddress error:', err?.response?.data || err.message || err);
      // return a structured error instead of throwing to avoid uncaught promise
      return { success: false, message: err?.response?.data?.message || err.message || 'Address fetch failed' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        verifyOtp,
        completeProfile,
        createProfile,
        login,
        logout,
        newPassword,
        fetchBuyerProfile,
        fetchBuyerAddress,
        address,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProviderComponent;

