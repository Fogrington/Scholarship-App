import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NEWCASTLE_SUBURBS, type Suburb } from "../types";

const STORAGE_KEY = "confirmea_selected_suburb";
const DEFAULT_SUBURB = NEWCASTLE_SUBURBS[0];

type LocationContextValue = {
  suburb: Suburb;
  setSuburb: (suburb: Suburb) => void;
  ready: boolean;
};

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [suburb, setSuburbState] = useState<Suburb>(DEFAULT_SUBURB);
  const [ready, setReady] = useState(false);

  // Load the last-picked suburb once on launch, so the user doesn't have to
  // re-pick it every time they open the app.
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Suburb;
          // Match against the current known list by name, in case the saved
          // suburb's coordinates ever change or the list is edited.
          const match = NEWCASTLE_SUBURBS.find((s) => s.name === parsed.name);
          if (match) setSuburbState(match);
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setSuburb = (next: Suburb) => {
    setSuburbState(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
      // Non-critical — worst case the choice doesn't persist to next launch.
    });
  };

  return <LocationContext.Provider value={{ suburb, setSuburb, ready }}>{children}</LocationContext.Provider>;
}

export function useLocationSuburb() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocationSuburb must be used within a LocationProvider");
  return ctx;
}
