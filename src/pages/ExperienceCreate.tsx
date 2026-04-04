import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { apiPost } from "@/lib/api";
import { ArrowLeft, Loader2 } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";

const ExperienceCreate = () => {
  const navigate = useNavigate();
  const { isAuthenticated, requireAuth } = useAuth();
  const [title, setTitle] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handlePublish = async () => {
    if (!isAuthenticated) { requireAuth(() => handlePublish()); return; }
    if (!title.trim()) return;
    setSaving(true);
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      await apiPost(cfg.api.blogs, { title, cover_image_url: coverUrl, body: content });
      navigate("/experiences");
    } catch {}
    setSaving(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>

          <h1 className="mb-6 text-2xl font-bold text-foreground">Share Your Experience</h1>

          <Card>
            <CardContent className="space-y-5 p-6">
              <div>
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your experience a title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Cover Image URL</Label>
                <Input
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1"
                />
                {coverUrl && (
                  <div className="mt-2 overflow-hidden rounded-lg">
                    <img src={coverUrl} alt="Cover preview" className="h-40 w-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <Label>Content</Label>
                <div className="mt-1">
                  <RichTextEditor value={content} onChange={setContent} placeholder="Write about your experience..." />
                </div>
              </div>

              <Button onClick={handlePublish} disabled={saving || !title.trim()} className="w-full">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publish
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ExperienceCreate;
