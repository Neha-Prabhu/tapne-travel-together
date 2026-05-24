import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { TripData, MyTripsResponse } from "@/types/api";
import { Bookmark, Users } from "lucide-react";

interface UserItem {
  username: string;
  display_name?: string;
  avatar_url?: string;
  location?: string;
}

interface SavedTripPanel {
  trip: TripData;
  savers: UserItem[];
}

const UserGrid = ({ users, empty }: { users: UserItem[]; empty: string }) => (
  users.length === 0 ? (
    <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
      <Users className="mx-auto mb-2 h-6 w-6 opacity-50" />
      {empty}
    </div>
  ) : (
    <div className="grid gap-3 sm:grid-cols-2">
      {users.map(u => (
        <Link key={u.username} to={`/users/${u.username}`}>
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{(u.display_name || u.username)[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">{u.display_name || u.username}</div>
                {u.location && <div className="truncate text-xs text-muted-foreground">{u.location}</div>}
              </div>
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
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    const base = cfg.api.base;
    Promise.allSettled([
      apiGet<{ users: UserItem[] }>(`${base}/profile/me/followers/`).then(d => setFollowers(d.users || [])),
      apiGet<{ users: UserItem[] }>(`${base}/profile/me/following/`).then(d => setFollowing(d.users || [])),
      apiGet<MyTripsResponse>(cfg.api.my_trips).then(d => {
        const managed = (d.trips || []).filter(t => t.can_manage);
        setIsHost(managed.length > 0);
        // Saved-by-others data not exposed by API; leave empty so panel hides.
        setSavedPanels([]);
      }),
    ]).finally(() => setLoading(false));
  }, [isAuthenticated]);

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

      {isHost && savedPanels.length > 0 && (
        <section className="mt-10">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Bookmark className="h-4 w-4" /> Who saved my trips
          </h3>
          <div className="space-y-4">
            {savedPanels.map(p => (
              <Card key={p.trip.id}>
                <CardContent className="p-4">
                  <Link to={`/trips/${p.trip.id}`} className="text-sm font-medium text-foreground hover:text-primary">
                    {p.trip.title}
                  </Link>
                  <div className="mt-3"><UserGrid users={p.savers} empty="No saves yet." /></div>
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
