import { Users, Map, MapPin } from "lucide-react";

interface SocialProofStripProps {
  stats?: { travelers: number; trips_hosted: number; destinations: number };
}

const SocialProofStrip = ({ stats }: SocialProofStripProps) => {
  const items = [
    { icon: Users, value: `${((stats?.travelers ?? 3200) / 1000).toFixed(1).replace(/\.0$/, "")}k+`, label: "Travelers" },
    { icon: Map, value: `${stats?.trips_hosted ?? 127}+`, label: "Trips Hosted" },
    { icon: MapPin, value: `${stats?.destinations ?? 54}+`, label: "Destinations" },
  ];

  return (
    <section className="border-y bg-card py-8">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 px-4 md:gap-16">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SocialProofStrip;
