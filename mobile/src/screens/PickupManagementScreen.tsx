import React, { useCallback, useState } from "react";
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { PickupCard, PrimaryButton } from "../components";
import { apiFetch } from "../api";
import { colors, styles } from "../theme";
import { Pickup } from "../types";

type PickupGroup = {
  key: string;
  pickups: Pickup[];
  isBulk: boolean;
};

function groupPickups(pickups: Pickup[]): PickupGroup[] {
  const groups = new Map<string, Pickup[]>();
  pickups.forEach((pickup) => {
    const key = pickup.bulk_group_id || `single-${pickup.id}`;
    groups.set(key, [...(groups.get(key) || []), pickup]);
  });
  return Array.from(groups.entries()).map(([key, items]) => ({
    key,
    pickups: items,
    isBulk: Boolean(items[0]?.bulk_group_id && items.length > 1)
  }));
}

export default function PickupManagementScreen() {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [driverId, setDriverId] = useState("3");
  const [selectedGroup, setSelectedGroup] = useState<PickupGroup | null>(null);
  const pickupGroups = groupPickups(pickups);

  async function load() {
    setPickups(await apiFetch<Pickup[]>("/pickups"));
  }

  useFocusEffect(useCallback(() => { load().catch(() => undefined); }, []));

  async function assign() {
    if (!selectedGroup) return;
    const firstPickup = selectedGroup.pickups[0];
    try {
      const path = selectedGroup.isBulk && firstPickup.bulk_group_id
        ? `/pickups/bulk/${firstPickup.bulk_group_id}/assign`
        : `/pickups/${firstPickup.id}/assign`;
      await apiFetch<Pickup | Pickup[]>(path, {
        method: "PUT",
        body: JSON.stringify({ driver_id: Number(driverId) })
      });
      Alert.alert("Assigned", selectedGroup.isBulk ? "Bulk pickup assigned to driver." : "Pickup assigned to driver.");
      setSelectedGroup(null);
      await load();
    } catch (error: any) {
      Alert.alert("Assignment failed", error.message);
    }
  }

  async function updateStatus(status: string) {
    if (!selectedGroup) return;
    const firstPickup = selectedGroup.pickups[0];
    try {
      await apiFetch<Pickup>(`/pickups/${firstPickup.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, note: `Admin marked ${status}` })
      });
      await load();
      setSelectedGroup(null);
    } catch (error: any) {
      Alert.alert("Update failed", error.message);
    }
  }

  return (
    <FlatList
      style={styles.screen}
      data={pickupGroups}
      keyExtractor={(item) => item.key}
      ListHeaderComponent={
        <View>
          <Text style={styles.title}>Pickup requests</Text>
          <Text style={styles.subtitle}>Tap a request or bulk group to assign the seeded driver or update status.</Text>
          {selectedGroup ? (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={{ color: colors.dark, fontWeight: "900", fontSize: 17 }}>
                  {selectedGroup.isBulk ? `Bulk order (${selectedGroup.pickups.length} objects)` : `Selected #${selectedGroup.pickups[0].id}`}
                </Text>
                <TouchableOpacity onPress={() => setSelectedGroup(null)}><Ionicons name="close" color={colors.muted} size={24} /></TouchableOpacity>
              </View>
              <Text style={styles.label}>Driver ID</Text>
              <TextInput style={styles.input} value={driverId} onChangeText={setDriverId} keyboardType="number-pad" />
              <PrimaryButton title={selectedGroup.isBulk ? "Assign driver to bulk order" : "Assign driver"} onPress={assign} icon="person-add" />
              <View style={{ flexDirection: "row", gap: 8 }}>
                {["Collected", "Delivered"].map((status) => (
                  <TouchableOpacity key={status} style={[styles.secondaryButton, { flex: 1 }]} onPress={() => updateStatus(status)}>
                    <Text style={styles.secondaryText}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      }
      renderItem={({ item }) => {
        const firstPickup = item.pickups[0];
        if (!item.isBulk) {
          return <PickupCard pickup={firstPickup} onPress={() => setSelectedGroup(item)} />;
        }
        return (
          <TouchableOpacity style={styles.card} activeOpacity={0.82} onPress={() => setSelectedGroup(item)}>
            <View style={styles.row}>
              <Text style={{ color: colors.dark, fontSize: 17, fontWeight: "900", flex: 1 }}>Bulk order</Text>
              <Text style={styles.badge}>{item.pickups.length} objects</Text>
            </View>
            <Text style={{ color: colors.muted, marginTop: 8 }}>{firstPickup.address}</Text>
            <Text style={{ color: colors.dark, marginTop: 8, fontWeight: "700" }}>
              Citizen: {firstPickup.citizen?.name || `#${firstPickup.user_id}`}
            </Text>
            <Text style={{ color: colors.dark, marginTop: 8, fontWeight: "700" }}>
              Driver: {firstPickup.driver?.name || firstPickup.driver_id || "Unassigned"}
            </Text>
            <View style={{ marginTop: 10 }}>
              {item.pickups.slice(0, 3).map((pickup) => (
                <Text key={pickup.id} style={{ color: colors.muted, marginTop: 3 }}>
                  {pickup.object?.name || `Object #${pickup.object_id}`} - {pickup.status}
                </Text>
              ))}
              {item.pickups.length > 3 ? <Text style={{ color: colors.muted, marginTop: 3 }}>+{item.pickups.length - 3} more</Text> : null}
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}
