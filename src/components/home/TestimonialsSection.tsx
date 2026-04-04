import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import type { TestimonialData } from "@/types/api";

interface TestimonialsSectionProps {
  testimonials: TestimonialData[];
}

const TestimonialsSection = ({ testimonials }: TestimonialsSectionProps) => {
  if (!testimonials.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <h2 className="mb-2 text-center text-2xl font-bold text-foreground md:text-3xl">
        What travelers say
      </h2>
      <p className="mb-8 text-center text-muted-foreground">Real stories from the Tapne community.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t) => (
          <Card key={t.id} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="mb-3 flex items-center gap-3">
                {t.user_avatar && (
                  <img src={t.user_avatar} alt={t.user_name} className="h-10 w-10 rounded-full object-cover" />
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.user_name}</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">"{t.text}"</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;
