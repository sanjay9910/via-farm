import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
<Tabs
  screenOptions={{
    headerShown: false,
    tabBarButton: HapticTab,
    tabBarActiveTintColor: '#fff',
    tabBarInactiveTintColor: '#687076',
    tabBarActiveBackgroundColor: 'rgba(76, 175, 80, 1)',
    tabBarStyle: {
      backgroundColor: '#fff',
      paddingHorizontal: 20,     
      paddingVertical: 40,     
      paddingBottom: 20,       
      margin: 0,
      width: '100%',
      height:80,
      borderTopWidth: 0,        
      elevation: 8,            
      shadowColor: '#000',
       padding: 20,      
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
  }}
> <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol size={38} name="house.fill" color={color} />
          ),
          tabBarItemStyle: {
            borderRadius:20,
            overflow: 'hidden',
          },
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: '600',
            marginTop: 4,
          }
        }}
      />
      <Tabs.Screen
        name="category"
        options={{
          title: 'Category',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
          tabBarItemStyle: {
            borderRadius:20,
            overflow: 'hidden',
          },
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: '600',
            marginTop: 4,
          }
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={size}
              color={color}
            />
          ),
          tabBarItemStyle: {
            borderRadius:20,
            overflow: 'hidden',
          },
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: '600',
            marginTop: 4,
          }
        }}
      />
      <Tabs.Screen
        name="myCard"
        options={{
          title: 'My Card',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card" size={size} color={color} />
          ),
          tabBarItemStyle: {
            borderRadius:20,
            overflow: 'hidden',
          },
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: '600',
            marginTop: 4,
          }
        }}
      />
    </Tabs>

  );
}
