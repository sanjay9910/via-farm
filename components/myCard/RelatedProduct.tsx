
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  PixelRatio,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AuthContext } from "../../app/context/AuthContext";
import ProductCard from "../common/ProductCard";

const API_BASE = "https://viafarm-1.onrender.com";
const WISHLIST_ADD_ENDPOINT = "/api/buyer/wishlist/add";
const WISHLIST_REMOVE_ENDPOINT = "/api/buyer/wishlist";
const WISHLIST_GET_ENDPOINT = "/api/buyer/wishlist";
const CART_ENDPOINT = "/api/buyer/cart";
const CART_ADD_ENDPOINT = "/api/buyer/cart/add";

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

const POSSIBLE_TOKEN_KEYS = ["userToken", "token", "accessToken", "authToken"];

const RelatedProduct = ({ productId: propProductId, cardWidth }) => {
  const navigation = useNavigation();
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState({});

  const authCtx = useContext(AuthContext);
  const ctxToken =
    authCtx &&
    (authCtx.token ||
      authCtx.authToken ||
      authCtx.userToken ||
      authCtx.accessToken);

  const productId = propProductId;

  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchSimilar(mounted),
          fetchWishlist(mounted),
          fetchCart(mounted),
        ]);
      } catch (e) {
        console.warn("RelatedProduct loadAll error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAll();
    return () => {
      mounted = false;
    };
  }, [productId, ctxToken]);

  const getToken = async () => {
    let token = ctxToken;
    if (!token) {
      for (const key of POSSIBLE_TOKEN_KEYS) {
        try {
          const stored = await AsyncStorage.getItem(key);
          if (stored) {
            token = stored;
            break;
          }
        } catch (e) {
        }
      }
    }
    if (token && typeof token === "string" && token.startsWith("{")) {
      try {
        const parsed = JSON.parse(token);
        token =
          parsed?.accessToken ||
          parsed?.token ||
          parsed?.data?.token ||
          token;
      } catch (e) {
      }
    }
    return token;
  };

  const normalizeProductObject = (p) => {
    if (!p) return null;

    const id = String(p._id ?? p.id ?? p.productId ?? "");
    if (!id) return null;
    const images = p.images ?? p.imageUrls ?? p.photos ?? [];
    const image =
      p.imageUrl ??
      p.image ??
      (Array.isArray(images) && images.length > 0 ? images[0] : null);

    const category =
      typeof p.category === "object"
        ? p.category.name ?? p.category
        : p.category ?? "General";
    let vendorName = "";
    if (p.vendor) {
      if (typeof p.vendor === "string") {
        vendorName = p.vendor;
      } else if (typeof p.vendor === "object") {
        vendorName =
          p.vendor.name ||
          p.vendor.vendorName ||
          p.vendor.sellerName ||
          p.vendor.displayName ||
          "";
      }
    }
    vendorName =
      vendorName ||
      p.vendorName ||
      p.sellerName ||
      p.vendor?.sellerName ||
      p.shopName ||
      "";

    const rawRating =
      p.rating ?? p.averageRating ?? p.avgRating ?? p.reviewRating ?? 0;
    const rating =
      typeof rawRating === "number" ? rawRating : Number(rawRating) || 0;

    return {
      id,
      name: p.name ?? p.title ?? p.productName ?? "",
      price:
        typeof p.price === "number"
          ? p.price
          : Number(p.price ?? p.mrp ?? p.priceInRs) || 0,
      quantity: p.quantity ?? 1,
      unit: p.unit ?? p.weightUnit ?? "pc",
      variety: p.variety ?? p.subtitle ?? "",
      image,
      rating,
      category,
      vendorName,
      vendor: { name: vendorName }, 
      raw: p,
    };
  };

  const fetchSimilar = async (mounted = true) => {
    try {
      if (!productId) {
        const token = await getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await axios.get(`${API_BASE}${CART_ENDPOINT}`, {
          headers,
          timeout: 10000,
        });
        const items =
          resp?.data?.data?.similarProducts &&
          Array.isArray(resp.data.data.similarProducts)
            ? resp.data.data.similarProducts
            : [];
        const normalized = (Array.isArray(items) ? items : [])
          .map(normalizeProductObject)
          .filter(Boolean);
        if (mounted) setSimilar(normalized);
        return;
      }

      const token = await getToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const url = `${API_BASE}/api/buyer/products/${productId}`;
      const resp = await axios.get(url, { headers, timeout: 10000 });

      const recommended =
        resp?.data?.data?.recommendedProducts ||
        resp?.data?.recommendedProducts ||
        resp?.data?.products ||
        resp?.data?.data?.product?.recommendedProducts ||
        resp?.data?.data?.recommended ||
        resp?.data?.data?.similarProducts ||
        [];

      const normalized = Array.isArray(recommended)
        ? recommended.map(normalizeProductObject).filter(Boolean)
        : [];

      if (normalized.length === 0) {
        const single = resp?.data?.data?.product || resp?.data?.product;
        if (single && typeof single === "object") {
          const fallbackArr = [normalizeProductObject(single)].filter(Boolean);
          if (mounted) setSimilar(fallbackArr);
          return;
        }
      }

      if (mounted) setSimilar(normalized);
    } catch (err) {
      console.error("RelatedProduct fetchSimilar error:", err);
      if (err?.response?.status === 401) {
        console.log("Unauthorized - token may be invalid or expired.");
        try {
          for (const k of POSSIBLE_TOKEN_KEYS) await AsyncStorage.removeItem(k);
        } catch (e) {
          console.warn("Failed clearing tokens:", e);
        }
      }
      setError(err?.response?.data?.message || "Failed to load related products");
      if (mounted) setSimilar([]);
    }
  };

  const fetchCart = async (mounted = true) => {
    try {
      const token = await getToken();
      if (!token) {
        if (mounted) setCartItems({});
        return;
      }

      const response = await axios.get(`${API_BASE}${CART_ENDPOINT}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      if (response?.data?.success) {
        const items = (response.data.data && response.data.data.items) || [];
        const cartMap = {};
        items.forEach((item) => {
          const pid = String(
            item.productId ?? item.product?._id ?? item.id ?? item.product
          );
          cartMap[pid] = {
            quantity: item.quantity || item.qty || 1,
            cartItemId: item._id || item.id || item.cartItemId,
            raw: item,
          };
        });
        if (mounted) setCartItems(cartMap);
      } else {
        if (mounted) setCartItems({});
      }
    } catch (err) {
      console.error("RelatedProduct fetchCart error:", err);
      if (mounted) setCartItems({});
    }
  };

  const fetchWishlist = async (mounted = true) => {
    try {
      const token = await getToken();
      if (!token) {
        if (mounted) setFavorites(new Set());
        return;
      }

      const response = await axios.get(`${API_BASE}${WISHLIST_GET_ENDPOINT}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      if (response?.data?.success) {
        const wishlistItems =
          (response.data.data && response.data.data.items) || [];
        const favSet = new Set(
          wishlistItems.map((it) =>
            String(it.productId ?? it.product?._id ?? it._id ?? it.id)
          )
        );
        if (mounted) setFavorites(favSet);
      } else {
        if (mounted) setFavorites(new Set());
      }
    } catch (err) {
      console.error("RelatedProduct fetchWishlist error:", err);
      if (mounted) setFavorites(new Set());
    }
  };

  // ---------- CART HELPERS (ADD / UPDATE / REMOVE) ----------

  const addToCart = async (product) => {
    try {
      const token = await getToken();
      if (!token) {
        console.log("Login required to add items to cart");
        return false;
      }

      const productId = String(product.id ?? product._id ?? "");
      const cartData = {
        productId,
        name: product.name || product.title || "",
        image: product.image || product.imageUrl || null,
        price: product.price || 0,
        quantity: 1,
        category: product.category || "",
        variety: product.variety || "",
        unit: product.unit || "",
      };

      const response = await axios.post(
        `${API_BASE}${CART_ADD_ENDPOINT}`,
        cartData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );

      if (response?.data?.success) {
        await fetchCart();
        console.log("Product added to cart");
        return true;
      } else {
        throw new Error(response?.data?.message || "Failed to add to cart");
      }
    } catch (err) {
      console.error("RelatedProduct addToCart error:", err);
      if (err.response?.status === 400) {
        await fetchCart();
        console.log(err.response?.data?.message || "Product already in your cart");
      } else if (err.response?.status === 401) {
        console.log("Login required to add items to cart");
      } else {
        console.log("Failed to add to cart");
      }
      return false;
    }
  };

  const updateCartItemQuantity = async (cartItemId, newQuantity) => {
    const token = await getToken();
    if (!token) {
      console.log("Login required to update cart");
      return false;
    }

    const url = `${API_BASE}/api/buyer/cart/${cartItemId}/quantity`;

    const res = await axios.put(
      url,
      { quantity: newQuantity },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );

    if (!res.data?.success) {
      throw new Error(res.data?.message || "Failed to update quantity");
    }
    return true;
  };

  const removeCartItemFromServer = async (cartItemId) => {
    const token = await getToken();
    if (!token) {
      console.log("Login required to update cart");
      return false;
    }

    const url = `${API_BASE}/api/buyer/cart/${cartItemId}`;

    const res = await axios.delete(url, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });

    if (!res.data?.success) {
      throw new Error(res.data?.message || "Failed to remove item from cart");
    }
    return true;
  };

  // ---------- WISHLIST HELPERS ----------

  const addToWishlist = async (product) => {
    try {
      const token = await getToken();
      if (!token) {
        console.log("Login required to add items to wishlist");
        return false;
      }

      const payload = {
        productId: String(product.id ?? product._id ?? ""),
        name: product.name || "",
        image: product.image || null,
        price: product.price || 0,
        category: product.category || "",
        variety: product.variety || "",
        unit: product.unit || "",
      };

      const response = await axios.post(
        `${API_BASE}${WISHLIST_ADD_ENDPOINT}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );

      if (response?.data?.success) {
        setFavorites((prev) => {
          const n = new Set(prev);
          n.add(String(payload.productId));
          return n;
        });
        return true;
      } else {
        throw new Error(response?.data?.message || "Failed to add to wishlist");
      }
    } catch (err) {
      console.error("RelatedProduct addToWishlist error:", err);
      if (err.response?.status === 400) {
        console.log(err.response?.data?.message || "Product already in wishlist");
        setFavorites((prev) => {
          const n = new Set(prev);
          n.add(String(product.id ?? product._id ?? ""));
          return n;
        });
      } else if (err.response?.status === 401) {
        console.log("Login required to add items to wishlist");
      } else {
        console.log("Failed to add to wishlist");
      }
      return false;
    }
  };

  const removeFromWishlist = async (product) => {
    try {
      const token = await getToken();
      if (!token) {
        console.log("Login required to manage wishlist");
        return false;
      }

      const pid = String(product.id ?? product._id ?? "");
      const response = await axios.delete(
        `${API_BASE}${WISHLIST_REMOVE_ENDPOINT}/${pid}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      if (response?.data?.success) {
        setFavorites((prev) => {
          const n = new Set(prev);
          n.delete(pid);
          return n;
        });
        return true;
      } else {
        throw new Error(
          response?.data?.message || "Failed to remove from wishlist"
        );
      }
    } catch (err) {
      console.error("RelatedProduct removeFromWishlist error:", err);
      console.log("Failed to remove from wishlist");
      return false;
    }
  };

  // ---------- HANDLERS USED BY ProductCard ----------

  const handleFavoritePress = async (productId) => {
    try {
      const product = similar.find((p) => String(p.id) === String(productId));
      if (!product) return;
      if (favorites.has(String(productId))) {
        const ok = await removeFromWishlist(product);
        if (ok) console.log("Product removed from wishlist");
      } else {
        const ok = await addToWishlist(product);
        if (ok) console.log("Product added to wishlist");
      }
    } catch (err) {
      console.error("RelatedProduct handleFavoritePress error:", err);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      const product = similar.find((p) => String(p.id) === String(productId));
      if (!product) return;

      if (cartItems[String(productId)]) {
        console.log("Product already in cart");
        return;
      }

      await addToCart(product);
    } catch (err) {
      console.error("RelatedProduct handleAddToCart error:", err);
    }
  };

  const handleQuantityChange = async (delta, product) => {
    try {
      const pid = String(product.id);
      const existing = cartItems[pid];
      if (!existing && delta > 0) {
        const added = await addToCart(product);
        if (added) {
          await fetchCart();
        }
        return;
      }
      if (!existing) return;

      const currentQty = existing.quantity || 0;
      const newQuantity = currentQty + delta;
      if (newQuantity < 1) {
        try {
          const ok = await removeCartItemFromServer(existing.cartItemId);
          if (ok) {
            setCartItems((prev) => {
              const next = { ...prev };
              delete next[pid];
              return next;
            });
            console.log("Item removed from cart");
          } else {
            await fetchCart();
            console.log("Failed to remove item");
          }
        } catch (err) {
          console.error("removeCartItemFromServer error:", err);
          await fetchCart();
          console.log("Failed to remove item");
        }
        return;
      }

      const previousItem = existing;

      setCartItems((prev) => ({
        ...prev,
        [pid]: { ...prev[pid], quantity: newQuantity },
      }));

      try {
        const ok = await updateCartItemQuantity(
          existing.cartItemId,
          newQuantity
        );
        if (!ok) {
          setCartItems((prev) => ({
            ...prev,
            [pid]: previousItem,
          }));
          console.log("Failed to update quantity");
        }
      } catch (err) {
        console.error("updateCartItemQuantity error:", err);
        setCartItems((prev) => ({
          ...prev,
          [pid]: previousItem,
        }));
        await fetchCart();
        console.log("Failed to update quantity");
      }
    } catch (err) {
      console.error("RelatedProduct handleQuantityChange error:", err);
      console.log("Failed to update cart quantity");
    }
  };

  const onProductPress = (product) => {
    try {
      navigation.navigate("ViewProduct", {
        productId: String(product.id),
        product,
      });
    } catch (err) {
      console.error("RelatedProduct navigation error:", err);
      console.log("Unable to open product details.");
    }
  };

  // ---------- RENDER ----------

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>You may also like</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" />
        </View>
      </View>
    );
  }

  if (!loading && (!similar || similar.length === 0)) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You may also like</Text>

      <FlatList
        data={similar}
        horizontal
        keyExtractor={(item) => String(item?.id ?? Math.random())}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const qty = cartItems[String(item.id)]
            ? cartItems[String(item.id)].quantity
            : 0;
          const subtitle = (item.vendor && item.vendor.name) || item.vendorName || "";

          return (
            <ProductCard
              id={item.id}
              title={item.name}
              subtitle={subtitle}
              price={item.price}
              rating={item.rating}
              image={item.image}
              isFavorite={favorites.has(String(item.id))}
              onPress={() => onProductPress(item)}
              onFavoritePress={() => handleFavoritePress(item.id)}
              onAddToCart={() => handleAddToCart(item.id)}
              onQuantityChange={(delta) => handleQuantityChange(delta, item)}
              cartQuantity={qty}
              width={cardWidth ?? Math.round(moderateScale(150))}
              showRating
              showFavorite
              imageHeight={Math.round(verticalScale(120))}
              cardStyle={styles.cardStyle}
            />
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: moderateScale(8),
    backgroundColor: "#fff",
    paddingVertical: moderateScale(6),
  },
  title: {
    fontSize: normalizeFont(10),
    fontWeight: "700",
    color: "#222",
    marginLeft: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  listContent: { paddingHorizontal: moderateScale(12) },
  cardStyle: { marginRight: moderateScale(12) },
  loadingContainer: {
    padding: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
  },
});

export default RelatedProduct;
