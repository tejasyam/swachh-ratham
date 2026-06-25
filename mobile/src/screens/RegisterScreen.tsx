import React, { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { PrimaryButton } from "../components";
import { useAuth } from "../context/AuthContext";
import { colors, styles } from "../theme";

const roles = ["citizen", "admin", "driver"];

export default function RegisterScreen() {
  const { register, verifyOtp } = useAuth();
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("citizen");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    try {
      setLoading(true);
      if (otpSent) {
        await verifyOtp(identifier, otp);
        return;
      }
      const challenge = await register(name, identifier, password, role);
      setOtpSent(true);
      Alert.alert("OTP sent", `${challenge.message}${challenge.dev_otp ? `\nDemo OTP: ${challenge.dev_otp}` : ""}`);
    } catch (error: any) {
      Alert.alert("Registration failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Create your account, then verify it once with an OTP.</Text>
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} editable={!otpSent} />
      <Text style={styles.label}>Email or phone number</Text>
      <TextInput style={styles.input} value={identifier} onChangeText={setIdentifier} autoCapitalize="none" keyboardType="email-address" editable={!otpSent} />
      <Text style={styles.label}>Password</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry editable={!otpSent} />
      <Text style={styles.label}>Role</Text>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
        {roles.map((item) => (
          <TouchableOpacity key={item} onPress={() => !otpSent && setRole(item)} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: role === item ? colors.green : colors.card, borderWidth: 1, borderColor: role === item ? colors.greenDark : colors.line, opacity: otpSent ? 0.75 : 1 }}>
            <Text style={{ textAlign: "center", color: role === item ? colors.white : colors.dark, fontWeight: "800", textTransform: "capitalize" }}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {otpSent ? (
        <>
          <Text style={styles.label}>OTP</Text>
          <TextInput style={styles.input} value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} placeholder="Enter 6-digit OTP" />
        </>
      ) : null}
      <PrimaryButton title={otpSent ? "Verify OTP" : "Create account"} onPress={submit} loading={loading} icon={otpSent ? "shield-checkmark" : "person-add"} />
    </View>
  );
}
