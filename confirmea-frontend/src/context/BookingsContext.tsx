import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";
import type { Booking, Listing } from "../types";

type BookingsContextValue = {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  addBooking: (listing: Listing) => Promise<void>;
  isBooked: (listingId: number) => boolean;
  refresh: () => void;
};

const BookingsContext = createContext<BookingsContextValue | undefined>(undefined);

export function BookingsProvider({ children }: { children: React.ReactNode }) {
  const { token, isLoggedIn } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const refresh = useCallback(() => setRefreshCount((n) => n + 1), []);

  useEffect(() => {
    if (!isLoggedIn || !token) {
      setBookings([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .get<Booking[]>("/bookings/mine", token)
      .then((data) => {
        if (!cancelled) setBookings(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load your bookings.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, token, refreshCount]);

  const addBooking = useCallback(
    async (listing: Listing) => {
      const newBooking = await api.post<Booking>("/bookings", { listingId: listing.id }, token);
      setBookings((prev) => [newBooking, ...prev]);
    },
    [token]
  );

  const isBooked = useCallback(
    (listingId: number) => bookings.some((b) => b.listingId === listingId && b.status === "Upcoming"),
    [bookings]
  );

  return (
    <BookingsContext.Provider value={{ bookings, loading, error, addBooking, isBooked, refresh }}>
      {children}
    </BookingsContext.Provider>
  );
}

export function useBookings() {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error("useBookings must be used within a BookingsProvider");
  return ctx;
}
