import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CommunityProfile } from "@/types/api";

interface CommunitySectionProps {
  profiles: CommunityProfile[];
}

const CommunitySection = ({ profiles }: CommunitySectionProps) => {
  if (!profiles.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <h2 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
        Travel with people like you
      </h2>
      <p className="mb-6 text-muted-foreground">Real people, real trips, real connections.</p>

      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        {profiles.map((p) => (
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
    </section>
  );
};

export default CommunitySection;
