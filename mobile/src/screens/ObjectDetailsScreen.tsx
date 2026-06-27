import React, { useEffect, useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import { PrimaryButton, StatusBadge } from "../components";
import { apiFetch } from "../api";
import { colors, styles } from "../theme";
import { ObjectItem } from "../types";

export default function ObjectDetailsScreen({ route, navigation }: any) {
  // Accept either a full object from navigation params or an id to fetch fresh.
  const [item, setItem] = useState<ObjectItem | null>(route.params?.object || null);
  const objectId = route.params?.objectId || item?.id;

  useEffect(() => {
    // Fetching on mount keeps details current after admin/driver status changes.
    if (objectId) {
      apiFetch<ObjectItem>(`/objects/${objectId}`).then(setItem).catch((error) => Alert.alert("Could not load object", error.message));
    }
  }, [objectId]);

  if (!item) {
    return <View style={styles.screen}><Text>Loading...</Text></View>;
  }

  return (
    <ScrollView style={styles.screen}>
      {item.image_url ? <Image source={{ uri: item.image_url }} style={{ height: 230, borderRadius: 18, backgroundColor: colors.line }} /> : null}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={{ fontSize: 24, fontWeight: "900", color: colors.dark, flex: 1 }}>{item.name}</Text>
          <StatusBadge value={item.classification} />
        </View>
        <Text style={styles.subtitle}>{item.description || "No description added."}</Text>
        <Text style={styles.label}>Quantity</Text>
        <Text style={{ color: colors.dark, marginTop: 6 }}>{item.quantity || 1}</Text>
        <Text style={styles.label}>Classification confidence</Text>
        <Text style={{ color: colors.dark, marginTop: 6 }}>{item.classification_confidence}%</Text>
        {item.classification_reason ? (
          <>
            <Text style={styles.label}>Why this category</Text>
            <Text style={{ color: colors.dark, marginTop: 6, lineHeight: 21 }}>{item.classification_reason}</Text>
          </>
        ) : null}
        <Text style={styles.label}>Object condition details</Text>
        <Text style={{ color: colors.dark, marginTop: 6, lineHeight: 21 }}>
          Material: {item.material || "Not specified"}{"\n"}
          Working: {item.working_condition || "Not specified"}{"\n"}
          Usable as-is: {item.usability || "Not specified"}{"\n"}
          Damage: {item.damage_level || "Not specified"}{"\n"}
          Hazardous: {item.hazardous ? "Yes" : "No"}
        </Text>
        <Text style={styles.label}>Preferred action</Text>
        <Text style={{ color: colors.dark, marginTop: 6 }}>{item.preferred_action}</Text>
        <Text style={styles.label}>Current status</Text>
        <Text style={{ color: colors.dark, marginTop: 6 }}>{item.status}</Text>
        <PrimaryButton title="Request pickup" onPress={() => navigation.navigate("PickupRequest", { object: item })} icon="car" />
      </View>
    </ScrollView>
  );
}
