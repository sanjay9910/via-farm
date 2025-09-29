import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

const ReviewOrder = () => {
  return (
    <View style={styles.container}>
      <Text>Review Order</Text>
    </View>
  )
}

export default ReviewOrder

const styles = StyleSheet.create({
    container:{
     flex:1,
     justifyContent:'center',
     alignItems:'center',
    }
})