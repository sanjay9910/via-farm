import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE = 'https://393rb0pp-5000.inc1.devtunnels.ms';

const VendorProfile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAvatarLetter = (name) => {
    if (name && name.length > 0) return name.charAt(0).toUpperCase();
    return 'U';
  };

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('No token found');
        return;
      }

      const res = await axios.get(`${API_BASE}/api/vendor/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const user = res.data.user;
        setUserInfo({
          name: user.name,
          phone: user.mobileNumber,
          upiId: user.upiId,
          image: user.profilePicture,
        });
      }
    } catch (error) {
      console.log('Error fetching profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const ProfileMenuItem = ({ icon, title, subtitle }) => (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#666" />
        </View>
        <View style={styles.menuItemText}>
          <Text style={styles.menuItemTitle}>{title}</Text>
          <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Info Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {userInfo?.image ? (
                <Image source={{ uri: userInfo.image }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{getAvatarLetter(userInfo?.name)}</Text>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userInfo?.name}</Text>
              <Text style={styles.userPhone}>+91 {userInfo?.phone}</Text>
              <Text style={styles.userRole}>{userInfo?.upiId}</Text> {/* role ki jagah upiId */}
            </View>
            <TouchableOpacity style={styles.editButtonContainer}>
              <Image source={require('../../assets/via-farm-img/icons/editicon.png')} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <ProfileMenuItem icon="location-outline" title="My Location" subtitle="Add/Edit your location" />
          <ProfileMenuItem icon="heart-outline" title="My Wishlist" subtitle="Your most loved products" />
          <ProfileMenuItem icon="bag-outline" title="My Orders" subtitle="View/track your orders" />
          <ProfileMenuItem icon="headset-outline" title="Customer Support" subtitle="We are happy to assist you!" />
          <ProfileMenuItem icon="shield-checkmark-outline" title="Privacy Policy" subtitle="We care about your safety" />
          <ProfileMenuItem icon="information-circle-outline" title="About Us" subtitle="Get to know about us" />
          <ProfileMenuItem icon="star-outline" title="Rate Us" subtitle="Rate your experience on Play Store" />
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={async () => {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            // Navigate back to login
          }}>
            <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default VendorProfile;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  profileSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFB4A2', justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 60, height: 60, borderRadius: 30 },
  avatarText: { fontSize: 24, fontWeight: '600', color: '#fff' },
  userInfo: { flex: 1, marginLeft: 15 },
  userName: { fontSize: 18, fontWeight: '600', color: '#333' },
  userPhone: { fontSize: 14, color: '#666' },
  userRole: { fontSize: 12, color: '#4CAF50', fontWeight: '500', marginTop: 2 },
  editButtonContainer: { padding: 8 },
  menuSection: { backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 5, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 } },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { width: 35, height: 35, borderRadius: 8, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuItemText: { flex: 1 },
  menuItemTitle: { fontSize: 16, fontWeight: '500', color: '#333' },
  menuItemSubtitle: { fontSize: 13, color: '#666' },
  logoutSection: { paddingHorizontal: 16, paddingVertical: 20, marginBottom: 20, flexDirection:'row', justifyContent:'center', alignItems:'center', marginTop:20 },
  logoutButton: { backgroundColor: '#4CAF50', flexDirection: 'row', width:'70%', alignItems: 'center', justifyContent: 'center', paddingVertical:20, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3 },
  logoutIcon: { marginRight: 8 },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
