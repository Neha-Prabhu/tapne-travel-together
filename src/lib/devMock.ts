import { trips as mockTrips, users as mockUsers } from "@/data/mockData";
import type {
  TripData, TripDetailResponse, TripListResponse, HomeResponse,
  SessionUser, SessionResponse, MyTripsResponse, BlogData,
  ParticipantData, ManageTripResponse, EnrollmentRequestData,
} from "@/types/api";
import type { ThreadData, InboxResponse, MessageData } from "@/types/messaging";

function mockUserToSessionUser(u: typeof mockUsers[0], idx: number): SessionUser {
  const username = u.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  return {
    id: idx + 1,
    username,
    email: `${username}@dev.tapne.com`,
    display_name: u.name,
    bio: u.bio,
    location: u.location,
    website: "",
    profile_url: `/u/${username}`,
    created_trips: 0,
    joined_trips: 0,
  };
}

function mockTripToTripData(trip: typeof mockTrips[0], idx: number): TripData {
  const hostIdx = mockUsers.findIndex(u => u.id === trip.hostId);
  const host = hostIdx >= 0 ? mockUsers[hostIdx] : mockUsers[0];
  const hostUsername = host.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  const tripId = parseInt(trip.id.replace("t", "")) || idx + 1;
  return {
    id: tripId,
    title: trip.title,
    summary: trip.summary || trip.description?.slice(0, 200),
    destination: trip.destination,
    banner_image_url: trip.coverImage,
    host_username: hostUsername,
    host_display_name: host.name,
    host_bio: host.bio,
    host_location: host.location,
    host_website: "",
    starts_at: trip.startDate,
    ends_at: trip.endDate,
    duration_days: trip.itinerary?.length || 7,
    trip_type: trip.tripType,
    budget_tier: trip.budget <= 10000 ? "budget" : trip.budget <= 20000 ? "mid" : "premium",
    difficulty_level: trip.experienceLevel || "moderate",
    pace_level: trip.fitnessLevel || "moderate",
    group_size_label: `Up to ${trip.maxGroupSize}`,
    total_seats: trip.maxGroupSize,
    minimum_seats: trip.minSeats ?? Math.ceil(trip.maxGroupSize / 2),
    spots_left: trip.maxGroupSize - (trip.participantIds?.length ?? 0),
    price_per_person: trip.pricePerPerson ?? trip.budget,
    total_trip_price: (trip.pricePerPerson ?? trip.budget) * trip.maxGroupSize,
    early_bird_price: trip.earlyBirdPrice,
    payment_terms: trip.paymentTerms ?? "full",
    booking_closes_at: trip.bookingCloseDate,
    highlights: trip.highlights ?? [],
    itinerary_days: (trip.itinerary ?? []).map((day, i) => ({
      day_number: i + 1,
      title: day.title,
      description: day.description,
      stay: day.stay,
      meals: day.meals,
      activities: day.activities,
      is_flexible: day.isFlexible ?? false,
    })),
    included_items: trip.includedItems ?? [],
    not_included_items: trip.notIncludedItems ?? [],
    things_to_carry: trip.thingsToCarry ?? [],
    suitable_for: trip.suitableFor ?? [],
    trip_vibe: trip.tripVibes ?? [],
    cancellation_policy: trip.cancellationPolicy ?? "",
    faqs: (trip.faqs ?? []).map(f => ({ question: f.question, answer: f.answer })),
    is_draft: false,
    is_published: true,
    can_manage: false,
    join_request_status: null,
    description: trip.description,
    access_type: trip.accessType || "open",
  };
}

const MOCK_TRIPS: TripData[] = mockTrips.map(mockTripToTripData);

// Add a past trip so the dev user can test review flows
const PAST_TRIP: TripData = {
  id: 99,
  title: "Kerala Backwaters Retreat",
  summary: "A relaxing 5-day houseboat and village experience through Kerala's backwaters.",
  destination: "Alleppey, Kerala",
  banner_image_url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80",
  host_username: "priya_sharma",
  host_display_name: "Priya Sharma",
  host_bio: "Beach bum & culture enthusiast.",
  host_location: "Delhi, India",
  host_website: "",
  starts_at: "2025-12-01",
  ends_at: "2025-12-06",
  duration_days: 5,
  trip_type: "Social",
  budget_tier: "mid",
  difficulty_level: "Beginner",
  pace_level: "Low",
  group_size_label: "Up to 8",
  total_seats: 8,
  minimum_seats: 4,
  spots_left: 0,
  price_per_person: 18000,
  total_trip_price: 144000,
  payment_terms: "full",
  highlights: ["Houseboat cruise", "Village walk", "Cooking class", "Sunset kayaking"],
  itinerary_days: [
    { day_number: 1, title: "Arrival & Houseboat", description: "Board the houseboat in Alleppey.", stay: "Houseboat", meals: "Dinner", activities: "Cruise" },
    { day_number: 2, title: "Village Walk", description: "Explore local villages and toddy shops.", stay: "Houseboat", meals: "All meals", activities: "Walking tour" },
    { day_number: 3, title: "Cooking Class", description: "Learn Kerala cuisine with a local family.", stay: "Homestay", meals: "All meals", activities: "Cooking" },
    { day_number: 4, title: "Kayaking", description: "Sunset kayaking through narrow canals.", stay: "Homestay", meals: "All meals", activities: "Kayaking" },
    { day_number: 5, title: "Departure", description: "Farewell breakfast and departure.", stay: "", meals: "Breakfast", activities: "Farewell" },
  ],
  included_items: ["Houseboat (2 nights)", "Homestay (2 nights)", "All meals", "Kayaking gear", "Cooking class"],
  not_included_items: ["Travel to Alleppey", "Personal expenses", "Travel insurance"],
  things_to_carry: ["Sunscreen", "Mosquito repellent", "Light clothes", "Camera"],
  suitable_for: ["Solo travelers", "Couples", "Friends"],
  trip_vibe: ["Chill", "Cultural", "Explorer"],
  cancellation_policy: "Full refund 14+ days before. No refund within 14 days.",
  faqs: [{ question: "Is swimming required?", answer: "No, life jackets provided for kayaking." }],
  is_draft: false,
  is_published: true,
  can_manage: false,
  join_request_status: "approved",
  description: "Experience the serene beauty of Kerala's backwaters on a traditional houseboat, explore charming villages, learn authentic Kerala cooking, and kayak through palm-lined canals at sunset.",
  access_type: "open",
};
MOCK_TRIPS.push(PAST_TRIP);

const MOCK_SESSION_USERS: SessionUser[] = mockUsers.map(mockUserToSessionUser);

let _devUser: SessionUser | null = null;
const _devDrafts = new Map<number, TripData>();
let _devDraftCounter = 5000;
const _bookmarkedTripIds = new Set<number>();
const _followedUsers = new Set<string>();
const _followerCounts = new Map<string, number>();

// ── Messaging state ──
function getDevUsername() { return _devUser?.username || MOCK_SESSION_USERS[0]?.username || "arjun_mehta"; }
function getDevDisplayName() { return _devUser?.display_name || MOCK_SESSION_USERS[0]?.display_name || "Arjun Mehta"; }

function buildMockThreads(): ThreadData[] {
  const me = getDevUsername();
  const meName = getDevDisplayName();
  return [
    {
      id: 1, type: "dm", title: "Priya Sharma",
      participants: [
        { username: me, display_name: meName, avatar_url: "" },
        { username: "priya_sharma", display_name: "Priya Sharma", avatar_url: "https://i.pravatar.cc/150?img=5" },
      ],
      last_message: "Hey! Are you joining the Goa trip?", last_sent_at: "2026-04-04T10:30:00Z", unread_count: 2,
      messages: [
        { id: 1, thread_id: 1, sender_username: "priya_sharma", sender_display_name: "Priya Sharma", sender_avatar: "https://i.pravatar.cc/150?img=5", body: "Hi there! I saw you're interested in travel.", sent_at: "2026-04-04T09:00:00Z" },
        { id: 2, thread_id: 1, sender_username: me, sender_display_name: meName, body: "Yes! I'm looking for group trips.", sent_at: "2026-04-04T09:15:00Z" },
        { id: 3, thread_id: 1, sender_username: "priya_sharma", sender_display_name: "Priya Sharma", sender_avatar: "https://i.pravatar.cc/150?img=5", body: "Hey! Are you joining the Goa trip?", sent_at: "2026-04-04T10:30:00Z" },
      ],
    },
    {
      id: 2, type: "dm", title: "Karan Singh",
      participants: [
        { username: me, display_name: meName, avatar_url: "" },
        { username: "karan_singh", display_name: "Karan Singh", avatar_url: "https://i.pravatar.cc/150?img=15" },
      ],
      last_message: "The trek route looks amazing!", last_sent_at: "2026-04-03T18:00:00Z", unread_count: 0,
      messages: [
        { id: 4, thread_id: 2, sender_username: "karan_singh", sender_display_name: "Karan Singh", sender_avatar: "https://i.pravatar.cc/150?img=15", body: "Have you done the Hampta Pass trek before?", sent_at: "2026-04-03T16:00:00Z" },
        { id: 5, thread_id: 2, sender_username: me, sender_display_name: meName, body: "Not yet! But it's on my bucket list.", sent_at: "2026-04-03T16:30:00Z" },
        { id: 6, thread_id: 2, sender_username: "karan_singh", sender_display_name: "Karan Singh", sender_avatar: "https://i.pravatar.cc/150?img=15", body: "The trek route looks amazing!", sent_at: "2026-04-03T18:00:00Z" },
      ],
    },
    {
      id: 3, type: "trip_query", title: "Query: Goa Backpacking", trip_id: 1, trip_title: "Goa Backpacking Adventure",
      participants: [
        { username: me, display_name: meName, avatar_url: "" },
        { username: "priya_sharma", display_name: "Priya Sharma", avatar_url: "https://i.pravatar.cc/150?img=5" },
      ],
      last_message: "What's the accommodation like?", last_sent_at: "2026-04-02T14:00:00Z", unread_count: 1,
      messages: [
        { id: 7, thread_id: 3, sender_username: me, sender_display_name: meName, body: "Hi! I have a question about the Goa trip. What's the accommodation like?", sent_at: "2026-04-02T14:00:00Z" },
      ],
    },
    {
      id: 4, type: "group_chat", title: "Goa Backpacking – Group Chat", trip_id: 1, trip_title: "Goa Backpacking Adventure",
      participants: [
        { username: me, display_name: meName, avatar_url: "" },
        { username: "priya_sharma", display_name: "Priya Sharma", avatar_url: "https://i.pravatar.cc/150?img=5" },
        { username: "karan_singh", display_name: "Karan Singh", avatar_url: "https://i.pravatar.cc/150?img=15" },
        { username: "ananya_desai", display_name: "Ananya Desai", avatar_url: "https://i.pravatar.cc/150?img=9" },
      ],
      last_message: "Can't wait for the trip! 🎉", last_sent_at: "2026-04-04T08:00:00Z", unread_count: 3,
      messages: [
        { id: 8, thread_id: 4, sender_username: me, sender_display_name: meName, body: "Welcome everyone! Excited for this trip.", sent_at: "2026-04-03T10:00:00Z" },
        { id: 9, thread_id: 4, sender_username: "priya_sharma", sender_display_name: "Priya Sharma", sender_avatar: "https://i.pravatar.cc/150?img=5", body: "Hey all! Has everyone booked their tickets?", sent_at: "2026-04-03T12:00:00Z" },
        { id: 10, thread_id: 4, sender_username: "ananya_desai", sender_display_name: "Ananya Desai", sender_avatar: "https://i.pravatar.cc/150?img=9", body: "Can't wait for the trip! 🎉", sent_at: "2026-04-04T08:00:00Z" },
      ],
    },
  ];
}
let _mockThreads: ThreadData[] | null = null;
function getMockThreads(): ThreadData[] {
  if (!_mockThreads) _mockThreads = buildMockThreads();
  return _mockThreads;
}
let _mockMsgIdCounter = 100;

// Track booking status per trip
const _tripBookingStatus = new Map<number, "open" | "closed" | "full">();

// Mock participants for host's trips
function getMockParticipants(tripId: number): ParticipantData[] {
  const trip = MOCK_TRIPS.find(t => t.id === tripId);
  if (!trip) return [];
  // Generate some fake participants
  return [
    { id: 1, user_id: 2, username: "priya_sharma", display_name: "Priya Sharma", status: "confirmed", joined_at: "2026-02-15T10:00:00Z" },
    { id: 2, user_id: 4, username: "ananya_desai", display_name: "Ananya Desai", status: "confirmed", joined_at: "2026-02-18T14:30:00Z" },
    { id: 3, user_id: 6, username: "meera_nair", display_name: "Meera Nair", status: "confirmed", joined_at: "2026-02-20T09:15:00Z" },
  ];
}

function getMockApplications(tripId: number): EnrollmentRequestData[] {
  const trip = MOCK_TRIPS.find(t => t.id === tripId);
  if (!trip || trip.access_type !== "apply") return [];
  return [
    { id: 101, trip_id: tripId, trip_title: trip.title, requester_username: "karan_singh", requester_display_name: "Karan Singh", message: "I've been trekking for 3 years and would love to join this group!", status: "pending", created_at: "2026-03-01T08:00:00Z" },
    { id: 102, trip_id: tripId, trip_title: trip.title, requester_username: "meera_nair", requester_display_name: "Meera Nair", message: "Experienced hiker, done Roopkund and Kedarkantha.", status: "approved", created_at: "2026-02-25T12:00:00Z", reviewed_at: "2026-02-26T10:00:00Z" },
    { id: 103, trip_id: tripId, trip_title: trip.title, requester_username: "dev_user", requester_display_name: "Dev User", message: "First time trekker but very fit.", status: "denied", created_at: "2026-02-20T16:00:00Z", reviewed_at: "2026-02-21T09:00:00Z" },
  ];
}

export function resolveMockRequest(method: string, url: string, body?: unknown): unknown {
  const path = url.replace("/__devmock__", "").replace(/\?.*$/, "");

  // ── User search ──
  if (method === "GET" && path.startsWith("/users/search/")) {
    const q = new URL("http://x" + url.replace("/__devmock__", "")).searchParams.get("q") || "";
    return { ok: true, users: q ? [
      { username: q.toLowerCase(), display_name: q },
      { username: q.toLowerCase() + "_travel", display_name: q + " (traveler)" },
    ] : [] };
  }

  // ── Notifications ──
  if (method === "GET" && path === "/notifications/") {
    if (!_devUser) return { notifications: [], unread_count: 0 };
    return {
      notifications: [
        { id: "1", icon: "👤", message: "Rahul joined your trip", time: "2 min ago", unread: true },
        { id: "2", icon: "✅", message: "Your trip application was accepted", time: "1 hour ago", unread: true },
        { id: "3", icon: "💬", message: "New message from Priya", time: "3 hours ago", unread: false },
      ],
      unread_count: 2,
    };
  }

  // ── DM Start ──
  if (method === "POST" && path === "/dm/start/") {
    return { ok: true, thread_id: 1 };
  }

  // ── Trip Reviews ──
  const reviewMatch = path.match(/^\/trips\/(\d+)\/reviews\/$/);
  if (reviewMatch && method === "POST") {
    const b = body as any;
    return { ok: true, outcome: "created", review: { id: Date.now(), rating: b?.rating || 5, headline: b?.headline || "", body: b?.body || "", author: _devUser?.display_name || "Dev User", created_at: new Date().toISOString() } };
  }


  if (method === "GET" && path === "/session/") {
    const resp: SessionResponse = { authenticated: !!_devUser, user: _devUser, csrf_token: "dev-csrf-token" };
    return resp;
  }

  // ── Auth ──
  if (method === "POST" && path === "/auth/login/") {
    _devUser = MOCK_SESSION_USERS[0];
    return { user: _devUser };
  }

  if (method === "POST" && path === "/auth/signup/") {
    const b = body as any;
    const name = b?.first_name || "Dev User";
    const username = name.toLowerCase().replace(/\s+/g, "_");
    _devUser = {
      id: 9999, username, email: b?.email ?? "dev@tapne.com",
      display_name: name, bio: "", location: "", website: "",
      profile_url: `/u/${username}`, created_trips: 0, joined_trips: 0,
    };
    return { user: _devUser };
  }

  if (method === "POST" && path === "/auth/logout/") {
    _devUser = null;
    return {};
  }

  // ── Home ──
  if (method === "GET" && path === "/home/") {
    const resp: HomeResponse = {
      trips: MOCK_TRIPS.filter(t => !t.is_draft).slice(0, 6).map(t => ({
        ...t,
        average_rating: t.average_rating ?? (3.5 + Math.random() * 1.5),
        reviews_count: t.reviews_count ?? Math.floor(Math.random() * 20 + 2),
        participants_count: t.participants_count ?? Math.floor(Math.random() * 10 + 2),
      })),
      blogs: [
        { slug: "solo-girl-india", title: "Solo Traveling as a Girl in India", excerpt: "My honest experience backpacking across Rajasthan and Kerala as a solo female traveler.", cover_image_url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=80", author_display_name: "Priya Sharma", created_at: "2026-03-01" },
        { slug: "found-travel-group", title: "How I Found My Travel Group", excerpt: "From solo trips to finding my tribe — here's how Tapne changed the way I travel.", cover_image_url: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=600&q=80", author_display_name: "Arjun Mehta", created_at: "2026-02-20" },
        { slug: "budget-himachal", title: "Budget Himachal in ₹8,000", excerpt: "A complete breakdown of how I did a 7-day Himachal trip on a shoestring budget.", cover_image_url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80", author_display_name: "Karan Singh", created_at: "2026-02-10" },
      ],
      profiles: [],
      community_profiles: [
        { username: "arjun_mehta", display_name: "Arjun Mehta", avatar_url: "https://i.pravatar.cc/150?img=11", travel_tags: ["Mountains", "Solo", "Backpacking"], location: "Mumbai, India", bio: "Solo traveler & mountain lover. Always chasing sunsets." },
        { username: "priya_sharma", display_name: "Priya Sharma", avatar_url: "https://i.pravatar.cc/150?img=5", travel_tags: ["Beach", "Chill", "Cultural"], location: "Delhi, India", bio: "Beach bum & culture enthusiast. Let's explore together!" },
        { username: "ravi_kumar", display_name: "Ravi Kumar", avatar_url: "https://i.pravatar.cc/150?img=12", travel_tags: ["Trekking", "Adventure", "Party"], location: "Bangalore, India", bio: "Weekend warrior. Trek, eat, repeat." },
        { username: "ananya_desai", display_name: "Ananya Desai", avatar_url: "https://i.pravatar.cc/150?img=9", travel_tags: ["Workation", "Solo", "Chill"], location: "Pune, India", bio: "Digital nomad blending work & wanderlust." },
        { username: "karan_singh", display_name: "Karan Singh", avatar_url: "https://i.pravatar.cc/150?img=15", travel_tags: ["Adventure", "Road Trip", "Social"], location: "Jaipur, India", bio: "Road tripper & storyteller. 50+ trips and counting." },
        { username: "meera_nair", display_name: "Meera Nair", avatar_url: "https://i.pravatar.cc/150?img=20", travel_tags: ["Yoga", "Wellness", "Explorer"], location: "Kochi, India", bio: "Yoga teacher exploring ashrams and hidden trails." },
      ],
      testimonials: [
        { id: 1, user_name: "Ananya Desai", user_avatar: "https://i.pravatar.cc/150?img=9", rating: 5, text: "Tapne helped me find my travel tribe. The Goa trip was life-changing — I made friends I still travel with!" },
        { id: 2, user_name: "Karan Singh", user_avatar: "https://i.pravatar.cc/150?img=15", rating: 5, text: "As a solo traveler, I was nervous. But the community vibe on Tapne made it feel like traveling with old friends." },
        { id: 3, user_name: "Meera Nair", user_avatar: "https://i.pravatar.cc/150?img=20", rating: 4, text: "I hosted my first trip through Tapne and the tools made it so easy. 10/10 would recommend for new hosts." },
      ],
      stats: { travelers: 3200, trips_hosted: 127, destinations: 54 },
    };
    return resp;
  }

  // ── Trips list ──
  if (method === "GET" && path === "/trips/") {
    const resp: TripListResponse = { trips: MOCK_TRIPS };
    return resp;
  }

  // ── Trip detail ──
  const tripDetailMatch = path.match(/^\/trips\/(\d+)\/$/);
  if (method === "GET" && tripDetailMatch) {
    const id = parseInt(tripDetailMatch[1]);
    const trip = MOCK_TRIPS.find(t => t.id === id) ?? MOCK_TRIPS[0];
    const isHost = _devUser && trip.host_username === _devUser.username;
    const resp: TripDetailResponse = {
      trip: { ...trip, booking_status: _tripBookingStatus.get(trip.id) || (trip.spots_left === 0 ? "full" : "open") },
      can_manage_trip: !!isHost,
      mode: isHost ? "manage" : "view",
      similar_trips: MOCK_TRIPS.filter(t => t.id !== trip.id).slice(0, 3),
    };
    return resp;
  }

  // ── Blogs / Experiences ──
  if (method === "GET" && path === "/blogs/") {
    return {
      blogs: [
        { slug: "solo-girl-india", title: "Solo Traveling as a Girl in India", excerpt: "My honest experience backpacking across Rajasthan and Kerala as a solo female traveler.", short_description: "My honest experience backpacking across Rajasthan and Kerala as a solo female traveler.", body: "<p>Traveling solo as a woman in India was one of the most transformative experiences of my life.</p>", cover_image_url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=80", author_username: "priya_sharma", author_display_name: "Priya Sharma", created_at: "2026-03-01", tags: ["Solo", "Cultural", "Budget"], location: "Rajasthan, India" },
        { slug: "found-travel-group", title: "How I Found My Travel Group", excerpt: "From solo trips to finding my tribe — here's how Tapne changed the way I travel.", short_description: "From solo trips to finding my tribe — here's how Tapne changed the way I travel.", body: "<p>I used to think solo travel was the only way.</p>", cover_image_url: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=600&q=80", author_username: "arjun_mehta", author_display_name: "Arjun Mehta", created_at: "2026-02-20", tags: ["Social", "Chill"], location: "Goa, India" },
        { slug: "budget-himachal", title: "Budget Himachal in ₹8,000", excerpt: "A complete breakdown of how I did a 7-day Himachal trip on a shoestring budget.", short_description: "A complete breakdown of how I did a 7-day Himachal trip on a shoestring budget.", body: "<p>Everyone thinks Himachal is expensive. I proved them wrong.</p>", cover_image_url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80", author_username: "karan_singh", author_display_name: "Karan Singh", created_at: "2026-02-10", tags: ["Budget", "Trek", "Solo"], location: "Himachal Pradesh, India" },
      ] as BlogData[],
    };
  }

  // Blog detail
  const blogDetailMatch = path.match(/^\/blogs\/([^/]+)\/$/);
  if (method === "GET" && blogDetailMatch) {
    const slug = blogDetailMatch[1];
    const allBlogs: BlogData[] = [
      { slug: "solo-girl-india", title: "Solo Traveling as a Girl in India", excerpt: "My honest experience backpacking across Rajasthan and Kerala as a solo female traveler.", short_description: "My honest experience backpacking across Rajasthan and Kerala as a solo female traveler.", body: "<p>Traveling solo as a woman in India was one of the most transformative experiences of my life. From the golden deserts of Rajasthan to the lush backwaters of Kerala, every day brought new adventures and incredible people.</p><p>Safety was always on my mind, but I found that with basic precautions—sharing my location, staying in well-reviewed hostels, and trusting my instincts—I felt surprisingly comfortable throughout the journey.</p><h2>My Top Tips</h2><ul><li>Always share your live location with someone you trust</li><li>Book hostels with good reviews from female travelers</li><li>Trust your instincts — if something feels off, leave</li><li>Connect with other travelers through platforms like Tapne</li></ul>", cover_image_url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=80", author_username: "priya_sharma", author_display_name: "Priya Sharma", created_at: "2026-03-01", tags: ["Solo", "Cultural", "Budget"], location: "Rajasthan, India" },
      { slug: "found-travel-group", title: "How I Found My Travel Group", excerpt: "From solo trips to finding my tribe.", short_description: "From solo trips to finding my tribe — here's how Tapne changed the way I travel.", body: "<p>I used to think solo travel was the only way. But after joining my first community trip on Tapne, everything changed.</p><p>The people I met became lifelong friends. Now I host my own trips and love watching strangers become friends over shared sunsets and chai.</p>", cover_image_url: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=600&q=80", author_username: "arjun_mehta", author_display_name: "Arjun Mehta", created_at: "2026-02-20", tags: ["Social", "Chill"], location: "Goa, India" },
      { slug: "budget-himachal", title: "Budget Himachal in ₹8,000", excerpt: "A complete breakdown of how I did a 7-day Himachal trip.", short_description: "A complete breakdown of how I did a 7-day Himachal trip on a shoestring budget.", body: "<p>Everyone thinks Himachal is expensive. I proved them wrong.</p><p>Here's exactly how I spent 7 days in the mountains for just ₹8,000. The key? Local buses, homestays, and cooking your own meals when possible.</p>", cover_image_url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80", author_username: "karan_singh", author_display_name: "Karan Singh", created_at: "2026-02-10", tags: ["Budget", "Trek", "Solo"], location: "Himachal Pradesh, India" },
    ];
    const blog = allBlogs.find(b => b.slug === slug);
    return { blog: blog || null };
  }

  // Blog create
  if (method === "POST" && path === "/blogs/") {
    return { blog: { slug: "new-experience", ...(body as any) } };
  }

  // Blog update (PATCH)
  const blogPatchMatch = path.match(/^\/blogs\/([^/]+)\/$/);
  if (method === "PATCH" && blogPatchMatch) {
    return { blog: { slug: blogPatchMatch[1], ...(body as any) } };
  }

  // Blog delete
  const blogDeleteMatch = path.match(/^\/blogs\/([^/]+)\/$/);
  if (method === "DELETE" && blogDeleteMatch) {
    return {};
  }

  // ── My Trips ──
  if (method === "GET" && path === "/my-trips/") {
    const draftList = Array.from(_devDrafts.values());
    // Also include mock trips hosted by current user as published trips
    const hostUsername = _devUser?.username;
    const hostedTrips = hostUsername
      ? MOCK_TRIPS.filter(t => t.host_username === hostUsername).map(t => ({
          ...t,
          can_manage: true,
          booking_status: _tripBookingStatus.get(t.id) || (t.spots_left === 0 ? "full" : "open") as "open" | "closed" | "full",
          participants_count: getMockParticipants(t.id).length,
          applications_count: getMockApplications(t.id).filter(a => a.status === "pending").length,
        }))
      : [];
    const allTrips = [...draftList, ...hostedTrips];
    const now = new Date();
    const resp: MyTripsResponse = {
      trips: allTrips,
      active_tab: "created",
      tab_counts: {
        drafts: draftList.length,
        published: hostedTrips.filter(t => !t.ends_at || new Date(t.ends_at) >= now).length,
        past: hostedTrips.filter(t => t.ends_at && new Date(t.ends_at) < now).length,
      },
    };
    return resp;
  }

  // ── Manage Trip ──
  const manageTripMatch = path.match(/^\/manage-trip\/(\d+)\/$/);
  if (method === "GET" && manageTripMatch) {
    const id = parseInt(manageTripMatch[1]);
    const trip = MOCK_TRIPS.find(t => t.id === id) || Array.from(_devDrafts.values()).find(t => t.id === id);
    if (!trip) return { error: "Trip not found" };
    const resp: ManageTripResponse = {
      trip: {
        ...trip,
        can_manage: true,
        booking_status: _tripBookingStatus.get(trip.id) || (trip.spots_left === 0 ? "full" : "open"),
        participants_count: getMockParticipants(id).length,
        applications_count: getMockApplications(id).filter(a => a.status === "pending").length,
      },
      participants: getMockParticipants(id),
      applications: getMockApplications(id),
    };
    return resp;
  }

  // ── Booking status toggle ──
  const bookingStatusMatch = path.match(/^\/manage-trip\/(\d+)\/booking-status\/$/);
  if (method === "POST" && bookingStatusMatch) {
    const id = parseInt(bookingStatusMatch[1]);
    const b = body as any;
    _tripBookingStatus.set(id, b?.status || "open");
    return { ok: true };
  }

  // ── Cancel trip ──
  const cancelTripMatch = path.match(/^\/manage-trip\/(\d+)\/cancel\/$/);
  if (method === "POST" && cancelTripMatch) {
    return { ok: true };
  }

  // ── Remove participant ──
  const removeParticipantMatch = path.match(/^\/manage-trip\/(\d+)\/participants\/(\d+)\/remove\/$/);
  if (method === "POST" && removeParticipantMatch) {
    return { ok: true };
  }

  // ── Message participants ──
  const messageMatch = path.match(/^\/manage-trip\/(\d+)\/message\/$/);
  if (method === "POST" && messageMatch) {
    return { ok: true };
  }

  // ── Draft CRUD ──
  if (method === "POST" && path === "/trip-drafts/") {
    const b = body as any;
    const newId = ++_devDraftCounter;
    const newDraft: TripData = {
      id: newId, title: b?.title ?? "", destination: b?.destination ?? "",
      is_draft: true, is_published: false, can_manage: true,
    };
    _devDrafts.set(newId, newDraft);
    return { draft: newDraft };
  }

  const draftPatchMatch = path.match(/^\/trip-drafts\/(\d+)\/$/);
  if (method === "PATCH" && draftPatchMatch) {
    const id = parseInt(draftPatchMatch[1]);
    const existing = _devDrafts.get(id) ?? { id, is_draft: true, is_published: false, can_manage: true } as TripData;
    const updated = { ...existing, ...(body as Record<string, any>) };
    _devDrafts.set(id, updated);
    return { draft: updated };
  }

  const draftDeleteMatch = path.match(/^\/trip-drafts\/(\d+)\/$/);
  if (method === "DELETE" && draftDeleteMatch) {
    const id = parseInt(draftDeleteMatch[1]);
    _devDrafts.delete(id);
    return {};
  }

  const draftPublishMatch = path.match(/^\/trip-drafts\/(\d+)\/publish\/$/);
  if (method === "POST" && draftPublishMatch) {
    const id = parseInt(draftPublishMatch[1]);
    const existing = _devDrafts.get(id);
    if (existing) _devDrafts.set(id, { ...existing, is_draft: false, is_published: true });
    return {};
  }

  // ── Duplicate trip (published/completed) ──
  const duplicateTripMatch = path.match(/^\/trips\/(\d+)\/duplicate\/$/);
  if (method === "POST" && duplicateTripMatch) {
    const id = parseInt(duplicateTripMatch[1]);
    const original = MOCK_TRIPS.find(t => t.id === id);
    if (!original) return { error: "Not found" };
    const newId = ++_devDraftCounter;
    const newDraft: TripData = {
      ...original,
      id: newId,
      title: `Copy of ${original.title}`,
      is_draft: true,
      is_published: false,
      can_manage: true,
      join_request_status: null,
      spots_left: original.total_seats,
    };
    _devDrafts.set(newId, newDraft);
    return { draft: newDraft };
  }

  // ── Bookmarks ──
  if (method === "GET" && path === "/bookmarks/") {
    return { trips: _bookmarkedTripIds.size > 0 ? MOCK_TRIPS.filter(t => _bookmarkedTripIds.has(t.id)) : [] };
  }
  const bookmarkAddMatch = path.match(/^\/bookmarks\/(\d+)\/$/);
  if (method === "POST" && bookmarkAddMatch) {
    _bookmarkedTripIds.add(parseInt(bookmarkAddMatch[1]));
    return { ok: true };
  }
  if (method === "DELETE" && bookmarkAddMatch) {
    _bookmarkedTripIds.delete(parseInt(bookmarkAddMatch[1]));
    return { ok: true };
  }

  // ── Follow ──
  const followMatch = path.match(/^\/profile\/([^/]+)\/follow\/$/);
  if (method === "POST" && followMatch) {
    const username = followMatch[1];
    _followedUsers.add(username);
    return { ok: true, followers_count: (_followerCounts.get(username) ?? 12) + 1 };
  }
  if (method === "DELETE" && followMatch) {
    const username = followMatch[1];
    _followedUsers.delete(username);
    return { ok: true, followers_count: Math.max(0, (_followerCounts.get(username) ?? 12) - 1) };
  }

  // ── Profile (public view) ──
  const profileViewMatch = path.match(/^\/profile\/([^/]+)\/$/);
  if (method === "GET" && profileViewMatch) {
    const profileId = profileViewMatch[1];
    // Find the mock user by username or id
    const idx = MOCK_SESSION_USERS.findIndex(u => u.username === profileId || String(u.id) === profileId);
    const su = idx >= 0 ? MOCK_SESSION_USERS[idx] : _devUser;
    const mu = idx >= 0 ? mockUsers[idx] : null;

    if (!su) return { profile: null, trips_hosted: [], trips_joined: [], reviews: [], gallery: [] };

    const hostedTrips = MOCK_TRIPS.filter(t => t.host_username === su.username);
    const joinedTrips = MOCK_TRIPS.filter(t => t.host_username !== su.username).slice(0, 2);

    const mockReviews = [
      { id: 1, reviewer_name: "Priya Sharma", reviewer_avatar: "https://i.pravatar.cc/150?img=5", rating: 5, text: "Amazing host! Made the entire trip so seamless and fun. Would definitely join again.", trip_title: "Goa Backpacking Adventure", created_at: "2026-02-10T10:00:00Z" },
      { id: 2, reviewer_name: "Karan Singh", reviewer_avatar: "https://i.pravatar.cc/150?img=15", rating: 4, text: "Great itinerary planning and super friendly. Loved every moment of the trek.", trip_title: "Himachal Pradesh Trek", created_at: "2026-01-20T08:00:00Z" },
    ];

    const mockGallery = [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=80",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80",
      "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=400&q=80",
      "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400&q=80",
    ];

    const isFollowed = _followedUsers.has(su.username);
    const baseFollowers = _followerCounts.get(su.username) ?? (hostedTrips.length > 0 ? 47 : 12);

    return {
      profile: {
        username: su.username,
        email: su.email,
        display_name: su.display_name,
        bio: su.bio || mu?.bio || "",
        location: su.location || mu?.location || "",
        website: su.website,
        avatar_url: mu?.avatar,
        travel_tags: ["Mountains", "Backpacking", "Culture", "Photography"],
        average_rating: hostedTrips.length > 0 ? 4.6 : undefined,
        reviews_count: hostedTrips.length > 0 ? 12 : 0,
        trips_hosted: hostedTrips.length,
        travelers_hosted: hostedTrips.length * 6,
        trips_joined: joinedTrips.length + 3,
        followers_count: baseFollowers + (isFollowed ? 1 : 0),
        is_following: isFollowed,
      },
      trips_hosted: hostedTrips,
      trips_joined: joinedTrips,
      reviews: hostedTrips.length > 0 ? mockReviews : [],
      gallery: mockGallery,
    };
  }

  // ── Profile (own - me) ──
  if (method === "GET" && path === "/accounts/me/") {
    return { profile: _devUser ? { username: _devUser.username, display_name: _devUser.display_name, bio: _devUser.bio, location: _devUser.location, website: _devUser.website, created_trips: 0, joined_trips: 0 } : null };
  }

  if (method === "PATCH" && path === "/accounts/me/") {
    const b = body as any;
    if (_devUser) {
      if (b?.display_name) _devUser = { ..._devUser, display_name: b.display_name };
    if (b?.bio !== undefined) _devUser = { ..._devUser, bio: b.bio };
      if (b?.location !== undefined) _devUser = { ..._devUser, location: b.location };
      if (b?.website !== undefined) _devUser = { ..._devUser, website: b.website };
      if (b?.travel_tags !== undefined) _devUser = { ..._devUser, travel_tags: b.travel_tags } as any;
    }
    return { profile: _devUser };
  }

  // ── Hosting inbox ──
  if (method === "GET" && path.startsWith("/hosting/inbox")) {
    return { requests: [], counts: { all: 0, pending: 0, approved: 0, denied: 0 } };
  }

  // ── Join request ──
  const joinMatch = path.match(/^\/trips\/(\d+)\/join-request\/$/);
  if (method === "POST" && joinMatch) {
    return { ok: true, status: "pending" };
  }

  // ── Application decision ──
  const decisionMatch = path.match(/^\/hosting-requests\/(\d+)\/decision\/$/);
  if (method === "POST" && decisionMatch) {
    return { ok: true };
  }

  // ── DM Inbox ──
  if (method === "GET" && path === "/dm/inbox/") {
    const threads = getMockThreads();
    const resp: InboxResponse = { threads };
    return resp;
  }

  // ── Send message to thread ──
  const threadMsgMatch = path.match(/^\/dm\/inbox\/(\d+)\/messages\/$/);
  if (method === "POST" && threadMsgMatch) {
    const threadId = parseInt(threadMsgMatch[1]);
    const threads = getMockThreads();
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      const b = body as any;
      const newMsg: MessageData = {
        id: ++_mockMsgIdCounter,
        thread_id: threadId,
        sender_username: getDevUsername(),
        sender_display_name: getDevDisplayName(),
        body: b?.body || "",
        sent_at: new Date().toISOString(),
      };
      thread.messages.push(newMsg);
      thread.last_message = newMsg.body;
      thread.last_sent_at = newMsg.sent_at;
    }
    return { ok: true };
  }

  // ── Create new DM thread ──
  if (method === "POST" && path === "/dm/inbox/") {
    const b = body as any;
    const threads = getMockThreads();
    const existingDm = threads.find(
      t => t.type === "dm" && t.participants.some(p => p.username === b?.username)
    );
    if (existingDm) return { thread: existingDm };
    const newThread: ThreadData = {
      id: threads.length + 100,
      type: b?.type || "dm",
      title: b?.title || b?.display_name || "New Chat",
      trip_id: b?.trip_id,
      trip_title: b?.trip_title,
      participants: [
        { username: getDevUsername(), display_name: getDevDisplayName() },
        { username: b?.username, display_name: b?.display_name || b?.username, avatar_url: b?.avatar_url },
      ],
      last_message: b?.initial_message || undefined,
      last_sent_at: new Date().toISOString(),
      unread_count: 0,
      messages: b?.initial_message ? [{
        id: ++_mockMsgIdCounter,
        thread_id: threads.length + 100,
        sender_username: getDevUsername(),
        sender_display_name: getDevDisplayName(),
        body: b.initial_message,
        sent_at: new Date().toISOString(),
      }] : [],
    };
    threads.push(newThread);
    return { thread: newThread };
  }

  // ── Trip group chat creation ──
  const tripChatMatch = path.match(/^\/trip-chat\/(\d+)\/$/);
  if (method === "POST" && tripChatMatch) {
    const tripId = parseInt(tripChatMatch[1]);
    const trip = MOCK_TRIPS.find(t => t.id === tripId);
    const threads = getMockThreads();
    const existing = threads.find(t => t.type === "group_chat" && t.trip_id === tripId);
    if (existing) return { thread: existing };
    const participants = getMockParticipants(tripId);
    const newThread: ThreadData = {
      id: threads.length + 200,
      type: "group_chat",
      title: `${trip?.title || "Trip"} – Group Chat`,
      trip_id: tripId,
      trip_title: trip?.title,
      participants: [
        { username: getDevUsername(), display_name: getDevDisplayName() },
        ...participants.map(p => ({ username: p.username, display_name: p.display_name, avatar_url: p.avatar_url })),
      ],
      last_message: undefined,
      last_sent_at: new Date().toISOString(),
      unread_count: 0,
      messages: [],
    };
    threads.push(newThread);
    return { thread: newThread };
  }

  return {};
}
