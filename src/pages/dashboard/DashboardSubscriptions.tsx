import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface UserItem {
  username: string;
  display_name?: string;
  avatar_url?: string;
  location?: string;
}

const UserList = ({ users, empty }: { users: UserItem[]; empty: string }) => (
  users.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p> : (
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

const DashboardSubscriptions = () => {
  const { isAuthenticated } = useAuth();
  const [subscribers, setSubscribers] = useState<UserItem[]>([]);
  const [subscribed, setSubscribed] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    const base = cfg.api.base;
    Promise.allSettled([
      apiGet<{ users: UserItem[] }>(`${base}/profile/me/followers/`).then(d => setSubscribers(d.users || [])),
      apiGet<{ users: UserItem[] }>(`${base}/profile/me/following/`).then(d => setSubscribed(d.users || [])),
    ]).finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-foreground">Subscriptions</h2>
      <Tabs defaultValue="subscribers">
        <TabsList>
          <TabsTrigger value="subscribers">Subscribers ({subscribers.length})</TabsTrigger>
          <TabsTrigger value="subscribed">Subscribed ({subscribed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="subscribers" className="mt-6">
          <UserList users={subscribers} empty="No subscribers yet." />
        </TabsContent>
        <TabsContent value="subscribed" className="mt-6">
          <UserList users={subscribed} empty="You aren't subscribed to anyone yet." />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardSubscriptions;
