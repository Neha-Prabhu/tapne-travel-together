import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { apiGet } from "@/lib/api";
import { useSearch } from "@/contexts/SearchContext";
import type { TripData, BlogData } from "@/types/api";
import {
  Search as SearchIcon,
  Loader2,
  MapPin,
  Calendar,
  IndianRupee,
  Star,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const VALID_INTENTS = ["all", "trips", "destinations", "stories", "people"] as const;
type Intent = (typeof VALID_INTENTS)[number];

const PAGE_SIZE = 8;
const DEFAULT_HERO =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80";

interface DestinationAgg {
  name: string;
  image: string;
  count: number;
}

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { query: ctxQuery, setQuery: setCtxQuery } = useSearch();

  const urlIntent = (searchParams.get("intent") || "all") as Intent;
  const initialIntent: Intent = (VALID_INTENTS as readonly string[]).includes(urlIntent)
    ? urlIntent
    : "all";
  const initialQ = searchParams.get("q") || ctxQuery || "";
  const initialDest = searchParams.get("destination") || "";

  const [intent, setIntent] = useState<Intent>(initialIntent);
  const [query, setQueryLocal] = useState(initialQ);
  const [submitted, setSubmitted] = useState(initialQ);
  const [destination, setDestination] = useState(initialDest);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [stories, setStories] = useState<BlogData[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<"recent" | "popular" | "price_asc" | "price_desc">("recent");
  const [page, setPage] = useState(1);

  // Trip-specific filters
  const [tripType, setTripType] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  // Sync URL → state
  useEffect(() => {
    const i = (searchParams.get("intent") || "all") as Intent;
    if ((VALID_INTENTS as readonly string[]).includes(i)) setIntent(i);
    const q = searchParams.get("q") || "";
    setQueryLocal(q);
    setSubmitted(q);
    setDestination(searchParams.get("destination") || "");
    setPage(1);
  }, [searchParams]);

  // Mirror typed query into shared search context
  useEffect(() => {
    setCtxQuery(query);
  }, [query]);

  // Fetch
  useEffect(() => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    setLoading(true);
    const q = encodeURIComponent(submitted.trim());
    const dest = encodeURIComponent(destination.trim());
    const tripsUrl = `${cfg.api.trips}?q=${q}&sort=${sort}${dest ? `&destination=${dest}` : ""}`;

    Promise.allSettled([
      apiGet<{ trips: TripData[] }>(tripsUrl).then((d) => setTrips(d.trips || [])),
      apiGet<{ blogs: BlogData[] }>(`${cfg.api.blogs}?q=${q}`).then((d) =>
        setStories(d.blogs || []),
      ),
      apiGet<{ users: any[] }>(`${cfg.api.users_search}?q=${q}`).then((d) =>
        setUsers(d.users || []),
      ),
    ]).finally(() => setLoading(false));
  }, [submitted, sort, destination]);

  // Derived
  const destinations: DestinationAgg[] = useMemo(() => {
    const map = new Map<string, DestinationAgg>();
    trips.forEach((t) => {
      const dest = (t.destination || "").split(",")[0].trim();
      if (!dest) return;
      const key = dest.toLowerCase();
      const existing = map.get(key);
      if (existing) existing.count++;
      else
        map.set(key, {
          name: dest.charAt(0).toUpperCase() + dest.slice(1),
          image: t.banner_image_url || "",
          count: 1,
        });
    });
    return Array.from(map.values());
  }, [trips]);

  const filteredTrips = useMemo(() => {
    let out = trips;
    if (tripType) out = out.filter((t) => (t.trip_type || "").toLowerCase() === tripType.toLowerCase());
    const max = parseInt(maxPrice, 10);
    if (!Number.isNaN(max)) out = out.filter((t) => (t.price_per_person ?? 0) <= max);
    return out;
  }, [trips, tripType, maxPrice]);

  const counts = {
    all: filteredTrips.length + destinations.length + stories.length + users.length,
    trips: filteredTrips.length,
    destinations: destinations.length,
    stories: stories.length,
    people: users.length,
  };

  // Reset page when filters change
  useEffect(() => setPage(1), [intent, sort, tripType, maxPrice, submitted, destination]);

  // Update URL helper
  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    });
    setSearchParams(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(query);
    updateParams({ q: query || null });
  };

  const handleIntent = (next: Intent) => {
    setIntent(next);
    updateParams({ intent: next === "all" ? null : next });
  };

  const handleDestinationClick = (name: string) => {
    setDestination(name);
    setIntent("trips");
    updateParams({ destination: name, intent: "trips" });
  };

  const clearDestination = () => {
    setDestination("");
    updateParams({ destination: null });
  };

  // Pagination per intent
  const paginate = <T,>(items: T[]): { items: T[]; total: number; from: number; to: number; pages: number } => {
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, pages);
    const from = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
    const to = Math.min(total, safePage * PAGE_SIZE);
    return { items: items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), total, from, to, pages };
  };

  // Renderers — full-width horizontal rows
  const TripRow = ({ t }: { t: TripData }) => (
    <Link to={`/trips/${t.id}`} className="block">
      <Card className="flex overflow-hidden transition-shadow hover:shadow-md">
        <img
          src={t.banner_image_url || DEFAULT_HERO}
          alt={t.title}
          className="h-32 w-44 shrink-0 object-cover sm:h-36 sm:w-56"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              {t.trip_type && <Badge className="bg-primary/90">{t.trip_type}</Badge>}
              <h3 className="truncate text-base font-semibold text-foreground">{t.title}</h3>
            </div>
            {t.summary && <p className="line-clamp-2 text-sm text-muted-foreground">{t.summary}</p>}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {t.destination && (
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{t.destination}</span>
            )}
            {t.starts_at && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(t.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
            {t.average_rating != null && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                {t.average_rating.toFixed(1)}
              </span>
            )}
            {t.spots_left != null && (
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{t.spots_left} left</span>
            )}
            {t.price_per_person != null && (
              <span className="ml-auto flex items-center gap-1 font-medium text-foreground">
                <IndianRupee className="h-3.5 w-3.5" />{t.price_per_person.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );

  const DestinationRow = ({ d }: { d: DestinationAgg }) => (
    <button
      onClick={() => handleDestinationClick(d.name)}
      className="block w-full text-left"
    >
      <Card className="flex overflow-hidden transition-shadow hover:shadow-md">
        {d.image && <img src={d.image} alt={d.name} className="h-28 w-44 shrink-0 object-cover" />}
        <div className="flex min-w-0 flex-1 items-center justify-between p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="truncate text-base font-semibold text-foreground">{d.name}</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{d.count} trip{d.count !== 1 ? "s" : ""} available</p>
          </div>
          <Badge variant="secondary">View trips</Badge>
        </div>
      </Card>
    </button>
  );

  const StoryRow = ({ s }: { s: BlogData }) => (
    <Link to={`/stories/${s.slug}`} className="block">
      <Card className="flex overflow-hidden transition-shadow hover:shadow-md">
        {s.cover_image_url && (
          <img src={s.cover_image_url} alt={s.title} className="h-28 w-44 shrink-0 object-cover" />
        )}
        <div className="min-w-0 flex-1 p-4">
          <h3 className="line-clamp-1 text-base font-semibold text-foreground">{s.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {s.short_description || s.excerpt}
          </p>
        </div>
      </Card>
    </Link>
  );

  const PersonRow = ({ u }: { u: any }) => (
    <Link to={`/users/${u.username}`} className="block">
      <Card className="flex items-center gap-4 p-4 transition-shadow hover:shadow-md">
        <Avatar className="h-14 w-14">
          <AvatarFallback>{(u.display_name || u.username || "?")[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-foreground">{u.display_name || u.username}</div>
          {u.location && (
            <div className="truncate text-xs text-muted-foreground">{u.location}</div>
          )}
        </div>
        <Badge variant="outline">View profile</Badge>
      </Card>
    </Link>
  );

  // Build current intent dataset
  const currentList = (() => {
    if (intent === "trips") return paginate(filteredTrips);
    if (intent === "destinations") return paginate(destinations);
    if (intent === "stories") return paginate(stories);
    if (intent === "people") return paginate(users);
    return null;
  })();

  const renderItem = (item: any) => {
    if (intent === "trips") return <TripRow key={item.id} t={item} />;
    if (intent === "destinations") return <DestinationRow key={item.name} d={item} />;
    if (intent === "stories") return <StoryRow key={item.slug} s={item} />;
    if (intent === "people") return <PersonRow key={item.username} u={item} />;
    return null;
  };

  // Sort options per intent
  const sortOptions = (() => {
    if (intent === "trips") return [
      { v: "recent", l: "Most recent" },
      { v: "popular", l: "Most popular" },
      { v: "price_asc", l: "Price: low to high" },
      { v: "price_desc", l: "Price: high to low" },
    ];
    return [
      { v: "recent", l: "Most recent" },
      { v: "popular", l: "Most popular" },
    ];
  })();

  const intentChips: { v: Intent; l: string; n: number }[] = [
    { v: "all", l: "All", n: counts.all },
    { v: "trips", l: "Trips", n: counts.trips },
    { v: "destinations", l: "Destinations", n: counts.destinations },
    { v: "stories", l: "Stories", n: counts.stories },
    { v: "people", l: "People", n: counts.people },
  ];

  // Build numbered pagination (compact)
  const renderPagination = (pages: number) => {
    if (pages <= 1) return null;
    const nums: (number | "…")[] = [];
    const push = (n: number | "…") => nums.push(n);
    const window = 1;
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= page - window && i <= page + window)) push(i);
      else if (nums[nums.length - 1] !== "…") push("…");
    }
    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }}
            />
          </PaginationItem>
          {nums.map((n, i) =>
            n === "…" ? (
              <PaginationItem key={`e-${i}`}><PaginationEllipsis /></PaginationItem>
            ) : (
              <PaginationItem key={n}>
                <PaginationLink
                  href="#"
                  isActive={n === page}
                  onClick={(e) => { e.preventDefault(); setPage(n as number); }}
                >
                  {n}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(pages, p + 1)); }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  // Mixed feed sections (top of each)
  const mixed = (() => {
    return {
      trips: filteredTrips.slice(0, 3),
      destinations: destinations.slice(0, 3),
      stories: stories.slice(0, 3),
      people: users.slice(0, 3),
    };
  })();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold text-foreground">Search</h1>

        {/* Search bar with destination chip inside */}
        <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQueryLocal(e.target.value)}
              placeholder="Search trips, stories, people…"
              className={cn("pl-9", destination && "pr-44")}
            />
            {destination && (
              <button
                type="button"
                onClick={clearDestination}
                className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
              >
                <MapPin className="h-3 w-3" />
                {destination}
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <Button type="submit">Search</Button>
        </form>

        {/* Intent chips */}
        <div className="mb-6 flex flex-wrap gap-2">
          {intentChips.map((c) => (
            <button
              key={c.v}
              onClick={() => handleIntent(c.v)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                intent === c.v
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted",
              )}
            >
              {c.l}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs",
                  intent === c.v ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground",
                )}
              >
                {c.n}
              </span>
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && (
          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
            {/* Filters — only when a specific intent is chosen */}
            {intent !== "all" ? (
              <aside className="space-y-5">
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Sort by
                  </div>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as any)}
                  >
                    {sortOptions.map((o) => (
                      <option key={o.v} value={o.v}>{o.l}</option>
                    ))}
                  </select>
                </div>

                {intent === "trips" && (
                  <>
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Trip type
                      </div>
                      <select
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={tripType}
                        onChange={(e) => setTripType(e.target.value)}
                      >
                        <option value="">Any</option>
                        <option value="adventure">Adventure</option>
                        <option value="relaxation">Relaxation</option>
                        <option value="cultural">Cultural</option>
                        <option value="trekking">Trekking</option>
                      </select>
                    </div>
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Max price (₹)
                      </div>
                      <Input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="Any"
                      />
                    </div>
                    {(tripType || maxPrice) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setTripType(""); setMaxPrice(""); }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </>
                )}

                {intent === "destinations" && (
                  <p className="text-xs text-muted-foreground">
                    Select a destination to see all matching trips.
                  </p>
                )}
              </aside>
            ) : (
              <div className="hidden lg:block" />
            )}

            {/* Results column */}
            <section>
              {intent === "all" ? (
                <div className="space-y-8">
                  {counts.all === 0 && (
                    <p className="py-12 text-center text-muted-foreground">
                      No results found{submitted ? ` for "${submitted}"` : ""}.
                    </p>
                  )}

                  {mixed.trips.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">Trips</h2>
                        <button onClick={() => handleIntent("trips")} className="text-sm font-medium text-primary hover:underline">
                          View all {counts.trips}
                        </button>
                      </div>
                      <div className="space-y-3">{mixed.trips.map((t) => <TripRow key={t.id} t={t} />)}</div>
                    </div>
                  )}

                  {mixed.destinations.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">Destinations</h2>
                        <button onClick={() => handleIntent("destinations")} className="text-sm font-medium text-primary hover:underline">
                          View all {counts.destinations}
                        </button>
                      </div>
                      <div className="space-y-3">{mixed.destinations.map((d) => <DestinationRow key={d.name} d={d} />)}</div>
                    </div>
                  )}

                  {mixed.stories.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">Stories</h2>
                        <button onClick={() => handleIntent("stories")} className="text-sm font-medium text-primary hover:underline">
                          View all {counts.stories}
                        </button>
                      </div>
                      <div className="space-y-3">{mixed.stories.map((s) => <StoryRow key={s.slug} s={s} />)}</div>
                    </div>
                  )}

                  {mixed.people.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">People</h2>
                        <button onClick={() => handleIntent("people")} className="text-sm font-medium text-primary hover:underline">
                          View all {counts.people}
                        </button>
                      </div>
                      <div className="space-y-3">{mixed.people.map((u) => <PersonRow key={u.username} u={u} />)}</div>
                    </div>
                  )}
                </div>
              ) : currentList && currentList.total === 0 ? (
                <p className="py-12 text-center text-muted-foreground">
                  No {intent} found{submitted ? ` for "${submitted}"` : ""}.
                </p>
              ) : (
                currentList && (
                  <>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">{currentList.total}</span> result
                        {currentList.total !== 1 ? "s" : ""}
                        {submitted && <> for "<span className="text-foreground">{submitted}</span>"</>}
                      </div>
                      <div>
                        Showing {currentList.from}–{currentList.to} of {currentList.total}
                      </div>
                    </div>
                    <div className="space-y-3">{currentList.items.map(renderItem)}</div>
                    {renderPagination(currentList.pages)}
                  </>
                )
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;
