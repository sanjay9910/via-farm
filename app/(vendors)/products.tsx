import AddProduct from "@/components/vendors/AddProduct";
// import ProductFilter from '@/components/vendors/filter/ProductFilter'
import Header from "@/components/vendors/Header";
import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProductCard from "../../components/vendors/ProductCard";

const Products = () => {
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {}, []);

  const freshCard = () => {
    console.log("jhkgfdghj");
    setRefresh((prev) => !prev);
  };
  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <AddProduct refreshprops={freshCard} />
      {/* <ProductFilter/> */}
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
