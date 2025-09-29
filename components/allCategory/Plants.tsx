import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../common/card';

const Plants = () => {
  const navigation = useNavigation(); // Navigation hook add kiya

  const data = [
    { name: 'Fruits', image: 'https://via.placeholder.com/150' }, 
    { name: 'Fruits', image: 'https://via.placeholder.com/150' }, 
    { name: 'Fruits', image: 'https://via.placeholder.com/150' }, 
    { name: 'Fruits', image: 'https://via.placeholder.com/150' }, 
    { name: 'Fruits', image: 'https://via.placeholder.com/150' }, 
    { name: 'Fruits', image: 'https://via.placeholder.com/150' }, 
    { name: 'Fruits', image: 'https://via.placeholder.com/150' }, 
    { name: 'Fruits', image: 'https://via.placeholder.com/150' }, 
  ];

  return (
    <View style={{ marginVertical:10 }}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Plants</Text>
        <TouchableOpacity onPress={() => navigation.navigate("")}>
          <View style={styles.linkContainer}>
            <Text style={styles.link}>See All</Text>
            <Ionicons name="arrow-forward" size={13} color="#007AFF" style={styles.icon} />
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 10 }}
        renderItem={({ item }) => (
          <Card name={item.name} image={item.image} stylek={{}} />
        )}
      />
    </View>
  );
};

export default Plants;

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    marginLeft: 20,
    fontWeight: '600', 
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingRight: 20,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  link: {
    color: '#007AFF',
    fontSize:12,
    fontWeight:600,
  },
  icon:{

  }
});