import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DraftProvider } from "@/contexts/DraftContext";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/contexts/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import BrowseTrips from "./pages/BrowseTrips";
import TripDetail from "./pages/TripDetail";
import TripPreview from "./pages/TripPreview";
import CreateTrip from "./pages/CreateTrip";
import MyTrips from "./pages/MyTrips";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import Experiences from "./pages/Experiences";
import ExperienceDetail from "./pages/ExperienceDetail";
import ExperienceCreate from "./pages/ExperienceCreate";
import ExperienceEdit from "./pages/ExperienceEdit";
import ManageTrip from "./pages/ManageTrip";
import TravelHosts from "./pages/TravelHosts";
import NotFound from "./pages/NotFound";
import Bookmarks from "./pages/Bookmarks";
import Inbox from "./pages/Inbox";

const queryClient = new QueryClient();

const GlobalLoginModal = () => {
  const { loginModalOpen, setLoginModalOpen, pendingAuthAction } = useAuth();
  return (
    <LoginModal
      open={loginModalOpen}
      onOpenChange={setLoginModalOpen}
      onSuccess={() => {
        pendingAuthAction?.();
      }}
    />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DraftProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <GlobalLoginModal />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/trips" element={<BrowseTrips />} />
            <Route path="/trips/preview" element={<TripPreview />} />
            <Route path="/trips/:id" element={<TripDetail />} />
            <Route path="/create-trip" element={<CreateTrip />} />
            <Route path="/my-trips" element={<MyTrips />} />
            <Route path="/experiences" element={<Experiences />} />
            <Route path="/experiences/create" element={<ExperienceCreate />} />
            <Route path="/experiences/edit" element={<ExperienceEdit />} />
            <Route path="/experiences/:slug" element={<ExperienceDetail />} />
            <Route path="/blogs" element={<Experiences />} />
            <Route path="/travel-hosts" element={<TravelHosts />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/manage-trip/:id" element={<ManageTrip />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </DraftProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
