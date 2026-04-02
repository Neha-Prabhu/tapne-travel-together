import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet } from "@/lib/api";
import type { ProfileData, TripData, MyTripsResponse } from "@/types/api";
import TripCard from "@/components/TripCard";
import { MapPin, Edit, Loader2 } from "lucide-react";

const Profile = () => {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");

  const [createdTrips, setCreatedTrips] = useState<TripData[]>([]);
  const [joinedTrips, setJoinedTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    if (!cfg?.api?.my_trips) { setLoading(false); return; }
    apiGet<MyTripsResponse>(cfg.api.my_trips)
      .then((data) => {
        // Split by tab or by is_draft
        const created = data.trips.filter(t => !t.is_draft && t.can_manage);
        const joined = data.trips.filter(t => !t.is_draft && !t.can_manage);
        setCreatedTrips(created);
        setJoinedTrips(joined);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    navigate("/login");
    return null;
  }

  const openEdit = () => {
    setEditName(user.name);
    setEditBio(user.bio);
    setEditLocation(user.location);
    setEditOpen(true);
  };

  const saveEdit = () => {
    updateProfile({ name: editName, bio: editBio, location: editLocation });
    setEditOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8">
          {/* Profile Header */}
          <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20 ring-4 ring-primary/20">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
              {user.location && (
                <p className="mt-1 flex items-center justify-center gap-1 text-muted-foreground sm:justify-start">
                  <MapPin className="h-4 w-4" /> {user.location}
                </p>
              )}
              {user.bio && <p className="mt-2 max-w-md text-muted-foreground">{user.bio}</p>}
            </div>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={openEdit}>
                  <Edit className="mr-1 h-4 w-4" /> Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div><Label>Name</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
                  <div><Label>Location</Label><Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} /></div>
                  <div><Label>Bio</Label><Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} /></div>
                  <Button className="w-full" onClick={saveEdit}>Save Changes</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="created">
            <TabsList className="mb-6">
              <TabsTrigger value="created">Trips Created ({createdTrips.length})</TabsTrigger>
              <TabsTrigger value="joined">Trips Joined ({joinedTrips.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="created">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : createdTrips.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">You haven't created any trips yet.</p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{createdTrips.map((t) => <TripCard key={t.id} trip={t} />)}</div>
              )}
            </TabsContent>
            <TabsContent value="joined">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : joinedTrips.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">You haven't joined any trips yet.</p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{joinedTrips.map((t) => <TripCard key={t.id} trip={t} />)}</div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
