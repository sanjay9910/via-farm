import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Header = () => {
  return (
    <View style={styles.container}>
      {/* Left: Location info */}
      <View>
        <View style={styles.row}>
          <Text style={styles.cityText}>Delhi</Text>
          <Ionicons name="chevron-down" size={16} color="#000" style={{ marginLeft: 4 }} />
        </View>
        <Text style={styles.subText}>Janakpuri West, New Delhi</Text>
      </View>

      {/* Right: Notification bell */}
      <TouchableOpacity style={styles.bellWrapper}>
        <Ionicons name="notifications-outline" size={22} color="#555" />
      </TouchableOpacity>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  cityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  subText: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
  },
  bellWrapper: {
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 50,
  },
});
