import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TripCard from "@/components/TripCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trips } from "@/data/mockData";
import { ArrowRight, Compass, Users, MapPin } from "lucide-react";

const Index = () => {
  const featuredTrips = trips.slice(0, 6);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/30 to-background px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
              Find your kind of people.{" "}
              <span className="text-primary">Then travel.</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Join community-led trips with like-minded travelers. Discover adventures, make friends, and explore the world together.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="text-base transition-transform hover:scale-[1.03]">
                <Link to="/trips">
                  Explore Trips <Compass className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link to="/create-trip">Create a Trip</Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-4 text-center">
            {[
              { icon: MapPin, label: "Destinations", value: "25+" },
              { icon: Users, label: "Travelers", value: "500+" },
              { icon: Compass, label: "Trips Created", value: "80+" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <stat.icon className="h-5 w-5 text-primary" />
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Trips */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">Upcoming Trips</h2>
              <p className="mt-1 text-muted-foreground">Join a trip and start your next adventure</p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link to="/trips">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link to="/trips">View All Trips</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
