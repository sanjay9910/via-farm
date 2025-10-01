import React from "react";
import { StyleSheet, Text, View } from "react-native";

const Chart = () => {
  // Dummy values - replace with API data later
  const stats = [
    { label: "All Orders", value: "24" },
    { label: "All Revenue", value: "$50,000" },
    { label: "Today Orders", value: "$50,000" },
  ];

  return (
    <View style={styles.container}>
      {stats.map((item, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
};

export default Chart;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 20,
  },
  card: {
    backgroundColor: "#f9f8f3", // same light background
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#5c3d2e", // brown border
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
    marginHorizontal: 5,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
});
