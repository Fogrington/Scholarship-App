export type Category = "Hair" | "Nails" | "Beauty" | "Waxing" | "Massage";

export interface Listing {
  id: number;
  businessId: number;
  businessName: string;
  address: string;
  service: string;
  category: string;
  price: number;
  discountPercent: number | null;
  slotTime: string; // e.g. "Today, 4:30 PM"
  capacity: number;
  remainingSpots: number;
  isFull: boolean;
  rating: number;
  reviews: number;
  distanceKm: number | null;
}

// This drives the category filter pills on the Discover screen — it's a UI
// concern, not something the backend needs to know about.
export const categories: { key: Category; icon: string }[] = [
  { key: "Hair", icon: "cut-outline" },
  { key: "Nails", icon: "color-palette-outline" },
  { key: "Beauty", icon: "sparkles-outline" },
  { key: "Waxing", icon: "flame-outline" },
  { key: "Massage", icon: "body-outline" },
];

export type BookingStatus = "Upcoming" | "Completed" | "Cancelled";

export interface BookingListingSummary {
  id: number;
  businessId: number;
  businessName: string;
  address: string;
  service: string;
  category: string;
  price: number;
  discountPercent: number | null;
  slotTime: string;
}

export interface Booking {
  id: number;
  userId: number;
  listingId: number;
  status: BookingStatus;
  createdAt: string;
  listing: BookingListingSummary | null;
}

// ---- Business dashboard (role: "business") ----

export interface BusinessProfile {
  id: number;
  name: string;
  category: string;
  address: string;
  approvedAt: string;
}

export interface BusinessListing {
  id: number;
  businessId: number;
  service: string;
  category: string;
  price: number;
  discountPercent: number | null;
  slotTime: string;
  capacity: number;
  isActive: boolean;
  upcomingBookings: number;
  remainingSpots: number;
  isFull: boolean;
  createdAt: string;
}

export interface BusinessBooking {
  id: number;
  status: BookingStatus;
  createdAt: string;
  customer: { name: string; email: string };
  listing: {
    id: number;
    service: string;
    category: string;
    price: number;
    discountPercent: number | null;
    slotTime: string;
  };
}
