import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { BlogData } from "@/types/api";
import { Loader2, Plus, Edit, Calendar } from "lucide-react";

const StoryRow = ({ story }: { story: BlogData & { status?: string } }) => (
  <Card>
    <CardContent className="flex items-center gap-4 p-4">
      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
        {story.cover_image_url && <img src={story.cover_image_url} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <Link to={`/stories/${story.slug}`} className="truncate font-medium text-foreground hover:text-primary">{story.title || "Untitled"}</Link>
        {story.created_at && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />{new Date(story.created_at).toLocaleDateString()}
          </div>
        )}
      </div>
      <Button variant="outline" size="sm" asChild>
        <Link to={`/stories/${story.slug}/edit`}><Edit className="mr-1.5 h-3.5 w-3.5" />Edit</Link>
      </Button>
    </CardContent>
  </Card>
);

const DashboardStories = () => {
  const { isAuthenticated, user } = useAuth();
  const [stories, setStories] = useState<(BlogData & { status?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    if (!cfg?.api?.blogs) { setLoading(false); return; }
    apiGet<{ blogs: (BlogData & { status?: string })[] }>(`${cfg.api.blogs}?author=me`)
      .then((d) => setStories(d.blogs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const groups = ["draft", "published", "unpublished", "archived"];
  const groupedFor = (g: string) => stories.filter(s => (s.status || "published") === g);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Your stories</h2>
        <Button asChild size="sm">
          <Link to="/stories/new"><Plus className="mr-1 h-4 w-4" />New story</Link>
        </Button>
      </div>

      <Tabs defaultValue="published">
        <TabsList>
          {groups.map(g => <TabsTrigger key={g} value={g}>{g[0].toUpperCase() + g.slice(1)} ({groupedFor(g).length})</TabsTrigger>)}
        </TabsList>
        {groups.map(g => {
          const items = groupedFor(g);
          return (
            <TabsContent key={g} value={g} className="mt-6">
              {items.length === 0
                ? <p className="py-8 text-center text-sm text-muted-foreground">No {g} stories.</p>
                : <div className="space-y-2">{items.map(s => <StoryRow key={s.slug} story={s} />)}</div>}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default DashboardStories;
