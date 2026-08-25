import React from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/theme";
import { useAuth } from "../context/AuthContext";
import type { Listing } from "../types";

import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import ExploreScreen from "../screens/ExploreScreen";
import BusinessDetailScreen from "../screens/BusinessDetailScreen";
import ListingDetailScreen from "../screens/ListingDetailScreen";
import BookingsScreen from "../screens/BookingsScreen";
import RequestsScreen from "../screens/RequestsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import BusinessSlotsScreen from "../screens/BusinessSlotsScreen";
import AddSlotScreen from "../screens/AddSlotScreen";
import BusinessBookingsScreen from "../screens/BusinessBookingsScreen";
import BusinessRequestsScreen from "../screens/BusinessRequestsScreen";
import MakeOfferScreen from "../screens/MakeOfferScreen";

// ---- Customer navigation ----
// Both the Home (Discover) tab and the Explore (map) tab can drill into a
// business, then into a specific offer — each tab keeps its own back-stack, so
// they share the same screen shapes rather than the same navigator instance.
export type ClientStackParamList = {
  Home: undefined;
  BusinessDetail: { businessId: number };
  ListingDetail: { listing: Listing };
};

export type ExploreStackParamList = {
  Map: undefined;
  BusinessDetail: { businessId: number };
  ListingDetail: { listing: Listing };
};

export type ClientTabParamList = {
  HomeTab: undefined;
  ExploreTab: undefined;
  RequestsTab: undefined;
  BookingsTab: undefined;
  ProfileTab: undefined;
};

// ---- Business navigation ----
export type BusinessStackParamList = {
  Slots: undefined;
  AddSlot: undefined;
};

export type BusinessRequestsStackParamList = {
  RequestsList: undefined;
  MakeOffer: { requestId: number; customerName: string; category: string };
};

export type BusinessTabParamList = {
  SlotsTab: undefined;
  RequestsTab: undefined;
  BusinessBookingsTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  ClientTabs: undefined;
  BusinessTabs: undefined;
};

const ClientStack = createNativeStackNavigator<ClientStackParamList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();
const ClientTab = createBottomTabNavigator<ClientTabParamList>();
const BusinessStack = createNativeStackNavigator<BusinessStackParamList>();
const BusinessRequestsStack = createNativeStackNavigator<BusinessRequestsStackParamList>();
const BusinessTab = createBottomTabNavigator<BusinessTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const tabBarOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.black,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarStyle: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    height: 64,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabBarLabelStyle: { fontSize: 11, fontWeight: "700" as const },
};

function HomeStackNavigator() {
  return (
    <ClientStack.Navigator screenOptions={{ headerShown: false }}>
      <ClientStack.Screen name="Home" component={HomeScreen} />
      <ClientStack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
      <ClientStack.Screen name="ListingDetail" component={ListingDetailScreen} />
    </ClientStack.Navigator>
  );
}

function ExploreStackNavigator() {
  return (
    <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStack.Screen name="Map" component={ExploreScreen} />
      <ExploreStack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
      <ExploreStack.Screen name="ListingDetail" component={ListingDetailScreen} />
    </ExploreStack.Navigator>
  );
}

function ClientTabs() {
  return (
    <ClientTab.Navigator
      screenOptions={({ route }) => ({
        ...tabBarOptions,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<keyof ClientTabParamList, keyof typeof Ionicons.glyphMap> = {
            HomeTab: "home",
            ExploreTab: "map",
            RequestsTab: "megaphone",
            BookingsTab: "calendar",
            ProfileTab: "person",
          };
          return <Ionicons name={icons[route.name as keyof ClientTabParamList]} size={size - 2} color={color} />;
        },
      })}
    >
      <ClientTab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: "Discover" }} />
      <ClientTab.Screen name="ExploreTab" component={ExploreStackNavigator} options={{ title: "Explore" }} />
      <ClientTab.Screen name="RequestsTab" component={RequestsScreen} options={{ title: "Requests" }} />
      <ClientTab.Screen name="BookingsTab" component={BookingsScreen} options={{ title: "Bookings" }} />
      <ClientTab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: "Profile" }} />
    </ClientTab.Navigator>
  );
}

function SlotsStackNavigator() {
  return (
    <BusinessStack.Navigator screenOptions={{ headerShown: false }}>
      <BusinessStack.Screen name="Slots" component={BusinessSlotsScreen} />
      <BusinessStack.Screen name="AddSlot" component={AddSlotScreen} />
    </BusinessStack.Navigator>
  );
}

function BusinessRequestsStackNavigator() {
  return (
    <BusinessRequestsStack.Navigator screenOptions={{ headerShown: false }}>
      <BusinessRequestsStack.Screen name="RequestsList" component={BusinessRequestsScreen} />
      <BusinessRequestsStack.Screen name="MakeOffer" component={MakeOfferScreen} />
    </BusinessRequestsStack.Navigator>
  );
}

function BusinessTabs() {
  return (
    <BusinessTab.Navigator
      screenOptions={({ route }) => ({
        ...tabBarOptions,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<keyof BusinessTabParamList, keyof typeof Ionicons.glyphMap> = {
            SlotsTab: "grid-outline",
            RequestsTab: "megaphone-outline",
            BusinessBookingsTab: "calendar",
            ProfileTab: "person",
          };
          return (
            <Ionicons name={icons[route.name as keyof BusinessTabParamList]} size={size - 2} color={color} />
          );
        },
      })}
    >
      <BusinessTab.Screen name="SlotsTab" component={SlotsStackNavigator} options={{ title: "Slots" }} />
      <BusinessTab.Screen
        name="RequestsTab"
        component={BusinessRequestsStackNavigator}
        options={{ title: "Requests" }}
      />
      <BusinessTab.Screen
        name="BusinessBookingsTab"
        component={BusinessBookingsScreen}
        options={{ title: "Bookings" }}
      />
      <BusinessTab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: "Profile" }} />
    </BusinessTab.Navigator>
  );
}

export default function RootNavigator() {
  const { isLoggedIn, initializing, role } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.black }}>
        <ActivityIndicator color={colors.apricot} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <RootStack.Screen name="Login" component={LoginScreen} />
        ) : role === "business" ? (
          <RootStack.Screen name="BusinessTabs" component={BusinessTabs} />
        ) : (
          <RootStack.Screen name="ClientTabs" component={ClientTabs} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
