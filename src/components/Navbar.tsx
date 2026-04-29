import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSearch } from "@/contexts/SearchContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, Bell, Sun, Moon, Inbox, Bookmark, User, LogOut, MapPin as MapPinIcon, Search as SearchIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { apiGet } from "@/lib/api";
import CreateTripModal from "@/components/CreateTripModal";

interface Notification {
  id: string;
  icon: string;
  message: string;
  time: string;
  unread: boolean;
}

const Navbar = () => {
  const { user, isAuthenticated, logout, requireAuth } = useAuth();
  const { query, setQuery } = useSearch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNavSearch, setShowNavSearch] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    if (!cfg?.api?.notifications) return;
    apiGet<{ notifications: Notification[]; unread_count: number }>(cfg.api.notifications)
      .then((data) => setNotifications(data.notifications || []))
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    const onScroll = () => {
      const isHome = window.location.pathname === "/";
      if (!isHome) { setShowNavSearch(true); return; }
      setShowNavSearch(window.scrollY > 360);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <>
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold tracking-tight text-primary">
          Tapne
        </Link>

        {/* Persistent search — slides in once user scrolls past hero */}
        <form
          onSubmit={submitSearch}
          className={`mx-4 hidden flex-1 max-w-md transition-all duration-300 md:block ${
            showNavSearch ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trips, stories, people…"
              className="h-9 rounded-full bg-background pl-9"
            />
          </div>
        </form>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/search?intent=trips">Trips</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/search?intent=stories">Stories</Link>
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-9 w-9">
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-muted">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-3 py-2 text-sm font-semibold text-foreground">Notifications</div>
              <DropdownMenuSeparator />
              {notifications.length === 0 && (
                <div className="px-3 py-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">No notifications yet</p>
                  <button onClick={() => navigate("/notifications")} className="text-xs text-primary hover:underline">Go to notifications</button>
                </div>
              )}
              {notifications.map(n => (
                <DropdownMenuItem key={n.id} className="flex items-start gap-3 px-3 py-2.5 cursor-pointer" onClick={() => navigate("/notifications")}>
                  <span className="text-lg">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.unread ? "font-medium text-foreground" : "text-muted-foreground"}`}>{n.message}</p>
                    <p className="text-xs text-muted-foreground">{n.time}</p>
                  </div>
                  {n.unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </DropdownMenuItem>
              ))}
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-xs text-muted-foreground cursor-pointer" onClick={() => navigate("/notifications")}>
                    View all notifications
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 rounded-full ring-2 ring-primary/20 transition hover:ring-primary/50">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate(`/users/${user?.username || user?.id}`)}>
                  <User className="mr-2 h-4 w-4" /> My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/trips")}>
                  <MapPinIcon className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/messages")}>
                  <Inbox className="mr-2 h-4 w-4" /> Messages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/bookmarks")}>
                  <Bookmark className="mr-2 h-4 w-4" /> Bookmarks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <User className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" className="ml-1" onClick={() => requireAuth()}>
              Login
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-1 md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-9 w-9">
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative flex h-9 w-9 items-center justify-center rounded-md">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {notifications.map(n => (
                <DropdownMenuItem key={n.id} className="flex items-start gap-2 px-3 py-2">
                  <span>{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{n.message}</p>
                    <p className="text-xs text-muted-foreground">{n.time}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <button onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="flex flex-col gap-1 border-t bg-card px-4 pb-4 pt-2 md:hidden">
          <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
            <Link to="/search?intent=trips">Trips</Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
            <Link to="/search?intent=stories">Stories</Link>
          </Button>
          {isAuthenticated ? (
            <>
              <Button variant="ghost" className="justify-start" onClick={() => { setCreateModalOpen(true); setMobileOpen(false); }}>
                Create Trip
              </Button>
              <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/dashboard/trips">Dashboard</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                <Link to={`/users/${user?.username || user?.id}`}>My Profile</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/messages">Messages</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/bookmarks">Bookmarks</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/settings">Settings</Link>
              </Button>
              <Button variant="ghost" className="justify-start text-destructive" onClick={() => { handleLogout(); setMobileOpen(false); }}>
                Log Out
              </Button>
            </>
          ) : (
            <Button className="justify-start" onClick={() => { requireAuth(); setMobileOpen(false); }}>
              Login
            </Button>
          )}
        </div>
      )}
    </nav>
    <CreateTripModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </>
  );
};

export default Navbar;
