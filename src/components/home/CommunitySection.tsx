import TravelerCard from "@/components/TravelerCard";
import type { CommunityProfile } from "@/types/api";

interface CommunitySectionProps {
  profiles: CommunityProfile[];
}

const CommunitySection = ({ profiles }: CommunitySectionProps) => {
  if (!profiles.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">
          Travel Hosts
        </h2>
        <p className="mt-1 text-muted-foreground">Meet the people leading community trips.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {profiles.slice(0, 8).map((p) => (
          <TravelerCard key={p.username} profile={p} />
        ))}
      </div>
    </section>
  );
};

export default CommunitySection;
