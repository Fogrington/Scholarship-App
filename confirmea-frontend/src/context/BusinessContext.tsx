import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";
import type { BusinessBooking, BusinessListing } from "../types";

interface NewSlotInput {
  service: string;
  category: string;
  price: number;
  discountPercent?: number;
  slotTime: string;
  capacity: number;
}

type BusinessContextValue = {
  listings: BusinessListing[];
  bookings: BusinessBooking[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  addListing: (input: NewSlotInput) => Promise<void>;
  closeListing: (id: number) => Promise<void>;
  markArrived: (bookingId: number) => Promise<void>;
  markNoShow: (bookingId: number) => Promise<void>;
  rateCustomer: (bookingId: number, rating: number) => Promise<void>;
};

const BusinessContext = createContext<BusinessContextValue | undefined>(undefined);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { token, role } = useAuth();
  const isBusiness = role === "business";

  const [listings, setListings] = useState<BusinessListing[]>([]);
  const [bookings, setBookings] = useState<BusinessBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const refresh = useCallback(() => setRefreshCount((n) => n + 1), []);

  useEffect(() => {
    if (!isBusiness || !token) {
      setListings([]);
      setBookings([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get<BusinessListing[]>("/business/listings", token),
      api.get<BusinessBooking[]>("/business/bookings", token),
    ])
      .then(([listingsData, bookingsData]) => {
        if (cancelled) return;
        setListings(listingsData);
        setBookings(bookingsData);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load your dashboard.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isBusiness, token, refreshCount]);

  const addListing = useCallback(
    async (input: NewSlotInput) => {
      const created = await api.post<BusinessListing>("/business/listings", input, token);
      setListings((prev) => [created, ...prev]);
    },
    [token]
  );

  const closeListing = useCallback(
    async (id: number) => {
      const updated = await api.patch<BusinessListing>(`/business/listings/${id}/close`, {}, token);
      setListings((prev) => prev.map((l) => (l.id === id ? updated : l)));
    },
    [token]
  );

  const markArrived = useCallback(
    async (bookingId: number) => {
      const updated = await api.patch<BusinessBooking>(`/business/bookings/${bookingId}/arrived`, {}, token);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
    },
    [token]
  );

  const markNoShow = useCallback(
    async (bookingId: number) => {
      const updated = await api.patch<BusinessBooking>(`/business/bookings/${bookingId}/no-show`, {}, token);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
    },
    [token]
  );

  const rateCustomer = useCallback(
    async (bookingId: number, rating: number) => {
      const updated = await api.post<BusinessBooking>(
        `/business/bookings/${bookingId}/rate-customer`,
        { rating },
        token
      );
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
    },
    [token]
  );

  return (
    <BusinessContext.Provider
      value={{
        listings,
        bookings,
        loading,
        error,
        refresh,
        addListing,
        closeListing,
        markArrived,
        markNoShow,
        rateCustomer,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within a BusinessProvider");
  return ctx;
}
