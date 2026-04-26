import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { TripData, MyTripsResponse } from "@/types/api";
import { Loader2, Plus, MapPin, Calendar, Users } from "lucide-react";

const statusBadge = (s?: string) => {
  if (!s) return null;
  const map: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    published: "bg-primary/15 text-primary",
    completed: "bg-secondary text-secondary-foreground",
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  return <Badge variant="outline" className={map[s] || ""}>{s}</Badge>;
};

const TripRow = ({ trip, manage }: { trip: TripData; manage?: boolean }) => (
  <Card>
    <CardContent className="flex items-center gap-4 p-4">
      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
        {trip.banner_image_url && <img src={trip.banner_image_url} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/trips/${trip.id}`} className="truncate font-medium text-foreground hover:text-primary">{trip.title || "Untitled"}</Link>
          {statusBadge(trip.status)}
          {trip.join_request_status && statusBadge(trip.join_request_status)}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {trip.destination && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{trip.destination}</span>}
          {trip.starts_at && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(trip.starts_at).toLocaleDateString()}</span>}
          {trip.participants_count !== undefined && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{trip.participants_count}/{trip.total_seats || "?"}</span>}
        </div>
      </div>
      {manage && (
        <Button variant="outline" size="sm" asChild>
          <Link to={trip.status === "draft" ? `/trips/${trip.id}/edit` : `/trips/${trip.id}`}>
            {trip.status === "draft" ? "Edit" : "Manage"}
          </Link>
        </Button>
      )}
    </CardContent>
  </Card>
);

const DashboardTrips = () => {
  const { isAuthenticated } = useAuth();
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    apiGet<MyTripsResponse>(cfg.api.my_trips)
      .then((d) => setTrips(d.trips || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const joined = trips.filter(t => !t.can_manage);
  const managed = trips.filter(t => t.can_manage);

  const groupBy = (arr: TripData[], key: string) => arr.filter(t => (t.status || (t.is_draft ? "draft" : "published")) === key);
  const groupByJoin = (arr: TripData[], key: string) => arr.filter(t => t.join_request_status === key || (key === "completed" && t.status === "completed"));

  const renderEmpty = (msg: string, cta?: { label: string; to: string }) => (
    <div className="py-8 text-center text-sm text-muted-foreground">
      <p>{msg}</p>
      {cta && <Button asChild variant="link" className="mt-1"><Link to={cta.to}>{cta.label}</Link></Button>}
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Your trips</h2>
        <Button asChild size="sm">
          <Link to="/trips/new"><Plus className="mr-1 h-4 w-4" />New trip</Link>
        </Button>
      </div>

      <Tabs defaultValue="joined">
        <TabsList>
          <TabsTrigger value="joined">Joined ({joined.length})</TabsTrigger>
          <TabsTrigger value="managed">Managed ({managed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="joined" className="mt-6 space-y-6">
          {[
            { key: "pending", label: "Pending" },
            { key: "approved", label: "Approved" },
            { key: "rejected", label: "Rejected" },
            { key: "completed", label: "Completed" },
          ].map(s => {
            const items = groupByJoin(joined, s.key);
            return (
              <div key={s.key}>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">{s.label} ({items.length})</h3>
                {items.length === 0 ? renderEmpty(`No ${s.label.toLowerCase()} trips`) : (
                  <div className="space-y-2">{items.map(t => <TripRow key={t.id} trip={t} />)}</div>
                )}
              </div>
            );
          })}
          {joined.length === 0 && renderEmpty("You haven't joined any trips yet.", { label: "Browse trips", to: "/search" })}
        </TabsContent>

        <TabsContent value="managed" className="mt-6 space-y-6">
          {[
            { key: "draft", label: "Drafts" },
            { key: "published", label: "Published" },
            { key: "completed", label: "Completed" },
          ].map(s => {
            const items = groupBy(managed, s.key);
            return (
              <div key={s.key}>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">{s.label} ({items.length})</h3>
                {items.length === 0 ? renderEmpty(`No ${s.label.toLowerCase()}`) : (
                  <div className="space-y-2">{items.map(t => <TripRow key={t.id} trip={t} manage />)}</div>
                )}
              </div>
            );
          })}
          {managed.length === 0 && renderEmpty("You haven't created any trips yet.", { label: "Create your first trip", to: "/trips/new" })}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardTrips;
