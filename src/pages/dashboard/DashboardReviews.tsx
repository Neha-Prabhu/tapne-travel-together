import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  id: number;
  reviewer_name?: string;
  reviewer_avatar?: string;
  reviewee_name?: string;
  rating: number;
  text: string;
  trip_title?: string;
  trip_id?: number;
  created_at: string;
}

interface PerTripRow {
  trip_id?: number;
  trip_title: string;
  average_rating: number;
  reviews_count: number;
}

interface DashboardReviewsResponse {
  received?: Review[];
  written?: Review[];
  distribution?: Record<string, number>;        // 5..1 → count
  per_trip?: PerTripRow[];
  average_rating?: number;
}

const Stars = ({ n, size = "h-3.5 w-3.5" }: { n: number; size?: string }) => (
  <div className="flex items-center gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star key={i} className={`${size} ${i < n ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
    ))}
  </div>
);

const ReviewCard = ({ r, who }: { r: Review; who: "from" | "to" }) => (
  <Card>
    <CardContent className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <Avatar className="h-8 w-8">
          {r.reviewer_avatar && who === "to" && <AvatarImage src={r.reviewer_avatar} alt="" />}
          <AvatarFallback>{((who === "from" ? r.reviewee_name : r.reviewer_name) || "?")[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">
            {who === "from" ? `For ${r.reviewee_name}` : `From ${r.reviewer_name}`}
          </div>
          {r.trip_title && <div className="text-xs text-muted-foreground">{r.trip_title}</div>}
        </div>
        <Stars n={r.rating} />
      </div>
      <p className="text-sm text-foreground">{r.text}</p>
      <p className="mt-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
    </CardContent>
  </Card>
);

const Distribution = ({
  reviews,
  serverDist,
  serverAvg,
}: {
  reviews: Review[];
  serverDist?: Record<string, number>;
  serverAvg?: number;
}) => {
  // Build buckets from server if present, else compute from reviews.
  const computed = useMemo(() => {
    const counts: Record<string, number> = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
    reviews.forEach(r => {
      const k = String(r.rating);
      if (k in counts) counts[k] += 1;
    });
    return counts;
  }, [reviews]);

  const buckets = serverDist && Object.values(serverDist).some(v => v > 0) ? serverDist : computed;
  const total = Object.values(buckets).reduce((s, n) => s + n, 0);
  const avg = total > 0
    ? (serverAvg ?? (Object.entries(buckets).reduce((s, [k, n]) => s + Number(k) * n, 0) / total))
    : 0;

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <div className="text-3xl font-bold text-foreground">{avg ? avg.toFixed(2) : "—"}</div>
          <Stars n={Math.round(avg)} size="h-4 w-4" />
          <div className="mt-1 text-xs text-muted-foreground">{total} review{total === 1 ? "" : "s"}</div>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map(n => {
            const count = buckets[String(n)] || 0;
            const pct = total ? (count / total) * 100 : 0;
            return (
              <div key={n} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-right text-muted-foreground">{n}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <Progress value={pct} className="h-2 flex-1" />
                <span className="w-10 text-right text-muted-foreground">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const PerTripBreakdown = ({
  reviews,
  serverRows,
}: {
  reviews: Review[];
  serverRows?: PerTripRow[];
}) => {
  const groups = useMemo<PerTripRow[]>(() => {
    if (serverRows && serverRows.length > 0) return serverRows;
    const map = new Map<string, { title: string; ratings: number[] }>();
    reviews.forEach(r => {
      const key = r.trip_title || `Trip ${r.trip_id || "?"}`;
      if (!map.has(key)) map.set(key, { title: key, ratings: [] });
      map.get(key)!.ratings.push(r.rating);
    });
    return Array.from(map.values()).map(g => ({
      trip_title: g.title,
      reviews_count: g.ratings.length,
      average_rating: g.ratings.reduce((s, x) => s + x, 0) / g.ratings.length,
    })).sort((a, b) => b.reviews_count - a.reviews_count);
  }, [reviews, serverRows]);

  if (groups.length === 0) return null;

  return (
    <div className="rounded-2xl border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Per-trip rating</h3>
      <div className="space-y-2">
        {groups.map(g => (
          <div key={g.trip_title} className="flex items-center gap-3 text-sm">
            <span className="min-w-0 flex-1 truncate text-foreground">{g.trip_title}</span>
            <Stars n={Math.round(g.average_rating)} />
            <span className="w-10 text-right text-xs text-muted-foreground">{g.average_rating.toFixed(1)}</span>
            <span className="w-12 text-right text-xs text-muted-foreground">({g.reviews_count})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const FilterChips = ({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) => (
  <div className="flex flex-wrap gap-2">
    <Button size="sm" variant={value === null ? "default" : "outline"} onClick={() => onChange(null)}>All</Button>
    {[5, 4, 3, 2, 1].map(n => (
      <Button
        key={n}
        size="sm"
        variant={value === n ? "default" : "outline"}
        onClick={() => onChange(n)}
        className={cn("gap-1")}
      >
        {n}<Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      </Button>
    ))}
  </div>
);

const ReceivedPanel = ({
  received,
  serverDist,
  serverAvg,
  serverPerTrip,
}: {
  received: Review[];
  serverDist?: Record<string, number>;
  serverAvg?: number;
  serverPerTrip?: PerTripRow[];
}) => {
  const [filter, setFilter] = useState<number | null>(null);
  const filtered = filter ? received.filter(r => r.rating === filter) : received;
  const hasAnyData = received.length > 0 ||
    (serverDist && Object.values(serverDist).some(v => v > 0)) ||
    (serverPerTrip && serverPerTrip.length > 0);

  return (
    <div className="space-y-4">
      {hasAnyData && <Distribution reviews={received} serverDist={serverDist} serverAvg={serverAvg} />}
      <PerTripBreakdown reviews={received} serverRows={serverPerTrip} />
      {received.length > 0 && <FilterChips value={filter} onChange={setFilter} />}
      {received.length === 0 ? (
        <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          No reviews yet.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          No reviews match this filter.
        </div>
      ) : (
        <div className="space-y-3">{filtered.map(r => <ReviewCard key={r.id} r={r} who="to" />)}</div>
      )}
    </div>
  );
};

const DashboardReviews = () => {
  const { isAuthenticated } = useAuth();
  const [written, setWritten] = useState<Review[]>([]);
  const [received, setReceived] = useState<Review[]>([]);
  const [distribution, setDistribution] = useState<Record<string, number> | undefined>();
  const [averageRating, setAverageRating] = useState<number | undefined>();
  const [perTrip, setPerTrip] = useState<PerTripRow[] | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    // Only call a dashboard-reviews endpoint when explicitly available in the page config.
    const dashboardReviewsUrl = cfg.api.dashboard_reviews;

    const fallback = () => {
      if (!cfg?.api?.trip_reviews) return Promise.resolve();
      return Promise.allSettled([
        apiGet<{ reviews: Review[] }>(`${cfg.api.trip_reviews}?author=me`).then(d => setWritten(d.reviews || [])),
        apiGet<{ reviews: Review[] }>(`${cfg.api.trip_reviews}?recipient=me`).then(d => setReceived(d.reviews || [])),
      ]).then(() => undefined);
    };

    const work = dashboardReviewsUrl
      ? apiGet<DashboardReviewsResponse>(dashboardReviewsUrl)
          .then(d => {
            if (!d || (!d.received && !d.written && !d.distribution)) return false;
            setReceived(d.received || []);
            setWritten(d.written || []);
            setDistribution(d.distribution);
            setAverageRating(d.average_rating);
            setPerTrip(d.per_trip);
            return true;
          })
          .catch(() => false)
          .then(handled => (handled ? undefined : fallback()))
      : fallback();

    work.finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-foreground">Reviews</h2>
      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">Received ({received.length})</TabsTrigger>
          <TabsTrigger value="written">Written ({written.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="received" className="mt-6">
          <ReceivedPanel
            received={received}
            serverDist={distribution}
            serverAvg={averageRating}
            serverPerTrip={perTrip}
          />
        </TabsContent>
        <TabsContent value="written" className="mt-6">
          {written.length === 0
            ? <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">You haven't written any reviews.</div>
            : <div className="space-y-3">{written.map(r => <ReviewCard key={r.id} r={r} who="from" />)}</div>}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardReviews;
