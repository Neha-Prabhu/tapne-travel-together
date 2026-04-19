import { Outlet, NavLink } from "react-router-dom";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, BookOpen, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/dashboard/trips", label: "Trips", icon: MapPin },
  { to: "/dashboard/stories", label: "Stories", icon: BookOpen },
  { to: "/dashboard/reviews", label: "Reviews", icon: Star },
  { to: "/dashboard/subscriptions", label: "Subscriptions", icon: Users },
];

const Dashboard = () => {
  const { isAuthenticated, requireAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (!isAuthenticated) requireAuth(() => {}); }, [isAuthenticated]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="border-b bg-card">
          <div className="mx-auto max-w-6xl px-4 pt-6">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <nav className="mt-4 flex gap-1 overflow-x-auto">
              {TABS.map(t => {
                const Icon = t.icon;
                return (
                  <NavLink
                    key={t.to}
                    to={t.to}
                    className={({ isActive }) => cn(
                      "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />{t.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
