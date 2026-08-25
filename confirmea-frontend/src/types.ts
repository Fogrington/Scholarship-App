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

// A business that currently has at least one open, bookable slot — this is what
// Discover and the Explore map browse (business-first), from
// GET /businesses/with-offers. Filtering by category means the business's
// specialty, not any one listing's category — a business only shows up once even
// if it has several open offers across different services.
export interface BusinessWithOffers {
  id: number;
  name: string;
  category: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  reviewCount: number;
  openOffers: number;
  distanceKm: number | null;
}

export type BookingStatus = "Offered" | "Upcoming" | "Completed" | "Cancelled" | "NoShow";

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
  customer: { name: string; email: string; rating: number | null; reviewCount: number };
  listing: {
    id: number;
    service: string;
    category: string;
    price: number;
    discountPercent: number | null;
    slotTime: string;
  };
  canRateCustomer: boolean;
}

// ---- "Looking for a service" requests ----

export type RequestStatus = "open" | "offered" | "matched" | "withdrawn";

export interface ServiceRequest {
  id: number;
  category: string;
  note: string;
  status: RequestStatus;
  createdAt: string;
}

// A request as a business sees it, oldest first — first in, best dressed.
export interface OpenRequest extends ServiceRequest {
  customerName: string;
}

// The result of a business successfully making an offer.
export interface OfferResult {
  bookingId: number;
  requestId: number;
  customerName: string;
  service: string;
  price: number;
  discountPercent: number | null;
  slotTime: string;
}

// A pending offer as the customer sees it — drives the accept/decline prompt.
export interface PendingOffer {
  bookingId: number;
  businessId: number;
  businessName: string;
  service: string;
  category: string;
  price: number;
  discountPercent: number | null;
  slotTime: string;
}

// ---- Complaints & app feedback ----

export type ComplaintType = "business" | "app";

export interface ComplaintSubmission {
  id: number;
  type: ComplaintType;
  businessId: number | null;
  businessName: string | null;
  category: string;
  details: string;
  status: "open" | "resolved" | "dismissed";
  submittedAt: string;
}
