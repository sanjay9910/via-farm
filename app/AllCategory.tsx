import Handicrafts from '@/components/allCategory/Handicrafts'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import Fruts from '../components/allCategory/Fruits'
import Plants from '../components/allCategory/Plants'
import Seeds from '../components/allCategory/Seeds'
import Vegetable from '../components/allCategory/Vegetables'
import Navbar from '../components/common/navbar'

const AllCategory = () => {
  return (
    <View style={styles.container}>
      <Navbar/>
      <Fruts/>
      <Vegetable/>
      <Seeds/>
      <Plants/>
      <Handicrafts/>
    </View>
  )
}

export default AllCategory

const styles = StyleSheet.create({
  container:{
    backgroundColor:'white',
    flex:1,
    marginBottom:50,
  }
})