import React from 'react'
import { StyleSheet } from 'react-native'
import PromoCard from '../../common/PromCard'

const CannactNow = () => {
  return (
       <PromoCard
        image=""
        title="Cannact Now"
        buttonText="Get Now"
        onPress={() => Alert.alert("Electronics offer clicked!")}
      />
  )
}

export default CannactNow

const styles = StyleSheet.create({})