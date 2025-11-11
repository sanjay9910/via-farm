import { Ionicons } from '@expo/vector-icons';
import { goBack } from 'expo-router/build/global-state/routing';
import React from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, normalizeFont, scale } from './Responsive';


const SUPPORT_EMAIL = 'abcd@gmail.com';
const SUPPORT_PHONE = '+91 9999999999';
const SUPPORT_HOURS = '10:00 AM - 8:00 PM';

const CustomerSupport = ({ navigation }) => {
  const openEmail = async () => {
    const url = `mailto:${SUPPORT_EMAIL}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert('Unable to open mail app');
    } catch (err) {
      Alert.alert('Error', 'Could not open mail client');
    }
  };

  const callSupport = async () => {
    const url = `tel:${SUPPORT_PHONE}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert('Unable to call');
    } catch (err) {
      Alert.alert('Error', 'Could not initiate call');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBack}
        >
          <Image source={require("../assets/via-farm-img/icons/groupArrow.png")} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Support</Text>
        <Text style={{width:10}}></Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Our support team is available to assist you.</Text>
          <Text style={styles.subtitle}>
            Use the contact details below to reach us
          </Text>

          <View style={styles.contactSection}>
            <View style={styles.contactItem}>
              <Text style={styles.contactValue}>{SUPPORT_PHONE}</Text>
            </View>
            
            <View style={styles.contactItem}>
              <Text style={styles.contactValue}>{SUPPORT_EMAIL}</Text>
            </View>
            
            <View style={styles.contactItem}>
              <Text style={styles.contactValue}>{SUPPORT_HOURS}</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.callButton]} 
              onPress={callSupport}
            >
              <Ionicons name="call-outline" size={18} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Call Now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.emailButton]} 
              onPress={openEmail}
            >
              <Ionicons name="mail-outline" size={18} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Send Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CustomerSupport;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  header: {
    height: scale(60),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'space-between',
    paddingHorizontal: moderateScale(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e6edf3',
    backgroundColor: '#fff',
  },
  backButton: { 
    padding: moderateScale(8), 
    marginRight: moderateScale(6) 
  },
  headerTitle: { 
    fontSize: normalizeFont(15), 
    fontWeight: '700', 
    color: '#0f172a' 
  },
  contentContainer: { 
    flex: 1,
    justifyContent: 'center',
    padding: moderateScale(16),
    paddingBottom: moderateScale(40) 
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: moderateScale(24),
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: scale(6) },
    elevation: 4,
    alignItems: 'center',
  },
  title: { 
    fontSize: normalizeFont(15), 
    fontWeight: '600', 
    color: '#06203a', 
    marginBottom: 8, 
    textAlign: 'center' 
  },
  subtitle: { 
    fontSize: normalizeFont(13), 
    color: '#64748b', 
    textAlign: 'center', 
    lineHeight: scale(20), 
    marginBottom: moderateScale(32) 
  },
  contactSection: {
    width: '100%',
    marginBottom: moderateScale(32),
  },
  contactItem: {
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  contactValue: {
    fontSize: normalizeFont(13),
    fontWeight: '500',
    color: '#0f172a',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    borderRadius: 8,
    flex: 0.48,
  },
  callButton: {
    backgroundColor: '#10b981',
  },
  emailButton: {
    backgroundColor: 'green',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: normalizeFont(12),
    fontWeight: '600',
  },
});