import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiGet } from "@/lib/api";
import { useSearch } from "@/contexts/SearchContext";
import type { TripData, BlogData } from "@/types/api";
import TripCard from "@/components/TripCard";
import { Search as SearchIcon, Loader2, MapPin } from "lucide-react";

const VALID_TABS = ["trips", "destinations", "stories", "users"] as const;
type TabValue = (typeof VALID_TABS)[number];

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { query: ctxQuery, setQuery: setCtxQuery } = useSearch();
  const initialQ = searchParams.get("q") || ctxQuery || "";
  const destination = searchParams.get("destination") || "";
  const urlTab = (searchParams.get("tab") || "trips") as TabValue;
  const initialTab: TabValue = (VALID_TABS as readonly string[]).includes(urlTab) ? urlTab : "trips";

  const [query, setQuery] = useState(initialQ);
  const [submitted, setSubmitted] = useState(initialQ);
  const [tab, setTab] = useState<TabValue>(initialTab);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [stories, setStories] = useState<BlogData[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<"recent" | "popular">("recent");

  const hasCriteria = true;

  useEffect(() => {
    const newTab = (searchParams.get("tab") || "trips") as TabValue;
    if ((VALID_TABS as readonly string[]).includes(newTab)) setTab(newTab);
    const q = searchParams.get("q") || "";
    setQuery(q);
    setSubmitted(q);
  }, [searchParams]);

  // Push typed query into shared context so navbar bar shows the same text
  useEffect(() => { setCtxQuery(query); }, [query]);

  useEffect(() => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    setLoading(true);

    const q = encodeURIComponent(submitted.trim());
    const dest = encodeURIComponent(destination.trim());
    const tripsUrl = `${cfg.api.trips}?q=${q}&sort=${sort}${dest ? `&destination=${dest}` : ""}`;

    Promise.allSettled([
      apiGet<{ trips: TripData[] }>(tripsUrl).then((d) => setTrips(d.trips || [])),
      apiGet<{ blogs: BlogData[] }>(`${cfg.api.blogs}?q=${q}`).then((d) => setStories(d.blogs || [])),
      apiGet<{ users: any[] }>(`${cfg.api.users_search}?q=${q}`).then((d) => setUsers(d.users || [])),
    ]).finally(() => setLoading(false));
  }, [submitted, sort, destination]);

  const destinations = useMemo(() => {
    const map = new Map<string, { name: string; image: string; count: number }>();
    trips.forEach((t) => {
      const dest = (t.destination || "").split(",")[0].trim();
      if (!dest) return;
      const key = dest.toLowerCase();
      const existing = map.get(key);
      if (existing) existing.count++;
      else map.set(key, { name: dest.charAt(0).toUpperCase() + dest.slice(1), image: t.banner_image_url || "", count: 1 });
    });
    return Array.from(map.values());
  }, [trips]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(query);
    const next: Record<string, string> = {};
    if (query) next.q = query;
    if (destination) next.destination = destination;
    if (tab && tab !== "trips") next.tab = tab;
    setSearchParams(next);
  };

  const handleTabChange = (val: string) => {
    const next = val as TabValue;
    setTab(next);
    const params = new URLSearchParams(searchParams);
    if (next === "trips") params.delete("tab"); else params.set("tab", next);
    setSearchParams(params);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-foreground">Search</h1>
        <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search trips, stories, people…" className="pl-9" />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <Tabs value={tab} onValueChange={handleTabChange}>
          <div className="flex items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="trips">Trips ({trips.length})</TabsTrigger>
              <TabsTrigger value="destinations">Destinations ({destinations.length})</TabsTrigger>
              <TabsTrigger value="stories">Stories ({stories.length})</TabsTrigger>
              <TabsTrigger value="users">People ({users.length})</TabsTrigger>
            </TabsList>
            <select className="rounded-md border bg-background px-3 py-1.5 text-sm" value={sort} onChange={e => setSort(e.target.value as any)}>
              <option value="recent">Most recent</option>
              <option value="popular">Most popular</option>
            </select>
          </div>

          {loading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}

          <TabsContent value="trips" className="mt-6">
            {trips.length === 0 ? <p className="py-8 text-center text-muted-foreground">No trips found.</p> : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {trips.map(t => <TripCard key={t.id} trip={t} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="destinations" className="mt-6">
            {destinations.length === 0 ? <p className="py-8 text-center text-muted-foreground">No destinations found.</p> : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {destinations.map(d => (
                  <Link key={d.name} to={`/search?destination=${encodeURIComponent(d.name)}`}>
                    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        {d.image && <img src={d.image} alt={d.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            <span className="text-lg font-semibold">{d.name}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-white/80">{d.count} trip{d.count !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stories" className="mt-6">
            {stories.length === 0 ? <p className="py-8 text-center text-muted-foreground">No stories found.</p> : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stories.map(s => (
                  <Link key={s.slug} to={`/stories/${s.slug}`}>
                    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                      {s.cover_image_url && <img src={s.cover_image_url} alt={s.title} className="aspect-[16/10] w-full object-cover" />}
                      <CardContent className="p-4">
                        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{s.title}</h3>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.short_description || s.excerpt}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            {users.length === 0 ? <p className="py-8 text-center text-muted-foreground">No people found.</p> : (
              <div className="grid gap-3 sm:grid-cols-2">
                {users.map((u: any) => (
                  <Link key={u.username} to={`/users/${u.username}`}>
                    <Card className="transition-shadow hover:shadow-md">
                      <CardContent className="flex items-center gap-3 p-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>{(u.display_name || u.username || "?")[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-foreground">{u.display_name || u.username}</div>
                          {u.location && <div className="truncate text-xs text-muted-foreground">{u.location}</div>}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;
