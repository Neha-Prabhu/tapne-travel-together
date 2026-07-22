import type { TapneRuntimeConfig } from "@/types/api";

export const IS_DEV_MODE: boolean =
  typeof window !== "undefined" &&
  typeof (window as any).TAPNE_RUNTIME_CONFIG === "undefined";

const DEV_RUNTIME_CONFIG: TapneRuntimeConfig = {
  app_name: "Tapne (Dev)",
  frontend_mode: "lovable-dev",
  api: {
    base: "/__devmock__",
    session: "/__devmock__/session/",
    login: "/__devmock__/auth/login/",
    signup: "/__devmock__/auth/signup/",
    signup_verify: "/__devmock__/auth/verify/",
    signup_resend: "/__devmock__/auth/resend/",
    logout: "/__devmock__/auth/logout/",
    home: "/__devmock__/home/",
    trips: "/__devmock__/trips/",
    blogs: "/__devmock__/blogs/",
    my_trips: "/__devmock__/my-trips/",
    trip_drafts: "/__devmock__/trip-drafts/",
    profile_me: "/__devmock__/accounts/me/",
    bookmarks: "/__devmock__/bookmarks/",
    activity: "/__devmock__/activity/",
    settings: "/__devmock__/settings/",
    hosting_inbox: "/__devmock__/hosting/inbox/",
    dm_inbox: "/__devmock__/dm/inbox/",
    manage_trip: "/__devmock__/manage-trip/",
    messages: "/__devmock__/messages/",
    trip_chat: "/__devmock__/trip-chat/",
    users_search: "/__devmock__/users/search/",
    users_search_public: "/__devmock__/users/public-search/",
    notifications: "/__devmock__/notifications/",
    trip_reviews: "/__devmock__/trips/",
    dm_start: "/__devmock__/dm/start/",
    account_deactivate: "/__devmock__/account/deactivate/",
    blocks: "/__devmock__/blocks/",
    trip_withdraw: "/__devmock__/trips/withdraw/",
    reports: "/__devmock__/reports/",
    media_avatar: "/__devmock__/accounts/me/avatar/",
    media_cover: "/__devmock__/accounts/me/cover/",
    media_gallery: "/__devmock__/accounts/me/gallery/",
    media_gallery_reorder: "/__devmock__/accounts/me/gallery/reorder/",
  },

  csrf: {
    cookie_name: "csrftoken",
    header_name: "X-CSRFToken",
    token: "dev-csrf-token",
  },
  session: {
    authenticated: false,
    user: null,
  },
};

if (IS_DEV_MODE) {
  (window as any).TAPNE_RUNTIME_CONFIG = DEV_RUNTIME_CONFIG;
}
