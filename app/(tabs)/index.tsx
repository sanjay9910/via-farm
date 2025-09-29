import CannactNow from '@/components/dashboard/connactNow/CannactNow';
import ExploreNow from '@/components/dashboard/exploreNow/ExploreNow';
import BannerGet from '@/components/dashboard/getNow/bannerGet';
import NewSeason from '@/components/dashboard/newSeason/NewSeason';
import SmartPicks from '@/components/dashboard/smartPicks/SmartPicks';
import VendorsNearYou from '@/components/dashboard/vendorsNearYou/VendorsNearYou';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Banner from '../../components/common/BannerCard';
import Navbar from '../../components/common/navbar';
import Category from '../../components/dashboard/category/categoryCard';
import FressPopular from '../../components/dashboard/fressPopular/fressPopular';

const index = () => {
  return (
    <View style={styles.container}>
      <Navbar/>
    <ScrollView> 
      <Banner/>
      <Category/>
      <FressPopular/>
      <BannerGet/>
      <NewSeason/>
      <ExploreNow/>
      <SmartPicks/>
      <CannactNow/>
      <VendorsNearYou/>
    </ScrollView>
    </View>
  )
}

export default index

const styles = StyleSheet.create({
    container:{
      flex:1,
      backgroundColor:'white',
    },
    section: {
    alignItems: 'center',
    marginVertical: 10,
  },
})