import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
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
          onClick={() => navigate("/travelers")}
        >
          View all <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        {profiles.slice(0, 10).map((p) => (
          <Link
            key={p.username}
            to={`/profile/${p.username}`}
            className="min-w-[180px] shrink-0"
          >
            <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
              <CardContent className="flex flex-col items-center p-5 text-center">
                <img
                  src={p.avatar_url || `https://ui-avatars.com/api/?name=${p.display_name}&background=2dd4bf&color=fff`}
                  alt={p.display_name}
                  className="mb-3 h-16 w-16 rounded-full object-cover ring-2 ring-primary/20 transition-transform group-hover:scale-105"
                />
                <p className="mb-2 text-sm font-semibold text-foreground">{p.display_name}</p>
                <div className="flex flex-wrap justify-center gap-1">
                  {(p.travel_tags || []).slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-4 text-center sm:hidden">
        <Button variant="outline" size="sm" onClick={() => navigate("/travelers")}>
          View all hosts
        </Button>
      </div>
    </section>
  );
};

export default CommunitySection;
