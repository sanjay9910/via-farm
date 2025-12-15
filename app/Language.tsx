import React, { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const languages = [
  { id: 'en', name: 'English' },
  { id: 'hi', name: 'Hindi' },
  { id: 'es', name: 'Spanish' },
  { id: 'fr', name: 'French' },
  { id: 'de', name: 'German' },
  { id: 'zh', name: 'Chinese' },
];

import { goBack } from 'expo-router/build/global-state/routing';
import { moderateScale, normalizeFont, scale } from './Responsive';

const Language = () => {
  const [selectedLang, setSelectedLang] = useState('en');

  const handleSelect = (id) => {
    setSelectedLang(id);
    console.log('Selected language:', id);
  };

  const renderItem = ({ item }) => {
    const isSelected = item.id === selectedLang;
    return (
      <TouchableOpacity
        style={[styles.langItem, isSelected && styles.langItemSelected]}
        onPress={() => handleSelect(item.id)}
        activeOpacity={0.7}
      >
        <Text  allowFontScaling={false} style={[styles.langText, isSelected && styles.langTextSelected]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
  <SafeAreaView style={{ flex: 1 ,backgroundColor:'#fff'}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:moderateScale(10),paddingHorizontal:moderateScale(20)}}>
        <TouchableOpacity onPress={goBack}>
            <Image source={require("../assets/via-farm-img/icons/groupArrow.png")} />
        </TouchableOpacity>
      
        <Text  allowFontScaling={false} style={styles.title}>Select Language</Text>
        <Text  allowFontScaling={false} style={{width:10}}></Text>
      </View>
      <View style={styles.container}>
        <FlatList
          data={languages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </SafeAreaView>
  );
};

export default Language;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: moderateScale(40),
    paddingHorizontal: moderateScale(20),
  },
  title: {
    fontSize: normalizeFont(15),
    fontWeight: '700',
    color: '#1f2937',
  },
  langItem: {
    paddingVertical: moderateScale(15),
    paddingHorizontal: moderateScale(20),
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  langItemSelected: {
    backgroundColor: '#22c55e',
  },
  langText: {
    fontSize: normalizeFont(16),
    color: '#1f2937',
  },
  langTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  separator: {
    height: scale(12),
  },
});
