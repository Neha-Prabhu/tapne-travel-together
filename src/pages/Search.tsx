import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  Users,
  X,
  SlidersHorizontal,
  BookOpen,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";

const VALID_INTENTS = ["all", "trips", "destinations", "stories", "people"] as const;
type Intent = (typeof VALID_INTENTS)[number];

const PAGE_SIZE = 12;
const MIXED_QUOTA: Record<Exclude<Intent, "all">, number> = {
  trips: 5,
  destinations: 3,
  stories: 2,
  people: 2,
};
const DEFAULT_HERO =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80";

// Sort definitions per intent
type SortOpt = { v: string; l: string };
const SORTS: Record<Intent, SortOpt[]> = {
  all: [{ v: "recommended", l: "Recommended" }],
  trips: [
    { v: "best", l: "Best match" },
    { v: "trending", l: "Trending" },
    { v: "soonest", l: "Soonest departure" },
    { v: "newest", l: "Newest" },
  ],
  destinations: [
    { v: "best", l: "Best match" },
    { v: "most_trips", l: "Most trips" },
    { v: "trending", l: "Trending" },
    { v: "soonest", l: "Soonest departure" },
  ],
  stories: [
    { v: "best", l: "Best match" },
    { v: "most_read", l: "Most read" },
    { v: "newest", l: "Newest" },
  ],
  people: [
    { v: "best", l: "Best match" },
    { v: "most_followed", l: "Most followed" },
    { v: "most_hosted", l: "Most hosted trips" },
  ],
};

const defaultSortFor = (intent: Intent, hasQuery: boolean): string => {
  if (intent === "all") return "recommended";
  if (hasQuery) return "best";
  if (intent === "trips" || intent === "destinations") return "trending";
  if (intent === "stories") return "most_read";
  if (intent === "people") return "most_followed";
  return "best";
};

interface DestinationAgg {
  name: string;
  image: string;
  count: number;
  nextDeparture?: string;
  topTypes: string[];
}

interface PersonData {
  username: string;
  display_name?: string;
  avatar_url?: string;
  location?: string;
  travel_tags?: string[];
  followers_count?: number;
  hosted_trips_count?: number;
  is_host?: boolean;
}

interface TripFilters {
  origin: string;
  startDate: string;
  endDate: string;
  duration: string; // "any" | "1-3" | "4-7" | "8+"
  tripType: string;
  priceRange: [number, number];
  difficulty: string;
}
const PRICE_MIN = 0;
const PRICE_MAX = 100000;
const DEFAULT_TRIP_FILTERS: TripFilters = {
  origin: "",
  startDate: "",
  endDate: "",
  duration: "any",
  tripType: "",
  priceRange: [PRICE_MIN, PRICE_MAX],
  difficulty: "",
};

interface DestFilters {
  tripType: string;
  priceRange: [number, number];
  difficulty: string;
}
const DEFAULT_DEST_FILTERS: DestFilters = {
  tripType: "",
  priceRange: [PRICE_MIN, PRICE_MAX],
  difficulty: "",
};

interface StoryFilters {
  location: string;
  tag: string;
}
const DEFAULT_STORY_FILTERS: StoryFilters = { location: "", tag: "" };

interface PeopleFilters {
  location: string;
  travelTag: string;
  hostsOnly: boolean;
}
const DEFAULT_PEOPLE_FILTERS: PeopleFilters = { location: "", travelTag: "", hostsOnly: false };

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [people, setPeople] = useState<PersonData[]>([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<string>(defaultSortFor(initialIntent, !!initialQ));
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [tripFilters, setTripFilters] = useState<TripFilters>(DEFAULT_TRIP_FILTERS);
  const [destFilters, setDestFilters] = useState<DestFilters>(DEFAULT_DEST_FILTERS);
  const [storyFilters, setStoryFilters] = useState<StoryFilters>(DEFAULT_STORY_FILTERS);
  const [peopleFilters, setPeopleFilters] = useState<PeopleFilters>(DEFAULT_PEOPLE_FILTERS);

  // Sync URL → state (back/forward, deep links)
  useEffect(() => {
    const i = (searchParams.get("intent") || "all") as Intent;
    const safeIntent: Intent = (VALID_INTENTS as readonly string[]).includes(i) ? i : "all";
    setIntent(safeIntent);
    const q = searchParams.get("q") || "";
    setQueryLocal(q);
    setSubmitted(q);
    setDestination(searchParams.get("destination") || "");
    setSort((prev) => {
      // keep current sort if it's valid for this intent; otherwise reset to default
      const valid = SORTS[safeIntent].some((s) => s.v === prev);
      return valid ? prev : defaultSortFor(safeIntent, !!q);
    });
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Mirror typed query into shared search context
  useEffect(() => {
    setCtxQuery(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Fetch (we fetch all four sources so counts are always available)
  useEffect(() => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    if (!cfg?.api) return;
    setLoading(true);
    const q = encodeURIComponent(submitted.trim());
    const dest = encodeURIComponent(destination.trim());
    const tripsUrl = `${cfg.api.trips}?q=${q}${dest ? `&destination=${dest}` : ""}`;

    Promise.allSettled([
      apiGet<{ trips: TripData[] }>(tripsUrl).then((d) => setTrips(d.trips || [])),
      apiGet<{ blogs: BlogData[] }>(`${cfg.api.blogs}?q=${q}`).then((d) =>
        setStories(d.blogs || []),
      ),
      apiGet<{ users: PersonData[] }>(`${cfg.api.users_search}?q=${q}`).then((d) =>
        setPeople(d.users || []),
      ),
    ]).finally(() => setLoading(false));
  }, [submitted, destination]);

  // Reset page on any control change
  useEffect(() => {
    setPage(1);
  }, [intent, sort, tripFilters, destFilters, storyFilters, peopleFilters, submitted, destination]);

  // ── Derived ────────────────────────────────────────────────────────────
  const destinations: DestinationAgg[] = useMemo(() => {
    const map = new Map<string, DestinationAgg>();
    trips.forEach((t) => {
      const dest = (t.destination || "").split(",")[0].trim();
      if (!dest) return;
      const key = dest.toLowerCase();
      let entry = map.get(key);
      if (!entry) {
        entry = {
          name: dest.charAt(0).toUpperCase() + dest.slice(1),
          image: t.banner_image_url || "",
          count: 0,
          nextDeparture: undefined,
          topTypes: [],
        };
        map.set(key, entry);
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
    return Array.from(map.values()).map((d) => ({ ...d, topTypes: d.topTypes.slice(0, 3) }));
  }, [trips]);

  // ── Filtering ──────────────────────────────────────────────────────────
  const filteredTrips = useMemo(() => {
    let out = trips;
    const f = tripFilters;
    if (f.origin) {
      const o = f.origin.toLowerCase();
      out = out.filter((t) => (t.host_location || "").toLowerCase().includes(o));
    }
    if (f.startDate) {
      const s = new Date(f.startDate).getTime();
      out = out.filter((t) => (t.starts_at ? new Date(t.starts_at).getTime() >= s : true));
    }
    if (f.endDate) {
      const e = new Date(f.endDate).getTime();
      out = out.filter((t) => (t.ends_at ? new Date(t.ends_at).getTime() <= e : true));
    }
    if (f.duration && f.duration !== "any") {
      out = out.filter((t) => {
        const d = t.duration_days ?? 0;
        if (f.duration === "1-3") return d >= 1 && d <= 3;
        if (f.duration === "4-7") return d >= 4 && d <= 7;
        if (f.duration === "8+") return d >= 8;
        return true;
      });
    }
    if (f.tripType) out = out.filter((t) => (t.trip_type || "").toLowerCase() === f.tripType.toLowerCase());
    if (f.difficulty) out = out.filter((t) => (t.difficulty_level || "").toLowerCase() === f.difficulty.toLowerCase());
    out = out.filter((t) => {
      const p = t.price_per_person ?? 0;
      return p >= f.priceRange[0] && p <= f.priceRange[1];
    });
    return out;
  }, [trips, tripFilters]);

  const filteredDestinations = useMemo(() => {
    // Apply destination filters via underlying trips
    const f = destFilters;
    const eligibleTrips = trips.filter((t) => {
      if (f.tripType && (t.trip_type || "").toLowerCase() !== f.tripType.toLowerCase()) return false;
      if (f.difficulty && (t.difficulty_level || "").toLowerCase() !== f.difficulty.toLowerCase()) return false;
      const p = t.price_per_person ?? 0;
      if (p < f.priceRange[0] || p > f.priceRange[1]) return false;
      return true;
    });
    const map = new Map<string, DestinationAgg>();
    eligibleTrips.forEach((t) => {
      const dest = (t.destination || "").split(",")[0].trim();
      if (!dest) return;
      const key = dest.toLowerCase();
      let entry = map.get(key);
      if (!entry) {
        entry = {
          name: dest.charAt(0).toUpperCase() + dest.slice(1),
          image: t.banner_image_url || "",
          count: 0,
          nextDeparture: undefined,
          topTypes: [],
        };
        map.set(key, entry);
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
    return Array.from(map.values()).map((d) => ({ ...d, topTypes: d.topTypes.slice(0, 3) }));
  }, [trips, destFilters]);

  const filteredStories = useMemo(() => {
    let out = stories;
    const f = storyFilters;
    if (f.location) {
      const l = f.location.toLowerCase();
      out = out.filter((s) => (s.location || "").toLowerCase().includes(l));
    }
    if (f.tag) {
      const t = f.tag.toLowerCase();
      out = out.filter((s) => (s.tags || []).some((x) => x.toLowerCase() === t));
    }
    return out;
  }, [stories, storyFilters]);

  const filteredPeople = useMemo(() => {
    let out = people;
    const f = peopleFilters;
    if (f.location) {
      const l = f.location.toLowerCase();
      out = out.filter((p) => (p.location || "").toLowerCase().includes(l));
    }
    if (f.travelTag) {
      const t = f.travelTag.toLowerCase();
      out = out.filter((p) => (p.travel_tags || []).some((x) => x.toLowerCase() === t));
    }
    if (f.hostsOnly) out = out.filter((p) => p.is_host || (p.hosted_trips_count ?? 0) > 0);
    return out;
  }, [people, peopleFilters]);

  // ── Sorting ────────────────────────────────────────────────────────────
  const sortedTrips = useMemo(() => {
    const arr = [...filteredTrips];
    switch (sort) {
      case "trending":
        arr.sort((a, b) => (b.participants_count ?? 0) - (a.participants_count ?? 0));
        break;
      case "soonest":
        arr.sort((a, b) => {
          const ax = a.starts_at ? new Date(a.starts_at).getTime() : Infinity;
          const bx = b.starts_at ? new Date(b.starts_at).getTime() : Infinity;
          return ax - bx;
        });
        break;
      case "newest":
        arr.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        break;
      // best match → server order
    }
    return arr;
  }, [filteredTrips, sort]);

  const sortedDestinations = useMemo(() => {
    const arr = [...filteredDestinations];
    switch (sort) {
      case "most_trips":
        arr.sort((a, b) => b.count - a.count);
        break;
      case "trending":
        arr.sort((a, b) => b.count - a.count);
        break;
      case "soonest":
        arr.sort((a, b) => {
          const ax = a.nextDeparture ? new Date(a.nextDeparture).getTime() : Infinity;
          const bx = b.nextDeparture ? new Date(b.nextDeparture).getTime() : Infinity;
          return ax - bx;
        });
        break;
    }
    return arr;
  }, [filteredDestinations, sort]);

  const sortedStories = useMemo(() => {
    const arr = [...filteredStories];
    switch (sort) {
      case "most_read":
        arr.sort((a, b) => (b.reads ?? 0) - (a.reads ?? 0));
        break;
      case "newest":
        arr.sort((a, b) => {
          const ax = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bx = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bx - ax;
        });
        break;
    }
    return arr;
  }, [filteredStories, sort]);

  const sortedPeople = useMemo(() => {
    const arr = [...filteredPeople];
    switch (sort) {
      case "most_followed":
        arr.sort((a, b) => (b.followers_count ?? 0) - (a.followers_count ?? 0));
        break;
      case "most_hosted":
        arr.sort((a, b) => (b.hosted_trips_count ?? 0) - (a.hosted_trips_count ?? 0));
        break;
    }
    return arr;
  }, [filteredPeople, sort]);

  // For All view counts we use unfiltered (no intent filters apply on All)
  const counts = {
    all: trips.length + destinations.length + stories.length + people.length,
    trips: sortedTrips.length,
    destinations: sortedDestinations.length,
    stories: sortedStories.length,
    people: sortedPeople.length,
  };

  // ── URL helper ─────────────────────────────────────────────────────────
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
    setSort(defaultSortFor(next, !!submitted));
    // Clear filters that don't belong to the new intent (always reset all per-intent state)
    setTripFilters(DEFAULT_TRIP_FILTERS);
    setDestFilters(DEFAULT_DEST_FILTERS);
    setStoryFilters(DEFAULT_STORY_FILTERS);
    setPeopleFilters(DEFAULT_PEOPLE_FILTERS);
    updateParams({ intent: next === "all" ? null : next });
  };

  const handleDestinationClick = (name: string) => {
    setDestination(name);
    setIntent("trips");
    setSort(defaultSortFor("trips", !!submitted));
    setTripFilters(DEFAULT_TRIP_FILTERS);
    updateParams({ destination: name, intent: "trips" });
  };

  const clearDestination = () => {
    setDestination("");
    updateParams({ destination: null });
  };

  // ── Pagination ─────────────────────────────────────────────────────────
  const paginate = <T,>(items: T[]) => {
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, pages);
    const from = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
    const to = Math.min(total, safePage * PAGE_SIZE);
    return {
      items: items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
      total,
      from,
      to,
      pages,
      safePage,
    };
  };

  // Numbered pagination with 5-page window
  const renderPagination = (pages: number, current: number) => {
    if (pages <= 1) return null;
    const window = 5;
    let start = Math.max(1, current - 2);
    let end = Math.min(pages, start + window - 1);
    start = Math.max(1, end - window + 1);
    const nums: number[] = [];
    for (let i = start; i <= end; i++) nums.push(i);
    const showLeftEllipsis = start > 2;
    const showRightEllipsis = end < pages - 1;

    return (
      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPage((p) => Math.max(1, p - 1));
              }}
            />
          </PaginationItem>
          {start > 1 && (
            <PaginationItem>
              <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setPage(1); }}>1</PaginationLink>
            </PaginationItem>
          )}
          {showLeftEllipsis && (
            <PaginationItem><PaginationEllipsis /></PaginationItem>
          )}
          {nums.map((n) => (
            <PaginationItem key={n}>
              <PaginationLink
                href="#"
                isActive={n === current}
                onClick={(e) => { e.preventDefault(); setPage(n); }}
              >
                {n}
              </PaginationLink>
            </PaginationItem>
          ))}
          {showRightEllipsis && (
            <PaginationItem><PaginationEllipsis /></PaginationItem>
          )}
          {end < pages && (
            <PaginationItem>
              <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setPage(pages); }}>
                {pages}
              </PaginationLink>
            </PaginationItem>
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPage((p) => Math.min(pages, p + 1));
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  // ── Row renderers ──────────────────────────────────────────────────────
  const TripRow = ({ t }: { t: TripData }) => {
    const dateRange = (() => {
      if (!t.starts_at) return null;
      const s = new Date(t.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const e = t.ends_at
        ? new Date(t.ends_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : null;
      return e ? `${s} – ${e}` : s;
    })();
    const status = t.spots_left != null
      ? t.spots_left <= 0
        ? "Full"
        : `${t.spots_left} seat${t.spots_left === 1 ? "" : "s"} left`
      : null;
    return (
      <Link to={`/trips/${t.id}`} className="block">
        <Card className="flex overflow-hidden transition-shadow hover:shadow-md">
          <img
            src={t.banner_image_url || DEFAULT_HERO}
            alt={t.title}
            className="h-32 w-44 shrink-0 object-cover sm:h-36 sm:w-56"
          />
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 p-4">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                {t.trip_type && <Badge className="bg-primary/90">{t.trip_type}</Badge>}
                {t.difficulty_level && <Badge variant="outline">{t.difficulty_level}</Badge>}
                <h3 className="truncate text-base font-semibold text-foreground">{t.title}</h3>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {t.destination && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{t.destination}</span>
                )}
                {dateRange && (
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{dateRange}</span>
                )}
                {(t.host_display_name || t.host_username) && (
                  <span className="truncate">by {t.host_display_name || t.host_username}</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              {status && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />{status}
                </span>
              )}
              {t.trip_vibe?.slice(0, 2).map((v) => (
                <Badge key={v} variant="secondary" className="text-[10px]">{v}</Badge>
              ))}
              {t.price_per_person != null && (
                <span className="ml-auto flex items-center gap-1 text-sm font-semibold text-foreground">
                  <IndianRupee className="h-3.5 w-3.5" />{t.price_per_person.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </Card>
      </Link>
    );
  };

  const DestinationRow = ({ d }: { d: DestinationAgg }) => (
    <button onClick={() => handleDestinationClick(d.name)} className="block w-full text-left">
      <Card className="flex overflow-hidden transition-shadow hover:shadow-md">
        {d.image ? (
          <img src={d.image} alt={d.name} className="h-32 w-44 shrink-0 object-cover sm:h-36 sm:w-56" />
        ) : (
          <div className="flex h-32 w-44 shrink-0 items-center justify-center bg-muted sm:h-36 sm:w-56">
            <Compass className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="truncate text-base font-semibold text-foreground">{d.name}</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {d.count} trip{d.count !== 1 ? "s" : ""}
              {d.nextDeparture && (
                <> · Next: {new Date(d.nextDeparture).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>
              )}
            </p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {d.topTypes.map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
            ))}
            <Badge variant="outline" className="ml-auto">View trips</Badge>
          </div>
        </div>
      </Card>
    </button>
  );

  const StoryRow = ({ s }: { s: BlogData }) => (
    <Link to={`/stories/${s.slug}`} className="block">
      <Card className="flex overflow-hidden transition-shadow hover:shadow-md">
        {s.cover_image_url ? (
          <img src={s.cover_image_url} alt={s.title} className="h-32 w-44 shrink-0 object-cover sm:h-36 sm:w-56" />
        ) : (
          <div className="flex h-32 w-44 shrink-0 items-center justify-center bg-muted sm:h-36 sm:w-56">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-base font-semibold text-foreground">{s.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {s.short_description || s.excerpt}
            </p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {(s.author_display_name || s.author_username) && (
              <span>by {s.author_display_name || s.author_username}</span>
            )}
            {s.created_at && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
            {s.reads != null && <span>{s.reads.toLocaleString()} reads</span>}
          </div>
        </div>
      </Card>
    </Link>
  );

  const PersonRow = ({ u }: { u: PersonData }) => (
    <Link to={`/users/${u.username}`} className="block">
      <Card className="flex items-center gap-4 p-4 transition-shadow hover:shadow-md">
        <Avatar className="h-14 w-14">
          {u.avatar_url && <img src={u.avatar_url} alt={u.display_name || u.username} />}
          <AvatarFallback>{(u.display_name || u.username || "?")[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-foreground">{u.display_name || u.username}</span>
            {(u.is_host || (u.hosted_trips_count ?? 0) > 0) && (
              <Badge className="bg-primary/90 text-[10px]">Host</Badge>
            )}
          </div>
          <div className="truncate text-xs text-muted-foreground">@{u.username}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {u.location && (
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{u.location}</span>
            )}
            {u.followers_count != null && <span>{u.followers_count.toLocaleString()} followers</span>}
            {u.hosted_trips_count != null && <span>{u.hosted_trips_count} hosted</span>}
          </div>
          {u.travel_tags && u.travel_tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {u.travel_tags.slice(0, 4).map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
              ))}
            </div>
          )}
        </div>
        <Badge variant="outline">View profile</Badge>
      </Card>
    </Link>
  );

  // ── Mixed All feed: 5 trips, 3 destinations, 2 stories, 2 people = 12 ──
  const mixedItems = useMemo(() => {
    type Mixed =
      | { kind: "trip"; item: TripData }
      | { kind: "destination"; item: DestinationAgg }
      | { kind: "story"; item: BlogData }
      | { kind: "person"; item: PersonData };

    const pools: Record<Exclude<Intent, "all">, Mixed[]> = {
      trips: trips.map((t) => ({ kind: "trip", item: t })),
      destinations: destinations.map((d) => ({ kind: "destination", item: d })),
      stories: stories.map((s) => ({ kind: "story", item: s })),
      people: people.map((p) => ({ kind: "person", item: p })),
    };

    const order: Array<keyof typeof MIXED_QUOTA> = ["trips", "destinations", "stories", "people"];
    const taken: Record<keyof typeof MIXED_QUOTA, number> = {
      trips: 0, destinations: 0, stories: 0, people: 0,
    };
    const out: Mixed[] = [];

    // First pass: take up to quota for each
    for (const k of order) {
      const want = MIXED_QUOTA[k];
      const got = pools[k].slice(0, want);
      taken[k] = got.length;
      out.push(...got);
    }

    // Spillover: fill remaining slots from strongest non-empty pools
    let remaining = PAGE_SIZE - out.length;
    while (remaining > 0) {
      // Find pool with the most leftover availability
      const sorted = order
        .map((k) => ({ k, left: pools[k].length - taken[k] }))
        .filter((x) => x.left > 0)
        .sort((a, b) => b.left - a.left);
      if (sorted.length === 0) break;
      const pick = sorted[0].k;
      out.push(pools[pick][taken[pick]]);
      taken[pick]++;
      remaining--;
    }
    return out;
  }, [trips, destinations, stories, people]);

  // ── Filter rail content (per intent) ───────────────────────────────────
  const TripsFilters = () => (
    <div className="space-y-5">
      <div>
        <Label>Origin</Label>
        <Input
          value={tripFilters.origin}
          onChange={(e) => setTripFilters({ ...tripFilters, origin: e.target.value })}
          placeholder="City you depart from"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Start date</Label>
          <Input
            type="date"
            value={tripFilters.startDate}
            onChange={(e) => setTripFilters({ ...tripFilters, startDate: e.target.value })}
          />
        </div>
        <div>
          <Label>End date</Label>
          <Input
            type="date"
            value={tripFilters.endDate}
            onChange={(e) => setTripFilters({ ...tripFilters, endDate: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label>Duration</Label>
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={tripFilters.duration}
          onChange={(e) => setTripFilters({ ...tripFilters, duration: e.target.value })}
        >
          <option value="any">Any length</option>
          <option value="1-3">1–3 days</option>
          <option value="4-7">4–7 days</option>
          <option value="8+">8+ days</option>
        </select>
      </div>
      <div>
        <Label>Trip type</Label>
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={tripFilters.tripType}
          onChange={(e) => setTripFilters({ ...tripFilters, tripType: e.target.value })}
        >
          <option value="">Any</option>
          <option value="adventure">Adventure</option>
          <option value="relaxation">Relaxation</option>
          <option value="cultural">Cultural</option>
          <option value="trekking">Trekking</option>
          <option value="beach">Beach</option>
          <option value="road trip">Road trip</option>
        </select>
      </div>
      <div>
        <Label>
          Price range{" "}
          <span className="font-normal text-muted-foreground">
            ₹{tripFilters.priceRange[0].toLocaleString()} – ₹{tripFilters.priceRange[1].toLocaleString()}
          </span>
        </Label>
        <Slider
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={1000}
          value={tripFilters.priceRange}
          onValueChange={(v) => setTripFilters({ ...tripFilters, priceRange: [v[0], v[1]] as [number, number] })}
          className="mt-3"
        />
      </div>
      <div>
        <Label>Difficulty</Label>
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={tripFilters.difficulty}
          onChange={(e) => setTripFilters({ ...tripFilters, difficulty: e.target.value })}
        >
          <option value="">Any</option>
          <option value="easy">Easy</option>
          <option value="moderate">Moderate</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <Button variant="ghost" size="sm" onClick={() => setTripFilters(DEFAULT_TRIP_FILTERS)}>
        Reset filters
      </Button>
    </div>
  );

  const DestinationsFilters = () => (
    <div className="space-y-5">
      <div>
        <Label>Trip type</Label>
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={destFilters.tripType}
          onChange={(e) => setDestFilters({ ...destFilters, tripType: e.target.value })}
        >
          <option value="">Any</option>
          <option value="adventure">Adventure</option>
          <option value="relaxation">Relaxation</option>
          <option value="cultural">Cultural</option>
          <option value="trekking">Trekking</option>
          <option value="beach">Beach</option>
        </select>
      </div>
      <div>
        <Label>
          Price range{" "}
          <span className="font-normal text-muted-foreground">
            ₹{destFilters.priceRange[0].toLocaleString()} – ₹{destFilters.priceRange[1].toLocaleString()}
          </span>
        </Label>
        <Slider
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={1000}
          value={destFilters.priceRange}
          onValueChange={(v) => setDestFilters({ ...destFilters, priceRange: [v[0], v[1]] as [number, number] })}
          className="mt-3"
        />
      </div>
      <div>
        <Label>Difficulty</Label>
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={destFilters.difficulty}
          onChange={(e) => setDestFilters({ ...destFilters, difficulty: e.target.value })}
        >
          <option value="">Any</option>
          <option value="easy">Easy</option>
          <option value="moderate">Moderate</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <Button variant="ghost" size="sm" onClick={() => setDestFilters(DEFAULT_DEST_FILTERS)}>
        Reset filters
      </Button>
    </div>
  );

  const StoriesFilters = () => (
    <div className="space-y-5">
      <div>
        <Label>Location</Label>
        <Input
          value={storyFilters.location}
          onChange={(e) => setStoryFilters({ ...storyFilters, location: e.target.value })}
          placeholder="Anywhere"
        />
      </div>
      <div>
        <Label>Tag</Label>
        <Input
          value={storyFilters.tag}
          onChange={(e) => setStoryFilters({ ...storyFilters, tag: e.target.value })}
          placeholder="e.g. trekking"
        />
      </div>
      <Button variant="ghost" size="sm" onClick={() => setStoryFilters(DEFAULT_STORY_FILTERS)}>
        Reset filters
      </Button>
    </div>
  );

  const PeopleFilters = () => (
    <div className="space-y-5">
      <div>
        <Label>Location</Label>
        <Input
          value={peopleFilters.location}
          onChange={(e) => setPeopleFilters({ ...peopleFilters, location: e.target.value })}
          placeholder="Anywhere"
        />
      </div>
      <div>
        <Label>Travel tag</Label>
        <Input
          value={peopleFilters.travelTag}
          onChange={(e) => setPeopleFilters({ ...peopleFilters, travelTag: e.target.value })}
          placeholder="e.g. solo"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={peopleFilters.hostsOnly}
          onCheckedChange={(v) => setPeopleFilters({ ...peopleFilters, hostsOnly: !!v })}
        />
        Hosts only
      </label>
      <Button variant="ghost" size="sm" onClick={() => setPeopleFilters(DEFAULT_PEOPLE_FILTERS)}>
        Reset filters
      </Button>
    </div>
  );

  const FiltersForIntent = () => {
    if (intent === "trips") return <TripsFilters />;
    if (intent === "destinations") return <DestinationsFilters />;
    if (intent === "stories") return <StoriesFilters />;
    if (intent === "people") return <PeopleFilters />;
    return null;
  };

  const SortControl = () => (
    <div>
      <Label>Sort by</Label>
      <select
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        disabled={intent === "all"}
      >
        {SORTS[intent].map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </div>
  );

  // ── Active dataset for current intent ──────────────────────────────────
  const intentChips: { v: Intent; l: string; n: number }[] = [
    { v: "all", l: "All", n: counts.all },
    { v: "trips", l: "Trips", n: counts.trips },
    { v: "destinations", l: "Destinations", n: counts.destinations },
    { v: "stories", l: "Stories", n: counts.stories },
    { v: "people", l: "People", n: counts.people },
  ];

  const showSidebar = intent !== "all";

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
                aria-label={`Clear destination ${destination}`}
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
        <div className="mb-2 flex flex-wrap gap-2">
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

        {/* Destination cue under chips for clarity on Trips */}
        {destination && intent === "trips" && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Showing trips in</span>
            <button
              onClick={clearDestination}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
            >
              <MapPin className="h-3 w-3" />
              {destination}
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Mobile filter trigger (only for non-All) */}
        {showSidebar && (
          <div className="mb-4 lg:hidden">
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters & sort
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-5">
                  <SortControl />
                  <FiltersForIntent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && (
          <div className={cn("grid gap-6 mt-4", showSidebar ? "lg:grid-cols-[240px_1fr]" : "grid-cols-1")}>
            {/* Desktop filter rail — only when a specific intent is chosen */}
            {showSidebar && (
              <aside className="hidden space-y-5 lg:block">
                <SortControl />
                <FiltersForIntent />
              </aside>
            )}

            {/* Results column */}
            <section>
              {intent === "all" ? (
                <>
                  {mixedItems.length === 0 ? (
                    <p className="py-12 text-center text-muted-foreground">
                      No results found{submitted ? ` for "${submitted}"` : ""}.
                    </p>
                  ) : (
                    <>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground">{mixedItems.length}</span> mixed result
                          {mixedItems.length !== 1 ? "s" : ""}
                          {submitted && <> for "<span className="text-foreground">{submitted}</span>"</>}
                        </div>
                        <div>Recommended for you</div>
                      </div>
                      <div className="space-y-3">
                        {mixedItems.map((m, i) => {
                          if (m.kind === "trip") return <TripRow key={`t-${m.item.id}-${i}`} t={m.item} />;
                          if (m.kind === "destination") return <DestinationRow key={`d-${m.item.name}-${i}`} d={m.item} />;
                          if (m.kind === "story") return <StoryRow key={`s-${m.item.slug}-${i}`} s={m.item} />;
                          return <PersonRow key={`p-${m.item.username}-${i}`} u={m.item} />;
                        })}
                      </div>
                    </>
                  )}
                </>
              ) : (
                (() => {
                  const list = (() => {
                    if (intent === "trips") return paginate(sortedTrips);
                    if (intent === "destinations") return paginate(sortedDestinations);
                    if (intent === "stories") return paginate(sortedStories);
                    return paginate(sortedPeople);
                  })();
                  if (list.total === 0) {
                    return (
                      <p className="py-12 text-center text-muted-foreground">
                        No {intent} found{submitted ? ` for "${submitted}"` : ""}.
                      </p>
                    );
                  }
                  return (
                    <>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground">{list.total}</span> result
                          {list.total !== 1 ? "s" : ""}
                          {submitted && <> for "<span className="text-foreground">{submitted}</span>"</>}
                        </div>
                        <div>
                          Showing {list.from}–{list.to} of {list.total}
                        </div>
                      </div>
                      <div className="space-y-3">
                        {list.items.map((item: any) => {
                          if (intent === "trips") return <TripRow key={item.id} t={item} />;
                          if (intent === "destinations") return <DestinationRow key={item.name} d={item} />;
                          if (intent === "stories") return <StoryRow key={item.slug} s={item} />;
                          return <PersonRow key={item.username} u={item} />;
                        })}
                      </div>
                      {renderPagination(list.pages, list.safePage)}
                    </>
                  );
                })()
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

// Small label helper
const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
    {children}
  </div>
);

export default SearchPage;
