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
    rating: 4.5,
    reviews: 302,
    address: "17 Hunter St, Newcastle",
  },
];
