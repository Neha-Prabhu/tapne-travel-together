import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, BookOpen, Star, Users, Plus, ArrowRight } from "lucide-react";

const SECTIONS = [
  { to: "/dashboard/trips", label: "Trips", icon: MapPin, desc: "Manage trips you host and trips you've joined." },
  { to: "/dashboard/stories", label: "Stories", icon: BookOpen, desc: "Draft, publish, and review your travel stories." },
  { to: "/dashboard/reviews", label: "Reviews", icon: Star, desc: "See reviews from hosts and travelers." },
  { to: "/dashboard/subscriptions", label: "Subscriptions", icon: Users, desc: "Manage followers and people you follow." },
];

const DashboardOverview = () => {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold text-foreground">Welcome back, {firstName}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's your dashboard. Jump into a section below or start something new.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/trips/new"><Plus className="mr-1.5 h-4 w-4" />Create a trip</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/stories/new"><Plus className="mr-1.5 h-4 w-4" />Write a story</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to="/profile/edit">Edit profile</Link>
          </Button>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Manage</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <Link key={s.to} to={s.to} className="group">
                <Card className="transition-colors hover:border-primary/40 hover:bg-accent/30">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-4 w-4 text-primary" />{s.label}
                    </CardTitle>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </CardHeader>
                  <CardContent className="pt-0 text-sm text-muted-foreground">{s.desc}</CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default DashboardOverview;
