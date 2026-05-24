import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { CommunityProfile } from "@/types/api";

interface TravelerCardProps {
  profile: CommunityProfile;
}

const TravelerCard = ({ profile: p }: TravelerCardProps) => {
  const navigate = useNavigate();
  const tags = (p.travel_tags || []).slice(0, 4);

  return (
    <button
      onClick={() => navigate(`/users/${p.username}`)}
      className="flex h-full w-full flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 text-left transition-shadow hover:shadow-md"
    >
      <div className="flex w-full items-center gap-3">
        <Avatar className="h-14 w-14 shrink-0">
          {p.avatar_url && <AvatarImage src={p.avatar_url} alt={p.display_name} />}
          <AvatarFallback className="bg-accent text-accent-foreground text-lg">
            {(p.display_name || p.username)[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{p.display_name}</p>
          <p className="text-xs text-muted-foreground">@{p.username}</p>
          {p.location && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.location}</p>
          )}
        </div>
      </div>
      {/* Bio — always reserve 2 lines so cards stay equal height */}
      <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-muted-foreground">
        {p.bio || "\u00A0"}
      </p>
      {/* Tags — always reserve a row */}
      <div className="mt-auto flex min-h-[1.25rem] w-full flex-wrap gap-1">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-[10px]">
            {tag}
          </Badge>
        ))}
      </div>
    </button>
  );
};

export default TravelerCard;
