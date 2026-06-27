import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ObjectCard } from "../components";
import { apiFetch } from "../api";
import { styles } from "../theme";
import { ObjectItem } from "../types";

export default function MyObjectsScreen({ navigation }: any) {
  // Citizen tracking list. Data reloads whenever the tab/screen regains focus.
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setObjects(await apiFetch<ObjectItem[]>("/objects"));
  }

  useFocusEffect(useCallback(() => { load().catch(() => undefined); }, []));

  async function refresh() {
    setRefreshing(true);
    await load().catch(() => undefined);
    setRefreshing(false);
  }

  return (
    <FlatList
      style={styles.screen}
      data={objects}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      ListHeaderComponent={<><Text style={styles.title}>My objects</Text><Text style={styles.subtitle}>Track classification, pickup, and collection status.</Text></>}
      renderItem={({ item }) => <ObjectCard item={item} onPress={() => navigation.navigate("ObjectDetails", { objectId: item.id })} />}
    />
  );
}
