import React, { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import MapView, { Marker, Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

import { apiFetch } from "../api";
import { PickupCard, StatCard, StatusBadge } from "../components";
import { colors, styles } from "../theme";
import { Pickup } from "../types";

const DEFAULT_REGION: Region = {
  latitude: 17.385,
  longitude: 78.4867,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18
};

function addressToCoordinate(address: string, index: number) {
  // The backend currently stores addresses, not coordinates. This deterministic
  // hash gives every pickup a stable demo marker near the default region.
  let hash = 0;
  const source = address || `pickup-${index}`;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) % 100000;
  }

  const latOffset = ((hash % 900) - 450) / 10000;
  const lngOffset = (((Math.floor(hash / 7) + index * 113) % 900) - 450) / 10000;

  return {
    latitude: DEFAULT_REGION.latitude + latOffset,
    longitude: DEFAULT_REGION.longitude + lngOffset
  };
}

function markerColor(status: string) {
  // Marker colors match operational urgency: pending, active, complete, failed.
  if (status === "Collected" || status === "Delivered" || status === "Completed") return colors.green;
  if (status === "Assigned" || status === "Accepted" || status === "On the way") return colors.blue;
  if (status === "Cancelled") return colors.danger;
  return colors.amber;
}

export default function AdminPickupMapScreen({ navigation }: any) {
  // Admin map combines a spatial overview with the same pickup list below it.
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [selected, setSelected] = useState<Pickup | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const data = await apiFetch<Pickup[]>("/pickups");
    setPickups(data);
    setSelected((current) => data.find((pickup) => pickup.id === current?.id) || data[0] || null);
  }

  useFocusEffect(
    useCallback(() => {
      load().catch(() => undefined);
    }, [])
  );

  async function refresh() {
    setRefreshing(true);
    await load().catch(() => undefined);
    setRefreshing(false);
  }

  const mappedPickups = useMemo(
    // Memoize fake coordinates so markers do not jump during re-renders.
    () =>
      pickups.map((pickup, index) => ({
        ...pickup,
        coordinate: addressToCoordinate(pickup.address, index)
      })),
    [pickups]
  );

  const pendingCount = pickups.filter((pickup) =>
    ["Pending", "Assigned", "Accepted", "On the way"].includes(pickup.status)
  ).length;
  const completedCount = pickups.filter((pickup) =>
    ["Collected", "Delivered", "Completed"].includes(pickup.status)
  ).length;

  return (
    <FlatList
      style={[styles.screen, { padding: 0 }]}
      data={mappedPickups}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      contentContainerStyle={{ paddingBottom: 28 }}
      ListHeaderComponent={
        <View>
          <View style={{ padding: 18, paddingBottom: 8 }}>
            <Text style={styles.title}>Pickup map</Text>
            <Text style={styles.subtitle}>See every pickup request in one operational view.</Text>
          </View>

          <View style={{ height: 260, marginHorizontal: 18, borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: colors.line }}>
            <MapView
              style={{ flex: 1 }}
              initialRegion={DEFAULT_REGION}
              showsUserLocation={false}
              showsCompass
              toolbarEnabled
            >
              {mappedPickups.map((pickup) => (
                <Marker
                  key={pickup.id}
                  coordinate={pickup.coordinate}
                  pinColor={markerColor(pickup.status)}
                  title={pickup.object?.name || `Pickup #${pickup.id}`}
                  description={`${pickup.status} - ${pickup.address}`}
                  onPress={() => setSelected(pickup)}
                />
              ))}
            </MapView>
          </View>

          <View style={{ paddingHorizontal: 18 }}>
            <View style={styles.row}>
              <StatCard label="All pickups" value={pickups.length} />
              <StatCard label="Pending" value={pendingCount} tone={colors.amber} />
              <StatCard label="Done" value={completedCount} tone={colors.blue} />
            </View>

            {selected ? (
              <View style={styles.card}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.dark, fontSize: 18, fontWeight: "900" }}>
                      {selected.object?.name || `Pickup #${selected.id}`}
                    </Text>
                    <Text style={{ color: colors.muted, marginTop: 4 }}>
                      {selected.citizen?.name || "Citizen"} - {selected.driver?.name || "Unassigned"}
                    </Text>
                  </View>
                  <StatusBadge value={selected.status} />
                </View>
                <Text style={{ color: colors.dark, marginTop: 10, lineHeight: 21 }}>{selected.address}</Text>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => navigation.navigate("PickupManagement")}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="briefcase" color={colors.teal} size={18} />
                    <Text style={styles.secondaryText}>Manage this pickup</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : null}

            <Text style={[styles.label, { marginBottom: 2 }]}>All pickup orders</Text>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 18 }}>
          <PickupCard pickup={item} onPress={() => setSelected(item)} />
        </View>
      )}
    />
  );
}
