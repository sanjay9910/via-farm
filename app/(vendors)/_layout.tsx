// VendorLayout.jsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { moderateScale, normalizeFont, scale } from "../Responsive";

const ICON_SIZE = moderateScale(20);
const PILL_WIDTH = moderateScale(86);
const PILL_HEIGHT = moderateScale(63);
const PILL_RADIUS = moderateScale(20);

function TabButton({ label, iconName, focused }) {
  if (focused) {
    return (
      <View style={styles.tabItemContainer}>
        <View style={styles.pillActive}>
          <Ionicons name={iconName} size={ICON_SIZE} color="#FFFFFF" />
          <Text style={styles.pillLabel}>{label}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tabItemContainer}>
      <Ionicons name={iconName} size={ICON_SIZE} color="#111827" />
      <Text style={styles.inactiveLabel}>{label}</Text>
    </View>
  );
}

export default function VendorLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // we render labels ourselves
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabButton label="Home" iconName="home" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ focused }) => (
            <TabButton label="Orders" iconName="cube" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ focused }) => (
            <TabButton label="Products" iconName="grid" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="vendorprofile"
        options={{
          title: "My Profile",
          tabBarIcon: ({ focused }) => (
            <TabButton label="My Profile" iconName="person" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e6e6e6",
    height: Platform.OS === "android" ? scale(78) : scale(78),
    paddingBottom: moderateScale(8),
    paddingTop: moderateScale(8),
    paddingHorizontal: moderateScale(6),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 6,
  },

  tabBarItem: {
    paddingTop: moderateScale(6),
    alignItems: "center",
    justifyContent: "center",
  },

  tabItemContainer: {
    width: PILL_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },

  pillActive: {
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: PILL_RADIUS,
    backgroundColor: "#22c55e", 
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(6),
  },

  pillLabel: {
    marginTop: moderateScale(4),
    color: "#ffffff",
    fontSize: normalizeFont(12),
    fontWeight: "700",
    textAlign: "center",
  },

  inactiveLabel: {
    marginTop: moderateScale(6),
    color: "#111827",
    fontSize: normalizeFont(12),
    fontWeight: "600",
    textAlign: "center",
  },
});
