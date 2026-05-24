import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Bookmark, Users } from "lucide-react";

interface UserItem {
  username: string;
  display_name?: string;
  avatar_url?: string;
  location?: string;
}

interface SavedTripPanel {
  trip: { id?: number; title: string; destination?: string };
  savers: (UserItem & { saved_at?: string })[];
}

// A flat save record (per saver) that we may receive instead of pre-grouped panels.
interface FlatSaveItem extends UserItem {
  saved_at?: string;
  trip_id?: number;
  trip_title?: string;
  trip_destination?: string;
}

interface DashboardFollowersResponse {
  followers?: UserItem[];
  following?: UserItem[];
  saved_by_trip?: SavedTripPanel[];
  // Alternative shapes a backend might emit:
  saved_by?: FlatSaveItem[];
  saves?: FlatSaveItem[];
  is_host?: boolean;
}

const groupFlatSaves = (flat: FlatSaveItem[]): SavedTripPanel[] => {
  const map = new Map<string, SavedTripPanel>();
  for (const s of flat) {
    const title = s.trip_title || (s.trip_id ? `Trip ${s.trip_id}` : "Untitled trip");
    const key = `${s.trip_id ?? ""}|${title}|${s.trip_destination ?? ""}`;
    if (!map.has(key)) {
      map.set(key, {
        trip: { id: s.trip_id, title, destination: s.trip_destination },
        savers: [],
      });
    }
    const { trip_id, trip_title, trip_destination, ...saver } = s;
    map.get(key)!.savers.push(saver);
  }
  return Array.from(map.values());
};

const UserGrid = ({
  users,
  empty,
}: {
  users: (UserItem & { saved_at?: string })[];
  empty: string;
}) => (
  users.length === 0 ? (
    <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
      <Users className="mx-auto mb-2 h-6 w-6 opacity-50" />
      {empty}
    </div>
  ) : (
    <div className="grid gap-3 sm:grid-cols-2">
      {users.map(u => (
        <Link key={`${u.username}-${u.saved_at ?? ""}`} to={`/users/${u.username}`}>
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <Avatar className="h-10 w-10">
                {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.display_name || u.username} />}
                <AvatarFallback>{(u.display_name || u.username)[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-foreground">{u.display_name || u.username}</div>
                {u.location && <div className="truncate text-xs text-muted-foreground">{u.location}</div>}
              </div>
              {u.saved_at && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(u.saved_at).toLocaleDateString()}
                </span>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
);

const SkeletonGrid = () => (
  <div className="grid gap-3 sm:grid-cols-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className="h-[72px] w-full" />
    ))}
  </div>
);

const DashboardFollowers = () => {
  const { isAuthenticated } = useAuth();
  const [followers, setFollowers] = useState<UserItem[]>([]);
  const [following, setFollowing] = useState<UserItem[]>([]);
  const [savedPanels, setSavedPanels] = useState<SavedTripPanel[]>([]);
  const [loading, setLoading] = useState(true);

  // Read everything the page already provides; group flat save lists when needed.
  const ingest = (d: DashboardFollowersResponse) => {
    setFollowers(d.followers || []);
    setFollowing(d.following || []);
    if (d.saved_by_trip && d.saved_by_trip.length > 0) {
      setSavedPanels(d.saved_by_trip);
    } else if (d.saved_by && d.saved_by.length > 0) {
      setSavedPanels(groupFlatSaves(d.saved_by));
    } else if (d.saves && d.saves.length > 0) {
      setSavedPanels(groupFlatSaves(d.saves));
    } else {
      setSavedPanels([]);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    const dashboardUrl = cfg.api.dashboard_followers;
    const followersUrl = cfg.api.followers;
    const followingUrl = cfg.api.following;

    const fallback = async () => {
      const tasks: Promise<unknown>[] = [];
      if (followersUrl) {
        tasks.push(apiGet<{ users: UserItem[] }>(followersUrl).then(d => setFollowers(d.users || [])).catch(() => {}));
      }
      if (followingUrl) {
        tasks.push(apiGet<{ users: UserItem[] }>(followingUrl).then(d => setFollowing(d.users || [])).catch(() => {}));
      }
      await Promise.allSettled(tasks);
    };

    const work = dashboardUrl
      ? apiGet<DashboardFollowersResponse>(dashboardUrl)
          .then(d => { if (d) { ingest(d); return true; } return false; })
          .catch(() => false)
          .then(handled => (handled ? undefined : fallback()))
      : fallback();

    work.finally(() => setLoading(false));
  }, [isAuthenticated]);

  const hasSaved = useMemo(
    () => savedPanels.some(p => p.savers.length > 0),
    [savedPanels],
  );

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-foreground">Followers</h2>
      <Tabs defaultValue="followers">
        <TabsList>
          <TabsTrigger value="followers">Followers ({followers.length})</TabsTrigger>
          <TabsTrigger value="following">Following ({following.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="followers" className="mt-6">
          {loading ? <SkeletonGrid /> : <UserGrid users={followers} empty="No followers yet." />}
        </TabsContent>
        <TabsContent value="following" className="mt-6">
          {loading ? <SkeletonGrid /> : <UserGrid users={following} empty="You aren't following anyone yet." />}
        </TabsContent>
      </Tabs>

      {hasSaved && (
        <section className="mt-10">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Bookmark className="h-4 w-4" /> Who saved my trips
          </h3>
          <div className="space-y-4">
            {savedPanels.map(p => (
              <Card key={`${p.trip.id ?? ""}-${p.trip.title}`}>
                <CardContent className="p-4">
                  {p.trip.id ? (
                    <Link to={`/trips/${p.trip.id}`} className="text-sm font-medium text-foreground hover:text-primary">
                      {p.trip.title}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-foreground">{p.trip.title}</span>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {p.trip.destination && <span>{p.trip.destination}</span>}
                    <span>·</span>
                    <span>{p.savers.length} {p.savers.length === 1 ? "saver" : "savers"}</span>
                  </div>
                  <div className="mt-3">
                    <UserGrid users={p.savers} empty="No saves yet." />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default DashboardFollowers;
