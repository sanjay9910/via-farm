// app/screens/MapScreen.jsx
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { moderateScale, normalizeFont, scale } from '../Responsive';

const API_KEY = 'AIzaSyCG4EdVELDakzLL4zmxPzC9JKASgqFnvZc';

export default function MapScreen({ route, navigation }) {
  const [region, setRegion] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [marker, setMarker] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const mapRef = useRef(null);
  const debounceRef = useRef(null);
  const sessionTokenRef = useRef(null); 

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Location permission denied');
          setLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        const r = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.0122,
          longitudeDelta: 0.0121,
        };
        setRegion(r);
        setMarker({
          latitude: r.latitude,
          longitude: r.longitude,
          title: 'You are here',
          description: 'Current location',
        });
      } catch (e) {
        setErrorMsg('Error getting location: ' + (e.message || e));
      } finally {
        setLoading(false);
      }
    })();

    // init session token
    sessionTokenRef.current = generateSessionToken();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const generateSessionToken = () => Math.random().toString(36).substring(2);

  const goToMyLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const r = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.0122,
        longitudeDelta: 0.0121,
      };
      setRegion(r);
      setMarker({ latitude: r.latitude, longitude: r.longitude, title: 'You are here', description: 'Current location' });
      mapRef.current?.animateToRegion(r, 700);
    } catch (e) {
      console.warn(e);
    }
  };

  const onMapPress = (e) => {
    const { coordinate } = e.nativeEvent;
    setMarker({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      title: 'Selected location',
      description: `${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}`,
    });
    setRegion((prev) => ({ ...prev, latitude: coordinate.latitude, longitude: coordinate.longitude }));
  };

  // Fetch autocomplete suggestions (Places API - Autocomplete)
  const fetchPlaceSuggestions = async (input) => {
    if (!input || input.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      if (!sessionTokenRef.current) sessionTokenRef.current = generateSessionToken();

      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&key=${API_KEY}&language=en&sessiontoken=${sessionTokenRef.current}`;

      console.log('[Places Autocomplete] URL ->', url);
      const res = await fetch(url);
      const json = await res.json();
      console.log('[Places Autocomplete] response status:', json.status, ' error_message:', json.error_message);

      if (json.status === 'OK' && Array.isArray(json.predictions)) {
        setSuggestions(json.predictions);
      } else {
        setSuggestions([]);

        console.warn('Places autocomplete returned:', json.status, json.error_message || json.predictions);
      }
    } catch (err) {
      console.warn('Autocomplete error', err);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce input
  const onChangeSearch = (text) => {
    setSearchQuery(text);
    setSuggestions([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPlaceSuggestions(text);
    }, 400);
  };

  const onSelectSuggestion = async (place) => {
    try {
      Keyboard.dismiss();
      setSearchQuery(place.description);
      setSuggestions([]);
      setLoading(true);

      const detailToken = sessionTokenRef.current || generateSessionToken();
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,geometry,formatted_address&key=${API_KEY}&language=en&sessiontoken=${detailToken}`;
      console.log('[Place Details] URL ->', detailsUrl);

      const res = await fetch(detailsUrl);
      const json = await res.json();
      console.log('[Place Details] response status:', json.status, ' error_message:', json.error_message);

      if (json.status === 'OK' && json.result && json.result.geometry && json.result.geometry.location) {
        const loc = json.result.geometry.location;
        const lat = Number(loc.lat);
        const lng = Number(loc.lng);
        const r = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(r);
        setMarker({
          latitude: lat,
          longitude: lng,
          title: json.result.name || place.description,
          description: json.result.formatted_address || place.description,
        });
        mapRef.current?.animateToRegion(r, 800);

        sessionTokenRef.current = null;
      } else {
        // fallback: use Geocoding API with place.description
        console.warn('Place details failed, status:', json.status, json.error_message);
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          place.description
        )}&key=${API_KEY}&language=en`;
        console.log('[Geocode] URL ->', geocodeUrl);

        const res2 = await fetch(geocodeUrl);
        const gjson = await res2.json();
        console.log('[Geocode] response status:', gjson.status, ' error_message:', gjson.error_message);

        if (gjson.status === 'OK' && Array.isArray(gjson.results) && gjson.results.length > 0) {
          const gLoc = gjson.results[0].geometry.location;
          const r = {
            latitude: gLoc.lat,
            longitude: gLoc.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setRegion(r);
          setMarker({
            latitude: gLoc.lat,
            longitude: gLoc.lng,
            title: place.description,
            description: gjson.results[0].formatted_address || place.description,
          });
          mapRef.current?.animateToRegion(r, 800);
        } else {
          alert('Could not find place location. Try another suggestion.');
        }
      }
    } catch (err) {
      console.warn('Place details error', err);
      alert('Error fetching place details.');
    } finally {
      setLoading(false);
    }
  };

  // if user taps search submit and there are no suggestions -> geocode the raw text
  const onSearchSubmit = async () => {
    if (!searchQuery.trim()) return;
    if (suggestions.length === 0) {
      try {
        setLoading(true);
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          searchQuery
        )}&key=${API_KEY}&language=en`;
        console.log('[Geocode] URL ->', geocodeUrl);

        const res = await fetch(geocodeUrl);
        const json = await res.json();
        console.log('[Geocode] response status:', json.status, ' error_message:', json.error_message);

        if (json.status === 'OK' && Array.isArray(json.results) && json.results.length > 0) {
          const gLoc = json.results[0].geometry.location;
          const r = {
            latitude: gLoc.lat,
            longitude: gLoc.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setRegion(r);
          setMarker({
            latitude: gLoc.lat,
            longitude: gLoc.lng,
            title: json.results[0].formatted_address || searchQuery,
            description: json.results[0].formatted_address || searchQuery,
          });
          mapRef.current?.animateToRegion(r, 800);
          setSuggestions([]);
        } else {
          alert('No location found for your search.');
        }
      } catch (err) {
        console.warn('Geocode error', err);
        alert('Search failed.');
      } finally {
        setLoading(false);
      }
    } else {
      onSelectSuggestion(suggestions[0]);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: moderateScale(10) }}>Getting your location...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red', textAlign: 'center' }}>{errorMsg}</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => {
            setErrorMsg(null);
            setLoading(true);
            goToMyLocation();
          }}
        >
          <Text style={styles.btnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top search bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={{ marginLeft: moderateScale(8) }} />
          <TextInput
            placeholder="Search places or address..."
            value={searchQuery}
            onChangeText={onChangeSearch}
            onSubmitEditing={onSearchSubmit}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {searchQuery !== '' ? (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSuggestions([]);
                sessionTokenRef.current = generateSessionToken();
              }}
            >
              <Ionicons name="close" size={20} color="#666" style={{ marginRight: moderateScale(8) }} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.suggestionRow} onPress={() => onSelectSuggestion(item)}>
                  <Text numberOfLines={1} style={styles.suggestionText}>
                    {item.description}
                  </Text>
                  {item.structured_formatting?.secondary_text ? (
                    <Text numberOfLines={1} style={styles.suggestionSub}>
                      {item.structured_formatting.secondary_text}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        region={region}
        onPress={onMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
        loadingEnabled={true}
        loadingIndicatorColor="#666"
      >
        {marker && (
          <Marker coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}>
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{marker.title}</Text>
                <Text style={styles.calloutDesc}>{marker.description}</Text>
              </View>
            </Callout>
          </Marker>
        )}
      </MapView>

      {/* My Location button */}
      <TouchableOpacity style={styles.myLocationBtn} onPress={goToMyLocation}>
        <Ionicons name="locate" size={22} color="#fff" />
      </TouchableOpacity>

      {/* Bottom mini info */}
      {marker && (
        <View style={styles.bottomCard}>
          <Text style={styles.bottomTitle}>{marker.title}</Text>
          <Text style={styles.bottomText}>{marker.description}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  map: { flex: 1 },
  searchWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 55 : 30,
    left: moderateScale(12),
    right: moderateScale(12),
    zIndex: 999,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(6),
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: moderateScale(10),
    height: scale(40),
  },
  suggestionsBox: {
    marginTop: moderateScale(8),
    maxHeight: scale(220),
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  suggestionRow: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  suggestionText: { fontWeight: '500' },
  suggestionSub: { color: '#666', marginTop: moderateScale(4), fontSize: normalizeFont(12) },
  myLocationBtn: {
    position: 'absolute',
    bottom: moderateScale(140),
    right: moderateScale(16),
    backgroundColor: '#007bff',
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  callout: { padding: moderateScale(8), backgroundColor: '#fff', borderRadius: 6 },
  calloutTitle: { fontWeight: '700' },
  calloutDesc: { color: '#333', marginTop: moderateScale(4) },
  bottomCard: {
    position: 'absolute',
    bottom: moderateScale(28),
    left: moderateScale(12),
    right: moderateScale(12),
    backgroundColor: '#fff',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    elevation: 4,
  },
  bottomTitle: { fontWeight: '700' },
  bottomText: { color: '#333', marginTop: moderateScale(6) },
  btn: {
    marginTop: moderateScale(10),
    backgroundColor: '#007bff',
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(6),
  },
  btnText: { color: '#fff', fontWeight: '600' },
});
