import React from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddToCart from '../components/myCard/AddToCard';

const OnlyRoutingCart = () => {
  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['left', 'right', 'bottom']} 
    >
      {/* StatusBar handled properly */}
      <StatusBar
        barStyle="dark-content"
        translucent={Platform.OS === 'android'}
        backgroundColor="transparent"
      />

      <View style={styles.container}>
        <AddToCart />
      </View>
    </SafeAreaView>
  );
};

export default OnlyRoutingCart;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
});
