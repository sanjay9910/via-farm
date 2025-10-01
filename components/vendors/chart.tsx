import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { BarChart } from "react-native-gifted-charts";

const Chart = () => {
  // 🔹 Dummy API data (replace with API response later)
  const apiData = {
    2024: [300, 500, 450, 400, 350, 800, 750, 300, 600, 700, 900, 950],
    2025: [400, 700, 600, 500, 450, 900, 950, 420, 800, 850, 1000, 1050],
  };

  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  const [year, setYear] = useState(2025);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Format data for BarChart
  const chartData = apiData[year].map((value, index) => ({
    value: value,
    label: months[index],
    frontColor: "#2ecc71",
  }));

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.count}>
            480 <Text style={styles.small}>customers</Text>
          </Text>
          <Text style={styles.growth}>
            ↑ 17.8% <Text style={styles.vs}>vs. {year - 1}</Text>
          </Text>
        </View>

        {/* Dropdown */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setDropdownOpen(!dropdownOpen)}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownText}>{year}</Text>
            <Ionicons 
              name={dropdownOpen ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#333" 
            />
          </TouchableOpacity>

          {dropdownOpen && (
            <View style={styles.dropdownMenu}>
              {[2025, 2024].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.dropdownItem,
                    year === item && styles.dropdownItemActive
                  ]}
                  onPress={() => {
                    setYear(item);
                    setDropdownOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dropdownText,
                    year === item && styles.dropdownTextActive
                  ]}>
                    {item}
                  </Text>
                  {year === item && (
                    <Ionicons name="checkmark" size={16} color="#2ecc71" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Chart */}
      <BarChart
        data={chartData}
        barWidth={8}
        barBorderRadius={4}
        frontColor="#2ecc71"
        yAxisThickness={0}
        xAxisThickness={0}
        yAxisTextStyle={{ fontSize: 10, color: "#666" }}
        xAxisLabelTextStyle={{ fontSize: 10, color: "#666", textAlign: 'center' }}
        noOfSections={5}
        maxValue={1200}
        height={220}
        spacing={20}
        isAnimated
        showGradient
        gradientColor="#27ae60"
        rulesColor="#e0e0e0"
        rulesType="solid"
        initialSpacing={10}
        endSpacing={10}
        xAxisColor="#e0e0e0"
        yAxisColor="#e0e0e0"
      />
    </View>
  );
};

export default Chart;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  count: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  small: {
    fontSize: 14,
    fontWeight: "normal",
    color: "#666",
  },
  growth: {
    fontSize: 14,
    color: "#27ae60",
    fontWeight: "600",
    marginTop: 4,
  },
  vs: {
    color: "#666",
    fontSize: 12,
    fontWeight: "normal",
  },
  dropdownContainer: {
    position: "relative",
    zIndex: 10,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f9f9f9",
    minWidth: 80,
  },
  dropdownText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  dropdownTextActive: {
    color: "#2ecc71",
    fontWeight: "600",
  },
  dropdownMenu: {
    position: "absolute",
    top: 45,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 4,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    minWidth: 80,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemActive: {
    backgroundColor: "#f0f9f4",
  },
});