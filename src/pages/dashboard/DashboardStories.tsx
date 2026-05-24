import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { BlogData } from "@/types/api";
import { Plus, Edit, Calendar, Eye, Star, MessageSquare, Bookmark, BookOpen } from "lucide-react";

type StoryRich = BlogData & {
  status?: string;
  average_rating?: number;
  bookmarks_count?: number;
};

const StoryRow = ({ story }: { story: StoryRich }) => {
  const reads = story.reads ?? 0;
  const rating = story.average_rating ?? 0;
  const reviews = story.reviews_count ?? 0;
  const bookmarks = story.bookmarks_count;

  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-4">
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
          {story.cover_image_url && <img src={story.cover_image_url} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <Link to={`/stories/${story.slug}`} className="block truncate font-medium text-foreground hover:text-primary">
            {story.title || "Untitled"}
          </Link>
          {story.created_at && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />{new Date(story.created_at).toLocaleDateString()}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground">
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-muted-foreground" />{reads} reads</span>
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-yellow-500" />{rating > 0 ? rating.toFixed(1) : "—"}
            </span>
            <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />{reviews} reviews</span>
            <span className="flex items-center gap-1 text-muted-foreground"><Bookmark className="h-3.5 w-3.5" />{bookmarks ?? "—"}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/stories/${story.slug}/edit`}><Edit className="mr-1.5 h-3.5 w-3.5" />Edit</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

const DashboardStories = () => {
  const { isAuthenticated } = useAuth();
  const [stories, setStories] = useState<StoryRich[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    if (!cfg?.api?.blogs) { setLoading(false); return; }
    apiGet<{ blogs: StoryRich[] }>(`${cfg.api.blogs}?author=me`)
      .then((d) => setStories(d.blogs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

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

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : stories.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <BookOpen className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">You haven't written any stories yet.</p>
          <Button asChild size="sm" className="mt-4"><Link to="/stories/new">Write your first story</Link></Button>
        </div>
      ) : (
        <Tabs defaultValue="published">
          <TabsList>
            {groups.map(g => <TabsTrigger key={g} value={g}>{g[0].toUpperCase() + g.slice(1)} ({groupedFor(g).length})</TabsTrigger>)}
          </TabsList>
          {groups.map(g => {
            const items = groupedFor(g);
            return (
              <TabsContent key={g} value={g} className="mt-6">
                {items.length === 0
                  ? <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">No {g} stories.</div>
                  : <div className="space-y-2">{items.map(s => <StoryRow key={s.slug} story={s} />)}</div>}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
};

export default DashboardStories;
