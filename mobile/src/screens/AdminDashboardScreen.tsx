import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { PrimaryButton, StatCard } from "../components";
import { apiFetch } from "../api";
import { colors, styles } from "../theme";
import { AdminStats } from "../types";

export default function AdminDashboardScreen({ navigation }: any) {
  // Admin landing page with live operational counters and shortcuts.
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setStats(await apiFetch<AdminStats>("/admin/stats"));
  }

  useFocusEffect(useCallback(() => { load().catch(() => undefined); }, []));

  async function refresh() {
    setRefreshing(true);
    await load().catch(() => undefined);
    setRefreshing(false);
  }

  return (
    <ScrollView style={styles.screen} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <Text style={styles.title}>Operations</Text>
      <Text style={styles.subtitle}>Monitor circular economy flow and assign pickups to drivers.</Text>
      <View style={styles.row}>
        <StatCard label="Users" value={stats?.total_users || 0} />
        <StatCard label="Objects" value={stats?.total_objects || 0} tone={colors.blue} />
      </View>
      <View style={styles.row}>
        <StatCard label="Pending" value={stats?.pending_pickups || 0} tone={colors.amber} />
        <StatCard label="Completed" value={stats?.completed_pickups || 0} />
      </View>
      <PrimaryButton title="Manage pickups" onPress={() => navigation.navigate("PickupManagement")} icon="briefcase" />
      <PrimaryButton title="Map view" onPress={() => navigation.navigate("AdminPickupMap")} icon="map" />
      <PrimaryButton title="Analytics" onPress={() => navigation.navigate("Analytics")} icon="bar-chart" />
      <PrimaryButton title="Profile" onPress={() => navigation.navigate("Profile")} icon="person" />
    </ScrollView>
  );
}
