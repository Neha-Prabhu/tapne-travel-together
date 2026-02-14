import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getTripById, getUserById } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, MapPin, IndianRupee, Users, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const TripDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const trip = getTripById(id || "");

  if (!trip) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center px-4">
          <h1 className="mb-2 text-2xl font-bold">Trip not found</h1>
          <p className="mb-4 text-muted-foreground">This trip may have been removed.</p>
          <Button asChild><Link to="/trips">Browse Trips</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const host = getUserById(trip.hostId);
  const spotsLeft = trip.maxGroupSize - trip.participantIds.length;
  const isFull = spotsLeft <= 0;
  const isJoined = user ? trip.participantIds.includes(user.id) : false;
  const isHost = user?.id === trip.hostId;

  const handleJoin = () => {
    if (!isAuthenticated) {
      toast.info("Please log in to join this trip");
      return;
    }
    toast.success("You've joined the trip! 🎉");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/trips"><ArrowLeft className="mr-1 h-4 w-4" /> Back to trips</Link>
          </Button>

          {/* Cover Image */}
          <div className="mb-6 overflow-hidden rounded-xl">
            <img src={trip.coverImage} alt={trip.title} className="aspect-[2/1] w-full object-cover" />
          </div>

          {/* Header */}
          <div className="mb-6">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/90 text-primary-foreground">{trip.tripType}</Badge>
              {isFull && <Badge variant="destructive">Full</Badge>}
            </div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">{trip.title}</h1>
            <div className="flex flex-wrap gap-4 text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{trip.destination}</span>
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{format(new Date(trip.startDate), "MMM d")} – {format(new Date(trip.endDate), "MMM d, yyyy")}</span>
              <span className="flex items-center gap-1"><IndianRupee className="h-4 w-4" />{trip.budget.toLocaleString()}</span>
              <span className="flex items-center gap-1"><Users className="h-4 w-4" />{spotsLeft} of {trip.maxGroupSize} spots left</span>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-[1fr_300px]">
            <div>
              {/* Description */}
              <section className="mb-8">
                <h2 className="mb-3 text-xl font-semibold text-foreground">About this trip</h2>
                <p className="leading-relaxed text-muted-foreground">{trip.description}</p>
              </section>

              {/* Participants */}
              <section>
                <h2 className="mb-3 text-xl font-semibold text-foreground">
                  Travelers ({trip.participantIds.length}/{trip.maxGroupSize})
                </h2>
                <div className="flex flex-wrap gap-3">
                  {trip.participantIds.map((pid) => {
                    const p = getUserById(pid);
                    if (!p) return null;
                    return (
                      <div key={pid} className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={p.avatar} />
                          <AvatarFallback>{p.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{p.name}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-4">
              {/* Host */}
              {host && (
                <div className="rounded-xl border bg-card p-4">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Hosted by</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={host.avatar} />
                      <AvatarFallback>{host.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{host.name}</p>
                      <p className="text-sm text-muted-foreground">{host.location}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Join */}
              <div className="rounded-xl border bg-card p-4">
                {isHost ? (
                  <p className="text-center text-sm text-muted-foreground">You're hosting this trip</p>
                ) : isJoined ? (
                  <Button disabled className="w-full">Already Joined ✓</Button>
                ) : !isAuthenticated ? (
                  <Button className="w-full transition-transform hover:scale-[1.02]" asChild>
                    <Link to="/login">Login to Join</Link>
                  </Button>
                ) : isFull ? (
                  <Button disabled className="w-full">Trip Full</Button>
                ) : (
                  <Button className="w-full transition-transform hover:scale-[1.02]" onClick={handleJoin}>
                    Join Trip
                  </Button>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TripDetail;
