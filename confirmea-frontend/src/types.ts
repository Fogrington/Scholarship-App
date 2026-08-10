export type Category = "Hair" | "Nails" | "Beauty" | "Waxing" | "Massage";

export interface Suburb {
  name: string;
  lat: number;
  lng: number;
}

// Fixed list for the location picker — real Newcastle NSW suburbs, not GPS tracking.
// Coordinates are suburb centroids, matching what the backend uses for businesses.
export const NEWCASTLE_SUBURBS: Suburb[] = [
  { name: "Newcastle", lat: -32.9283, lng: 151.7817 },
  { name: "Cooks Hill", lat: -32.9313, lng: 151.7676 },
  { name: "Hamilton", lat: -32.926, lng: 151.7407 },
  { name: "The Junction", lat: -32.9366, lng: 151.7597 },
  { name: "Lambton", lat: -32.9127, lng: 151.7108 },
  { name: "Merewether", lat: -32.9459, lng: 151.7508 },
  { name: "Mayfield", lat: -32.902, lng: 151.7364 },
  { name: "Wallsend", lat: -32.8987, lng: 151.6702 },
];

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
  // Aggregated from real reviews of the business — null until it has at least one.
  rating: number | null;
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
  rating: number | null;
  reviewCount: number;
}

// A completed visit that hasn't been rated yet — prompts the "how was your visit?"
// modal after login.
export interface PendingReview {
  bookingId: number;
  businessId: number;
  businessName: string;
  service: string;
  slotTime: string;
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
