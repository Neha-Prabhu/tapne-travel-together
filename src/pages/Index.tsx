import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TripCard from "@/components/TripCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/home/HeroSection";
import QuickFilters from "@/components/home/QuickFilters";
import HorizontalCarousel from "@/components/home/HorizontalCarousel";
import TravelerCard from "@/components/TravelerCard";

import WhyTapne from "@/components/home/WhyTapne";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import FAQSection from "@/components/home/FAQSection";
import FinalCTA from "@/components/home/FinalCTA";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import type { HomeResponse, TripData, BlogData, TestimonialData, CommunityProfile } from "@/types/api";
import { MapPin, ArrowRight, User, Calendar, Loader2, Compass } from "lucide-react";

const Index = () => {
  const [trips, setTrips] = useState<TripData[]>([]);
  const [blogs, setBlogs] = useState<BlogData[]>([]);
  const [hosts, setHosts] = useState<CommunityProfile[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
  const [stats, setStats] = useState<{ travelers: number; trips_hosted: number; destinations: number } | undefined>();
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    if (!cfg?.api?.home) { setLoading(false); return; }
    apiGet<HomeResponse>(cfg.api.home)
      .then((data) => {
        setTrips(data.trips || []);
        setBlogs(data.blogs || []);
        setHosts(data.community_profiles || []);
        setTestimonials(data.testimonials || []);
        setStats(data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredTrips = useMemo(() => {
    if (!activeFilter) return trips;
    return trips.filter(
      (t) => (t.trip_type || "").toLowerCase() === activeFilter.toLowerCase()
    );
  }, [trips, activeFilter]);

  const destinations = useMemo(() => {
    // Mirror Search.tsx destination aggregation (name, image, count,
    // nextDeparture, topTypes) so home destination cards match the visual
    // structure of Search destination cards exactly.
    const destMap = new Map<
      string,
      { name: string; image: string; count: number; nextDeparture?: string; topTypes: string[] }
    >();
    trips.forEach((t) => {
      const name = (t.destination || "").split(",")[0].trim();
      if (!name) return;
      const key = name.toLowerCase();
      let entry = destMap.get(key);
      if (!entry) {
        entry = {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          image: t.banner_image_url || "",
          count: 0,
          nextDeparture: undefined,
          topTypes: [],
        };
        destMap.set(key, entry);
      }
      entry.count++;
      if (!entry.image && t.banner_image_url) entry.image = t.banner_image_url;
      if (t.starts_at) {
        if (!entry.nextDeparture || new Date(t.starts_at) < new Date(entry.nextDeparture)) {
          entry.nextDeparture = t.starts_at;
        }
      }
      if (t.trip_type && !entry.topTypes.includes(t.trip_type)) entry.topTypes.push(t.trip_type);
    });
    return Array.from(destMap.values()).map((d) => ({ ...d, topTypes: d.topTypes.slice(0, 3) }));
  }, [trips]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero — stats are rendered inside HeroSection below search */}
        <HeroSection trips={trips} stats={stats} />

        {/* 1. Explore Trips — filters live here */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">Explore Trips</h2>
              <p className="mt-1 text-muted-foreground">Discover community trips created by travelers.</p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link to="/search?intent=trips">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>

          {/* Quick filter pills */}
          <QuickFilters active={activeFilter} onSelect={setActiveFilter} />

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredTrips.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              {activeFilter ? `No ${activeFilter} trips available.` : "No trips available yet."}
            </p>
          ) : (
            <HorizontalCarousel>
              {filteredTrips.slice(0, 6).map((trip) => (
                <div key={trip.id} className="flex min-w-[300px] max-w-[320px] shrink-0">
                  <div className="w-full">
                    <TripCard trip={trip} />
                  </div>
                </div>
              ))}
            </HorizontalCarousel>
          )}

          <div className="mt-6 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link to="/search?intent=trips">View All Trips</Link>
            </Button>
          </div>
        </section>

        {/* 2. Destinations */}
        {destinations.length > 0 && (
          <section className="py-14">
            <div className="mx-auto max-w-6xl px-4">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground md:text-3xl">Explore Destinations</h2>
                  <p className="mt-1 text-muted-foreground">Find trips by destination.</p>
                </div>
                <Button variant="ghost" asChild className="hidden sm:flex">
                  <Link to="/search?intent=destinations">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>

              <HorizontalCarousel>
                {destinations.slice(0, 6).map((dest) => (
                  <Link
                    key={dest.name}
                    // Match the authoritative destination-result click-through arrival state:
                    // open Destinations search for {name} → click the {name} result.
                    // That flow keeps q={name} in the URL (so the search bar shows the
                    // destination text and the contextual "for {name}" framing renders),
                    // adds destination={name}, and switches intent to trips with default sort.
                    to={`/search?intent=trips&q=${encodeURIComponent(dest.name)}&destination=${encodeURIComponent(dest.name)}`}
                    className="group block w-[240px] shrink-0 sm:w-[260px]"
                  >
                    {/* Mirror Search's portrait DestinationCard */}
                    <Card className="relative h-full overflow-hidden rounded-2xl border-0 shadow-sm transition-all duration-300 hover:shadow-xl">
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                        {dest.image ? (
                          <img
                            src={dest.image}
                            alt={dest.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Compass className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="absolute right-3 top-3">
                          <Badge className="bg-background/90 text-foreground backdrop-blur-sm hover:bg-background/90">
                            {dest.count} trip{dest.count !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <h3 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
                              {dest.name}
                            </h3>
                          </div>
                          {dest.nextDeparture && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-white/85">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              Next departure{" "}
                              {new Date(dest.nextDeparture).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          )}
                          {dest.topTypes.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {dest.topTypes.map((t) => (
                                <Badge
                                  key={t}
                                  variant="secondary"
                                  className="border-white/20 bg-white/15 text-[10px] font-medium text-white backdrop-blur-sm hover:bg-white/15"
                                >
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </HorizontalCarousel>
            </div>
          </section>
        )}

        {/* 3. Travel Hosts */}
        {hosts.length > 0 && (
          <section className="py-14">
            <div className="mx-auto max-w-6xl px-4">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground md:text-3xl">Travel Hosts</h2>
                  <p className="mt-1 text-muted-foreground">Meet the people leading community trips.</p>
                </div>
                <Button variant="ghost" asChild className="hidden sm:flex">
                  <Link to="/search?intent=people">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>

              <HorizontalCarousel>
                {hosts.slice(0, 6).map((p) => (
                  <div key={p.username} className="w-[260px] shrink-0 sm:w-[280px]">
                    <TravelerCard profile={p} />
                  </div>
                ))}
              </HorizontalCarousel>
            </div>
          </section>
        )}

        {/* 4. Stories */}
        {blogs.length > 0 && (
          <section className="bg-muted/30 py-14">
            <div className="mx-auto max-w-6xl px-4">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground md:text-3xl">Stories</h2>
                  <p className="mt-1 text-muted-foreground">Stories and tips from fellow travelers.</p>
                </div>
                <Button variant="ghost" asChild className="hidden sm:flex">
                  <Link to="/search?intent=stories">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>

              <HorizontalCarousel>
                {blogs.slice(0, 6).map((blog) => (
                  <Link
                    key={blog.slug}
                    to={`/stories/${blog.slug}`}
                    // Match Trips card wrapper dimensions for a consistent footprint
                    className="block min-w-[300px] max-w-[320px] shrink-0"
                  >
                    <Card className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
                      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                        {blog.cover_image_url ? (
                          <img
                            src={blog.cover_image_url}
                            alt={blog.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : null}
                      </div>
                      <CardContent className="flex flex-1 flex-col p-4">
                        {/* Title — reserve 2 lines so footprint matches Trips card */}
                        <h3 className="mb-1 line-clamp-2 min-h-[2.75rem] text-base font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
                          {blog.title}
                        </h3>
                        {/* Excerpt — always reserve 2 lines */}
                        <p className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                          {blog.excerpt || "\u00A0"}
                        </p>
                        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {blog.author_display_name || blog.author_username}
                          </div>
                          {blog.created_at && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(blog.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </HorizontalCarousel>
            </div>
          </section>
        )}

        {/* 5. Why Tapne */}
        <WhyTapne />

        {/* 6. What Travelers Say */}
        <TestimonialsSection testimonials={testimonials} />

        {/* 7. FAQ */}
        <FAQSection />

        {/* 8. Final CTA */}
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
