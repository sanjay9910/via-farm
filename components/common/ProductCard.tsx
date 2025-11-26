import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  PixelRatio,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;
const normalizeFont = (size) => {
  const newSize = moderateScale(size);
  if (Platform.OS === "ios") {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
};

const ProductCard = ({
  id,
  title,
  subtitle,
  price,
  rating,
  image,
  isFavorite = false,
  onPress,
  onFavoritePress,
  onAddToCart,
  width = moderateScale(140),
  showRating = true,
  showFavorite = true,
  showAddToCart = true,
  cardStyle = {},
  imageHeight = moderateScale(120),
}) => {
  const [quantity, setQuantity] = useState(0);

  const handleAddToCart = () => {
    setQuantity(1);
    onAddToCart?.(id);
  };

  const increment = () => setQuantity((q) => q + 1);
  const decrement = () => setQuantity((q) => (q > 1 ? q - 1 : 0));

  return (
    <View style={[{ width }, cardStyle]}>
      <TouchableOpacity
        style={[styles.card, { width }]}
        activeOpacity={0.8}
        onPress={() => onPress?.(id)}
      >
        {/* Product Image */}
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          <Image source={{ uri: image }} style={styles.productImage} />

          {showFavorite && (
            <TouchableOpacity
              style={[
                styles.favoriteButton,
                {
                  width: moderateScale(34),
                  height: moderateScale(34),
                  borderRadius: moderateScale(17),
                },
              ]}
              onPress={() => onFavoritePress?.(id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={moderateScale(25)}
                color={isFavorite ? "#ff4757" : "#fff"}
              />
            </TouchableOpacity>
          )}

          {showRating && (
            <View
              style={[
                styles.ratingContainer,
                {
                  paddingHorizontal: moderateScale(6),
                  paddingVertical: moderateScale(2),
                  borderRadius: moderateScale(12),
                },
              ]}
            >
              <Ionicons name="star" size={moderateScale(12)} color="#FFD700" />
              <Text style={[styles.ratingText, { fontSize: normalizeFont(11) }]}>
                {rating}
              </Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={[styles.cardContent, { padding: moderateScale(8) }]}>
          <Text
            style={[
              styles.productTitle,
              { fontSize: normalizeFont(11), height: verticalScale(15) },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.productSubtitle,
              { fontSize: normalizeFont(11), height: verticalScale(15) },
            ]}
            numberOfLines={1}
          >
            by {subtitle}
          </Text>
          <Text
            style={[styles.productPrice, { fontSize: normalizeFont(11) }]}
          >{`₹${price}`}</Text>


          {/* Add to Cart / Quantity */}
          <View style={[styles.buttonContainer, { minHeight: verticalScale(36) }]}>
            {quantity === 0 ? (
              <TouchableOpacity
                style={[
                  styles.addToCartButton,
                  {
                    paddingVertical: verticalScale(6),
                    paddingHorizontal: moderateScale(10),
                    borderRadius: moderateScale(6),
                  },
                ]}
                onPress={handleAddToCart}
                activeOpacity={0.7}
              >
                <Text style={[styles.addToCartText, { fontSize: normalizeFont(12) }]}>
                  Add to Cart
                </Text>
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.quantityBox,
                  {
                    borderRadius: moderateScale(8),
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={decrement}
                  style={[styles.sideBtn, { borderRightWidth: 1 }]}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>
                  {quantity.toString().padStart(2, "0")}
                </Text>
                <TouchableOpacity
                  onPress={increment}
                  style={[styles.sideBtn, { borderLeftWidth: 1 }]}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(8),
    marginLeft: moderateScale(5),
    marginTop: moderateScale(10),
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(4),
    borderWidth: moderateScale(1),
    borderColor: "rgba(108, 59, 28, 1)",
    marginBottom: moderateScale(5),
    // elevation: 3,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    borderTopLeftRadius: moderateScale(8),
    borderTopRightRadius: moderateScale(8),
    overflow: "hidden",
    width: "100%",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  favoriteButton: {
    position: "absolute",
    // top: moderateScale(2),
    right: moderateScale(2),
    justifyContent: "center",
    alignItems: "center",
  },
  ratingContainer: {
    position: "absolute",
    bottom: moderateScale(8),
    left: moderateScale(8),
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    color: "#fff",
    marginLeft: moderateScale(4),
    fontWeight: "500",
  },
  cardContent: {},
  productTitle: {
    fontWeight: "600",
    color: "#333",
    marginBottom: moderateScale(2),
  },
  productSubtitle: {
    color: "#888",
    marginBottom: moderateScale(6),
  },
  productPrice: {
    fontWeight: "700",
    color: "#000",
    marginBottom: moderateScale(8),
  },
  buttonContainer: {
    justifyContent: "center",
  },
  addToCartButton: {
    backgroundColor: "rgba(76, 175, 80, 1)",
    flexDirection: "row",
    alignItems: "center",
    height:scale(35),
    justifyContent: "center",
  },
  addToCartText: {
    color: "#fff",
    fontWeight: "600",
  },

  /** ✅ New Quantity Box (Same Design as Image) **/
  quantityBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "rgba(76, 175, 80, 1)",
    borderRadius: 8,
    overflow: "hidden",
  },
  sideBtn: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(7),
    borderColor: "rgba(76, 175, 80, 1)",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnText: {
    color: "rgba(76, 175, 80, 1)",
    fontWeight: "700",
    fontSize: normalizeFont(18),
  },
  qtyText: {
    color: "rgba(76, 175, 80, 1)",
    fontWeight: "700",
    fontSize: normalizeFont(15),
    textAlign: "center",
    paddingHorizontal: moderateScale(6),
  },
});

export default ProductCard;
