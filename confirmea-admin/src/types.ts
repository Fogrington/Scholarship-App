export type ApplicationStatus = "pending" | "approved" | "rejected";
export type ComplaintStatus = "open" | "resolved" | "dismissed";

export interface Checklist {
  abn: boolean;
  address: boolean;
  contact: boolean;
}

export interface Application {
  id: number;
  businessName: string;
  category: string;
  abn: string;
  address: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  status: ApplicationStatus;
  checklist: Checklist;
  notes: string;
  decisionReason: string;
  submittedAt: string;
  decidedAt: string | null;
}

export interface Complaint {
  id: number;
  businessId: number;
  businessName: string;
  category: string;
  complainant: string;
  details: string;
  status: ComplaintStatus;
  notes: string;
  resolution: string;
  submittedAt: string;
  resolvedAt: string | null;
}

export interface Business {
  id: number;
  name: string;
  category: string;
  address: string;
  approvedAt: string;
  openComplaints?: number;
  accountEmail?: string | null;
}

export type ActivityType = "approved" | "rejected" | "resolved" | "dismissed" | "created";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  text: string;
  time: string;
}
