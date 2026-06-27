import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PrimaryButton } from "../components";
import { useAuth } from "../context/AuthContext";
import { colors, styles } from "../theme";

export default function LoginScreen({ navigation }: any) {
  // Login defaults to the seeded citizen account so demo testing is fast.
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("citizen@swachhratham.com");
  const [password, setPassword] = useState("citizen123");
  const [loading, setLoading] = useState(false);

  async function submit() {
    // AuthContext stores the returned JWT and switches navigation by role.
    try {
      setLoading(true);
      await login(identifier, password);
    } catch (error: any) {
      Alert.alert("Login failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.screen, { justifyContent: "center" }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: colors.greenSoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line }}>
          <Ionicons name="leaf" color={colors.green} size={30} />
        </View>
        <Text style={styles.title}>Swachh Ratham</Text>
      </View>
      <Text style={styles.subtitle}>Sign in as citizen, admin, or driver to run the prototype flow.</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Email or phone number</Text>
        <TextInput style={styles.input} value={identifier} onChangeText={setIdentifier} autoCapitalize="none" keyboardType="email-address" />
        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
        <PrimaryButton title="Login" onPress={submit} loading={loading} icon="log-in" />
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Register")}>
          <Text style={styles.secondaryText}>Create citizen account</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.subtitle, { fontSize: 13 }]}>Demo: admin@swachhratham.com / admin123, driver@swachhratham.com / driver123</Text>
    </KeyboardAvoidingView>
  );
}
