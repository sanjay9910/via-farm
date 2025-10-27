import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

const API_BASE = "https://393rb0pp-5000.inc1.devtunnels.ms";

// ==================== CHECKOUT SCREEN ====================
export function CheckoutScreen({ navigation, selectedAddress, products, totalAmount }) {
  const handleProceedToPayment = () => {
    if (!selectedAddress) {
      Alert.alert("Address Missing", "Please select a delivery address");
      return;
    }
    if (products.length === 0) {
      Alert.alert("Cart Empty", "Please add items first");
      return;
    }

    const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
    const amount = totalAmount.toFixed(2);

    // ✅ Pass order details to Payment screen
    navigation.navigate("Payment", {
      addressId: selectedAddress.id,
      deliveryType: "Delivery",
      comments: "Deliver before 8 PM please",
      paymentMethod: "UPI",
      totalAmount: amount,
      totalItems: totalItems.toString(),
    });
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20 }}>Order Summary</Text>
      <Text style={{ fontSize: 16, marginBottom: 10 }}>
        Total Items: {products.reduce((sum, p) => sum + p.quantity, 0)}
      </Text>
      <Text style={{ fontSize: 16, marginBottom: 20 }}>
        Total Amount: ₹{totalAmount.toFixed(2)}
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: "#4CAF50",
          padding: 15,
          borderRadius: 8,
          alignItems: "center",
        }}
        onPress={handleProceedToPayment}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
          Proceed to Payment
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ==================== PAYMENT SCREEN ====================
export default function PaymentScreen({ route }) {
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);

  // ✅ Extract params from navigation
  const {
    addressId,
    deliveryType,
    comments,
    paymentMethod,
    totalAmount,
    totalItems,
  } = route?.params || {};

  useEffect(() => {
    const createOrderAndGetQR = async () => {
      try {
        // ✅ Prepare request body
        const body = {
          deliveryType: deliveryType || "Delivery",
          addressId: addressId || "68ee30dbe5123aab550b6828",
          comments: comments || "Deliver before 8 PM please",
          paymentMethod: paymentMethod || "UPI",
        };

        const token = await AsyncStorage.getItem("userToken");
        
        if (!token) {
          Alert.alert("Error", "Authentication token not found. Please login again.");
          return;
        }

        const response = await axios.post(
          `${API_BASE}/api/buyer/orders/place`,
          body,
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`, 
            },
          }
        );


        // ✅ Extract payment info
        if (response.data?.success && response.data?.payments?.length > 0) {
          setPaymentInfo(response.data.payments[0]);
        } else {
          Alert.alert("Error", "Unable to get payment details");
        }
      } catch (error) {
        console.error("Payment Error:", error.response?.data || error.message);
        Alert.alert(
          "Error",
          error.response?.data?.message || "Failed to create order or generate payment QR"
        );
      } finally {
        setLoading(false);
      }
    };

    createOrderAndGetQR();
  }, [addressId, deliveryType, comments, paymentMethod]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 10, fontSize: 16 }}>Generating payment QR...</Text>
      </View>
    );
  }

  if (!paymentInfo) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ fontSize: 16, color: "#d32f2f" }}>No payment info found</Text>
      </View>
    );
  }

  const { vendorName, amount, upiId, qrCode, upiUrl, transactionRef, orderId } = paymentInfo;

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#fff",
      }}
    >
      {/* Header */}
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 5, textAlign: "center" }}>
        Payment Details
      </Text>
      <Text style={{ fontSize: 14, color: "#666", marginBottom: 20, textAlign: "center" }}>
        Order ID: {orderId}
      </Text>

      {/* Vendor Info */}
      <View
        style={{
          width: "100%",
          backgroundColor: "#f5f5f5",
          padding: 15,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
          {vendorName}
        </Text>
        <Text style={{ fontSize: 14, color: "#555", marginBottom: 5 }}>
          UPI ID: <Text style={{ fontWeight: "bold" }}>{upiId}</Text>
        </Text>
        <Text style={{ fontSize: 14, color: "#555" }}>
          Transaction Ref: <Text style={{ fontWeight: "bold" }}>{transactionRef}</Text>
        </Text>
      </View>

      {/* Amount */}
      <View style={{ marginBottom: 20, alignItems: "center" }}>
        <Text style={{ fontSize: 14, color: "#999", marginBottom: 5 }}>Total Amount</Text>
        <Text style={{ fontSize: 32, fontWeight: "bold", color: "#4CAF50" }}>
          ₹{amount}
        </Text>
      </View>

      {/* QR Code */}
      {qrCode ? (
        <Image
          source={{ uri: qrCode }}
          style={{
            width: 240,
            height: 240,
            borderRadius: 12,
            marginVertical: 20,
            borderWidth: 2,
            borderColor: "#e0e0e0",
          }}
        />
      ) : (
        <Text style={{ color: "#d32f2f", marginVertical: 20 }}>QR Code not available</Text>
      )}

      {/* Instructions */}
      <Text
        style={{
          fontSize: 16,
          color: "#333",
          textAlign: "center",
          marginVertical: 20,
          fontWeight: "500",
        }}
      >
        Scan this QR code with any UPI app to complete payment
      </Text>

      {/* Manual Payment Link */}
      {upiUrl && (
        <View style={{ marginTop: 20, width: "100%", paddingHorizontal: 10 }}>
          <Text style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
            If scanning doesn't work, copy this link:
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#e3f2fd",
              padding: 12,
              borderRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: "#2196F3",
            }}
          >
            <Text
              style={{
                color: "#1976D2",
                fontSize: 12,
                fontFamily: "monospace",
              }}
            >
              {upiUrl.substring(0, 50)}...
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}