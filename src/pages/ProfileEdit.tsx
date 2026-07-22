import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  Loader2, Save, Eye, ArrowLeft, Camera, ImagePlus, X, ArrowUp, ArrowDown,
  Lightbulb, ChevronLeft, ChevronRight, Check, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  readFileAsDataUrl,
  useSavedField,
  validateImageFile,
  type FieldStatus,
} from "@/features/profile/useSavedField";

const TRAVEL_TAGS = ["Backpacking", "Culture", "Trek", "Social", "Workation", "Beach", "Mountains", "Photography", "Food", "Wellness", "Adventure", "Road Trip", "Solo", "Luxury", "Budget"];
const GALLERY_LIMIT = 12;

const arraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

function StatusPill({ status, error, onRetry, label }: {
  status: FieldStatus;
  error: string | null;
  onRetry: () => void;
  label: string;
}) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving {label}…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
        <Check className="h-3 w-3" /> Saved
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-destructive">
        <AlertCircle className="h-3 w-3" /> {error || "Save failed"}
        <button type="button" onClick={onRetry} className="ml-1 underline">Retry</button>
      </span>
    );
  }
  return null;
}

const ProfileEdit = () => {
  const { user, isAuthenticated, requireAuth, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isPreview = searchParams.get("mode") === "preview";
  const FIELD_ALIASES: Record<string, string> = { avatar_url: "avatar" };
  const rawFocus = (searchParams.get("focus") || "").split(",").filter(Boolean);
  const focusFields = Array.from(new Set(rawFocus.map(f => FIELD_ALIASES[f] || f)));
  const [walkIndex, setWalkIndex] = useState(0);
  const [walkDismissed, setWalkDismissed] = useState(false);
  const currentFocus = !walkDismissed && focusFields.length > 0 ? focusFields[walkIndex] : null;

  const FIELD_HELP: Record<string, string> = {
    avatar: "A clear profile photo helps travelers recognize and trust you.",
    bio: "A short bio gives travelers a feel for who you are and your travel style.",
    location: "Your home base helps travelers find hosts near them.",
    cover_photo: "A cover photo sets the tone of your profile and makes it memorable.",
    gallery_photos: "Gallery photos help travelers quickly understand what your trips look like.",
    travel_tags: "Travel tags help travelers understand your travel style and the kinds of trips you host.",
  };
  const FIELD_LABELS: Record<string, string> = {
    avatar: "Profile photo",
    bio: "Short bio",
    location: "Location",
    cover_photo: "Cover photo",
    gallery_photos: "Gallery photos",
    travel_tags: "Travel tags",
  };

  // ── Text fields (still saved together with the Save button) ──
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ── Media fields (each saves itself immediately) ──
  const saveAvatar = useCallback(async (v: string | null) => {
    await updateProfile({ avatar: v ?? "" } as any);
  }, [updateProfile]);
  const saveCover = useCallback(async (v: string | null) => {
    await updateProfile({ cover_photo_url: v ?? "" } as any);
  }, [updateProfile]);
  const saveGallery = useCallback(async (v: string[]) => {
    await updateProfile({ gallery_photos: v } as any);
  }, [updateProfile]);

  const avatarField = useSavedField<string | null>(null, { save: saveAvatar });
  const coverField = useSavedField<string | null>(null, { save: saveCover });
  const galleryField = useSavedField<string[]>([], { save: saveGallery, isEqual: arraysEqual });

  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!user || hydratedRef.current) return;
    hydratedRef.current = true;
    setName(user.name || "");
    setBio(user.bio || "");
    setLocation(user.location || "");
    setWebsite((user as any).website || "");
    setInstagramUrl((user as any).instagram_url || "");
    setTags((user as any).travel_tags || []);
    avatarField.resetTo(user.avatar || null);
    coverField.resetTo((user as any).cover_photo_url || null);
    galleryField.resetTo((user as any).gallery_photos || []);
  }, [user, avatarField, coverField, galleryField]);

  const bioRef = useRef<HTMLTextAreaElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) requireAuth(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!user || !currentFocus) return;
    const map: Record<string, React.RefObject<HTMLElement>> = {
      avatar: avatarRef, bio: bioRef, location: locationRef,
      cover_photo: coverRef, gallery_photos: galleryRef, travel_tags: tagsRef,
    };
    const ref = map[currentFocus];
    if (ref?.current) {
      setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
      if ("focus" in (ref.current as any)) (ref.current as any).focus?.();
    }
  }, [user, currentFocus]);

  const toggleTag = (t: string) => setTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  // ── Media handlers ──
  const pickSingle = useCallback(async (
    file: File,
    apply: (dataUrl: string) => void,
  ) => {
    const err = validateImageFile(file);
    if (err) { setUploadError(err); toast.error(err); return; }
    setUploadError(null);
    try {
      const url = await readFileAsDataUrl(file);
      apply(url);
    } catch {
      const msg = "Could not read image file.";
      setUploadError(msg); toast.error(msg);
    }
  }, []);

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
    await pickSingle(f, (url) => avatarField.setValue(url));
  };
  const handleCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
    await pickSingle(f, (url) => coverField.setValue(url));
  };
  const handleGalleryAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (picked.length === 0) return;

    const capacity = GALLERY_LIMIT - galleryField.value.length;
    if (capacity <= 0) {
      const msg = `Gallery already has ${GALLERY_LIMIT} photos.`;
      setUploadError(msg); toast.error(msg); return;
    }

    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const f of picked) {
      const err = validateImageFile(f);
      if (err) { rejected.push(err); continue; }
      if (accepted.length >= capacity) {
        rejected.push(`${f.name}: gallery limit of ${GALLERY_LIMIT} reached.`);
        continue;
      }
      accepted.push(f);
    }
    if (rejected.length) {
      const msg = rejected.join(" ");
      setUploadError(msg);
      toast.error(rejected[0]);
    } else {
      setUploadError(null);
    }
    if (accepted.length === 0) return;

    // Read one file at a time and enqueue after each successful read so
    // partial batches persist even if a later file fails to read.
    const existing = new Set(galleryField.value);
    const nextBatch: string[] = [];
    for (const f of accepted) {
      try {
        const url = await readFileAsDataUrl(f);
        if (existing.has(url)) continue; // never create duplicate tiles
        existing.add(url);
        nextBatch.push(url);
      } catch {
        toast.error(`${f.name}: could not be read.`);
      }
    }
    if (nextBatch.length === 0) return;
    galleryField.setValue([...galleryField.value, ...nextBatch]);
  };

  const removeGallery = (i: number) => {
    if (galleryField.saving) return;
    galleryField.setValue(galleryField.value.filter((_, idx) => idx !== i));
  };
  const moveGallery = (i: number, dir: -1 | 1) => {
    if (galleryField.saving) return;
    const next = [...galleryField.value];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    galleryField.setValue(next);
  };

  const confirmedGallerySet = useMemo(
    () => new Set(galleryField.confirmed),
    [galleryField.confirmed],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name, bio, location,
        website,
        instagram_url: instagramUrl,
        travel_tags: tags,
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
              <AvatarImage src={avatarField.confirmed || undefined} />
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

  const focused = (k: string) => currentFocus === k;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/users/${user?.username || user?.id}`)} className="mb-4">
          <ArrowLeft className="mr-1.5 h-4 w-4" />Back to profile
        </Button>
        <h1 className="mb-6 text-2xl font-bold text-foreground">Edit Profile</h1>

        {currentFocus && (
          <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <Lightbulb className="h-5 w-5 shrink-0 text-primary" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">
                    {FIELD_LABELS[currentFocus] || currentFocus}
                    {focusFields.length > 1 && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({walkIndex + 1} of {focusFields.length})
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">{FIELD_HELP[currentFocus] || "Add this to make your profile more complete."}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:shrink-0">
                <Button size="sm" variant="outline" disabled={walkIndex === 0} onClick={() => setWalkIndex(i => Math.max(0, i - 1))}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button size="sm" variant="outline" disabled={walkIndex >= focusFields.length - 1} onClick={() => setWalkIndex(i => Math.min(focusFields.length - 1, i + 1))}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setWalkDismissed(true)}>Dismiss</Button>
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardContent className="space-y-5 p-6">
            {uploadError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {uploadError}
              </div>
            )}

            {/* Avatar */}
            <div ref={avatarRef} className={cn("flex items-center gap-4 rounded-lg p-2 -m-2 transition-all", focused("avatar") && "ring-2 ring-primary/60 bg-primary/5")}>
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarField.value || undefined} />
                <AvatarFallback className="text-2xl bg-accent text-accent-foreground">{name[0]?.toUpperCase() || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1.5">
                <label className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted",
                  avatarField.saving && "pointer-events-none opacity-60",
                )}>
                  <Camera className="h-4 w-4" /> {avatarField.value ? "Change photo" : "Upload photo"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatar} disabled={avatarField.saving} />
                </label>
                <StatusPill status={avatarField.status} error={avatarField.error} onRetry={avatarField.retry} label="photo" />
              </div>
            </div>

            {/* Cover photo */}
            <div ref={coverRef} className={cn("space-y-2 rounded-lg p-2 -m-2", focused("cover_photo") && "ring-2 ring-primary/60 bg-primary/5")}>
              <div className="flex items-center justify-between">
                <Label>Cover photo</Label>
                <StatusPill status={coverField.status} error={coverField.error} onRetry={coverField.retry} label="cover" />
              </div>
              <div className="relative h-40 w-full overflow-hidden rounded-lg border bg-muted">
                {coverField.value ? (
                  <>
                    <img src={coverField.value} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => coverField.setValue(null)}
                      disabled={coverField.saving}
                      className="absolute right-2 top-2 rounded-full bg-background/90 p-1 shadow disabled:opacity-50"
                      aria-label="Remove cover photo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {coverField.saving && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/40 text-xs text-foreground">
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Uploading…
                      </div>
                    )}
                  </>
                ) : (
                  <label className={cn(
                    "flex h-full w-full cursor-pointer flex-col items-center justify-center text-sm text-muted-foreground hover:bg-muted/70",
                    coverField.saving && "pointer-events-none opacity-60",
                  )}>
                    <ImagePlus className="mb-1 h-6 w-6" /> Upload cover photo
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCover} disabled={coverField.saving} />
                  </label>
                )}
              </div>
              {coverField.value && (
                <label className={cn(
                  "inline-flex cursor-pointer items-center gap-2 text-xs text-primary hover:underline",
                  coverField.saving && "pointer-events-none opacity-60",
                )}>
                  <Camera className="h-3.5 w-3.5" /> Replace
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCover} disabled={coverField.saving} />
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Display name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className={cn("space-y-1.5 rounded-lg p-2 -m-2", focused("bio") && "ring-2 ring-primary/60 bg-primary/5")}>
              <Label>Bio</Label>
              <Textarea ref={bioRef} value={bio} onChange={e => setBio(e.target.value)} rows={4} />
            </div>
            <div className={cn("space-y-1.5 rounded-lg p-2 -m-2", focused("location") && "ring-2 ring-primary/60 bg-primary/5")}>
              <Label>Location</Label>
              <Input ref={locationRef} value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" />
            </div>
            <div className="space-y-1.5">
              <Label>Instagram URL</Label>
              <Input
                value={instagramUrl}
                onChange={e => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/your_handle"
                type="url"
              />
            </div>

            {/* Gallery photos */}
            <div ref={galleryRef} className={cn("space-y-2 rounded-lg p-2 -m-2", focused("gallery_photos") && "ring-2 ring-primary/60 bg-primary/5")}>
              <div className="flex items-center justify-between">
                <Label>Gallery photos</Label>
                <StatusPill status={galleryField.status} error={galleryField.error} onRetry={galleryField.retry} label="gallery" />
              </div>
              <p className="text-xs text-muted-foreground">
                Up to {GALLERY_LIMIT} photos. JPEG, PNG, or WebP up to 2 MB each.
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {galleryField.value.map((url, i) => {
                  const isPending = !confirmedGallerySet.has(url);
                  const isFirst = i === 0;
                  const isLast = i === galleryField.value.length - 1;
                  const disabled = galleryField.saving;
                  return (
                    <div key={`${i}-${url.slice(-16)}`} className="relative aspect-square overflow-hidden rounded-md border bg-muted">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-x-0 top-0 flex justify-end p-1">
                        <button
                          type="button"
                          onClick={() => removeGallery(i)}
                          disabled={disabled}
                          className="rounded-full bg-background/90 p-1 shadow-sm disabled:opacity-50"
                          aria-label="Remove photo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 flex justify-between p-1">
                        <button
                          type="button"
                          onClick={() => moveGallery(i, -1)}
                          disabled={disabled || isFirst}
                          className={cn(
                            "rounded-full bg-background/90 p-1 shadow-sm disabled:opacity-30",
                            isFirst && "invisible",
                          )}
                          aria-label="Move earlier"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveGallery(i, 1)}
                          disabled={disabled || isLast}
                          className={cn(
                            "rounded-full bg-background/90 p-1 shadow-sm disabled:opacity-30",
                            isLast && "invisible",
                          )}
                          aria-label="Move later"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                      {isPending && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/40 text-[10px] font-medium text-foreground">
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Uploading
                        </div>
                      )}
                    </div>
                  );
                })}
                {galleryField.value.length < GALLERY_LIMIT && (
                  <label className={cn(
                    "flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 text-xs text-muted-foreground hover:bg-muted/40",
                    galleryField.saving && "pointer-events-none opacity-60",
                  )}>
                    <ImagePlus className="mb-1 h-5 w-5" />
                    Add
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleGalleryAdd}
                      disabled={galleryField.saving}
                    />
                  </label>
                )}
              </div>
            </div>

            <div ref={tagsRef} className={cn("space-y-2 rounded-lg p-2 -m-2 transition-all", focused("travel_tags") && "ring-2 ring-primary/60 bg-primary/5")}>
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
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}Save Changes
          </Button>
          <p className="text-xs text-muted-foreground">Photos save automatically as you upload them.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfileEdit;
