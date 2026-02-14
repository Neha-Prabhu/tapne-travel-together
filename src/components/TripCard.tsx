import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, IndianRupee } from "lucide-react";
import { Trip, getUserById } from "@/data/mockData";
import { format } from "date-fns";

interface TripCardProps {
  trip: Trip;
}

const TripCard = ({ trip }: TripCardProps) => {
  const host = getUserById(trip.hostId);
  const spotsLeft = trip.maxGroupSize - trip.participantIds.length;

  return (
    <Link to={`/trips/${trip.id}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={trip.coverImage}
            alt={trip.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <Badge className="absolute left-3 top-3 bg-primary/90 text-primary-foreground">
            {trip.tripType}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="mb-1 text-lg font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">
            {trip.title}
          </h3>
          <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {trip.destination}
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(trip.startDate), "MMM d")} – {format(new Date(trip.endDate), "MMM d")}
            </div>
            <div className="flex items-center gap-1">
              <IndianRupee className="h-3.5 w-3.5" />
              {trip.budget.toLocaleString()}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span className={spotsLeft <= 2 ? "font-medium text-destructive" : "text-muted-foreground"}>
                {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
              </span>
            </div>
            {host && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <img src={host.avatar} alt={host.name} className="h-5 w-5 rounded-full object-cover" />
                {host.name.split(" ")[0]}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default TripCard;
