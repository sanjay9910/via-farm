import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function VendorLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: styles.tabLabel,
        headerShown: false,
        tabBarShowLabel: true,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Ionicons 
                name="home" 
                size={30} 
                color={focused ? '#fff' : '#666'} 
              />
            </View>
          ),
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Ionicons 
                name="cube" 
                size={30} 
                color={focused ? '#fff' : '#666'} 
              />
            </View>
          ),
          tabBarLabel: 'Orders',
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Ionicons 
                name="grid" 
                size={30} 
                color={focused ? '#fff' : '#666'} 
              />
            </View>
          ),
          tabBarLabel: 'Products',
        }}
      />
      <Tabs.Screen
        name="vendorprofile"
        options={{
          title: 'My Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Ionicons 
                name="person" 
                size={30} 
                color={focused ? '#fff' : '#666'} 
              />
            </View>
          ),
          tabBarLabel: 'My Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    height: 80,
    paddingBottom:12,
    paddingTop: 12,
    paddingLeft:10,
    paddingRight:10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabItem: {
    paddingTop: 5,
  },
  iconContainer: {
    width: 90,
    height: 65,
    borderRadius:20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeIconContainer: {
    backgroundColor: 'rgba(76, 175, 80, 1)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});