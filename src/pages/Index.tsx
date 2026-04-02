import { useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TripCard from "@/components/TripCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trips, users } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { Search, MapPin, ChevronLeft, ChevronRight, Calendar, ArrowRight, User, Star } from "lucide-react";

// ─── Extract unique destinations ───
const getDestinations = () => {
  const destMap = new Map<string, string>();
  trips.forEach(t => {
    const key = t.destination.split(",")[0].trim().toLowerCase();
    if (!destMap.has(key)) {
      destMap.set(key, t.coverImage);
    }
  });
  return Array.from(destMap.entries()).map(([name, image]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    image,
    slug: name.replace(/\s+/g, "-"),
  }));
};

// ─── Carousel Component ───
const HorizontalCarousel = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className={`group relative ${className || ""}`}>
      <button
        onClick={() => scroll("left")}
        className="absolute -left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border bg-card shadow-md transition-opacity group-hover:flex hover:bg-muted"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
        {children}
      </div>
      <button
        onClick={() => scroll("right")}
        className="absolute -right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border bg-card shadow-md transition-opacity group-hover:flex hover:bg-muted"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

// ─── Blog data (mock) ───
const mockBlogs = [
  { id: "b1", title: "My First Solo Trip to Goa — Lessons Learned", author: "Arjun Mehta", coverImage: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80", date: "2026-02-20", trip: "Goa Backpacking" },
  { id: "b2", title: "Surviving Hampta Pass: A Beginner's Trek Story", author: "Ravi Kumar", coverImage: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80", date: "2026-02-18", trip: "Himachal Trek" },
  { id: "b3", title: "Why Bali Changed My Perspective on Travel", author: "Priya Sharma", coverImage: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80", date: "2026-02-15" },
  { id: "b4", title: "Desert Nights in Jaisalmer — A Photo Journal", author: "Karan Singh", coverImage: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&q=80", date: "2026-02-10", trip: "Rajasthan Camp" },
  { id: "b5", title: "Kerala Backwaters: The Ultimate Wellness Guide", author: "Meera Nair", coverImage: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80", date: "2026-02-08" },
  { id: "b6", title: "Ladakh Road Trip Essentials You Can't Miss", author: "Arjun Mehta", coverImage: "https://images.unsplash.com/photo-1626014303715-48c7b1a7a814?w=600&q=80", date: "2026-02-05", trip: "Ladakh Road Trip" },
];

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const destinations = useMemo(getDestinations, []);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { trips: [], users: [] };
    const q = searchQuery.toLowerCase();
    return {
      trips: trips.filter(t => t.title.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q)).slice(0, 5),
      users: users.filter(u => u.name.toLowerCase().includes(q)).slice(0, 3),
    };
  }, [searchQuery]);

  const hasResults = searchResults.trips.length > 0 || searchResults.users.length > 0;

  // Featured trips (first 3)
  const featuredTrips = trips.slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/30 to-background px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
              Find your kind of people.{" "}
              <span className="text-primary">Then travel.</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Join community-led trips with like-minded travelers. Discover adventures, make friends, and explore the world together.
            </p>

            {/* Search Bar */}
            <div className="relative mx-auto max-w-xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-14 rounded-full border-2 border-primary/20 bg-card pl-12 pr-4 text-base shadow-lg transition-all focus:border-primary focus:shadow-xl"
                placeholder="Search trips or travelers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              />

              {/* Search Dropdown */}
              {searchFocused && searchQuery.trim() && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border bg-card p-2 shadow-xl">
                  {!hasResults && (
                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">No results found</p>
                  )}
                  {searchResults.trips.length > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trips</p>
                      {searchResults.trips.map(t => (
                        <button
                          key={t.id}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted"
                          onMouseDown={() => navigate(`/trips/${t.id}`)}
                        >
                          <img src={t.coverImage} alt="" className="h-10 w-10 rounded-lg object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{t.title}</p>
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />{t.destination}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.users.length > 0 && (
                    <div className="mt-1">
                      <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Travelers</p>
                      {searchResults.users.map(u => (
                        <button
                          key={u.id}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted"
                          onMouseDown={() => navigate("/profile")}
                        >
                          <img src={u.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.location}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── Section 1: Explore Trips ─── */}
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">Explore Trips</h2>
              <p className="mt-1 text-muted-foreground">Discover community trips created by travellers.</p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link to="/trips">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>

          <HorizontalCarousel>
            {trips.slice(0, 6).map(trip => (
              <div key={trip.id} className="min-w-[300px] max-w-[320px] shrink-0">
                <TripCard trip={trip} />
              </div>
            ))}
          </HorizontalCarousel>

          <div className="mt-6 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link to="/trips">View All Trips</Link>
            </Button>
          </div>
        </section>

        {/* ─── Section 2: Destinations ─── */}
        <section className="bg-muted/30 py-14">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">Explore Destinations</h2>
            <p className="mb-6 text-muted-foreground">Find trips by destination.</p>

            <HorizontalCarousel>
              {destinations.map(dest => (
                <Link
                  key={dest.slug}
                  to={`/trips?destination=${dest.slug}`}
                  className="group w-[220px] shrink-0 sm:w-[260px]"
                >
                  <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={dest.image}
                        alt={dest.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <div className="flex items-center gap-1.5 text-white">
                          <MapPin className="h-4 w-4" />
                          <span className="text-lg font-semibold">{dest.name}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </HorizontalCarousel>
          </div>
        </section>

        {/* ─── Section 3: Blogs ─── */}
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">From the Community</h2>
              <p className="mt-1 text-muted-foreground">Stories, tips, and experiences from fellow travelers.</p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link to="/blogs">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>

          <HorizontalCarousel>
            {mockBlogs.slice(0, 6).map(blog => (
              <div key={blog.id} className="min-w-[280px] max-w-[300px] shrink-0">
                <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {blog.trip && (
                      <Badge className="absolute left-3 top-3 bg-primary/90 text-primary-foreground text-xs">
                        {blog.trip}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="mb-2 line-clamp-2 text-base font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">
                      {blog.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {blog.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(blog.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </HorizontalCarousel>

          <div className="mt-6 text-center">
            <Button variant="outline" asChild>
              <Link to="/blogs">View All Blogs</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
