import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Star } from "lucide-react";

interface Review {
  id: number;
  reviewer_name?: string;
  reviewee_name?: string;
  rating: number;
  text: string;
  trip_title?: string;
  created_at: string;
}

const ReviewCard = ({ r, who }: { r: Review; who: "from" | "to" }) => (
  <Card>
    <CardContent className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{((who === "from" ? r.reviewee_name : r.reviewer_name) || "?")[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">
            {who === "from" ? `For ${r.reviewee_name}` : `From ${r.reviewer_name}`}
          </div>
          {r.trip_title && <div className="text-xs text-muted-foreground">{r.trip_title}</div>}
        </div>
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
          ))}
        </div>
      </div>
      <p className="text-sm text-foreground">{r.text}</p>
      <p className="mt-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
    </CardContent>
  </Card>
);

const DashboardReviews = () => {
  const { isAuthenticated } = useAuth();
  const [written, setWritten] = useState<Review[]>([]);
  const [received, setReceived] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    if (!cfg?.api?.trip_reviews) { setLoading(false); return; }
    Promise.allSettled([
      apiGet<{ reviews: Review[] }>(`${cfg.api.trip_reviews}?author=me`).then(d => setWritten(d.reviews || [])),
      apiGet<{ reviews: Review[] }>(`${cfg.api.trip_reviews}?recipient=me`).then(d => setReceived(d.reviews || [])),
    ]).finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-foreground">Reviews</h2>
      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">Received ({received.length})</TabsTrigger>
          <TabsTrigger value="written">Written ({written.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="received" className="mt-6">
          {received.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No reviews yet.</p>
            : <div className="space-y-3">{received.map(r => <ReviewCard key={r.id} r={r} who="to" />)}</div>}
        </TabsContent>
        <TabsContent value="written" className="mt-6">
          {written.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">You haven't written any reviews.</p>
            : <div className="space-y-3">{written.map(r => <ReviewCard key={r.id} r={r} who="from" />)}</div>}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardReviews;
