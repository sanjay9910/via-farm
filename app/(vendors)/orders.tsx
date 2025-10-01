import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

const Order = () => {
  return (
    <View style={styles.container}>
      <Text>Order</Text>
    </View>
  )
}

export default Order

const styles = StyleSheet.create({
    container:{
      flex:1,
     flexDirection:'row',
     justifyContent:'center',
     alignItems:'center',
     backgroundColor:'#fff',
    },
})