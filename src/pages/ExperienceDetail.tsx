import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiGet, apiDelete } from "@/lib/api";
import type { BlogData } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, ArrowLeft, Loader2, Edit, Trash2, MapPin } from "lucide-react";
import { generateHTML } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";

function renderBody(body?: string): string {
  if (!body) return "";
  // Try parsing as Tiptap JSON
  try {
    const json = JSON.parse(body);
    if (json.type === "doc") {
      return generateHTML(json, [StarterKit, ImageExt]);
    }
  } catch {
    // It's plain HTML already
  }
  return body;
}

interface ExperienceDetailResponse {
  blog: BlogData;
}

const ExperienceDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [blog, setBlog] = useState<BlogData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    if (!cfg?.api?.blogs || !slug) { setLoading(false); return; }
    apiGet<ExperienceDetailResponse>(`${cfg.api.blogs}${slug}/`)
      .then((data) => setBlog(data.blog))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const isOwner = user && blog && (user.username === blog.author_username);

  const handleDelete = async () => {
    if (!blog || !confirm("Delete this experience?")) return;
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    try {
      await apiDelete(`${cfg.api.blogs}${blog.slug}/`);
      navigate("/experiences");
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Experience not found.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const htmlContent = renderBody(blog.body || blog.excerpt || "");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <article className="mx-auto max-w-[700px] px-4 py-8">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>

          {blog.cover_image_url && (
            <div className="mb-6 overflow-hidden rounded-xl">
              <img src={blog.cover_image_url} alt={blog.title} className="w-full object-cover aspect-[2/1]" />
            </div>
          )}

          <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl leading-tight">{blog.title}</h1>

          {blog.excerpt && (
            <p className="mb-4 text-base text-muted-foreground leading-relaxed">{blog.excerpt}</p>
          )}

          <div className="mb-6 flex flex-wrap items-center gap-4">
            <Link to={`/profile/${blog.author_username}`} className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                  {(blog.author_display_name || blog.author_username || "?")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">{blog.author_display_name || blog.author_username}</span>
            </Link>
            {blog.created_at && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(blog.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </div>
            )}
            {(blog as any).location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {(blog as any).location}
              </div>
            )}
            {isOwner && (
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/experiences/${blog.slug}/edit`)}>
                  <Edit className="mr-1 h-3 w-3" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="text-destructive" onClick={handleDelete}>
                  <Trash2 className="mr-1 h-3 w-3" /> Delete
                </Button>
              </div>
            )}
          </div>

          {(blog as any).tags?.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-1.5">
              {(blog as any).tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          <div
            className="prose prose-neutral dark:prose-invert max-w-none text-foreground/90 [&_img]:rounded-lg [&_img]:my-4"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default ExperienceDetail;
