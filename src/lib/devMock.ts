import { trips as mockTrips, users as mockUsers } from "@/data/mockData";
import type {
  TripData, TripDetailResponse, TripListResponse, HomeResponse,
  SessionUser, SessionResponse, MyTripsResponse, BlogData,
  ParticipantData, ManageTripResponse, EnrollmentRequestData,
} from "@/types/api";

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

  // ── Session ──
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
    const resp: HomeResponse = { trips: MOCK_TRIPS.slice(0, 4), blogs: [], profiles: [] };
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

  // ── Blogs ──
  if (method === "GET" && path === "/blogs/") {
    return { blogs: [] as BlogData[] };
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
        created: hostedTrips.filter(t => !t.ends_at || new Date(t.ends_at) >= now).length + draftList.length,
        joined: 0,
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

  // ── Profile ──
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

  return {};
}
