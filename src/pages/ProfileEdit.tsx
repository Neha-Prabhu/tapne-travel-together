import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Save, Eye, ArrowLeft, Camera, ImagePlus, X, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

const TRAVEL_TAGS = ["Backpacking", "Culture", "Trek", "Social", "Workation", "Beach", "Mountains", "Photography", "Food", "Wellness", "Adventure", "Road Trip", "Solo", "Luxury", "Budget"];

const ProfileEdit = () => {
  const { user, isAuthenticated, requireAuth, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isPreview = searchParams.get("mode") === "preview";
  const focusFields = (searchParams.get("focus") || "").split(",").filter(Boolean);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [coverPhoto, setCoverPhoto] = useState<string | undefined>(undefined);
  const [gallery, setGallery] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const bioRef = useRef<HTMLTextAreaElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) requireAuth(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
      setLocation(user.location || "");
      setWebsite((user as any).website || "");
      setInstagramUrl((user as any).instagram_url || "");
      setTags((user as any).travel_tags || []);
      setAvatarUrl(user.avatar);
      setCoverPhoto((user as any).cover_photo_url);
      setGallery((user as any).gallery_photos || []);
    }
  }, [user]);

  // Scroll to first focused field after data loads
  useEffect(() => {
    if (!user || focusFields.length === 0) return;
    const target = focusFields[0];
    const map: Record<string, React.RefObject<HTMLElement>> = {
      bio: bioRef,
      location: locationRef,
      cover_photo: coverRef,
      gallery_photos: galleryRef,
    };
    const ref = map[target];
    if (ref?.current) {
      setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
      if ("focus" in (ref.current as any)) (ref.current as any).focus?.();
    }
  }, [user]);

  const toggleTag = (t: string) => setTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  const MAX_BYTES = 1.8 * 1024 * 1024;
  const [sizeError, setSizeError] = useState<string | null>(null);

  const checkSize = (f: File) => {
    if (f.size > MAX_BYTES) {
      const msg = "Photo is too large. Please use an image under 2 MB.";
      setSizeError(msg);
      toast.error(msg);
      return false;
    }
    setSizeError(null);
    return true;
  };

  const readFile = (file: File) => new Promise<string>((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.readAsDataURL(file);
  });

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
    if (!checkSize(f)) return;
    setAvatarUrl(await readFile(f));
  };
  const handleCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
    if (!checkSize(f)) return;
    setCoverPhoto(await readFile(f));
  };
  const handleGalleryAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    for (const f of files) { if (!checkSize(f)) return; }
    const urls = await Promise.all(files.map(readFile));
    setGallery(prev => [...prev, ...urls]);
  };
  const removeGallery = (i: number) => setGallery(prev => prev.filter((_, idx) => idx !== i));
  const moveGallery = (i: number, dir: -1 | 1) => {
    setGallery(prev => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name, bio, location,
        avatar: avatarUrl,
        travel_tags: tags,
        cover_photo_url: coverPhoto,
        gallery_photos: gallery,
      } as any);
      toast.success("Profile updated");
      navigate(`/users/${user?.username || user?.id}`);
    } catch {
      toast.error("Could not save profile");
    } finally {
      setSaving(false);
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
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{name[0]?.toUpperCase() || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{name || "Your name"}</h1>
              {location && <p className="mt-1 text-sm text-muted-foreground">{location}</p>}
              {bio && <p className="mt-3 text-sm text-foreground">{bio}</p>}
              {tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const focused = (k: string) => focusFields.includes(k);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/users/${user?.username || user?.id}`)} className="mb-4">
          <ArrowLeft className="mr-1.5 h-4 w-4" />Back to profile
        </Button>
        <h1 className="mb-6 text-2xl font-bold text-foreground">Edit Profile</h1>

        <Card>
          <CardContent className="space-y-5 p-6">
            {/* Avatar */}
            <div className={cn("flex items-center gap-4 rounded-lg p-2 -m-2", focused("avatar") && "ring-2 ring-primary/40")}>
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-2xl bg-accent text-accent-foreground">{name[0]?.toUpperCase() || "?"}</AvatarFallback>
              </Avatar>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted">
                <Camera className="h-4 w-4" /> Change photo
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
              </label>
            </div>

            {/* Cover photo */}
            <div ref={coverRef} className={cn("space-y-2 rounded-lg p-2 -m-2", focused("cover_photo") && "ring-2 ring-primary/40")}>
              <Label>Cover photo</Label>
              <div className="relative h-40 w-full overflow-hidden rounded-lg border bg-muted">
                {coverPhoto ? (
                  <>
                    <img src={coverPhoto} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setCoverPhoto(undefined)} className="absolute right-2 top-2 rounded-full bg-background/90 p-1 shadow">
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center text-sm text-muted-foreground hover:bg-muted/70">
                    <ImagePlus className="mb-1 h-6 w-6" /> Upload cover photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleCover} />
                  </label>
                )}
              </div>
              {coverPhoto && (
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-primary hover:underline">
                  <Camera className="h-3.5 w-3.5" /> Replace
                  <input type="file" accept="image/*" className="hidden" onChange={handleCover} />
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Display name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className={cn("space-y-1.5 rounded-lg p-2 -m-2", focused("bio") && "ring-2 ring-primary/40")}>
              <Label>Bio</Label>
              <Textarea ref={bioRef} value={bio} onChange={e => setBio(e.target.value)} rows={4} />
            </div>
            <div className={cn("space-y-1.5 rounded-lg p-2 -m-2", focused("location") && "ring-2 ring-primary/40")}>
              <Label>Location</Label>
              <Input ref={locationRef} value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" />
            </div>

            {/* Gallery photos */}
            <div ref={galleryRef} className={cn("space-y-2 rounded-lg p-2 -m-2", focused("gallery_photos") && "ring-2 ring-primary/40")}>
              <Label>Gallery photos</Label>
              <p className="text-xs text-muted-foreground">Up to 12 photos. Reorder with arrows.</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {gallery.map((url, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-md border bg-muted">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 hidden flex-col justify-between bg-black/40 p-1 group-hover:flex">
                      <button type="button" onClick={() => removeGallery(i)} className="ml-auto rounded-full bg-background/90 p-1">
                        <X className="h-3 w-3" />
                      </button>
                      <div className="flex justify-between">
                        <button type="button" onClick={() => moveGallery(i, -1)} disabled={i === 0} className="rounded-full bg-background/90 p-1 disabled:opacity-40">
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button type="button" onClick={() => moveGallery(i, 1)} disabled={i === gallery.length - 1} className="rounded-full bg-background/90 p-1 disabled:opacity-40">
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {gallery.length < 12 && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 text-xs text-muted-foreground hover:bg-muted/40">
                    <ImagePlus className="mb-1 h-5 w-5" />
                    Add
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryAdd} />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Travel tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {TRAVEL_TAGS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${tags.includes(t) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}Save
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

export default ProfileEdit;
