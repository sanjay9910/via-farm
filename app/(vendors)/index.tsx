import Banner from '@/components/common/BannerCard'
import Chart from '@/components/vendors/chart'
import Header from '@/components/vendors/Header'
import MyRecentListing from '@/components/vendors/MyRecentListing'
import Revenue from '@/components/vendors/Revenue'
import OrderDetails from '@/components/vendors/TodayOrder'
import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Index = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header/>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Banner/>
        <Revenue/>
        <Chart/>
        <OrderDetails/>
        <MyRecentListing/>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Index

const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:'#fff',
  }
})
