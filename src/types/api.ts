// ─── Runtime Config ───────────────────────────────────────────────────────

export interface TapneRuntimeConfig {
  app_name: string;
  frontend_mode: string;
  api: {
    base: string;
    session: string;
    login: string;
    signup: string;
    logout: string;
    home: string;
    trips: string;
    blogs: string;
    my_trips: string;
    trip_drafts: string;
    profile_me: string;
    bookmarks: string;
    activity: string;
    settings: string;
    hosting_inbox: string;
    dm_inbox: string;
    manage_trip: string;
    messages: string;
    trip_chat: string;
    users_search: string;
    notifications: string;
    trip_reviews: string;
    dm_start: string;
  };
  csrf: {
    cookie_name: string;
    header_name: string;
    token: string;
  };
  session: {
    authenticated: boolean;
    user: SessionUser | null;
  };
}

declare global {
  interface Window {
    TAPNE_RUNTIME_CONFIG: TapneRuntimeConfig;
  }
}

// ─── Session ──────────────────────────────────────────────────────────────

export interface SessionUser {
  id: number;
  username: string;
  email: string;
  display_name: string;
  bio: string;
  location: string;
  website: string;
  profile_url: string;
  created_trips: number;
  joined_trips: number;
}

export interface SessionResponse {
  authenticated: boolean;
  user: SessionUser | null;
  csrf_token: string;
}

// ─── Trips ────────────────────────────────────────────────────────────────

export interface ItineraryDay {
  day_number: number;
  title: string;
  description: string;
  stay?: string;
  meals?: string;
  activities?: string;
  is_flexible?: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface TripData { 
  id: number;
  title: string;
  summary?: string;
  destination?: string;
  banner_image_url?: string;
  host_username?: string;
  host_display_name?: string;
  host_bio?: string;
  host_location?: string;
  host_website?: string;
  starts_at?: string;
  ends_at?: string;
  booking_closes_at?: string;
  duration_days?: number;
  trip_type?: string;
  budget_tier?: string;
  difficulty_level?: string;
  pace_level?: string;
  group_size_label?: string;
  total_seats?: number;
  minimum_seats?: number;
  spots_left?: number;
  price_per_person?: number;
  total_trip_price?: number;
  early_bird_price?: number;
  payment_terms?: string;
  highlights?: string[];
  itinerary_days?: ItineraryDay[];
  included_items?: string[];
  not_included_items?: string[];
  things_to_carry?: string[];
  suitable_for?: string[];
  trip_vibe?: string[];
  cancellation_policy?: string;
  faqs?: FaqItem[];
  is_draft?: boolean;
  is_published?: boolean;
  can_manage?: boolean;
  join_request_status?: "pending" | "approved" | "denied" | null;
  description?: string;
  booking_status?: "open" | "closed" | "full";
  status?: "active" | "cancelled";
  participants_count?: number;
  applications_count?: number;
  access_type?: "open" | "apply" | "invite";
  average_rating?: number;
  reviews_count?: number;
  payment_method?: "direct_contact" | "show_payment_details";
  payment_details?: string;
}

export interface ParticipantData {
  id: number;
  user_id: number;
  username: string;
  display_name: string;
  avatar_url?: string;
  status: "confirmed";
  joined_at: string;
}

export interface ManageTripResponse {
  trip: TripData;
  participants: ParticipantData[];
  applications: EnrollmentRequestData[];
}

export interface TripListResponse {
  trips: TripData[];
}

export interface TripDetailResponse {
  trip: TripData;
  can_manage_trip: boolean;
  mode: string;
  reason?: string;
  similar_trips?: TripData[];
}

export interface MyTripsResponse {
  trips: TripData[];
  active_tab: "created" | "joined" | "past";
  tab_counts: { drafts: number; published: number; past: number };
}

// ─── Enrollment ───────────────────────────────────────────────────────────

export interface EnrollmentRequestData {
  id: number;
  trip_id: number;
  trip_title: string;
  trip_destination?: string;
  requester_username: string;
  requester_display_name?: string;
  message?: string;
  status: "pending" | "approved" | "denied";
  created_at: string;
  reviewed_at?: string;
}

export interface HostingInboxResponse {
  requests: EnrollmentRequestData[];
  counts: { all: number; pending: number; approved: number; denied: number };
}

// ─── Blogs ────────────────────────────────────────────────────────────────

export interface BlogData {
  slug: string;
  title: string;
  excerpt?: string;
  short_description?: string;
  body?: string;
  author_username?: string;
  author_display_name?: string;
  reads?: number;
  reviews_count?: number;
  cover_image_url?: string;
  created_at?: string;
  tags?: string[];
  location?: string;
}

// ─── Profile ──────────────────────────────────────────────────────────────

export interface ProfileData {
  username: string;
  display_name: string;
  bio: string;
  location: string;
  website: string;
  created_trips: number;
  joined_trips: number;
  avatar_url?: string;
}

// ─── Home Feed ────────────────────────────────────────────────────────────

export interface CommunityProfile {
  username: string;
  display_name: string;
  avatar_url?: string;
  travel_tags?: string[];
  location?: string;
  bio?: string;
}

export interface TestimonialData {
  id: number;
  user_name: string;
  user_avatar?: string;
  rating: number;
  text: string;
}

export interface HomeResponse {
  trips: TripData[];
  blogs: BlogData[];
  profiles: ProfileData[];
  community_profiles?: CommunityProfile[];
  testimonials?: TestimonialData[];
  stats?: { travelers: number; trips_hosted: number; destinations: number };
}

// ─── DMs ─────────────────────────────────────────────────────────────────

export interface DMMessageData {
  id: number;
  sender_username: string;
  body: string;
  sent_at: string;
}

export interface DMThreadPreview {
  thread_id: number;
  other_username: string;
  last_message?: string;
  last_sent_at?: string;
  unread_count?: number;
}
