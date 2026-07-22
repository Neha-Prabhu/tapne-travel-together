import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPatch } from "@/lib/api";
import type { TripData, BlogData } from "@/types/api";
import TripCard from "@/components/TripCard";
import HorizontalCarousel from "@/components/home/HorizontalCarousel";
import {
  MapPin, Edit, Loader2, Star, MessageCircle, Compass,
  Award, Users, Image as ImageIcon, Camera, X, Settings,
  AlertTriangle, PauseCircle, UserPlus, UserCheck, CheckCircle2, Shield,
  Calendar, Sparkles, Heart, Clock, Globe, Instagram, Flag, Check, AlertCircle,
} from "lucide-react";
import ReportDialog from "@/components/ReportDialog";
import { useMediaSlot } from "@/features/profile/useMediaSlot";
import { uploadAvatar, deleteAvatar } from "@/features/profile/media";
import { validateImageFile } from "@/features/profile/useSavedField";
import type { MediaItem } from "@/types/api";

import { cn } from "@/lib/utils";
import { apiPost, apiDelete } from "@/lib/api";
import { toast } from "sonner";

/* ─── Types ─────────────────────────────────────────────────────── */

interface ReviewEntry {
  id: number;
  rating: number;
  headline?: string;
  body: string;
  trip_title?: string;
  trip_url?: string;
  author_username?: string;
  author_display_name?: string;
  author_avatar_url?: string;
  created_at: string;
}

interface ProfileResponse {
  profile: {
    username: string;
    display_name: string;
    email?: string;
    phone?: string;
    bio: string;
    location: string;
    website: string;
    instagram_url?: string;
    avatar_url?: string;
    avatar_id?: number;
    travel_tags?: string[];
    is_host?: boolean;
    member_since?: string;
    cover_photo_url?: string;
    gallery_photos?: string[];
    average_rating?: number;
    reviews_count?: number;
    trips_hosted?: number;
    travelers_hosted?: number;
    repeat_travelers_count?: number;
    median_response_hours?: number | null;
    review_distribution?: Record<string, number>;
    reviews_received?: ReviewEntry[];
    reviews_written?: ReviewEntry[];
    profile_completeness?: { is_complete: boolean; missing_fields: string[] };
    trips_joined?: number;
    followers_count?: number;
    is_following?: boolean;
    is_blocked_by_me?: boolean;
    is_blocked_by_them?: boolean;
    is_deactivated?: boolean;
    is_suspended?: boolean;
  };

  trips_hosted: TripData[];
  trips_joined: TripData[];
  reviews: ReviewItem[];
  gallery: string[];
  stories?: BlogData[];
}

interface ReviewItem {
  id: number;
  reviewer_name: string;
  reviewer_avatar?: string;
  rating: number;
  text: string;
  trip_title: string;
  created_at: string;
}

const TRAVEL_TAG_OPTIONS = [
  "Backpacking", "Culture", "Trek", "Social", "Workation",
  "Beach", "Mountains", "Photography", "Food", "Wellness",
  "Adventure", "Road Trip", "Solo", "Luxury", "Budget",
];

/** Extract a safe Instagram username from a profile URL. */
function parseInstagramHandle(url?: string | null): string | null {
  if (!url) return null;
  try {
    const trimmed = url.trim();
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const u = new URL(withScheme);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    if (host !== "instagram.com") return null;
    const seg = u.pathname.split("/").filter(Boolean)[0];
    if (!seg) return null;
    const handle = decodeURIComponent(seg).replace(/^@/, "");
    return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? handle : null;
  } catch {
    return null;
  }
}


/* ─── Component ─────────────────────────────────────────────────── */

const Profile = () => {
  const { profileId: profileIdParam } = useParams<{ profileId: string }>();
  const userId = profileIdParam;
  const { user, isAuthenticated, updateProfile, requireAuth, logout, setUserMedia } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);

  const avatarField = useMediaSlot({
    upload: uploadAvatar,
    remove: deleteAvatar,
    initial: null,
    onConfirmed: (item) => {
      setUserMedia({
        avatar: item?.url || "",
        avatar_id: item?.id,
      } as any);
    },
  });

  // Account management dialogs
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateBlockers, setDeactivateBlockers] = useState<Array<{ trip_id: number; title: string; role: "host" | "traveler"; status?: string; pending_count?: number; approved_count?: number }> | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reviewReport, setReviewReport] = useState<null | { type: "review"; id: number; label: string; ownerUsername?: string; ownerDisplayName?: string }>(null);

  const [blockPending, setBlockPending] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [accountActionPending, setAccountActionPending] = useState(false);

  const isOwner = useMemo(() => {
    if (!user) return false;
    if (!userId) return true;
    return String(user.id) === userId || user.username === userId;
  }, [user, userId]);

  useEffect(() => {
    if (!userId && !isAuthenticated) {
      requireAuth();
    }
  }, [userId, isAuthenticated, requireAuth]);

  const loadProfile = () => {
    window.scrollTo(0, 0);
    setLoading(true);
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    const profileId = userId || (user?.username ?? user?.id);
    if (!profileId) { setLoading(false); return; }

    const url = `${cfg.api.base}/profile/${profileId}/`;
    apiGet<ProfileResponse>(url)
      .then((data) => {
        setProfileData(data);
        setIsFollowing(data.profile?.is_following ?? false);
        setFollowersCount(data.profile?.followers_count ?? 0);
      })
      .catch(() => { setProfileData(null); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user]);


  const p = profileData?.profile;
  const isHost = p?.is_host ?? ((p?.trips_hosted ?? 0) > 0);
  const galleryPhotos = p?.gallery_photos ?? profileData?.gallery ?? [];
  const coverImage = p?.cover_photo_url || galleryPhotos[0];
  const reviewsReceived = p?.reviews_received ?? [];
  const reviewsWritten = p?.reviews_written ?? [];
  const reviewDistribution = p?.review_distribution ?? { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
  const completeness = p?.profile_completeness;
  const [completionDismissed, setCompletionDismissed] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [reviewSort, setReviewSort] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [reviewPage, setReviewPage] = useState(1);
  const [activeTab, setActiveTab] = useState("trips");
  const [tripsExpanded, setTripsExpanded] = useState<null | "upcoming" | "past">(null);
  const [tripsFilter, setTripsFilter] = useState<"all" | "hosted" | "joined">("all");
  const REVIEWS_PER_PAGE = 5;
  const memberSinceLabel = p?.member_since ? new Date(p.member_since).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "";
  const responseLabel = (() => {
    const h = p?.median_response_hours;
    if (h == null) return "—";
    if (h < 1) return "<1h";
    if (h < 24) return `${Math.round(h)}h`;
    return `${Math.round(h / 24)}d`;
  })();

  const openEdit = () => {
    if (!p) return;
    setEditName(p.display_name);
    setEditBio(p.bio);
    setEditLocation(p.location);
    setEditTags(p.travel_tags ?? []);
    avatarField.resetTo(
      p.avatar_id && p.avatar_url ? { id: p.avatar_id, url: p.avatar_url } : null,
    );
    setAvatarUploadError(null);
    setEditOpen(true);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const err = validateImageFile(file);
    if (err) { setAvatarUploadError(err); toast.error(err); return; }
    setAvatarUploadError(null);
    avatarField.uploadFile(file);
  };

  const toggleTag = (tag: string) => {
    setEditTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Reflect the latest confirmed avatar back into the visible profile card
  // so refresh-independent state stays in sync as the queue confirms saves.
  useEffect(() => {
    if (!profileData || !p) return;
    if (!isOwner) return;
    const confirmedUrl = avatarField.confirmed?.url;
    const confirmedId = avatarField.confirmed?.id;
    if ((p.avatar_url || undefined) === (confirmedUrl || undefined) && p.avatar_id === confirmedId) return;
    setProfileData({
      ...profileData,
      profile: { ...p, avatar_url: confirmedUrl || "", avatar_id: confirmedId },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarField.confirmed]);

  const saveEdit = async () => {
    try {
      const updated = await updateProfile({
        name: editName,
        bio: editBio,
        location: editLocation,
        travel_tags: editTags,
      });
      if (profileData && p) {
        const next = updated || {};
        setProfileData({
          ...profileData,
          profile: {
            ...p,
            display_name: next.display_name ?? editName,
            bio: next.bio ?? editBio,
            location: next.location ?? editLocation,
            travel_tags: next.travel_tags ?? editTags,
            avatar_url: avatarField.confirmed?.url ?? p.avatar_url,
            avatar_id: avatarField.confirmed?.id ?? p.avatar_id,
          },
        });
      }
      toast.success("Profile updated!");
      setEditOpen(false);
    } catch {
      toast.error("Could not save profile.");
    }

  };

  const handleBlock = async () => {
    if (!p) return;
    setBlockPending(true);
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      await apiPost(`${cfg.api.blocks}${p.username}/`, {});
      toast.success(`Blocked ${p.display_name}.`);
      setBlockOpen(false);
      navigate("/");
    } catch (err: any) {
      toast.error(err?.error || "Could not block. Please try again.");
    } finally {
      setBlockPending(false);
    }
  };

  const handleDeactivate = async () => {
    setAccountActionPending(true);
    setDeactivateBlockers(null);
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      await apiPost(cfg.api.account_deactivate, {});
      toast.success("Account deactivated. You can reactivate anytime.");
      setDeactivateOpen(false);
      setSettingsOpen(false);
      logout();
      navigate("/");
    } catch (err: any) {
      // Commitment blockers keep the member signed in and the dialog open;
      // never toast success or navigate away after a refusal.
      if (err?.status === 409 && Array.isArray(err?.blockers)) {
        setDeactivateBlockers(err.blockers);
      } else {
        toast.error(err?.error || "Could not deactivate account. Please try again.");
      }
    } finally {
      setAccountActionPending(false);
    }
  };


  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!p) {
    // Signed-out visitors get a generic sign-in gate that reveals nothing about
    // whether the account exists. Signed-in visitors keep the neutral unavailable copy.
    if (!isAuthenticated) {
      return (
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex flex-1 items-center justify-center px-6">
            <div className="max-w-md text-center">
              <h1 className="text-xl font-semibold">Sign in to view this profile</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                This profile may be private or unavailable. Sign in to see profiles shared with Tapne members.
              </p>
              <div className="mt-6 flex justify-center gap-2">
                <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
                <Button onClick={() => requireAuth(() => loadProfile())}>Sign in</Button>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      );
    }
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-6">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-semibold">Profile unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">This profile isn't available.</p>
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }


  // When the viewer or the profile owner has blocked the other, or the account
  // is deactivated/suspended, replace the profile with a neutral unavailable
  // state. Suspended accounts must not disclose *why* — the copy is generic.
  const isUnavailable = !isOwner && (p.is_blocked_by_me || p.is_blocked_by_them || p.is_deactivated || p.is_suspended);
  if (isUnavailable) {
    const reason = p.is_blocked_by_me
      ? "You've blocked this member. Unblock them from Settings to see their profile again."
      : "This profile isn't available.";
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-6">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-semibold">Profile unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">{reason}</p>
            <div className="mt-6 flex justify-center gap-2">
              <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
              {p.is_blocked_by_me && (
                <Button onClick={() => navigate("/settings")}>Manage blocked accounts</Button>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }


  const reviews = profileData?.reviews ?? [];
  const gallery = profileData?.gallery ?? [];
  const tripsHosted = profileData?.trips_hosted ?? [];
  const tripsJoined = profileData?.trips_joined ?? [];
  const stories = [...(profileData?.stories ?? [])].sort((a, b) => {
    const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bd - ad;
  });

  const fieldAliases: Record<string, string> = {
    avatar_url: "avatar",
  };
  const travelerFields = new Set(["avatar", "bio", "location"]);
  const rawMissing = Array.from(new Set(
    (completeness?.missing_fields ?? []).map(f => fieldAliases[f] || f)
  ));
  const normalizedMissing = isHost ? rawMissing : rawMissing.filter(f => travelerFields.has(f));
  const showCompletionBanner = isOwner && completeness && !completeness.is_complete && !completionDismissed && normalizedMissing.length > 0;
  const missingLabels: Record<string, string> = {
    avatar: "Profile photo",
    bio: "Short bio",
    location: "Location",
    cover_photo: "Cover photo",
    gallery_photos: "Gallery photos",
    travel_tags: "Travel tags",
  };
  const bannerTitle = isHost
    ? "Complete your host profile to build trust with travelers"
    : "Complete your profile so travelers and hosts can get to know you";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* ── Completion Banner (above cover, never overlaps avatar) ── */}
        {showCompletionBanner && (
          <div className="border-b border-primary/20 bg-primary/5">
            <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <Sparkles className="h-5 w-5 shrink-0 text-primary" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">{bannerTitle}</p>
                  <p className="mt-0.5 text-muted-foreground">
                    Missing: {normalizedMissing.map(f => missingLabels[f] || f).join(", ")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:shrink-0">
                <Button size="sm" onClick={() => navigate(`/profile/edit?focus=${normalizedMissing.join(",")}`)}>
                  Complete profile
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setCompletionDismissed(true)}>
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Cover Hero (every member) ── */}
        <div className="relative h-48 w-full overflow-hidden bg-muted sm:h-64 md:h-80">
          {coverImage ? (
            <img src={coverImage} alt="" className="h-full w-full object-cover object-center" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        <div className="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:pt-8">

          {/* ── Profile Header ── */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <Avatar className={cn("-mt-20 ring-4 ring-background sm:-mt-24", isHost ? "h-28 w-28 sm:h-32 sm:w-32" : "h-24 w-24 sm:h-28 sm:w-28")}>
              <AvatarImage src={p.avatar_url} />
              <AvatarFallback className="bg-accent text-3xl font-semibold text-accent-foreground">
                {p.display_name?.[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{p.display_name}</h1>
                {isHost && (
                  <Badge variant="secondary" className="gap-1 text-xs font-medium">
                    <Award className="h-3 w-3" /> Host
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">@{p.username}</p>
              {p.location && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {p.location}
                </p>
              )}
              {p.bio && (
                <p className="max-w-2xl text-sm leading-relaxed text-foreground/80">{p.bio}</p>
              )}
              {p.travel_tags && p.travel_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {p.travel_tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="rounded-full px-3 py-1 text-xs font-normal">{tag}</Badge>
                  ))}
                </div>
              )}
              {(p.website || p.instagram_url) && (
                <div className="flex flex-wrap items-center gap-3 pt-1 text-sm">
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Globe className="h-3.5 w-3.5" /> Website
                    </a>
                  )}
                  {p.instagram_url && (
                    <a href={p.instagram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Instagram className="h-3.5 w-3.5" /> {parseInstagramHandle(p.instagram_url) ?? "Instagram"}
                    </a>
                  )}

                </div>
              )}
              {memberSinceLabel && (
                <p className="flex items-center gap-1 pt-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" /> Member since {memberSinceLabel}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isOwner ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => navigate("/profile/edit")}>
                    <Edit className="mr-1 h-4 w-4" /> Edit Profile
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant={isFollowing ? "secondary" : "default"}
                    onClick={() => {
                      if (!isAuthenticated) { requireAuth(); return; }
                      const cfg = window.TAPNE_RUNTIME_CONFIG;
                      const url = `${cfg.api.base}/profile/${p.username}/follow/`;
                      if (isFollowing) {
                        setIsFollowing(false); setFollowersCount(c => c - 1);
                        apiDelete(url).catch(() => { setIsFollowing(true); setFollowersCount(c => c + 1); });
                      } else {
                        setIsFollowing(true); setFollowersCount(c => c + 1);
                        apiPost(url).catch(() => { setIsFollowing(false); setFollowersCount(c => c - 1); });
                      }
                    }}
                  >
                    {isFollowing ? <><UserCheck className="mr-1 h-4 w-4" /> Following</> : <><UserPlus className="mr-1 h-4 w-4" /> Follow</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { if (!isAuthenticated) { requireAuth(); return; } navigate(`/messages?dm=${p.username}`); }}>
                    <MessageCircle className="mr-1 h-4 w-4" /> Message
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (!isAuthenticated) { requireAuth(() => setReportOpen(true)); return; } setReportOpen(true); }}>
                    <Flag className="mr-1 h-4 w-4" /> Report
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { if (!isAuthenticated) { requireAuth(); return; } setBlockOpen(true); }}>
                    <Shield className="mr-1 h-4 w-4" /> Block
                  </Button>

                </>
              )}
            </div>
          </div>

          {/* ── Metrics ── */}
          {isHost ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <StatCard
                icon={<Star className="h-4 w-4 text-yellow-500" />}
                label="Rating"
                value={p.average_rating ? p.average_rating.toFixed(1) : "—"}
                sub={p.reviews_count ? `${p.reviews_count} review${p.reviews_count !== 1 ? "s" : ""}` : "No reviews yet"}
              />
              <StatCard icon={<Compass className="h-4 w-4 text-primary" />} label="Trips hosted" value={String(p.trips_hosted ?? 0)} />
              <StatCard icon={<Users className="h-4 w-4 text-primary" />} label="Travelers hosted" value={String(p.travelers_hosted ?? 0)} />
              <StatCard icon={<Heart className="h-4 w-4 text-primary" />} label="Repeat travelers" value={String(p.repeat_travelers_count ?? 0)} />
              <StatCard icon={<Clock className="h-4 w-4 text-primary" />} label="Typical reply" value={responseLabel} />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <StatCard icon={<Compass className="h-4 w-4 text-primary" />} label="Trips joined" value={String(p.trips_joined ?? 0)} />
              <StatCard icon={<Star className="h-4 w-4 text-yellow-500" />} label="Reviews written" value={String(reviewsWritten.length)} />
            </div>
          )}


          {/* ── Curated Gallery (host only) — horizontal carousel ── */}
          {isHost && galleryPhotos.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 text-base font-semibold text-foreground">Gallery</h2>
              <HorizontalCarousel>
                {galleryPhotos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIndex(i)}
                    className="aspect-square w-[180px] shrink-0 overflow-hidden rounded-xl bg-muted transition-opacity hover:opacity-90 sm:w-[220px]"
                  >
                    <img src={url} alt="" className="h-full w-full object-cover object-center" loading="lazy" />
                  </button>
                ))}
              </HorizontalCarousel>
            </div>
          )}

          {/* ── Tabs ── */}
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v !== "trips") { setTripsExpanded(null); setTripsFilter("all"); } }} className="mt-8">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="trips">{isHost ? "Trips" : "Trips joined"}</TabsTrigger>
              <TabsTrigger value="reviews">{isHost ? "Reviews" : "Reviews written"}</TabsTrigger>
              {isHost && <TabsTrigger value="stories">Stories</TabsTrigger>}
            </TabsList>

            <TabsContent value="trips" className="mt-6 space-y-8">
              {(() => {
                const now = Date.now();
                const isPast = (t: TripData) => {
                  if (t.status === "completed") return true;
                  if (t.starts_at) return new Date(t.starts_at).getTime() < now;
                  return false;
                };
                const allTrips = [
                  ...tripsHosted.map(t => ({ trip: t, role: "hosted" as const })),
                  ...tripsJoined.map(t => ({ trip: t, role: "joined" as const })),
                ];
                const ts = (t: TripData) => (t.starts_at ? new Date(t.starts_at).getTime() : 0);
                const upcoming = allTrips
                  .filter(x => !isPast(x.trip))
                  .sort((a, b) => ts(a.trip) - ts(b.trip));
                const past = allTrips
                  .filter(x => isPast(x.trip))
                  .sort((a, b) => ts(b.trip) - ts(a.trip));

                if (allTrips.length === 0) {
                  return <EmptyState message={isHost ? "No trips hosted yet" : "No trips yet"} cta={isHost && isOwner ? { label: "Host your first trip", to: "/trips/new" } : undefined} />;
                }

                const renderCard = ({ trip: t, role }: { trip: TripData; role: "hosted" | "joined" }) => (
                  <TripCard key={`${role}-${t.id}`} trip={t} roleLabel={role === "hosted" ? "Hosted" : "Joined"} />
                );


                const renderSection = (
                  key: "upcoming" | "past",
                  title: string,
                  items: { trip: TripData; role: "hosted" | "joined" }[],
                ) => {
                  if (items.length === 0) return null;
                  const expanded = tripsExpanded === key;
                  const filtered = items.filter(x => tripsFilter === "all" ? true : x.role === tripsFilter);
                  return (
                    <div>
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                        {!expanded ? (
                          <button
                            onClick={() => { setTripsExpanded(key); setTripsFilter("all"); }}
                            className="text-sm font-medium text-primary hover:underline shrink-0"
                          >
                            See all
                          </button>
                        ) : (
                          <button
                            onClick={() => { setTripsExpanded(null); setTripsFilter("all"); }}
                            className="text-sm font-medium text-primary hover:underline shrink-0"
                          >
                            Show less
                          </button>
                        )}
                      </div>

                      {!expanded ? (
                        <HorizontalCarousel>
                          {items.map((x) => (
                            <div key={`${key}-c-${x.role}-${x.trip.id}`} className="w-[280px] shrink-0 sm:w-[320px]">
                              {renderCard(x)}
                            </div>
                          ))}
                        </HorizontalCarousel>
                      ) : (
                        <>
                          <div className="mb-4 flex flex-wrap gap-2">
                            {(["all", "hosted", "joined"] as const).map((f) => (
                              <button
                                key={f}
                                onClick={() => setTripsFilter(f)}
                                className={cn(
                                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                                  tripsFilter === f
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                                )}
                              >
                                {f === "all" ? "All" : f === "hosted" ? "Hosted" : "Joined"}
                              </button>
                            ))}
                          </div>
                          {filtered.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No trips match this filter.</p>
                          ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {filtered.map((x) => (
                                <div key={`${key}-g-${x.role}-${x.trip.id}`}>
                                  {renderCard(x)}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                };

                return (
                  <>
                    {renderSection("upcoming", "Upcoming trips", upcoming)}
                    {renderSection("past", "Past trips", past)}
                  </>
                );

              })()}
            </TabsContent>

            <TabsContent value="reviews" className="mt-6 space-y-6">
              {isHost && (
                <Card>
                  <CardContent className="space-y-2 p-4">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const pct = Number(reviewDistribution[String(star)] ?? 0);
                      return (
                        <div key={star} className="flex items-center gap-3 text-xs">
                          <span className="flex w-10 items-center gap-0.5 text-muted-foreground">
                            {star} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          </span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-yellow-400" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-10 text-right text-muted-foreground">{pct}%</span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {(() => {
                const all = (isHost ? reviewsReceived : reviewsWritten).slice();
                if (all.length === 0) {
                  return <EmptyState message={isHost ? "No reviews yet" : "No reviews written yet"} />;
                }
                all.sort((a, b) => {
                  if (reviewSort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  if (reviewSort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                  if (reviewSort === "highest") return b.rating - a.rating;
                  return a.rating - b.rating;
                });
                const totalPages = Math.max(1, Math.ceil(all.length / REVIEWS_PER_PAGE));
                const page = Math.min(reviewPage, totalPages);
                const pageItems = all.slice((page - 1) * REVIEWS_PER_PAGE, page * REVIEWS_PER_PAGE);

                return (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">{all.length} review{all.length !== 1 ? "s" : ""}</p>
                      <Select value={reviewSort} onValueChange={(v) => { setReviewSort(v as typeof reviewSort); setReviewPage(1); }}>
                        <SelectTrigger className="h-8 w-[160px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest first</SelectItem>
                          <SelectItem value="oldest">Oldest first</SelectItem>
                          <SelectItem value="highest">Highest rating</SelectItem>
                          <SelectItem value="lowest">Lowest rating</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-4">
                      {pageItems.map((r) => {
                        const isOwnReview = !!user?.username && r.author_username === user.username;
                        return (
                        <Card key={r.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-9 w-9 shrink-0">
                                <AvatarImage src={r.author_avatar_url} />
                                <AvatarFallback className="bg-accent text-xs text-accent-foreground">{r.author_display_name?.[0] ?? "?"}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">{r.author_display_name}</span>
                                  <div className="flex items-center gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                                    ))}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    · {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                  </span>
                                </div>
                                {r.headline && <p className="mt-1 text-sm font-semibold text-foreground">{r.headline}</p>}
                                <p className="mt-1 text-sm text-foreground/80">{r.body}</p>
                                {r.trip_title && r.trip_url && (
                                  <Link to={r.trip_url} className="mt-1.5 inline-block text-xs text-primary hover:underline">
                                    on {r.trip_title}
                                  </Link>
                                )}
                              </div>
                              {!isOwnReview && (
                                <button
                                  type="button"
                                  aria-label="Report review"
                                  title="Report"
                                  onClick={() => {
                                    const openReport = () => setReviewReport({
                                      type: "review",
                                      id: r.id,
                                      label: `Review by ${r.author_display_name || r.author_username || "member"}`,
                                      ownerUsername: r.author_username,
                                      ownerDisplayName: r.author_display_name,
                                    });
                                    if (!isAuthenticated) { requireAuth(openReport); return; }
                                    openReport();
                                  }}
                                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground shrink-0"
                                >
                                  <Flag className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                        );
                      })}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setReviewPage(p => Math.max(1, p - 1))}>
                          Previous
                        </Button>
                        <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                        <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setReviewPage(p => Math.min(totalPages, p + 1))}>
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                );
              })()}
            </TabsContent>

            {isHost && (
              <TabsContent value="stories" className="mt-6">
                {stories.length > 0 ? (
                  <HorizontalCarousel>
                    {stories.map((story) => (
                      <Link key={story.slug} to={`/stories/${story.slug}`} className="block w-[280px] shrink-0 sm:w-[320px]">
                        <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
                          {story.cover_image_url && (
                            <div className="relative aspect-[16/10] overflow-hidden">
                              <img src={story.cover_image_url} alt={story.title} className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105" />
                            </div>
                          )}
                          <CardContent className="p-4">
                            <h3 className="mb-1.5 line-clamp-2 text-base font-semibold leading-tight text-foreground group-hover:text-primary">{story.title}</h3>
                            {(story.short_description || story.excerpt) && (
                              <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{story.short_description || story.excerpt}</p>
                            )}
                            {story.created_at && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(story.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </HorizontalCarousel>
                ) : (
                  <EmptyState message="No stories shared yet" />
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && galleryPhotos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-primary-foreground" onClick={() => setLightboxIndex(null)}>
            <X className="h-5 w-5" />
          </button>
          <img src={galleryPhotos[lightboxIndex]} alt="" className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* ── Edit Profile Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your profile details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            {/* Avatar upload — saves immediately, independent of Save Changes */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarField.displayUrl || undefined} />
                  <AvatarFallback className="text-2xl bg-accent text-accent-foreground">
                    {editName?.[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <label className={cn(
                  "absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90",
                  avatarField.saving && "pointer-events-none opacity-70",
                )}>
                  {avatarField.saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={avatarField.saving}
                  />
                </label>
              </div>
              {avatarField.status === "saving" && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Uploading photo…
                </span>
              )}
              {avatarField.status === "saved" && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                  <Check className="h-3 w-3" /> Photo saved
                </span>
              )}
              {avatarField.status === "error" && (
                <span className="inline-flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" /> {avatarField.error || "Upload failed"}
                  <button type="button" onClick={avatarField.retry} className="ml-1 underline">Retry</button>
                </span>
              )}
              {avatarField.status === "idle" && (
                <p className="text-xs text-muted-foreground">Click camera to change photo (JPEG, PNG, or WebP, up to 2 MB)</p>
              )}
              {avatarUploadError && avatarField.status !== "error" && (
                <span className="text-xs text-destructive">{avatarUploadError}</span>
              )}
            </div>


            {/* Editable fields */}
            <div>
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>Location (City)</Label>
              <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="e.g. Mumbai" />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} maxLength={200} placeholder="A few words about you..." />
              <p className="mt-1 text-right text-xs text-muted-foreground">{editBio.length}/200</p>
            </div>

            {/* Travel tags */}
            <div>
              <Label>Travel Tags</Label>
              <p className="mb-2 text-xs text-muted-foreground">Select tags that describe your travel style</p>
              <div className="flex flex-wrap gap-2">
                {TRAVEL_TAG_OPTIONS.map(tag => (
                  <Badge
                    key={tag}
                    variant={editTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    {editTags.includes(tag) && <X className="ml-1 h-3 w-3" />}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Non-editable fields */}
            {(p.email || p.username) && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Non-editable</p>
                {p.email && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <Input value={p.email} disabled className="bg-muted text-muted-foreground" />
                  </div>
                )}
                {p.phone && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <Input value={p.phone} disabled className="bg-muted text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Username</Label>
                  <Input value={`@${p.username}`} disabled className="bg-muted text-muted-foreground" />
                </div>
              </div>
            )}

            <Button className="w-full" onClick={saveEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Settings Dialog ── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
            <DialogDescription>Manage your account preferences.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => { setSettingsOpen(false); setDeactivateOpen(true); }}
            >
              <PauseCircle className="h-4 w-4 text-muted-foreground" />
              Deactivate Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Deactivate Confirmation ── */}
      <Dialog open={deactivateOpen} onOpenChange={(v) => { setDeactivateOpen(v); if (!v) setDeactivateBlockers(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PauseCircle className="h-5 w-5 text-muted-foreground" />
              {deactivateBlockers ? "Resolve trip commitments first" : "Deactivate Account"}
            </DialogTitle>
            <DialogDescription>
              {deactivateBlockers
                ? "You have active trip commitments. Resolve each one before deactivating."
                : "Your profile, hosted trips, stories, and messages will be hidden. Signing back in reactivates your account."}
            </DialogDescription>
          </DialogHeader>
          {deactivateBlockers && deactivateBlockers.length > 0 && (
            <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
              {deactivateBlockers.map((b) => (
                <li key={b.trip_id} className="rounded-md border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{b.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.role === "host" ? "You're hosting" : "You're a traveler"}
                        {b.role === "host" && (b.pending_count != null || b.approved_count != null) && (
                          <> · {b.pending_count ?? 0} pending · {b.approved_count ?? 0} approved</>
                        )}
                        {b.role === "traveler" && b.status && <> · {b.status}</>}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const dest = (b as any).manage_url
                          || (b.role === "host" ? `/trips/${b.trip_id}/edit` : `/trips/${b.trip_id}`);
                        setDeactivateOpen(false); setDeactivateBlockers(null); navigate(dest);
                      }}
                    >
                      Manage
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setDeactivateOpen(false); setDeactivateBlockers(null); }}>
              {deactivateBlockers ? "Close" : "Cancel"}
            </Button>
            {!deactivateBlockers && (
              <Button variant="secondary" onClick={handleDeactivate} disabled={accountActionPending}>
                {accountActionPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Deactivate
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Block Confirmation ── */}
      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" /> Block {p?.display_name}?
            </DialogTitle>
            <DialogDescription>
              They won't be able to message you or start new conversations. Existing shared trips remain visible in read-only mode until they end. You can unblock anytime from Settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setBlockOpen(false)} disabled={blockPending}>Cancel</Button>
            <Button variant="destructive" onClick={handleBlock} disabled={blockPending}>
              {blockPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        target={p ? {
          type: "profile",
          id: p.username,
          label: `${p.display_name}'s profile`,
          ownerUsername: p.username,
          ownerDisplayName: p.display_name,
        } : null}
      />
      <ReportDialog
        open={!!reviewReport}
        onOpenChange={(o) => { if (!o) setReviewReport(null); }}
        target={reviewReport}
      />



      <Footer />
    </div>
  );
};

/* ─── Sub-components ────────────────────────────────────────────── */

function StatCard({
  icon, label, value, sub,
}: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card className="text-center">
      <CardContent className="flex flex-col items-center gap-1 py-4 px-3">
        {icon}
        <span className="text-xl font-bold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
        {sub && <span className="text-[10px] text-muted-foreground/70">{sub}</span>}
      </CardContent>
    </Card>
  );
}

function EmptyState({
  message, icon, cta,
}: { message: string; icon?: React.ReactNode; cta?: { label: string; to: string } }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon}
      <p className="text-sm text-muted-foreground">{message}</p>
      {cta && (
        <Button size="sm" variant="outline" asChild>
          <Link to={cta.to}>{cta.label}</Link>
        </Button>
      )}
    </div>
  );
}

export default Profile;
