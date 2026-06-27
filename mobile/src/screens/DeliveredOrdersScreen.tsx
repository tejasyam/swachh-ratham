import React, { useCallback, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { PickupCard } from "../components";
import { apiFetch } from "../api";
import { styles } from "../theme";
import { Pickup } from "../types";

const deliveredStatuses = new Set(["Collected", "Delivered", "Completed"]);

export default function DeliveredOrdersScreen() {
  // Admin history view filters all pickups down to completed/collected orders.
  const [orders, setOrders] = useState<Pickup[]>([]);

  async function load() {
    const pickups = await apiFetch<Pickup[]>("/pickups");
    setOrders(pickups.filter((pickup) => deliveredStatuses.has(pickup.status)));
  }

  useFocusEffect(useCallback(() => { load().catch(() => undefined); }, []));

  return (
    <FlatList
      style={styles.screen}
      data={orders}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <View>
          <Text style={styles.title}>Delivered orders</Text>
          <Text style={styles.subtitle}>Completed pickups and collected items appear here.</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.card}>
          <Text style={{ fontSize: 18, fontWeight: "900" }}>No delivered orders yet</Text>
          <Text style={styles.subtitle}>Orders will appear here after a pickup is marked collected, delivered, or completed.</Text>
        </View>
      }
      renderItem={({ item }) => <PickupCard pickup={item} />}
    />
  );
}
