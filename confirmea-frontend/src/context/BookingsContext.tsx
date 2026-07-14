import React, { createContext, useCallback, useContext, useState } from "react";
import { Listing, mockListings } from "../data/mockData";

export type BookingStatus = "Upcoming" | "Completed" | "Cancelled";

export type Booking = {
  id: string;
  listing: Listing;
  status: BookingStatus;
};

type BookingsContextValue = {
  bookings: Booking[];
  addBooking: (listing: Listing) => void;
  isBooked: (listingId: string) => boolean;
};

const BookingsContext = createContext<BookingsContextValue | undefined>(undefined);

// Seed with one existing booking so the tab isn't empty on first open.
const initialBookings: Booking[] = [
  { id: "b1", listing: mockListings[0], status: "Upcoming" },
];

export function BookingsProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  const addBooking = useCallback((listing: Listing) => {
    setBookings((prev) => [
      { id: `b-${Date.now()}`, listing, status: "Upcoming" },
      ...prev,
    ]);
  }, []);

  const isBooked = useCallback(
    (listingId: string) =>
      bookings.some((b) => b.listing.id === listingId && b.status === "Upcoming"),
    [bookings]
  );

  return (
    <BookingsContext.Provider value={{ bookings, addBooking, isBooked }}>
      {children}
    </BookingsContext.Provider>
  );
}

export function useBookings() {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error("useBookings must be used within a BookingsProvider");
  return ctx;
}
