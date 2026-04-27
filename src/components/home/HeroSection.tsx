import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/contexts/SearchContext";
import { Search, MapPin, Users, Map, MapPin as MapPinIcon } from "lucide-react";
import type { TripData } from "@/types/api";

interface HeroSectionProps {
  trips: TripData[];
  stats?: { travelers: number; trips_hosted: number; destinations: number };
}

const avatars = [
  "https://i.pravatar.cc/150?img=11",
  "https://i.pravatar.cc/150?img=5",
  "https://i.pravatar.cc/150?img=12",
  "https://i.pravatar.cc/150?img=9",
  "https://i.pravatar.cc/150?img=15",
];

const HeroSection = ({ trips, stats }: HeroSectionProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const searchResults = searchQuery.trim()
    ? trips
        .filter(
          (t) =>
            (t.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.destination || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/30 to-background px-4 py-20 md:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
          Find your kind of people.{" "}
          <span className="text-primary">Then travel.</span>
        </h1>
        <p className="mx-auto mb-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Join community-led trips with like-minded travelers.
        </p>

        {/* Social proof avatars */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex -space-x-2">
            {avatars.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="h-8 w-8 rounded-full border-2 border-background object-cover"
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            People are already traveling together
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative mx-auto max-w-xl">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-14 rounded-full border-2 border-primary/20 bg-card pl-12 pr-4 text-base shadow-lg transition-all focus:border-primary focus:shadow-xl"
            placeholder="Search trips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          />

          {searchFocused && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border bg-card p-2 shadow-xl">
              {searchResults.length === 0 && (
                <p className="px-3 py-4 text-center text-sm text-muted-foreground">No results found</p>
              )}
              {searchResults.map((t) => (
                <button
                  key={t.id}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted"
                  onMouseDown={() => navigate(`/trips/${t.id}`)}
                >
                  {t.banner_image_url && (
                    <img src={t.banner_image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{t.title}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {t.destination}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stats strip directly below search */}
        <div className="mx-auto mt-8 flex max-w-md flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">
              {stats ? `${stats.travelers.toLocaleString()}+` : "3,000+"}
            </span>
            travelers
          </div>
          <div className="flex items-center gap-1.5">
            <Map className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">
              {stats ? `${stats.trips_hosted}+` : "120+"}
            </span>
            trips hosted
          </div>
          <div className="flex items-center gap-1.5">
            <MapPinIcon className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">
              {stats ? `${stats.destinations}+` : "50+"}
            </span>
            destinations
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
