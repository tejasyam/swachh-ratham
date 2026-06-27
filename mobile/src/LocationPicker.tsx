import React, { useState } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import MapView, { Marker, MapPressEvent, Region } from "react-native-maps";
import { colors, styles } from "./theme";

type Coordinate = {
  latitude: number;
  longitude: number;
};

const DEFAULT_REGION: Region = {
  latitude: 16.5062,
  longitude: 80.648,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012
};

function formatAddress(place: Location.LocationGeocodedAddress, coordinate: Coordinate) {
  // Convert reverse-geocoding pieces into a readable address while preserving
  // exact coordinates for pickup precision.
  const parts = [
    place.name,
    place.street,
    place.district,
    place.city,
    place.region,
    place.postalCode
  ].filter(Boolean);
  const readable = parts.length ? parts.join(", ") : "Selected pickup location";
  return `${readable}\nPin: ${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`;
}

export default function LocationPicker({
  address,
  onAddressChange
}: {
  address: string;
  onAddressChange: (address: string) => void;
}) {
  // Local map state tracks both the visible region and the draggable pickup pin.
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [pin, setPin] = useState<Coordinate>({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude
  });
  const [loading, setLoading] = useState(false);

  async function updatePin(coordinate: Coordinate) {
    // Updating the pin also attempts reverse geocoding so the text address stays
    // in sync with the selected map location.
    setPin(coordinate);
    setRegion((current) => ({
      ...current,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude
    }));
    try {
      const places = await Location.reverseGeocodeAsync(coordinate);
      if (places[0]) {
        onAddressChange(formatAddress(places[0], coordinate));
        return;
      }
    } catch {
      // Keep manual address editing available if reverse geocoding fails.
    }
    onAddressChange(`Selected pickup location\nPin: ${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`);
  }

  async function useCurrentLocation() {
    // Optional shortcut for citizens who want the pickup point near their
    // current device location.
    try {
      setLoading(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Location permission needed", "Allow location access to place your pickup pin automatically.");
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await updatePin({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    } catch (error: any) {
      Alert.alert("Could not get location", error.message || "Please place the pin manually.");
    } finally {
      setLoading(false);
    }
  }

  function movePin(event: MapPressEvent) {
    updatePin(event.nativeEvent.coordinate).catch(() => undefined);
  }

  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: colors.line }}>
        <MapView
          style={{ height: 230 }}
          region={region}
          onRegionChangeComplete={setRegion}
          onPress={movePin}
        >
          <Marker
            coordinate={pin}
            draggable
            onDragEnd={(event) => updatePin(event.nativeEvent.coordinate)}
            title="Pickup point"
            description="Drag or tap the map to move this pin"
          />
        </MapView>
      </View>
      <TouchableOpacity
        activeOpacity={0.84}
        onPress={useCurrentLocation}
        style={[styles.secondaryButton, { flexDirection: "row", gap: 8 }]}
      >
        {loading ? <ActivityIndicator color={colors.teal} /> : <Ionicons name="locate" color={colors.teal} size={20} />}
        <Text style={styles.secondaryText}>{loading ? "Finding location" : "Use my current location"}</Text>
      </TouchableOpacity>
      <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 20 }}>
        Tap the map or drag the pin to set the exact pickup point.
      </Text>
      {address ? (
        <Text style={{ color: colors.dark, marginTop: 8, lineHeight: 20, fontWeight: "700" }}>{address}</Text>
      ) : null}
    </View>
  );
}
