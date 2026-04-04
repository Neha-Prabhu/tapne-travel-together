import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const FinalCTA = () => (
  <section className="mx-auto max-w-6xl px-4 py-16 text-center">
    <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
      Find your kind of people
    </h2>
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button asChild size="lg" className="rounded-full">
        <Link to="/trips">Explore Trips</Link>
      </Button>
      <Button asChild variant="outline" size="lg" className="rounded-full">
        <Link to="/create-trip">Host a Trip</Link>
      </Button>
    </div>
  </section>
);

export default FinalCTA;
