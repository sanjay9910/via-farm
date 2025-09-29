import React from 'react'
import { StyleSheet } from 'react-native'
import PromoCard from '../../common/PromCard'

const BannerGet = () => {
  return (
      <PromoCard
        image=""
        title="New this Season"
        buttonText="Get Now"
        onPress={() => Alert.alert("Electronics offer clicked!")}
      />
  )
}

export default BannerGet

const styles = StyleSheet.create({})