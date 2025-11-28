import Header from '@/components/vendors/Header'
import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import OrderAllVendors from '../../components/vendors/OrderAllVendors'
import { moderateScale } from '../Responsive'

const Order = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom:moderateScale(30) }}>
        <OrderAllVendors />
      </ScrollView>
    </SafeAreaView>
  )
}

export default Order

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',  
  },
  scroll: {
    flex: 1,
    backgroundColor: '#fff', 
  }
})
