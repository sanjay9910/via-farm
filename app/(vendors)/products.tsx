import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

const Products = () => {
  return (
    <View style={styles.container}>
      <Text>Products</Text>
    </View>
  )
}

export default Products

const styles = StyleSheet.create({
    container:{
      flex:1,
     flexDirection:'row',
     justifyContent:'center',
     alignItems:'center',
     backgroundColor:'#fff',
    },
})