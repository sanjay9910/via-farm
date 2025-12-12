// VendorViewProduct.jsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  PanResponder,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE = "https://viafarm-1.onrender.com";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/* small responsive helpers */
const guidelineBaseWidth = 375;
const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

/**
 * Responsive font normalizer:
 * - scales with screen width (same base as scale/moderateScale)
 * - accounts for device font scale (PixelRatio.getFontScale())
 * - rounds to nearest pixel and clamps to reasonable min/max values
 */
const normalizeFont = (size) => {
  const scaleFactor = SCREEN_WIDTH / guidelineBaseWidth;
  const newSize = size * scaleFactor;
  const fontScale = PixelRatio.getFontScale() || 1;
  const rounded = Math.round(PixelRatio.roundToNearestPixel(newSize));
  // Respect user's font accessibility setting (but avoid extremes)
  const adjusted = Math.round(rounded / fontScale);
  // Clamp to keep layout stable on very large/small devices
  return Math.min(Math.max(adjusted, 10), 36);
};

/* -------------------------
   Zoomable Image Modal Viewer Component
   ------------------------- */
const ImageModalViewer = ({
  visible,
  images,
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    resetZoom();
  }, [initialIndex, visible]);

  const resetZoom = () => {
    scaleValue.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
    lastScale.current = 1;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        scaleValue.setOffset(lastScale.current - 1);
        translateX.setOffset(lastTranslateX.current);
        translateY.setOffset(lastTranslateY.current);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length === 2) {
          // Pinch to zoom
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) +
              Math.pow(touch2.pageY - touch1.pageY, 2)
          );

          if (!panResponder.current.initialDistance) {
            panResponder.current.initialDistance = distance;
          } else {
            const scaleNow = distance / panResponder.current.initialDistance;
            scaleValue.setValue(Math.max(1, Math.min(scaleNow, 4)));
          }
        } else if (lastScale.current > 1) {
          // Pan when zoomed
          translateX.setValue(gestureState.dx);
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        scaleValue.flattenOffset();
        translateX.flattenOffset();
        translateY.flattenOffset();

        scaleValue.addListener(({ value }) => {
          lastScale.current = value;
        });
        translateX.addListener(({ value }) => {
          lastTranslateX.current = value;
        });
        translateY.addListener(({ value }) => {
          lastTranslateY.current = value;
        });

        panResponder.current.initialDistance = null;

        // Double tap to zoom
        if (
          evt.nativeEvent.touches.length === 0 &&
          gestureState.dx === 0 &&
          gestureState.dy === 0
        ) {
          const now = Date.now();
          const DOUBLE_TAP_DELAY = 300;

          if (
            panResponder.current.lastTap &&
            now - panResponder.current.lastTap < DOUBLE_TAP_DELAY
          ) {
            if (lastScale.current > 1) {
              Animated.parallel([
                Animated.timing(scaleValue, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(translateX, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }),
              ]).start(() => {
                lastScale.current = 1;
                lastTranslateX.current = 0;
                lastTranslateY.current = 0;
              });
            } else {
              Animated.timing(scaleValue, {
                toValue: 2,
                duration: 200,
                useNativeDriver: true,
              }).start(() => {
                lastScale.current = 2;
              });
            }
            panResponder.current.lastTap = null;
          } else {
            panResponder.current.lastTap = now;
          }
        }
      },
    })
  ).current;

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetZoom();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetZoom();
    }
  };

  const handleBackgroundPress = () => {
    if (lastScale.current <= 1) {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleBackgroundPress}
      >
        <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
          <Ionicons name="close" size={moderateScale(28)} color="#fff" />
        </TouchableOpacity>

        <View style={styles.modalImageContainer} {...panResponder.panHandlers}>
          <TouchableOpacity activeOpacity={1}>
            <Animated.View
              style={{
                transform: [
                  { scale: scaleValue },
                  { translateX: translateX },
                  { translateY: translateY },
                ],
              }}
            >
              <Image
                source={{ uri: images[currentIndex] }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View style={styles.modalCounter}>
          <Text style={styles.modalCounterText} allowFontScaling={false}>
            {currentIndex + 1} / {images.length}
          </Text>
        </View>

        {images.length > 1 && (
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
        )}
      </TouchableOpacity>
    </Modal>
  );
};

/* -------------------------
   Small subcomponents
   ------------------------- */
const RatingBadge = ({ rating }) => (
  <View style={styles.ratingBadge}>
    <Image source={require("../assets/via-farm-img/icons/satar.png")} />
    <Text style={styles.ratingBadgeText} allowFontScaling={false}>
      {Number(rating ?? 0).toFixed(1)}
    </Text>
  </View>
);

const ReviewCard = ({
  r,
  onImagePress,
}) => {
  const avatar =
    r?.user?.profilePicture ?? r?.user?.avatar ?? "https://i.pravatar.cc/100";
  const name = r?.user?.name ?? "Anonymous";
  const date = r?.createdAt ? new Date(r.createdAt).toLocaleDateString() : r?.date ?? "";

  const reviewImages = Array.isArray(r?.images) ? r.images.filter((img) => img) : [];

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image source={{ uri: avatar }} style={styles.reviewAvatar} resizeMode="stretch" />
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewUser} allowFontScaling={false}>
            {name}
          </Text>
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
            <Text allowFontScaling={false}>{r?.rating ?? ""}</Text>
          </View>
        </View>
        <Text style={styles.reviewMeta} allowFontScaling={false}>
          {date}
        </Text>
      </View>

      <Text style={styles.reviewText} allowFontScaling={false}>
        {r?.comment ?? r?.text ?? ""}
      </Text>

      {reviewImages.length > 0 && (
        <View style={styles.reviewImagesRow}>
          {reviewImages.map((img, i) => (
            <TouchableOpacity key={`${img}-${i}`} onPress={() => onImagePress?.(reviewImages, i)}>
              <Image source={{ uri: img }} style={styles.reviewImage} resizeMode="stretch" />
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
  const { productId } = useLocalSearchParams() || {};
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImages, setModalImages] = useState([]);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);

  useEffect(() => {
    if (!productId) {
      Alert.alert("Error", "Product id is missing");
      router.back();
      return;
    }
    fetchProductDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const found = list.find((it) => String(it._id) === String(productId));
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

  const handleGalleryImagePress = (index) => {
    const gallery = Array.isArray(product.images) && product.images.length > 0 ? product.images : [""];
    setModalImages(gallery);
    setModalInitialIndex(index);
    setModalVisible(true);
  };

  const handleReviewImagePress = (images, index) => {
    setModalImages(images);
    setModalInitialIndex(index);
    setModalVisible(true);
  };

  if (loading || !product) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6B46C1" />
        <Text style={{ marginTop: 10 }} allowFontScaling={false}>Loading product...</Text>
      </View>
    );
  }

  const gallery = Array.isArray(product.images) && product.images.length > 0 ? product.images : [""];
  const nutrients = product.nutritionalValue?.nutrients ?? [];
  const additionalNote = product.nutritionalValue?.additionalNote ?? product.nutritionalValue?.note ?? "";

  return (
    <SafeAreaView style={styles.container}>
      <ImageModalViewer visible={modalVisible} images={modalImages} initialIndex={modalInitialIndex} onClose={() => setModalVisible(false)} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroWrap}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => handleGalleryImagePress(0)}>
            <Image source={{ uri: gallery[0] }} style={styles.heroImage} resizeMode="stretch" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={moderateScale(20)} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.titleRow}>
            <Text style={styles.title} allowFontScaling={false}>
              {product.name ?? "Untitled Product"}
            </Text>
            <RatingBadge rating={product.rating ?? 0} />
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.categoryText} allowFontScaling={false}>
              {product.category ?? "Uncategorized"}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.priceValue} allowFontScaling={false}>
              {`₹${product.price ?? "-"}`}
            </Text>
          </View>

          <Text style={styles.sectionTitle} allowFontScaling={false}>About the product</Text>
          <Text style={styles.aboutText} allowFontScaling={false}>
            {product.description || "No description available"}
          </Text>

          <View style={styles.nutritionRow}>
            <View style={styles.nutritionLeft}>
              <Text style={styles.nutritionHeading} allowFontScaling={false}>Nutritional Value</Text>
              <Text style={styles.nutritionSub} allowFontScaling={false}>
                {product.weightPerPiece ? `${product.weightPerPiece} per piece` : ""}
              </Text>

              {Array.isArray(nutrients) && nutrients.length > 0 ? (
                <View style={styles.nutritionList}>
                  {nutrients.map((n, idx) => (
                    <Text key={`${n.name ?? idx}-${idx}`} style={styles.nutritionItem} allowFontScaling={false}>
                      {n.name} : {n.amount}
                    </Text>
                  ))}
                  {additionalNote ? <Text style={{ marginTop: 6, color: "#666" }} allowFontScaling={false}>{additionalNote}</Text> : null}
                </View>
              ) : (
                <View style={styles.nutritionList}>
                  <Text style={styles.nutritionItem} allowFontScaling={false}>Calories : -</Text>
                  <Text style={styles.nutritionItem} allowFontScaling={false}>Carbs : -</Text>
                  <Text style={styles.nutritionItem} allowFontScaling={false}>Protein : -</Text>
                  <Text style={styles.nutritionItem} allowFontScaling={false}>Fats : -</Text>
                </View>
              )}
            </View>

            <View style={styles.nutritionRight} />
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle} allowFontScaling={false}>Ratings & Reviews</Text>
          </View>

          {Array.isArray(product.reviews) && product.reviews.length > 0 ? (
            <FlatList
              data={product.reviews}
              keyExtractor={(it, idx) => `${it._id ?? it.id ?? "rev"}-${idx}`}
              renderItem={({ item }) => <ReviewCard r={item} onImagePress={handleReviewImagePress} />}
              ItemSeparatorComponent={() => <View style={{ height: moderateScale(10) }} />}
              contentContainerStyle={{ paddingTop: moderateScale(10) }}
              scrollEnabled={false}
            />
          ) : (
            <Text style={{ marginTop: 10, color: "#666" }} allowFontScaling={false}>No reviews available</Text>
          )}
        </View>

        <View style={{ paddingHorizontal: moderateScale(16), paddingTop: moderateScale(14) }}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Gallery</Text>

          <FlatList
            horizontal
            data={gallery}
            keyExtractor={(g, i) => `${g ?? "img"}-${i}`}
            renderItem={({ item, index }) => (
              <TouchableOpacity activeOpacity={0.8} onPress={() => handleGalleryImagePress(index)}>
                <Image source={{ uri: item }} style={styles.galleryThumb} resizeMode="stretch" />
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
    width: "100%",
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
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
    fontSize: normalizeFont(12),
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
    fontSize: normalizeFont(10),
    marginBottom: moderateScale(10),
  },

  nutritionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: moderateScale(6),
    marginBottom: moderateScale(12),
  },
  nutritionLeft: { flex: 1 },
  nutritionHeading: { fontWeight: "700", marginBottom: moderateScale(6), fontSize: normalizeFont(11) },
  nutritionSub: {
    fontSize: normalizeFont(11),
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
    fontSize: normalizeFont(11),
  },
  nutritionRight: { width: scale(96) },

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
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  modalCloseBtn: {
    position: "absolute",
    top: moderateScale(40),
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
