import React, { useEffect, useState } from "react";
import { Alert, Image, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { PrimaryButton } from "../components";
import LocationPicker from "../LocationPicker";
import { apiFetch } from "../api";
import { PICKUP_ADDRESS_HISTORY_KEY, PICKUP_ADDRESS_KEY, uniqueAddressHistory } from "../storage";
import { colors, styles } from "../theme";
import { ObjectItem } from "../types";

function ChoiceGroup({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {options.map((option) => {
          const selected = value === option;
          return (
            <TouchableOpacity
              key={option}
              onPress={() => onChange(option)}
              activeOpacity={0.82}
              style={{
                backgroundColor: selected ? colors.green : colors.tealSoft,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: selected ? colors.greenDark : colors.line,
                paddingHorizontal: 12,
                paddingVertical: 9
              }}
            >
              <Text style={{ color: selected ? colors.white : colors.teal, fontWeight: "900" }}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

export default function AddObjectScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [category, setCategory] = useState("furniture");
  const [condition, setCondition] = useState("good");
  const [material, setMaterial] = useState("wood");
  const [workingCondition, setWorkingCondition] = useState("working");
  const [usability, setUsability] = useState("yes");
  const [damageLevel, setDamageLevel] = useState("none");
  const [hazardous, setHazardous] = useState(false);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [addressHistory, setAddressHistory] = useState<string[]>([]);
  const [image, setImage] = useState<string | undefined>();
  const [bulkMode, setBulkMode] = useState(false);
  const [cart, setCart] = useState<ObjectItem[]>([]);
  const [editingCartItemId, setEditingCartItemId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(PICKUP_ADDRESS_KEY),
      AsyncStorage.getItem(PICKUP_ADDRESS_HISTORY_KEY)
    ])
      .then(([savedAddress, savedHistory]) => {
        if (savedAddress) {
          setAddress(savedAddress);
        }
        if (savedHistory) {
          setAddressHistory(uniqueAddressHistory(JSON.parse(savedHistory)));
        }
      })
      .catch(() => undefined);
  }, []);

  async function rememberAddress(value: string) {
    const cleanAddress = value.trim();
    if (!cleanAddress) return;
    const nextHistory = uniqueAddressHistory([cleanAddress, ...addressHistory]);
    setAddressHistory(nextHistory);
    await AsyncStorage.setItem(PICKUP_ADDRESS_KEY, cleanAddress);
    await AsyncStorage.setItem(PICKUP_ADDRESS_HISTORY_KEY, JSON.stringify(nextHistory));
  }
  const isFormComplete = Boolean(
      name.trim() &&
      Number(quantity) >= 1 &&
      category.trim() &&
      condition.trim() &&
      material.trim() &&
      workingCondition.trim() &&
      usability.trim() &&
      damageLevel.trim() &&
      description.trim() &&
      (bulkMode || address.trim()) &&
      image
  );

  function resetForm() {
    setName("");
    setQuantity("1");
    setCategory("furniture");
    setCondition("good");
    setMaterial("wood");
    setWorkingCondition("working");
    setUsability("yes");
    setDamageLevel("none");
    setHazardous(false);
    setDescription("");
    setImage(undefined);
    setEditingCartItemId(null);
  }

  function loadCartItem(item: ObjectItem) {
    setEditingCartItemId(item.id);
    setName(item.name);
    setQuantity(String(item.quantity || 1));
    setCategory(item.category);
    setCondition(item.condition);
    setMaterial(item.material || "wood");
    setWorkingCondition(item.working_condition || "working");
    setUsability(item.usability || "yes");
    setDamageLevel(item.damage_level || "none");
    setHazardous(Boolean(item.hazardous));
    setDescription(item.description || "");
    setImage(item.image_url);
  }

  function removeCartItem(objectId: number) {
    setCart((items) => items.filter((item) => item.id !== objectId));
    if (editingCartItemId === objectId) {
      resetForm();
    }
  }

  async function pickImage(camera = false) {
    const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow image access to attach an object photo.");
      return;
    }
    const result = camera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: true, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || "image/jpeg";
      setImage(asset.base64 ? `data:${mimeType};base64,${asset.base64}` : asset.uri);
    }
  }

  async function createObject() {
    if (!isFormComplete) {
      Alert.alert("Complete the form", "Please fill every field and add an object image before classification.");
      return null;
    }
    return apiFetch<ObjectItem>("/objects", {
      method: "POST",
      body: JSON.stringify({
        name,
        quantity: Math.max(1, Number(quantity) || 1),
        category,
        condition,
        material,
        working_condition: workingCondition,
        usability,
        damage_level: damageLevel,
        hazardous,
        description,
        image_url: image
      })
    });
  }

  async function submit() {
    try {
      setLoading(true);
      const object = await createObject();
      if (!object) return;
      await rememberAddress(address);
      Alert.alert("Classified", `${object.name} is ${object.classification} (${object.classification_confidence}% confidence).`);
      resetForm();
      navigation.navigate("PickupRequest", { object, address });
    } catch (error: any) {
      Alert.alert("Upload failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function addToCart() {
    try {
      setLoading(true);
      if (editingCartItemId) {
        const updated = await apiFetch<ObjectItem>(`/objects/${editingCartItemId}`, {
          method: "PUT",
          body: JSON.stringify({
            name,
            quantity: Math.max(1, Number(quantity) || 1),
            category,
            condition,
            material,
            working_condition: workingCondition,
            usability,
            damage_level: damageLevel,
            hazardous,
            description,
            image_url: image
          })
        });
        setCart((items) => items.map((item) => (item.id === editingCartItemId ? updated : item)));
        resetForm();
        Alert.alert("Cart item updated", `${updated.name} is now ${updated.classification}.`);
        return;
      }

      const object = await createObject();
      if (!object) return;
      setCart((items) => [...items, object]);
      resetForm();
      Alert.alert("Added to bulk cart", `${object.name} is ${object.classification}. Add another object or request collection.`);
    } catch (error: any) {
      Alert.alert("Could not add to cart", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function requestBulkPickup() {
    if (!address.trim()) {
      Alert.alert("Pickup address needed", "Enter one pickup address for the bulk collection.");
      return;
    }
    if (cart.length === 0) {
      Alert.alert("Cart is empty", "Add at least one object to the bulk cart.");
      return;
    }
    try {
      setRequesting(true);
      const pickups = await apiFetch<unknown[]>("/pickups/request-bulk", {
        method: "POST",
        body: JSON.stringify({ object_ids: cart.map((item) => item.id), address })
      });
      await rememberAddress(address);
      Alert.alert("Bulk pickup requested", `${pickups.length} objects are pending admin assignment.`);
      setCart([]);
      setAddress("");
      navigation.navigate("Objects");
    } catch (error: any) {
      Alert.alert("Bulk request failed", error.message);
    } finally {
      setRequesting(false);
    }
  }

  return (
    <ScrollView style={styles.screen} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.title}>Add object</Text>
      <Text style={styles.subtitle}>Capture details and the app will classify the object with simple circular economy rules.</Text>
      <View style={[styles.card, styles.row]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.dark, fontWeight: "900", fontSize: 16 }}>Bulk pickup</Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>Add multiple objects to one collection cart.</Text>
        </View>
        <Switch value={bulkMode} onValueChange={setBulkMode} trackColor={{ false: colors.line, true: colors.greenSoft }} thumbColor={bulkMode ? colors.green : colors.muted} />
      </View>
      {bulkMode ? (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={{ color: colors.dark, fontWeight: "900", fontSize: 17 }}>Bulk cart</Text>
            <Text style={styles.badge}>{cart.length} item{cart.length === 1 ? "" : "s"}</Text>
          </View>
          {cart.length ? cart.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => loadCartItem(item)}
              activeOpacity={0.82}
              style={{
                marginTop: 10,
                borderTopWidth: 1,
                borderTopColor: colors.line,
                paddingTop: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 10
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.dark, fontWeight: "800" }}>{item.name}</Text>
                <Text style={{ color: colors.muted, marginTop: 2 }}>Qty {item.quantity || 1} - {item.classification} - {item.category}</Text>
              </View>
              <TouchableOpacity
                onPress={() => removeCartItem(item.id)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.line
                }}
              >
                <Ionicons name="close" color={colors.dark} size={20} />
              </TouchableOpacity>
            </TouchableOpacity>
          )) : (
            <Text style={styles.subtitle}>No objects added yet.</Text>
          )}
          <Text style={styles.label}>Pickup address for all cart objects</Text>
          <LocationPicker address={address} onAddressChange={setAddress} />
          <TextInput
            style={[styles.input, { minHeight: 72, textAlignVertical: "top" }]}
            value={address}
            onChangeText={setAddress}
            multiline
          />
          <PrimaryButton title="Request collection for cart" onPress={requestBulkPickup} loading={requesting} disabled={cart.length === 0 || !address.trim()} icon="cube" />
        </View>
      ) : null}
      <View style={styles.card}>
        {image ? <Image source={{ uri: image }} style={{ height: 190, borderRadius: 16, marginBottom: 8 }} /> : null}
        <View style={styles.row}>
          <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={() => pickImage(true)}>
            <Ionicons name="camera" color={colors.greenDark} size={20} />
            <Text style={styles.secondaryText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={() => pickImage(false)}>
            <Ionicons name="image" color={colors.greenDark} size={20} />
            <Text style={styles.secondaryText}>Gallery</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Object name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Wooden chair" />
        <Text style={styles.label}>Quantity</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={(value) => setQuantity(value.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          placeholder="1"
        />
        <Text style={styles.label}>Category</Text>
        <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="furniture, books, plastic..." />
        <Text style={styles.label}>Condition</Text>
        <TextInput style={styles.input} value={condition} onChangeText={setCondition} placeholder="good, broken, severely damaged..." />
        <ChoiceGroup
          label="Main material"
          value={material}
          options={["wood", "plastic", "metal", "glass", "paper", "cloth", "electronic", "mixed"]}
          onChange={setMaterial}
        />
        <ChoiceGroup
          label="Working condition"
          value={workingCondition}
          options={["working", "partially working", "not working", "not applicable"]}
          onChange={setWorkingCondition}
        />
        <ChoiceGroup
          label="Can someone use it as-is?"
          value={usability}
          options={["yes", "no"]}
          onChange={setUsability}
        />
        <ChoiceGroup
          label="Damage level"
          value={damageLevel}
          options={["none", "minor", "broken", "severe", "unsafe"]}
          onChange={setDamageLevel}
        />
        <View style={[styles.row, { marginTop: 14 }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.dark, fontWeight: "800" }}>Hazardous or unsafe</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>Leaking, sharp, chemical, medical, or risky to handle.</Text>
          </View>
          <Switch value={hazardous} onValueChange={setHazardous} trackColor={{ false: colors.line, true: colors.greenSoft }} thumbColor={hazardous ? colors.green : colors.muted} />
        </View>
        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, { minHeight: 84, textAlignVertical: "top" }]} value={description} onChangeText={setDescription} multiline />
        {!bulkMode ? (
          <>
            <Text style={styles.label}>Pickup address</Text>
            <LocationPicker address={address} onAddressChange={setAddress} />
            <TextInput style={[styles.input, { minHeight: 72, textAlignVertical: "top" }]} value={address} onChangeText={setAddress} multiline />
          </>
        ) : null}
        <PrimaryButton
          title={bulkMode ? (editingCartItemId ? "Update cart item" : "Add object to cart") : "Classify object"}
          onPress={bulkMode ? addToCart : submit}
          loading={loading}
          disabled={!isFormComplete}
          icon={bulkMode ? "add-circle" : "sparkles"}
        />
      </View>
    </ScrollView>
  );
}
