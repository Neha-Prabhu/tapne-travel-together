import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPatch } from "@/lib/api";
import type { BlogData } from "@/types/api";
import { ArrowLeft, Loader2, ImagePlus, X } from "lucide-react";
import TiptapEditor from "@/components/TiptapEditor";

const TAGS = ["Solo", "Trek", "Budget", "Luxury", "Cultural", "Adventure", "Chill", "Workation", "Road Trip", "Beach"];

interface ExperienceDetailResponse {
  blog: BlogData;
}

const ExperienceEdit = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!slug) return;
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    if (!cfg?.api?.blogs) { setLoading(false); setNotFound(true); return; }
    apiGet<ExperienceDetailResponse>(`${cfg.api.blogs}${slug}/`)
      .then((data) => {
        const blog = data.blog;
        if (!blog) { setNotFound(true); return; }
        // Check ownership
        if (user && user.username !== blog.author_username) {
          setUnauthorized(true);
          return;
        }
        setTitle(blog.title || "");
        setDescription(blog.short_description || blog.excerpt || "");
        setCoverUrl(blog.cover_image_url || "");
        setCoverPreview(blog.cover_image_url || "");
        setContent(blog.body || "");
        setLocation((blog as any).location || "");
        setTags((blog as any).tags || []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug, user]);

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCoverPreview(dataUrl);
      setCoverUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const toggleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handleUpdate = async () => {
    if (!title.trim() || !description.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      await apiPatch(`${cfg.api.blogs}${slug}/`, {
        title,
        short_description: description,
        cover_image_url: coverUrl,
        body: content,
        location,
        tags,
      });
      navigate(`/experiences/${slug}`);
    } catch {}
    setSaving(false);
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

  if (notFound) {
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

  if (unauthorized) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">You don't have permission to edit this experience.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-[700px] px-4 py-8">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>

          <h1 className="mb-6 text-2xl font-bold text-foreground">Edit Experience</h1>

          <div className="space-y-6">
            {/* Cover Image */}
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Cover Image</Label>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFile} />
              {coverPreview ? (
                <div className="relative overflow-hidden rounded-xl">
                  <img src={coverPreview} alt="Cover" className="w-full aspect-[2/1] object-cover" />
                  <button
                    type="button"
                    className="absolute top-2 right-2 rounded-full bg-background/80 p-1.5 text-foreground hover:bg-background"
                    onClick={() => { setCoverPreview(""); setCoverUrl(""); }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-muted/30 py-12 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-accent/30"
                  onClick={() => coverInputRef.current?.click()}
                >
                  <ImagePlus className="h-5 w-5" />
                  Upload cover image
                </button>
              )}
            </div>

            {/* Title */}
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Title <span className="text-destructive">*</span></Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                placeholder="Give your experience a title"
                maxLength={80}
              />
              <p className="mt-1 text-xs text-muted-foreground">{title.length}/80</p>
            </div>

            {/* Short Description */}
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Short Description <span className="text-destructive">*</span></Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 150))}
                placeholder="A brief summary for the card preview"
                maxLength={150}
              />
              <p className="mt-1 text-xs text-muted-foreground">{description.length}/150</p>
            </div>

            {/* Content */}
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Content <span className="text-destructive">*</span></Label>
              <TiptapEditor
                content={content}
                onChange={setContent}
                placeholder="Write about your experience…"
              />
            </div>

            {/* Tags */}
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Tags</Label>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer select-none transition-colors"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Location</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Manali, Himachal Pradesh"
              />
            </div>

            {/* Update */}
            <Button
              onClick={handleUpdate}
              disabled={saving || !title.trim() || !description.trim() || !content.trim()}
              className="w-full"
              size="lg"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Experience
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ExperienceEdit;
