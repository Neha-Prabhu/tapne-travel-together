import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { TripData, MyTripsResponse } from "@/types/api";
import { Plus, MapPin, Calendar, Users, Star, Bookmark, Inbox, Info, BarChart3 } from "lucide-react";

type Lifecycle = "draft" | "upcoming" | "in_progress" | "completed";

// Server-side dashboard fields that may augment TripData.
type DashboardTrip = TripData & {
  lifecycle?: Lifecycle;
  filled_seats?: number;
  pending_count?: number;
  estimated_value?: number | string;
  bookmarks_count?: number;
};

interface DashboardTripsResponse {
  trips: DashboardTrip[];
  portfolio?: {
    total_trips?: number;
    filled_seats?: number;
    estimated_value?: number | string;
    pending?: number;
    average_rating?: number;
  };
}

const computeLifecycle = (t: DashboardTrip): Lifecycle => {
  if (t.lifecycle) return t.lifecycle;
  if (t.status === "draft" || t.is_draft) return "draft";
  const now = Date.now();
  const starts = t.starts_at ? new Date(t.starts_at).getTime() : null;
  const ends = t.ends_at ? new Date(t.ends_at).getTime() : null;
  // Trust dates over a stale "completed" status: a trip still inside its date window is in progress.
  if (ends && ends < now) return "completed";
  if (starts && starts <= now && (!ends || ends >= now)) return "in_progress";
  if (t.status === "completed") return "completed";
  return "upcoming";
};

const statusPill = (label: string, tone: "muted" | "primary" | "warn" | "ok" | "danger" = "muted") => {
  const map = {
    muted: "bg-muted text-muted-foreground",
    primary: "bg-primary/15 text-primary",
    warn: "bg-yellow-100 text-yellow-800",
    ok: "bg-green-100 text-green-800",
    danger: "bg-red-100 text-red-800",
  } as const;
  return <Badge variant="outline" className={map[tone]}>{label}</Badge>;
};

const fmtCurrency = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `$${n.toFixed(0)}`;

const filledFor = (t: DashboardTrip) => t.filled_seats ?? t.participants_count ?? 0;
const pendingFor = (t: DashboardTrip) => t.pending_count ?? t.applications_count ?? 0;
const valueFor = (t: DashboardTrip) => {
  if (typeof t.estimated_value === "number") return t.estimated_value;
  const filled = filledFor(t);
  const price = t.price_per_person ?? 0;
  return filled * price;
};

const EstBadge = ({ value }: { value: number }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="inline-flex items-center gap-1 rounded-md bg-accent px-1.5 py-0.5 text-xs font-medium text-accent-foreground">
        <BarChart3 className="h-3 w-3" />
        est. {fmtCurrency(value)}
      </span>
    </TooltipTrigger>
    <TooltipContent>
      Estimated value = filled seats × price per person. Indicative only.
    </TooltipContent>
  </Tooltip>
);

const JoinedRow = ({ trip }: { trip: DashboardTrip }) => (
  <Card>
    <CardContent className="flex items-center gap-4 p-4">
      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
        {trip.banner_image_url && <img src={trip.banner_image_url} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/trips/${trip.id}`} className="truncate font-medium text-foreground hover:text-primary">{trip.title || "Untitled"}</Link>
          {trip.join_request_status === "pending" && statusPill("Pending", "warn")}
          {trip.join_request_status === "approved" && statusPill("Approved", "ok")}
          {trip.join_request_status === "denied" && statusPill("Denied", "danger")}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {trip.destination && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{trip.destination}</span>}
          {trip.starts_at && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(trip.starts_at).toLocaleDateString()}</span>}
        </div>
      </div>
    </CardContent>
  </Card>
);

const ManagedRow = ({ trip }: { trip: DashboardTrip }) => {
  const lc = computeLifecycle(trip);
  const filled = filledFor(trip);
  const seats = trip.total_seats ?? 0;
  const pending = pendingFor(trip);
  const reviews = trip.reviews_count ?? 0;
  const rating = trip.average_rating ?? 0;
  const est = valueFor(trip);
  const bookmarks = trip.bookmarks_count;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
            {trip.banner_image_url && <img src={trip.banner_image_url} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link to={`/trips/${trip.id}`} className="truncate font-medium text-foreground hover:text-primary">{trip.title || "Untitled"}</Link>
              {lc === "draft" && statusPill("Draft")}
              {lc === "upcoming" && statusPill("Upcoming", "primary")}
              {lc === "in_progress" && statusPill("In progress", "ok")}
              {lc === "completed" && statusPill("Completed")}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {trip.destination && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{trip.destination}</span>}
              {trip.starts_at && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(trip.starts_at).toLocaleDateString()}</span>}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-foreground">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-muted-foreground" />{filled}/{seats || "?"} seats</span>
              <span className="flex items-center gap-1"><Inbox className="h-3.5 w-3.5 text-muted-foreground" />{pending} pending</span>
              <EstBadge value={est} />
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-yellow-500" />
                {rating > 0 ? rating.toFixed(1) : "—"}
                <span className="text-muted-foreground">({reviews})</span>
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Bookmark className="h-3.5 w-3.5" />{bookmarks ?? "—"}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={lc === "draft" ? `/trips/${trip.id}/edit` : `/trips/${trip.id}`}>
                {lc === "draft" ? "Edit" : "Manage"}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SkeletonList = () => (
  <div className="space-y-2">
    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
  </div>
);

const Section = ({
  title, items, render, emptyMsg,
}: {
  title: string;
  items: DashboardTrip[];
  render: (t: DashboardTrip) => JSX.Element;
  emptyMsg: string;
}) => (
  <div>
    <h3 className="mb-2 text-sm font-medium text-muted-foreground">{title} ({items.length})</h3>
    {items.length === 0 ? (
      <div className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">{emptyMsg}</div>
    ) : (
      <div className="space-y-2">{items.map(render)}</div>
    )}
  </div>
);

const PortfolioRollup = ({
  managed,
  serverTotals,
}: {
  managed: DashboardTrip[];
  serverTotals?: DashboardTripsResponse["portfolio"];
}) => {
  const totals = useMemo(() => {
    const total = serverTotals?.total_trips ?? managed.length;
    const seats = serverTotals?.filled_seats ?? managed.reduce((s, t) => s + filledFor(t), 0);
    const value = serverTotals?.estimated_value ?? managed.reduce((s, t) => s + valueFor(t), 0);
    const pending = serverTotals?.pending ?? managed.reduce((s, t) => s + pendingFor(t), 0);
    const rated = managed.filter(t => (t.average_rating ?? 0) > 0);
    const avgRating = serverTotals?.average_rating ?? (rated.length
      ? rated.reduce((s, t) => s + (t.average_rating ?? 0), 0) / rated.length
      : 0);
    return { total, seats, value, pending, avgRating };
  }, [managed, serverTotals]);

  const items = [
    { label: "Trips", value: totals.total },
    { label: "Filled seats", value: totals.seats },
    { label: "Est. value", value: fmtCurrency(totals.value), hint: "Lifetime filled × price per person" },
    { label: "Avg rating", value: totals.avgRating > 0 ? totals.avgRating.toFixed(2) : "—" },
    { label: "Pending", value: totals.pending },
  ];

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Hosting at a glance</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {items.map(it => (
          <div key={it.label} className="rounded-lg bg-muted/40 p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {it.label}
              {it.hint && (
                <Tooltip>
                  <TooltipTrigger asChild><Info className="h-3 w-3" /></TooltipTrigger>
                  <TooltipContent>{it.hint}</TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="mt-1 text-lg font-semibold text-foreground">{it.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardTrips = () => {
  const { isAuthenticated } = useAuth();
  const [trips, setTrips] = useState<DashboardTrip[]>([]);
  const [portfolio, setPortfolio] = useState<DashboardTripsResponse["portfolio"]>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    const base = cfg.api.base;
    // Prefer the dashboard-specific endpoint; fall back to my_trips.
    apiGet<DashboardTripsResponse>(`${base}/dashboard/trips/`)
      .then(d => {
        if (d && Array.isArray(d.trips) && d.trips.length > 0) {
          setTrips(d.trips);
          setPortfolio(d.portfolio);
          return true;
        }
        return false;
      })
      .catch(() => false)
      .then((handled) => {
        if (handled) return;
        return apiGet<MyTripsResponse>(cfg.api.my_trips)
          .then(d => setTrips((d.trips || []) as DashboardTrip[]))
          .catch(() => {});
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const joined = trips.filter(t => !t.can_manage);
  const managed = trips.filter(t => t.can_manage);
  const hasJoined = joined.length > 0;
  const hasManaged = managed.length > 0;

  const joinedSections = useMemo(() => {
    const lc = (t: DashboardTrip) => computeLifecycle(t);
    const pending = joined.filter(t => t.join_request_status === "pending");
    const completed = joined.filter(t => lc(t) === "completed");
    const inProgress = joined.filter(t => t.join_request_status === "approved" && lc(t) === "in_progress");
    const upcoming = joined.filter(t => t.join_request_status === "approved" && lc(t) === "upcoming");
    const approved = joined.filter(t =>
      t.join_request_status === "approved" &&
      lc(t) !== "upcoming" && lc(t) !== "in_progress" && lc(t) !== "completed"
    );
    return { pending, approved, upcoming, inProgress, completed };
  }, [joined]);

  const managedSections = useMemo(() => {
    const drafts = managed.filter(t => computeLifecycle(t) === "draft");
    const upcoming = managed.filter(t => computeLifecycle(t) === "upcoming");
    const inProgress = managed.filter(t => computeLifecycle(t) === "in_progress");
    const completed = managed.filter(t => computeLifecycle(t) === "completed");
    return { drafts, upcoming, inProgress, completed };
  }, [managed]);

  const renderJoined = () => (
    <div className="mt-6 space-y-6">
      <Section title="Pending" items={joinedSections.pending} render={t => <JoinedRow key={t.id} trip={t} />} emptyMsg="No pending requests." />
      {joinedSections.approved.length > 0 && (
        <Section title="Approved" items={joinedSections.approved} render={t => <JoinedRow key={t.id} trip={t} />} emptyMsg="" />
      )}
      <Section title="Upcoming" items={joinedSections.upcoming} render={t => <JoinedRow key={t.id} trip={t} />} emptyMsg="Nothing upcoming." />
      <Section title="In progress" items={joinedSections.inProgress} render={t => <JoinedRow key={t.id} trip={t} />} emptyMsg="No trips currently in progress." />
      <Section title="Completed" items={joinedSections.completed} render={t => <JoinedRow key={t.id} trip={t} />} emptyMsg="No completed trips yet." />
    </div>
  );

  const renderManaged = () => (
    <div className="mt-6 space-y-6">
      {hasManaged && <PortfolioRollup managed={managed} serverTotals={portfolio} />}
      <Section title="Drafts" items={managedSections.drafts} render={t => <ManagedRow key={t.id} trip={t} />} emptyMsg="No drafts." />
      <Section title="Upcoming" items={managedSections.upcoming} render={t => <ManagedRow key={t.id} trip={t} />} emptyMsg="No upcoming trips." />
      <Section title="In progress" items={managedSections.inProgress} render={t => <ManagedRow key={t.id} trip={t} />} emptyMsg="No trips currently running." />
      <Section title="Completed" items={managedSections.completed} render={t => <ManagedRow key={t.id} trip={t} />} emptyMsg="No completed trips yet." />
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-foreground">Your trips</h2>
        <Button asChild size="sm">
          <Link to="/trips/new"><Plus className="mr-1 h-4 w-4" />New trip</Link>
        </Button>
      </div>

      {loading ? (
        <SkeletonList />
      ) : !hasJoined && !hasManaged ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">You haven't joined or created any trips yet.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button asChild size="sm"><Link to="/trips/new">Create a trip</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/search">Browse trips</Link></Button>
          </div>
        </div>
      ) : hasJoined && hasManaged ? (
        <Tabs defaultValue="joined">
          <TabsList>
            <TabsTrigger value="joined">Joined ({joined.length})</TabsTrigger>
            <TabsTrigger value="managed">Managed ({managed.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="joined">{renderJoined()}</TabsContent>
          <TabsContent value="managed">{renderManaged()}</TabsContent>
        </Tabs>
      ) : hasJoined ? (
        renderJoined()
      ) : (
        renderManaged()
      )}
    </div>
  );
};

export default DashboardTrips;
