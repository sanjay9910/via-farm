import Banner from '@/components/common/BannerCard'
import Chart from '@/components/vendors/chart'
import MyRecentListing from '@/components/vendors/MyRecentListing'
import OrderDetails from '@/components/vendors/OrderDetails'
import Revenue from '@/components/vendors/Revenue'
import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

const Index = () => {
  return (
    <View style={styles.container}>
      <ScrollView>
        <Banner/>
        <Revenue/>
        <Chart/>
        <OrderDetails/>
        <MyRecentListing/>
      </ScrollView>
    </View>
  )
}

export default Index

const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:'#fff',
  }
})