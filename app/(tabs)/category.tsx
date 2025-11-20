import Banner from '@/components/common/BannerCard'
import React from 'react'
import { StyleSheet, View } from 'react-native'
// import { ScrollView } from 'react-native-reanimated/lib/typescript/Animated'
import AllCategory from '@/components/allCategory/AllCategory'
import { ScrollView } from 'react-native'
import Navbar from '../../components/common/navbar'

const Category = () => {
  return (
    <View style={styles.container}>
      <Navbar/>
      <ScrollView>
      <Banner/>
      {/* <Fruts/>
      <Vegetable/>
      <Seeds/>
      <Plants/>
      <Handicrafts/> */}
      <AllCategory/>
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