import Handicrafts from '@/components/allCategory/Handicrafts'
import Banner from '@/components/common/BannerCard'
import React from 'react'
import { StyleSheet, View } from 'react-native'
// import { ScrollView } from 'react-native-reanimated/lib/typescript/Animated'
import { ScrollView } from 'react-native'
import Fruts from '../../components/allCategory/Fruits'
import Plants from '../../components/allCategory/Plants'
import Seeds from '../../components/allCategory/Seeds'
import Vegetable from '../../components/allCategory/Vegetables'
import Navbar from '../../components/common/navbar'

const Category = () => {
  return (
    <View style={styles.container}>
      <Navbar/>
      <ScrollView>
      <Banner/>
      <Fruts/>
      <Vegetable/>
      <Seeds/>
      <Plants/>
      <Handicrafts/>
      </ScrollView>
    </View>
  )
}

export default Category

const styles = StyleSheet.create({
    container:{
        flex:1,
        backgroundColor:'white',
    }
})