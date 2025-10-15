import React from 'react'
import { StyleSheet, View } from 'react-native'
import OrderAdd from '../../components/myCard/AddToCard'

const MyCard = () => {
  return (
    <View style={styles.container}>
      <OrderAdd/>      
    </View>
  )
}

export default MyCard

const styles = StyleSheet.create({
    container:{
      flex:1,
      backgroundColor:'#fff',
    }
})