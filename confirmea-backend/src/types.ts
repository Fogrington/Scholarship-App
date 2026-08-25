export type UserRole = "customer" | "admin" | "business";

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  business_id: number | null;
  created_at: string;
}

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface ApplicationRow {
  id: number;
  business_name: string;
  category: string;
  abn: string;
  address: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  status: ApplicationStatus;
  checklist_abn: 0 | 1;
  checklist_address: 0 | 1;
  checklist_contact: 0 | 1;
  notes: string;
  decision_reason: string;
  submitted_at: string;
  decided_at: string | null;
}

export interface BusinessRow {
  id: number;
  application_id: number | null;
  name: string;
  category: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  approved_at: string;
}

export interface ListingRow {
  id: number;
  business_id: number;
  service: string;
  category: string;
  price: number;
  discount_percent: number | null;
  slot_time: string;
  capacity: number;
  rating: number;
  reviews: number;
  distance_km: number | null;
  is_active: 0 | 1;
  created_at: string;
}

export type BookingStatus = "Offered" | "Upcoming" | "Completed" | "Cancelled" | "NoShow";

export interface BookingRow {
  id: number;
  user_id: number;
  listing_id: number;
  status: BookingStatus;
  request_id: number | null;
  created_at: string;
}

export type ComplaintStatus = "open" | "resolved" | "dismissed";
export type ComplaintType = "business" | "app";

export interface ComplaintRow {
  id: number;
  type: ComplaintType;
  business_id: number | null;
  user_id: number | null;
  category: string;
  complainant_name: string;
  details: string;
  status: ComplaintStatus;
  notes: string;
  resolution: string;
  submitted_at: string;
  resolved_at: string | null;
}

export interface ReviewRow {
  id: number;
  booking_id: number;
  business_id: number;
  user_id: number;
  rating: number;
  created_at: string;
}

export interface CustomerRatingRow {
  id: number;
  booking_id: number;
  business_id: number;
  user_id: number;
  rating: number;
  created_at: string;
}

export type RequestStatus = "open" | "offered" | "matched" | "withdrawn";

export interface RequestRow {
  id: number;
  user_id: number;
  category: string;
  note: string;
  status: RequestStatus;
  created_at: string;
}

export interface AuthTokenPayload {
  sub: number;
  role: UserRole;
  email: string;
  businessId?: number;
}
