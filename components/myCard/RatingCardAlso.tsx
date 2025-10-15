import { useNavigation } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../common/card';

const NewSeason = () => {

  const navnavigation = useNavigation();

    const data = [
  { name: 'like', image: 'https://disneyvillains.fandom.com/wiki/Tamatoa' },
  { name: 'like', image: 'https://disneyvillains.fandom.com/wiki/Tamatoa' },
  { name: 'like', image: 'https://disneyvillains.fandom.com/wiki/Tamatoa' },
];


  return (
    <View style={{ marginVertical: 20 }}>
      <View style={styles.headerRow}>
  <Text style={styles.heading}>Rating & Review</Text>
  <TouchableOpacity onPress={() => navigation.navigate("")}>
    <Text style={styles.link}>View All  </Text>
    {/* <Ionicons name="arrow-forward" size={18} color="#333" style={styles.icon} /> */}
  </TouchableOpacity>
</View>
      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 10 }}
        renderItem={({ item }) => <Card name={item.name} image={item.image} stylek={{}} />}
      />
    </View>
  )
}

export default NewSeason

const styles = StyleSheet.create({
  heading:{
     fontSize:20,
     marginLeft:20,
     fontWeight:600,
  },
    headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingRight:20,
    color:'blue',
  },
  link:{
    color:'blue',
    flex:1,
    justifyContent:'center',
    textAlign:'center',
    alignItems:'center',
  },
    icon: {
    marginLeft: 5,
    color:'blue',
  },
})