import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, styles } from "../theme";

export default function SplashScreen({ navigation }: any) {
  useEffect(() => {
    const timer = setTimeout(() => navigation?.replace?.("Login"), 900);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
      <View style={{ width: 92, height: 92, borderRadius: 8, backgroundColor: colors.greenDark, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: colors.greenSoft }}>
        <Ionicons name="leaf" color={colors.white} size={48} />
      </View>
      <Text style={[styles.title, { marginTop: 18 }]}>Swachh Ratham</Text>
      <Text style={[styles.subtitle, { textAlign: "center" }]}>Circular economy pickups for unused household objects.</Text>
    </View>
  );
}
