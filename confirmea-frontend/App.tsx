import React from "react";
import { StatusBar } from "expo-status-bar";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { BookingsProvider } from "./src/context/BookingsContext";
import { BusinessProvider } from "./src/context/BusinessContext";

export default function App() {
  return (
    <AuthProvider>
      <BookingsProvider>
        <BusinessProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </BusinessProvider>
      </BookingsProvider>
    </AuthProvider>
  );
}
