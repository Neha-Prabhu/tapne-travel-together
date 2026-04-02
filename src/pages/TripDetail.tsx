import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TripCard from "@/components/TripCard";
import BookingModal from "@/components/BookingModal";
import ApplicationModal from "@/components/ApplicationModal";
import ApplicationManager from "@/components/ApplicationManager";
import ReviewModal from "@/components/ReviewModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getTripById, getUserById, getSimilarTrips, getTripsByHost, getReviewsForTrip, getAverageRating, getTagsSummary } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar, MapPin, IndianRupee, Users, ArrowLeft, Clock, Star,
  CheckCircle2, XCircle, Hotel, Shield, HelpCircle, Backpack,
  DollarSign, Sparkles, Heart, UserCircle, Eye, Lock, Send,
  AlertTriangle, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Section nav items ───
const SECTIONS = [
  { id: "snapshot", label: "Overview" },
  { id: "highlights", label: "Highlights" },
  { id: "itinerary", label: "Itinerary" },
  { id: "stay", label: "Stay" },
  { id: "included", label: "Included" },
  { id: "pricing", label: "Pricing" },
  { id: "carry", label: "Packing" },
  { id: "policies", label: "Policies" },
  { id: "faqs", label: "FAQs" },
  { id: "reviews", label: "Reviews" },
  { id: "host", label: "Host" },
];

const TripDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const trip = getTripById(id || "");
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  if (!trip) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center px-4">
          <h1 className="mb-2 text-2xl font-bold">Trip not found</h1>
          <p className="mb-4 text-muted-foreground">This trip may have been removed.</p>
          <Button asChild><Link to="/trips">Browse Trips</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  const host = getUserById(trip.hostId);
  const spotsLeft = trip.maxGroupSize - trip.participantIds.length;
  const isFull = spotsLeft <= 0;
  const isJoined = user ? trip.participantIds.includes(user.id) : false;
  const isHost = user?.id === trip.hostId;
  const accessType = trip.accessType || "open";
  const duration = Math.max(0, Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000));
  const hostTripsCount = host ? getTripsByHost(host.id).length : 0;
  const similarTrips = getSimilarTrips(trip, 3);
  const price = trip.pricePerPerson || trip.budget;

  const handleAction = () => {
    if (!isAuthenticated) { toast.info("Please log in first"); return; }
    if (accessType === "apply") { setApplyModalOpen(true); return; }
    if (accessType === "invite") { toast.info("This trip is invite-only. Request sent to host!"); return; }
    setBookingModalOpen(true);
  };

  const ctaLabel = isHost ? "Manage Trip" : isJoined ? "Already Joined ✓" : isFull ? "Join Waitlist" :
    accessType === "apply" ? "Apply to Join" : accessType === "invite" ? "Request Invite" : "Book Now";
  const ctaDisabled = isJoined;

  // ─── Sticky CTA Card (desktop sidebar) ───
  const BookingSidebar = () => (
    <div className="space-y-4">
      <Card className="border-primary/20 shadow-md">
        <CardContent className="p-5">
          <div className="mb-1 text-sm text-muted-foreground">Price per person</div>
          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">₹{price.toLocaleString()}</span>
            {trip.earlyBirdPrice && (
              <Badge variant="secondary" className="text-xs">Early bird: ₹{trip.earlyBirdPrice.toLocaleString()}</Badge>
            )}
          </div>
          {trip.paymentTerms === "partial" && trip.advanceAmount && (
            <p className="mb-3 text-xs text-muted-foreground">Advance: ₹{trip.advanceAmount.toLocaleString()} to confirm</p>
          )}

          <div className="mb-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Dates</span>
              <span className="font-medium">{format(new Date(trip.startDate), "MMM d")} – {format(new Date(trip.endDate), "MMM d")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{duration}D / {Math.max(0, duration - 1)}N</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Spots left</span>
              <span className={cn("font-medium", spotsLeft <= 3 ? "text-destructive" : "text-foreground")}>{spotsLeft} of {trip.maxGroupSize}</span>
            </div>
            {trip.bookingCloseDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Book before</span>
                <span className="font-medium">{format(new Date(trip.bookingCloseDate), "MMM d, yyyy")}</span>
              </div>
            )}
          </div>

          {spotsLeft <= 3 && spotsLeft > 0 && (
            <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Only {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
            </div>
          )}

          <Button
            className="w-full text-base transition-transform hover:scale-[1.02]"
            size="lg"
            disabled={ctaDisabled}
            onClick={isHost ? () => {} : handleAction}
            asChild={isHost ? true : undefined}
          >
            {isHost ? <Link to="/create-trip">{ctaLabel}</Link> : <span>{ctaLabel}</span>}
          </Button>

          {!isAuthenticated && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline">Log in</Link> to continue
            </p>
          )}
        </CardContent>
      </Card>

      {/* Host mini card */}
      {host && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Hosted by</p>
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 border-2 border-primary/20">
                <AvatarImage src={host.avatar} />
                <AvatarFallback>{host.name[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{host.name}</p>
                <p className="text-xs text-muted-foreground">{hostTripsCount} trip{hostTripsCount !== 1 ? "s" : ""} hosted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // ─── Section Component ───
  const Section = ({ id, icon: Icon, title, children }: { id: string; icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <section id={id} className="scroll-mt-24">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* ─── HERO ─── */}
        <div className="relative">
          <div className="aspect-[21/9] max-h-[480px] w-full overflow-hidden sm:aspect-[3/1]">
            <img src={trip.coverImage} alt={trip.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-6 md:pb-8">
            <Button variant="ghost" size="sm" asChild className="mb-3 text-white/80 hover:text-white hover:bg-white/10">
              <Link to="/trips"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link>
            </Button>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className="bg-primary text-primary-foreground">{trip.tripType}</Badge>
              {trip.tripVibes?.map(v => (
                <Badge key={v} variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">{v}</Badge>
              ))}
              {accessType === "invite" && <Badge variant="outline" className="border-white/40 text-white text-xs"><Lock className="mr-1 h-3 w-3" />Invite Only</Badge>}
            </div>
            <h1 className="text-2xl font-bold text-white md:text-4xl lg:text-5xl">{trip.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/80 md:text-base">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{trip.destination}</span>
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{format(new Date(trip.startDate), "MMM d")} – {format(new Date(trip.endDate), "MMM d, yyyy")}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{duration}D/{Math.max(0, duration - 1)}N</span>
              <span className="flex items-center gap-1"><Users className="h-4 w-4" />{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</span>
            </div>
          </div>
        </div>

        {/* ─── Section Nav (horizontal scroll) ─── */}
        <div className="sticky top-16 z-20 border-b bg-card/95 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl">
            <nav className="flex gap-1 overflow-x-auto px-4 py-1.5 no-scrollbar">
              {SECTIONS.map(s => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* ─── BODY ─── */}
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex gap-8">
            {/* Main Content */}
            <div className="min-w-0 flex-1 space-y-5">

              {/* 2. Quick Snapshot */}
              <Section id="snapshot" icon={Eye} title="Quick Overview">
                <p className="mb-4 text-muted-foreground leading-relaxed">{trip.summary || trip.description}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {trip.suitableFor && trip.suitableFor.length > 0 && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-0.5">Ideal for</p>
                      <p className="text-sm font-medium">{trip.suitableFor.join(", ")}</p>
                    </div>
                  )}
                  {trip.experienceLevel && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-0.5">Experience</p>
                      <p className="text-sm font-medium">{trip.experienceLevel}</p>
                    </div>
                  )}
                  {trip.fitnessLevel && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-0.5">Fitness</p>
                      <p className="text-sm font-medium">{trip.fitnessLevel}</p>
                    </div>
                  )}
                  {trip.accommodationType && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-0.5">Stay type</p>
                      <p className="text-sm font-medium">{trip.accommodationType}</p>
                    </div>
                  )}
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">Group size</p>
                    <p className="text-sm font-medium">Max {trip.maxGroupSize} travelers</p>
                  </div>
                  {trip.bookingCloseDate && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-0.5">Book before</p>
                      <p className="text-sm font-medium">{format(new Date(trip.bookingCloseDate), "MMM d, yyyy")}</p>
                    </div>
                  )}
                </div>
              </Section>

              {/* 3. Highlights */}
              {trip.highlights && trip.highlights.length > 0 && (
                <Section id="highlights" icon={Star} title="Highlights">
                  <ul className="space-y-2.5">
                    {trip.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-foreground">{h}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* 4. Itinerary */}
              {trip.itinerary && trip.itinerary.length > 0 && (
                <Section id="itinerary" icon={Calendar} title="Day-by-Day Itinerary">
                  {/* Desktop: timeline */}
                  <div className="hidden md:block">
                    <div className="relative border-l-2 border-primary/20 pl-6 space-y-6">
                      {trip.itinerary.map((day, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[33px] flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {i + 1}
                          </div>
                          <div className="rounded-lg border bg-card p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-foreground">Day {i + 1}: {day.title}</h4>
                              {day.isFlexible && <Badge variant="outline" className="text-xs">Flexible</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{day.description}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              {day.stay && <span>🏨 {day.stay}</span>}
                              {day.meals && <span>🍽 {day.meals}</span>}
                              {day.activities && <span>🎯 {day.activities}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Mobile: accordion */}
                  <div className="md:hidden">
                    <Accordion type="single" collapsible>
                      {trip.itinerary.map((day, i) => (
                        <AccordionItem key={i} value={`day-${i}`}>
                          <AccordionTrigger className="text-sm">
                            <span className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{i + 1}</span>
                              Day {i + 1}: {day.title}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-sm text-muted-foreground mb-2">{day.description}</p>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              {day.stay && <p>🏨 {day.stay}</p>}
                              {day.meals && <p>🍽 {day.meals}</p>}
                              {day.activities && <p>🎯 {day.activities}</p>}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </Section>
              )}

              {/* 5. Stay */}
              {(trip.accommodationType || trip.stayDescription) && (
                <Section id="stay" icon={Hotel} title="Stay & Accommodation">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {trip.accommodationType && <Badge variant="secondary">{trip.accommodationType}</Badge>}
                      {trip.roomSharing && <Badge variant="outline">{trip.roomSharing}</Badge>}
                    </div>
                    {trip.stayName && <p className="font-medium text-foreground">{trip.stayName}</p>}
                    {trip.stayDescription && <p className="text-sm text-muted-foreground leading-relaxed">{trip.stayDescription}</p>}
                    {trip.amenities && trip.amenities.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Amenities</p>
                        <div className="flex flex-wrap gap-2">
                          {trip.amenities.map(a => (
                            <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {/* 6 & 7. Included / Not Included */}
              {(trip.includedItems || trip.notIncludedItems) && (
                <section id="included" className="scroll-mt-24">
                  <div className="grid gap-5 sm:grid-cols-2">
                    {trip.includedItems && trip.includedItems.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            </div>
                            <CardTitle className="text-lg">What's Included</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {trip.includedItems.map((item, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                    {trip.notIncludedItems && trip.notIncludedItems.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                              <XCircle className="h-4 w-4 text-destructive" />
                            </div>
                            <CardTitle className="text-lg">Not Included</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {trip.notIncludedItems.map((item, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <XCircle className="h-4 w-4 shrink-0 text-destructive/60" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </section>
              )}

              {/* 8. Price Breakdown */}
              <Section id="pricing" icon={DollarSign} title="Price Breakdown">
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between rounded-lg bg-primary/5 p-3">
                    <span className="font-medium">Total price per person</span>
                    <span className="text-xl font-bold text-primary">₹{price.toLocaleString()}</span>
                  </div>
                  {trip.earlyBirdPrice && (
                    <div className="flex items-center justify-between rounded-lg bg-accent/50 p-3 text-sm">
                      <span>Early bird price</span>
                      <span className="font-semibold text-accent-foreground">₹{trip.earlyBirdPrice.toLocaleString()}</span>
                    </div>
                  )}
                  {trip.paymentTerms === "partial" && trip.advanceAmount && (
                    <div className="flex items-center justify-between p-3 text-sm border rounded-lg">
                      <span className="text-muted-foreground">Advance to confirm</span>
                      <span className="font-medium">₹{trip.advanceAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {trip.breakdown && (
                    <Accordion type="single" collapsible>
                      <AccordionItem value="breakdown">
                        <AccordionTrigger className="text-sm">Cost breakdown</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 text-sm">
                            {Object.entries(trip.breakdown).filter(([, v]) => v && v !== "0").map(([key, val]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize text-muted-foreground">{key}</span>
                                <span className="font-medium">₹{Number(val).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                  {(trip.flightCostRange || trip.optionalActivitiesCost || trip.bufferBudget) && (
                    <div className="border-t pt-3 mt-2">
                      <p className="text-sm font-medium mb-2 text-muted-foreground">Estimated extra expenses</p>
                      <div className="space-y-1.5 text-sm">
                        {trip.flightCostRange && <div className="flex justify-between"><span className="text-muted-foreground">Flights</span><span>{trip.flightCostRange}</span></div>}
                        {trip.optionalActivitiesCost && <div className="flex justify-between"><span className="text-muted-foreground">Optional activities</span><span>{trip.optionalActivitiesCost}</span></div>}
                        {trip.bufferBudget && <div className="flex justify-between"><span className="text-muted-foreground">Buffer budget</span><span>{trip.bufferBudget}</span></div>}
                      </div>
                    </div>
                  )}
                </div>
              </Section>

              {/* 9. Things to Carry */}
              {trip.thingsToCarry && trip.thingsToCarry.length > 0 && (
                <Section id="carry" icon={Backpack} title="Things to Carry">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {trip.thingsToCarry.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* 10 & 11. Policies & Safety */}
              {(trip.cancellationPolicy || trip.codeOfConduct || trip.medicalDeclaration) && (
                <Section id="policies" icon={Shield} title="Policies & Safety">
                  <div className="space-y-4">
                    {trip.cancellationPolicy && (
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Cancellation Policy</h4>
                        <p className="text-sm text-muted-foreground">{trip.cancellationPolicy}</p>
                      </div>
                    )}
                    {trip.codeOfConduct && (
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Code of Conduct</h4>
                        <p className="text-sm text-muted-foreground">{trip.codeOfConduct}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {trip.medicalDeclaration && <Badge variant="outline" className="text-xs">Medical declaration required</Badge>}
                      {trip.emergencyContact && <Badge variant="outline" className="text-xs">Emergency contact required</Badge>}
                    </div>
                  </div>
                </Section>
              )}

              {/* 12. FAQs */}
              {trip.faqs && trip.faqs.length > 0 && (
                <Section id="faqs" icon={HelpCircle} title="Frequently Asked Questions">
                  <Accordion type="single" collapsible>
                    {trip.faqs.map((faq, i) => (
                      <AccordionItem key={i} value={`faq-${i}`}>
                        <AccordionTrigger className="text-sm text-left">{faq.question}</AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm text-muted-foreground">{faq.answer}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Section>
              )}

              {/* 13. Host */}
              {host && (
                <Section id="host" icon={UserCircle} title="Meet Your Host">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/20">
                      <AvatarImage src={host.avatar} />
                      <AvatarFallback className="text-lg">{host.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-foreground">{host.name}</h4>
                      <p className="text-sm text-muted-foreground mb-1">{host.location}</p>
                      <p className="text-sm text-muted-foreground mb-2">{host.bio}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{hostTripsCount} trip{hostTripsCount !== 1 ? "s" : ""} hosted</span>
                        {trip.contactPreference && (
                          <span>Contact: {trip.contactPreference}</span>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="mt-3" asChild>
                        <Link to="/profile">View Profile</Link>
                      </Button>
                    </div>
                  </div>
                </Section>
              )}

              {/* Host Application Management */}
              {isHost && accessType === "apply" && (
                <ApplicationManager trip={trip} />
              )}

              {/* 14. Participants */}
              <section className="scroll-mt-24">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle className="text-lg">
                          Travelers ({trip.participantIds.length}/{trip.maxGroupSize})
                        </CardTitle>
                      </div>
                      {trip.participantIds.length > 1 && (
                        <Badge variant="secondary" className="text-xs">{trip.participantIds.length} joined</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {trip.participantIds.map((pid) => {
                        const p = getUserById(pid);
                        if (!p) return null;
                        return (
                          <div key={pid} className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={p.avatar} />
                              <AvatarFallback className="text-xs">{p.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{p.name}</span>
                            {pid === trip.hostId && <Badge variant="outline" className="text-[10px] h-4 px-1.5">Host</Badge>}
                          </div>
                        );
                      })}
                      {Array.from({ length: spotsLeft }).map((_, i) => (
                        <div key={`empty-${i}`} className="flex items-center gap-2 rounded-full border border-dashed border-border px-3 py-1.5">
                          <div className="h-7 w-7 rounded-full bg-muted" />
                          <span className="text-sm text-muted-foreground">Open spot</span>
                        </div>
                      )).slice(0, 4)}
                      {spotsLeft > 4 && (
                        <div className="flex items-center px-2 text-sm text-muted-foreground">+{spotsLeft - 4} more spots</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* 15. Similar Trips */}
              {similarTrips.length > 0 && (
                <section className="scroll-mt-24">
                  <h2 className="text-xl font-bold text-foreground mb-4">Similar Trips</h2>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {similarTrips.map(t => <TripCard key={t.id} trip={t} />)}
                  </div>
                </section>
              )}
            </div>

            {/* ─── Sticky Sidebar (desktop) ─── */}
            <aside className="hidden w-[320px] shrink-0 lg:block">
              <div className="sticky top-32">
                <BookingSidebar />
              </div>
            </aside>
          </div>
        </div>

        {/* ─── Mobile Sticky CTA ─── */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 p-3 backdrop-blur-sm lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-lg font-bold text-foreground">₹{price.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground ml-1">/ person</span>
            </div>
            <Button
              size="lg"
              disabled={ctaDisabled}
              onClick={isHost ? undefined : handleAction}
              className="transition-transform hover:scale-[1.02]"
            >
              {ctaLabel}
            </Button>
          </div>
        </div>
        {/* spacer for mobile sticky CTA */}
        <div className="h-20 lg:hidden" />
      </main>
      <Footer />

      {/* Booking Modal */}
      <BookingModal open={bookingModalOpen} onOpenChange={setBookingModalOpen} trip={trip} />
      {/* Application Modal */}
      <ApplicationModal open={applyModalOpen} onOpenChange={setApplyModalOpen} trip={trip} />
    </div>
  );
};

export default TripDetail;
