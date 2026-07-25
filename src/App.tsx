import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DraftProvider } from "@/contexts/DraftContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { BookmarksProvider } from "@/contexts/BookmarksContext";
import { ConflictProvider } from "@/contexts/ConflictContext";
import ScrollToTop from "@/components/ScrollToTop";
import RequireAuth from "@/components/RequireAuth";
import GlobalLoginModal from "@/components/GlobalLoginModal";

import Index from "./pages/Index";

import TripDetail from "./pages/TripDetail";
import CreateTrip from "./pages/CreateTrip";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";

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
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import DashboardTrips from "./pages/dashboard/DashboardTrips";
import DashboardStories from "./pages/dashboard/DashboardStories";
import DashboardReviews from "./pages/dashboard/DashboardReviews";
import DashboardFollowers from "./pages/dashboard/DashboardFollowers";
import { Navigate } from "react-router-dom";
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
            <SearchProvider>
              <BookmarksProvider>
              <ConflictProvider>
              <ScrollToTop />
              <GlobalLoginModal />

              <Routes>
                <Route path="/" element={<Index />} />

                {/* Trips */}
                <Route path="/trips/new" element={<RequireAuth><CreateTrip /></RequireAuth>} />
                <Route path="/trips/:tripId/edit" element={<RequireAuth><CreateTrip /></RequireAuth>} />
                <Route path="/trips/:tripId" element={<TripDetail />} />

                {/* Stories */}
                <Route path="/stories/new" element={<RequireAuth><StoryCreate /></RequireAuth>} />
                <Route path="/stories/:storyId/edit" element={<RequireAuth><StoryEdit /></RequireAuth>} />
                <Route path="/stories/:storyId" element={<StoryDetail />} />

                {/* Profile */}
                <Route path="/profile/edit" element={<RequireAuth><ProfileEdit /></RequireAuth>} />
                <Route path="/users/:profileId" element={<Profile />} />

                {/* Messaging & utility */}
                <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
                <Route path="/bookmarks" element={<RequireAuth><Bookmarks /></RequireAuth>} />
                <Route path="/search" element={<Search />} />
                <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
                <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />

                {/* Dashboard — fully protected */}
                <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>}>
                  <Route index element={<DashboardOverview />} />
                  <Route path="trips" element={<DashboardTrips />} />
                  <Route path="stories" element={<DashboardStories />} />
                  <Route path="reviews" element={<DashboardReviews />} />
                  <Route path="followers" element={<DashboardFollowers />} />
                  <Route path="subscriptions" element={<Navigate to="/dashboard/followers" replace />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
              </ConflictProvider>
              </BookmarksProvider>
            </SearchProvider>

          </DraftProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
