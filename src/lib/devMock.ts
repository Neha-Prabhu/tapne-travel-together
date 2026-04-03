import { trips as mockTrips, users as mockUsers } from "@/data/mockData";
import type {
  TripData, TripDetailResponse, TripListResponse, HomeResponse,
  SessionUser, SessionResponse, MyTripsResponse, BlogData,
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
  };
}

const MOCK_TRIPS: TripData[] = mockTrips.map(mockTripToTripData);
const MOCK_SESSION_USERS: SessionUser[] = mockUsers.map(mockUserToSessionUser);

let _devUser: SessionUser | null = null;
const _devDrafts = new Map<number, TripData>();
let _devDraftCounter = 5000;

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
    const resp: TripDetailResponse = {
      trip,
      can_manage_trip: false,
      mode: "view",
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
    const resp: MyTripsResponse = {
      trips: draftList,
      active_tab: "created",
      tab_counts: { created: draftList.filter(d => !d.is_draft).length, joined: 0, past: 0 },
    };
    return resp;
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

  return {};
}
