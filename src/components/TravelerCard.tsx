import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { CommunityProfile } from "@/types/api";

interface TravelerCardProps {
  profile: CommunityProfile;
}

const TravelerCard = ({ profile: p }: TravelerCardProps) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/profile/${p.username}`)}
      className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 text-left transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-3 w-full">
        <Avatar className="h-14 w-14 shrink-0">
          {p.avatar_url && <AvatarImage src={p.avatar_url} alt={p.display_name} />}
          <AvatarFallback className="bg-accent text-accent-foreground text-lg">
            {(p.display_name || p.username)[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{p.display_name}</p>
          <p className="text-xs text-muted-foreground">@{p.username}</p>
          {p.location && (
            <p className="mt-0.5 text-xs text-muted-foreground truncate">{p.location}</p>
          )}
        </div>
      </div>
      {p.bio && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {p.bio}
        </p>
      )}
      {p.travel_tags && p.travel_tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {p.travel_tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </button>
  );
};

export default TravelerCard;
