import React from "react";
import { StatusBar } from "expo-status-bar";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { BookingsProvider } from "./src/context/BookingsContext";
import { BusinessProvider } from "./src/context/BusinessContext";
import { ReviewsProvider } from "./src/context/ReviewsContext";
import { LocationProvider } from "./src/context/LocationContext";
import { RequestsProvider } from "./src/context/RequestsContext";
import ReviewPromptModal from "./src/components/ReviewPromptModal";
import OfferPromptModal from "./src/components/OfferPromptModal";

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <BookingsProvider>
          <BusinessProvider>
            <ReviewsProvider>
              <RequestsProvider>
                <StatusBar style="dark" />
                <RootNavigator />
                <ReviewPromptModal />
                <OfferPromptModal />
              </RequestsProvider>
            </ReviewsProvider>
          </BusinessProvider>
        </BookingsProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
