import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, IndianRupee } from "lucide-react";
import type { TripData } from "@/types/api";

interface TripCardProps {
  trip: TripData;
}

const TripCard = ({ trip }: TripCardProps) => {
  const spotsLeft = trip.spots_left ?? (trip.total_seats || 0);

  return (
    <Link to={`/trips/${trip.id}`}>
      <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
        {trip.banner_image_url && (
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src={trip.banner_image_url}
              alt={trip.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {trip.trip_type && (
              <Badge className="absolute left-3 top-3 bg-primary/90 text-primary-foreground">
                {trip.trip_type}
              </Badge>
            )}
          </div>
        )}
        <CardContent className="p-4">
          <h3 className="mb-0.5 truncate text-lg font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">
            {trip.title}
          </h3>
          {trip.summary && (
            <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{trip.summary}</p>
          )}
          {trip.destination && (
            <div className="mb-2 flex items-center gap-1 text-sm text-muted-foreground truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{trip.destination}</span>
            </div>
          )}
          <div className="mb-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            {trip.starts_at && trip.ends_at && (
              <div className="flex items-center gap-1 truncate">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {new Date(trip.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(trip.ends_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            )}
            {trip.price_per_person != null && (
              <div className="flex items-center gap-1">
                <IndianRupee className="h-3.5 w-3.5 shrink-0" />
                {trip.price_per_person.toLocaleString()}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            {trip.spots_left != null && (
              <div className="flex items-center gap-1 text-sm">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className={spotsLeft <= 2 ? "font-medium text-destructive" : "text-muted-foreground"}>
                  {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
                </span>
              </div>
            )}
            {trip.host_display_name && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground truncate">
                <span className="truncate">{trip.host_display_name.split(" ")[0]}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default TripCard;
