import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPatch } from "@/lib/api";
import type { TripData } from "@/types/api";
import TripCard from "@/components/TripCard";
import {
  MapPin, Edit, Loader2, Star, MessageCircle, Compass,
  Award, Users, Image as ImageIcon,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────── */

interface ProfileResponse {
  profile: {
    username: string;
    display_name: string;
    bio: string;
    location: string;
    website: string;
    avatar_url?: string;
    travel_tags?: string[];
    average_rating?: number;
    reviews_count?: number;
    trips_hosted?: number;
    travelers_hosted?: number;
    trips_joined?: number;
  };
  trips_hosted: TripData[];
  trips_joined: TripData[];
  reviews: ReviewItem[];
  gallery: string[];
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

/* ─── Component ─────────────────────────────────────────────────── */

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, isAuthenticated, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");

  // Determine if viewing own profile
  const isOwner = useMemo(() => {
    if (!user) return false;
    if (!userId) return true; // /profile with no id = own profile
    return String(user.id) === userId || user.username === userId;
  }, [user, userId]);

  // If /profile (no userId) and not logged in → redirect
  useEffect(() => {
    if (!userId && !isAuthenticated) {
      navigate("/login");
    }
  }, [userId, isAuthenticated, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    const profileId = userId || (user?.username ?? user?.id);
    if (!profileId) { setLoading(false); return; }

    const url = `${cfg.api.base}/profile/${profileId}/`;
    apiGet<ProfileResponse>(url)
      .then(setProfileData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, user]);

  const p = profileData?.profile;
  const isHost = (p?.trips_hosted ?? 0) > 0;

  const openEdit = () => {
    if (!p) return;
    setEditName(p.display_name);
    setEditBio(p.bio);
    setEditLocation(p.location);
    setEditOpen(true);
  };

  const saveEdit = () => {
    updateProfile({ name: editName, bio: editBio, location: editLocation });
    if (profileData && p) {
      setProfileData({
        ...profileData,
        profile: { ...p, display_name: editName, bio: editBio, location: editLocation },
      });
    }
    setEditOpen(false);
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
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Profile not found.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const reviews = profileData?.reviews ?? [];
  const gallery = profileData?.gallery ?? [];
  const tripsHosted = profileData?.trips_hosted ?? [];
  const tripsJoined = profileData?.trips_joined ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">

          {/* ── Profile Header ─────────────────────────────────── */}
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-6">
            <Avatar className="h-24 w-24 ring-4 ring-primary/20 sm:h-28 sm:w-28">
              <AvatarImage src={p.avatar_url} />
              <AvatarFallback className="text-3xl font-semibold bg-accent text-accent-foreground">
                {p.display_name?.[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-2xl font-bold text-foreground">{p.display_name}</h1>
                {isHost && (
                  <Badge variant="secondary" className="gap-1 text-xs font-medium">
                    <Award className="h-3 w-3" /> Host
                  </Badge>
                )}
              </div>

              {p.location && (
                <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground sm:justify-start">
                  <MapPin className="h-3.5 w-3.5" /> {p.location}
                </p>
              )}

              {p.bio && (
                <p className="max-w-md text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {p.bio}
                </p>
              )}

              {/* Travel tags */}
              {p.travel_tags && p.travel_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 justify-center sm:justify-start">
                  {p.travel_tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Trust & Stats ──────────────────────────────────── */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={<Star className="h-4 w-4 text-yellow-500" />}
              label="Rating"
              value={
                p.average_rating
                  ? `${p.average_rating.toFixed(1)}`
                  : "—"
              }
              sub={
                p.reviews_count
                  ? `${p.reviews_count} review${p.reviews_count !== 1 ? "s" : ""}`
                  : "Not enough reviews"
              }
            />
            {isHost && (
              <>
                <StatCard
                  icon={<Compass className="h-4 w-4 text-primary" />}
                  label="Trips Hosted"
                  value={String(p.trips_hosted ?? 0)}
                />
                <StatCard
                  icon={<Users className="h-4 w-4 text-primary" />}
                  label="Travelers Hosted"
                  value={String(p.travelers_hosted ?? 0)}
                />
              </>
            )}
            <StatCard
              icon={<Compass className="h-4 w-4 text-primary" />}
              label="Trips Joined"
              value={String(p.trips_joined ?? 0)}
            />
          </div>

          {/* ── Primary Actions ────────────────────────────────── */}
          <div className="mt-6 flex items-center justify-center gap-3 sm:justify-start">
            {isOwner ? (
              <Button variant="outline" size="sm" onClick={openEdit}>
                <Edit className="mr-1 h-4 w-4" /> Edit Profile
              </Button>
            ) : (
              <>
                <Button size="sm">
                  <MessageCircle className="mr-1 h-4 w-4" /> Message
                </Button>
                {isHost && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/trips?host=${p.username}`}>
                      <Compass className="mr-1 h-4 w-4" /> View Trips
                    </Link>
                  </Button>
                )}
              </>
            )}
          </div>

          {/* ── Tabs ───────────────────────────────────────────── */}
          <Tabs defaultValue="trips" className="mt-8">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="trips">Trips</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="experiences">Experiences</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
            </TabsList>

            {/* Trips */}
            <TabsContent value="trips" className="mt-6">
              {isHost && tripsHosted.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-4 text-lg font-semibold text-foreground">Trips Hosted</h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {tripsHosted.map((t) => (
                      <TripCard key={t.id} trip={t} />
                    ))}
                  </div>
                </div>
              )}

              {tripsJoined.length > 0 && (
                <div>
                  <h2 className="mb-4 text-lg font-semibold text-foreground">Trips Joined</h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {tripsJoined.map((t) => (
                      <TripCard key={t.id} trip={t} />
                    ))}
                  </div>
                </div>
              )}

              {tripsHosted.length === 0 && tripsJoined.length === 0 && (
                <EmptyState
                  message={isHost ? "No trips hosted yet" : "No trips yet"}
                  cta={isHost ? { label: "Host your first trip", to: "/create-trip" } : undefined}
                />
              )}
            </TabsContent>

            {/* Reviews */}
            <TabsContent value="reviews" className="mt-6">
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <Card key={r.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={r.reviewer_avatar} />
                            <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                              {r.reviewer_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{r.reviewer_name}</span>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">{r.trip_title}</p>
                            <p className="mt-1.5 text-sm text-foreground/80 line-clamp-3">{r.text}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState message="No reviews yet" />
              )}
            </TabsContent>

            {/* Experiences */}
            <TabsContent value="experiences" className="mt-6">
              <EmptyState message="No experiences shared yet" />
            </TabsContent>

            {/* Gallery */}
            <TabsContent value="gallery" className="mt-6">
              {gallery.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {gallery.map((url, i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-xl">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No photos yet" icon={<ImageIcon className="h-8 w-8 text-muted-foreground/40" />} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} />
            </div>
            <Button className="w-full" onClick={saveEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

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
