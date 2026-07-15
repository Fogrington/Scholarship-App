export type UserRole = "customer" | "admin";

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
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
  rating: number;
  reviews: number;
  distance_km: number | null;
  is_active: 0 | 1;
  created_at: string;
}

export type BookingStatus = "Upcoming" | "Completed" | "Cancelled";

export interface BookingRow {
  id: number;
  user_id: number;
  listing_id: number;
  status: BookingStatus;
  created_at: string;
}

export type ComplaintStatus = "open" | "resolved" | "dismissed";

export interface ComplaintRow {
  id: number;
  business_id: number;
  category: string;
  complainant_name: string;
  details: string;
  status: ComplaintStatus;
  notes: string;
  resolution: string;
  submitted_at: string;
  resolved_at: string | null;
}

export interface AuthTokenPayload {
  sub: number;
  role: UserRole;
  email: string;
}
