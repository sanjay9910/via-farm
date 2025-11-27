import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { moderateScale, normalizeFont, scale } from './Responsive';

const SeeAllReview = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { vendor, reviews } = (route.params || {}) as any;

  if (!vendor) return <Text style={{ padding: 16 }}>No vendor data found</Text>;

  const v = vendor;
  const image = v.profilePicture || 'https://picsum.photos/800/600';

  const formatAddressObject = (addr: any) => {
    if (!addr) return '';
    const parts = [];
    if (addr.houseNumber) parts.push(String(addr.houseNumber));
    if (addr.street) parts.push(String(addr.street));
    if (addr.locality) parts.push(String(addr.locality));
    if (addr.city) parts.push(String(addr.city));
    if (addr.district) parts.push(String(addr.district));
    if (addr.state) parts.push(String(addr.state));
    if (addr.pinCode || addr.zip) parts.push(String(addr.pinCode ?? addr.zip));
    // latitude/longitude not included
    return parts.filter(Boolean).join(', ');
  };

  let vendorLocationRaw: any =
    v.locationText ?? v.addressesText ?? v.address ?? v.addresses ?? v.location ?? null;

  let vendorLocation = '';
  if (typeof vendorLocationRaw === 'string') {
    vendorLocation = vendorLocationRaw;
  } else if (Array.isArray(vendorLocationRaw) && vendorLocationRaw.length > 0) {
    const first = vendorLocationRaw[0];
    if (typeof first === 'string') vendorLocation = first;
    else vendorLocation = formatAddressObject(first);
  } else if (typeof vendorLocationRaw === 'object' && vendorLocationRaw !== null) {
    vendorLocation = formatAddressObject(vendorLocationRaw);
  } else {
    vendorLocation = 'Location not available';
  }

  const ReviewCard = ({ item }: any) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: item?.user?.profilePicture || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
          resizeMode='stretch'
        />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.reviewerName}>{item?.user?.name || 'Anonymous'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="star" color="#FFD700" size={14} />
            <Text style={styles.ratingText}>{' '}{item?.rating != null ? String(item.rating) : 'N/A'}</Text>
          </View>
        </View>
        <Text style={styles.reviewDate}>
          {item?.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : ''}
        </Text>
      </View>

      {item?.images?.length > 0 && (
        <FlatList
          data={item.images}
          horizontal
          keyExtractor={(_img, idx) => `img-${idx}`}
          renderItem={({ item: img }: any) => {
            const uri = typeof img === 'string' ? img : img?.url ?? img?.image ?? '';
            return <Image source={{ uri }} style={styles.reviewImage} />;
          }}
          showsHorizontalScrollIndicator={false}
          style={{ marginVertical: 8 }}
        />
      )}

      <Text style={styles.reviewComment}>{item?.comment || 'No comment provided.'}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Image */}
      <View style={styles.imageBox}>
        <Image source={{ uri: image }} style={styles.headerImage} />
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Vendor Info */}
      <View style={styles.vendorInfo}>
        <Text style={styles.vendorName}>{v.name || 'Vendor'}</Text>
        <View style={styles.row}>
          <Image source={require("../assets/via-farm-img/icons/loca.png")} />
          <Text style={styles.vendorLocation}>
            {vendorLocation} {v.distance ? `(${v.distance})` : ''}
          </Text>
        </View>
        <Text style={styles.aboutHeader}>About the vendor</Text>
        <Text style={styles.aboutText}>
          {v.about || 'No description available.'}
        </Text>
      </View>

      {/* Reviews */}
      <View style={styles.reviewsContainer}>
        <Text style={styles.allReviewsTitle}>
          All Reviews ({Array.isArray(reviews) ? reviews.length : 0} reviews)
        </Text>

        {Array.isArray(reviews) && reviews.length > 0 ? (
          <FlatList
            data={reviews}
            keyExtractor={(item: any, idx: number) => (item?._id ? String(item._id) : String(idx))}
            renderItem={({ item }: any) => <ReviewCard item={item} />}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyBox}>
            <View style={{flexDirection:'row',alignItems:'center',gap:5}}>
            <Image style={{width:scale(30),height:scale(30)}} source={require("../assets/via-farm-img/icons/satar.png")} />
            <Image style={{width:scale(30),height:scale(30)}} source={require("../assets/via-farm-img/icons/satar.png")} />
            <Image style={{width:scale(30),height:scale(30)}} source={require("../assets/via-farm-img/icons/satar.png")} />
            <Image style={{width:scale(30),height:scale(30)}} source={require("../assets/via-farm-img/icons/satar.png")} />
            <Image style={{width:scale(30),height:scale(30)}} source={require("../assets/via-farm-img/icons/satar.png")} />
            </View>
            <Text style={styles.noReviewText}>No reviews yet.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default SeeAllReview;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageBox: {
    width: '100%',
    height: scale(350),
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backBtn: {
    position: 'absolute',
    top: moderateScale(40),
    left: moderateScale(15),
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: moderateScale(20),
    padding: moderateScale(6),
  },
  vendorInfo: {
    backgroundColor: '#fff',
    paddingHorizontal: moderateScale(15),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  vendorName: {
    fontSize: normalizeFont(13),
    fontWeight: 'bold',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: moderateScale(4),
  },
  vendorLocation: {
    fontSize: normalizeFont(10),
    color: '#757575',
    marginLeft: moderateScale(5),
  },
  aboutHeader: {
    fontSize: normalizeFont(12),
    fontWeight: 'bold',
    marginTop: moderateScale(10),
    color: '#333',
  },
  aboutText: {
    fontSize: normalizeFont(11),
    color: '#555',
    marginTop: moderateScale(5),
    lineHeight: scale(20),
  },
  reviewsContainer: {
    padding:moderateScale(15),
  },
  allReviewsTitle: {
    fontSize: normalizeFont(12),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: moderateScale(10),
  },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: moderateScale(10),
    padding: moderateScale(15),
    marginBottom: moderateScale(15),
    borderWidth: 1,
    borderColor: '#eee',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: scale(45),
    height: scale(45),
    borderRadius: moderateScale(25),
  },
  reviewerName: {
    fontSize: normalizeFont(12),
    fontWeight: 'bold',
    color: '#333',
  },
  ratingText: {
    fontSize: normalizeFont(11),
    color: '#555',
  },
  reviewDate: {
    fontSize: normalizeFont(11),
    color: '#9E9E9E',
  },
  reviewComment: {
    fontSize: normalizeFont(11),
    color: '#444',
    marginTop: normalizeFont(5),
    lineHeight: scale(20),
  },
  reviewImage: {
    width: scale(50),
    height: scale(50),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(8),
  },
  emptyBox: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(40),
  },
  emptyImage: {
    width: scale(160),
    height: scale(160),
  },
  noReviewText: {
    color: '#757575',
    marginTop: moderateScale(10),
  },
});
