import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface CommunityProfile {
  username: string;
  display_name: string;
  avatar_url?: string;
  travel_tags?: string[];
  location?: string;
  bio?: string;
}

interface HomeResponse {
  community_profiles?: CommunityProfile[];
}

const Travelers = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<CommunityProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cfg = window.TAPNE_RUNTIME_CONFIG;
    if (!cfg?.api?.home) { setLoading(false); return; }
    apiGet<HomeResponse>(cfg.api.home)
      .then((data) => setProfiles(data.community_profiles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="mb-8 text-3xl font-bold text-foreground">Travelers</h1>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : profiles.length === 0 ? (
            <p className="py-20 text-center text-muted-foreground">No travelers found</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {profiles.map((p) => (
                <button
                  key={p.username}
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
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Travelers;
