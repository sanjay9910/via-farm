
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE = "https://viafarm-1.onrender.com";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/* small responsive helpers */
const guidelineBaseWidth = 375;
const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;
const normalizeFont = (size: number) =>
  Math.round(moderateScale(size) * (SCREEN_WIDTH / guidelineBaseWidth));

/* -------------------------
   Image Modal Viewer Component
   ------------------------- */
const ImageModalViewer = ({
  visible,
  images,
  initialIndex = 0,
  onClose,
}: {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, visible]);

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
          <Ionicons name="close" size={moderateScale(28)} color="#fff" />
        </TouchableOpacity>

        <View style={styles.modalImageContainer}>
          <Image
            source={{ uri: images[currentIndex] }}
            style={styles.modalImage}
            resizeMode="stretch"
          />
        </View>

        <View style={styles.modalCounter}>
          <Text style={styles.modalCounterText}>
            {currentIndex + 1} / {images.length}
          </Text>
        </View>

        <View style={styles.modalArrowContainer}>
          <TouchableOpacity
            style={[styles.modalArrow, { opacity: currentIndex === 0 ? 0.3 : 1 }]}
            onPress={handlePrev}
            disabled={currentIndex === 0}
          >
            <Ionicons name="chevron-back" size={moderateScale(32)} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalArrow, { opacity: currentIndex === images.length - 1 ? 0.3 : 1 }]}
            onPress={handleNext}
            disabled={currentIndex === images.length - 1}
          >
            <Ionicons name="chevron-forward" size={moderateScale(32)} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/* -------------------------
   Small subcomponents
   ------------------------- */
const RatingBadge = ({ rating }: { rating: number }) => (
  <View style={styles.ratingBadge}>
   <Image source={require("../assets/via-farm-img/icons/satar.png")} />
    <Text style={styles.ratingBadgeText}>{Number(rating ?? 0).toFixed(1)}</Text>
  </View>
);

const ReviewCard = ({
  r,
  onImagePress,
}: {
  r: any;
  onImagePress?: (images: string[], index: number) => void;
}) => {
  const avatar =
    r?.user?.profilePicture ?? r?.user?.avatar ?? "https://i.pravatar.cc/100";
  const name = r?.user?.name ?? "Anonymous";
  const date = r?.createdAt
    ? new Date(r.createdAt).toLocaleDateString()
    : r?.date ?? "";

  // Extract review images
  const reviewImages = Array.isArray(r?.images)
    ? r.images.filter((img: any) => img)
    : [];

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image source={{ uri: avatar }} style={styles.reviewAvatar} resizeMode="stretch" />
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewUser}>{name}</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              marginVertical: moderateScale(10),
              borderWidth: 1,
              width: scale(44),
              borderRadius: moderateScale(8),
              borderColor: "rgba(255, 202, 40, 0.5)",
            }}
          >
            <Image source={require("../assets/via-farm-img/icons/satar.png")} />
            <Text>{r?.rating ?? ""}</Text>
          </View>
        </View>
        <Text style={styles.reviewMeta}>{date}</Text>
      </View>

      <Text style={styles.reviewText}>{r?.comment ?? r?.text ?? ""}</Text>

      {/* Review Images */}
      {reviewImages.length > 0 && (
        <View style={styles.reviewImagesRow}>
          {reviewImages.map((img: string, i: number) => (
            <TouchableOpacity
              key={`${img}-${i}`}
              onPress={() => onImagePress?.(reviewImages, i)}
            >
              <Image
                source={{ uri: img }}
                style={styles.reviewImage}
                resizeMode="stretch"
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

/* -------------------------
   Main screen
   ------------------------- */
export default function VendorViewProduct() {
  const { productId } = useLocalSearchParams() as { productId?: string };
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);

  useEffect(() => {
    if (!productId) {
      Alert.alert("Error", "Product id is missing");
      router.back();
      return;
    }
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      const res = await axios.get(`${API_BASE}/api/vendor/products`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        timeout: 10000,
      });

      if (!res?.data?.success) {
        throw new Error("API returned failure");
      }

      const list = Array.isArray(res.data.data) ? res.data.data : [];
      const found = list.find((it: any) => String(it._id) === String(productId));
      if (!found) {
        Alert.alert("Error", "Product not found");
        router.back();
        return;
      }

      const normalized = {
        ...found,
        images: Array.isArray(found.images)
          ? found.images
          : found.images
          ? [found.images]
          : [],
        reviews: Array.isArray(found.reviews) ? found.reviews : [],
        nutritionalValue: found.nutritionalValue ?? {},
      };

      setProduct(normalized);
    } catch (err) {
      console.error("fetchProductDetails error:", err);
      Alert.alert("Error", "Unable to fetch product details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleGalleryImagePress = (index: number) => {
    const gallery = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [""];
    setModalImages(gallery);
    setModalInitialIndex(index);
    setModalVisible(true);
  };

  const handleReviewImagePress = (images: string[], index: number) => {
    setModalImages(images);
    setModalInitialIndex(index);
    setModalVisible(true);
  };

  if (loading || !product) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6B46C1" />
        <Text style={{ marginTop: 10 }}>Loading product...</Text>
      </View>
    );
  }

  const gallery =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [""];
  const nutrients = product.nutritionalValue?.nutrients ?? [];
  const additionalNote =
    product.nutritionalValue?.additionalNote ??
    product.nutritionalValue?.note ??
    "";

  return (
    <SafeAreaView style={styles.container}>
      <ImageModalViewer
        visible={modalVisible}
        images={modalImages}
        initialIndex={modalInitialIndex}
        onClose={() => setModalVisible(false)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroWrap}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleGalleryImagePress(0)}
          >
            <Image source={{ uri: gallery[0] }} style={styles.heroImage} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={moderateScale(20)} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{product.name ?? "Untitled Product"}</Text>
            <RatingBadge rating={product.rating ?? 0} />
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.categoryText}>
              {product.category ?? "Uncategorized"}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.priceValue}>{`₹${product.price ?? "-"}`}</Text>
          </View>

          <Text style={styles.sectionTitle}>About the product</Text>
          <Text style={styles.aboutText}>
            {product.description || "No description available"}
          </Text>

          <View style={styles.nutritionRow}>
            <View style={styles.nutritionLeft}>
              <Text style={styles.nutritionHeading}>Nutritional Value</Text>
              <Text style={styles.nutritionSub}>
                {product.weightPerPiece
                  ? `${product.weightPerPiece} per piece`
                  : ""}
              </Text>

              {Array.isArray(nutrients) && nutrients.length > 0 ? (
                <View style={styles.nutritionList}>
                  {nutrients.map((n: any, idx: number) => (
                    <Text
                      key={`${n.name ?? idx}-${idx}`}
                      style={styles.nutritionItem}
                    >
                      {n.name} : {n.amount}
                    </Text>
                  ))}
                  {additionalNote ? (
                    <Text style={{ marginTop: 6, color: "#666" }}>
                      {additionalNote}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <View style={styles.nutritionList}>
                  <Text style={styles.nutritionItem}>Calories : -</Text>
                  <Text style={styles.nutritionItem}>Carbs : -</Text>
                  <Text style={styles.nutritionItem}>Protein : -</Text>
                  <Text style={styles.nutritionItem}>Fats : -</Text>
                </View>
              )}
            </View>

            <View style={styles.nutritionRight} />
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Ratings & Reviews</Text>
          </View>

          {Array.isArray(product.reviews) && product.reviews.length > 0 ? (
            <FlatList
              data={product.reviews}
              keyExtractor={(it, idx) => `${it._id ?? it.id ?? "rev"}-${idx}`}
              renderItem={({ item }) => (
                <ReviewCard
                  r={item}
                  onImagePress={handleReviewImagePress}
                />
              )}
              ItemSeparatorComponent={() => (
                <View style={{ height: moderateScale(10) }} />
              )}
              contentContainerStyle={{ paddingTop: moderateScale(10) }}
              scrollEnabled={false}
            />
          ) : (
            <Text style={{ marginTop: 10, color: "#666" }}>
              No reviews available
            </Text>
          )}
        </View>

        <View
          style={{
            paddingHorizontal: moderateScale(16),
            paddingTop: moderateScale(14),
          }}
        >
          <Text style={styles.sectionTitle}>Gallery</Text>

          <FlatList
            horizontal
            data={gallery}
            keyExtractor={(g, i) => `${g ?? "img"}-${i}`}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleGalleryImagePress(index)}
              >
                <Image
                  source={{ uri: item }}
                  style={styles.galleryThumb}
                  resizeMode="stretch"
                />
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: moderateScale(8) }}
          />
        </View>

        <View style={{ height: moderateScale(40) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------------------------
   Styles
   ------------------------- */
const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  scrollContent: { paddingBottom: 50, backgroundColor: "#fff" },

  heroWrap: {
    width: "100%",
    height: moderateScale(300),
    backgroundColor: "#eee",
  },
  heroImage: { width: "100%", height: "100%" },
  backBtn: {
    position: "absolute",
    left: moderateScale(12),
    top: moderateScale(16),
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: moderateScale(8),
    borderRadius: moderateScale(20),
  },

  infoCard: {
    width: "94%",
    alignSelf: "center",
    marginTop: -moderateScale(40),
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(8),
    elevation: 4,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(8),
  },
  title: {
    fontSize: normalizeFont(13),
    fontWeight: "700",
    color: "#111",
    flex: 1,
  },

  ratingBadge: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0c14b",
    paddingHorizontal: moderateScale(4),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(10),
    flexDirection: "row",
    alignItems: "center",
  },
  ratingBadgeText: {
    fontWeight: "700",
    marginLeft: moderateScale(6),
    color: "#111",
    fontSize:normalizeFont(12)
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(12),
  },
  categoryText: {
    fontSize: normalizeFont(11),
    color: "#666",
    backgroundColor: "#f2f2f2",
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  priceValue: { fontWeight: "700", color: "#000", fontSize: normalizeFont(12) },

  sectionTitle: {
    fontSize: normalizeFont(11),
    fontWeight: "700",
    marginTop: moderateScale(6),
    marginBottom: moderateScale(6),
    color: "#222",
  },
  aboutText: {
    color: "#444",
    lineHeight: moderateScale(18),
    fontSize: normalizeFont(13),
    marginBottom: moderateScale(10),
  },

  nutritionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: moderateScale(6),
    marginBottom: moderateScale(12),
  },
  nutritionLeft: { flex: 1 },
  nutritionHeading: { fontWeight: "700", marginBottom: moderateScale(6) },
  nutritionSub: {
    fontSize: normalizeFont(12),
    color: "#666",
    marginBottom: moderateScale(8),
  },
  nutritionList: {
    backgroundColor: "#fafafa",
    padding: moderateScale(8),
    borderRadius: moderateScale(8),
  },
  nutritionItem: {
    color: "#333",
    marginBottom: moderateScale(6),
    fontSize: normalizeFont(12),
  },
  nutritionRight: { width: moderateScale(96) },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: moderateScale(8),
  },

  reviewCard: {
    backgroundColor: "rgba(255, 253, 246, 1)",
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    marginTop: moderateScale(10),
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(8),
    gap: 15,
  },
  reviewAvatar: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(50),
  },
  reviewUser: {
    fontWeight: "600",
    marginBottom: moderateScale(2),
    fontSize: normalizeFont(12),
  },
  reviewMeta: { color: "#777", fontSize: normalizeFont(11) },
  reviewText: {
    color: "#444",
    fontSize: normalizeFont(11),
    marginBottom: moderateScale(8),
  },
  reviewImagesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(8),
  },
  reviewImage: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(6),
    backgroundColor: "#eee",
  },

  galleryThumb: {
    width: moderateScale(130),
    height: moderateScale(130),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(10),
    backgroundColor: "#eee",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImageContainer: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.7,
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalCloseBtn: {
    position: "absolute",
    top: moderateScale(16),
    right: moderateScale(16),
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: moderateScale(24),
    padding: moderateScale(8),
  },
  modalCounter: {
    position: "absolute",
    bottom: moderateScale(80),
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
  },
  modalCounterText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: normalizeFont(14),
  },
  modalArrowContainer: {
    position: "absolute",
    bottom: moderateScale(16),
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(16),
  },
  modalArrow: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: moderateScale(24),
    padding: moderateScale(8),
  },
});