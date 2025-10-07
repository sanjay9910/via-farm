import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const languages = [
  { id: 'en', name: 'English' },
  { id: 'hi', name: 'Hindi' },
  { id: 'es', name: 'Spanish' },
  { id: 'fr', name: 'French' },
  { id: 'de', name: 'German' },
  { id: 'zh', name: 'Chinese' },
];

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
        <Text style={[styles.langText, isSelected && styles.langTextSelected]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Select Language</Text>
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
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1f2937',
  },
  langItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  langItemSelected: {
    backgroundColor: '#22c55e',
  },
  langText: {
    fontSize: 16,
    color: '#1f2937',
  },
  langTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  separator: {
    height: 12,
  },
});
