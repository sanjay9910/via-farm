import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE = "https://393rb0pp-5000.inc1.devtunnels.ms";

// ✅ Reusable Product Card (same as Fruits/NewSeason)
const ProductCard = ({ name, image }) => {
  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.card}>
        <Image
          source={{
            uri: image || "https://via.placeholder.com/150/FFA500/FFFFFF?text=No+Image",
          }}
          style={cardStyles.image}
          resizeMode="cover"
        />
      </View>
      <Text style={cardStyles.name} numberOfLines={2}>
        {name}
      </Text>
    </View>
  );
};

const Vegetables = () => {
  const navigation = useNavigation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVegetables = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ Get token from AsyncStorage
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        setError("Please login to view vegetables");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_BASE}/api/buyer/products/by-category?category=Vegetables`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      // console.log("🥦 Vegetables API Response:", response.data);

      if (response.data && response.data.success) {
        const formattedData = response.data.data.map((item, index) => ({
          id: item._id || `veg-${index}`,
          name: item.name,
          image:
            item.images && item.images.length > 0
              ? item.images[0]
              : "https://via.placeholder.com/150/FFA500/FFFFFF?text=No+Image",
        }));
        setData(formattedData);
      } else {
        setError("No vegetables found");
      }
    } catch (err) {
      console.error("❌ Error fetching vegetables:", err);
      if (err.response?.status === 401) {
        setError("Unauthorized. Please login to view vegetables");
      } else if (err.code === "ECONNABORTED") {
        setError("Request timeout. Please try again.");
      } else if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Failed to load vegetables. Please try again.");
      }
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVegetables();
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchVegetables();
  };

  const handleLogin = () => {
    navigation.navigate("login");
  };

  // ⏳ Loading
  if (loading) {
    return (
      <View style={{ marginVertical: 20 }}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Vegetables</Text>
          <TouchableOpacity onPress={() => navigation.navigate("AllVegetables")}>
            <Text style={styles.link}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Fetching fresh vegetables...</Text>
        </View>
      </View>
    );
  }

  // ⚠️ Error
  if (error) {
    return (
      <View >
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Vegetables</Text>
          <TouchableOpacity onPress={() => navigation.navigate("AllVegetables")}>
            <Text style={styles.link}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            {error.includes("login") && (
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
              >
                <Text style={styles.buttonText}>Go to Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ✅ Success
  return (
    <View >
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Vegetables</Text>
        <TouchableOpacity style={{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:5}} onPress={() => navigation.navigate("ViewAllVegetables")}>
          <Text style={styles.link}>See All</Text>
          <Image source={require("../../assets/via-farm-img/icons/see.png")} />
        </TouchableOpacity>
      </View>

      {data.length > 0 ? (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          renderItem={({ item }) => (
            <ProductCard name={item.name} image={item.image} />
          )}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No vegetables available right now</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default Vegetables;

// ✅ Styles same as Fruits/NewSeason
const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    marginLeft: 20,
    fontWeight: "600",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingRight: 20,
  },
  link: {
    color: "rgba(1, 151, 218, 1)",
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#777",
  },
  errorContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffebee",
    borderRadius: 8,
    marginHorizontal: 20,
  },
  errorText: {
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 15,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
  },
  retryButton: {
    backgroundColor: "#1976d2",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  loginButton: {
    backgroundColor: "#388e3c",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  noDataContainer: {
    alignItems: "center",
    padding: 20,
  },
  noDataText: {
    color: "#666",
    fontSize: 16,
  },
});

// ✅ Same card design as Fruits/NewSeason
const cardStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginHorizontal: 8,
    width: 120,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
    marginTop: 4,
    flexWrap: "wrap",
    width: 100,
  },
});
