import React, { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { StatCard } from "../components";
import { apiFetch } from "../api";
import { colors, styles } from "../theme";
import { AdminStats } from "../types";

export default function AnalyticsScreen() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useFocusEffect(useCallback(() => { apiFetch<AdminStats>("/admin/stats").then(setStats).catch(() => undefined); }, []));

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.title}>Analytics</Text>
      <Text style={styles.subtitle}>Live cards update after object uploads, pickup assignments, and collection rewards.</Text>
      <View style={styles.row}>
        <StatCard label="Reusable" value={stats?.reusable || 0} />
        <StatCard label="Repairable" value={stats?.repairable || 0} tone={colors.amber} />
      </View>
      <View style={styles.row}>
        <StatCard label="Recyclable" value={stats?.recyclable || 0} tone={colors.blue} />
        <StatCard label="Disposable" value={stats?.disposable || 0} tone={colors.danger} />
      </View>
      <View style={styles.row}>
        <StatCard label="EcoPoints issued" value={stats?.total_ecopoints || 0} />
        <StatCard label="Completed" value={stats?.completed_pickups || 0} />
      </View>
    </ScrollView>
  );
}
