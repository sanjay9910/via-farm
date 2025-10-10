import { AuthContext } from '@/app/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useContext, useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function HeaderDesign() {
  const [searchText, setSearchText] = useState('');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const slideAnim = useState(new Animated.Value(width))[0];
  const navigation = useNavigation();

  const placeholders = ["Search by Products", "Search by Name", "Search by ID"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % placeholders.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const openFilterPopup = () => {
    setShowFilterPopup(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeFilterPopup = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowFilterPopup(false);
    });
  };

  // AuthContext se user data
  const { user } = useContext(AuthContext);
  
  // Profile picture URL
  const profilePicture = user?.profilePicture || user?.profileImage || null;
  
  // First letter for fallback
  const getInitial = () => {
    if (user?.name && user.name.length > 0) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      {/* Header Container */}
      <View style={styles.header}>

        {/* Top Row - Location and Language */}
        <View style={styles.topRow}>
          {/* Location Section */}
          <TouchableOpacity style={styles.locationContainer}>
            <Text style={styles.locationText}>Delhi</Text>
            <Ionicons name="chevron-down" size={16} color="#333" />
          </TouchableOpacity>

          {/* Language and Profile Section */}
          <View style={styles.rightSection}>
            <TouchableOpacity>
              <Image source={require('../../assets/via-farm-img/icons/notification.png')} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileContainer}
              onPress={() => navigation.navigate('profile')}
            >
              <View style={styles.profileCircle}>
                {profilePicture ? (
                  <Image 
                    source={{ uri: profilePicture }} 
                    style={styles.profileImage}
                  />
                ) : (
                  <Text style={styles.profileText}>{getInitial()}</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.locationSubtitle}>Janakpuri West, New Delhi</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={placeholders[index]}
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity style={styles.micButton}>
            <Ionicons name="mic" size={18} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={openFilterPopup}>
            <Ionicons name="options" size={18} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Popup Modal */}
      <Modal
        visible={showFilterPopup}
        transparent={true}
        animationType="none"
        onRequestClose={closeFilterPopup}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            onPress={closeFilterPopup}
          />
          <Animated.View
            style={[
              styles.filterPopup,
              {
                transform: [{ translateX: slideAnim }]
              }
            ]}
          >
            {/* Filter Header */}
            <View style={styles.filterHeader}>
              <View style={styles.filterTitleContainer}>
                <Ionicons name="filter" size={20} color="#333" />
                <Text style={styles.filterTitle}>Filters</Text>
              </View>
              <TouchableOpacity onPress={closeFilterPopup}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Filter Options */}
            <View style={styles.filterContent}>

              {/* Sort by */}
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Sort by</Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>

              {/* Price Range */}
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Price Range</Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>

              {/* Distance */}
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Distance</Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>

              {/* Rating */}
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Rating</Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>

            </View>

            {/* Apply Button */}
            <View style={styles.filterFooter}>
              <TouchableOpacity style={styles.applyButton} onPress={closeFilterPopup}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    height:133,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: '#f0f0f0',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  languageText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  profileContainer: {
    marginLeft: 8,
  },
  profileCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profileText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  locationSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    marginLeft: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 0,
  },
  micButton: {
    padding: 4,
    marginLeft: 8,
  },
  filterButton: {
    padding: 4,
    marginLeft: 4,
  },

  // Filter Popup Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  filterPopup: {
    position: 'absolute',
    right: 0,
    top: 190,
    bottom: 0,
    width: 250,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 202, 40, 1)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  filterContent: {
    flex: 1,
    padding: 20,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  notification: {
    backgroundColor: 'rgba(240, 240, 240, 1)',
    padding: 10,
    borderRadius: 50,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
  },
  filterFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  applyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});