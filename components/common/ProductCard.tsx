import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

/**
 * ProductCard (optimistic local updates, no alerts)
 *
 * Props:
 *  - id, title, subtitle, price, rating, image
 *  - isFavorite (bool)
 *  - onPress(id)
 *  - onFavoritePress(id)
 *  - onAddToCart() -> may return Promise
 *  - onQuantityChange(delta) -> may return Promise
 *  - cartQuantity (number) authoritative from parent
 *  - width, showRating, showFavorite, etc.
 *
 * Behavior:
 *  - Updates local UI instantly when add/+/- pressed.
 *  - Calls provided callbacks and awaits them if they return a Promise.
 *  - If callback rejects/throws, local UI rolls back quietly.
 *  - Shows small ActivityIndicator inside relevant control while processing.
 */
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
  onAddToCart,           // () => maybe Promise
  onQuantityChange,      // (delta) => maybe Promise
  cartQuantity = 0,      // authoritative number from parent
  width = moderateScale(140),
  showRating = true,
  showFavorite = true,
  showAddToCart = true,
  cardStyle = {},
  imageHeight = moderateScale(120),
}) => {
  // local optimistic quantity (keeps UI snappy)
  const [localQty, setLocalQty] = useState(Number(cartQuantity || 0));
  // processing flag prevents multi-clicks
  const [isProcessing, setIsProcessing] = useState(false);
  // keep previous qty for rollback on failure
  const prevQtyRef = useRef(localQty);

  // sync authoritative parent changes into localQty (but don't overwrite while processing)
  useEffect(() => {
    if (!isProcessing) {
      const parsed = Number(cartQuantity || 0);
      setLocalQty(parsed);
      prevQtyRef.current = parsed;
    }
  }, [cartQuantity, isProcessing]);

  // helper to run async callback with optimistic update + rollback
  const runOptimistic = async ({ apply, rollback, callback }) => {
    // if already processing, ignore
    if (isProcessing) return false;
    setIsProcessing(true);
    const prev = prevQtyRef.current;

    try {
      // apply optimistic UI change immediately
      apply();
      // call the callback (may return Promise)
      const res = callback && callback();
      if (res && typeof res.then === "function") {
        await res;
      }
      // success: commit (parent likely will also update cartQuantity)
      prevQtyRef.current = localQty; // update previous snapshot
      setIsProcessing(false);
      return true;
    } catch (err) {
      // rollback silently
      rollback(prev);
      prevQtyRef.current = prev;
      setIsProcessing(false);
      return false;
    }
  };

  const handleAdd = async () => {
    if (!showAddToCart) return;
    const prev = Number(localQty || 0);
    await runOptimistic({
      apply: () => {
        setLocalQty(1);
      },
      rollback: (prevVal) => {
        setLocalQty(prevVal);
      },
      callback: () => onAddToCart ? onAddToCart() : Promise.resolve(),
    });
  };

  const handleIncrement = async () => {
    const prev = Number(localQty || 0);
    const newVal = prev + 1;
    await runOptimistic({
      apply: () => setLocalQty(newVal),
      rollback: (prevVal) => setLocalQty(prevVal),
      callback: () => onQuantityChange ? onQuantityChange(1) : Promise.resolve(),
    });
  };

  const handleDecrement = async () => {
    const prev = Number(localQty || 0);
    const newVal = Math.max(0, prev - 1);
    await runOptimistic({
      apply: () => setLocalQty(newVal),
      rollback: (prevVal) => setLocalQty(prevVal),
      callback: () => onQuantityChange ? onQuantityChange(-1) : Promise.resolve(),
    });
  };

  const qty = Number(localQty || 0);

  return (
    <View style={[{ width }, cardStyle]}>
      <TouchableOpacity
        style={[styles.card, { width }]}
        activeOpacity={0.8}
        onPress={() => onPress?.(id)}
      >
        {/* Product Image */}
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          <Image source={{ uri: image }} style={styles.productImage} resizeMode="stretch" />

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
                size={moderateScale(22)}
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
              <Text style={[styles.ratingText, { fontSize: normalizeFont(11) }]}>{rating ?? 0}</Text>
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
            By {subtitle}
          </Text>
          <Text style={[styles.productPrice, { fontSize: normalizeFont(11) }]}>{`₹${price}`}</Text>

          {/* Add to Cart / Quantity (controlled) */}
          <View style={[styles.buttonContainer, { minHeight: verticalScale(36) }]}>
            {qty <= 0 ? (
              <TouchableOpacity
                style={[
                  styles.addToCartButton,
                  {
                    paddingVertical: verticalScale(6),
                    paddingHorizontal: moderateScale(10),
                    borderRadius: moderateScale(6),
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
                onPress={handleAdd}
                activeOpacity={0.7}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Text style={[styles.addToCartText, { fontSize: normalizeFont(12) }]}>
                    Add to Cart
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.quantityBox,
                  {
                    borderRadius: moderateScale(8),
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={handleDecrement}
                  style={[styles.sideBtn, { borderRightWidth: 1 }]}
                  disabled={isProcessing}
                >
                  {isProcessing ? <ActivityIndicator size="small" /> : <Text style={styles.qtyBtnText}>−</Text>}
                </TouchableOpacity>

                <Text style={styles.qtyText}>{String(qty).padStart(2, "0")}</Text>

                <TouchableOpacity onPress={handleIncrement} style={[styles.sideBtn, { borderLeftWidth: 1 }]} disabled={isProcessing}>
                  {isProcessing ? <ActivityIndicator size="small" /> : <Text style={styles.qtyBtnText}>+</Text>}
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
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.2)",
    elevation: 7,
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
    height: scale(35),
    justifyContent: "center",
  },
  addToCartText: {
    color: "#fff",
    fontWeight: "600",
  },
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
