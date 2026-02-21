import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Loader2, Plus, Trash2, GripVertical, MapPin, Calendar, Users, DollarSign,
  Image, Star, Route, Hotel, CheckCircle2, XCircle, ShoppingBag, Backpack,
  Heart, Shield, HelpCircle, UserCircle, ChevronDown, ChevronUp, Eye, Save,
  Send, Info, Sparkles, Mountain, Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── CONSTANTS ───────────────────────────────────────────────
const TRIP_CATEGORIES = [
  "Backpacking", "Luxury", "Trek", "Social", "Wellness", "Workation", "Roadtrip"
];

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "THB", "IDR"];

const ACCOMMODATION_TYPES = ["Hotel", "Hostel", "Homestay", "Camping", "Mixed"];
const ROOM_SHARING_TYPES = ["Twin Sharing", "Triple Sharing", "Dorm", "Private"];

const AMENITIES = ["WiFi", "Hot Water", "AC", "Breakfast", "Parking", "Pool", "Power Backup", "Laundry", "Kitchen", "Locker"];

const EXPERIENCE_LEVELS = ["Beginner", "Moderate", "Advanced"];
const FITNESS_LEVELS = ["Low", "Moderate", "High", "Extreme"];

const TRIP_VIBES = ["Chill", "Party", "Explorer", "Spiritual", "Adventure", "Photography", "Work + Travel"];

const DEFAULT_INCLUDED = [
  "Accommodation", "Breakfast", "Local Transport", "Entry Tickets", "Guide", "Adventure Activities"
];

const DEFAULT_NOT_INCLUDED = [
  "Flights", "Visa", "Travel Insurance", "Personal Expenses", "Extra Meals", "Anything not mentioned above"
];

const DEFAULT_THINGS_TO_CARRY = [
  "ID Proof", "Warm Clothes", "Trek Shoes", "Sunscreen", "Power Bank", "Personal Medicines"
];

// ─── SECTIONS ────────────────────────────────────────────────
const SECTIONS = [
  { id: "overview", label: "Basic Overview", icon: Globe },
  { id: "media", label: "Hero & Media", icon: Image },
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "highlights", label: "Highlights", icon: Star },
  { id: "itinerary", label: "Itinerary", icon: Route },
  { id: "stay", label: "Accommodation", icon: Hotel },
  { id: "included", label: "What's Included", icon: CheckCircle2 },
  { id: "notIncluded", label: "Not Included", icon: XCircle },
  { id: "extraSpend", label: "Extra Expenses", icon: ShoppingBag },
  { id: "thingsToCarry", label: "Things to Carry", icon: Backpack },
  { id: "experience", label: "Experience & Vibe", icon: Heart },
  { id: "safety", label: "Safety & Policies", icon: Shield },
  { id: "faqs", label: "FAQs", icon: HelpCircle },
  { id: "host", label: "Host Info", icon: UserCircle },
];

// ─── TYPES ───────────────────────────────────────────────────
interface ItineraryDay {
  id: string;
  title: string;
  description: string;
  stay: string;
  meals: string;
  activities: string;
  isFlexible: boolean;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface CostBreakdown {
  accommodation: string;
  transportation: string;
  activities: string;
  guide: string;
  miscellaneous: string;
}

// ─── COMPONENT ───────────────────────────────────────────────
const CreateTrip = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [savedDraft, setSavedDraft] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // ─ Form State ─
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [category, setCategory] = useState("");
  const [summary, setSummary] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bookingCloseDate, setBookingCloseDate] = useState("");
  const [totalSeats, setTotalSeats] = useState("");
  const [minSeats, setMinSeats] = useState("");
  const [accessType, setAccessType] = useState<"open" | "apply" | "invite">("open");

  // Pricing
  const [totalPrice, setTotalPrice] = useState("");
  const [pricePerPerson, setPricePerPerson] = useState("");
  const [earlyBirdPrice, setEarlyBirdPrice] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [paymentTerms, setPaymentTerms] = useState("full");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [extraCosts, setExtraCosts] = useState<string[]>([]);
  const [breakdown, setBreakdown] = useState<CostBreakdown>({
    accommodation: "", transportation: "", activities: "", guide: "", miscellaneous: ""
  });

  // Highlights
  const [highlights, setHighlights] = useState<string[]>([""]);

  // Itinerary
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([
    { id: "d1", title: "", description: "", stay: "", meals: "", activities: "", isFlexible: false }
  ]);

  // Stay
  const [accommodationType, setAccommodationType] = useState("");
  const [roomSharing, setRoomSharing] = useState("");
  const [stayName, setStayName] = useState("");
  const [stayMapLink, setStayMapLink] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [stayDescription, setStayDescription] = useState("");

  // Included / Not Included
  const [includedItems, setIncludedItems] = useState<string[]>([...DEFAULT_INCLUDED]);
  const [notIncludedItems, setNotIncludedItems] = useState<string[]>([...DEFAULT_NOT_INCLUDED]);

  // Extra spend
  const [flightCostRange, setFlightCostRange] = useState("");
  const [optionalActivitiesCost, setOptionalActivitiesCost] = useState("");
  const [bufferBudget, setBufferBudget] = useState("");
  const [personalShopping, setPersonalShopping] = useState("");

  // Things to carry
  const [thingsToCarry, setThingsToCarry] = useState<string[]>([...DEFAULT_THINGS_TO_CARRY]);

  // Experience
  const [experienceLevel, setExperienceLevel] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [suitableFor, setSuitableFor] = useState<string[]>([]);
  const [genderPreference, setGenderPreference] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [tripVibes, setTripVibes] = useState<string[]>([]);

  // Safety
  const [codeOfConduct, setCodeOfConduct] = useState("");
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [medicalDeclaration, setMedicalDeclaration] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState(false);

  // FAQs
  const [faqs, setFaqs] = useState<FAQ[]>([
    { id: "f1", question: "", answer: "" }
  ]);

  // Host
  const [contactPreference, setContactPreference] = useState("In-app only");
  const [coHosts, setCoHosts] = useState("");

  // ─ Errors ─
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─ Duration calc ─
  const duration = startDate && endDate
    ? Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
    : 0;

  // ─ Completion ─
  const completedSections = SECTIONS.filter(s => {
    switch (s.id) {
      case "overview": return title && destination && category && startDate && endDate && totalSeats;
      case "pricing": return totalPrice;
      case "highlights": return highlights.some(h => h.trim());
      case "itinerary": return itinerary.some(d => d.title.trim());
      case "stay": return accommodationType;
      case "included": return includedItems.length > 0;
      case "notIncluded": return notIncludedItems.length > 0;
      case "experience": return experienceLevel;
      case "safety": return cancellationPolicy.trim().length > 0;
      case "host": return true;
      default: return false;
    }
  });
  const progressPercent = Math.round((completedSections.length / SECTIONS.length) * 100);

  // ─ Scroll tracking ─
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0.1 }
    );

    Object.values(sectionRefs.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleSection = (id: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ─ Helpers ─
  const addListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => [...prev, ""]);
  };

  const updateListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string) => {
    setter(prev => prev.map((item, i) => i === index ? value : item));
  };

  const removeListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const addItineraryDay = () => {
    setItinerary(prev => [...prev, {
      id: `d${Date.now()}`, title: "", description: "", stay: "", meals: "", activities: "", isFlexible: false
    }]);
  };

  const updateItineraryDay = (index: number, field: keyof ItineraryDay, value: string | boolean) => {
    setItinerary(prev => prev.map((day, i) => i === index ? { ...day, [field]: value } : day));
  };

  const removeItineraryDay = (index: number) => {
    if (itinerary.length > 1) setItinerary(prev => prev.filter((_, i) => i !== index));
  };

  const addFAQ = () => {
    setFaqs(prev => [...prev, { id: `f${Date.now()}`, question: "", answer: "" }]);
  };

  const updateFAQ = (index: number, field: "question" | "answer", value: string) => {
    setFaqs(prev => prev.map((faq, i) => i === index ? { ...faq, [field]: value } : faq));
  };

  const removeFAQ = (index: number) => {
    if (faqs.length > 1) setFaqs(prev => prev.filter((_, i) => i !== index));
  };

  const toggleArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  // ─ Save Draft ─
  const handleSaveDraft = useCallback(() => {
    setSavedDraft(true);
    toast.success("Draft saved successfully!");
    setTimeout(() => setSavedDraft(false), 2000);
  }, []);

  // ─ Validate ─
  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Trip title is required";
    if (!destination.trim()) e.destination = "Destination is required";
    if (!category) e.category = "Select a trip category";
    if (!startDate) e.startDate = "Start date is required";
    if (!endDate) e.endDate = "End date is required";
    if (startDate && endDate && endDate <= startDate) e.endDate = "End date must be after start date";
    if (!totalSeats || Number(totalSeats) < 2) e.totalSeats = "Minimum 2 seats required";
    if (!totalPrice || Number(totalPrice) <= 0) e.totalPrice = "Enter a valid price";
    if (!summary.trim()) e.summary = "Trip summary is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─ Submit ─
  const handleSubmit = async () => {
    if (!isAuthenticated) { toast.info("Please log in to create a trip"); navigate("/login"); return; }
    if (!validate()) {
      toast.error("Please fill in all required fields");
      const firstErrorSection = SECTIONS.find(s => {
        if (s.id === "overview") return errors.title || errors.destination || errors.category || errors.startDate || errors.endDate || errors.totalSeats || errors.summary;
        if (s.id === "pricing") return errors.totalPrice;
        return false;
      });
      if (firstErrorSection) scrollToSection(firstErrorSection.id);
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    toast.success("Trip published successfully! 🎉");
    navigate("/trips");
    setLoading(false);
  };

  // ─ Section Header Component ─
  const SectionHeader = ({ id, icon: Icon, title, description, required }: {
    id: string; icon: React.ElementType; title: string; description: string; required?: boolean;
  }) => {
    const isCollapsed = collapsedSections.has(id);
    const isComplete = completedSections.some(s => s.id === id);

    return (
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className="flex w-full items-center justify-between rounded-lg p-4 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            isComplete ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              {required && <Badge variant="outline" className="text-xs text-destructive border-destructive/30">Required</Badge>}
              {isComplete && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {isCollapsed ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronUp className="h-5 w-5 text-muted-foreground" />}
      </button>
    );
  };

  // ─ Field Wrapper ─
  const Field = ({ label, error, hint, required, children }: {
    label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode;
  }) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Top Progress Bar */}
        <div className="sticky top-16 z-30 border-b bg-card/95 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Mountain className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Trip Progress</span>
                <span className="text-sm text-muted-foreground">{progressPercent}% complete</span>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={savedDraft}>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  {savedDraft ? "Saved!" : "Save Draft"}
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  Preview
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={loading}>
                  {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                  Publish Trip
                </Button>
              </div>
            </div>
            <Progress value={progressPercent} className="mt-2 h-1.5" />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex gap-8">
            {/* ─── Sticky Sidebar Nav (Desktop) ─── */}
            <aside className="hidden w-60 shrink-0 lg:block">
              <div className="sticky top-36">
                <nav className="space-y-0.5 rounded-xl border bg-card p-2">
                  {SECTIONS.map(section => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    const isComplete = completedSections.some(s => s.id === section.id);
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                          isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{section.label}</span>
                        {isComplete && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* ─── Main Content ─── */}
            <div className="min-w-0 flex-1 space-y-4">
              {/* Page Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">Create a Trip</h1>
                <p className="mt-1 text-muted-foreground">Craft a professional travel experience. Fill in the details section by section.</p>
              </div>

              {/* ────────── 1. BASIC OVERVIEW ────────── */}
              <Card id="overview" ref={(el) => { sectionRefs.current.overview = el; }}>
                <SectionHeader id="overview" icon={Globe} title="Basic Trip Overview" description="Give a short, exciting overview. This is what people see first." required />
                {!collapsedSections.has("overview") && (
                  <CardContent className="space-y-4 pt-0">
                    <Field label="Trip Title" error={errors.title} required hint="A catchy name that grabs attention">
                      <Input placeholder="e.g. Spiti Valley Road Trip — The Ultimate Himalayan Escape" value={title} onChange={e => setTitle(e.target.value)} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Destination" error={errors.destination} required hint="City + Country">
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input className="pl-9" placeholder="e.g. Manali, Himachal Pradesh" value={destination} onChange={e => setDestination(e.target.value)} />
                        </div>
                      </Field>
                      <Field label="Trip Category" error={errors.category} required>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent>
                            {TRIP_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    <Field label="Trip Summary" error={errors.summary} required hint="A 2–3 line pitch. This appears on the trip card.">
                      <Textarea rows={3} placeholder="A thrilling 5-day road trip through the Spiti Valley covering the most stunning passes, ancient monasteries, and starlit campsites..." value={summary} onChange={e => setSummary(e.target.value)} maxLength={300} />
                      <p className="text-right text-xs text-muted-foreground">{summary.length}/300</p>
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="Start Date" error={errors.startDate} required>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input className="pl-9" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                      </Field>
                      <Field label="End Date" error={errors.endDate} required>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input className="pl-9" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                      </Field>
                      <Field label="Booking Closes">
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input className="pl-9" type="date" value={bookingCloseDate} onChange={e => setBookingCloseDate(e.target.value)} />
                        </div>
                      </Field>
                    </div>
                    {duration > 0 && (
                      <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-4 py-2.5">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">{duration} days / {Math.max(0, duration - 1)} nights</span>
                      </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Total Seats" error={errors.totalSeats} required>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input className="pl-9" type="number" placeholder="12" value={totalSeats} onChange={e => setTotalSeats(e.target.value)} />
                        </div>
                      </Field>
                      <Field label="Minimum Seats" hint="Trip proceeds only if minimum seats are filled">
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input className="pl-9" type="number" placeholder="6" value={minSeats} onChange={e => setMinSeats(e.target.value)} />
                        </div>
                      </Field>
                    </div>
                    <Field label="Trip Access Type" required hint="Control how travelers can join your trip">
                      <div className="grid gap-3 sm:grid-cols-3">
                        {([
                          { value: "open" as const, label: "Open Trip", desc: "Anyone can book instantly" },
                          { value: "apply" as const, label: "Apply to Join", desc: "You approve each application" },
                          { value: "invite" as const, label: "Invite Only", desc: "Only invited people can book" },
                        ]).map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setAccessType(opt.value)}
                            className={cn(
                              "rounded-lg border p-3 text-left transition-all",
                              accessType === opt.value
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border hover:border-primary/40"
                            )}
                          >
                            <p className="text-sm font-medium text-foreground">{opt.label}</p>
                            <p className="text-xs text-muted-foreground">{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </Field>
                  </CardContent>
                )}
              </Card>

              {/* ────────── 2. HERO & MEDIA ────────── */}
              <Card id="media" ref={(el) => { sectionRefs.current.media = el; }}>
                <SectionHeader id="media" icon={Image} title="Hero & Media" description="Stunning visuals make your trip stand out. Upload photos and videos." />
                {!collapsedSections.has("media") && (
                  <CardContent className="space-y-4 pt-0">
                    <Field label="Hero Image" required hint="This is the main cover photo for your trip">
                      <div className="flex h-40 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted/50">
                        <div className="text-center">
                          <Image className="mx-auto h-8 w-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">Drag & drop or click to upload</p>
                          <p className="text-xs text-muted-foreground">Recommended: 1920×1080px</p>
                        </div>
                      </div>
                    </Field>
                    <Field label="Gallery Images" hint="Add multiple photos to showcase the trip experience">
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/50">
                            <Plus className="h-5 w-5 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </Field>
                    <Field label="Video Link" hint="YouTube or Instagram reel link">
                      <Input placeholder="https://youtube.com/watch?v=..." />
                    </Field>
                  </CardContent>
                )}
              </Card>

              {/* ────────── 3. PRICING ────────── */}
              <Card id="pricing" ref={(el) => { sectionRefs.current.pricing = el; }}>
                <SectionHeader id="pricing" icon={DollarSign} title="Pricing & Financial Breakdown" description="Be transparent about costs. Trust starts with clear pricing." required />
                {!collapsedSections.has("pricing") && (
                  <CardContent className="space-y-5 pt-0">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="Currency">
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Total Trip Price" error={errors.totalPrice} required>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input className="pl-9" type="number" placeholder="25000" value={totalPrice} onChange={e => setTotalPrice(e.target.value)} />
                        </div>
                      </Field>
                      <Field label="Price Per Person">
                        <Input type="number" placeholder="Auto or manual" value={pricePerPerson} onChange={e => setPricePerPerson(e.target.value)} />
                      </Field>
                    </div>
                    <Field label="Early Bird Price" hint="Offer a discount for early sign-ups">
                      <Input type="number" placeholder="e.g. 22000" value={earlyBirdPrice} onChange={e => setEarlyBirdPrice(e.target.value)} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Payment Terms">
                        <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full">Full Payment Upfront</SelectItem>
                            <SelectItem value="partial">Partial Advance</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      {paymentTerms === "partial" && (
                        <Field label="Advance Amount">
                          <Input type="number" placeholder="e.g. 5000" value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} />
                        </Field>
                      )}
                    </div>

                    {/* Extra Costs */}
                    <div>
                      <Label className="mb-2 block text-sm font-medium">Extra Costs Not Included</Label>
                      <div className="flex flex-wrap gap-2">
                        {["Flights", "Local Transfers", "Personal Expenses", "Adventure Add-ons", "Meals not included", "Optional Activities"].map(item => (
                          <Badge
                            key={item}
                            variant={extraCosts.includes(item) ? "default" : "outline"}
                            className="cursor-pointer transition-colors"
                            onClick={() => toggleArrayItem(setExtraCosts, item)}
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="rounded-lg border bg-muted/20 p-4">
                      <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        Cost Breakdown (optional — builds trust)
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(Object.keys(breakdown) as (keyof CostBreakdown)[]).map(key => (
                          <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
                            <Input type="number" placeholder="0" value={breakdown[key]} onChange={e => setBreakdown(p => ({ ...p, [key]: e.target.value }))} />
                          </Field>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* ────────── 4. HIGHLIGHTS ────────── */}
              <Card id="highlights" ref={(el) => { sectionRefs.current.highlights = el; }}>
                <SectionHeader id="highlights" icon={Star} title="Highlights" description="Top reasons someone should join this trip." />
                {!collapsedSections.has("highlights") && (
                  <CardContent className="space-y-3 pt-0">
                    {highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                        <Input
                          placeholder={`Highlight #${i + 1} — e.g. "Camping under a billion stars at 14,000 ft"`}
                          value={h}
                          onChange={e => updateListItem(setHighlights, i, e.target.value)}
                        />
                        {highlights.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeListItem(setHighlights, i)} className="shrink-0">
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addListItem(setHighlights)}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Highlight
                    </Button>
                  </CardContent>
                )}
              </Card>

              {/* ────────── 5. ITINERARY ────────── */}
              <Card id="itinerary" ref={(el) => { sectionRefs.current.itinerary = el; }}>
                <SectionHeader id="itinerary" icon={Route} title="Detailed Itinerary" description="Plan each day of the trip. Participants love detailed day-by-day plans." />
                {!collapsedSections.has("itinerary") && (
                  <CardContent className="space-y-4 pt-0">
                    {itinerary.map((day, i) => (
                      <div key={day.id} className="rounded-lg border bg-card p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                            <Badge variant="secondary" className="font-semibold">Day {i + 1}</Badge>
                            {day.isFlexible && <Badge variant="outline" className="text-xs">Flexible</Badge>}
                          </div>
                          <div className="flex items-center gap-1">
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                              <Checkbox checked={day.isFlexible} onCheckedChange={v => updateItineraryDay(i, "isFlexible", !!v)} />
                              Flexible
                            </label>
                            {itinerary.length > 1 && (
                              <Button variant="ghost" size="icon" onClick={() => removeItineraryDay(i)}>
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <Input placeholder="Day title — e.g. Arrival & Old Manali Exploration" value={day.title} onChange={e => updateItineraryDay(i, "title", e.target.value)} />
                        <Textarea rows={2} placeholder="What happens on this day..." value={day.description} onChange={e => updateItineraryDay(i, "description", e.target.value)} />
                        <div className="grid gap-3 sm:grid-cols-3">
                          <Input placeholder="Stay — e.g. Mountain Hostel" value={day.stay} onChange={e => updateItineraryDay(i, "stay", e.target.value)} />
                          <Input placeholder="Meals — e.g. Breakfast, Dinner" value={day.meals} onChange={e => updateItineraryDay(i, "meals", e.target.value)} />
                          <Input placeholder="Activities — e.g. Cafe Hopping" value={day.activities} onChange={e => updateItineraryDay(i, "activities", e.target.value)} />
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addItineraryDay}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Day
                    </Button>
                  </CardContent>
                )}
              </Card>

              {/* ────────── 6. STAY & ACCOMMODATION ────────── */}
              <Card id="stay" ref={(el) => { sectionRefs.current.stay = el; }}>
                <SectionHeader id="stay" icon={Hotel} title="Stay & Accommodation" description="Where will the group stay? Add details to set expectations." />
                {!collapsedSections.has("stay") && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Accommodation Type">
                        <Select value={accommodationType} onValueChange={setAccommodationType}>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            {ACCOMMODATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Room Sharing">
                        <Select value={roomSharing} onValueChange={setRoomSharing}>
                          <SelectTrigger><SelectValue placeholder="Select sharing type" /></SelectTrigger>
                          <SelectContent>
                            {ROOM_SHARING_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Stay Name" hint="e.g. Zostel Manali">
                        <Input value={stayName} onChange={e => setStayName(e.target.value)} placeholder="Property name" />
                      </Field>
                      <Field label="Map Link">
                        <Input value={stayMapLink} onChange={e => setStayMapLink(e.target.value)} placeholder="Google Maps link" />
                      </Field>
                    </div>
                    <div>
                      <Label className="mb-2 block text-sm font-medium">Amenities</Label>
                      <div className="flex flex-wrap gap-2">
                        {AMENITIES.map(item => (
                          <Badge
                            key={item}
                            variant={amenities.includes(item) ? "default" : "outline"}
                            className="cursor-pointer transition-colors"
                            onClick={() => toggleArrayItem(setAmenities, item)}
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Field label="Stay Description">
                      <Textarea rows={3} placeholder="Describe the accommodation experience..." value={stayDescription} onChange={e => setStayDescription(e.target.value)} />
                    </Field>
                  </CardContent>
                )}
              </Card>

              {/* ────────── 7. WHAT'S INCLUDED ────────── */}
              <Card id="included" ref={(el) => { sectionRefs.current.included = el; }}>
                <SectionHeader id="included" icon={CheckCircle2} title="What's Included" description="List everything that's part of the trip cost." />
                {!collapsedSections.has("included") && (
                  <CardContent className="space-y-3 pt-0">
                    {includedItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        <Input value={item} onChange={e => updateListItem(setIncludedItems, i, e.target.value)} placeholder="e.g. Airport pickup" />
                        <Button variant="ghost" size="icon" onClick={() => removeListItem(setIncludedItems, i)} className="shrink-0">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addListItem(setIncludedItems)}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Item
                    </Button>
                  </CardContent>
                )}
              </Card>

              {/* ────────── 8. NOT INCLUDED ────────── */}
              <Card id="notIncluded" ref={(el) => { sectionRefs.current.notIncluded = el; }}>
                <SectionHeader id="notIncluded" icon={XCircle} title="What's Not Included" description="Set expectations by clearly stating what's not covered." />
                {!collapsedSections.has("notIncluded") && (
                  <CardContent className="space-y-3 pt-0">
                    {notIncludedItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <Input value={item} onChange={e => updateListItem(setNotIncludedItems, i, e.target.value)} />
                        <Button variant="ghost" size="icon" onClick={() => removeListItem(setNotIncludedItems, i)} className="shrink-0">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addListItem(setNotIncludedItems)}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Item
                    </Button>
                  </CardContent>
                )}
              </Card>

              {/* ────────── 9. EXTRA SPEND ────────── */}
              <Card id="extraSpend" ref={(el) => { sectionRefs.current.extraSpend = el; }}>
                <SectionHeader id="extraSpend" icon={ShoppingBag} title="Extra Things Participants Might Spend On" description="Help participants budget by being transparent about additional costs." />
                {!collapsedSections.has("extraSpend") && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Approximate Flight Cost" hint="Give a range, e.g. ₹5000 – ₹8000">
                        <Input value={flightCostRange} onChange={e => setFlightCostRange(e.target.value)} placeholder="₹5000 – ₹8000" />
                      </Field>
                      <Field label="Optional Activities Cost">
                        <Input value={optionalActivitiesCost} onChange={e => setOptionalActivitiesCost(e.target.value)} placeholder="₹2000 – ₹5000" />
                      </Field>
                      <Field label="Buffer Budget Suggestion">
                        <Input value={bufferBudget} onChange={e => setBufferBudget(e.target.value)} placeholder="₹3000" />
                      </Field>
                      <Field label="Personal Shopping Estimate">
                        <Input value={personalShopping} onChange={e => setPersonalShopping(e.target.value)} placeholder="₹1000 – ₹3000" />
                      </Field>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* ────────── 10. THINGS TO CARRY ────────── */}
              <Card id="thingsToCarry" ref={(el) => { sectionRefs.current.thingsToCarry = el; }}>
                <SectionHeader id="thingsToCarry" icon={Backpack} title="Things to Carry" description="Help participants pack right. Add essentials and nice-to-haves." />
                {!collapsedSections.has("thingsToCarry") && (
                  <CardContent className="space-y-3 pt-0">
                    {thingsToCarry.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <Input value={item} onChange={e => updateListItem(setThingsToCarry, i, e.target.value)} />
                        <Button variant="ghost" size="icon" onClick={() => removeListItem(setThingsToCarry, i)} className="shrink-0">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addListItem(setThingsToCarry)}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Item
                    </Button>
                  </CardContent>
                )}
              </Card>

              {/* ────────── 11. EXPERIENCE & VIBE ────────── */}
              <Card id="experience" ref={(el) => { sectionRefs.current.experience = el; }}>
                <SectionHeader id="experience" icon={Heart} title="Trip Experience & Social Context" description="Help the right people find this trip." />
                {!collapsedSections.has("experience") && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Experience Level Required">
                        <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                          <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                          <SelectContent>
                            {EXPERIENCE_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Fitness Level Required">
                        <Select value={fitnessLevel} onValueChange={setFitnessLevel}>
                          <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                          <SelectContent>
                            {FITNESS_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>

                    <div>
                      <Label className="mb-2 block text-sm font-medium">Suitable For</Label>
                      <div className="flex flex-wrap gap-2">
                        {["Solo Travelers", "Couples", "Friends", "All Genders"].map(item => (
                          <Badge
                            key={item}
                            variant={suitableFor.includes(item) ? "default" : "outline"}
                            className="cursor-pointer transition-colors"
                            onClick={() => toggleArrayItem(setSuitableFor, item)}
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block text-sm font-medium">Trip Vibe</Label>
                      <div className="flex flex-wrap gap-2">
                        {TRIP_VIBES.map(vibe => (
                          <Badge
                            key={vibe}
                            variant={tripVibes.includes(vibe) ? "default" : "outline"}
                            className="cursor-pointer transition-colors"
                            onClick={() => toggleArrayItem(setTripVibes, vibe)}
                          >
                            {vibe}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Gender Preference" hint="Leave empty for all genders">
                        <Input value={genderPreference} onChange={e => setGenderPreference(e.target.value)} placeholder="e.g. Women Only" />
                      </Field>
                      <Field label="Age Preference" hint="e.g. 22–35">
                        <Input value={ageRange} onChange={e => setAgeRange(e.target.value)} placeholder="e.g. 22–35" />
                      </Field>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* ────────── 12. SAFETY & POLICIES ────────── */}
              <Card id="safety" ref={(el) => { sectionRefs.current.safety = el; }}>
                <SectionHeader id="safety" icon={Shield} title="Safety & Policies" description="Build trust with clear conduct guidelines and cancellation policies." />
                {!collapsedSections.has("safety") && (
                  <CardContent className="space-y-4 pt-0">
                    <Field label="Code of Conduct" hint="General rules for respectful group travel">
                      <Textarea rows={3} placeholder="All participants are expected to respect each other, follow group timelines, and maintain a positive attitude..." value={codeOfConduct} onChange={e => setCodeOfConduct(e.target.value)} />
                    </Field>
                    <Field label="Cancellation Policy" hint="Be clear about refund windows and non-refundable amounts">
                      <Textarea rows={3} placeholder="Full refund if cancelled 30 days before departure. 50% refund within 15–30 days. No refund within 15 days..." value={cancellationPolicy} onChange={e => setCancellationPolicy(e.target.value)} />
                    </Field>
                    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox checked={medicalDeclaration} onCheckedChange={v => setMedicalDeclaration(!!v)} />
                        <div>
                          <p className="text-sm font-medium text-foreground">Medical Declaration Required</p>
                          <p className="text-xs text-muted-foreground">Participants must declare medical conditions before joining</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox checked={emergencyContact} onCheckedChange={v => setEmergencyContact(!!v)} />
                        <div>
                          <p className="text-sm font-medium text-foreground">Emergency Contact Required</p>
                          <p className="text-xs text-muted-foreground">Participants must provide an emergency contact number</p>
                        </div>
                      </label>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* ────────── 13. FAQs ────────── */}
              <Card id="faqs" ref={(el) => { sectionRefs.current.faqs = el; }}>
                <SectionHeader id="faqs" icon={HelpCircle} title="FAQs" description="Answer common questions upfront to reduce DMs and build confidence." />
                {!collapsedSections.has("faqs") && (
                  <CardContent className="space-y-4 pt-0">
                    {faqs.map((faq, i) => (
                      <div key={faq.id} className="rounded-lg border bg-card p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">Q{i + 1}</Badge>
                          {faqs.length > 1 && (
                            <Button variant="ghost" size="icon" onClick={() => removeFAQ(i)}>
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                        <Input placeholder="e.g. Is this trip beginner-friendly?" value={faq.question} onChange={e => updateFAQ(i, "question", e.target.value)} />
                        <Textarea rows={2} placeholder="Your answer..." value={faq.answer} onChange={e => updateFAQ(i, "answer", e.target.value)} />
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addFAQ}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add FAQ
                    </Button>
                  </CardContent>
                )}
              </Card>

              {/* ────────── 14. HOST INFO ────────── */}
              <Card id="host" ref={(el) => { sectionRefs.current.host = el; }}>
                <SectionHeader id="host" icon={UserCircle} title="Host Information" description="Your profile and contact preferences. Auto-populated from your account." />
                {!collapsedSections.has("host") && (
                  <CardContent className="space-y-4 pt-0">
                    {user ? (
                      <div className="flex items-center gap-4 rounded-lg border bg-muted/20 p-4">
                        <img src={user.avatar} alt={user.name} className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/20" />
                        <div>
                          <p className="font-semibold text-foreground">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.bio || "Travel enthusiast"}</p>
                          <p className="text-xs text-muted-foreground">{user.location || "India"}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border bg-muted/20 p-4 text-center">
                        <p className="text-sm text-muted-foreground">Log in to auto-populate your host profile</p>
                      </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Contact Preference">
                        <Select value={contactPreference} onValueChange={setContactPreference}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="In-app only">In-app only</SelectItem>
                            <SelectItem value="Chat">Chat</SelectItem>
                            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Co-hosts" hint="Comma-separated names or usernames">
                        <Input value={coHosts} onChange={e => setCoHosts(e.target.value)} placeholder="e.g. @priya, @ravi" />
                      </Field>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* ─── Bottom Action Bar ─── */}
              <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  {completedSections.length} of {SECTIONS.length} sections filled • {progressPercent}% complete
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSaveDraft} disabled={savedDraft}>
                    <Save className="mr-1.5 h-4 w-4" />
                    {savedDraft ? "Saved!" : "Save Draft"}
                  </Button>
                  <Button variant="outline">
                    <Eye className="mr-1.5 h-4 w-4" />
                    Preview Trip
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading} className="transition-transform hover:scale-[1.02]">
                    {loading ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Publishing...</> : <><Send className="mr-1.5 h-4 w-4" /> Publish Trip</>}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateTrip;
