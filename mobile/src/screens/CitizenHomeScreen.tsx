import React, { useCallback, useState } from "react";
import { Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { PrimaryButton, StatCard, StatusBadge } from "../components";
import LocationPicker from "../LocationPicker";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { PICKUP_ADDRESS_HISTORY_KEY, PICKUP_ADDRESS_KEY, uniqueAddressHistory } from "../storage";
import { colors, styles } from "../theme";
import { ObjectItem, Pickup } from "../types";

export default function CitizenHomeScreen({ navigation }: any) {
  const { user, refreshMe } = useAuth();
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [pickupAddress, setPickupAddress] = useState("");
  const [addressHistory, setAddressHistory] = useState<string[]>([]);
  const [draftAddress, setDraftAddress] = useState("");
  const [selectedPastAddress, setSelectedPastAddress] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const currentPickup = pickups.find((pickup) => !["Collected", "Delivered", "Completed", "Cancelled"].includes(pickup.status)) || pickups[0];
  const pickupStatus = currentPickup?.status || "None";
  const addressPreview = pickupAddress.split("\n")[0] || "Select pickup location";

  async function load() {
    const [objectData, pickupData] = await Promise.all([
      apiFetch<ObjectItem[]>("/objects"),
      apiFetch<Pickup[]>("/pickups")
    ]);
    setObjects(objectData);
    setPickups(pickupData);
    const savedAddress = await AsyncStorage.getItem(PICKUP_ADDRESS_KEY);
    if (savedAddress) {
      setPickupAddress(savedAddress);
    }
    const savedHistory = await AsyncStorage.getItem(PICKUP_ADDRESS_HISTORY_KEY);
    if (savedHistory) {
      setAddressHistory(uniqueAddressHistory(JSON.parse(savedHistory)));
    }
    await refreshMe();
  }

  useFocusEffect(useCallback(() => { load().catch(() => undefined); }, []));

  async function refresh() {
    setRefreshing(true);
    await load().catch(() => undefined);
    setRefreshing(false);
  }

  function openAddressEditor() {
    setDraftAddress(pickupAddress);
    setSelectedPastAddress(false);
    setAddressOpen(true);
  }

  async function saveAddress() {
    const value = draftAddress.trim();
    setPickupAddress(value);
    if (value) {
      await AsyncStorage.setItem(PICKUP_ADDRESS_KEY, value);
      const nextHistory = uniqueAddressHistory([value, ...addressHistory]);
      setAddressHistory(nextHistory);
      await AsyncStorage.setItem(PICKUP_ADDRESS_HISTORY_KEY, JSON.stringify(nextHistory));
    } else {
      await AsyncStorage.removeItem(PICKUP_ADDRESS_KEY);
    }
    setAddressOpen(false);
  }

  function selectPastAddress(address: string) {
    setDraftAddress(address);
    setSelectedPastAddress(true);
  }

  return (
    <ScrollView style={styles.screen} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 18 }}>
        <TouchableOpacity activeOpacity={0.82} onPress={openAddressEditor} style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ color: colors.dark, fontSize: 13, fontWeight: "900" }}>Pickup in</Text>
          <Text style={{ color: colors.dark, fontSize: 30, fontWeight: "900", marginTop: 2 }}>30 minutes</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
            <Text numberOfLines={1} style={{ color: colors.dark, fontSize: 16, flex: 1 }}>{addressPreview}</Text>
            <Ionicons name="chevron-down" color={colors.dark} size={18} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.84}
          onPress={() => navigation.navigate("Profile")}
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.line,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Ionicons name="person" color={colors.dark} size={28} />
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <StatCard label="EcoPoints" value={user?.ecopoints || 0} />
        <StatCard label="Objects" value={objects.length} tone={colors.blue} />
      </View>
      <View style={styles.row}>
        <StatCard label="Pickups" value={pickups.length} tone={colors.amber} />
        <StatCard label="Status" value={pickupStatus} tone={colors.teal} />
      </View>
      <PrimaryButton title="Add unused object" onPress={() => navigation.navigate("Add")} icon="camera" />
      <PrimaryButton title="Track my objects" onPress={() => navigation.navigate("Objects")} icon="list" />
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={{ color: colors.dark, fontSize: 18, fontWeight: "900", flex: 1 }}>Current objects</Text>
          <Text style={{ color: colors.muted, fontWeight: "800" }}>{objects.length}</Text>
        </View>
        {objects.length === 0 ? (
          <Text style={styles.subtitle}>No objects added yet.</Text>
        ) : (
          objects.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.line,
                paddingTop: 12,
                marginTop: 12
              }}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("ObjectDetails", { objectId: item.id })}
            >
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.dark, fontSize: 16, fontWeight: "900" }}>{item.name}</Text>
                  <Text style={{ color: colors.muted, marginTop: 4 }}>Qty {item.quantity || 1} - {item.category} - {item.condition}</Text>
                </View>
                <StatusBadge value={item.classification} />
              </View>
              <Text style={{ color: colors.dark, marginTop: 8, fontWeight: "800" }}>Status: {item.status}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
      <Modal visible={addressOpen} transparent animationType="slide" onRequestClose={() => setAddressOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 18, maxHeight: "88%" }}>
            <View style={styles.row}>
              <Text style={{ color: colors.dark, fontSize: 22, fontWeight: "900", flex: 1 }}>Set pickup location</Text>
              <TouchableOpacity onPress={() => setAddressOpen(false)}>
                <Ionicons name="close" color={colors.dark} size={26} />
              </TouchableOpacity>
            </View>
            {addressHistory.length ? (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.label}>Past addresses</Text>
                {addressHistory.map((address) => (
                  <TouchableOpacity
                    key={address}
                    activeOpacity={0.82}
                    onPress={() => selectPastAddress(address)}
                    style={{
                      borderWidth: 1,
                      borderColor: draftAddress === address ? colors.green : colors.line,
                      backgroundColor: draftAddress === address ? colors.greenSoft : colors.card,
                      borderRadius: 8,
                      padding: 12,
                      marginTop: 8
                    }}
                  >
                    <Text numberOfLines={2} style={{ color: colors.dark, fontWeight: "800" }}>{address.split("\n")[0]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            <LocationPicker address={draftAddress} onAddressChange={(value) => { setDraftAddress(value); setSelectedPastAddress(false); }} />
            <Text style={styles.label}>Pickup address</Text>
            <TextInput
              style={[styles.input, { minHeight: 84, textAlignVertical: "top" }]}
              value={draftAddress}
              onChangeText={setDraftAddress}
              multiline
            />
            <PrimaryButton title={selectedPastAddress ? "Choose location" : "Save pickup location"} onPress={saveAddress} icon="location" />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
