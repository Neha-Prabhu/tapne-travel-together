import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trips, TRIP_TYPES, getUserById } from "@/data/mockData";
import { Search, MapPin, Calendar, Users, IndianRupee, ArrowRight } from "lucide-react";
import { format } from "date-fns";

const BrowseTrips = () => {
  const [searchParams] = useSearchParams();
  const destinationFilter = searchParams.get("destination") || "";

  const [search, setSearch] = useState(destinationFilter);
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    return trips
      .filter((t) => {
        const matchSearch = t.destination.toLowerCase().includes(search.toLowerCase()) ||
          t.title.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === "all" || t.tripType === typeFilter;
        return matchSearch && matchType;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [search, typeFilter]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Explore Trips</h1>
          <p className="mb-6 text-muted-foreground">Discover your next adventure with amazing people</p>

          <div className="mb-8 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search destinations or trips..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Trip type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {TRIP_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-xl font-medium text-foreground">No trips found</p>
              <p className="mt-2 text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="space-y-14">
              {filtered.map((trip) => {
                const host = getUserById(trip.hostId);
                const spotsLeft = trip.maxGroupSize - trip.participantIds.length;
                return (
                  <Link key={trip.id} to={`/trips/${trip.id}`}>
                    <Card className="group overflow-hidden transition-shadow hover:shadow-lg h-[200px] sm:h-[220px]">
                      <div className="flex h-full flex-col sm:flex-row">
                        {/* Left: Image */}
                        <div className="relative hidden sm:block sm:w-72 md:w-80 lg:w-96 h-full overflow-hidden shrink-0">
                          <img
                            src={trip.coverImage}
                            alt={trip.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <Badge className="absolute left-3 top-3 bg-primary/90 text-primary-foreground">
                            {trip.tripType}
                          </Badge>
                        </div>
                        {/* Right: Info */}
                        <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                          <div>
                            <h3 className="mb-1 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                              {trip.title}
                            </h3>
                            <div className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              {trip.destination}
                            </div>
                            <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                              {trip.summary || trip.description}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {trip.tripVibes?.slice(0, 3).map(v => (
                                <Badge key={v} variant="outline" className="text-xs">{v}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(new Date(trip.startDate), "MMM d")} – {format(new Date(trip.endDate), "MMM d")}
                              </span>
                              <span className="flex items-center gap-1">
                                <IndianRupee className="h-3.5 w-3.5" />
                                {trip.budget.toLocaleString()}
                              </span>
                              <span className={`flex items-center gap-1 ${spotsLeft <= 2 ? "font-medium text-destructive" : ""}`}>
                                <Users className="h-3.5 w-3.5" />
                                {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
                              </span>
                              {host && (
                                <span className="flex items-center gap-1.5">
                                  <img src={host.avatar} alt={host.name} className="h-5 w-5 rounded-full object-cover" />
                                  {host.name.split(" ")[0]}
                                </span>
                              )}
                            </div>
                            <Button variant="outline" size="sm" className="shrink-0">
                              View Details <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BrowseTrips;
