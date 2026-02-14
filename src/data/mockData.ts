export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  location: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
  tripType: string;
  description: string;
  maxGroupSize: number;
  hostId: string;
  participantIds: string[];
  createdAt: string;
}

export const TRIP_TYPES = [
  "Backpacking",
  "Trek",
  "Social",
  "Road Trip",
  "Beach",
  "Cultural",
  "Adventure",
  "Wellness",
];

export const users: User[] = [
  {
    id: "u1",
    name: "Arjun Mehta",
    avatar: "https://i.pravatar.cc/150?img=11",
    bio: "Solo traveler & mountain lover. Always chasing sunsets.",
    location: "Mumbai, India",
  },
  {
    id: "u2",
    name: "Priya Sharma",
    avatar: "https://i.pravatar.cc/150?img=5",
    bio: "Beach bum & culture enthusiast. Let's explore together!",
    location: "Delhi, India",
  },
  {
    id: "u3",
    name: "Ravi Kumar",
    avatar: "https://i.pravatar.cc/150?img=12",
    bio: "Weekend warrior. Trek, eat, repeat.",
    location: "Bangalore, India",
  },
  {
    id: "u4",
    name: "Ananya Desai",
    avatar: "https://i.pravatar.cc/150?img=9",
    bio: "Digital nomad working from cafés around the world.",
    location: "Pune, India",
  },
  {
    id: "u5",
    name: "Karan Singh",
    avatar: "https://i.pravatar.cc/150?img=15",
    bio: "Adventure junkie. If it scares me, I'm doing it.",
    location: "Jaipur, India",
  },
  {
    id: "u6",
    name: "Meera Nair",
    avatar: "https://i.pravatar.cc/150?img=20",
    bio: "Yoga, travel, and good vibes only.",
    location: "Kochi, India",
  },
];

export const trips: Trip[] = [
  {
    id: "t1",
    title: "Goa Backpacking Adventure",
    destination: "Goa, India",
    coverImage: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80",
    startDate: "2026-03-15",
    endDate: "2026-03-22",
    budget: 12000,
    currency: "INR",
    tripType: "Backpacking",
    description:
      "Explore the hidden beaches of South Goa, party in North Goa, and discover the Portuguese heritage. We'll stay in hostels, eat at beach shacks, and ride scooters along the coast. Perfect for first-time backpackers and seasoned travelers alike.",
    maxGroupSize: 8,
    hostId: "u1",
    participantIds: ["u1", "u2", "u4"],
    createdAt: "2026-02-01",
  },
  {
    id: "t2",
    title: "Himachal Pradesh Trek",
    destination: "Manali, Himachal Pradesh",
    coverImage: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80",
    startDate: "2026-04-10",
    endDate: "2026-04-18",
    budget: 15000,
    currency: "INR",
    tripType: "Trek",
    description:
      "A challenging 5-day trek through the Hampta Pass with breathtaking views of snow-capped peaks. Includes camping under the stars, crossing glacier streams, and experiencing mountain village life. All skill levels welcome — we go at the group's pace.",
    maxGroupSize: 10,
    hostId: "u3",
    participantIds: ["u3", "u5"],
    createdAt: "2026-02-05",
  },
  {
    id: "t3",
    title: "Bali Social Trip",
    destination: "Bali, Indonesia",
    coverImage: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
    startDate: "2026-05-01",
    endDate: "2026-05-10",
    budget: 45000,
    currency: "INR",
    tripType: "Social",
    description:
      "10 days in paradise! We'll visit Ubud rice terraces, snorkel in Nusa Penida, surf in Canggu, and enjoy sunset dinners in Seminyak. This trip is all about making friends, sharing stories, and creating memories that last a lifetime.",
    maxGroupSize: 12,
    hostId: "u2",
    participantIds: ["u2", "u1", "u6", "u4"],
    createdAt: "2026-02-08",
  },
  {
    id: "t4",
    title: "Rajasthan Desert Camp",
    destination: "Jaisalmer, Rajasthan",
    coverImage: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&q=80",
    startDate: "2026-03-28",
    endDate: "2026-04-02",
    budget: 18000,
    currency: "INR",
    tripType: "Cultural",
    description:
      "Experience the magic of the Thar Desert. Camel safaris at sunset, sleeping under the stars in luxury desert camps, exploring ancient forts, and savoring authentic Rajasthani cuisine. A trip that combines adventure with royal heritage.",
    maxGroupSize: 6,
    hostId: "u5",
    participantIds: ["u5", "u3", "u6", "u2", "u4"],
    createdAt: "2026-02-10",
  },
  {
    id: "t5",
    title: "Kerala Backwaters Wellness Retreat",
    destination: "Alleppey, Kerala",
    coverImage: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80",
    startDate: "2026-04-20",
    endDate: "2026-04-26",
    budget: 22000,
    currency: "INR",
    tripType: "Wellness",
    description:
      "Unwind on a traditional houseboat cruise through Kerala's serene backwaters. Daily yoga sessions, Ayurvedic treatments, fresh Kerala cuisine, and peaceful sunsets. Leave your stress behind and reconnect with yourself.",
    maxGroupSize: 8,
    hostId: "u6",
    participantIds: ["u6", "u4"],
    createdAt: "2026-02-12",
  },
  {
    id: "t6",
    title: "Ladakh Road Trip",
    destination: "Leh, Ladakh",
    coverImage: "https://images.unsplash.com/photo-1626014303715-48c7b1a7a814?w=800&q=80",
    startDate: "2026-06-05",
    endDate: "2026-06-15",
    budget: 30000,
    currency: "INR",
    tripType: "Road Trip",
    description:
      "The ultimate road trip! Ride through the world's highest motorable passes, camp by pristine lakes, visit ancient monasteries, and experience the raw beauty of Ladakh. Bikes and backup vehicle provided.",
    maxGroupSize: 8,
    hostId: "u1",
    participantIds: ["u1"],
    createdAt: "2026-02-13",
  },
];

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function getTripById(id: string): Trip | undefined {
  return trips.find((t) => t.id === id);
}

export function getTripsByHost(hostId: string): Trip[] {
  return trips.filter((t) => t.hostId === hostId);
}

export function getTripsJoinedByUser(userId: string): Trip[] {
  return trips.filter((t) => t.participantIds.includes(userId) && t.hostId !== userId);
}
