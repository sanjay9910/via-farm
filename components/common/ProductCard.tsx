import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
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
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;
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
  onQuantityChange, 
  cartQuantity = 0, 
  width = moderateScale(140),
  showRating = true,
  showFavorite = true,
  showAddToCart = true,
  cardStyle = {},
  imageHeight = moderateScale(120),
}) => {
  const [localQty, setLocalQty] = useState(Number(cartQuantity || 0));
  const [isProcessing, setIsProcessing] = useState(false);
  const prevQtyRef = useRef(localQty);
  useEffect(() => {
    if (!isProcessing) {
      const parsed = Number(cartQuantity || 0);
      setLocalQty(parsed);
      prevQtyRef.current = parsed;
    }
  }, [cartQuantity, isProcessing]);

  const runOptimistic = async ({ apply, rollback, callback }) => {
    if (isProcessing) return false;
    setIsProcessing(true);
    const prev = prevQtyRef.current;

    try {
      apply();
      const res = callback && callback();
      if (res && typeof res.then === "function") {
        await res;
      }
      prevQtyRef.current = localQty; 
      setIsProcessing(false);
      return true;
    } catch (err) {
      rollback(prev);
      prevQtyRef.current = prev;
      setIsProcessing(false);
      return false;
    }
  };

  const handleAdd = async () => {
    if (!showAddToCart) return;
    await runOptimistic({
      apply: () => {
        setLocalQty(1);
      },
      rollback: (prevVal) => {
        setLocalQty(prevVal);
      },
      callback: () => (onAddToCart ? onAddToCart() : Promise.resolve()),
    });
  };

  const handleIncrement = async () => {
    const prev = Number(localQty || 0);
    const newVal = prev + 1;
    await runOptimistic({
      apply: () => setLocalQty(newVal),
      rollback: (prevVal) => setLocalQty(prevVal),
      callback: () => (onQuantityChange ? onQuantityChange(1) : Promise.resolve()),
    });
  };

  const handleDecrement = async () => {
    const prev = Number(localQty || 0);
    const newVal = Math.max(0, prev - 1);
    await runOptimistic({
      apply: () => setLocalQty(newVal),
      rollback: (prevVal) => setLocalQty(prevVal),
      callback: () => (onQuantityChange ? onQuantityChange(-1) : Promise.resolve()),
    });
  };

  const qty = Number(localQty || 0);
  const CONTROL_WIDTH = Math.round(Math.min(Math.max(width * 0.88, moderateScale(80)), moderateScale(220)));
  const CONTROL_HEIGHT = Math.round(Math.min(Math.max(verticalScale(36), moderateScale(34)), verticalScale(52)));
  const SIDE_BTN_H_PADDING = moderateScale(10);

  return (
    <View style={[{ width }, cardStyle]}>
      <TouchableOpacity
        style={[styles.card, { width }]}
        activeOpacity={0.9}
        onPress={() => onPress?.(id)}
      >
        {/* Product Image */}
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          <Image source={{ uri: image }} style={styles.productImage} resizeMode="cover" />

          {showFavorite && (
            <TouchableOpacity
              style={[
                styles.favoriteButton,
                {
                  width: moderateScale(24),
                  height: moderateScale(24),
                  borderRadius: moderateScale(17),
                },
              ]}
              onPress={() => onFavoritePress?.(id)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={moderateScale(20)}
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
              <Text style={[styles.ratingText, { fontSize: normalizeFont(10) }]}>{rating ?? 0}</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={[styles.cardContent, { padding: moderateScale(8) }]}>
          <Text
            style={[
              styles.productTitle,
              { fontSize: normalizeFont(11) },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.productSubtitle,
              { fontSize: normalizeFont(10) },
            ]}
            numberOfLines={1}
          >
            By {subtitle}
          </Text>
          <Text style={[styles.productPrice, { fontSize: normalizeFont(10) }]}>{`₹${price}`}</Text>

          {/* Add to Cart / Quantity (controlled) */}
          <View style={styles.buttonContainer}>
            {qty <= 0 ? (
              <TouchableOpacity
                style={[
                  styles.addToCartButton,
                  {
                    width: CONTROL_WIDTH,
                    height: CONTROL_HEIGHT,
                    paddingHorizontal: moderateScale(10),
                    borderRadius: moderateScale(6),
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: isProcessing ? 0.9 : 1,
                  },
                ]}
                onPress={handleAdd}
                activeOpacity={0.7}
                disabled={isProcessing}
              >
                <Text style={[styles.addToCartText, { fontSize: normalizeFont(11) }]}>
                  Add to Cart
                </Text>
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.quantityBox,
                  {
                    width: CONTROL_WIDTH,
                    height: CONTROL_HEIGHT,
                    borderRadius: moderateScale(8),
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: isProcessing ? 0.95 : 1,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={handleDecrement}
                  style={[
                    styles.sideBtn,
                    {
                      paddingHorizontal: SIDE_BTN_H_PADDING,
                      height: CONTROL_HEIGHT,
                      justifyContent: "center",
                      alignItems: "center",
                      borderRightWidth: 1,
                    },
                  ]}
                  disabled={isProcessing}
                >
                  <Text style={[styles.qtyBtnText, { fontSize: normalizeFont(16) }]}>−</Text>
                </TouchableOpacity>

                <Text style={[styles.qtyText, { fontSize: normalizeFont(14) }]}>{String(qty).padStart(2, "0")}</Text>

                <TouchableOpacity
                  onPress={handleIncrement}
                  style={[
                    styles.sideBtn,
                    {
                      paddingHorizontal: SIDE_BTN_H_PADDING,
                      height: CONTROL_HEIGHT,
                      justifyContent: "center",
                      alignItems: "center",
                      borderLeftWidth: 1,
                    },
                  ]}
                  disabled={isProcessing}
                >
                  <Text style={[styles.qtyBtnText, { fontSize: normalizeFont(16) }]}>+</Text>
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
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "grey",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "grey",
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
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
    right: moderateScale(6),
    top: moderateScale(6),
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "rgba(0,0,0,0.35)",
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
    marginLeft: moderateScale(6),
    fontWeight: "500",
  },
  cardContent: {},
  productTitle: {
    fontWeight: "600",
    color: "#333",
    marginBottom: moderateScale(4),
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
    alignItems: "center",
  },
  addToCartButton: {
    backgroundColor: "rgba(76, 175, 80, 1)",
  },
  addToCartText: {
    color: "#fff",
    fontWeight: "600",
  },
  quantityBox: {
    borderWidth: 1.2,
    borderColor: "rgba(76, 175, 80, 1)",
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  sideBtn: {
    borderColor: "rgba(76, 175, 80, 1)",
  },
  qtyBtnText: {
    color: "rgba(76, 175, 80, 1)",
    fontWeight: "700",
  },
  qtyText: {
    color: "rgba(76, 175, 80, 1)",
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: moderateScale(6),
  },
});

export default ProductCard;
