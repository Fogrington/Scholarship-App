export type ApplicationStatus = "pending" | "approved" | "rejected";
export type ComplaintStatus = "open" | "resolved" | "dismissed";

export interface Checklist {
  abn: boolean;
  address: boolean;
  contact: boolean;
}

export interface Application {
  id: string;
  businessName: string;
  category: string;
  abn: string;
  address: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  submitted: string;
  status: ApplicationStatus;
  checklist: Checklist;
  notes: string;
  decisionReason: string;
}

export interface Complaint {
  id: string;
  businessId: string;
  businessName: string;
  category: string;
  complainant: string;
  submitted: string;
  status: ComplaintStatus;
  details: string;
  notes: string;
  resolution: string;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  address: string;
  approvedDate: string;
}

export type ActivityType = "approved" | "rejected" | "resolved" | "dismissed";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  text: string;
  time: string;
}

// Business names are kept in sync with the mock listings in the consumer app
// for continuity between the two prototypes.
export const initialBusinesses: Business[] = [
  { id: "biz-1", name: "Salt & Co Hair Studio", category: "Hair", address: "12 Hunter St, Newcastle", approvedDate: "3 Feb 2026" },
  { id: "biz-2", name: "Bare Beauty Bar", category: "Beauty", address: "45 Darby St, Cooks Hill", approvedDate: "18 Jan 2026" },
  { id: "biz-3", name: "Polished Nail Lounge", category: "Nails", address: "8 King St, Newcastle", approvedDate: "22 Feb 2026" },
  { id: "biz-4", name: "Smooth Skin Studio", category: "Waxing", address: "3 Beaumont St, Hamilton", approvedDate: "9 Mar 2026" },
  { id: "biz-5", name: "Unwind Massage Co", category: "Massage", address: "22 Union St, The Junction", approvedDate: "30 Jan 2026" },
  { id: "biz-6", name: "Barber & Sons", category: "Hair", address: "17 Hunter St, Newcastle", approvedDate: "11 Feb 2026" },
  { id: "biz-7", name: "Northside Barbers", category: "Hair", address: "4 Griffiths Rd, Lambton", approvedDate: "27 Jun 2026" },
];

export const initialApplications: Application[] = [
  {
    id: "app-1",
    businessName: "Glow Beauty Rooms",
    category: "Beauty",
    abn: "51 824 753 556",
    address: "9 Wolfe St, Newcastle",
    contactName: "Priya Nair",
    contactEmail: "priya@glowbeauty.com.au",
    contactPhone: "0412 555 210",
    submitted: "2 days ago",
    status: "pending",
    checklist: { abn: false, address: false, contact: false },
    notes: "",
    decisionReason: "",
  },
  {
    id: "app-2",
    businessName: "The Wax Bar Newcastle",
    category: "Waxing",
    abn: "12 345 678 910",
    address: "101 Hunter St, Newcastle",
    contactName: "Meg Ellis",
    contactEmail: "meg@waxbarnewy.com.au",
    contactPhone: "0400 118 774",
    submitted: "5 hours ago",
    status: "pending",
    checklist: { abn: false, address: false, contact: false },
    notes: "",
    decisionReason: "",
  },
  {
    id: "app-3",
    businessName: "Zen Massage Therapy",
    category: "Massage",
    abn: "88 102 556 771",
    address: "15 Beaumont St, Hamilton",
    contactName: "Owen Fisk",
    contactEmail: "owen@zenmassage.com.au",
    contactPhone: "0433 909 221",
    submitted: "3 days ago",
    status: "rejected",
    checklist: { abn: true, address: false, contact: true },
    notes: "ABN lookup returned a different registered business name at this address.",
    decisionReason:
      "ABN could not be verified against the registered business address. Reapply once ASIC records are updated.",
  },
  {
    id: "app-4",
    businessName: "Northside Barbers",
    category: "Hair",
    abn: "33 221 445 902",
    address: "4 Griffiths Rd, Lambton",
    contactName: "Dave Kalani",
    contactEmail: "dave@northsidebarbers.com.au",
    contactPhone: "0421 664 330",
    submitted: "1 week ago",
    status: "approved",
    checklist: { abn: true, address: true, contact: true },
    notes: "Called to confirm trading hours, all good.",
    decisionReason: "",
  },
];

export const initialComplaints: Complaint[] = [
  {
    id: "c-1",
    businessId: "biz-1",
    businessName: "Salt & Co Hair Studio",
    category: "Service quality",
    complainant: "J. Reyes",
    submitted: "3 days ago",
    status: "open",
    details: "Stylist ran 40 minutes late with no notice sent through the app.",
    notes: "",
    resolution: "",
  },
  {
    id: "c-2",
    businessId: "biz-6",
    businessName: "Barber & Sons",
    category: "No-show",
    complainant: "T. Wallace",
    submitted: "Yesterday",
    status: "open",
    details: "Booked slot was marked filled in the app, but the business was closed on arrival.",
    notes: "",
    resolution: "",
  },
  {
    id: "c-3",
    businessId: "biz-5",
    businessName: "Unwind Massage Co",
    category: "Billing dispute",
    complainant: "S. Cho",
    submitted: "1 week ago",
    status: "resolved",
    details: "Charged more in person than the price advertised in the app.",
    notes: "Confirmed with business — pricing was out of date in their system.",
    resolution: "Business updated their listed price and refunded the $12 difference.",
  },
  {
    id: "c-4",
    businessId: "biz-2",
    businessName: "Bare Beauty Bar",
    category: "Hygiene concern",
    complainant: "A. Ibrahim",
    submitted: "2 weeks ago",
    status: "dismissed",
    details: "Raised a concern about tool sanitation during an express facial.",
    notes: "Site visit conducted.",
    resolution: "No issue found on inspection; complainant notified.",
  },
];

export const initialActivity: ActivityEntry[] = [
  { id: "a-1", type: "approved", text: "<b>Northside Barbers</b> application approved", time: "1 week ago" },
  { id: "a-2", type: "resolved", text: "Complaint from <b>S. Cho</b> about Unwind Massage Co resolved", time: "6 days ago" },
  { id: "a-3", type: "dismissed", text: "Complaint from <b>A. Ibrahim</b> about Bare Beauty Bar dismissed", time: "2 weeks ago" },
  { id: "a-4", type: "rejected", text: "<b>Zen Massage Therapy</b> application rejected", time: "3 days ago" },
];
