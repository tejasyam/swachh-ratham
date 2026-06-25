import React, { useCallback, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { PickupCard } from "../components";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { colors, styles } from "../theme";
import { Pickup } from "../types";

export default function DriverDashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [pickups, setPickups] = useState<Pickup[]>([]);

  async function load() {
    if (user) {
      setPickups(await apiFetch<Pickup[]>(`/drivers/${user.id}/pickups`));
    }
  }

  useFocusEffect(useCallback(() => { load().catch(() => undefined); }, [user?.id]));

  return (
    <FlatList
      style={styles.screen}
      data={pickups}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.title}>Assigned pickups</Text>
            <Text style={styles.subtitle}>Accept trips, move to collection, and reward citizens automatically.</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.84}
            onPress={() => navigation.navigate("Profile")}
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.line,
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Ionicons name="person" color={colors.dark} size={26} />
          </TouchableOpacity>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.card}>
          <Text style={{ fontSize: 18, fontWeight: "900" }}>No assigned pickups yet</Text>
          <Text style={styles.subtitle}>Ask the admin to assign a pending pickup to this driver account. Assigned pickups will appear here automatically.</Text>
        </View>
      }
      renderItem={({ item }) => <PickupCard pickup={item} onPress={() => navigation.navigate("AssignedPickupDetails", { pickup: item })} />}
    />
  );
}
