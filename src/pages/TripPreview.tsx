import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Calendar, MapPin, Users, Clock, Star, CheckCircle2, XCircle,
  Hotel, Shield, HelpCircle, Backpack, DollarSign, Sparkles,
  Eye, Loader2
} from "lucide-react";

const TripPreview = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("tapne_trip_preview");
    if (raw) {
      try { setData(JSON.parse(raw)); } catch {}
    }
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center px-4">
          <h1 className="mb-2 text-2xl font-bold text-foreground">No preview data</h1>
          <p className="text-muted-foreground">Save your draft first, then click Preview.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const duration = data.startDate && data.endDate
    ? Math.max(0, Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 86400000))
    : 0;

  const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="border-b bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 text-center text-sm font-medium text-yellow-800 dark:text-yellow-200">
          Preview Mode — this is how your trip will look
        </div>

        <div className="relative">
          <div className="aspect-[21/9] max-h-[480px] w-full overflow-hidden sm:aspect-[3/1] bg-muted">
            {(data.heroImage || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80") && (
              <img src={data.heroImage || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80"} alt={data.title} className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-6 md:pb-8">
            {data.category && <Badge className="bg-primary text-primary-foreground mb-2">{data.category}</Badge>}
            <h1 className="text-2xl font-bold text-white md:text-4xl lg:text-5xl">{data.title || "Untitled Trip"}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/80">
              {data.destination && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{data.destination}</span>}
              {data.startDate && data.endDate && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{fmtDate(data.startDate)} – {fmtDate(data.endDate)}</span>}
              {duration > 0 && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{duration}D/{Math.max(0, duration - 1)}N</span>}
              {data.totalSeats && <span className="flex items-center gap-1"><Users className="h-4 w-4" />{data.totalSeats} seats</span>}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
          {data.summary && (
            <Card>
              <CardHeader className="pb-3"><div className="flex items-center gap-2.5"><Eye className="h-4 w-4 text-primary" /><CardTitle className="text-lg">Overview</CardTitle></div></CardHeader>
              <CardContent><p className="text-muted-foreground leading-relaxed">{data.summary}</p></CardContent>
            </Card>
          )}

          {data.highlights?.some((h: string) => h.trim()) && (
            <Card>
              <CardHeader className="pb-3"><div className="flex items-center gap-2.5"><Star className="h-4 w-4 text-primary" /><CardTitle className="text-lg">Highlights</CardTitle></div></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.highlights.filter((h: string) => h.trim()).map((h: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{h}</span></li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {data.itinerary?.some((d: any) => d.title.trim()) && (
            <Card>
              <CardHeader className="pb-3"><div className="flex items-center gap-2.5"><Calendar className="h-4 w-4 text-primary" /><CardTitle className="text-lg">Itinerary</CardTitle></div></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.itinerary.filter((d: any) => d.title.trim()).map((day: any, i: number) => (
                    <div key={i} className="rounded-lg border bg-card p-4">
                      <h4 className="font-semibold text-foreground">Day {i + 1}: {day.title}</h4>
                      {day.description && <p className="mt-1 text-sm text-muted-foreground">{day.description}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data.totalPrice && (
            <Card>
              <CardHeader className="pb-3"><div className="flex items-center gap-2.5"><DollarSign className="h-4 w-4 text-primary" /><CardTitle className="text-lg">Pricing</CardTitle></div></CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between rounded-lg bg-primary/5 p-3">
                  <span className="font-medium">Price per person</span>
                  <span className="text-xl font-bold text-primary">₹{Number(data.totalPrice).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TripPreview;
