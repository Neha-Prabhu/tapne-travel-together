import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TripCard from "@/components/TripCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trips, TRIP_TYPES } from "@/data/mockData";
import { Search } from "lucide-react";

const BrowseTrips = () => {
  const [search, setSearch] = useState("");
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
              <p className="mt-2 text-muted-foreground">Try adjusting your search or filters. Or be the first to create one!</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BrowseTrips;
