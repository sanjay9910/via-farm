import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart } from "react-native-gifted-charts";

const API_BASE = "https://393rb0pp-5000.inc1.devtunnels.ms";
const API_ENDPOINT = "/api/vendor/dashboard-analytics";

const Chart = () => {
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const [year, setYear] = useState(new Date().getFullYear());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chartValues, setChartValues] = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [percentageChange, setPercentageChange] = useState(0);
  const [hoveredBar, setHoveredBar] = useState(null);
  const availableYears = [new Date().getFullYear(), new Date().getFullYear() - 1];

  const fetchAnalytics = useCallback(async (selectedYear) => {
    setLoading(true);
    setChartValues([]);
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Authentication Required", "Please log in to view analytics data.");
        setLoading(false);
        return;
      }
      const url = `${API_BASE}${API_ENDPOINT}?year=${selectedYear}`;
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setCustomerCount(data.currentMonthCustomers || 0);
        setPercentageChange(data.percentageChangeVsLastYear || 0);
        setChartValues(data.monthlyCustomerDataForYear || []);
      } else {
        Alert.alert("API Error", response.data.message || "Failed to fetch data.");
      }
    } catch (error) {
      console.error("Dashboard analytics error:", error.response?.data || error.message);
      Alert.alert("Network Error", "Could not connect to the server or fetch data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(year); }, [year, fetchAnalytics]);

  const chartData = chartValues.map((value, index) => ({
    value: value,
    label: months[index],
    frontColor: "#2ecc71",
    onPress: () => setHoveredBar(index),
  }));

  const isGrowing = percentageChange >= 0;
  const growthIndicator = isGrowing ? "↑" : "↓";
  const growthColor = isGrowing ? "#27ae60" : "#e74c3c";
  const vsYear = year > 2000 ? year - 1 : new Date().getFullYear() - 1;
  const maxChartValue = chartValues.length > 0 ? Math.max(...chartValues) : 0;
  const maxValue = Math.ceil((maxChartValue * 1.2 || 1000) / 100) * 100;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.count}>
            {loading ? <ActivityIndicator size="large" color="#000" /> : customerCount.toLocaleString()}
            <Text style={styles.small}> customers</Text>
          </Text>
          <Text style={[styles.growth, { color: growthColor }]}>
            {growthIndicator} {Math.abs(percentageChange)}%
            <Text style={styles.vs}> vs. {vsYear}</Text>
          </Text>
        </View>

        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setDropdownOpen(!dropdownOpen)}
            activeOpacity={0.7}
            disabled={loading}
          >
            <Text style={styles.dropdownText}>{year}</Text>
            <Ionicons name={dropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#333" />
          </TouchableOpacity>

          {dropdownOpen && (
            <View style={styles.dropdownMenu}>
              {availableYears.map((item) => (
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
                  <Text style={[styles.dropdownText, year === item && styles.dropdownTextActive]}>
                    {item}
                  </Text>
                  {year === item && <Ionicons name="checkmark" size={16} color="#2ecc71" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.chartWrapper}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2ecc71" />
            <Text style={styles.loadingText}>Fetching data...</Text>
          </View>
        )}

        {!loading && chartData.length > 0 && (
          <>
            <BarChart
              data={chartData}
              barWidth={10}
              barBorderRadius={4}
              frontColor="#2ecc71"
              yAxisThickness={20}
              xAxisThickness={2}
              yAxisTextStyle={{ fontSize: 10, color: "#666" }}
              xAxisLabelTextStyle={{ fontSize: 10, color: "#666", textAlign: 'center' }}
              noOfSections={Math.ceil(maxValue / 10)}
              maxValue={maxValue}
              height={230}
              spacing={18}
              isAnimated
              showGradient
              gradientColor="#27ae60"
              rulesColor="#e0e0e0"
              rulesType="solid"
              initialSpacing={10}
              endSpacing={10}
              xAxisColor="#e0e0e0"
              yAxisColor="#e0e0e0"
              showValuesOnTopOfBars={false}
              onPress={(item, index) => {
                setHoveredBar(index);
              }}
            />
            
            {hoveredBar !== null && (
              <View style={styles.tooltip}>
                <Text style={styles.tooltipMonth}>{months[hoveredBar]}</Text>
                <Text style={styles.tooltipValue}>
                  {chartValues[hoveredBar]?.toLocaleString() || 0} users
                </Text>
                <TouchableOpacity 
                  style={styles.tooltipClose}
                  onPress={() => setHoveredBar(null)}
                >
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {!loading && chartValues.length === 0 && (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No data available for {year}.</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default Chart;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginVertical: 15,
    shadowColor: "rgba(255, 202, 40, 1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 7,
    borderRadius: 12,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  count: { fontSize: 24, fontWeight: "bold", color: "#000" },
  small: { fontSize: 14, fontWeight: "normal", color: "#666" },
  growth: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  vs: { color: "#666", fontSize: 12, fontWeight: "normal" },
  dropdownContainer: { position: "relative", zIndex: 1000 },
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
    minWidth: 100,
  },
  dropdownText: { fontSize: 14, color: "#333", fontWeight: "500" },
  dropdownTextActive: { color: "#2ecc71", fontWeight: "600" },
  dropdownMenu: {
    position: "absolute",
    top: Platform.OS === 'ios' ? 45 : 50,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 4,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    minWidth: 100,
  },
  dropdownItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 12 },
  dropdownItemActive: { backgroundColor: "#f0f9f4" },
  chartWrapper: { position: "relative", height: 230, justifyContent: "center", alignItems: "center" },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  loadingText: { marginTop: 10, color: '#666', fontSize: 14 },
  noDataContainer: { height: '100%', justifyContent: 'center', alignItems: 'center' },
  noDataText: { fontSize: 16, color: '#999' },
  tooltip: {
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2ecc71',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 120,
    alignItems: 'center',
    zIndex: 1001,
  },
  tooltipMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2ecc71',
    marginBottom: 4,
  },
  tooltipValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tooltipClose: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: 4,
  },
});