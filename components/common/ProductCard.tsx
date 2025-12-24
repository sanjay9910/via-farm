// components/common/ProductCard.js
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  PixelRatio,
  Platform,
  StyleSheet,
  Text,
  TextInput,
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

const DEFAULT_IMAGE = "https://via.placeholder.com/300x200.png?text=No+Image";

const ProductCard = ({
  id,
  title,
  subtitle,
  price,
  unit,
  weightPerPiece,
  rating,
  image,
  isFavorite = false,
  onPress,
  onFavoritePress,
  onAddToCart,
  onQuantityChange,
  cartQuantity = 0,
  width = Math.round(moderateScale(140)),
  showRating = true,
  showFavorite = true,
  showAddToCart = true,
  cardStyle = {},
  imageHeight = Math.round(moderateScale(120)),
}) => {
  // local optimistic quantity
  const [localQty, setLocalQty] = useState(Number(cartQuantity || 0));
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalQtyText, setModalQtyText] = useState(String(cartQuantity || 0));
  const prevQtyRef = useRef(localQty);

  useEffect(() => {
    if (!isProcessing) {
      const parsed = Number(cartQuantity || 0);
      setLocalQty(parsed);
      prevQtyRef.current = parsed;
    }
  }, [cartQuantity, isProcessing]);

  useEffect(() => {
    setModalQtyText(String(cartQuantity || 0));
  }, [modalVisible, cartQuantity]);

  // optimistic helper
  const runOptimistic = async ({ apply, rollback, callback }) => {
    if (isProcessing) return false;
    setIsProcessing(true);
    const prev = prevQtyRef.current;

    try {
      apply?.();
      const res = callback && callback();
      if (res && typeof res.then === "function") {
        await res;
      }
      prevQtyRef.current = typeof localQty === "number" ? localQty : prev;
      setIsProcessing(false);
      return true;
    } catch (err) {
      rollback?.(prev);
      prevQtyRef.current = prev;
      setIsProcessing(false);
      return false;
    }
  };

  const handleAdd = async () => {
    if (!showAddToCart) return;
    await runOptimistic({
      apply: () => setLocalQty(1),
      rollback: (prevVal) => setLocalQty(prevVal),
      callback: () => (onAddToCart ? onAddToCart() : Promise.resolve()),
    });
  };

  const handleIncrement = async () => {
    await runOptimistic({
      apply: () => setLocalQty((s) => Number(s || 0) + 1),
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

  const handleModalConfirm = async () => {
    let desired = parseInt((modalQtyText || "0").replace(/\D/g, ""), 10);
    if (Number.isNaN(desired) || desired < 0) desired = 0;
    const current = Number(cartQuantity || 0);
    const delta = desired - current;
    setModalVisible(false);

    if (delta === 0) return;

    await runOptimistic({
      apply: () => setLocalQty(desired),
      rollback: (prevVal) => setLocalQty(prevVal),
      callback: () => (onQuantityChange ? onQuantityChange(delta) : Promise.resolve()),
    });
  };

  const qty = Number(localQty || 0);

  const SIDE_BTN_WIDTH = Math.round(moderateScale(47));
  const QUANTITY_NUM_MIN_WIDTH = Math.round(moderateScale(36));
  const CONTROL_WIDTH = SIDE_BTN_WIDTH * 2 + QUANTITY_NUM_MIN_WIDTH;
  const CONTROL_HEIGHT = Math.round(
    Math.min(Math.max(verticalScale(36), moderateScale(34)), verticalScale(52))
  );

  const safeImage = image ? image : DEFAULT_IMAGE;
  const cardMinHeight = imageHeight + moderateScale(92);

  return (
    <View style={[{ width }, cardStyle]}>
      <TouchableOpacity
        style={[styles.card, { width, minHeight: cardMinHeight }]}
        activeOpacity={0.92}
        onPress={() => onPress?.(id)}
        disabled={isProcessing}
      >
        {/* Product Image */}
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          <Image source={{ uri: safeImage }} style={styles.productImage} resizeMode="cover" />

          {showFavorite && (
            <TouchableOpacity
              style={[
                styles.favoriteButton,
                {
                  width: moderateScale(28),
                  height: moderateScale(28),
                  borderRadius: moderateScale(18),
                },
              ]}
              onPress={() => onFavoritePress?.(id)}
              activeOpacity={0.75}
              disabled={isProcessing}
            >
              {isFavorite ? <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={scale(21)}
                color={isFavorite ? '#ff4444' : '#fff'}
              /> : <Image source={require("../../assets/via-farm-img/icons/mainHeartIcon.png")} />}
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
              <Ionicons name="star" size={moderateScale(10)} color="#FFD700" />
              <Text allowFontScaling={false} style={[styles.ratingText, { fontSize: normalizeFont(10) }]}>{rating ?? 0}</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={[styles.cardContent, { padding: moderateScale(8) }]}>
          <Text allowFontScaling={false} style={styles.productTitle} numberOfLines={1} >
            {title}
          </Text>

          <Text allowFontScaling={false} style={styles.productSubtitle} numberOfLines={1}>
            {subtitle ? `By ${subtitle}` : ""}
          </Text>

          {/* UNIT + PRICE */}
          <View style={styles.unitPriceRow}>
            <Text
              allowFontScaling={false}
              style={[styles.productPrice, { fontSize: normalizeFont(11) }]}
              numberOfLines={1}
            >
              ₹{price}
            </Text>

            {unit ? (
              <Text
                allowFontScaling={false}
                style={[styles.unitText, { fontSize: normalizeFont(11) }]}
                numberOfLines={1}
              >
                /{unit}
              </Text>
            ) : null}

            {weightPerPiece ? (
              <Text
                allowFontScaling={false}
                style={[styles.unitText, { fontSize: normalizeFont(11) }]}
                numberOfLines={1}
              >
                /{weightPerPiece}
              </Text>
            ) : null}
          </View>

          {/* Button area */}
          <View style={[styles.buttonContainer, { minHeight: CONTROL_HEIGHT + moderateScale(6) }]}>
            {qty <= 0 ? (
              <TouchableOpacity
                style={[
                  styles.addToCartButton,
                  {
                    width: CONTROL_WIDTH,
                    height: CONTROL_HEIGHT,
                    borderRadius: moderateScale(6),
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: moderateScale(8),
                  },
                ]}
                onPress={handleAdd}
                activeOpacity={0.7}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text allowFontScaling={false}
                    style={[styles.addToCartText, { fontSize: normalizeFont(12) }]}
                    numberOfLines={1}
                  >
                    Add to Cart
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity activeOpacity={0.9} onPress={() => setModalVisible(true)} disabled={isProcessing}>
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
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={handleDecrement}
                    style={[
                      styles.sideBtn,
                      {
                        width: SIDE_BTN_WIDTH,
                        height: CONTROL_HEIGHT,
                        justifyContent: "center",
                        alignItems: "center",
                        borderRightWidth: 1,
                      },
                    ]}
                    disabled={isProcessing}
                  >
                    <Text allowFontScaling={false} style={[styles.qtyBtnText, { fontSize: normalizeFont(18) }]}>−</Text>
                  </TouchableOpacity>

                  <View style={{ minWidth: QUANTITY_NUM_MIN_WIDTH, alignItems: "center", justifyContent: "center" }}>
                    <Text allowFontScaling={false} style={[styles.qtyText, { fontSize: normalizeFont(14) }]}>{String(qty).padStart(2, "0")}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleIncrement}
                    style={[
                      styles.sideBtn,
                      {
                        width: SIDE_BTN_WIDTH,
                        height: CONTROL_HEIGHT,
                        justifyContent: "center",
                        alignItems: "center",
                        borderLeftWidth: 1,
                      },
                    ]}
                    disabled={isProcessing}
                  >
                    <Text allowFontScaling={false} style={[styles.qtyBtnText, { fontSize: normalizeFont(18) }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* processing overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="small" color="#ffffff" />
          </View>
        )}
      </TouchableOpacity>

      {/* Quantity Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text allowFontScaling={false} style={styles.modalTitle}>Add Quantity</Text>

            <View style={styles.modalControlsRow}>
              <TouchableOpacity
                style={styles.modalSideBtn}
                onPress={() => {
                  const n = Math.max(0, parseInt((modalQtyText || "0").replace(/\D/g, ""), 10) || 0);
                  setModalQtyText(String(Math.max(0, n - 1)));
                }}
                activeOpacity={0.8}
              >
                <Text allowFontScaling={false} style={styles.modalSideBtnText}>−</Text>
              </TouchableOpacity>

              <TextInput
                value={modalQtyText}
                onChangeText={(t) => setModalQtyText(t.replace(/[^\d]/g, ""))}
                keyboardType="number-pad"
                style={styles.modalInput}
                placeholder="0"
                placeholderTextColor="#999"
                allowFontScaling={false}
              />

              <TouchableOpacity
                style={styles.modalSideBtn}
                onPress={() => {
                  const n = Math.max(0, parseInt((modalQtyText || "0").replace(/\D/g, ""), 10) || 0);
                  setModalQtyText(String(n + 1));
                }}
                activeOpacity={0.8}
              >
                <Text allowFontScaling={false} style={styles.modalSideBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: "#e0e0e0" }]} onPress={() => setModalVisible(false)} activeOpacity={0.8} disabled={isProcessing}>
                <Text allowFontScaling={false} style={[styles.modalActionText, { color: "#333" }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: "rgba(76,175,80,1)" }]} onPress={handleModalConfirm} activeOpacity={0.8} disabled={isProcessing}>
                {isProcessing ? <ActivityIndicator size="small" color="#fff" /> : <Text allowFontScaling={false} style={[styles.modalActionText, { color: "#fff" }]}>OK</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const COMMON_TEXT_SIZE = normalizeFont(12);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "grey",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: "grey",
    elevation: 4,
    shadowOffset: { width: 0, height: 3 },
  },
  imageContainer: {
    position: "relative",
    borderTopLeftRadius: moderateScale(8),
    borderTopRightRadius: moderateScale(8),
    overflow: "hidden",
    width: "100%",
    backgroundColor: "#f6f6f6",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  favoriteButton: {
    position: "absolute",
    right: moderateScale(2),
    top: moderateScale(2),
    justifyContent: "center",
    alignItems: "center",
  },
  ratingContainer: {
    position: "absolute",
    bottom: moderateScale(8),
    left: moderateScale(8),
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(12),
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    color: "#fff",
    marginLeft: moderateScale(2),
    fontWeight: "600",
  },
  cardContent: {
    // leave flexible but avoid collapse
  },
  productTitle: {
    fontWeight: "600",
    color: "#222",
    marginBottom: moderateScale(4),
    fontSize: COMMON_TEXT_SIZE,
  },
  productSubtitle: {
    color: "#666",
    marginBottom: moderateScale(6),
    fontSize: COMMON_TEXT_SIZE,
  },
  /* unit + price row */
  unitPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(8),
  },
  unitText: {
    color: "#111",
    // marginLeft: moderateScale(6),
  },
  productPrice: {
    fontWeight: "700",
    color: "#111",
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
    fontWeight: "700",
    textAlign: "center",
  },
  quantityBox: {
    borderWidth: 1.2,
    borderColor: "rgba(76, 175, 80, 1)",
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  sideBtn: {
    borderColor: "rgba(76, 175, 80, 1)",
    paddingHorizontal: moderateScale(10),
  },
  qtyBtnText: {
    color: "rgba(76, 175, 80, 1)",
    fontWeight: "700",
  },
  qtyText: {
    color: "rgba(76, 175, 80, 1)",
    fontWeight: "700",
    textAlign: "center",
  },

  processingOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Modal styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(20),
  },
  modalCard: {
    width: Math.min(320, SCREEN_WIDTH - 40),
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    alignItems: "center",
    elevation: 8,
    shadowColor: "rgba(0,0,0,0.25)",
  },
  modalTitle: {
    fontSize: normalizeFont(15),
    fontWeight: "700",
    marginBottom: moderateScale(12),
  },
  modalControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(14),
  },
  modalSideBtn: {
    backgroundColor: "#efefef",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
    marginHorizontal: moderateScale(8),
  },
  modalSideBtnText: {
    fontSize: normalizeFont(18),
    fontWeight: "700",
    color: "#333",
  },
  modalInput: {
    minWidth: moderateScale(90),
    height: moderateScale(44),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#e6e6e6",
    textAlign: "center",
    fontSize: normalizeFont(18),
    paddingVertical: 0,
    color: "#111",
  },
  modalActionsRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    marginTop: moderateScale(6),
  },
  modalActionBtn: {
    flex: 1,
    marginHorizontal: moderateScale(6),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  modalActionText: {
    fontSize: normalizeFont(14),
    fontWeight: "700",
  },
});

export default ProductCard;
