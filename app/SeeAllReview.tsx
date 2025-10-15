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

const SeeAllReview = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { vendor, reviews } = route.params || {};

  if (!vendor) return <Text>No vendor data found</Text>;

  const v = vendor;
  const image = v.profilePicture || 'https://picsum.photos/800/600';

  const ReviewCard = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: item?.user?.profilePicture || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.reviewerName}>{item?.user?.name || 'Anonymous'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="star" color="#FFD700" size={14} />
            <Text style={styles.ratingText}> {item?.rating || 'N/A'}</Text>
          </View>
        </View>
        <Text style={styles.reviewDate}>
          {new Date(item?.createdAt).toLocaleDateString('en-GB')}
        </Text>
      </View>

      {item?.images?.length > 0 && (
        <FlatList
          data={item.images}
          horizontal
          keyExtractor={(img, idx) => `img-${idx}`}
          renderItem={({ item: img }) => (
            <Image source={{ uri: img }} style={styles.reviewImage} />
          )}
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
        <Text style={styles.vendorName}>{v.name}</Text>
        <View style={styles.row}>
          <Ionicons name="location-sharp" size={16} color="#757575" />
          <Text style={styles.vendorLocation}>
            {v.locationText || 'Unknown'} ({v.distance || 'N/A'})
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
          All Reviews ({reviews?.length || 0} reviews)
        </Text>

        {reviews?.length > 0 ? (
          <FlatList
            data={reviews}
            keyExtractor={item => item._id.toString()}
            renderItem={({ item }) => <ReviewCard item={item} />}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyBox}>
            <Image
              style={styles.emptyImage}
              source={require('../assets/via-farm-img/icons/emptyReview.png')}
            />
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
    height: 220,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backBtn: {
    position: 'absolute',
    top: 40,
    left: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },
  vendorInfo: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  vendorName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  vendorLocation: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 5,
  },
  aboutHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  aboutText: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
    lineHeight: 20,
  },
  reviewsContainer: {
    padding: 15,
  },
  allReviewsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingText: {
    fontSize: 13,
    color: '#555',
  },
  reviewDate: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  reviewComment: {
    fontSize: 14,
    color: '#444',
    marginTop: 5,
    lineHeight: 20,
  },
  reviewImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginRight: 8,
  },
  emptyBox: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyImage: {
    width: 160,
    height: 160,
  },
  noReviewText: {
    color: '#757575',
    marginTop: 10,
  },
});
