// OrderFilter.jsx
import { moderateScale } from "@/app/Responsive";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");
const deviceWidth = width;
const deviceHeight = height;

/** Responsive helpers (plain JS, no TS types) */
const responsiveWidth = (percent) => (deviceWidth * percent) / 100;
const responsiveHeight = (percent) => (deviceHeight * percent) / 100;
const responsiveFontSize = (size) => {
  const baseWidth = 375;
  const scaleFont = deviceWidth / baseWidth;
  const newSize = size * scaleFont;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

const OrderFilter = ({ onSearchChange, onFilterApply, searchText = "" }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    sortBy: false,
    status: false,
    date: false,
  });

  const slideAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    if (isModalVisible) {
      slideAnim.setValue(width);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
  }, [isModalVisible, slideAnim]);

  const sortOptions = ["Price - high to low", "Newest Arrivals", "Price - low to high", "Freshness"];
  const dateOptions = ["Today", "Last 7 days", "Last 30 days", "Last 3 months", "Last 6 months", "All time"];
  const statusOptions = ["Complete", "Cancelled", "In-process"];

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const applyFilters = () => {
    const filters = {
      sortBy,
      statusFilter,
      dateFilter,
    };

    if (typeof onFilterApply === "function") {
      onFilterApply(filters);
    }

    // Debug log kept (safe)
    // eslint-disable-next-line no-console
    console.log("Filters applied:", filters);
    setIsModalVisible(false);
  };

  const clearFilters = () => {
    setSortBy("");
    setStatusFilter("");
    setDateFilter("");

    if (typeof onFilterApply === "function") {
      onFilterApply({
        sortBy: "",
        statusFilter: "",
        dateFilter: "",
      });
    }
  };

  const handleSearchChange = (text) => {
    if (typeof onSearchChange === "function") {
      onSearchChange(text);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          My Orders
        </Text>
        <View style={styles.searchContainer}>
          <Image
            style={styles.searchIcon}
            source={require("../../../assets/via-farm-img/icons/search.png")}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={handleSearchChange}
            maxFontSizeMultiplier={1}
            allowFontScaling={false}
            underlineColorAndroid="transparent"
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setIsModalVisible(true)}
            activeOpacity={0.7}
          >
            <Image
              style={styles.filterIcon}
              source={require("../../../assets/via-farm-img/icons/fltr.png")}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <Animated.View
            style={[styles.modalContent, { transform: [{ translateX: slideAnim }] }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.filterIconContainer}>
                  <Image
                    style={styles.filterIconModal}
                    source={require("../../../assets/via-farm-img/icons/fltr.png")}
                  />
                </View>
                <Text allowFontScaling={false} style={styles.modalTitle}>
                  Filters
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButtonContainer}
                activeOpacity={0.7}
              >
                <Text allowFontScaling={false} style={styles.closeButton}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
            >
              {/* Sort By */}
              <View style={styles.filterSection}>
                <TouchableOpacity
                  style={styles.filterHeader}
                  onPress={() => toggleSection("sortBy")}
                  activeOpacity={0.7}
                >
                  <Text allowFontScaling={false} style={styles.filterTitle}>
                    Sort by
                  </Text>
                  <Text allowFontScaling={false} style={[styles.chevron, expandedSections.sortBy && styles.chevronRotated]}>
                    ›
                  </Text>
                </TouchableOpacity>
                {expandedSections.sortBy && (
                  <View style={styles.filterOptions}>
                    {sortOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.radioOption}
                        onPress={() => setSortBy(option)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.radioCircle, sortBy === option && styles.radioCircleSelected]}>
                          {sortBy === option && <View style={styles.radioSelected} />}
                        </View>
                        <Text allowFontScaling={false} style={[styles.optionText, sortBy === option && styles.optionTextSelected]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Post by Date */}
              <View style={styles.filterSection}>
                <TouchableOpacity
                  style={styles.filterHeader}
                  onPress={() => toggleSection("date")}
                  activeOpacity={0.7}
                >
                  <Text allowFontScaling={false} style={styles.filterTitle}>
                    Post by Date
                  </Text>
                  <Text allowFontScaling={false} style={[styles.chevron, expandedSections.date && styles.chevronRotated]}>
                    ›
                  </Text>
                </TouchableOpacity>
                {expandedSections.date && (
                  <View style={styles.filterOptions}>
                    {dateOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.radioOption}
                        onPress={() => setDateFilter(option)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.radioCircle, dateFilter === option && styles.radioCircleSelected]}>
                          {dateFilter === option && <View style={styles.radioSelected} />}
                        </View>
                        <Text allowFontScaling={false} style={[styles.optionText, dateFilter === option && styles.optionTextSelected]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Status */}
              <View style={styles.filterSection}>
                <TouchableOpacity
                  style={styles.filterHeader}
                  onPress={() => toggleSection("status")}
                  activeOpacity={0.7}
                >
                  <Text allowFontScaling={false} style={styles.filterTitle}>
                    Status
                  </Text>
                  <Text allowFontScaling={false} style={[styles.chevron, expandedSections.status && styles.chevronRotated]}>
                    ›
                  </Text>
                </TouchableOpacity>
                {expandedSections.status && (
                  <View style={styles.filterOptions}>
                    {statusOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.radioOption}
                        onPress={() => setStatusFilter(option)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.radioCircle, statusFilter === option && styles.radioCircleSelected]}>
                          {statusFilter === option && <View style={styles.radioSelected} />}
                        </View>
                        <Text allowFontScaling={false} style={[styles.optionText, statusFilter === option && styles.optionTextSelected]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters} activeOpacity={0.8}>
                <Text allowFontScaling={false} style={styles.clearButtonText}>
                  Clear All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters} activeOpacity={0.8}>
                <Text allowFontScaling={false} style={styles.applyButtonText}>
                  Apply Filters
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Updated Styles with Enhanced Responsiveness
const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    gap: moderateScale(12),
    width: "100%",
  },
  title: {
    fontSize: responsiveFontSize(14),
    fontWeight: "700",
    color: "#1f2937",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(8),
    // paddingVertical: moderateScale(7),
    borderWidth: moderateScale(1),
    borderColor: "rgba(0, 0, 0, 0.1)",
    minHeight: moderateScale(40),
  },
  searchIcon: {
    marginRight: moderateScale(8),
    width: moderateScale(15),
    height: moderateScale(15),
    resizeMode: "contain",
  },
  searchInput: {
    flex: 1,
    fontSize: responsiveFontSize(12),
    color: "#1f2937",
    padding: 0,
    minHeight: moderateScale(20),
  },
  filterButton: {
    marginLeft: moderateScale(8),
    borderRadius: moderateScale(8),
    padding: moderateScale(6),
  },
  filterIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    resizeMode: "contain",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    position: "absolute",
    right: 0,
    top: moderateScale(100),
    bottom: moderateScale(80),
    width: Math.min(moderateScale(300), Math.max(moderateScale(220), deviceWidth * 0.72)),
    backgroundColor: "#fff",
    borderTopLeftRadius: moderateScale(20),
    borderBottomLeftRadius: moderateScale(20),
    borderWidth: moderateScale(2),
    borderColor: "rgba(255, 202, 40, 1)",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: -moderateScale(2), height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(5),
    overflow: "hidden",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderBottomWidth: moderateScale(1),
    borderBottomColor: "#f0f0f0",
    minHeight: moderateScale(50),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  filterIconContainer: {
    width: moderateScale(22),
    height: moderateScale(22),
    alignItems: "center",
    justifyContent: "center",
  },
  filterIconModal: {
    width: moderateScale(20),
    height: moderateScale(20),
    resizeMode: "contain",
  },
  modalTitle: {
    fontSize: responsiveFontSize(13),
    fontWeight: "600",
    color: "#333",
  },
  closeButtonContainer: {
    padding: moderateScale(4),
    minWidth: moderateScale(30),
    minHeight: moderateScale(30),
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    fontSize: responsiveFontSize(20),
    color: "#333",
    fontWeight: "400",
  },

  modalBody: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollViewContent: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
  },

  filterSection: {
    borderBottomWidth: moderateScale(1),
    borderBottomColor: "#f5f5f5",
    marginBottom: moderateScale(4),
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(12),
    backgroundColor: "#ffffff",
    minHeight: moderateScale(44),
  },
  filterTitle: {
    fontSize: responsiveFontSize(12),
    fontWeight: "400",
    color: "#333",
  },
  chevron: {
    fontSize: responsiveFontSize(24),
    color: "#666",
    fontWeight: "300",
    transform: [{ rotate: "90deg" }],
    lineHeight: responsiveFontSize(24),
  },
  chevronRotated: {
    transform: [{ rotate: "270deg" }],
  },

  filterOptions: {
    paddingBottom: moderateScale(12),
    backgroundColor: "#ffffff",
  },

  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateScale(10),
    minHeight: moderateScale(44),
  },
  radioCircle: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: moderateScale(2),
    borderColor: "#d1d5db",
    marginRight: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: "#22c55e",
  },
  radioSelected: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: "#22c55e",
  },

  optionText: {
    fontSize: responsiveFontSize(12),
    color: "#6b7280",
    fontWeight: "500",
    flex: 1,
  },
  optionTextSelected: {
    color: "#1f2937",
    fontWeight: "600",
  },

  modalFooter: {
    flexDirection: "row",
    padding: moderateScale(10),
    backgroundColor: "#ffffff",
    borderTopWidth: moderateScale(1),
    borderTopColor: "#f0f0f0",
    borderBottomLeftRadius: moderateScale(20),
    gap: moderateScale(12),
    minHeight: moderateScale(60),
  },
  clearButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: moderateScale(1),
    borderColor: "#e5e7eb",
    minHeight: moderateScale(44),
  },
  clearButtonText: {
    color: "#6b7280",
    fontSize: responsiveFontSize(12),
    fontWeight: "600",
  },

  applyButton: {
    flex: 1,
    backgroundColor: "rgba(76, 175, 80, 1)",
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(6),
    borderRadius: moderateScale(6),
    alignItems: "center",
    justifyContent: "center",
    minHeight: moderateScale(44),
  },
  applyButtonText: {
    color: "#fff",
    fontSize: responsiveFontSize(12),
    fontWeight: "600",
  },
});

export default OrderFilter;
