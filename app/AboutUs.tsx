import { goBack } from 'expo-router/build/global-state/routing';
import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, normalizeFont, scale } from './Responsive';

const AboutUs = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBack}
        >
         <Image source={require("../assets/via-farm-img/icons/groupArrow.png")} />
        </TouchableOpacity>

        <Text numberOfLines={1} style={styles.headerTitle}>
          About Us
        </Text>

        {/* spacer to keep title centered */}
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>About Us</Text>

          <View style={styles.contentSection}>
            <Text style={styles.contentText}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              {"\n\n"}
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
              {"\n\n"}
              dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </Text>
          </View>
        </View>

        <View style={{ height: moderateScale(40) }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutUs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // small top padding on Android to match SafeArea behaviour
    paddingTop: Platform.OS === 'android' ? moderateScale(6) : 0,
  },

  header: {
    height: scale(60),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e6edf3',
    backgroundColor: '#fff',
    paddingVertical: moderateScale(6),
  },

  backButton: {
    padding: moderateScale(8),
    marginRight: moderateScale(6),
    zIndex: 2,
  },

  headerTitle: {
    position: 'absolute',
    left: moderateScale(0),
    right: moderateScale(0),
    textAlign: 'center',
    fontSize: normalizeFont(16),
    color: '#0f172a',
    alignSelf: 'center',
    zIndex: 1,
  },

  headerRightSpacer: {
    width: moderateScale(36), // balances the left back button
  },

  contentContainer: {
    padding: moderateScale(16),
    paddingBottom: moderateScale(40),
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(14),
    padding: moderateScale(20),
    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: moderateScale(12),
    shadowOffset: { width: 0, height: scale(6) },
    // Android elevation
    elevation: 4,
  },

  title: {
    fontSize: normalizeFont(20),
    fontWeight: '600',
    color: '#06203a',
    marginBottom: moderateScale(16),
    textAlign: 'center',
  },

  contentSection: {
    width: '100%',
  },

  contentText: {
    color: '#334155',
    fontSize: normalizeFont(14),
    lineHeight: moderateScale(20),
    textAlign: 'left',
  },
});
