import React from 'react'
import { StyleSheet } from 'react-native'
import PromoCard from '../../common/PromCard'


const ExploreNow = () => {
  return (
    <PromoCard
        image=""
        title=""
        buttonText="Explore Now"
        onPress={() => Alert.alert("Electronics offer clicked!")}
      />
  )
}

export default ExploreNow

const styles = StyleSheet.create({})