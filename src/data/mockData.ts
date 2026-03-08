export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  location: string;
}

export type TripAccessType = "open" | "apply" | "invite";

export interface ItineraryDay {
  title: string;
  description: string;
  stay: string;
  meals: string;
  activities: string;
  isFlexible?: boolean;
}

export interface CostBreakdown {
  accommodation?: string;
  transportation?: string;
  activities?: string;
  guide?: string;
  miscellaneous?: string;
}

export interface FAQ {
  question: string;
  answer: string;
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

  // Extended fields
  accessType?: TripAccessType;
  summary?: string;
  bookingCloseDate?: string;
  minSeats?: number;

  // Pricing
  pricePerPerson?: number;
  earlyBirdPrice?: number;
  paymentTerms?: "full" | "partial";
  advanceAmount?: number;
  breakdown?: CostBreakdown;

  // Content
  highlights?: string[];
  itinerary?: ItineraryDay[];
  accommodationType?: string;
  roomSharing?: string;
  stayName?: string;
  stayDescription?: string;
  amenities?: string[];
  includedItems?: string[];
  notIncludedItems?: string[];

  // Extra spend
  flightCostRange?: string;
  optionalActivitiesCost?: string;
  bufferBudget?: string;

  // Packing & experience
  thingsToCarry?: string[];
  experienceLevel?: string;
  fitnessLevel?: string;
  suitableFor?: string[];
  tripVibes?: string[];

  // Safety
  cancellationPolicy?: string;
  codeOfConduct?: string;
  medicalDeclaration?: boolean;
  emergencyContact?: boolean;

  // FAQs
  faqs?: FAQ[];

  // Host
  contactPreference?: string;
}

export const TRIP_TYPES = [
  "Backpacking", "Trek", "Social", "Road Trip", "Beach", "Cultural", "Adventure", "Wellness",
];

export const users: User[] = [
  { id: "u1", name: "Arjun Mehta", avatar: "https://i.pravatar.cc/150?img=11", bio: "Solo traveler & mountain lover. Always chasing sunsets. 3 years of hosting community trips across India.", location: "Mumbai, India" },
  { id: "u2", name: "Priya Sharma", avatar: "https://i.pravatar.cc/150?img=5", bio: "Beach bum & culture enthusiast. Let's explore together!", location: "Delhi, India" },
  { id: "u3", name: "Ravi Kumar", avatar: "https://i.pravatar.cc/150?img=12", bio: "Weekend warrior. Trek, eat, repeat. Certified mountaineering guide.", location: "Bangalore, India" },
  { id: "u4", name: "Ananya Desai", avatar: "https://i.pravatar.cc/150?img=9", bio: "Digital nomad working from cafés around the world.", location: "Pune, India" },
  { id: "u5", name: "Karan Singh", avatar: "https://i.pravatar.cc/150?img=15", bio: "Adventure junkie. If it scares me, I'm doing it.", location: "Jaipur, India" },
  { id: "u6", name: "Meera Nair", avatar: "https://i.pravatar.cc/150?img=20", bio: "Yoga, travel, and good vibes only.", location: "Kochi, India" },
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
    description: "Explore the hidden beaches of South Goa, party in North Goa, and discover the Portuguese heritage. We'll stay in hostels, eat at beach shacks, and ride scooters along the coast. Perfect for first-time backpackers and seasoned travelers alike.",
    maxGroupSize: 8,
    hostId: "u1",
    participantIds: ["u1", "u2", "u4"],
    createdAt: "2026-02-01",
    accessType: "open",
    summary: "7 days of beaches, scooter rides, and South Goa sunsets with a chill backpacking crew.",
    bookingCloseDate: "2026-03-10",
    pricePerPerson: 12000,
    earlyBirdPrice: 10500,
    paymentTerms: "partial",
    advanceAmount: 3000,
    breakdown: { accommodation: "4000", transportation: "2500", activities: "3000", guide: "0", miscellaneous: "2500" },
    highlights: [
      "Sunset beach bonfire at Palolem",
      "Scooter ride through hidden South Goa trails",
      "Portuguese heritage walk in Old Goa",
      "Beach shack hopping with local seafood",
      "Night market shopping at Arpora",
    ],
    itinerary: [
      { title: "Arrival & Beach Vibes", description: "Arrive in Goa, check into the hostel, and head to Baga Beach for sunset.", stay: "Zostel Goa", meals: "Dinner", activities: "Beach walk, welcome dinner" },
      { title: "South Goa Exploration", description: "Scooter ride to Palolem and Butterfly Beach. Hidden coves and cliff views.", stay: "Zostel Goa", meals: "Breakfast, Dinner", activities: "Scooter ride, swimming, cliff hike" },
      { title: "Old Goa Heritage Day", description: "Visit Se Cathedral, Basilica of Bom Jesus, and Fontainhas Latin Quarter.", stay: "Zostel Goa", meals: "Breakfast", activities: "Heritage walk, photography" },
      { title: "Water Sports & Nightlife", description: "Parasailing, jet skiing, and banana boat at Calangute. Party night at Tito's Lane.", stay: "Zostel Goa", meals: "Breakfast", activities: "Water sports, nightlife" },
      { title: "Spice Plantation & Waterfall", description: "Visit a spice plantation and Dudhsagar Falls.", stay: "Zostel Goa", meals: "Breakfast, Lunch", activities: "Plantation tour, waterfall swim" },
      { title: "Market Day & Bonfire", description: "Shop at the Saturday Night Market. Evening bonfire on the beach.", stay: "Zostel Goa", meals: "Breakfast, Dinner", activities: "Shopping, bonfire" },
      { title: "Departure", description: "Final breakfast together, group photo, and departure.", stay: "", meals: "Breakfast", activities: "Farewell" },
    ],
    accommodationType: "Hostel",
    roomSharing: "Dorm",
    stayName: "Zostel Goa — Anjuna",
    stayDescription: "A vibrant backpacker hostel just 5 minutes from Anjuna Beach. Rooftop café, common area, and free WiFi.",
    amenities: ["WiFi", "Hot Water", "Breakfast", "Locker", "Laundry"],
    includedItems: ["Accommodation (6 nights)", "Daily breakfast", "Scooter rental", "Spice plantation entry", "Bonfire setup", "Trip coordination"],
    notIncludedItems: ["Flights to Goa", "Lunch & dinner (except mentioned)", "Water sports fees", "Personal shopping", "Travel insurance"],
    flightCostRange: "₹3,000 – ₹8,000",
    optionalActivitiesCost: "₹2,000 – ₹5,000",
    bufferBudget: "₹3,000 – ₹5,000",
    thingsToCarry: ["ID Proof", "Sunscreen SPF 50+", "Swimwear", "Light cotton clothes", "Power bank", "Reusable water bottle"],
    experienceLevel: "Beginner",
    fitnessLevel: "Low",
    suitableFor: ["Solo travelers", "Friends"],
    tripVibes: ["Chill", "Party", "Explorer"],
    cancellationPolicy: "Full refund if cancelled 15+ days before. 50% refund 7–14 days before. No refund within 7 days.",
    codeOfConduct: "Respect fellow travelers, no harassment, keep shared spaces clean, be punctual for group activities.",
    medicalDeclaration: false,
    emergencyContact: true,
    faqs: [
      { question: "Is this trip beginner-friendly?", answer: "Absolutely! No prior travel experience required." },
      { question: "What if I cancel?", answer: "Full refund 15+ days before. 50% refund 7–14 days. No refund within 7 days." },
      { question: "Is airport pickup included?", answer: "Not included, but we'll share a group cab option." },
    ],
    contactPreference: "WhatsApp",
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
    description: "A challenging 5-day trek through the Hampta Pass with breathtaking views of snow-capped peaks. Includes camping under the stars, crossing glacier streams, and experiencing mountain village life.",
    maxGroupSize: 10,
    hostId: "u3",
    participantIds: ["u3", "u5"],
    createdAt: "2026-02-05",
    accessType: "apply",
    summary: "Cross the legendary Hampta Pass — snow, glaciers, and starry campsites at 14,000 ft.",
    bookingCloseDate: "2026-04-01",
    pricePerPerson: 15000,
    paymentTerms: "partial",
    advanceAmount: 5000,
    breakdown: { accommodation: "3000", transportation: "3000", activities: "4000", guide: "3000", miscellaneous: "2000" },
    highlights: [
      "Cross Hampta Pass at 14,100 ft",
      "Camp under the Milky Way",
      "Glacier stream crossings",
      "Mountain village homestay",
      "Professional guide included",
    ],
    itinerary: [
      { title: "Arrival in Manali", description: "Check-in, gear briefing, and acclimatization walk.", stay: "Hostel in Manali", meals: "Dinner", activities: "Gear check, group introductions" },
      { title: "Manali to Jobra", description: "Drive to Jobra, start the trek through pine forests.", stay: "Campsite", meals: "All meals", activities: "6 km trek through forests" },
      { title: "Jobra to Balu ka Ghera", description: "Trek through open meadows with panoramic views.", stay: "Campsite", meals: "All meals", activities: "10 km trek, river crossing" },
      { title: "Hampta Pass Crossing", description: "Summit day — cross the pass at 14,100 ft with stunning views of Lahaul Valley.", stay: "Campsite", meals: "All meals", activities: "Pass crossing, photography" },
      { title: "Descent to Chatru", description: "Descend to Chatru, celebrate the summit.", stay: "Campsite", meals: "All meals", activities: "Descent trek, bonfire" },
      { title: "Chandratal Lake", description: "Drive to the stunning Chandratal Lake (Moon Lake).", stay: "Campsite", meals: "All meals", activities: "Lake visit, photography" },
      { title: "Return to Manali", description: "Drive back to Manali, farewell lunch.", stay: "", meals: "Breakfast, Lunch", activities: "Farewell" },
    ],
    accommodationType: "Camping",
    roomSharing: "Twin Sharing",
    stayDescription: "Alpine camping with quality tents, sleeping bags, and camping mats provided.",
    amenities: ["Hot Water", "Power Backup"],
    includedItems: ["Camping equipment", "All meals on trek", "Professional guide", "Porter support", "First-aid kit", "Forest permits"],
    notIncludedItems: ["Travel to Manali", "Personal gear", "Travel insurance", "Anything not mentioned"],
    flightCostRange: "₹4,000 – ₹10,000",
    bufferBudget: "₹2,000 – ₹4,000",
    thingsToCarry: ["Trek shoes (mandatory)", "Warm layers", "Rain jacket", "Sunscreen", "Personal medicines", "Power bank", "Water bottle (1L min)"],
    experienceLevel: "Moderate",
    fitnessLevel: "High",
    suitableFor: ["Solo travelers", "Friends"],
    tripVibes: ["Adventure", "Explorer"],
    cancellationPolicy: "Full refund 21+ days before. 50% refund 10–20 days. No refund within 10 days.",
    medicalDeclaration: true,
    emergencyContact: true,
    faqs: [
      { question: "How fit do I need to be?", answer: "You should be able to walk 10 km on hilly terrain comfortably. We recommend 2 weeks of cardio prep." },
      { question: "Is altitude sickness a risk?", answer: "We acclimatize properly and our guide carries emergency oxygen." },
      { question: "What if weather is bad?", answer: "We monitor conditions closely. Route may be adjusted for safety." },
    ],
    contactPreference: "In-app only",
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
    description: "10 days in paradise! We'll visit Ubud rice terraces, snorkel in Nusa Penida, surf in Canggu, and enjoy sunset dinners in Seminyak. This trip is all about making friends, sharing stories, and creating memories.",
    maxGroupSize: 12,
    hostId: "u2",
    participantIds: ["u2", "u1", "u6", "u4"],
    createdAt: "2026-02-08",
    accessType: "open",
    summary: "10 days in Bali — rice terraces, surf lessons, island hopping, and sunset parties with a social crew.",
    pricePerPerson: 45000,
    earlyBirdPrice: 39000,
    paymentTerms: "partial",
    advanceAmount: 15000,
    highlights: [
      "Sunrise at Ubud rice terraces",
      "Snorkeling at Nusa Penida's Manta Point",
      "Surf lessons in Canggu",
      "Sunset dinner at a Seminyak beach club",
      "Temple visit at Uluwatu with Kecak dance",
    ],
    itinerary: [
      { title: "Arrival in Bali", description: "Airport pickup, check-in at Canggu villa, welcome dinner.", stay: "Villa in Canggu", meals: "Dinner", activities: "Welcome party" },
      { title: "Canggu Beach Day", description: "Surf lessons, beach club, and sunset cocktails.", stay: "Villa in Canggu", meals: "Breakfast", activities: "Surfing, beach club" },
      { title: "Ubud Adventure", description: "Tegallalang rice terraces, monkey forest, and art market.", stay: "Boutique stay in Ubud", meals: "Breakfast, Lunch", activities: "Rice terrace walk, monkey forest" },
      { title: "Ubud Wellness", description: "Morning yoga, waterfall hike, spa afternoon.", stay: "Boutique stay in Ubud", meals: "Breakfast", activities: "Yoga, waterfall, spa" },
      { title: "Nusa Penida Day Trip", description: "Speed boat to Nusa Penida, snorkeling at Manta Point, Kelingking Beach.", stay: "Villa in Canggu", meals: "Breakfast, Lunch", activities: "Snorkeling, beach hopping" },
      { title: "Temple & Culture", description: "Uluwatu Temple, Kecak fire dance, seafood dinner.", stay: "Villa in Canggu", meals: "Breakfast, Dinner", activities: "Temple visit, cultural show" },
      { title: "Free Day", description: "Explore on your own — spa, shopping, or just beach.", stay: "Villa in Canggu", meals: "Breakfast", activities: "Free exploration", isFlexible: true },
      { title: "Seminyak Night Out", description: "Beach club hopping, sunset session, farewell party.", stay: "Villa in Canggu", meals: "Breakfast, Dinner", activities: "Nightlife, farewell party" },
      { title: "Departure", description: "Final breakfast, airport drop for those leaving.", stay: "", meals: "Breakfast", activities: "Farewell" },
    ],
    accommodationType: "Mixed",
    roomSharing: "Twin Sharing",
    stayName: "Private villa in Canggu + Boutique stay in Ubud",
    stayDescription: "Stay at a private pool villa in Canggu (shared rooms) and a cozy boutique homestay in Ubud with garden views.",
    amenities: ["WiFi", "Pool", "AC", "Breakfast", "Hot Water", "Parking"],
    includedItems: ["Accommodation (9 nights)", "Daily breakfast", "Airport transfers", "Nusa Penida boat & snorkeling", "Surf lesson", "Uluwatu temple entry"],
    notIncludedItems: ["International flights", "Visa on arrival ($35)", "Travel insurance", "Lunch & dinner (except mentioned)", "Personal shopping"],
    flightCostRange: "₹15,000 – ₹25,000",
    optionalActivitiesCost: "₹5,000 – ₹10,000",
    bufferBudget: "₹8,000 – ₹12,000",
    thingsToCarry: ["Passport", "Sunscreen SPF 50+", "Swimwear", "Light clothes", "Power bank", "Waterproof phone pouch"],
    experienceLevel: "Beginner",
    fitnessLevel: "Low",
    suitableFor: ["Solo travelers", "Couples", "Friends"],
    tripVibes: ["Chill", "Party", "Explorer", "Photography"],
    cancellationPolicy: "Full refund 30+ days before. 50% refund 15–29 days. No refund within 14 days.",
    emergencyContact: true,
    faqs: [
      { question: "Do I need a visa?", answer: "Indians get visa on arrival for $35 (30-day stay)." },
      { question: "Is this trip good for solo travelers?", answer: "Absolutely! Most people join solo and leave with lifelong friends." },
    ],
    contactPreference: "WhatsApp",
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
    description: "Experience the magic of the Thar Desert. Camel safaris at sunset, sleeping under the stars in luxury desert camps, exploring ancient forts, and savoring authentic Rajasthani cuisine.",
    maxGroupSize: 6,
    hostId: "u5",
    participantIds: ["u5", "u3", "u6", "u2", "u4"],
    createdAt: "2026-02-10",
    accessType: "invite",
    summary: "5 nights in the Thar Desert — camel safaris, fort explorations, and luxury desert camping under the stars.",
    pricePerPerson: 18000,
    paymentTerms: "full",
    highlights: [
      "Camel safari through Thar Desert dunes",
      "Luxury desert camp under the Milky Way",
      "Jaisalmer Fort exploration",
      "Authentic Rajasthani cuisine feast",
      "Sunset photography at Sam Sand Dunes",
    ],
    itinerary: [
      { title: "Arrival in Jaisalmer", description: "Check into heritage haveli, explore the Golden Fort.", stay: "Heritage Haveli", meals: "Dinner", activities: "Fort exploration" },
      { title: "Jaisalmer Heritage Walk", description: "Explore havelis, Jain temples, and local markets.", stay: "Heritage Haveli", meals: "Breakfast, Lunch", activities: "Heritage walk, shopping" },
      { title: "Desert Safari", description: "Camel ride through Sam Sand Dunes, sunset photography.", stay: "Luxury Desert Camp", meals: "All meals", activities: "Camel safari, folk music" },
      { title: "Desert Day", description: "Morning yoga in the dunes, jeep safari, cultural evening.", stay: "Luxury Desert Camp", meals: "All meals", activities: "Jeep safari, cultural show" },
      { title: "Departure", description: "Sunrise in the desert, final breakfast, departure.", stay: "", meals: "Breakfast", activities: "Farewell" },
    ],
    accommodationType: "Mixed",
    roomSharing: "Twin Sharing",
    stayDescription: "2 nights in a heritage haveli in Jaisalmer + 2 nights in luxury Swiss tents in the desert.",
    amenities: ["Hot Water", "Breakfast", "Power Backup"],
    includedItems: ["Accommodation", "Camel safari", "Jeep safari", "All meals at desert camp", "Fort entry", "Cultural evening"],
    notIncludedItems: ["Travel to Jaisalmer", "Personal expenses", "Travel insurance"],
    thingsToCarry: ["Sunscreen", "Warm jacket (desert nights)", "Comfortable shoes", "Camera", "Power bank"],
    experienceLevel: "Beginner",
    fitnessLevel: "Low",
    suitableFor: ["Solo travelers", "Couples", "Friends"],
    tripVibes: ["Explorer", "Photography", "Chill"],
    cancellationPolicy: "Full refund 14+ days before. No refund after.",
    emergencyContact: true,
    faqs: [
      { question: "How cold are desert nights?", answer: "March nights are around 15–18°C. Bring a light jacket." },
    ],
    contactPreference: "Chat",
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
    description: "Unwind on a traditional houseboat cruise through Kerala's serene backwaters. Daily yoga sessions, Ayurvedic treatments, fresh Kerala cuisine, and peaceful sunsets.",
    maxGroupSize: 8,
    hostId: "u6",
    participantIds: ["u6", "u4"],
    createdAt: "2026-02-12",
    accessType: "open",
    summary: "6 days of yoga, Ayurveda, and houseboat cruises through Kerala's magical backwaters.",
    pricePerPerson: 22000,
    paymentTerms: "partial",
    advanceAmount: 7000,
    highlights: [
      "Traditional houseboat cruise",
      "Daily sunrise yoga sessions",
      "Ayurvedic spa treatment",
      "Fresh Kerala fish curry feast",
      "Backwater village kayaking",
    ],
    includedItems: ["Accommodation", "Houseboat cruise", "Daily yoga", "One Ayurvedic session", "Breakfast & dinner", "Kayaking"],
    notIncludedItems: ["Flights", "Lunch", "Extra spa treatments", "Personal expenses"],
    experienceLevel: "Beginner",
    fitnessLevel: "Low",
    suitableFor: ["Solo travelers", "Couples"],
    tripVibes: ["Chill", "Spiritual"],
    cancellationPolicy: "Full refund 14+ days before. 50% refund 7–13 days. No refund within 7 days.",
    faqs: [
      { question: "Is yoga experience required?", answer: "Not at all! Sessions are suitable for all levels." },
    ],
  },
  {
    id: "t6",
    title: "Ladakh Road Trip",
    destination: "Leh, Ladakh",
    coverImage: "https://images.unsplash.com/photo-1506038634487-60a69ae4b7b1?w=800&q=80",
    startDate: "2026-06-05",
    endDate: "2026-06-15",
    budget: 30000,
    currency: "INR",
    tripType: "Road Trip",
    description: "The ultimate road trip! Ride through the world's highest motorable passes, camp by pristine lakes, visit ancient monasteries, and experience the raw beauty of Ladakh.",
    maxGroupSize: 8,
    hostId: "u1",
    participantIds: ["u1"],
    createdAt: "2026-02-13",
    accessType: "apply",
    summary: "10-day road trip through the world's highest passes — Khardung La, Pangong Lake, and ancient monasteries.",
    pricePerPerson: 30000,
    earlyBirdPrice: 27000,
    paymentTerms: "partial",
    advanceAmount: 10000,
    highlights: [
      "Ride through Khardung La (18,380 ft)",
      "Camp by Pangong Tso Lake",
      "Visit 600-year-old Thiksey Monastery",
      "Magnetic Hill & Confluence point",
      "Nubra Valley sand dunes & double-humped camels",
    ],
    itinerary: [
      { title: "Arrival in Leh", description: "Arrive, rest, and acclimatize. Easy walk around Leh Market.", stay: "Guesthouse in Leh", meals: "Dinner", activities: "Acclimatization, market walk" },
      { title: "Leh Exploration", description: "Leh Palace, Shanti Stupa, and local cafés.", stay: "Guesthouse in Leh", meals: "Breakfast", activities: "Sightseeing" },
      { title: "Leh to Nubra Valley", description: "Cross Khardung La pass, descend into Nubra Valley.", stay: "Camp in Nubra", meals: "All meals", activities: "Khardung La, Diskit Monastery" },
      { title: "Nubra Valley", description: "Sand dunes, double-humped camel ride, hot springs.", stay: "Camp in Nubra", meals: "All meals", activities: "Sand dunes, camel ride" },
      { title: "Nubra to Pangong", description: "Drive to Pangong Tso through Shyok route.", stay: "Camp by Pangong Lake", meals: "All meals", activities: "Drive, lake sunset" },
      { title: "Pangong Lake", description: "Sunrise at the lake, photography, relaxation.", stay: "Camp by Pangong Lake", meals: "All meals", activities: "Photography, relaxation" },
      { title: "Return to Leh", description: "Drive back via Chang La pass.", stay: "Guesthouse in Leh", meals: "Breakfast, Dinner", activities: "Scenic drive" },
      { title: "Departure", description: "Farewell breakfast, airport transfer.", stay: "", meals: "Breakfast", activities: "Farewell" },
    ],
    accommodationType: "Mixed",
    roomSharing: "Twin Sharing",
    stayDescription: "Mix of cozy guesthouses in Leh and camping at Nubra Valley and Pangong Lake.",
    amenities: ["Hot Water", "Power Backup", "Breakfast"],
    includedItems: ["Accommodation", "Vehicle with driver", "All permits", "Camping gear", "Meals on camping days", "Oxygen cylinder"],
    notIncludedItems: ["Flights to Leh", "Bike rental (optional)", "Personal gear", "Travel insurance", "Meals in Leh"],
    flightCostRange: "₹6,000 – ₹15,000",
    bufferBudget: "₹5,000 – ₹8,000",
    thingsToCarry: ["Warm layers (essential)", "Sunglasses", "Sunscreen SPF 50+", "Personal medicines", "Power bank", "Camera", "Water bottle"],
    experienceLevel: "Moderate",
    fitnessLevel: "Moderate",
    suitableFor: ["Solo travelers", "Friends"],
    tripVibes: ["Adventure", "Explorer", "Photography"],
    cancellationPolicy: "Full refund 21+ days before. 50% refund 10–20 days. No refund within 10 days.",
    medicalDeclaration: true,
    emergencyContact: true,
    faqs: [
      { question: "Is altitude a concern?", answer: "Yes, we include proper acclimatization days and carry emergency oxygen." },
      { question: "Can I bring my own bike?", answer: "Yes! Or we can arrange Royal Enfield rentals at additional cost." },
    ],
    contactPreference: "WhatsApp",
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

export function getSimilarTrips(trip: Trip, limit = 3): Trip[] {
  return trips
    .filter(t => t.id !== trip.id && (t.tripType === trip.tripType || t.destination === trip.destination))
    .slice(0, limit);
}
