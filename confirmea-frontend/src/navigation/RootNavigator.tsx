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
import ListingDetailScreen from "../screens/ListingDetailScreen";
import BookingsScreen from "../screens/BookingsScreen";
import ProfileScreen from "../screens/ProfileScreen";

export type ClientStackParamList = {
  Home: undefined;
  ListingDetail: { listing: Listing };
};

export type ClientTabParamList = {
  HomeTab: undefined;
  BookingsTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  ClientTabs: undefined;
};

const ClientStack = createNativeStackNavigator<ClientStackParamList>();
const Tab = createBottomTabNavigator<ClientTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function HomeStackNavigator() {
  return (
    <ClientStack.Navigator screenOptions={{ headerShown: false }}>
      <ClientStack.Screen name="Home" component={HomeScreen} />
      <ClientStack.Screen name="ListingDetail" component={ListingDetailScreen} />
    </ClientStack.Navigator>
  );
}

function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
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
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<keyof ClientTabParamList, keyof typeof Ionicons.glyphMap> = {
            HomeTab: "home",
            BookingsTab: "calendar",
            ProfileTab: "person",
          };
          return <Ionicons name={icons[route.name as keyof ClientTabParamList]} size={size - 2} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: "Discover" }} />
      <Tab.Screen name="BookingsTab" component={BookingsScreen} options={{ title: "Bookings" }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { isLoggedIn, initializing } = useAuth();

  if (initializing) {
    // Checking AsyncStorage for a saved session — avoids a flash of the login
    // screen before we know whether the user is already logged in.
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.black }}>
        <ActivityIndicator color={colors.apricot} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <RootStack.Screen name="ClientTabs" component={ClientTabs} />
        ) : (
          <RootStack.Screen name="Login" component={LoginScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
