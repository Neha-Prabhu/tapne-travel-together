import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import type { BlogData } from "@/types/api";
import { User, Calendar, Loader2 } from "lucide-react";

const Blogs = () => {
  const [blogs, setBlogs] = useState<BlogData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    if (!cfg?.api?.blogs) { setLoading(false); return; }
    apiGet<{ blogs: BlogData[] }>(cfg.api.blogs)
      .then((data) => setBlogs(data.blogs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Blogs</h1>
          <p className="mb-8 text-muted-foreground">Stories, tips, and experiences from the Tapne community.</p>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : blogs.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No blogs available yet.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blogs.map((blog) => (
                <Card key={blog.slug} className="group overflow-hidden transition-shadow hover:shadow-lg">
                  {blog.cover_image_url && (
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img src={blog.cover_image_url} alt={blog.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="mb-2 line-clamp-2 text-base font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">{blog.title}</h3>
                    {blog.excerpt && <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{blog.excerpt}</p>}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><User className="h-3 w-3" />{blog.author_display_name || blog.author_username}</div>
                      {blog.created_at && (
                        <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(blog.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blogs;
