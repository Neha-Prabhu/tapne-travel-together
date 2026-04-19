import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const HostCTA = () => {
  const navigate = useNavigate();
  const { requireAuth } = useAuth();
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/40 to-background p-8 text-center md:p-12">
        <h2 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
          Got a trip idea? Host it.
        </h2>
        <p className="mb-6 text-muted-foreground">
          Find your people. We'll help you plan, manage, and host unforgettable trips.
        </p>
        <Button
          size="lg"
          className="rounded-full"
          onClick={() => requireAuth(() => navigate("/trips/new"))}
        >
          Create your trip <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
};

export default HostCTA;
