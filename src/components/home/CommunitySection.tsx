import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import TravelerCard from "@/components/TravelerCard";
import type { CommunityProfile } from "@/types/api";

interface CommunitySectionProps {
  profiles: CommunityProfile[];
}

const CommunitySection = ({ profiles }: CommunitySectionProps) => {
  const navigate = useNavigate();

  if (!profiles.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">
            Travel Hosts
          </h2>
          <p className="mt-1 text-muted-foreground">Meet the people leading community trips.</p>
        </div>
        <Button
          variant="ghost"
          className="hidden sm:flex"
          onClick={() => navigate("/travel-hosts")}
        >
          View all <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {profiles.slice(0, 8).map((p) => (
          <TravelerCard key={p.username} profile={p} />
        ))}
      </div>

      <div className="mt-4 text-center sm:hidden">
        <Button variant="outline" size="sm" onClick={() => navigate("/travel-hosts")}>
          View all hosts
        </Button>
      </div>
    </section>
  );
};

export default CommunitySection;
