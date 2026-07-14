export type Category =
  | "Hair"
  | "Nails"
  | "Beauty"
  | "Waxing"
  | "Massage";

export type Listing = {
  id: string;
  businessName: string;
  service: string;
  category: Category;
  price: number;
  distanceKm: number;
  slotTime: string; // e.g. "Today, 4:30 PM"
  minutesUntil: number;
  rating: number;
  reviews: number;
  discountPercent?: number;
  address: string;
};

export const categories: { key: Category; icon: string }[] = [
  { key: "Hair", icon: "cut-outline" },
  { key: "Nails", icon: "color-palette-outline" },
  { key: "Beauty", icon: "sparkles-outline" },
  { key: "Waxing", icon: "flame-outline" },
  { key: "Massage", icon: "body-outline" },
];

export const mockListings: Listing[] = [
  {
    id: "1",
    businessName: "Salt & Co Hair Studio",
    service: "Women's Cut & Blow Dry",
    category: "Hair",
    price: 65,
    distanceKm: 1.2,
    slotTime: "Today, 4:30 PM",
    minutesUntil: 95,
    rating: 4.8,
    reviews: 212,
    discountPercent: 20,
    address: "12 Hunter St, Newcastle",
  },
  {
    id: "2",
    businessName: "Bare Beauty Bar",
    service: "Express Facial",
    category: "Beauty",
    price: 55,
    distanceKm: 0.8,
    slotTime: "Today, 5:00 PM",
    minutesUntil: 125,
    rating: 4.9,
    reviews: 88,
    discountPercent: 15,
    address: "45 Darby St, Cooks Hill",
  },
  {
    id: "3",
    businessName: "Polished Nail Lounge",
    service: "Gel Manicure",
    category: "Nails",
    price: 45,
    distanceKm: 2.4,
    slotTime: "Today, 3:45 PM",
    minutesUntil: 50,
    rating: 4.6,
    reviews: 150,
    address: "8 King St, Newcastle",
  },
  {
    id: "4",
    businessName: "Smooth Skin Studio",
    service: "Leg Wax",
    category: "Waxing",
    price: 40,
    distanceKm: 1.9,
    slotTime: "Tomorrow, 10:00 AM",
    minutesUntil: 1160,
    rating: 4.7,
    reviews: 64,
    address: "3 Beaumont St, Hamilton",
  },
  {
    id: "5",
    businessName: "Unwind Massage Co",
    service: "60min Relaxation Massage",
    category: "Massage",
    price: 95,
    distanceKm: 3.1,
    slotTime: "Today, 6:15 PM",
    minutesUntil: 200,
    rating: 5.0,
    reviews: 41,
    discountPercent: 10,
    address: "22 Union St, The Junction",
  },
  {
    id: "6",
    businessName: "Barber & Sons",
    service: "Men's Cut & Beard Trim",
    category: "Hair",
    price: 38,
    distanceKm: 0.5,
    slotTime: "Today, 4:00 PM",
    minutesUntil: 65,
    rating: 4.5,
    reviews: 302,
    address: "17 Hunter St, Newcastle",
  },
];

export type Booking = {
  id: string;
  listing: Listing;
  status: "Upcoming" | "Completed" | "Cancelled";
};

export const mockBookings: Booking[] = [
  {
    id: "b1",
    listing: mockListings[0],
    status: "Upcoming",
  },
];

export type BusinessSlot = {
  id: string;
  service: string;
  time: string;
  filled: boolean;
};

export const mockBusinessSlots: BusinessSlot[] = [
  { id: "s1", service: "Women's Cut & Blow Dry", time: "Today, 4:30 PM", filled: false },
  { id: "s2", service: "Colour Consultation", time: "Today, 5:15 PM", filled: true },
  { id: "s3", service: "Men's Cut", time: "Today, 6:00 PM", filled: false },
];

export type PendingBusiness = {
  id: string;
  name: string;
  abn: string;
  address: string;
  submitted: string;
};

export const mockPendingBusinesses: PendingBusiness[] = [
  {
    id: "p1",
    name: "Glow Beauty Rooms",
    abn: "51 824 753 556",
    address: "9 Wolfe St, Newcastle",
    submitted: "2 days ago",
  },
  {
    id: "p2",
    name: "The Wax Bar Newcastle",
    abn: "12 345 678 910",
    address: "101 Hunter St, Newcastle",
    submitted: "5 hours ago",
  },
];
