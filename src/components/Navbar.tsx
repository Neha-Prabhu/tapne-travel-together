import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, Bell, Sun, Moon, Inbox, Bookmark, Settings, User, LogOut, MapPin as MapPinIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import CreateTripModal from "@/components/CreateTripModal";

const notifications = [
  { id: 1, icon: "👤", message: "Rahul joined your trip", time: "2 min ago", unread: true },
  { id: 2, icon: "✅", message: "Your trip application was accepted", time: "1 hour ago", unread: true },
  { id: 3, icon: "💬", message: "New message from Priya", time: "3 hours ago", unread: false },
];

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold tracking-tight text-primary">
          Tapne
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/trips">Trips</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/blogs">Blogs</Link>
          </Button>

          {/* Dark/Light toggle */}
          <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-9 w-9">
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Notification Bell */}
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
              {notifications.map(n => (
                <DropdownMenuItem key={n.id} className="flex items-start gap-3 px-3 py-2.5">
                  <span className="text-lg">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.unread ? "font-medium text-foreground" : "text-muted-foreground"}`}>{n.message}</p>
                    <p className="text-xs text-muted-foreground">{n.time}</p>
                  </div>
                  {n.unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </DropdownMenuItem>
              ))}
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
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" /> My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/inbox")}>
                  <Inbox className="mr-2 h-4 w-4" /> Inbox
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/bookmarks")}>
                  <Bookmark className="mr-2 h-4 w-4" /> Bookmarks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" /> Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" asChild className="ml-1">
              <Link to="/login">Login</Link>
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
            <Link to="/trips">Trips</Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
            <Link to="/blogs">Blogs</Link>
          </Button>
          {isAuthenticated ? (
            <>
              <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/profile">My Profile</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/inbox">Inbox</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/bookmarks">Bookmarks</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/settings">Settings</Link>
              </Button>
              <Button variant="ghost" className="justify-start text-destructive" onClick={() => { logout(); setMobileOpen(false); }}>
                Log Out
              </Button>
            </>
          ) : (
            <Button className="justify-start" asChild onClick={() => setMobileOpen(false)}>
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
