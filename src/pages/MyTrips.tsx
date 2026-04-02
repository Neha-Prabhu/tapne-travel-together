import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useDrafts } from "@/contexts/DraftContext";
import { apiGet } from "@/lib/api";
import type { TripData, MyTripsResponse } from "@/types/api";
import TripCard from "@/components/TripCard";
import {
  Plus, Edit, Trash2, Copy, MapPin, Calendar, FileText, Clock,
  AlertTriangle, Loader2
} from "lucide-react";

const MyTrips = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { drafts, deleteDraft, duplicateDraft, loading: draftsLoading } = useDrafts();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [publishedTrips, setPublishedTrips] = useState<TripData[]>([]);
  const [pastTrips, setPastTrips] = useState<TripData[]>([]);
  const [tabCounts, setTabCounts] = useState({ created: 0, joined: 0, past: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    if (!cfg?.api?.my_trips) { setLoading(false); return; }
    apiGet<MyTripsResponse>(cfg.api.my_trips)
      .then((data) => {
        const now = new Date();
        const published = data.trips.filter(t => !t.is_draft && t.is_published);
        const past = data.trips.filter(t => t.ends_at && new Date(t.ends_at) < now);
        setPublishedTrips(published);
        setPastTrips(past);
        setTabCounts(data.tab_counts || { created: 0, joined: 0, past: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    navigate("/login");
    return null;
  }

  const userDrafts = drafts.filter(d => d.status === "draft");

  const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const computeProgress = (d: typeof drafts[0]) => {
    let filled = 0;
    const total = 8;
    if (d.title) filled++;
    if (d.destination) filled++;
    if (d.category) filled++;
    if (d.startDate && d.endDate) filled++;
    if (d.formData?.totalPrice) filled++;
    if (d.formData?.highlights?.some((h: string) => h.trim())) filled++;
    if (d.formData?.itinerary?.some((i: any) => i.title?.trim())) filled++;
    if (d.formData?.cancellationPolicy) filled++;
    return Math.round((filled / total) * 100);
  };

  const handleDelete = async () => {
    if (deleteId != null) {
      await deleteDraft(deleteId);
      setDeleteId(null);
    }
  };

  const handleDuplicate = async (id: number) => {
    await duplicateDraft(id);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Trips</h1>
              <p className="mt-1 text-muted-foreground">Manage your drafts and published trips</p>
            </div>
            <Button onClick={() => navigate("/create-trip")}>
              <Plus className="mr-1.5 h-4 w-4" /> Create Trip
            </Button>
          </div>

          <Tabs defaultValue="drafts">
            <TabsList className="mb-6">
              <TabsTrigger value="drafts">
                Drafts {userDrafts.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{userDrafts.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="published">
                Published {publishedTrips.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{publishedTrips.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="past">Past Trips</TabsTrigger>
            </TabsList>

            {/* Drafts Tab */}
            <TabsContent value="drafts">
              {draftsLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : userDrafts.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">No drafts yet</h3>
                    <p className="text-muted-foreground text-sm mb-6">Start creating your first trip and it will appear here.</p>
                    <Button onClick={() => navigate("/create-trip")}>
                      <Plus className="mr-1.5 h-4 w-4" /> Create Your First Trip
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {userDrafts.map(draft => {
                    const progress = computeProgress(draft);
                    return (
                      <Card key={draft.id} className="overflow-hidden transition-shadow hover:shadow-md">
                        <CardContent className="p-0">
                          <div className="flex flex-col sm:flex-row">
                            <div className="flex-1 p-5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-lg font-semibold text-foreground truncate">
                                    {draft.title || "Untitled Trip"}
                                  </h3>
                                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                    {draft.destination && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" /> {draft.destination}
                                      </span>
                                    )}
                                    {draft.startDate && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" /> {formatDate(draft.startDate)}
                                      </span>
                                    )}
                                    {draft.category && (
                                      <Badge variant="outline" className="text-xs">{draft.category}</Badge>
                                    )}
                                  </div>
                                </div>
                                <Badge variant="secondary" className="shrink-0 text-xs">
                                  <Clock className="mr-1 h-3 w-3" /> {timeAgo(draft.lastEditedAt)}
                                </Badge>
                              </div>

                              <div className="mt-4">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                                  <span>Completion</span>
                                  <span>{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-1.5" />
                              </div>

                              <div className="mt-4 flex items-center gap-2">
                                <Button size="sm" onClick={() => navigate(`/create-trip?draft=${draft.id}`)}>
                                  <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit Draft
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDuplicate(draft.id)}>
                                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Duplicate
                                </Button>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(draft.id)}>
                                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Published Tab */}
            <TabsContent value="published">
              {loading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : publishedTrips.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">No published trips</h3>
                    <p className="text-muted-foreground text-sm">Publish a trip and it will show up here.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {publishedTrips.map(t => <TripCard key={t.id} trip={t} />)}
                </div>
              )}
            </TabsContent>

            {/* Past Trips Tab */}
            <TabsContent value="past">
              {loading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : pastTrips.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Calendar className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">No past trips</h3>
                    <p className="text-muted-foreground text-sm">Completed trips will appear here.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {pastTrips.map(t => <TripCard key={t.id} trip={t} />)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteId != null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Draft
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this draft? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyTrips;
