import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import type { BlogData } from "@/types/api";
import { User, Calendar, Loader2, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Stories = () => {
  const [stories, setStories] = useState<BlogData[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, requireAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    if (!cfg?.api?.blogs) { setLoading(false); return; }
    apiGet<{ blogs: BlogData[] }>(cfg.api.blogs)
      .then((data) => setStories(data.blogs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Stories</h1>
              <p className="mt-1 text-muted-foreground">Stories and tips from the Tapne community.</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                if (isAuthenticated) navigate("/stories/new");
                else requireAuth(() => navigate("/stories/new"));
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> Write
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : stories.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No stories shared yet. Be the first!</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                <Link key={story.slug} to={`/stories/${story.slug}`} className="block">
                  <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
                    {story.cover_image_url && (
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img src={story.cover_image_url} alt={story.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="mb-1.5 line-clamp-2 text-base font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">{story.title}</h3>
                      {(story.short_description || story.excerpt) && <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{story.short_description || story.excerpt}</p>}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1"><User className="h-3 w-3" />{story.author_display_name || story.author_username}</div>
                        {story.created_at && (
                          <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(story.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Stories;
