import React from "react";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, styles } from "./theme";
import { ObjectItem, Pickup } from "./types";

export function PrimaryButton({
  title,
  onPress,
  loading,
  icon,
  disabled
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { borderWidth: 1, borderColor: disabled ? colors.line : colors.greenDark },
        disabled ? { backgroundColor: colors.muted, opacity: 0.65 } : null
      ]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {icon ? <Ionicons name={icon} color={colors.white} size={19} /> : null}
          <Text style={styles.buttonText}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const badgeColors: Record<string, { bg: string; text: string }> = {
    Reusable: { bg: colors.greenSoft, text: colors.greenDark },
    Repairable: { bg: colors.amberSoft, text: colors.clay },
    Recyclable: { bg: colors.blueSoft, text: colors.blue },
    Disposable: { bg: colors.dangerSoft, text: colors.danger },
    Pending: { bg: colors.amberSoft, text: colors.amber },
    Collected: { bg: colors.tealSoft, text: colors.teal },
    Delivered: { bg: colors.greenSoft, text: colors.greenDark }
  };
  const tone = badgeColors[value] || { bg: colors.tealSoft, text: colors.teal };
  return <Text style={[styles.badge, { backgroundColor: tone.bg, color: tone.text }]}>{value}</Text>;
}

export function StatCard({ label, value, tone = colors.green }: { label: string; value: string | number; tone?: string }) {
  return (
    <View style={[styles.card, { flex: 1, minHeight: 96, borderTopWidth: 4, borderTopColor: tone }]}>
      <Text style={{ color: colors.muted, fontWeight: "700" }}>{label}</Text>
      <Text style={{ color: tone, fontSize: 25, fontWeight: "900", marginTop: 8 }}>{value}</Text>
    </View>
  );
}

export function ObjectCard({ item, onPress }: { item: ObjectItem; onPress?: () => void }) {
  const quantityLabel = `Qty ${item.quantity || 1}`;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.dark, fontSize: 17, fontWeight: "900" }}>{item.name}</Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>{quantityLabel} - {item.category} - {item.condition}</Text>
        </View>
        <StatusBadge value={item.classification} />
      </View>
      {item.image_url ? (
        <Image key={`${item.id}-${item.image_url.length}`} source={{ uri: item.image_url }} style={{ height: 150, borderRadius: 14, marginTop: 12, backgroundColor: colors.line }} />
      ) : null}
      <Text style={{ color: colors.dark, marginTop: 10, fontWeight: "700" }}>{item.status}</Text>
    </TouchableOpacity>
  );
}

export function PickupCard({ pickup, onPress }: { pickup: Pickup; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.row}>
        <Text style={{ color: colors.dark, fontSize: 17, fontWeight: "900", flex: 1 }}>
          {pickup.object?.name || `Pickup #${pickup.id}`}
        </Text>
        <StatusBadge value={pickup.status} />
      </View>
      <Text style={{ color: colors.muted, marginTop: 8 }}>{pickup.address}</Text>
      <Text style={{ color: colors.dark, marginTop: 8, fontWeight: "700" }}>
        Driver: {pickup.driver?.name || pickup.driver_id || "Unassigned"}
      </Text>
      {pickup.ecopoints_awarded ? (
        <Text style={{ color: colors.greenDark, marginTop: 8, fontWeight: "900" }}>
          EcoPoints awarded: {pickup.ecopoints_awarded}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}
