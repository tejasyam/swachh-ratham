import React, { useState } from "react";
import { Alert, Image, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import * as Location from "expo-location";
import { apiFetch } from "../api";
import { StatusBadge } from "../components";
import { colors, styles } from "../theme";
import { Pickup } from "../types";

const statuses = ["Accepted", "On the way", "Collected", "Delivered"];

function getPickupDestination(address: string) {
  const match = address.match(/Pin:\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
  if (match) {
    return `${match[1]},${match[2]}`;
  }
  return encodeURIComponent(address);
}

export default function AssignedPickupDetailsScreen({ route, navigation }: any) {
  const [pickup, setPickup] = useState<Pickup>(route.params.pickup);

  async function openDirections(address: string) {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Location permission needed", "Allow location access so directions can start from your current location.");
      return;
    }
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const origin = `${location.coords.latitude},${location.coords.longitude}`;
    const destination = getPickupDestination(address);
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    await Linking.openURL(url);
  }

  async function update(status: string) {
    try {
      const updated = await apiFetch<Pickup>(`/pickups/${pickup.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, note: `Driver marked ${status}` })
      });
      setPickup(updated);
      if (status === "Accepted") {
        await openDirections(updated.address);
      }
      if (status === "Collected") {
        Alert.alert("Collected", `${updated.ecopoints_awarded} EcoPoints added to the citizen.`);
      }
    } catch (error: any) {
      Alert.alert("Status update failed", error.message);
    }
  }

  return (
    <ScrollView style={styles.screen}>
      {pickup.object?.image_url ? <Image source={{ uri: pickup.object.image_url }} style={{ height: 220, borderRadius: 18, backgroundColor: colors.line }} /> : null}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={{ color: colors.dark, fontSize: 22, fontWeight: "900", flex: 1 }}>{pickup.object?.name}</Text>
          <StatusBadge value={pickup.status} />
        </View>
        <Text style={styles.subtitle}>{pickup.object?.description}</Text>
        <Text style={styles.label}>Quantity</Text>
        <Text style={{ color: colors.dark }}>{pickup.object?.quantity || 1}</Text>
        <Text style={styles.label}>Classification</Text>
        <Text style={{ color: colors.dark }}>{pickup.object?.classification} - {pickup.object?.preferred_action}</Text>
        {pickup.ecopoints_awarded ? (
          <>
            <Text style={styles.label}>EcoPoints awarded</Text>
            <Text style={{ color: colors.greenDark, fontWeight: "900" }}>{pickup.ecopoints_awarded}</Text>
          </>
        ) : null}
        <Text style={styles.label}>Pickup address</Text>
        <Text style={{ color: colors.dark, lineHeight: 22 }}>{pickup.address}</Text>
        <Text style={styles.label}>Citizen</Text>
        <Text style={{ color: colors.dark }}>{pickup.citizen?.name} ({pickup.citizen?.email})</Text>
      </View>
      <View style={styles.card}>
        <Text style={{ color: colors.dark, fontWeight: "900", fontSize: 17 }}>Update status</Text>
        {statuses.map((status) => (
          <TouchableOpacity key={status} style={styles.secondaryButton} onPress={() => update(status)}>
            <Text style={styles.secondaryText}>{status}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
