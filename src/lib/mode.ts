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
