import AddProduct from '@/components/vendors/AddProduct'
// import ProductFilter from '@/components/vendors/filter/ProductFilter'
import Header from '@/components/vendors/Header'
import React from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ProductCard from '../../components/vendors/ProductCard'

const Products = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header/>
      <AddProduct/>
      {/* <ProductFilter/> */}
        <ProductCard/>
    </SafeAreaView>
  )
}

export default Products

const styles = StyleSheet.create({
    container:{
      flex:1,
      backgroundColor:'#fff',
    },
})