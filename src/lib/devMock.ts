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
const _blockedUsers = new Set<string>();
const _deactivatedUsers = new Set<string>(["ananya_desai"]);
const _suspendedUsers = new Set<string>(["ravi_kumar"]);
const _submittedReports = new Set<string>();
const _tripParticipation = new Map<number, "pending" | "approved">();

// ── Profile media state (dev-only, in-memory) ──
// Real backend persists this row-per-item; here we simulate with numeric IDs
// and blob URLs so the browser never round-trips base64 for media.
let _mediaIdSeq = 10_000;
function nextMediaId() { return ++_mediaIdSeq; }



// Pending signup verification (dev-only in-memory).
interface PendingSignup { name: string; email: string; password: string; code: string; expiresAt: number; attempts: number; }
let _pendingSignup: PendingSignup | null = null;
let _lastResendAt = 0;

function generateCode() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function mockError(status: number, body: Record<string, unknown>) { return { __mock_error: true, error: { status, ...body } }; }

// ── Revision tracking for edit-conflict guards ──
// Every editable resource carries a monotonic revision. Clients must send
// `expected_revision` matching the last-known value; a mismatch returns 409
// edit_conflict along with the latest server payload so callers can preserve
// unsaved changes and re-fetch. Every successful write bumps the counter and
// echoes the new revision so the client's next request stays in sync.
const _draftRevisions = new Map<number, number>();
const _blogRevisions = new Map<string, number>();
let _profileRevision = 1;
let _settingsRevision = 1;
function draftRev(id: number) { return _draftRevisions.get(id) ?? 1; }
function bumpDraftRev(id: number) { const n = draftRev(id) + 1; _draftRevisions.set(id, n); return n; }
function blogRev(slug: string) { return _blogRevisions.get(slug) ?? 1; }
function bumpBlogRev(slug: string) { const n = blogRev(slug) + 1; _blogRevisions.set(slug, n); return n; }
function conflictResponse(latest: unknown, revision: number) {
  return mockError(409, {
    error: "This item was updated elsewhere. Reload to see the latest version.",
    code: "edit_conflict",
    revision,
    latest,
  });
}
function checkRevision(body: unknown, current: number): boolean {
  if (!body || typeof body !== "object") return true;
  const exp = (body as any).expected_revision;
  if (exp === undefined || exp === null) return true;
  return Number(exp) === current;
}

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

// Per-trip review store (session-scoped)
const _tripReviews = new Map<number, any[]>();
function _seedReviews(tripId: number) {
  if (_tripReviews.has(tripId)) return _tripReviews.get(tripId)!;
  const seed = [
    { id: tripId * 1000 + 1, rating: 5, headline: "Unforgettable trip", body: "The host was super organized and the group had amazing energy. Would absolutely do it again.", author_username: "priya_sharma", author_display_name: "Priya Sharma", author_avatar_url: "https://i.pravatar.cc/150?img=5", created_at: "2026-03-12T10:00:00Z", is_mine: false },
    { id: tripId * 1000 + 2, rating: 4, headline: "Great vibes", body: "Loved the itinerary and the people. A few small hiccups with timing but overall fantastic.", author_username: "karan_singh", author_display_name: "Karan Singh", author_avatar_url: "https://i.pravatar.cc/150?img=15", created_at: "2026-02-28T08:30:00Z", is_mine: false },
    { id: tripId * 1000 + 3, rating: 5, headline: "", body: "Worth every rupee. Made friends I still talk to.", author_username: "meera_nair", author_display_name: "Meera Nair", author_avatar_url: "https://i.pravatar.cc/150?img=20", created_at: "2026-02-15T14:15:00Z", is_mine: false },
  ];
  _tripReviews.set(tripId, seed);
  return seed;
}

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

// Persistent settings for dev mode (survives full page refresh via localStorage)
const _DEV_SETTINGS_KEY = "tapne_dev_settings_v2";
const _DEV_SETTINGS_DEFAULTS: Record<string, unknown> = {
  email_updates: "all",
  profile_visibility: "public",
  dm_privacy: "followers",
  theme: "system",
  digest_emails: true,
};
function _loadDevSettings(): Record<string, unknown> {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(_DEV_SETTINGS_KEY) : null;
    if (raw) return { ..._DEV_SETTINGS_DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ..._DEV_SETTINGS_DEFAULTS };
}
function _saveDevSettings(next: Record<string, unknown>) {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(_DEV_SETTINGS_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
}
let _devSettings: Record<string, unknown> = _loadDevSettings();

export function resolveMockRequest(method: string, url: string, body?: unknown): unknown {
  const path = url.replace("/__devmock__", "").replace(/\?.*$/, "");

  // ── Profile media (multipart) ──
  // Simulated failure: any filename containing "fail" rejects the request so
  // the UI's error/retry state can be exercised in the preview.
  const mediaFile = (b: unknown): File | null => {
    if (typeof FormData !== "undefined" && b instanceof FormData) {
      const f = b.get("file");
      return f instanceof File ? f : null;
    }
    return null;
  };
  const mediaRejection = (f: File | null) => {
    if (!f) return mockError(400, { error: "No file provided" });
    if (f.name.toLowerCase().includes("fail")) return mockError(500, { error: "Simulated upload failure" });
    return null;
  };

  if (method === "POST" && path === "/accounts/me/avatar/") {
    const file = mediaFile(body);
    const rej = mediaRejection(file);
    if (rej) return rej;
    const item = { id: nextMediaId(), url: URL.createObjectURL(file!) };
    if (_devUser) _devUser = { ..._devUser, avatar_id: item.id, avatar_url: item.url } as any;
    return { avatar: item };
  }
  if (method === "DELETE" && /^\/accounts\/me\/avatar\/\d+\/$/.test(path)) {
    const id = parseInt(path.split("/").filter(Boolean).slice(-1)[0]);
    if (_devUser && (_devUser as any).avatar_id === id) {
      _devUser = { ..._devUser, avatar_id: undefined, avatar_url: "" } as any;
    }
    return { ok: true };
  }
  if (method === "POST" && path === "/accounts/me/cover/") {
    const file = mediaFile(body);
    const rej = mediaRejection(file);
    if (rej) return rej;
    const item = { id: nextMediaId(), url: URL.createObjectURL(file!) };
    if (_devUser) _devUser = { ..._devUser, cover_id: item.id, cover_photo_url: item.url } as any;
    return { cover: item };
  }
  if (method === "DELETE" && /^\/accounts\/me\/cover\/\d+\/$/.test(path)) {
    const id = parseInt(path.split("/").filter(Boolean).slice(-1)[0]);
    if (_devUser && (_devUser as any).cover_id === id) {
      _devUser = { ..._devUser, cover_id: undefined, cover_photo_url: "" } as any;
    }
    return { ok: true };
  }
  if (method === "POST" && path === "/accounts/me/gallery/") {
    const file = mediaFile(body);
    const rej = mediaRejection(file);
    if (rej) return rej;
    const cur: Array<{ id: number; url: string }> = ((_devUser as any)?.gallery_media) ?? [];
    if (cur.length >= 12) return mockError(400, { error: "Gallery limit reached." });
    const item = { id: nextMediaId(), url: URL.createObjectURL(file!) };
    const next = [...cur, item];
    if (_devUser) _devUser = { ..._devUser, gallery_media: next } as any;
    return { item, gallery: next };
  }
  if (method === "DELETE" && /^\/accounts\/me\/gallery\/\d+\/$/.test(path)) {
    const id = parseInt(path.split("/").filter(Boolean).slice(-1)[0]);
    const cur: Array<{ id: number; url: string }> = ((_devUser as any)?.gallery_media) ?? [];
    const next = cur.filter((x) => x.id !== id);
    if (_devUser) _devUser = { ..._devUser, gallery_media: next } as any;
    return { ok: true, gallery: next };
  }
  if (method === "POST" && path === "/accounts/me/gallery/reorder/") {
    const ids = ((body as any)?.ids) as number[] | undefined;
    if (!Array.isArray(ids)) return mockError(400, { error: "ids required" });
    const cur: Array<{ id: number; url: string }> = ((_devUser as any)?.gallery_media) ?? [];
    const byId = new Map(cur.map((x) => [x.id, x]));
    const next = ids.map((id) => byId.get(id)).filter(Boolean) as Array<{ id: number; url: string }>;
    if (next.length !== cur.length) return mockError(400, { error: "ids do not match current gallery" });
    if (_devUser) _devUser = { ..._devUser, gallery_media: next } as any;
    return { ok: true, gallery: next };
  }

  // ── Settings ──
  if (path === "/settings/") {
    if (method === "GET") {
      _devSettings = _loadDevSettings();
      return { ..._devSettings, revision: _settingsRevision };
    }
    if (method === "PATCH" || method === "POST") {
      if (body && typeof body === "object" && !(typeof FormData !== "undefined" && body instanceof FormData)) {
        if (!checkRevision(body, _settingsRevision)) {
          return conflictResponse({ ..._devSettings, revision: _settingsRevision }, _settingsRevision);
        }
        const { expected_revision: _er, ...rest } = body as Record<string, unknown>;
        _devSettings = { ..._devSettings, ...rest };
        _saveDevSettings(_devSettings);
        _settingsRevision += 1;
      }
      return { ok: true, ..._devSettings, revision: _settingsRevision };
    }
  }

  // ── Password reset / change ──
  // Always return the same generic acknowledgement regardless of whether the
  // email exists, so the modal can't be used for account discovery.
  if (method === "POST" && path === "/auth/password-reset/request/") {
    return { ok: true };
  }
  if (method === "POST" && path === "/auth/password-reset/confirm/") {
    const b = (body || {}) as any;
    const uid = String(b.uid || "");
    const pw = String(b.new_password || "");
    if (!uid || uid === "invalid" || !b.token) {
      return mockError(400, { error: "This reset link is invalid or has expired.", code: "invalid_link" });
    }
    if (pw.length < 8) {
      return mockError(400, { error: "Password must be at least 8 characters.", code: "weak_password" });
    }
    return { ok: true };
  }
  if (method === "POST" && path === "/auth/password-change/") {
    if (!_devUser) return mockError(401, { error: "Authentication required." });
    const b = (body || {}) as any;
    const cur = String(b.current_password || "");
    const nw = String(b.new_password || "");
    if (!cur) return mockError(400, { error: "Enter your current password.", code: "wrong_password" });
    // Sentinel: "wrongpass" simulates an incorrect current password.
    if (cur === "wrongpass") return mockError(400, { error: "Current password is incorrect.", code: "wrong_password" });
    // Sentinel: "throttle" simulates throttling.
    if (cur === "throttle") return mockError(429, { error: "Too many attempts. Try again later.", code: "throttled", retry_after: 60 });
    if (nw.length < 8) return mockError(400, { error: "New password must be at least 8 characters.", code: "weak_password" });
    return { ok: true };
  }




  // ── Reports ──
  // Report submissions are always acknowledged (a repeated report for the same
  // target still returns success so the reporter never doubts it landed).
  if (method === "POST" && path === "/reports/") {
    const b = body as any;
    const key = `${b?.target_type || "?"}:${b?.target_id || "?"}`;
    _submittedReports.add(key);
    return { ok: true, submitted: true };
  }




  // ── User search ──
  // /users/search/       — signed-in invite/member chooser (auth required)
  // /users/public-search/ — public global-search People results (guests OK)
  // Matches partial username or display name only. Email is never searched.
  // Deactivated accounts are excluded from both. The public endpoint would
  // additionally hide private profiles for guests on a real backend.
  if (method === "GET" && (path.startsWith("/users/search/") || path.startsWith("/users/public-search/"))) {
    const isPublic = path.startsWith("/users/public-search/");
    if (!isPublic && !_devUser) return mockError(401, { error: "Authentication required." });
    const q = (new URL("http://x" + url.replace("/__devmock__", "")).searchParams.get("q") || "").trim().toLowerCase();
    const matches = MOCK_SESSION_USERS.filter((u) => {
      if (_deactivatedUsers.has(u.username)) return false;
      if (!q) return true;
      return (
        (u.username || "").toLowerCase().includes(q) ||
        (u.display_name || "").toLowerCase().includes(q)
      );
    }).map((u) => ({
      username: u.username,
      display_name: u.display_name,
      location: u.location,
      is_host: (u.created_trips ?? 0) > 0,
      hosted_trips_count: u.created_trips ?? 0,
      followers_count: 0,
    }));
    return { ok: true, users: matches };
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
    const tripId = parseInt(reviewMatch[1]);
    const list = _seedReviews(tripId);
    const username = _devUser?.username || "dev_user";
    const existingIdx = list.findIndex(r => r.author_username === username);
    const entry = {
      id: existingIdx >= 0 ? list[existingIdx].id : Date.now(),
      rating: b?.rating || 5,
      headline: b?.headline || "",
      body: b?.body || "",
      author_username: username,
      author_display_name: _devUser?.display_name || "Dev User",
      author_avatar_url: undefined,
      created_at: existingIdx >= 0 ? list[existingIdx].created_at : new Date().toISOString(),
      is_mine: true,
    };
    if (existingIdx >= 0) list[existingIdx] = entry;
    else list.unshift(entry);
    return { ok: true, outcome: existingIdx >= 0 ? "updated" : "created", review: entry };
  }


  if (method === "GET" && path === "/session/") {
    const resp: SessionResponse = { authenticated: !!_devUser, user: _devUser, csrf_token: "dev-csrf-token" };
    return resp;
  }

  // ── Auth ──
  if (method === "POST" && path === "/auth/login/") {
    const b = body as any;
    const identifier = (b?.username || "").toString().toLowerCase();
    // Suspended accounts stay signed out — the client renders the required copy.
    if (identifier && _suspendedUsers.has(identifier)) {
      return mockError(403, {
        error: "This account has been suspended. Contact support@tapnetravel.com if you believe this was a mistake.",
        reason: "suspended",
      });
    }
    // Detect reactivation: if the account was previously deactivated, clear that
    // flag and signal the client so it can show the one-shot welcome-back toast.
    let reactivated = false;
    if (identifier && _deactivatedUsers.has(identifier)) {
      _deactivatedUsers.delete(identifier);
      reactivated = true;
    }
    _devUser = MOCK_SESSION_USERS.find(u => u.username === identifier) || MOCK_SESSION_USERS[0];
    return { user: _devUser, reactivated };
  }


  if (method === "POST" && path === "/auth/signup/") {
    const b = body as any;
    const name = b?.first_name || "Dev User";
    const email = b?.email || "dev@tapne.com";
    const code = generateCode();
    _pendingSignup = { name, email, password: b?.password || "", code, expiresAt: Date.now() + 10 * 60_000, attempts: 0 };
    _lastResendAt = Date.now();
    // eslint-disable-next-line no-console
    console.info(`[Tapne dev] verification code for ${email}: ${code}`);
    return { pending_verification: true, email, resend_available_in: 60, dev_code: code };
  }

  if (method === "POST" && path === "/auth/verify/") {
    const b = body as any;
    if (!_pendingSignup) return mockError(400, { error: "No verification in progress." });
    // Refresh pending details from the currently displayed form values so the
    // final account is created with what the user is looking at right now.
    if (b?.first_name) _pendingSignup.name = b.first_name;
    if (b?.email) _pendingSignup.email = b.email;
    if (b?.password) _pendingSignup.password = b.password;
    if (Date.now() > _pendingSignup.expiresAt) {
      _pendingSignup = null;
      return mockError(410, { error: "Code expired. Please request a new one.", reason: "expired" });
    }
    _pendingSignup.attempts += 1;
    if (_pendingSignup.attempts > 5) {
      _pendingSignup = null;
      return mockError(429, { error: "Too many attempts. Please request a new code.", reason: "too_many_attempts" });
    }
    if ((b?.code || "").toString() !== _pendingSignup.code) {
      return mockError(400, { error: "Invalid code. Please try again.", reason: "invalid" });
    }
    const username = _pendingSignup.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || "dev_user";
    _devUser = {
      id: 9999, username, email: _pendingSignup.email,
      display_name: _pendingSignup.name, bio: "", location: "", website: "",
      profile_url: `/u/${username}`, created_trips: 0, joined_trips: 0,
    };
    _pendingSignup = null;
    return { user: _devUser };
  }

  if (method === "POST" && path === "/auth/resend/") {
    const b = body as any;
    if (!_pendingSignup) return mockError(400, { error: "No verification in progress." });
    // Update target details before issuing a new code so resend follows the
    // currently displayed email, not the original.
    if (b?.first_name) _pendingSignup.name = b.first_name;
    if (b?.email) _pendingSignup.email = b.email;
    if (b?.password) _pendingSignup.password = b.password;
    const wait = Math.max(0, 60 - Math.floor((Date.now() - _lastResendAt) / 1000));
    if (wait > 0) return mockError(429, { error: `Please wait ${wait}s before resending.`, retry_after: wait });
    _pendingSignup.code = generateCode();
    _pendingSignup.expiresAt = Date.now() + 10 * 60_000;
    _pendingSignup.attempts = 0;
    _lastResendAt = Date.now();
    // eslint-disable-next-line no-console
    console.info(`[Tapne dev] new verification code for ${_pendingSignup.email}: ${_pendingSignup.code}`);
    return { ok: true, resend_available_in: 60, dev_code: _pendingSignup.code };
  }

  if (method === "POST" && path === "/auth/logout/") {
    _devUser = null;
    return {};
  }

  // ── Blocks ──
  if (method === "GET" && path === "/blocks/") {
    return {
      users: Array.from(_blockedUsers).map(username => {
        const su = MOCK_SESSION_USERS.find(u => u.username === username);
        return {
          username,
          display_name: su?.display_name || username,
          avatar_url: (su as any)?.avatar_url || `https://i.pravatar.cc/150?u=${username}`,
        };
      }),
    };
  }
  const blockMatch = path.match(/^\/blocks\/([^/]+)\/$/);
  if (method === "POST" && blockMatch) {
    _blockedUsers.add(blockMatch[1]);
    _followedUsers.delete(blockMatch[1]);
    return { ok: true };
  }
  if (method === "DELETE" && blockMatch) {
    _blockedUsers.delete(blockMatch[1]);
    return { ok: true };
  }

  // ── Deactivate ──
  if (method === "POST" && path === "/account/deactivate/") {
    const b = body as any;
    // Every blocker carries its own management destination so Settings and
    // Profile dialogs both open the affected trip directly rather than a
    // generic dashboard list.
    const username = _devUser?.username;
    const blockers: any[] = [];
    if (username) {
      for (const t of MOCK_TRIPS) {
        if (t.host_username === username) {
          const pending = getMockApplications(t.id).filter(a => a.status === "pending").length;
          const approved = getMockParticipants(t.id).length;
          if (pending > 0 || approved > 0) {
            blockers.push({
              trip_id: t.id, title: t.title, role: "host",
              pending_count: pending, approved_count: approved,
              manage_url: `/trips/${t.id}/edit`,
            });
          }
        }
      }
      for (const [tripId, status] of _tripParticipation.entries()) {
        const t = MOCK_TRIPS.find(x => x.id === tripId);
        if (t) blockers.push({
          trip_id: tripId, title: t.title, role: "traveler",
          status,
          manage_url: `/trips/${tripId}`,
        });
      }
    }
    if (blockers.length > 0 && !b?.acknowledge_blockers) {
      return mockError(409, { error: "You have active trip commitments.", blockers });
    }
    _devUser = null;
    return { ok: true };
  }

  // ── Trip withdraw ──
  const withdrawMatch = path.match(/^\/trips\/(\d+)\/withdraw\/$/);
  if (method === "POST" && withdrawMatch) {
    const id = parseInt(withdrawMatch[1]);
    const prev = _tripParticipation.get(id);
    _tripParticipation.delete(id);
    const trip = MOCK_TRIPS.find(t => t.id === id);
    if (trip && prev === "approved") trip.spots_left = (trip.spots_left ?? 0) + 1;
    if (trip) trip.join_request_status = null;
    return { ok: true, join_request_status: null, spots_left: trip?.spots_left };
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
    const trip = MOCK_TRIPS.find(t => t.id === id) ?? _devDrafts.get(id) ?? MOCK_TRIPS[0];
    const isHost = _devUser && trip.host_username === _devUser.username;
    const username = _devUser?.username;
    const reviews = _seedReviews(trip.id).map(r => ({ ...r, is_mine: !!username && r.author_username === username }));
    const viewerReview = username ? reviews.find(r => r.is_mine) || null : null;
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : (trip.average_rating || 0);
    // Blocking state: hide social entry points on shared trips whenever the
    // viewer and the host (or a co-traveler) have blocked each other.
    const hostBlocked = !!(trip.host_username && _blockedUsers.has(trip.host_username));
    const hostSuspended = !!(trip.host_username && _suspendedUsers.has(trip.host_username));
    const participants = getMockParticipants(trip.id);
    const viewerParticipant = username ? participants.find((p: any) => p.username === username) : null;
    const viewerApproved = !!viewerParticipant && ["approved", "confirmed", "joined"].includes(String((viewerParticipant as any).status || ""));
    // Trips whose host is suspended are hidden from anyone without an active
    // commitment. Approved travelers still get the restricted view so they can
    // withdraw; everyone else gets the standard not-found response.
    if (hostSuspended && !isHost && !viewerApproved) {
      return mockError(404, { error: "This trip is not available." });
    }
    const blockedCoTravelers = participants
      .map((p: any) => p.username)
      .filter((u: string) => u && u !== username && _blockedUsers.has(u));
    const resp: TripDetailResponse = {
      trip: {
        ...trip,
        booking_status: _tripBookingStatus.get(trip.id) || (trip.spots_left === 0 ? "full" : "open"),
        reviews,
        viewer_review: viewerReview,
        can_review: !!_devUser && !isHost && !hostBlocked && !hostSuspended,
        reviews_count: reviews.length,
        average_rating: avg,
        viewer_blocked_with_host: hostBlocked,
        host_suspended: hostSuspended,
        viewer_is_approved: viewerApproved,
        blocked_co_traveler_usernames: blockedCoTravelers,
      } as any,
      can_manage_trip: !!isHost,
      mode: isHost ? "manage" : "view",
      similar_trips: MOCK_TRIPS.filter(t => t.id !== trip.id).slice(0, 3),
    };
    return resp;
  }

  // ── Broadcast (host-only) ──
  const broadcastMatch = path.match(/^\/trips\/(\d+)\/broadcast\/$/);
  if (method === "POST" && broadcastMatch) {
    const tripId = parseInt(broadcastMatch[1]);
    const parts = getMockParticipants(tripId);
    const excluded = new Set<string>(((body as any)?.exclude_usernames || []).map(String));
    let skippedSuspended = 0, skippedBlocked = 0, skippedDeactivated = 0, sent = 0;
    for (const p of parts) {
      const u = (p as any).username as string;
      if (!u) continue;
      if (_suspendedUsers.has(u)) skippedSuspended++;
      else if (_deactivatedUsers.has(u)) skippedDeactivated++;
      else if (_blockedUsers.has(u) || excluded.has(u)) skippedBlocked++;
      else sent++;
    }
    const skipped_total = skippedSuspended + skippedBlocked + skippedDeactivated;
    return { ok: true, sent, skipped_suspended: skippedSuspended, skipped_blocked: skippedBlocked, skipped_deactivated: skippedDeactivated, skipped_total };
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
    return { blog: blog ? { ...blog, revision: blogRev(slug) } : null };
  }

  // Blog create
  if (method === "POST" && path === "/blogs/") {
    const b = (body as any) || {};
    const slug = b.slug || "new-experience";
    _blogRevisions.set(slug, 1);
    const { expected_revision: _er, ...rest } = b;
    return { blog: { slug, ...rest, revision: 1 } };
  }

  // Blog update (PATCH) — enforce expected_revision to detect concurrent edits.
  const blogPatchMatch = path.match(/^\/blogs\/([^/]+)\/$/);
  if (method === "PATCH" && blogPatchMatch) {
    const slug = blogPatchMatch[1];
    const b = (body as any) || {};
    const current = blogRev(slug);
    if (!checkRevision(b, current)) {
      return conflictResponse({ slug, revision: current }, current);
    }
    const { expected_revision: _er, ...rest } = b;
    const nextRev = bumpBlogRev(slug);
    return { blog: { slug, ...rest, revision: nextRev } };
  }

  // Blog delete
  const blogDeleteMatch = path.match(/^\/blogs\/([^/]+)\/$/);
  if (method === "DELETE" && blogDeleteMatch) {
    _blogRevisions.delete(blogDeleteMatch[1]);
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
    const rawParticipants = getMockParticipants(id).map(p => ({
      ...p,
      is_blocked_by_me: _blockedUsers.has(p.username),
    }));
    const rawApplications = getMockApplications(id).map(a => ({
      ...a,
      is_blocked_by_me: _blockedUsers.has(a.requester_username),
    }));
    const resp: ManageTripResponse = {
      trip: {
        ...trip,
        can_manage: true,
        booking_status: _tripBookingStatus.get(trip.id) || (trip.spots_left === 0 ? "full" : "open"),
        participants_count: rawParticipants.length,
        applications_count: rawApplications.filter(a => a.status === "pending").length,
      },
      participants: rawParticipants,
      applications: rawApplications,
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
    _draftRevisions.set(newId, 1);
    return { draft: { ...newDraft, revision: 1 } };
  }

  const draftPatchMatch = path.match(/^\/trip-drafts\/(\d+)\/$/);
  if (method === "PATCH" && draftPatchMatch) {
    const id = parseInt(draftPatchMatch[1]);
    const existing = _devDrafts.get(id) ?? { id, is_draft: true, is_published: false, can_manage: true } as TripData;
    const b = (body as any) || {};
    const current = draftRev(id);
    if (!checkRevision(b, current)) {
      return conflictResponse({ ...existing, revision: current }, current);
    }
    const { expected_revision: _er, ...rest } = b;
    const updated = { ...existing, ...(rest as Record<string, any>) };
    _devDrafts.set(id, updated);
    const nextRev = bumpDraftRev(id);
    return { draft: { ...updated, revision: nextRev } };
  }

  const draftDeleteMatch = path.match(/^\/trip-drafts\/(\d+)\/$/);
  if (method === "DELETE" && draftDeleteMatch) {
    const id = parseInt(draftDeleteMatch[1]);
    _devDrafts.delete(id);
    _draftRevisions.delete(id);
    return {};
  }

  const draftPublishMatch = path.match(/^\/trip-drafts\/(\d+)\/publish\/$/);
  if (method === "POST" && draftPublishMatch) {
    const id = parseInt(draftPublishMatch[1]);
    const existing = _devDrafts.get(id);
    const b = (body as any) || {};
    const current = draftRev(id);
    if (!checkRevision(b, current)) {
      return conflictResponse({ ...(existing || {}), revision: current }, current);
    }
    if (existing) _devDrafts.set(id, { ...existing, is_draft: false, is_published: true });
    bumpDraftRev(id);
    return { trip_id: id, id };
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

    // If the viewer and target have blocked each other, or the target is
    // deactivated/suspended, respond with a minimal profile envelope only.
    // Never leak bio, trips, stories, reviews, or gallery, and never disclose
    // *why* a suspended account is unavailable — treat it as generically hidden.
    const targetBlockedByMe = _blockedUsers.has(su.username);
    const targetDeactivated = _deactivatedUsers.has(su.username);
    const targetSuspended = _suspendedUsers.has(su.username);
    if (targetBlockedByMe || targetDeactivated || targetSuspended) {
      return {
        profile: {
          username: su.username,
          display_name: su.display_name,
          unavailable: true,
          is_blocked_by_me: targetBlockedByMe,
          is_deactivated: targetDeactivated,
          is_suspended: targetSuspended,
        },
        trips_hosted: [], trips_joined: [], reviews: [], gallery: [], stories: [],
      };
    }


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

    const isOwnProfile = _devUser && su.username === _devUser.username;
    const overlay: any = isOwnProfile ? (_devUser as any) : {};

    // Stories authored by this user
    const allMockStories: any[] = [
      { slug: "solo-girl-india", title: "Solo Traveling as a Girl in India", excerpt: "My honest experience backpacking across Rajasthan and Kerala as a solo female traveler.", short_description: "My honest experience backpacking across Rajasthan and Kerala as a solo female traveler.", cover_image_url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=80", author_username: "priya_sharma", author_display_name: "Priya Sharma", created_at: "2026-03-01" },
      { slug: "found-travel-group", title: "How I Found My Travel Group", excerpt: "From solo trips to finding my tribe — here's how Tapne changed the way I travel.", short_description: "From solo trips to finding my tribe — here's how Tapne changed the way I travel.", cover_image_url: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=600&q=80", author_username: "arjun_mehta", author_display_name: "Arjun Mehta", created_at: "2026-02-20" },
      { slug: "budget-himachal", title: "Budget Himachal in ₹8,000", excerpt: "A complete breakdown of how I did a 7-day Himachal trip on a shoestring budget.", short_description: "A complete breakdown of how I did a 7-day Himachal trip on a shoestring budget.", cover_image_url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80", author_username: "karan_singh", author_display_name: "Karan Singh", created_at: "2026-02-10" },
    ];
    const userStories = allMockStories.filter(s => s.author_username === su.username);

    const isHost = hostedTrips.length > 0;
    const reviewsReceived = isHost ? [
      { id: 1, rating: 5, headline: "Best host ever", body: "Amazing host! Made the entire trip so seamless and fun. Would definitely join again.", trip_title: "Goa Backpacking Adventure", trip_url: `/trips/${hostedTrips[0]?.id ?? 1}`, author_username: "priya_sharma", author_display_name: "Priya Sharma", author_avatar_url: "https://i.pravatar.cc/150?img=5", created_at: "2026-02-10T10:00:00Z" },
      { id: 2, rating: 4, headline: "Great experience", body: "Great itinerary planning and super friendly. Loved every moment of the trek.", trip_title: "Himachal Pradesh Trek", trip_url: `/trips/${hostedTrips[0]?.id ?? 1}`, author_username: "karan_singh", author_display_name: "Karan Singh", author_avatar_url: "https://i.pravatar.cc/150?img=15", created_at: "2026-01-20T08:00:00Z" },
      { id: 3, rating: 5, headline: "Unforgettable", body: "Top notch organization and warm vibes throughout.", trip_title: "Coorg Coffee Trail", trip_url: `/trips/${hostedTrips[0]?.id ?? 1}`, author_username: "neha_g", author_display_name: "Neha G.", author_avatar_url: "https://i.pravatar.cc/150?img=21", created_at: "2025-12-12T08:00:00Z" },
    ] : [];
    const reviewsWritten = !isHost ? [
      { id: 11, rating: 5, headline: "Loved this trip", body: "Such a thoughtful host and great people.", trip_title: "Goa Backpacking Adventure", trip_url: "/trips/1", author_username: su.username, author_display_name: su.display_name, author_avatar_url: overlay.avatar_url ?? mu?.avatar, created_at: "2026-01-15T08:00:00Z" },
    ] : [];
    const reviewDistribution = isHost ? { "5": 70, "4": 20, "3": 5, "2": 3, "1": 2 } : { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };

    // Media rendering: prefer per-item entries with stable IDs. Fall back to
    // legacy string arrays only when the media state hasn't been touched yet.
    const overlayGalleryMedia: Array<{ id: number; url: string }> | undefined = overlay.gallery_media;
    const seededGalleryMedia: Array<{ id: number; url: string }> = isHost
      ? mockGallery.map((url, i) => ({ id: 5000 + i, url }))
      : [];
    const effectiveGalleryMedia = overlayGalleryMedia ?? seededGalleryMedia;
    const effectiveGalleryUrls = effectiveGalleryMedia.map((m) => m.url);
    const effectiveAvatarUrl = overlay.avatar_url ?? mu?.avatar;
    const effectiveAvatarId: number | undefined = overlay.avatar_id;
    const effectiveCoverUrl = overlay.cover_photo_url ?? (isHost
      ? "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80"
      : undefined);
    const effectiveCoverId: number | undefined = overlay.cover_id;

    const isComplete = !!effectiveAvatarUrl && !!(su.bio || mu?.bio) && !!(su.location || mu?.location) && effectiveGalleryUrls.length > 0;
    const missingFields: string[] = [];
    if (!effectiveAvatarUrl) missingFields.push("avatar");
    if (!(su.bio || mu?.bio)) missingFields.push("bio");
    if (!(su.location || mu?.location)) missingFields.push("location");
    if (isHost && !effectiveCoverUrl) missingFields.push("cover_photo");
    if (isHost && !effectiveGalleryUrls.length) missingFields.push("gallery_photos");

    return {
      profile: {
        username: su.username,
        email: su.email,
        display_name: su.display_name,
        bio: su.bio || mu?.bio || "",
        location: su.location || mu?.location || "",
        website: su.website,
        avatar_url: effectiveAvatarUrl,
        avatar_id: effectiveAvatarId,
        travel_tags: overlay.travel_tags ?? ["Mountains", "Backpacking", "Culture", "Photography"],
        is_host: isHost,
        member_since: "2024-03-15",
        cover_photo_url: effectiveCoverUrl,
        cover_id: effectiveCoverId,
        gallery_photos: effectiveGalleryUrls,
        gallery_media: effectiveGalleryMedia,
        average_rating: isHost ? 4.6 : undefined,
        reviews_count: isHost ? reviewsReceived.length : 0,
        trips_hosted: hostedTrips.length,
        travelers_hosted: hostedTrips.length * 6,
        repeat_travelers_count: isHost ? 4 : 0,
        median_response_hours: isHost ? 3 : null,
        review_distribution: reviewDistribution,
        reviews_received: reviewsReceived,
        reviews_written: reviewsWritten,
        profile_completeness: {
          is_complete: missingFields.length === 0,
          missing_fields: missingFields,
        },
        trips_joined: joinedTrips.length + 3,
        followers_count: baseFollowers + (isFollowed ? 1 : 0),
        is_following: isFollowed,
        is_blocked_by_me: _blockedUsers.has(su.username),
        is_deactivated: _deactivatedUsers.has(su.username),
      },
      trips_hosted: hostedTrips,
      trips_joined: joinedTrips,
      reviews: isHost ? reviewsReceived.map((r: any) => ({ id: r.id, reviewer_name: r.author_display_name, reviewer_avatar: r.author_avatar_url, rating: r.rating, text: r.body, trip_title: r.trip_title, created_at: r.created_at })) : [],
      gallery: effectiveGalleryUrls,
      stories: userStories,
    };
  }

  // ── Profile (own - me) ──
  if (method === "GET" && path === "/accounts/me/") {
    return { profile: _devUser ? { username: _devUser.username, display_name: _devUser.display_name, bio: _devUser.bio, location: _devUser.location, website: _devUser.website, created_trips: 0, joined_trips: 0, revision: _profileRevision } : null };
  }

  if (method === "PATCH" && path === "/accounts/me/") {
    const b = body as any;
    if (!checkRevision(b, _profileRevision)) {
      const u: any = _devUser || {};
      return conflictResponse({
        username: u.username, display_name: u.display_name, bio: u.bio, location: u.location,
        website: u.website, instagram_url: u.instagram_url, travel_tags: u.travel_tags,
        revision: _profileRevision,
      }, _profileRevision);
    }
    // Text-only PATCH. Media fields are ignored here — clients must use the
    // dedicated multipart media endpoints. If a client accidentally includes
    // avatar/cover/gallery bytes they will be silently dropped.
    if (_devUser) {
      if (b?.display_name) _devUser = { ..._devUser, display_name: b.display_name };
      if (b?.bio !== undefined) _devUser = { ..._devUser, bio: b.bio };
      if (b?.location !== undefined) _devUser = { ..._devUser, location: b.location };
      if (b?.website !== undefined) _devUser = { ..._devUser, website: b.website };
      if (b?.instagram_url !== undefined) _devUser = { ..._devUser, instagram_url: b.instagram_url } as any;
      if (b?.travel_tags !== undefined) _devUser = { ..._devUser, travel_tags: b.travel_tags } as any;
    }
    _profileRevision += 1;
    const u: any = _devUser || {};
    return {
      profile: {
        username: u.username,
        display_name: u.display_name,
        bio: u.bio,
        location: u.location,
        website: u.website,
        instagram_url: u.instagram_url,
        travel_tags: u.travel_tags,
        avatar_url: u.avatar_url,
        avatar_id: u.avatar_id,
        cover_photo_url: u.cover_photo_url,
        cover_id: u.cover_id,
        gallery_photos: Array.isArray(u.gallery_media) ? u.gallery_media.map((x: any) => x.url) : undefined,
        gallery_media: u.gallery_media,
        revision: _profileRevision,
      },
    };
  }


  // ── Hosting inbox ──
  if (method === "GET" && path.startsWith("/hosting/inbox")) {
    return { requests: [], counts: { all: 0, pending: 0, approved: 0, denied: 0 } };
  }

  // ── Join request ──
  const joinMatch = path.match(/^\/trips\/(\d+)\/join-request\/$/);
  if (method === "POST" && joinMatch) {
    const id = parseInt(joinMatch[1]);
    _tripParticipation.set(id, "pending");
    const trip = MOCK_TRIPS.find(t => t.id === id);
    if (trip) trip.join_request_status = "pending";
    return { ok: true, status: "pending" };
  }

  // ── Application decision ──
  const decisionMatch = path.match(/^\/hosting-requests\/(\d+)\/decision\/$/);
  if (method === "POST" && decisionMatch) {
    return { ok: true };
  }

  // ── DM Inbox (lightweight summaries — no message bodies) ──
  if (method === "GET" && path === "/dm/inbox/") {
    const me = getDevUsername();
    const threads = getMockThreads().map(t => {
      const other = t.participants.find(p => p.username !== me);
      let readonly: boolean | undefined;
      let readonly_reason: any;
      if (t.type === "dm" && other) {
        if (_blockedUsers.has(other.username)) { readonly = true; readonly_reason = "blocked_by_you"; }
        else if (_suspendedUsers.has(other.username)) { readonly = true; readonly_reason = "suspended"; }
        else if (_deactivatedUsers.has(other.username)) { readonly = true; readonly_reason = "deactivated"; }
      }
      const { messages: _msgs, ...summary } = t;
      return { ...summary, readonly, readonly_reason };
    });
    return { threads };
  }

  // ── Fetch thread messages (paginated newest→oldest via `before`) ──
  const threadGetMatch = path.match(/^\/dm\/inbox\/(\d+)\/messages\/$/);
  if (method === "GET" && threadGetMatch) {
    const threadId = parseInt(threadGetMatch[1]);
    const thread = getMockThreads().find(t => t.id === threadId);
    if (!thread) return mockError(404, { error: "Thread not found." });
    const qIdx = url.indexOf("?");
    const q = new URLSearchParams(qIdx >= 0 ? url.slice(qIdx + 1) : "");
    const beforeStr = q.get("before");
    const limit = Math.max(1, Math.min(100, parseInt(q.get("limit") || "20")));
    const sorted = [...thread.messages].sort((a, b) => a.id - b.id);
    let slice = sorted;
    if (beforeStr) {
      const before = parseInt(beforeStr);
      slice = sorted.filter(m => m.id < before);
    }
    const page = slice.slice(-limit);
    const has_more = slice.length > page.length;
    return { messages: page, has_more };
  }

  // ── Mark thread as read up to a specific message id ──
  // Returns the authoritative remaining unread count. Messages arriving after
  // the caller's displayed page (id > up_to_id) remain unread.
  const readMatch = path.match(/^\/dm\/inbox\/(\d+)\/read\/$/);
  if (method === "POST" && readMatch) {
    const threadId = parseInt(readMatch[1]);
    const thread = getMockThreads().find(t => t.id === threadId);
    if (!thread) return mockError(404, { error: "Thread not found." });
    const me = getDevUsername();
    const b = (body as any) || {};
    const upToId = typeof b.up_to_id === "number" ? b.up_to_id : Number.MAX_SAFE_INTEGER;
    const prevLastRead = (thread as any).last_read_id ?? 0;
    const nextLastRead = Math.max(prevLastRead, upToId);
    (thread as any).last_read_id = nextLastRead;
    // Count received messages strictly newer than the acknowledged id.
    const remaining = thread.messages.filter(
      m => m.sender_username !== me && m.id > nextLastRead
    ).length;
    thread.unread_count = remaining;
    return { ok: true, unread_count: remaining };
  }

  // ── Send message to thread ──
  const threadMsgMatch = path.match(/^\/dm\/inbox\/(\d+)\/messages\/$/);
  if (method === "POST" && threadMsgMatch) {
    const threadId = parseInt(threadMsgMatch[1]);
    const threads = getMockThreads();
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return mockError(404, { error: "Thread not found." });
    // If the other party is unavailable, refuse the send so the client can
    // remove the optimistic message and swap in the correct read-only banner.
    const me = getDevUsername();
    const other = thread.type === "dm" ? thread.participants.find(p => p.username !== me) : null;
    if (other && _blockedUsers.has(other.username)) {
      return mockError(403, { error: "You've blocked this member.", readonly_reason: "blocked_by_you" });
    }
    if (other && _suspendedUsers.has(other.username)) {
      return mockError(403, { error: "This account is not available.", readonly_reason: "suspended" });
    }
    if (other && _deactivatedUsers.has(other.username)) {
      return mockError(403, { error: "This account has been deactivated.", readonly_reason: "deactivated" });
    }

    const b = body as any;
    const newMsg: MessageData = {
      id: ++_mockMsgIdCounter,
      thread_id: threadId,
      sender_username: me,
      sender_display_name: getDevDisplayName(),
      body: b?.body || "",
      sent_at: new Date().toISOString(),
    };
    thread.messages.push(newMsg);
    thread.last_message = newMsg.body;
    thread.last_sent_at = newMsg.sent_at;
    return { ok: true, message: newMsg };
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
