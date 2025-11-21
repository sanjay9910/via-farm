// VendorViewProduct.tsx
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
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE = "https://viafarm-1.onrender.com";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* small responsive helpers (safe, no external dependency) */
const guidelineBaseWidth = 375;
const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;
const normalizeFont = (size: number) =>
  Math.round(moderateScale(size) * (SCREEN_WIDTH / guidelineBaseWidth));

/* -------------------------
   Small subcomponents
   ------------------------- */
const RatingBadge = ({ rating }: { rating: number }) => (
  <View style={styles.ratingBadge}>
    <Ionicons name="star" size={moderateScale(12)} color="#FFC107" />
    <Text style={styles.ratingBadgeText}>{Number(rating ?? 0).toFixed(1)}</Text>
  </View>
);

const ReviewCard = ({ r }: { r: any }) => {
  const avatar =
    r?.user?.profilePicture ?? r?.user?.avatar ?? "https://i.pravatar.cc/100";
  const name = r?.user?.name ?? "Anonymous";
  const date = r?.createdAt ? new Date(r.createdAt).toLocaleDateString() : r?.date ?? "";
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image source={{ uri: avatar }} style={styles.reviewAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewUser}>{name}</Text>
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5,marginVertical:10,borderWidth:1,width:scale(50),borderRadius:8,borderColor:'rgba(255, 202, 40, 0.5)'}}>
            <Image source={require("../assets/via-farm-img/icons/satar.png")} />
            <Text>{r?.rating ?? ""}</Text>
          </View>
          <Text style={styles.reviewMeta}>
            {date}
          </Text>
        </View>
      </View>

      <Text style={styles.reviewText}>{r?.comment ?? r?.text ?? ""}</Text>

      {Array.isArray(r?.images) && r.images.length > 0 && (
        <View style={styles.reviewImagesRow}>
          {r.images.map((img: string, i: number) => (
            <Image key={`${img}-${i}`} source={{ uri: img }} style={styles.reviewImage} />
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
  // gets ?productId=xxx from route: expo-router / useLocalSearchParams
  const { productId } = useLocalSearchParams() as { productId?: string };
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);

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

      // The API you provided returns an array under /api/vendor/products
      // so we fetch the list and find the matching id safely.
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

      // Normalize product to avoid undefined crashes in UI
      const normalized = {
        ...found,
        images: Array.isArray(found.images) ? found.images : found.images ? [found.images] : [],
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

  if (loading || !product) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6B46C1" />
        <Text style={{ marginTop: 10 }}>Loading product...</Text>
      </View>
    );
  }

  const gallery = Array.isArray(product.images) && product.images.length > 0 ? product.images : [""];
  const nutrients = product.nutritionalValue?.nutrients ?? [];
  const additionalNote = product.nutritionalValue?.additionalNote ?? product.nutritionalValue?.note ?? "";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroWrap}>
          <Image source={{ uri: gallery[0] }} style={styles.heroImage} />
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
            <Text style={styles.categoryText}>{product.category ?? "Uncategorized"}</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.priceValue}>{`₹${product.price ?? "-"}`}</Text>
          </View>

          <Text style={styles.sectionTitle}>About the product</Text>
          <Text style={styles.aboutText}>{product.description || "No description available"}</Text>

          <View style={styles.nutritionRow}>
            <View style={styles.nutritionLeft}>
              <Text style={styles.nutritionHeading}>Nutritional Value</Text>
              <Text style={styles.nutritionSub}>
                {product.weightPerPiece ? `${product.weightPerPiece} per piece` : ""}
              </Text>

              {Array.isArray(nutrients) && nutrients.length > 0 ? (
                <View style={styles.nutritionList}>
                  {nutrients.map((n: any, idx: number) => (
                    <Text key={`${n.name ?? idx}-${idx}`} style={styles.nutritionItem}>
                      {n.name} : {n.amount}
                    </Text>
                  ))}
                  {additionalNote ? <Text style={{ marginTop: 6, color: "#666" }}>{additionalNote}</Text> : null}
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

            <View style={styles.nutritionRight}>
              {/* Optional price card or graphic */}
              <View style={styles.priceCard}>
                <Text style={styles.priceCardLabel}>Price</Text>
                <Text style={styles.priceCardAmount}>₹{product.price ?? "-"}</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Ratings & Reviews</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All &gt;</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            horizontal
            data={product.reviews ?? []}
            keyExtractor={(it, idx) => `${it._id ?? it.id ?? "rev"}-${idx}`}
            renderItem={({ item }) => (
              <View style={styles.reviewThumbWrap}>
                <Image
                  source={{ uri: item.images?.[0] ?? item.user?.profilePicture ?? item.user?.avatar ?? "https://i.pravatar.cc/100" }}
                  style={styles.reviewThumb}
                />
              </View>
            )}
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: moderateScale(8) }}
            contentContainerStyle={{ paddingBottom: moderateScale(6) }}
            ListEmptyComponent={<Text style={{ color: "#666" }}>No review images</Text>}
          />

          {Array.isArray(product.reviews) && product.reviews.length > 0 ? (
            <FlatList
              data={product.reviews}
              keyExtractor={(it, idx) => `${it._id ?? it.id ?? "rev"}-${idx}`}
              renderItem={({ item }) => <ReviewCard r={item} />}
              ItemSeparatorComponent={() => <View style={{ height: moderateScale(10) }} />}
              contentContainerStyle={{ paddingTop: moderateScale(10) }}
              scrollEnabled={false}
            />
          ) : (
            <Text style={{ marginTop: 10, color: "#666" }}>No reviews available</Text>
          )}
        </View>

        <View style={{ paddingHorizontal: moderateScale(16), paddingTop: moderateScale(14) }}>
          <Text style={styles.sectionTitle}>Gallery</Text>

          <FlatList
            horizontal
            data={gallery}
            keyExtractor={(g, i) => `${g ?? "img"}-${i}`}
            renderItem={({ item }) => <Image source={{ uri: item }} style={styles.galleryThumb} />}
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

  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: moderateScale(8) },
  title: { fontSize: normalizeFont(18), fontWeight: "700", color: "#111", flex: 1 },

  ratingBadge: {
    backgroundColor: "#fff",
    borderWidth: 1,
    gap: 5,
    borderColor: "#f0c14b",
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(16),
    flexDirection: "row",
    alignItems: "center",
  },
  ratingBadgeText: { fontWeight: "700", marginLeft: moderateScale(6), color: "#111" },

  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: moderateScale(12) },
  categoryText: {
    fontSize: normalizeFont(12),
    color: "#666",
    backgroundColor: "#f2f2f2",
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  priceValue: { fontWeight: "700", color: "#000", fontSize: normalizeFont(16) },

  sectionTitle: { fontSize: normalizeFont(14), fontWeight: "700", marginTop: moderateScale(6), marginBottom: moderateScale(6), color: "#222" },
  aboutText: { color: "#444", lineHeight: moderateScale(18), fontSize: normalizeFont(13), marginBottom: moderateScale(10) },

  nutritionRow: { flexDirection: "row", alignItems: "flex-start", marginTop: moderateScale(6), marginBottom: moderateScale(12) },
  nutritionLeft: { flex: 1 },
  nutritionHeading: { fontWeight: "700", marginBottom: moderateScale(6) },
  nutritionSub: { fontSize: normalizeFont(12), color: "#666", marginBottom: moderateScale(8) },
  nutritionList: { backgroundColor: "#fafafa", padding: moderateScale(8), borderRadius: moderateScale(8) },
  nutritionItem: { color: "#333", marginBottom: moderateScale(6), fontSize: normalizeFont(12) },
  nutritionRight: { width: moderateScale(96), alignItems: "center", justifyContent: "center" },
  priceCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee", padding: moderateScale(8), borderRadius: moderateScale(10), alignItems: "center" },
  priceCardLabel: { color: "#666", fontSize: normalizeFont(12) },
  priceCardAmount: { fontWeight: "800", fontSize: normalizeFont(16), marginTop: moderateScale(6) },

  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: moderateScale(8) },
  seeAll: { color: "#0284c7", fontWeight: "700", fontSize: normalizeFont(12) },

  reviewThumbWrap: { marginRight: moderateScale(8), borderRadius: moderateScale(8), overflow: "hidden", width: moderateScale(72), height: moderateScale(72), backgroundColor: "#eee" },
  reviewThumb: { width: "100%", height: "100%" },

  reviewCard: { backgroundColor: "#fff", borderRadius: moderateScale(10), padding: moderateScale(10), marginTop: moderateScale(10), borderWidth: 1, borderColor: "#f0f0f0" },
  reviewHeader: { flexDirection: "row", alignItems: "center", marginBottom: moderateScale(8),gap:15 },
  reviewAvatar: { width: moderateScale(40), height: moderateScale(40), borderRadius: moderateScale(20) },
  reviewUser: { fontWeight: "700", marginBottom: moderateScale(2) },
  reviewMeta: { color: "#777", fontSize: normalizeFont(12) },
  reviewText: { color: "#444", fontSize: normalizeFont(13), marginBottom: moderateScale(8) },
  reviewImagesRow: { flexDirection: "row" },
  reviewImage: { width: moderateScale(80), height: moderateScale(60), borderRadius: moderateScale(6), marginRight: moderateScale(8) },

  galleryThumb: { width: moderateScale(120), height: moderateScale(80), borderRadius: moderateScale(8), marginRight: moderateScale(10), backgroundColor: "#eee" },
});
