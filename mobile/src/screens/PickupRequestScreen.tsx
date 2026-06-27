import React, { useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { PrimaryButton, StatusBadge } from "../components";
import LocationPicker from "../LocationPicker";
import { apiFetch } from "../api";
import { styles } from "../theme";
import { Pickup } from "../types";

export default function PickupRequestScreen({ route, navigation }: any) {
  // Final confirmation screen for a single classified object pickup.
  const object = route.params?.object;
  const [address, setAddress] = useState(route.params?.address || "");
  const [loading, setLoading] = useState(false);

  async function submit() {
    // Creates the pickup request and returns the citizen to the object tracker.
    try {
      setLoading(true);
      const pickup = await apiFetch<Pickup>("/pickups/request", {
        method: "POST",
        body: JSON.stringify({ object_id: object.id, address })
      });
      Alert.alert("Pickup requested", `Request #${pickup.id} is pending admin assignment.`);
      navigation.navigate("Objects");
    } catch (error: any) {
      Alert.alert("Request failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.screen} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 28 }}>
      <Text style={styles.title}>Pickup request</Text>
      <Text style={styles.subtitle}>Confirm pickup location for this classified object.</Text>
      <View style={styles.card}>
        <Text style={{ fontSize: 20, fontWeight: "900" }}>{object?.name}</Text>
        <StatusBadge value={object?.classification || "Classified"} />
        <Text style={styles.label}>Pickup pin</Text>
        <LocationPicker address={address} onAddressChange={setAddress} />
        <Text style={styles.label}>Pickup address</Text>
        <TextInput style={[styles.input, { minHeight: 110, textAlignVertical: "top" }]} value={address} onChangeText={setAddress} multiline />
        <PrimaryButton title="Request pickup" onPress={submit} loading={loading} icon="send" />
      </View>
    </ScrollView>
  );
}
