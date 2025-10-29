import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <IconSymbol 
                size={30} 
                name="house.fill" 
                color={focused ? '#fff' : '#666'} 
              />
            </View>
          ),
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="category"
        options={{
          title: 'Category',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Ionicons 
                name="grid" 
                size={30} 
                color={focused ? '#fff' : '#666'} 
              />
            </View>
          ),
          tabBarLabel: 'Category',
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <MaterialCommunityIcons
                name="map-marker-radius"
                size={30}
                color={focused ? '#fff' : '#666'}
              />
            </View>
          ),
          tabBarLabel: 'Map',
        }}
      />
  <Tabs.Screen
  name="myCard"
  options={{
    title: 'My Card',
    tabBarIcon: ({ color, focused }) => (
      <View
        style={[
          styles.iconContainer,
          focused && styles.activeIconContainer,
        ]}
      >
        <Image
          source={require("../../assets/via-farm-img/icons/Mycard.png")}
          style={[
            styles.myCardIcon,
            { tintColor: focused ? '#fff' : '#666' },
          ]}
          resizeMode="contain"
        />
      </View>
    ),
    tabBarLabel: 'My Card',
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
  myCardIcon: {
  width: 28,
  height: 28,
  tintColor: '#666', // default inactive color
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