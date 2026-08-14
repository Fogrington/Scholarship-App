import React from "react";
import { StatusBar } from "expo-status-bar";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { BookingsProvider } from "./src/context/BookingsContext";
import { BusinessProvider } from "./src/context/BusinessContext";
import { ReviewsProvider } from "./src/context/ReviewsContext";
import { LocationProvider } from "./src/context/LocationContext";
import ReviewPromptModal from "./src/components/ReviewPromptModal";

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <BookingsProvider>
          <BusinessProvider>
            <ReviewsProvider>
              <StatusBar style="dark" />
              <RootNavigator />
              <ReviewPromptModal />
            </ReviewsProvider>
          </BusinessProvider>
        </BookingsProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
