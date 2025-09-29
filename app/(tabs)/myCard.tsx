import React from 'react'
import { StyleSheet, View } from 'react-native'
import OrderAdd from '../../components/myCard/OrderAdd'

const MyCard = () => {
  return (
    <View style={styles.container}>
      <OrderAdd/>
      {/* <SuggestionCard/> */}
      
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