import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { colors } from "./src/theme";
import SplashScreen from "./src/screens/SplashScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import CitizenHomeScreen from "./src/screens/CitizenHomeScreen";
import AddObjectScreen from "./src/screens/AddObjectScreen";
import MyObjectsScreen from "./src/screens/MyObjectsScreen";
import ObjectDetailsScreen from "./src/screens/ObjectDetailsScreen";
import PickupRequestScreen from "./src/screens/PickupRequestScreen";
import AdminDashboardScreen from "./src/screens/AdminDashboardScreen";
import PickupManagementScreen from "./src/screens/PickupManagementScreen";
import DriverDashboardScreen from "./src/screens/DriverDashboardScreen";
import AssignedPickupDetailsScreen from "./src/screens/AssignedPickupDetailsScreen";
import AnalyticsScreen from "./src/screens/AnalyticsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import DeliveredOrdersScreen from "./src/screens/DeliveredOrdersScreen";
import AdminPickupMapScreen from "./src/screens/AdminPickupMapScreen";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

// Citizen gets bottom tabs because their workflow is repeated: home, add item,
// review objects, and profile.
function CitizenTabs() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <Tabs.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.green,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            position: "absolute",
            left: 28,
            right: 28,
            bottom: 18,
            height: 72,
            paddingBottom: 10,
            paddingTop: 10,
            backgroundColor: colors.card,
            borderTopWidth: 0,
            borderColor: colors.line,
            borderWidth: 1,
            borderRadius: 36,
            shadowColor: colors.greenDark,
            shadowOpacity: 0.16,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 10
          },
          tabBarItemStyle: {
            borderRadius: 28,
            marginHorizontal: 4
          },
          tabBarLabelStyle: {
            fontWeight: "800",
            fontSize: 11
          },
          tabBarIcon: ({ color, size }) => {
            const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
              Home: "home",
              Add: "add-circle",
              Objects: "cube",
              Profile: "person-circle"
            };
            return <Ionicons name={icons[route.name]} color={color} size={size} />;
          }
        })}
      >
        <Tabs.Screen name="Home" component={CitizenHomeScreen} />
        <Tabs.Screen name="Add" component={AddObjectScreen} />
        <Tabs.Screen name="Objects" component={MyObjectsScreen} />
        <Tabs.Screen name="Profile" component={ProfileScreen} />
      </Tabs.Navigator>
    </SafeAreaView>
  );
}

function floatingTabOptions(routeName: string) {
  // Driver tabs reuse the same floating visual style as citizen tabs.
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.green,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: {
      position: "absolute" as const,
      left: 28,
      right: 28,
      bottom: 18,
      height: 72,
      paddingBottom: 10,
      paddingTop: 10,
      backgroundColor: colors.card,
      borderTopWidth: 0,
      borderColor: colors.line,
      borderWidth: 1,
      borderRadius: 36,
      shadowColor: colors.greenDark,
      shadowOpacity: 0.16,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 10
    },
    tabBarItemStyle: {
      borderRadius: 28,
      marginHorizontal: 4
    },
    tabBarLabelStyle: {
      fontWeight: "800" as const,
      fontSize: 11
    },
    tabBarIcon: ({ color, size }: { color: string; size: number }) => {
      const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
        Pickups: "car",
        Profile: "person-circle"
      };
      return <Ionicons name={icons[routeName]} color={color} size={size} />;
    }
  };
}

function DriverTabs() {
  // Drivers mainly switch between assigned pickups and profile/logout.
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <Tabs.Navigator screenOptions={({ route }) => floatingTabOptions(route.name)}>
        <Tabs.Screen name="Pickups" component={DriverDashboardScreen} />
        <Tabs.Screen name="Profile" component={ProfileScreen} />
      </Tabs.Navigator>
    </SafeAreaView>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    // While token restore is in progress, keep the app on a neutral splash view.
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.dark,
          headerTitleStyle: { fontWeight: "800" },
          contentStyle: { backgroundColor: colors.background }
        }}
      >
        {!user ? (
          // Logged-out users only see authentication screens.
          <>
            <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Create account" }} />
          </>
        ) : user.role === "citizen" ? (
          // Citizen stack contains the tab shell plus object/pickup detail flows.
          <>
            <Stack.Screen name="CitizenTabs" component={CitizenTabs} options={{ headerShown: false }} />
            <Stack.Screen name="ObjectDetails" component={ObjectDetailsScreen} options={{ title: "Object details" }} />
            <Stack.Screen name="PickupRequest" component={PickupRequestScreen} options={{ title: "Request pickup" }} />
          </>
        ) : user.role === "admin" ? (
          // Admin screens are stack-based because they are operational tools.
          <>
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: "Admin dashboard" }} />
            <Stack.Screen name="PickupManagement" component={PickupManagementScreen} options={{ title: "Pickup management" }} />
            <Stack.Screen name="AdminPickupMap" component={AdminPickupMapScreen} options={{ title: "Pickup map" }} />
            <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: "Analytics" }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
            <Stack.Screen name="DeliveredOrders" component={DeliveredOrdersScreen} options={{ title: "Delivered orders" }} />
          </>
        ) : (
          // Any remaining authenticated role is treated as a driver.
          <>
            <Stack.Screen name="DriverTabs" component={DriverTabs} options={{ headerShown: false }} />
            <Stack.Screen name="AssignedPickupDetails" component={AssignedPickupDetailsScreen} options={{ title: "Assigned pickup" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  // Providers are kept at the root so auth and safe-area state work everywhere.
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
