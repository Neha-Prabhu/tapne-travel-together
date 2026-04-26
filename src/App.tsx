import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DraftProvider } from "@/contexts/DraftContext";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import BrowseTrips from "./pages/BrowseTrips";
import TripDetail from "./pages/TripDetail";
import CreateTrip from "./pages/CreateTrip";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import Stories from "./pages/Stories";
import StoryDetail from "./pages/StoryDetail";
import StoryCreate from "./pages/StoryCreate";
import StoryEdit from "./pages/StoryEdit";
import NotFound from "./pages/NotFound";
import Bookmarks from "./pages/Bookmarks";
import Messages from "./pages/Messages";
import Search from "./pages/Search";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import DashboardTrips from "./pages/dashboard/DashboardTrips";
import DashboardStories from "./pages/dashboard/DashboardStories";
import DashboardReviews from "./pages/dashboard/DashboardReviews";
import DashboardSubscriptions from "./pages/dashboard/DashboardSubscriptions";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <DraftProvider>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />

              {/* Trips — /trips retired, browse goes to /search */}
              <Route path="/trips" element={<Navigate to="/search" replace />} />
              <Route path="/trips/new" element={<CreateTrip />} />
              <Route path="/trips/:tripId/edit" element={<CreateTrip />} />
              <Route path="/trips/:tripId" element={<TripDetail />} />
              <Route path="/create-trip" element={<Navigate to="/trips/new" replace />} />

              {/* Stories — /stories retired, browse goes to /search?tab=stories */}
              <Route path="/stories" element={<Navigate to="/search?tab=stories" replace />} />
              <Route path="/stories/new" element={<StoryCreate />} />
              <Route path="/stories/:storyId/edit" element={<StoryEdit />} />
              <Route path="/stories/:storyId" element={<StoryDetail />} />

              {/* Profile — /profile retired, redirects to canonical /users/:username */}
              <Route path="/profile" element={<ProfileSelfRedirect />} />
              <Route path="/profile/edit" element={<ProfileEdit />} />
              <Route path="/users/:profileId" element={<Profile />} />

              {/* Messaging & utility */}
              <Route path="/messages" element={<Messages />} />
              <Route path="/inbox" element={<Navigate to="/messages" replace />} />
              <Route path="/my-trips" element={<Navigate to="/dashboard/trips" replace />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/search" element={<Search />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />

              {/* Dashboard */}
              <Route path="/dashboard" element={<Dashboard />}>
                <Route index element={<Navigate to="/dashboard/trips" replace />} />
                <Route path="trips" element={<DashboardTrips />} />
                <Route path="stories" element={<DashboardStories />} />
                <Route path="reviews" element={<DashboardReviews />} />
                <Route path="subscriptions" element={<DashboardSubscriptions />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </DraftProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
