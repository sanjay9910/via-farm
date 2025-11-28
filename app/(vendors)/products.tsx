import AddProduct from "@/components/vendors/AddProduct";
import Header from "@/components/vendors/Header";
import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProductCard from "../../components/vendors/ProductCard";

const Products = () => {
  const [refresh, setRefresh] = useState(false);

  const freshCard = () => {
    setRefresh((prev) => !prev);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header />
      <AddProduct refreshprops={freshCard} />
      <ProductCard refreshbut={refresh} />
    </SafeAreaView>
  );
};

export default Products;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
