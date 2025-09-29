import React from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

// Sample data - replace this with your API data
const sampleData = [
  {
    id: 1,
    name: 'Kunal Verma',
    rating: 4.2,
    date: '16/10/2025',
    message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 2,
    name: 'Priya Sharma',
    rating: 4.8,
    date: '15/10/2025',
    message: 'Excellent service and amazing experience. Highly recommended for everyone looking for quality work.',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 3,
    name: 'Rahul Singh',
    rating: 4.5,
    date: '14/10/2025',
    message: 'Great work and professional approach. Will definitely work again in the future projects.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 4,
    name: 'Anita Patel',
    rating: 4.9,
    date: '13/10/2025',
    message: 'Outstanding quality and timely delivery. Very satisfied with the overall experience and results.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  }
];

const ReviewCard = ({ item }) => {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      {/* Header Section */}
      <View style={styles.header}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>⭐ {item.rating}</Text>
          </View>
        </View>
        <Text style={styles.date}>{item.date}</Text>
      </View>

      {/* Message Section */}
      <Text style={styles.message}>{item.message}</Text>
    </TouchableOpacity>
  );
};

const CardList = () => {
  // Function to render each card
  const renderCard = ({ item }) => <ReviewCard item={item} />;

  return (
    <View style={styles.container}>      
<FlatList
  data={sampleData}
  renderItem={renderCard}
  keyExtractor={(item) => item.id.toString()}
  horizontal={true}
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.listContainer}
  snapToInterval={330 + 15} // card width + margin
  decelerationRate="fast"
  pagingEnabled={true}
/>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  listContainer: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingVertical: 10,
  },
  card: {
    width: width * 0.85,
    backgroundColor: '#ffffff',
    borderRadius:10,
    padding:15,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.4)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8ecf0',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  ratingContainer: {
    alignSelf: 'flex-start',
  },
  rating: {
    fontSize: 14,
    color: '#f39c12',
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    color: 'rgba(66, 66, 66, 0.7)',
    fontWeight: '400',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(66, 66, 66, 0.7)',
    textAlign: 'left',
  },
});

export default CardList;