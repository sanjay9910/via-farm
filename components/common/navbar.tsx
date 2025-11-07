// HeaderDesign_responsive_keep_all.jsx
import { AuthContext } from '@/app/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useContext, useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PixelRatio,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// guideline based on iPhone X
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;
const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;
const normalizeFont = (size) => {
  const newSize = moderateScale(size);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
};

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
  const { user, address, fetchBuyerAddress } = useContext(AuthContext);

  // Profile picture URL
  const profilePicture = user?.profilePicture || user?.profileImage || null;

  // First letter for fallback
  const getInitial = () => {
    if (user?.name && user.name.length > 0) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const notification = () => {
    navigation.navigate("Notification")
  }

  useEffect(() => {
    fetchBuyerAddress();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.locationContainer}>
            <Text style={styles.locationText}>
              {address?.city || 'Select City'}
            </Text>
          </TouchableOpacity>
          <View style={styles.rightSection}>
            <TouchableOpacity onPress={notification}>
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

        <Text style={styles.locationSubtitle}>{address?.locality || ''}{address?.district ? `, ${address.district}` : ''}</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={normalizeFont(18)} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={placeholders[index]}
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity style={styles.filterButton} onPress={openFilterPopup}>
            <Ionicons name="options" size={normalizeFont(20)} color="#666" />
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
                <Ionicons name="filter" size={normalizeFont(18)} color="#333" />
                <Text style={styles.filterTitle}>Filters</Text>
              </View>
              <TouchableOpacity onPress={closeFilterPopup}>
                <Ionicons name="close" size={normalizeFont(20)} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Filter Options */}
            <View style={styles.filterContent}>

              {/* Sort by */}
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Sort by</Text>
                <Ionicons name="chevron-down" size={normalizeFont(14)} color="#666" />
              </TouchableOpacity>

              {/* Price Range */}
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Price Range</Text>
                <Ionicons name="chevron-down" size={normalizeFont(14)} color="#666" />
              </TouchableOpacity>

              {/* Distance */}
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Distance</Text>
                <Ionicons name="chevron-down" size={normalizeFont(14)} color="#666" />
              </TouchableOpacity>

              {/* Rating */}
              <TouchableOpacity style={styles.filterOption}>
                <Text style={styles.filterOptionText}>Rating</Text>
                <Ionicons name="chevron-down" size={normalizeFont(14)} color="#666" />
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
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: moderateScale(16),
    borderBottomColor: '#f0f0f0',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: normalizeFont(12),
    fontWeight: '600',
    color: '#333',
    marginRight: moderateScale(4),
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap:8,
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: moderateScale(16),
  },
  languageText: {
    fontSize: normalizeFont(12),
    color: '#333',
    marginRight: moderateScale(4),
  },
  profileContainer: {
    marginLeft: moderateScale(8),
  },
  profileCircle: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
  },
  profileText: {
    color: '#fff',
    fontSize: normalizeFont(12),
    fontWeight: '600',
  },
  locationSubtitle: {
    fontSize: normalizeFont(12),
    color: '#666',
    marginBottom: moderateScale(10),
    marginLeft: moderateScale(2),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: moderateScale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: normalizeFont(15),
    color: '#333',
    paddingVertical: 0,
  },
  filterButton: {
    padding: moderateScale(4),
    marginLeft: moderateScale(4),
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
    width: moderateScale(250),
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderBottomLeftRadius: moderateScale(20),
    borderWidth: moderateScale(2),
    borderColor: 'rgba(255, 202, 40, 1)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(5),
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTitle: {
    fontSize: normalizeFont(18),
    fontWeight: '600',
    color: '#333',
    marginLeft: moderateScale(8),
  },
  filterContent: {
    flex: 1,
    padding: moderateScale(20),
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  notification: {
    backgroundColor: 'rgba(240, 240, 240, 1)',
    padding: moderateScale(10),
    borderRadius: moderateScale(50),
  },
  filterOptionText: {
    fontSize: normalizeFont(16),
    color: '#333',
  },
  filterFooter: {
    padding: moderateScale(20),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  applyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: normalizeFont(16),
    fontWeight: '600',
  },
});

// HeaderDesign_responsive_fonts.jsx
// import { AuthContext } from '@/app/context/AuthContext';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import React, { useContext, useEffect, useState } from 'react';
// import {
//   Dimensions,
//   Image,
//   PixelRatio,
//   Platform,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// // Responsive helpers
// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// // base dimensions (iPhone X)
// const guidelineBaseWidth = 375;
// const guidelineBaseHeight = 812;

// const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
// const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
// const moderateScale = (size, factor = 0.5) =>
//   size + (scale(size) - size) * factor;

// const normalizeFont = (size) => {
//   const newSize = moderateScale(size);
//   if (Platform.OS === 'ios') {
//     return Math.round(PixelRatio.roundToNearestPixel(newSize));
//   } else {
//     // android renders slightly larger, so reduce by 1 for parity
//     return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
//   }
// };

// export default function HeaderDesign() {
//   const [searchText, setSearchText] = useState('');
//   const navigation = useNavigation();

//   const placeholders = ['Search by Products', 'Search by Name', 'Search by ID'];
//   const [index, setIndex] = useState(0);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setIndex((p) => (p + 1) % placeholders.length);
//     }, 2000);
//     return () => clearInterval(interval);
//   }, []);

//   // AuthContext se user data (defensive fallback)
//   const { user, address, fetchBuyerAddress } = useContext(AuthContext ?? {});
//   const profilePicture = user?.profilePicture || user?.profileImage || null;
//   const getInitial = () =>
//     user?.name && user.name.length > 0 ? user.name.charAt(0).toUpperCase() : 'U';

//   useEffect(() => {
//     if (typeof fetchBuyerAddress === 'function') {
//       fetchBuyerAddress();
//     }
//   }, [fetchBuyerAddress]);

//   const goNotification = () => navigation.navigate?.('Notification');
//   const goProfile = () => navigation.navigate?.('profile');
//   const onSubmitSearch = () => {
//     if (!searchText?.trim()) return;
//     navigation.navigate?.('SearchResults', { q: searchText.trim() });
//   };

//   const cityText = address?.city || 'Select City';
//   const localityText = address?.locality || '';
//   const districtText = address?.district ? `, ${address.district}` : '';

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar backgroundColor="#fff" barStyle="dark-content" />
//       <View style={styles.header}>
//         <View style={styles.topRow}>
//           <TouchableOpacity
//             style={styles.locationContainer}
//             onPress={() => navigation.navigate?.('SelectCity')}
//             activeOpacity={0.8}
//           >
//             <Text style={styles.locationText}>{cityText}</Text>
//             <Image
//               source={require('../../assets/via-farm-img/icons/downArrow.png')}
//               style={styles.downIcon}
//             />
//           </TouchableOpacity>

//           <View style={styles.rightSection}>
//             <TouchableOpacity
//               onPress={goNotification}
//               activeOpacity={0.8}
//               style={styles.bellButton}
//             >
//               <View style={styles.bellWrap}>
//                 <Image
//                   source={require('../../assets/via-farm-img/icons/notification.png')}
//                   style={styles.bellIcon}
//                 />
//               </View>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.profileContainer}
//               onPress={goProfile}
//               activeOpacity={0.8}
//             >
//               <View style={styles.profileCircle}>
//                 {profilePicture ? (
//                   <Image
//                     source={{ uri: profilePicture }}
//                     style={styles.profileImage}
//                     resizeMode="cover"
//                   />
//                 ) : (
//                   <Text style={styles.profileText}>{getInitial()}</Text>
//                 )}
//               </View>
//             </TouchableOpacity>
//           </View>
//         </View>

//         <Text
//           style={styles.locationSubtitle}
//           numberOfLines={1}
//           ellipsizeMode="tail"
//         >
//           {localityText}
//           {districtText}
//         </Text>

//         <View style={styles.searchContainer}>
//           <Ionicons
//             name="search"
//             size={normalizeFont(18)}
//             color="#999"
//             style={styles.searchIcon}
//           />
//           <TextInput
//             style={styles.searchInput}
//             placeholder={placeholders[index]}
//             placeholderTextColor="#999"
//             value={searchText}
//             onChangeText={setSearchText}
//             returnKeyType="search"
//             onSubmitEditing={onSubmitSearch}
//             selectionColor="#333"
//           />
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: '#fff',

//   },
//   header: {
//     backgroundColor: '#fff',
//     paddingHorizontal: moderateScale(16),
//     paddingTop: verticalScale(12),
//     paddingBottom: verticalScale(10),
//   },
//   topRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },

//   locationContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     maxWidth: '75%',
//   },
//   locationText: {
//     fontSize: normalizeFont(12), 
//     fontWeight: '600',
//     color: '#333',
//     marginRight: moderateScale(6),
//   },
//   downIcon: {
//     width: moderateScale(14),
//     height: moderateScale(14),
//     tintColor: '#333',
//   },

//   rightSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },

//   bellButton: {
//     marginRight: moderateScale(10),
//   },
//   bellWrap: {
//     width: moderateScale(40),
//     height: moderateScale(40),
//     borderRadius: moderateScale(20),
//     backgroundColor: '#fff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     ...Platform.select({
//       ios: {
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 5 },
//         shadowOpacity: 0.06,
//         shadowRadius: 8,
//       },
//       android: {
//         elevation: 4,
//       },
//     }),
//   },
//   bellIcon: {
//     width: moderateScale(18),
//     height: moderateScale(18),
//     resizeMode: 'contain',
//     tintColor: '#333',
//   },

//   profileContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   profileCircle: {
//     width: moderateScale(40),
//     height: moderateScale(40),
//     borderRadius: moderateScale(20),
//     backgroundColor: '#FF9800',
//     justifyContent: 'center',
//     alignItems: 'center',
//     overflow: 'hidden',
//   },
//   profileImage: {
//     width: moderateScale(40),
//     height: moderateScale(40),
//     borderRadius: moderateScale(20),
//   },
//   profileText: {
//     color: '#fff',
//     fontSize: normalizeFont(12),
//     fontWeight: '600',
//   },

//   locationSubtitle: {
//     fontSize: normalizeFont(12),
//     color: '#666',
//     marginTop: verticalScale(6),
//     marginBottom: verticalScale(12),
//     maxWidth: '100%',
//   },

//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f8f8f8',
//     borderRadius: moderateScale(8),
//     paddingHorizontal: moderateScale(12),
//     paddingVertical: verticalScale(8),
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   searchIcon: {
//     marginRight: moderateScale(8),
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: normalizeFont(12),
//     color: '#333',
//     paddingVertical: 0,
//   },
// });
