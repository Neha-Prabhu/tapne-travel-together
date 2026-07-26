import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import TiptapEditor from "@/components/TiptapEditor";
import StoryPreviewView from "@/components/StoryPreviewView";
import { useAuth } from "@/contexts/AuthContext";
import { apiPost, apiPatch } from "@/lib/api";
import { useConflict, isEditConflict } from "@/contexts/ConflictContext";
import { toast } from "sonner";
import { Loader2, Save, Eye, ArrowLeft, Send } from "lucide-react";

const StoryCreate = () => {
  const { isAuthenticated, requireAuth, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openConflict } = useConflict();
  const isPreview = searchParams.get("mode") === "preview";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [location, setLocation] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  // Server revision after the first successful save. Sent as expected_revision
  // on every subsequent save so concurrent edits surface as edit_conflict.
  const revisionRef = useRef<number | undefined>(undefined);
  const savingRef = useRef(false);

  useEffect(() => { if (!isAuthenticated) requireAuth(() => {}); }, [isAuthenticated]);

  const snapshotText = () => JSON.stringify({ title, description, coverUrl, location, content }, null, 2);

  const handleSubmit = async (publish: boolean) => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      const payload = {
        title, short_description: description, cover_image_url: coverUrl, location, body: content,
        status: publish ? "published" : "draft",
        expected_revision: revisionRef.current,
      };
      let data: { blog: { slug: string; revision?: number } };
      if (revisionRef.current === undefined) {
        data = await apiPost(cfg.api.blogs, payload);
      } else {
        // After a first successful save the story exists — subsequent writes
        // must PATCH by slug so revision tracking stays intact.
        const slug = (window as any).__tapne_pending_story_slug;
        data = await apiPatch(`${cfg.api.blogs}${slug}/`, payload);
      }
      const slug = data.blog?.slug;
      if (typeof data.blog?.revision === "number") revisionRef.current = data.blog.revision;
      if (slug) (window as any).__tapne_pending_story_slug = slug;
      toast.success(publish ? "Story published" : "Draft saved");
      if (publish && slug) navigate(`/stories/${slug}`);
      else if (publish) navigate("/dashboard/stories");
    } catch (err: any) {
      if (isEditConflict(err)) {
        openConflict({
          label: "story",
          unsavedText: snapshotText(),
          onReload: () => {
            const slug = (window as any).__tapne_pending_story_slug;
            if (slug) window.location.assign(`/stories/${slug}/edit`);
          },
        });
      } else {
        toast.error("Could not save story");
      }
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };

  const togglePreview = () => {
    const next = new URLSearchParams(searchParams);
    if (isPreview) next.delete("mode"); else next.set("mode", "preview");
    setSearchParams(next, { replace: false });
  };

  if (isPreview) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="border-b bg-yellow-50 px-4 py-3 text-center text-sm font-medium text-yellow-800">
          <Eye className="mr-1.5 inline h-4 w-4" />Private preview — visible only to you.
          <Button variant="ghost" size="sm" className="ml-3 h-7" onClick={togglePreview}>Back to edit</Button>
        </div>
        <main className="flex-1">
          <StoryPreviewView title={title} description={description} coverUrl={coverUrl} content={content} location={location} authorName={user?.name} authorUsername={user?.username} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/search?intent=stories")} className="mb-4">
          <ArrowLeft className="mr-1.5 h-4 w-4" />Cancel
        </Button>
        <h1 className="mb-6 text-2xl font-bold text-foreground">Write a story</h1>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Your story title" />
          </div>
          <div className="space-y-1.5">
            <Label>Short description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="A one-line teaser" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Cover image URL</Label>
              <Input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Bali, Indonesia" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Story</Label>
            <TiptapEditor content={content} onChange={setContent} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Button onClick={() => handleSubmit(true)} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}Publish
          </Button>
          <Button variant="outline" onClick={() => handleSubmit(false)} disabled={saving}>
            <Save className="mr-1.5 h-4 w-4" />Save draft
          </Button>
          <Button variant="outline" onClick={togglePreview}>
            <Eye className="mr-1.5 h-4 w-4" />Preview
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StoryCreate;
