import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TravelerCard from "@/components/TravelerCard";
import { apiGet } from "@/lib/api";
import type { CommunityProfile, HomeResponse } from "@/types/api";
import { Loader2 } from "lucide-react";

const TravelHosts = () => {
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
          <h1 className="mb-8 text-3xl font-bold text-foreground">Travel Hosts</h1>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : profiles.length === 0 ? (
            <p className="py-20 text-center text-muted-foreground">No travelers found</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {profiles.map((p) => (
                <TravelerCard key={p.username} profile={p} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TravelHosts;
