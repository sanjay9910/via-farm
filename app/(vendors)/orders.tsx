
import Header from '@/components/vendors/Header'
import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import OrderAllVendors from '../../components/vendors/OrderAllVendors'


const Order = () => {
  return (
    <SafeAreaView>
      <Header />
      <ScrollView>
        <OrderAllVendors />
      </ScrollView>
    </SafeAreaView>
  )
}

export default Order

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
})