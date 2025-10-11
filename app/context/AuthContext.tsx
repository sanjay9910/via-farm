import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { createContext, useEffect, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState([])

  const API_BASE = 'https://393rb0pp-5000.inc1.devtunnels.ms/api/auth';
  const API_BUYER_BASE = 'https://393rb0pp-5000.inc1.devtunnels.ms/api/buyer';

  useEffect(() => {
    const loadUser = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      if (token && userData) setUser(JSON.parse(userData));
      setLoading(false);
    };
    loadUser();
  }, []);

  // Fetch Buyer Profile
  const fetchBuyerProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No token found');
      }

      const res = await axios.get(`${API_BUYER_BASE}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Buyer Profile Response:", res.data);

      if (res.data.success || res.data.status === 'success') {
        // Handle both response structures
        const profileData = res.data.user || res.data.data;
        
        // Update user state with profile data
        setUser(profileData);
        // Update AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify(profileData));
        return profileData;
      }

      return res.data;
    } catch (err) {
      console.error("FetchBuyerProfile error:", err.response?.data || err.message);
      throw err;
    }
  };

  // Signup OTP
  const signup = async (mobileNumber) => {
    const res = await axios.post(`${API_BASE}/signup`, { mobileNumber });
    return res.data;
  };

  // Verify OTP
  const verifyOtp = async (mobileNumber, otp) => {
    const res = await axios.post(`${API_BASE}/verify-otp`, { mobileNumber, otp });
    return res.data;
  };

  // Complete Profile - Updated function
  const completeProfile = async (profileData) => {
    try {
      const { mobileNumber, name, role } = profileData;
      
      console.log("Calling completeProfile API with:", { mobileNumber, name, role });

      if (!name || !name.trim()) {
        throw new Error('Name is required');
      }
      
      if (!mobileNumber) {
        throw new Error('Mobile number is required');
      }

      const res = await axios.post(`${API_BASE}/complete-profile`, {
        mobileNumber: mobileNumber.toString().trim(),
        name: name.trim(),
        role: role || 'buyer',
      });

      console.log("Full API response:", res.data);

      if (res.data.status === 'success') {
        const { token, user } = res.data.data;
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        setUser(user);
        console.log("Profile completed successfully, token saved:", token);
      }

      return res.data;
    } catch (err) {
      console.error("CompleteProfile error:", err.response?.data || err.message);
      throw new Error(err.response?.data?.message || err.message || 'Profile completion failed');
    }
  };

  // Create Profile
  const createProfile = async (profileData) => {
    try {
      const { mobileNumber, name, password, role } = profileData;
      
      console.log("Calling createProfile API with:", { name, role });

      const res = await axios.post(`${API_BASE}/complete-profile`, {
        mobileNumber,
        name,
        password,
        role,
      });

      console.log("Full API response:", res.data);

      if (res.data.status === 'success') {
        const { token, user } = res.data.data;
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        setUser(user);
        console.log("Profile created successfully, token saved:", token);
      }

      return res.data;
    } catch (err) {
      console.error("CreateProfile error:", err.response?.data || err.message);
      throw err;
    }
  };

  // Login
  const login = async (mobileNumber, password) => {
    const res = await axios.post(`${API_BASE}/login`, { mobileNumber, password });
    if (res.data.status === 'success') {
      const { token, user } = res.data.data;
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      setUser(user);
      
      // Fetch buyer profile after login if user is buyer
      if (user.role === 'buyer') {
        try {
          await fetchBuyerProfile();
          await fetchBuyerAddress();
        } catch (error) {
          console.log("Could not fetch buyer profile after login:", error);
        }
      }
    }
    
    console.log("check", res);

    return res.data;
  };

  // Set Password 
  const newPassword = async (mobileNumber, password, confirmPassword) => {
    try {
      console.log("Calling setPassword API with:", { mobileNumber, password, confirmPassword });

      const res = await axios.post(`${API_BASE}/set-Password`, {
        mobileNumber,
        password,
        confirmPassword,
      });

      console.log("Full API response:", res.data);

      const token = res.data?.data?.token || res.data?.token;
      const user = res.data?.data?.user || res.data?.user;

      if (res.data.status === 'success' && token && user) {
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        setUser(user);
        console.log("Token saved successfully:", token);
      } else {
        console.warn("Token or user missing in API response:", res.data);
      }

      return res.data;
    } catch (err) {
      console.error("SetPassword error:", err.response?.data || err.message);
      throw err;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    setUser(null);
  };

const fetchBuyerAddress = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) throw new Error('No token found');

    const res = await axios.get(`${API_BUYER_BASE}/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("Buyer Address Response:", res.data);

    if (res.data.success || res.data.status === 'success') {
      // Extract all addresses
      const allAddresses = res.data.addresses || [];

      // Pick the default address (isDefault === true)
      const defaultAddress = allAddresses.find(addr => addr.isDefault) || allAddresses[0];

      // Save both all addresses and default
      setAddress(defaultAddress || {}); // Keep only default address in state for easy use
      await AsyncStorage.setItem('buyerAddress', JSON.stringify(defaultAddress));

      return defaultAddress;
    }

    return res.data;
  } catch (error) {
    console.error("Address Fetching Error:", error.response?.data || error.message);
    throw error;
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
};