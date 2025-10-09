import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "expo-router";
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

// ✅ Custom Product Card
const ProductCard = ({ name, image, vendorName }) => {
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

const NewSeason = () => {
  const navigation = useNavigation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLocalBest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_BASE}/api/buyer/local-best?lat=19.0760&lng=72.8777&maxDistance=50000`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          timeout: 10000,
        }
      );

      console.log("📦 Local Best API Response:", response.data);

      if (response.data && response.data.success) {
        // ✅ Direct mapping from API response
        const formattedData = response.data.data.map((item, index) => ({
          id: `local-best-${index}`,
          name: item.name,
          image: item.image,
        }));
        
        setData(formattedData);
        console.log(`✅ Loaded ${formattedData.length} local products`);
      } else {
        setError("No local products found in your area");
      }
    } catch (err) {
      console.error("❌ Error fetching local best:", err);
      
      if (err.response?.status === 401) {
        setError("Please login to view local products");
      } else if (err.code === 'ECONNABORTED') {
        setError("Request timeout. Please try again.");
      } else if (err.response?.status === 404) {
        setError("Local products not found in your area");
      } else if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Failed to load local products. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalBest();
  }, []);

  const handleRetry = () => {
    setError(null);
    fetchLocalBest();
  };

  const handleLogin = () => {
    navigation.navigate("login");
  };

  // ⏳ Loading State
  if (loading) {
    return (
      <View style={{ marginVertical: 20 }}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Local Best</Text>
          <TouchableOpacity onPress={() => navigation.navigate("AllCategory")}>
            <Text style={styles.link}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Discovering local products...</Text>
        </View>
      </View>
    );
  }

  // ⚠️ Error State
  if (error) {
    return (
      <View style={{ marginVertical: 20 }}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Local Best</Text>
          <TouchableOpacity onPress={() => navigation.navigate("AllCategory")}>
            <Text style={styles.link}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
            >
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

  // ✅ Render Data
  return (
    <View style={{ marginVertical: 20 }}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Local Best</Text>
        <TouchableOpacity onPress={() => navigation.navigate("AllCategory")}>
          <Text style={styles.link}>View All</Text>
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
            <ProductCard 
              name={item.name} 
              image={item.image} 
            />
          )}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No local products found near you</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default NewSeason;

// ✅ Header + State Styles
const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    marginLeft: 20,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingRight: 20,
  },
  link: {
    color: 'blue',
    flex: 1,
    justifyContent: 'center',
    textAlign: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    marginHorizontal: 20,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  retryButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  loginButton: {
    backgroundColor: '#388e3c',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    color: '#666',
    fontSize: 16,
  },
});

// New Card Styles - Image inside card, name below card
const cardStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 120,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom:5,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  name: {
    fontSize:14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    width: 100,
  },
});