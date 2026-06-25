import React, { useState } from "react";
import { Alert, Linking, Modal, ScrollView, Share, Text, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import LocationPicker from "../LocationPicker";
import { PICKUP_ADDRESS_HISTORY_KEY, PICKUP_ADDRESS_KEY, uniqueAddressHistory } from "../storage";
import { colors } from "../theme";

type IoniconName = keyof typeof Ionicons.glyphMap;
type AppearanceMode = "Light" | "Dark" | "System default";
const appearanceOptions: AppearanceMode[] = ["Light", "Dark", "System default"];

function ProfileTile({
  icon,
  label,
  dark,
  onPress
}: {
  icon: IoniconName;
  label: string;
  dark: boolean;
  onPress: () => void;
}) {
  const palette = getPalette(dark);
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 104,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.card,
        alignItems: "center",
        justifyContent: "center",
        gap: 10
      }}
    >
      <Ionicons name={icon} color={palette.icon} size={34} />
      <Text style={{ color: palette.text, fontSize: 15, fontWeight: "700" }}>{label}</Text>
    </TouchableOpacity>
  );
}

function ProfileRow({
  icon,
  label,
  dark,
  onPress,
  dot
}: {
  icon: IoniconName;
  label: string;
  dark: boolean;
  onPress?: () => void;
  dot?: boolean;
}) {
  const palette = getPalette(dark);
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 }}
    >
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: palette.iconBg,
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Ionicons name={icon} color={palette.icon} size={22} />
        {dot ? (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#ef4444",
              position: "absolute",
              top: 4,
              right: 5
            }}
          />
        ) : null}
      </View>
      <Text style={{ color: palette.text, fontSize: 18, fontWeight: "700" }}>{label}</Text>
    </TouchableOpacity>
  );
}

function getPalette(dark: boolean) {
  return {
    screen: dark ? "#121714" : "#ffffff",
    card: dark ? "#1b241f" : "#ffffff",
    border: dark ? "#2d3a33" : "#edf0ee",
    text: dark ? "#f4f7f3" : "#2f3430",
    muted: dark ? "#a9b5ad" : "#727b75",
    icon: dark ? "#e5eee8" : "#26313c",
    iconBg: dark ? "#253129" : "#f4f4f6",
    buttonBorder: dark ? colors.greenSoft : colors.green,
    chipBg: dark ? "#2f3a34" : "#f0f1f3",
    footer: dark ? "#56615a" : "#c7cbc8"
  };
}

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const systemScheme = useColorScheme();
  const [appearance, setAppearance] = useState<AppearanceMode>("Light");
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpQuery, setHelpQuery] = useState("");
  const [addressesOpen, setAddressesOpen] = useState(false);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [draftAddress, setDraftAddress] = useState("");
  const darkMode = appearance === "Dark" || (appearance === "System default" && systemScheme === "dark");
  const palette = getPalette(darkMode);
  const contact = user?.email || user?.phone || "No contact added";
  const pickupRoute = user?.role === "admin" ? "DeliveredOrders" : user?.role === "driver" ? "Pickups" : "Objects";
  const pickupLabel = user?.role === "admin" ? "Orders" : "My pickups";

  async function shareApp() {
    await Share.share({
      message: "Try Swachh Ratham for responsible household object disposal."
    });
  }

  function submitHelpQuery() {
    if (!helpQuery.trim()) {
      Alert.alert("Help query needed", "Please type your question before submitting.");
      return;
    }
    Alert.alert("Query submitted", "Your help request has been shared with the support team.");
    setHelpQuery("");
    setHelpOpen(false);
  }

  async function openAddresses() {
    const [currentAddress, savedHistory] = await Promise.all([
      AsyncStorage.getItem(PICKUP_ADDRESS_KEY),
      AsyncStorage.getItem(PICKUP_ADDRESS_HISTORY_KEY)
    ]);
    const history = savedHistory ? uniqueAddressHistory(JSON.parse(savedHistory)) : [];
    setAddresses(history);
    setDraftAddress(currentAddress || "");
    setAddressesOpen(true);
  }

  async function saveAddress() {
    const cleanAddress = draftAddress.trim();
    if (!cleanAddress) {
      Alert.alert("Address needed", "Select or type an address before saving.");
      return;
    }
    const nextAddresses = uniqueAddressHistory([cleanAddress, ...addresses]);
    setAddresses(nextAddresses);
    await AsyncStorage.setItem(PICKUP_ADDRESS_KEY, cleanAddress);
    await AsyncStorage.setItem(PICKUP_ADDRESS_HISTORY_KEY, JSON.stringify(nextAddresses));
    Alert.alert("Address saved", "This pickup address has been saved.");
  }

  async function removeAddress(address: string) {
    const nextAddresses = addresses.filter((item) => item !== address);
    setAddresses(nextAddresses);
    await AsyncStorage.setItem(PICKUP_ADDRESS_HISTORY_KEY, JSON.stringify(nextAddresses));
    const currentAddress = await AsyncStorage.getItem(PICKUP_ADDRESS_KEY);
    if (currentAddress === address) {
      await AsyncStorage.removeItem(PICKUP_ADDRESS_KEY);
      setDraftAddress("");
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.screen }}
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 48, paddingBottom: 132 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 46 }}>
        <Text style={{ color: palette.text, fontSize: 20, fontWeight: "800" }}>Profile</Text>
      </View>

      <Text style={{ color: palette.text, fontSize: 30, fontWeight: "900", letterSpacing: 0 }}>Your account</Text>
      <Text style={{ color: palette.muted, fontSize: 16, marginTop: 10, lineHeight: 23 }}>
        {user?.name ? `${user.name} - ${contact}` : "Log in or sign up to view your complete profile"}
      </Text>

      <TouchableOpacity
        activeOpacity={0.82}
        onPress={logout}
        style={{
          height: 70,
          borderRadius: 12,
          borderWidth: 1.4,
          borderColor: palette.buttonBorder,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 18
        }}
      >
        <Text style={{ color: colors.green, fontSize: 20, fontWeight: "800" }}>Logout</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: "row", gap: 22, marginTop: 36 }}>
        <ProfileTile
          icon="help-circle-outline"
          label="Help"
          dark={darkMode}
          onPress={() => setHelpOpen((value) => !value)}
        />
        <ProfileTile
          icon="leaf-outline"
          label="EcoPoints"
          dark={darkMode}
          onPress={() => Alert.alert("EcoPoints", `Current balance: ${user?.ecopoints || 0}`)}
        />
      </View>
      {helpOpen ? (
        <View
          style={{
            borderRadius: 18,
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: palette.card,
            marginTop: 14,
            padding: 18
          }}
        >
          <Text style={{ color: palette.text, fontSize: 18, fontWeight: "900" }}>How can we help?</Text>
          <TextInput
            style={{
              minHeight: 104,
              borderWidth: 1,
              borderColor: palette.border,
              borderRadius: 12,
              color: palette.text,
              backgroundColor: darkMode ? "#131b17" : "#fbfcfb",
              padding: 14,
              marginTop: 12,
              textAlignVertical: "top",
              fontSize: 16
            }}
            value={helpQuery}
            onChangeText={setHelpQuery}
            placeholder="Type your query here"
            placeholderTextColor={palette.muted}
            multiline
          />
          <TouchableOpacity
            activeOpacity={0.84}
            onPress={submitHelpQuery}
            style={{
              minHeight: 52,
              borderRadius: 12,
              backgroundColor: colors.green,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 12
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "900" }}>Submit</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => setAppearanceOpen((value) => !value)}
        style={{
          minHeight: 80,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.card,
          marginTop: 20,
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: palette.iconBg,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16
          }}
        >
          <Ionicons name={darkMode ? "moon-outline" : "sunny-outline"} color={palette.icon} size={26} />
        </View>
        <Text style={{ color: palette.text, fontSize: 21, fontWeight: "700", flex: 1 }}>Appearance</Text>
        <View style={{ backgroundColor: palette.chipBg, borderRadius: 7, paddingHorizontal: 12, paddingVertical: 7 }}>
          <Text style={{ color: palette.muted, fontSize: 16, fontWeight: "700" }}>{appearance}</Text>
        </View>
        <Ionicons name={appearanceOpen ? "chevron-up" : "chevron-down"} color={palette.icon} size={24} style={{ marginLeft: 18 }} />
      </TouchableOpacity>
      {appearanceOpen ? (
        <View
          style={{
            borderRadius: 18,
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: palette.card,
            marginTop: 8,
            overflow: "hidden"
          }}
        >
          {appearanceOptions.map((option) => {
            const selected = appearance === option;
            return (
              <TouchableOpacity
                key={option}
                activeOpacity={0.82}
                onPress={() => {
                  setAppearance(option);
                  setAppearanceOpen(false);
                }}
                style={{
                  minHeight: 54,
                  paddingHorizontal: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  borderTopWidth: option === "Light" ? 0 : 1,
                  borderTopColor: palette.border,
                  backgroundColor: selected ? palette.chipBg : palette.card
                }}
              >
                <Text style={{ color: palette.text, fontSize: 17, fontWeight: selected ? "900" : "700", flex: 1 }}>
                  {option}
                </Text>
                {selected ? <Ionicons name="checkmark" color={colors.green} size={22} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      <Text style={{ color: palette.muted, fontSize: 14, fontWeight: "700", marginTop: 42, marginBottom: 18 }}>
        YOUR INFORMATION
      </Text>
      <ProfileRow icon="car-outline" label={pickupLabel} dark={darkMode} onPress={() => navigation.navigate(pickupRoute)} />

      <Text style={{ color: palette.muted, fontSize: 14, fontWeight: "700", marginTop: 34, marginBottom: 18 }}>
        OTHER INFORMATION
      </Text>
      <ProfileRow icon="share-social-outline" label="Share the app" dark={darkMode} onPress={shareApp} />
      <ProfileRow icon="information-circle-outline" label="About us" dark={darkMode} onPress={() => Linking.openURL("https://www.restsolutions.org/")} />

      <View style={{ alignItems: "center", marginTop: 34 }}>
        <Text style={{ color: palette.footer, fontSize: 28, fontWeight: "900" }}>swachh ratham</Text>
        <Text style={{ color: palette.footer, fontSize: 14, marginTop: 4 }}>v1.0.0</Text>
      </View>
      <Modal visible={addressesOpen} transparent animationType="slide" onRequestClose={() => setAddressesOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: palette.screen, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 18, maxHeight: "90%" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={{ color: palette.text, fontSize: 22, fontWeight: "900", flex: 1 }}>Pickup addresses</Text>
              <TouchableOpacity onPress={() => setAddressesOpen(false)}>
                <Ionicons name="close" color={palette.text} size={26} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 10 }} keyboardShouldPersistTaps="handled">
              {addresses.length ? addresses.map((address) => (
                <View
                  key={address}
                  style={{
                    borderWidth: 1,
                    borderColor: draftAddress === address ? colors.green : palette.border,
                    backgroundColor: draftAddress === address ? colors.greenSoft : palette.card,
                    borderRadius: 12,
                    padding: 12,
                    marginTop: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10
                  }}
                >
                  <TouchableOpacity activeOpacity={0.82} onPress={() => setDraftAddress(address)} style={{ flex: 1 }}>
                    <Text numberOfLines={2} style={{ color: colors.dark, fontWeight: "800" }}>{address.split("\n")[0]}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeAddress(address)}>
                    <Ionicons name="trash-outline" color={colors.danger} size={22} />
                  </TouchableOpacity>
                </View>
              )) : (
                <Text style={{ color: palette.muted, marginTop: 12 }}>No saved pickup addresses yet.</Text>
              )}
              <LocationPicker address={draftAddress} onAddressChange={setDraftAddress} />
              <Text style={{ color: palette.text, fontWeight: "800", marginTop: 14 }}>Address</Text>
              <TextInput
                style={{
                  minHeight: 84,
                  borderWidth: 1,
                  borderColor: palette.border,
                  borderRadius: 12,
                  color: palette.text,
                  backgroundColor: palette.card,
                  padding: 14,
                  marginTop: 10,
                  textAlignVertical: "top",
                  fontSize: 16
                }}
                value={draftAddress}
                onChangeText={setDraftAddress}
                multiline
              />
              <TouchableOpacity
                activeOpacity={0.84}
                onPress={saveAddress}
                style={{
                  minHeight: 52,
                  borderRadius: 12,
                  backgroundColor: colors.green,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 12,
                  marginBottom: 12
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "900" }}>Save address</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
