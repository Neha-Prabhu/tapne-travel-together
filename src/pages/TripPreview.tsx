import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar, MapPin, Users, Clock, Star, CheckCircle2, XCircle,
  Hotel, Shield, HelpCircle, Backpack, DollarSign, Sparkles,
  Eye, Heart, Route, UserCircle, Globe, AlertTriangle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ", SGD: "S$", AUD: "A$", THB: "฿", IDR: "Rp",
};

const TripPreview = () => {
  const [data, setData] = useState<any>(null);
  const { user } = useAuth();

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
          <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
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

  const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const curr = CURRENCY_SYMBOLS[data.currency] || (data.currency ? data.currency + " " : "₹");
  const formatPrice = (val: string | number) => curr + Number(val).toLocaleString();

  const hasHighlights = data.highlights?.some((h: string) => h?.trim());
  const hasItinerary = data.itinerary?.some((d: any) => d.title?.trim());
  const hasIncluded = data.includedItems?.length > 0 && data.includedItems.some((i: string) => i?.trim());
  const hasNotIncluded = data.notIncludedItems?.length > 0 && data.notIncludedItems.some((i: string) => i?.trim());
  const hasThingsToCarry = data.thingsToCarry?.length > 0;
  const hasStays = data.stays?.some((s: any) => s.accommodationType || s.stayName);
  const hasFaqs = data.faqs?.some((f: any) => f.question?.trim());
  const hasSafety = data.cancellationPolicy?.trim() || data.codeOfConduct?.trim() || data.generalPolicy?.trim();
  const hasExperience = data.experienceLevel || data.fitnessLevel || data.suitableFor?.length > 0 || data.tripVibes?.length > 0;

  // Build quick nav sections dynamically
  const sections: { id: string; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Globe },
    ...(hasHighlights ? [{ id: "highlights", label: "Highlights", icon: Star }] : []),
    ...(hasItinerary ? [{ id: "itinerary", label: "Itinerary", icon: Route }] : []),
    ...(data.totalPrice ? [{ id: "pricing", label: "Pricing", icon: DollarSign }] : []),
    ...(hasStays ? [{ id: "stay", label: "Stay", icon: Hotel }] : []),
    ...(hasIncluded ? [{ id: "included", label: "Included", icon: CheckCircle2 }] : []),
    ...(hasNotIncluded ? [{ id: "not-included", label: "Not Included", icon: XCircle }] : []),
    ...(hasThingsToCarry ? [{ id: "carry", label: "Things to Carry", icon: Backpack }] : []),
    ...(hasExperience ? [{ id: "experience", label: "Experience & Vibe", icon: Heart }] : []),
    ...(hasSafety ? [{ id: "safety", label: "Safety & Policies", icon: Shield }] : []),
    ...(hasFaqs ? [{ id: "faqs", label: "FAQs", icon: HelpCircle }] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Preview banner */}
        <div className="border-b bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 text-center text-sm font-medium text-yellow-800 dark:text-yellow-200">
          <Eye className="mr-1.5 inline h-4 w-4" />
          Preview Mode — this is how your trip will look to travelers (not published)
        </div>

        {/* Hero */}
        <div className="relative">
          <div className="aspect-[21/9] max-h-[480px] w-full overflow-hidden sm:aspect-[3/1] bg-muted">
            <img
              src={data.heroImage || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80"}
              alt={data.title || "Trip"}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-6 md:pb-8">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {data.category && <Badge className="bg-primary text-primary-foreground">{data.category}</Badge>}
              {data.accessType && data.accessType !== "open" && (
                <Badge variant="outline" className="border-white/40 text-white">{data.accessType === "apply" ? "Apply to Join" : "Invite Only"}</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white md:text-4xl lg:text-5xl">{data.title || "Untitled Trip"}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/80">
              {data.destination && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{data.destination}</span>}
              {data.originCity && <span className="flex items-center gap-1"><Globe className="h-4 w-4" />From {data.originCity}</span>}
              {data.startDate && data.endDate && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{fmtDate(data.startDate)} – {fmtDate(data.endDate)}</span>}
              {duration > 0 && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{duration}D/{Math.max(0, duration - 1)}N</span>}
              {data.totalSeats && <span className="flex items-center gap-1"><Users className="h-4 w-4" />{data.totalSeats} seats</span>}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex gap-8">
            {/* Quick Nav Sidebar (desktop) */}
            <aside className="hidden w-48 shrink-0 lg:block">
              <div className="sticky top-24">
                <nav className="space-y-0.5 rounded-xl border bg-card p-2">
                  {sections.map(s => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          const el = document.getElementById(`preview-${s.id}`);
                          if (el) {
                            const top = el.getBoundingClientRect().top + window.scrollY - 120;
                            window.scrollTo({ top, behavior: "smooth" });
                          }
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{s.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Main Column */}
            <div className="min-w-0 flex-1 space-y-6">
              {/* Overview */}
              {data.summary && (
                <Card id="preview-overview">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2.5"><Globe className="h-4 w-4 text-primary" /><CardTitle className="text-lg">Overview</CardTitle></div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{data.summary}</p>
                    {data.description && <p className="mt-3 text-muted-foreground leading-relaxed">{data.description}</p>}
                  </CardContent>
                </Card>
              )}

              {/* Highlights */}
              {hasHighlights && (
                <Card id="preview-highlights">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2.5"><Star className="h-4 w-4 text-primary" /><CardTitle className="text-lg">Highlights</CardTitle></div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {data.highlights.filter((h: string) => h?.trim()).map((h: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span className="text-foreground">{h}</span></li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Itinerary */}
              {hasItinerary && (
                <Card id="preview-itinerary">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2.5"><Route className="h-4 w-4 text-primary" /><CardTitle className="text-lg">Itinerary</CardTitle></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.itinerary.filter((d: any) => d.title?.trim()).map((day: any, i: number) => (
                        <div key={i} className="rounded-lg border bg-card p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="font-semibold">Day {i + 1}</Badge>
                            {day.isFlexible && <Badge variant="outline" className="text-xs">Flexible</Badge>}
                          </div>
                          <h4 className="font-semibold text-foreground">{day.title}</h4>
                          {day.description && (
                            <div className="mt-2 text-sm text-muted-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: day.description }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pricing */}
              {data.totalPrice && (
                <Card id="preview-pricing">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2.5"><DollarSign className="h-4 w-4 text-primary" /><CardTitle className="text-lg">Pricing</CardTitle></div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline justify-between rounded-lg bg-primary/5 p-4">
                      <span className="font-medium text-foreground">Price per person</span>
                      <span className="text-2xl font-bold text-primary">{formatPrice(data.totalPrice)}</span>
                    </div>
                    {data.earlyBirdPrice && (
                      <div className="flex items-baseline justify-between rounded-lg border p-3">
                        <span className="text-sm text-muted-foreground">Early Bird Price</span>
                        <span className="font-semibold text-primary">{formatPrice(data.earlyBirdPrice)}</span>
                      </div>
                    )}
                    {data.paymentTerms === "partial" && data.advanceAmount && (
                      <p className="text-sm text-muted-foreground">Advance required: {formatPrice(data.advanceAmount)}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Stay */}
              {hasStays && (
                <Card id="preview-stay">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2.5"><Hotel className="h-4 w-4 text-primary" /><CardTitle className="text-lg">Stay & Accommodation</CardTitle></div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {data.stays.filter((s: any) => s.accommodationType || s.stayName).map((stay: any, i: number) => (
                      <div key={i} className="rounded-lg border p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          {stay.accommodationType && <Badge variant="secondary">{stay.accommodationType}</Badge>}
                          {stay.roomSharing && <Badge variant="outline">{stay.roomSharing}</Badge>}
                        </div>
                        {stay.stayName && <p className="font-medium text-foreground">{stay.stayName}</p>}
                        {stay.stayDescription && <div className="text-sm text-muted-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: stay.stayDescription }} />}
                        {stay.amenities?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {stay.amenities.map((a: string, ai: number) => <Badge key={ai} variant="outline" className="text-xs">{a}</Badge>)}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Included */}
              {hasIncluded && (
                <Card id="preview-included">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-primary" /><CardTitle className="text-lg">What's Included</CardTitle></div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {data.includedItems.filter((i: string) => i?.trim()).map((item: string, i: number) => (
                        <li key={i} className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /><span className="text-foreground">{item}</span></li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Not Included */}
              {hasNotIncluded && (
                <Card id="preview-not-included">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2.5"><XCircle className="h-4 w-4 text-destructive" /><CardTitle className="text-lg">Not Included</CardTitle></div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {data.notIncludedItems.filter((i: string) => i?.trim()).map((item: string, i: number) => (
                        <li key={i} className="flex items-center gap-2.5"><XCircle className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="text-foreground">{item}</span></li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Things to Carry */}
              {hasThingsToCarry && (
                <Card id="preview-carry">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2.5"><Backpack className="h-4 w-4 text-primary" /><CardTitle className="text-lg">Things to Carry</CardTitle></div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {data.thingsToCarry.map((item: string, i: number) => <Badge key={i} variant="secondary">{item}</Badge>)}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Experience & Vibe */}
              {hasExperience && (
                <Card id="preview-experience">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2.5"><Heart className="h-4 w-4 text-primary" /><CardTitle className="text-lg">Experience & Vibe</CardTitle></div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {data.experienceLevel && (
                        <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground mb-1">Experience Level</p><p className="font-medium text-foreground">{data.experienceLevel}</p></div>
                      )}
                      {data.fitnessLevel && (
                        <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground mb-1">Fitness Level</p><p className="font-medium text-foreground">{data.fitnessLevel}</p></div>
                      )}
                    </div>
                    {data.suitableFor?.length > 0 && (
                      <div><p className="text-sm text-muted-foreground mb-2">Suitable For</p><div className="flex flex-wrap gap-2">{data.suitableFor.map((s: string, i: number) => <Badge key={i} variant="secondary">{s}</Badge>)}</div></div>
                    )}
                    {data.tripVibes?.length > 0 && (
                      <div><p className="text-sm text-muted-foreground mb-2">Trip Vibe</p><div className="flex flex-wrap gap-2">{data.tripVibes.map((v: string, i: number) => <Badge key={i} variant="outline">{v}</Badge>)}</div></div>
                    )}
                    {data.ageRange && (
                      <p className="text-sm text-muted-foreground">Age preference: {data.ageRange[0]} – {data.ageRange[1]}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Safety & Policies */}
              {hasSafety && (
                <Card id="preview-safety">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2.5"><Shield className="h-4 w-4 text-primary" /><CardTitle className="text-lg">Safety & Policies</CardTitle></div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {data.codeOfConduct && (
                      <div><p className="text-sm font-medium text-foreground mb-1">Code of Conduct</p><div className="text-sm text-muted-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: data.codeOfConduct }} /></div>
                    )}
                    {data.generalPolicy && (
                      <div><p className="text-sm font-medium text-foreground mb-1">General Policy</p><div className="text-sm text-muted-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: data.generalPolicy }} /></div>
                    )}
                    {data.cancellationPolicy && (
                      <div><p className="text-sm font-medium text-foreground mb-1">Cancellation Policy</p><div className="text-sm text-muted-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: data.cancellationPolicy }} /></div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* FAQs */}
              {hasFaqs && (
                <Card id="preview-faqs">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2.5"><HelpCircle className="h-4 w-4 text-primary" /><CardTitle className="text-lg">FAQs</CardTitle></div>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {data.faqs.filter((f: any) => f.question?.trim()).map((faq: any, i: number) => (
                        <AccordionItem key={i} value={`faq-${i}`}>
                          <AccordionTrigger className="text-left text-foreground">{faq.question}</AccordionTrigger>
                          <AccordionContent>
                            <div className="text-muted-foreground prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Sidebar */}
            <aside className="hidden w-72 shrink-0 xl:block">
              <div className="sticky top-24 space-y-4">
                {/* Booking Card (disabled in preview) */}
                <Card>
                  <CardContent className="p-5 space-y-4">
                    {data.totalPrice && (
                      <div className="text-center">
                        <p className="text-3xl font-bold text-primary">{formatPrice(data.totalPrice)}</p>
                        <p className="text-sm text-muted-foreground">per person</p>
                      </div>
                    )}
                    <div className="space-y-2 text-sm">
                      {data.startDate && <div className="flex justify-between"><span className="text-muted-foreground">Dates</span><span className="font-medium text-foreground">{fmtDate(data.startDate)} – {fmtDate(data.endDate)}</span></div>}
                      {duration > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium text-foreground">{duration}D/{Math.max(0, duration - 1)}N</span></div>}
                      {data.totalSeats && <div className="flex justify-between"><span className="text-muted-foreground">Group Size</span><span className="font-medium text-foreground">{data.totalSeats} seats</span></div>}
                      {data.bookingCloseDate && <div className="flex justify-between"><span className="text-muted-foreground">Booking Closes</span><span className="font-medium text-foreground">{fmtDate(data.bookingCloseDate)}</span></div>}
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center text-sm text-muted-foreground">
                      Booking disabled in preview
                    </div>
                  </CardContent>
                </Card>

                {/* Host Card */}
                {user && (
                  <Card>
                    <CardContent className="p-5">
                      <h3 className="mb-3 text-sm font-semibold text-foreground">Meet Your Host</h3>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {(user.name || "H")[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          {user.bio && <p className="text-xs text-muted-foreground line-clamp-2">{user.bio}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TripPreview;