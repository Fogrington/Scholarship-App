import React from "react";
import { StatusBar } from "expo-status-bar";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { BookingsProvider } from "./src/context/BookingsContext";

export default function App() {
  return (
    <AuthProvider>
      <BookingsProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </BookingsProvider>
    </AuthProvider>
  );
}
