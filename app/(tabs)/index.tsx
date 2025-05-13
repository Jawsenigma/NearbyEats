// app/(tabs)/index.tsx
import Slider from '@react-native-community/slider'
import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import MapView, { Marker, UrlTile } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useCurrentLocation, { UserLocation } from '../../hooks/useCurrentLocation'

type Restaurant = {
  id: number
  name: string
  lat: number
  lon: number
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { location, errorMsg } = useCurrentLocation()
  const [radiusMiles, setRadiusMiles] = useState<number>(1)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false)
  const [sliderVisible, setSliderVisible] = useState<boolean>(false)
  const mapRef = useRef<MapView | null>(null)
  const pulseAnim = useRef(new Animated.Value(0)).current

  // 1) animate pulsing dot
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  // 2) auto-hide slider after 4s
  useEffect(() => {
    if (!sliderVisible) return
    const t = setTimeout(() => setSliderVisible(false), 4000)
    return () => clearTimeout(t)
  }, [sliderVisible])

  // 3) fetch nearby restaurants via Overpass
  const milesToMeters = (mi: number) => mi * 1609.34
  async function fetchNearbyRestaurants(loc: UserLocation, radius: number) {
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="restaurant"](around:${radius},${loc.latitude},${loc.longitude});
        way["amenity"="restaurant"](around:${radius},${loc.latitude},${loc.longitude});
        rel["amenity"="restaurant"](around:${radius},${loc.latitude},${loc.longitude});
      );
      out center;`
    const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query)
    const res = await fetch(url)
    const json = await res.json()
    return json.elements.map((el: any) => ({
      id:   el.id,
      name: el.tags?.name ?? 'Unnamed',
      lat:  el.lat  ?? el.center.lat,
      lon:  el.lon  ?? el.center.lon,
    }))
  }

  // 4) when location or radius changes, re-fetch
  useEffect(() => {
    if (!location) return
    fetchNearbyRestaurants(location, milesToMeters(radiusMiles))
      .then(setRestaurants)
      .catch(console.warn)
  }, [location, radiusMiles])

  if (errorMsg) return <Text style={styles.error}>{errorMsg}</Text>
  if (!location) return <Text style={styles.loading}>Loading location…</Text>

  // center map helper
  const centerOn = (lat: number, lon: number) =>
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lon, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      300
    )

  // dropdown suggestions (prefix-match, up to 5)
  const suggestions = searchQuery
    ? restaurants
        .filter(r => r.name.toLowerCase().startsWith(searchQuery.toLowerCase()))
        .slice(0, 5)
    : []

  // which markers to render
  const filtered = searchQuery
    ? restaurants.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : restaurants

  // dynamic positions
  const searchTop    = insets.top + 12
  const buttonBottom = insets.bottom + 60   // pushed up
  const sliderBottom = insets.bottom + 120  // above the button

  return (
    <View style={styles.container}>
      {/* Search bar + dropdown */}
      <View style={[styles.searchContainer, { top: searchTop }]}>
        <TextInput
          style={[
            styles.searchBar,
            {
              backgroundColor: isSearchFocused
                ? 'rgba(255,255,255,0.95)'
                : 'rgba(255,255,255,0.85)',
            },
          ]}
          placeholder="Search restaurants…"
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
        {isSearchFocused && suggestions.length > 0 && (
          <View style={styles.suggestionContainer}>
            {suggestions.map(s => (
              <TouchableOpacity
                key={s.id}
                style={styles.suggestionItem}
                onPress={() => {
                  setSearchQuery(s.name)
                  centerOn(s.lat, s.lon)
                  setIsSearchFocused(false)
                }}
              >
                <Text>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        region={{
          latitude:      location.latitude,
          longitude:     location.longitude,
          latitudeDelta:  0.02,
          longitudeDelta: 0.02,
        }}
      >
        {/* OSM tiles */}
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
        />

        {/* Your current location in Google-blue */}
        <Marker coordinate={location} zIndex={999}>
          <Animated.View
            style={[
              styles.pulse,
              {
                opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                transform: [
                  { scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }) },
                ],
              },
            ]}
          />
          <View style={styles.pulseOutline} />
        </Marker>

        {/* Standard restaurant pins */}
        {filtered.map(r => (
          <Marker
            key={r.id}
            coordinate={{ latitude: r.lat, longitude: r.lon }}
            title={r.name}
            onPress={() => centerOn(r.lat, r.lon)}
          />
        ))}
      </MapView>

      {/* Radius toggle button */}
      <TouchableOpacity
        style={[styles.sliderButton, { bottom: buttonBottom }]}
        onPress={() => setSliderVisible(v => !v)}
      >
        <Text style={styles.sliderButtonText}>Adjust radius</Text>
      </TouchableOpacity>

      {/* Horizontal translucent slider */}
      {sliderVisible && (
        <View style={[styles.sliderContainer, { bottom: sliderBottom }]}>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={5}
            step={0.5}
            value={radiusMiles}
            onValueChange={value => setRadiusMiles(value)}
            minimumTrackTintColor="rgba(0,122,255,0.8)"
            maximumTrackTintColor="rgba(0,122,255,0.2)"
            thumbTintColor="#007AFF"
          />
          <Text style={styles.sliderLabel}>{radiusMiles.toFixed(1)} mi</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading:   { flex: 1, textAlign: 'center', marginTop: 50 },
  error:     { flex: 1, color: 'red', textAlign: 'center', marginTop: 50 },

  // Search bar + dropdown
  searchContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 10,
  },
  searchBar: {
    paddingVertical:   10,
    paddingHorizontal: 14,
    borderRadius:      8,
    fontSize:         16,
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor:   '#000',
        shadowOpacity: 0.1,
        shadowRadius:  4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  suggestionContainer: {
    backgroundColor: 'white',
    borderColor:     '#ccc',
    borderWidth:     1,
    marginTop:      -1,
  },
  suggestionItem: {
    padding:            10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },

  // Map
  map: {
    width:  Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },

  // Pulsing dot: Google blue + white outline
  pulse: {
    width:           14,
    height:          14,
    borderRadius:     7,
    backgroundColor: '#4285F4',
    position:       'absolute',
  },
  pulseOutline: {
    width:          14,
    height:         14,
    borderRadius:    7,
    borderWidth:     2,
    borderColor:    'white',
    position:      'absolute',
  },

  // Radius button
  sliderButton: {
    position:      'absolute',
    right:         20,
    backgroundColor:'rgba(255,255,255,0.8)',
    paddingVertical:   8,
    paddingHorizontal:12,
    borderRadius:     20,
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor:   '#000',
        shadowOpacity: 0.2,
        shadowRadius:  4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  sliderButtonText: {
    fontWeight: '600',
    color:      '#007AFF',
  },

  // Horizontal slider container
  sliderContainer: {
    position:       'absolute',
    left:            20,
    right:           20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius:     8,
    padding:          8,
    alignItems:      'center',
    zIndex:          10,
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor:   '#000',
        shadowOpacity: 0.1,
        shadowRadius:  4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  slider: {
    width: '100%',
  },
  sliderLabel: {
    marginTop: 4,
    fontWeight:'500',
    color:     '#333',
  },
})
