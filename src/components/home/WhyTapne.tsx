import { ShieldCheck, Users, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const items = [
  { icon: ShieldCheck, title: "Verified Travelers", desc: "Every traveler builds a verified profile with real reviews." },
  { icon: Users, title: "Community-Led Trips", desc: "Trips created and hosted by real people, not agencies." },
  { icon: Star, title: "Real Reviews", desc: "Honest ratings from travelers who've been on the trip." },
];

const WhyTapne = () => (
  <section className="bg-muted/30 py-14">
    <div className="mx-auto max-w-6xl px-4">
      <h2 className="mb-2 text-center text-2xl font-bold text-foreground md:text-3xl">
        Why Tapne?
      </h2>
      <p className="mb-8 text-center text-muted-foreground">Travel with confidence.</p>

      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <Card key={item.title} className="border-none bg-card shadow-sm">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-1 font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default WhyTapne;
