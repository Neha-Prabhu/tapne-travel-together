import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/RichTextEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import { useDrafts } from "@/contexts/DraftContext";
import { toast } from "sonner";
import {
  Loader2, Plus, Trash2, GripVertical, MapPin, Calendar, Users, DollarSign,
  Image, Star, Route, CheckCircle2, XCircle, Backpack, Hotel,
  Heart, Shield, HelpCircle, UserCircle, ChevronDown, ChevronUp, Eye, Save,
  Send, Sparkles, Mountain, Globe, X, ClipboardList
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ApplicationQuestion, ApplicationQuestionType } from "@/data/mockData";
import { cn } from "@/lib/utils";

// ─── CONSTANTS ───
const TRIP_CATEGORIES = ["Backpacking", "Luxury", "Trek", "Social", "Wellness", "Workation", "Roadtrip"];
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "THB", "IDR"];
const EXPERIENCE_LEVELS = ["Beginner", "Moderate", "Advanced"];
const FITNESS_LEVELS = ["Low", "Moderate", "High", "Extreme"];

const SUITABLE_FOR_OPTIONS = [
  "Families", "Women travellers", "LGBTQ+ friendly", "First-time travellers",
  "Senior travellers", "Students & budget travellers", "Remote workers"
];

const TRIP_VIBES = [
  "Relaxed", "Slow travel", "Cultural immersion", "Food focused", "Nature focused",
  "Adventure sports", "Night life", "Photography", "Wellness and mindfulness",
  "Road trip", "Camping", "Luxury"
];

const CONTACT_OPTIONS = ["In-app chat", "Email", "WhatsApp"];

const SECTIONS = [
  { id: "overview", label: "Basic Overview", icon: Globe },
  { id: "media", label: "Hero & Media", icon: Image },
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "highlights", label: "Highlights", icon: Star },
  { id: "itinerary", label: "Itinerary", icon: Route },
  { id: "stay", label: "Stay & Accommodation", icon: Hotel },
  { id: "included", label: "What's Included", icon: CheckCircle2 },
  { id: "notIncluded", label: "Not Included", icon: XCircle },
  { id: "thingsToCarry", label: "Things to Carry", icon: Backpack },
  { id: "experience", label: "Experience & Vibe", icon: Heart },
  { id: "safety", label: "Safety & Policies", icon: Shield },
  { id: "application", label: "Application Settings", icon: ClipboardList },
  { id: "faqs", label: "FAQs", icon: HelpCircle },
  { id: "host", label: "Host Info", icon: UserCircle },
];

interface ItineraryDay {
  id: string;
  title: string;
  description: string;
  isFlexible: boolean;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

// ─ Extracted components to prevent re-mount on parent state changes ─

const SectionHeader = ({ id, icon: Icon, title, description, required, isComplete, isCollapsed, onToggle }: {
  id: string; icon: React.ElementType; title: string; description: string; required?: boolean;
  isComplete: boolean; isCollapsed: boolean; onToggle: (id: string) => void;
}) => (
  <button type="button" onClick={() => onToggle(id)} className="flex w-full items-center justify-between rounded-lg p-4 text-left transition-colors hover:bg-muted/50">
    <div className="flex items-center gap-3">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", isComplete ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
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

const Field = ({ label, error, hint, required, children }: {
  label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium text-foreground">{label}{required && <span className="ml-1 text-destructive">*</span>}</Label>
    {children}
    {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

const DragListItem = ({ value, onChange, onRemove, onEnterKey, placeholder, onDragStart, onDragEnter, onDragOver, onDragEnd, isDragging }: {
  value: string; onChange: (val: string) => void; onRemove: () => void; onEnterKey?: () => void; placeholder: string;
  onDragStart: () => void; onDragEnter: () => void; onDragOver: (e: React.DragEvent) => void; onDragEnd: () => void; isDragging: boolean;
}) => (
  <div
    draggable
    onDragStart={onDragStart}
    onDragEnter={onDragEnter}
    onDragOver={onDragOver}
    onDragEnd={onDragEnd}
    className={cn(
      "group flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-all",
      isDragging ? "opacity-50 border-primary shadow-md" : "border-border hover:border-primary/30 hover:shadow-sm"
    )}
  >
    <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
      <GripVertical className="h-5 w-5" />
    </div>
    <Input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      onKeyDown={e => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEnterKey?.();
        }
      }}
    />
    <Button variant="ghost" size="icon" onClick={onRemove} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
    </Button>
  </div>
);

const CreateTrip = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftIdParam = searchParams.get("draft");
  const { getDraft, updateDraft, createDraft, publishDraft } = useDrafts();

  // If no draft param, create one and redirect
  const [draftId, setDraftId] = useState<string>(() => {
    if (draftIdParam) return draftIdParam;
    return "";
  });

  useEffect(() => {
    if (!draftId && !draftIdParam) {
      const id = createDraft();
      setDraftId(id);
      window.history.replaceState({}, "", `/create-trip?draft=${id}`);
    }
  }, [draftId, draftIdParam, createDraft]);

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

  // Pricing (simplified)
  const [currency, setCurrency] = useState("INR");
  const [totalPrice, setTotalPrice] = useState("");
  const [earlyBirdPrice, setEarlyBirdPrice] = useState("");
  const [earlyBirdSeats, setEarlyBirdSeats] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("full");
  const [advanceAmount, setAdvanceAmount] = useState("");

  // Highlights
  const [highlights, setHighlights] = useState<string[]>([""]);

  // Itinerary (simplified - no activities, uses rich text description)
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([
    { id: "d1", title: "", description: "", isFlexible: false }
  ]);

  // Included / Not Included
  const [includedItems, setIncludedItems] = useState<string[]>(["Accommodation", "Breakfast", "Local Transport"]);
  const [notIncludedItems, setNotIncludedItems] = useState<string[]>(["Flights", "Travel Insurance", "Personal Expenses"]);

  // Stay & Accommodation
  const [accommodationType, setAccommodationType] = useState("");
  const [roomSharing, setRoomSharing] = useState("");
  const [stayName, setStayName] = useState("");
  const [stayDescription, setStayDescription] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState("");

  // Things to carry (pill tags)
  const [thingsToCarry, setThingsToCarry] = useState<string[]>(["ID Proof", "Sunscreen", "Power Bank"]);
  const [carryInput, setCarryInput] = useState("");

  // Experience
  const [experienceLevel, setExperienceLevel] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [suitableFor, setSuitableFor] = useState<string[]>([]);
  const [tripVibes, setTripVibes] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 60]);
  const [enforceAge, setEnforceAge] = useState(false);

  // Safety (rich text editors → textareas)
  const [codeOfConduct, setCodeOfConduct] = useState("");
  const [generalPolicy, setGeneralPolicy] = useState("");
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [medicalDeclaration, setMedicalDeclaration] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState(false);
  const [medicalDetails, setMedicalDetails] = useState("");
  const [emergencyDetails, setEmergencyDetails] = useState("");

  // FAQs
  const [faqs, setFaqs] = useState<FAQ[]>([{ id: "f1", question: "", answer: "" }]);

  // Host
  const [contactPreferences, setContactPreferences] = useState<string[]>(["In-app chat"]);
  const [hosts, setHosts] = useState("");

  // Application Settings (for apply-to-join)
  const [customQuestions, setCustomQuestions] = useState<ApplicationQuestion[]>([]);
  const [autoApprove, setAutoApprove] = useState(false);

  // ── Load draft data on mount ──
  const hasLoadedDraft = useRef(false);
  useEffect(() => {
    const id = draftId || draftIdParam;
    if (!id || hasLoadedDraft.current) return;
    const draft = getDraft(id);
    if (!draft) return;
    hasLoadedDraft.current = true;
    if (draft.title) setTitle(draft.title);
    if (draft.destination) setDestination(draft.destination);
    if (draft.category) setCategory(draft.category);
    if (draft.summary) setSummary(draft.summary);
    if (draft.startDate) setStartDate(draft.startDate);
    if (draft.endDate) setEndDate(draft.endDate);
    const fd = draft.formData || {};
    if (fd.bookingCloseDate) setBookingCloseDate(fd.bookingCloseDate);
    if (fd.totalSeats) setTotalSeats(fd.totalSeats);
    if (fd.minSeats) setMinSeats(fd.minSeats);
    if (fd.accessType) setAccessType(fd.accessType);
    if (fd.currency) setCurrency(fd.currency);
    if (fd.totalPrice) setTotalPrice(fd.totalPrice);
    if (fd.earlyBirdPrice) setEarlyBirdPrice(fd.earlyBirdPrice);
    if (fd.earlyBirdSeats) setEarlyBirdSeats(fd.earlyBirdSeats);
    if (fd.paymentTerms) setPaymentTerms(fd.paymentTerms);
    if (fd.advanceAmount) setAdvanceAmount(fd.advanceAmount);
    if (fd.highlights) setHighlights(fd.highlights);
    if (fd.itinerary) setItinerary(fd.itinerary);
    if (fd.includedItems) setIncludedItems(fd.includedItems);
    if (fd.notIncludedItems) setNotIncludedItems(fd.notIncludedItems);
    if (fd.accommodationType) setAccommodationType(fd.accommodationType);
    if (fd.roomSharing) setRoomSharing(fd.roomSharing);
    if (fd.stayName) setStayName(fd.stayName);
    if (fd.stayDescription) setStayDescription(fd.stayDescription);
    if (fd.amenities) setAmenities(fd.amenities);
    if (fd.thingsToCarry) setThingsToCarry(fd.thingsToCarry);
    if (fd.experienceLevel) setExperienceLevel(fd.experienceLevel);
    if (fd.fitnessLevel) setFitnessLevel(fd.fitnessLevel);
    if (fd.suitableFor) setSuitableFor(fd.suitableFor);
    if (fd.tripVibes) setTripVibes(fd.tripVibes);
    if (fd.codeOfConduct) setCodeOfConduct(fd.codeOfConduct);
    if (fd.generalPolicy) setGeneralPolicy(fd.generalPolicy);
    if (fd.cancellationPolicy) setCancellationPolicy(fd.cancellationPolicy);
    if (fd.faqs) setFaqs(fd.faqs);
    if (fd.contactPreferences) setContactPreferences(fd.contactPreferences);
    if (fd.hosts) setHosts(fd.hosts);
    if (fd.customQuestions) setCustomQuestions(fd.customQuestions);
    if (fd.autoApprove !== undefined) setAutoApprove(fd.autoApprove);
  }, [draftId, draftIdParam, getDraft]);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const duration = startDate && endDate
    ? Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
    : 0;

  const visibleSections = SECTIONS.filter(s => {
    if (s.id === "application") return accessType === "apply";
    return true;
  });

  const completedSections = visibleSections.filter(s => {
    switch (s.id) {
      case "overview": return title && destination && category && summary && startDate && endDate && totalSeats;
      case "pricing": return totalPrice;
      case "highlights": return highlights.some(h => h.trim());
      case "itinerary": return itinerary.some(d => d.title.trim());
      case "included": return includedItems.length > 0;
      case "notIncluded": return notIncludedItems.length > 0;
      case "experience": return experienceLevel;
      case "safety": return cancellationPolicy.trim().length > 0;
      case "application": return customQuestions.length > 0 && customQuestions.some(q => q.question.trim());
      case "host": return true;
      default: return false;
    }
  });
  const progressPercent = Math.round((completedSections.length / visibleSections.length) * 100);

  const isInputFocusedRef = useRef(false);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === "TEXTAREA" || el.tagName === "INPUT" || el.isContentEditable) isInputFocusedRef.current = true;
    };
    const handleFocusOut = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === "TEXTAREA" || el.tagName === "INPUT" || el.isContentEditable) isInputFocusedRef.current = false;
    };
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    return () => { document.removeEventListener("focusin", handleFocusIn); document.removeEventListener("focusout", handleFocusOut); };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach(entry => { if (entry.isIntersecting && !isInputFocusedRef.current) setActiveSection(entry.target.id); }); },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0.1 }
    );
    Object.values(sectionRefs.current).forEach(ref => { if (ref) observer.observe(ref); });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  const toggleSection = (id: string) => {
    setCollapsedSections(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  // Helpers
  const addListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => setter(prev => [...prev, ""]);
  const updateListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, i: number, val: string) => setter(prev => prev.map((item, idx) => idx === i ? val : item));
  const removeListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, i: number) => setter(prev => prev.filter((_, idx) => idx !== i));

  const moveItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, from: number, to: number) => {
    setter(prev => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };

  const toggleArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, item: string, max?: number) => {
    setter(prev => {
      if (prev.includes(item)) return prev.filter(i => i !== item);
      if (max && prev.length >= max) { toast.info(`Maximum ${max} selections allowed`); return prev; }
      return [...prev, item];
    });
  };

  const addCarryItem = () => {
    if (carryInput.trim() && !thingsToCarry.includes(carryInput.trim())) {
      setThingsToCarry(prev => [...prev, carryInput.trim()]);
      setCarryInput("");
    }
  };

  const addItineraryDay = () => setItinerary(prev => [...prev, { id: `d${Date.now()}`, title: "", description: "", isFlexible: false }]);
  const updateItineraryDay = (i: number, field: keyof ItineraryDay, val: string | boolean) => setItinerary(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: val } : d));
  const removeItineraryDay = (i: number) => { if (itinerary.length > 1) setItinerary(prev => prev.filter((_, idx) => idx !== i)); };
  const moveItineraryDay = (from: number, to: number) => {
    setItinerary(prev => { const arr = [...prev]; const [item] = arr.splice(from, 1); arr.splice(to, 0, item); return arr; });
  };

  const addFAQ = () => setFaqs(prev => [...prev, { id: `f${Date.now()}`, question: "", answer: "" }]);
  const updateFAQ = (i: number, field: "question" | "answer", val: string) => setFaqs(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: val } : f));
  const removeFAQ = (i: number) => { if (faqs.length > 1) setFaqs(prev => prev.filter((_, idx) => idx !== i)); };
  const moveFAQ = (from: number, to: number) => {
    setFaqs(prev => { const arr = [...prev]; const [item] = arr.splice(from, 1); arr.splice(to, 0, item); return arr; });
  };

  const saveDraftData = useCallback(() => {
    const id = draftId || draftIdParam;
    if (!id) return;
    updateDraft(id, {
      title, destination, category, summary, startDate, endDate,
      formData: {
        bookingCloseDate, totalSeats, minSeats, accessType, currency, totalPrice,
        earlyBirdPrice, earlyBirdSeats, paymentTerms, advanceAmount, highlights,
        itinerary, includedItems, notIncludedItems, accommodationType, roomSharing,
        stayName, stayDescription, amenities, thingsToCarry, experienceLevel,
        fitnessLevel, suitableFor, tripVibes, ageRange, enforceAge, codeOfConduct,
        generalPolicy, cancellationPolicy, medicalDeclaration, emergencyContact,
        medicalDetails, emergencyDetails, faqs, contactPreferences, hosts,
        customQuestions, autoApprove,
      },
    });
  }, [draftId, draftIdParam, updateDraft, title, destination, category, summary, startDate, endDate,
      bookingCloseDate, totalSeats, minSeats, accessType, currency, totalPrice, earlyBirdPrice,
      earlyBirdSeats, paymentTerms, advanceAmount, highlights, itinerary, includedItems, notIncludedItems,
      accommodationType, roomSharing, stayName, stayDescription, amenities, thingsToCarry,
      experienceLevel, fitnessLevel, suitableFor, tripVibes, ageRange, enforceAge, codeOfConduct,
      generalPolicy, cancellationPolicy, medicalDeclaration, emergencyContact, medicalDetails,
      emergencyDetails, faqs, contactPreferences, hosts, customQuestions, autoApprove]);

  // Auto-save every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => { saveDraftData(); }, 10000);
    return () => clearInterval(interval);
  }, [saveDraftData]);

  const handleSaveDraft = useCallback(() => { saveDraftData(); setSavedDraft(true); toast.success("Draft saved!"); setTimeout(() => setSavedDraft(false), 2000); }, [saveDraftData]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Required";
    if (!summary.trim()) e.summary = "Required";
    if (!destination.trim()) e.destination = "Required";
    if (!category) e.category = "Required";
    if (!startDate) e.startDate = "Required";
    if (!endDate) e.endDate = "Required";
    if (startDate && endDate && endDate <= startDate) e.endDate = "Must be after start";
    if (!bookingCloseDate) e.bookingCloseDate = "Required";
    if (!totalSeats || Number(totalSeats) < 2) e.totalSeats = "Min 2";
    if (!totalPrice || Number(totalPrice) <= 0) e.totalPrice = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) { toast.info("Please log in to create a trip"); navigate("/login"); return; }
    if (!validate()) { toast.error("Please fill required fields"); return; }
    setLoading(true);
    saveDraftData();
    const id = draftId || draftIdParam;
    if (id) publishDraft(id);
    await new Promise(r => setTimeout(r, 1500));
    toast.success("Trip published! 🎉");
    navigate("/my-trips");
    setLoading(false);
  };

  // Drag state for list items
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);

  // Helper to render section headers with common props
  const renderSectionHeader = (id: string, icon: React.ElementType, title: string, description: string, required?: boolean) => (
    <SectionHeader
      id={id} icon={icon} title={title} description={description} required={required}
      isComplete={completedSections.some(s => s.id === id)}
      isCollapsed={collapsedSections.has(id)}
      onToggle={toggleSection}
    />
  );

  // Helper to render drag list items with proper props
  const renderDragList = (items: string[], setItems: React.Dispatch<React.SetStateAction<string[]>>, placeholderFn: (i: number) => string) => (
    items.map((item, i) => (
      <DragListItem
        key={`${i}-${items.length}`}
        value={item}
        onChange={(val) => updateListItem(setItems, i, val)}
        onRemove={() => removeListItem(setItems, i)}
        onEnterKey={() => addListItem(setItems)}
        placeholder={placeholderFn(i)}
        isDragging={draggingIndex === i}
        onDragStart={() => setDraggingIndex(i)}
        onDragEnter={() => { dragOverIndexRef.current = i; }}
        onDragOver={(e) => e.preventDefault()}
        onDragEnd={() => {
          if (draggingIndex !== null && dragOverIndexRef.current !== null && draggingIndex !== dragOverIndexRef.current) {
            moveItem(setItems, draggingIndex, dragOverIndexRef.current);
          }
          setDraggingIndex(null);
          dragOverIndexRef.current = null;
        }}
      />
    ))
  );
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Progress Bar */}
        <div className="sticky top-16 z-30 border-b bg-card/95 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Mountain className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Trip Progress</span>
                <span className="text-sm text-muted-foreground">{progressPercent}%</span>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={savedDraft}>
                  <Save className="mr-1.5 h-3.5 w-3.5" />{savedDraft ? "Saved!" : "Save Draft"}
                </Button>
                <Button variant="outline" size="sm"><Eye className="mr-1.5 h-3.5 w-3.5" />Preview</Button>
                <Button size="sm" onClick={handleSubmit} disabled={loading}>
                  {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}Publish
                </Button>
              </div>
            </div>
            <Progress value={progressPercent} className="mt-2 h-1.5" />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex gap-8">
            {/* Sidebar */}
            <aside className="hidden w-60 shrink-0 lg:block">
              <div className="sticky top-36">
                <nav className="space-y-0.5 rounded-xl border bg-card p-2">
                  {visibleSections.map(section => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    const isComplete = completedSections.some(s => s.id === section.id);
                    return (
                      <button key={section.id} onClick={() => scrollToSection(section.id)} className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}>
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{section.label}</span>
                        {isComplete && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <div className="min-w-0 flex-1 space-y-4">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">Create a Trip</h1>
                <p className="mt-1 text-muted-foreground">Craft a professional travel experience.</p>
              </div>

              {/* 1. BASIC OVERVIEW */}
              <Card id="overview" ref={(el) => { sectionRefs.current.overview = el; }}>
                {renderSectionHeader("overview", Globe, "Basic Trip Overview", "Give a short, exciting overview. This is what people see first.", true)}
                {!collapsedSections.has("overview") && (
                  <CardContent className="space-y-4 pt-0">
                    <Field label="Trip Title" error={errors.title} required>
                      <Input placeholder="e.g. Spiti Valley Road Trip" value={title} onChange={e => setTitle(e.target.value)} />
                    </Field>
                    <Field label="Trip Summary" error={errors.summary} required hint="2–3 line pitch shown on the trip card">
                      <Textarea rows={3} placeholder="A thrilling road trip through Spiti..." value={summary} onChange={e => setSummary(e.target.value)} maxLength={300} />
                      <p className="text-right text-xs text-muted-foreground">{summary.length}/300</p>
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Destination" error={errors.destination} required>
                        <div className="relative"><MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="e.g. Manali, Himachal" value={destination} onChange={e => setDestination(e.target.value)} /></div>
                      </Field>
                      <Field label="Trip Category" error={errors.category} required>
                        <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{TRIP_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                      </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="Start Date" error={errors.startDate} required><div className="relative"><Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div></Field>
                      <Field label="End Date" error={errors.endDate} required><div className="relative"><Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div></Field>
                      <Field label="Booking Closes" error={errors.bookingCloseDate} required><div className="relative"><Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" type="date" value={bookingCloseDate} onChange={e => setBookingCloseDate(e.target.value)} /></div></Field>
                    </div>
                    {duration > 0 && (
                      <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-4 py-2.5">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">{duration} days / {Math.max(0, duration - 1)} nights</span>
                      </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Total Seats" error={errors.totalSeats} required><div className="relative"><Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" type="number" placeholder="12" value={totalSeats} onChange={e => setTotalSeats(e.target.value)} /></div></Field>
                      <Field label="Minimum Seats" hint="Trip proceeds only if filled"><div className="relative"><Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" type="number" placeholder="6" value={minSeats} onChange={e => setMinSeats(e.target.value)} /></div></Field>
                    </div>
                    <Field label="Trip Access Type" required>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {([
                          { value: "open" as const, label: "Open Trip", desc: "Anyone can book instantly" },
                          { value: "apply" as const, label: "Apply to Join", desc: "You approve each application" },
                          { value: "invite" as const, label: "Invite Only", desc: "Only invited people can book" },
                        ]).map(opt => (
                          <button key={opt.value} type="button" onClick={() => setAccessType(opt.value)} className={cn("rounded-lg border p-3 text-left transition-all", accessType === opt.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40")}>
                            <p className="text-sm font-medium text-foreground">{opt.label}</p>
                            <p className="text-xs text-muted-foreground">{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </Field>
                  </CardContent>
                )}
              </Card>

              {/* 2. HERO & MEDIA (unchanged) */}
              <Card id="media" ref={(el) => { sectionRefs.current.media = el; }}>
                {renderSectionHeader("media", Image, "Hero & Media", "Stunning visuals make your trip stand out.")}
                {!collapsedSections.has("media") && (
                  <CardContent className="space-y-4 pt-0">
                    <Field label="Hero Image" required hint="Main cover photo">
                      <div className="flex h-40 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted/50">
                        <div className="text-center"><Image className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">Drag & drop or click to upload</p><p className="text-xs text-muted-foreground">Recommended: 1920×1080px</p></div>
                      </div>
                    </Field>
                    <Field label="Gallery Images" hint="Multiple photos to showcase the trip">
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 hover:border-primary/50"><Plus className="h-5 w-5 text-muted-foreground" /></div>
                        ))}
                      </div>
                    </Field>
                    <Field label="Video Link" hint="YouTube or Instagram reel"><Input placeholder="https://youtube.com/watch?v=..." /></Field>
                  </CardContent>
                )}
              </Card>

              {/* 3. PRICING (simplified) */}
              <Card id="pricing" ref={(el) => { sectionRefs.current.pricing = el; }}>
                {renderSectionHeader("pricing", DollarSign, "Pricing", "Keep it simple and transparent.", true)}
                {!collapsedSections.has("pricing") && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Currency" required>
                        <Select value={currency} onValueChange={setCurrency}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                      </Field>
                      <Field label="Total Trip Cost" error={errors.totalPrice} required>
                        <div className="relative"><DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" type="number" placeholder="25000" value={totalPrice} onChange={e => setTotalPrice(e.target.value)} /></div>
                      </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Early Bird Cost" hint="Discounted price for early sign-ups">
                        <Input type="number" placeholder="e.g. 22000" value={earlyBirdPrice} onChange={e => setEarlyBirdPrice(e.target.value)} />
                      </Field>
                      <Field label="Early Bird Seats Limit" hint="Seats at which early bird pricing ends">
                        <Input type="number" placeholder="e.g. 5" value={earlyBirdSeats} onChange={e => setEarlyBirdSeats(e.target.value)} />
                      </Field>
                    </div>
                    <Field label="Payment Terms">
                      <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Full Payment</SelectItem>
                          <SelectItem value="partial">Partial Advance</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    {paymentTerms === "partial" && (
                      <Field label="Advance Amount Required">
                        <Input type="number" placeholder="e.g. 5000" value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} />
                      </Field>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* 4. HIGHLIGHTS (drag list) */}
              <Card id="highlights" ref={(el) => { sectionRefs.current.highlights = el; }}>
                {renderSectionHeader("highlights", Star, "Highlights", "Top reasons someone should join.")}
                {!collapsedSections.has("highlights") && (
                  <CardContent className="space-y-3 pt-0">
                    {renderDragList(highlights, setHighlights, (i) => `Highlight #${i + 1}`)}
                    <Button variant="outline" size="sm" onClick={() => addListItem(setHighlights)}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Highlight</Button>
                  </CardContent>
                )}
              </Card>

              {/* 5. ITINERARY */}
              <Card id="itinerary" ref={(el) => { sectionRefs.current.itinerary = el; }}>
                {renderSectionHeader("itinerary", Route, "Detailed Itinerary", "Plan each day. Use the description to explain what happens.")}
                {!collapsedSections.has("itinerary") && (
                  <CardContent className="space-y-4 pt-0">
                    {itinerary.map((day, i) => (
                      <div
                        key={day.id}
                        draggable
                        onDragStart={() => { }}
                        onDragOver={e => e.preventDefault()}
                        className="group rounded-lg border bg-card p-4 space-y-3 transition-all hover:border-primary/30 hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                              <GripVertical className="h-5 w-5" />
                            </div>
                            <Badge variant="secondary" className="font-semibold">Day {i + 1}</Badge>
                            {day.isFlexible && <Badge variant="outline" className="text-xs">Flexible</Badge>}
                          </div>
                          <div className="flex items-center gap-1">
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                              <Checkbox checked={day.isFlexible} onCheckedChange={v => updateItineraryDay(i, "isFlexible", !!v)} />Flexible
                            </label>
                            {itinerary.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeItineraryDay(i)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>}
                          </div>
                        </div>
                        <Input placeholder="Day title — e.g. Arrival & Exploration" value={day.title} onChange={e => updateItineraryDay(i, "title", e.target.value)} />
                        <Field label="What happens on this day" hint="Describe activities, experiences, and plan for this day">
                          <RichTextEditor value={day.description} onChange={(val) => updateItineraryDay(i, "description", val)} placeholder="Write about the day's activities, places to visit, experiences planned..." />
                        </Field>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addItineraryDay}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Day</Button>
                  </CardContent>
                )}
              </Card>

              {/* 5b. STAY & ACCOMMODATION */}
              <Card id="stay" ref={(el) => { sectionRefs.current.stay = el; }}>
                {renderSectionHeader("stay", Hotel, "Stay & Accommodation", "Where will participants stay during the trip?")}
                {!collapsedSections.has("stay") && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Accommodation Type" hint="e.g. Hotel, Hostel, Camping, Villa, Homestay">
                        <Select value={accommodationType} onValueChange={setAccommodationType}>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            {["Hotel", "Hostel", "Camping", "Villa", "Homestay", "Resort", "Mixed"].map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Room Sharing" hint="How rooms are shared">
                        <Select value={roomSharing} onValueChange={setRoomSharing}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {["Private", "Twin Sharing", "Triple Sharing", "Dorm"].map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    <Field label="Stay Name" hint="Name of the property (if known)">
                      <Input placeholder="e.g. Zostel Goa — Anjuna" value={stayName} onChange={e => setStayName(e.target.value)} />
                    </Field>
                    <Field label="Stay Description" hint="Describe the accommodation, location, and vibe">
                      <RichTextEditor value={stayDescription} onChange={setStayDescription} placeholder="A vibrant backpacker hostel just 5 minutes from the beach..." minHeight="80px" />
                    </Field>
                    <Field label="Amenities">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {amenities.map((item, i) => (
                          <Badge key={i} variant="secondary" className="gap-1 py-1.5 px-3 text-sm">
                            {item}
                            <button type="button" onClick={() => setAmenities(prev => prev.filter((_, idx) => idx !== i))} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type an amenity and press Enter..."
                          value={amenityInput}
                          onChange={e => setAmenityInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (amenityInput.trim() && !amenities.includes(amenityInput.trim())) {
                                setAmenities(prev => [...prev, amenityInput.trim()]);
                                setAmenityInput("");
                              }
                            }
                          }}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                          if (amenityInput.trim() && !amenities.includes(amenityInput.trim())) {
                            setAmenities(prev => [...prev, amenityInput.trim()]);
                            setAmenityInput("");
                          }
                        }}>Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {["WiFi", "Hot Water", "AC", "Pool", "Breakfast", "Parking", "Laundry", "Power Backup", "Locker"].filter(s => !amenities.includes(s)).map(suggestion => (
                          <button key={suggestion} type="button" onClick={() => setAmenities(prev => [...prev, suggestion])} className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                            + {suggestion}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </CardContent>
                )}
              </Card>

              {/* 6. WHAT'S INCLUDED (drag list) */}
              <Card id="included" ref={(el) => { sectionRefs.current.included = el; }}>
                {renderSectionHeader("included", CheckCircle2, "What's Included", "Everything that's part of the trip cost.")}
                {!collapsedSections.has("included") && (
                  <CardContent className="space-y-3 pt-0">
                    {renderDragList(includedItems, setIncludedItems, () => "e.g. Airport pickup")}
                    <Button variant="outline" size="sm" onClick={() => addListItem(setIncludedItems)}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Item</Button>
                  </CardContent>
                )}
              </Card>

              {/* 7. NOT INCLUDED (drag list) */}
              <Card id="notIncluded" ref={(el) => { sectionRefs.current.notIncluded = el; }}>
                {renderSectionHeader("notIncluded", XCircle, "What's Not Included", "Set expectations clearly.")}
                {!collapsedSections.has("notIncluded") && (
                  <CardContent className="space-y-3 pt-0">
                    {renderDragList(notIncludedItems, setNotIncludedItems, () => "e.g. Flights")}
                    <Button variant="outline" size="sm" onClick={() => addListItem(setNotIncludedItems)}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Item</Button>
                  </CardContent>
                )}
              </Card>

              {/* 8. THINGS TO CARRY (pill tags) */}
              <Card id="thingsToCarry" ref={(el) => { sectionRefs.current.thingsToCarry = el; }}>
                {renderSectionHeader("thingsToCarry", Backpack, "Things to Carry", "Help participants pack right.")}
                {!collapsedSections.has("thingsToCarry") && (
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex flex-wrap gap-2">
                      {thingsToCarry.map((item, i) => (
                        <Badge key={i} variant="secondary" className="gap-1 py-1.5 px-3 text-sm">
                          {item}
                          <button type="button" onClick={() => setThingsToCarry(prev => prev.filter((_, idx) => idx !== i))} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type an item and press Enter..."
                        value={carryInput}
                        onChange={e => setCarryInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCarryItem(); } }}
                      />
                      <Button variant="outline" size="sm" onClick={addCarryItem}><Plus className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* 9. EXPERIENCE & VIBE */}
              <Card id="experience" ref={(el) => { sectionRefs.current.experience = el; }}>
                {renderSectionHeader("experience", Heart, "Trip Experience & Social Context", "Help the right people find this trip.")}
                {!collapsedSections.has("experience") && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Experience Level">
                        <Select value={experienceLevel} onValueChange={setExperienceLevel}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{EXPERIENCE_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
                      </Field>
                      <Field label="Fitness Level">
                        <Select value={fitnessLevel} onValueChange={setFitnessLevel}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{FITNESS_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
                      </Field>
                    </div>

                    <div>
                      <Label className="mb-2 block text-sm font-medium">Suitable For <span className="text-xs text-muted-foreground">(max 3)</span></Label>
                      <div className="flex flex-wrap gap-2">
                        {SUITABLE_FOR_OPTIONS.map(item => (
                          <Badge key={item} variant={suitableFor.includes(item) ? "default" : "outline"} className="cursor-pointer transition-colors" onClick={() => toggleArrayItem(setSuitableFor, item, 3)}>{item}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block text-sm font-medium">Trip Vibe <span className="text-xs text-muted-foreground">(max 3)</span></Label>
                      <div className="flex flex-wrap gap-2">
                        {TRIP_VIBES.map(vibe => (
                          <Badge key={vibe} variant={tripVibes.includes(vibe) ? "default" : "outline"} className="cursor-pointer transition-colors" onClick={() => toggleArrayItem(setTripVibes, vibe, 3)}>{vibe}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Age Preference</Label>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground w-8">{ageRange[0]}</span>
                        <Slider
                          min={16}
                          max={70}
                          step={1}
                          value={ageRange}
                          onValueChange={(val) => setAgeRange(val as [number, number])}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground w-8">{ageRange[1]}</span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={enforceAge} onCheckedChange={v => setEnforceAge(!!v)} />
                        <span className="text-sm text-muted-foreground">Enforce age restriction</span>
                      </label>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* 10. SAFETY & POLICIES */}
              <Card id="safety" ref={(el) => { sectionRefs.current.safety = el; }}>
                {renderSectionHeader("safety", Shield, "Safety & Policies", "Build trust with clear guidelines.")}
                {!collapsedSections.has("safety") && (
                  <CardContent className="space-y-4 pt-0">
                    <Field label="Code of Conduct">
                      <RichTextEditor value={codeOfConduct} onChange={setCodeOfConduct} placeholder="General rules for respectful group travel..." />
                    </Field>
                    <Field label="General Policy">
                      <RichTextEditor value={generalPolicy} onChange={setGeneralPolicy} placeholder="Overall trip policies, guidelines..." />
                    </Field>
                    <Field label="Cancellation Policy" hint="Be clear about refund windows">
                      <RichTextEditor value={cancellationPolicy} onChange={setCancellationPolicy} placeholder="Full refund if cancelled 30 days before..." />
                    </Field>
                    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox checked={medicalDeclaration} onCheckedChange={v => setMedicalDeclaration(!!v)} />
                        <div><p className="text-sm font-medium text-foreground">Medical Declaration Required</p><p className="text-xs text-muted-foreground">Participants must declare medical conditions</p></div>
                      </label>
                      {medicalDeclaration && (
                        <Textarea rows={2} placeholder="Specify medical declaration requirements..." value={medicalDetails} onChange={e => setMedicalDetails(e.target.value)} className="ml-8" />
                      )}
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox checked={emergencyContact} onCheckedChange={v => setEmergencyContact(!!v)} />
                        <div><p className="text-sm font-medium text-foreground">Emergency Contact Required</p><p className="text-xs text-muted-foreground">Participants must provide emergency contact</p></div>
                      </label>
                      {emergencyContact && (
                        <Textarea rows={2} placeholder="Specify emergency contact requirements..." value={emergencyDetails} onChange={e => setEmergencyDetails(e.target.value)} className="ml-8" />
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* APPLICATION SETTINGS (only for Apply to Join) */}
              {accessType === "apply" && (
                <Card id="application" ref={(el) => { sectionRefs.current.application = el; }}>
                  {renderSectionHeader("application", ClipboardList, "Application Settings", "Configure what applicants need to submit.")}
                  {!collapsedSections.has("application") && (
                    <CardContent className="space-y-5 pt-0">
                      {/* Auto-collected fields notice */}
                      <div className="rounded-lg border bg-muted/20 p-4">
                        <p className="text-sm font-medium text-foreground mb-2">Auto-collected from applicants</p>
                        <div className="flex flex-wrap gap-2">
                          {["Full Name", "Email", "Phone", "Age", "Gender (optional)"].map(f => (
                            <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">These fields are always included in the application form.</p>
                      </div>

                      {/* Custom Questions */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Custom Questions</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCustomQuestions(prev => [...prev, {
                              id: `cq-${Date.now()}`,
                              question: "",
                              type: "short" as ApplicationQuestionType,
                              required: true,
                            }])}
                          >
                            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Question
                          </Button>
                        </div>

                        {customQuestions.length === 0 && (
                          <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                            <ClipboardList className="mx-auto h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">No custom questions yet</p>
                            <p className="text-xs">Add questions to learn more about applicants</p>
                          </div>
                        )}

                        {customQuestions.map((q, i) => (
                          <div key={q.id} className="group rounded-lg border bg-card p-4 space-y-3 transition-all hover:border-primary/30 hover:shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                                  <GripVertical className="h-5 w-5" />
                                </div>
                                <Badge variant="secondary" className="text-xs">Q{i + 1}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                                  <Switch
                                    checked={q.required}
                                    onCheckedChange={v => setCustomQuestions(prev => prev.map((cq, idx) => idx === i ? { ...cq, required: v } : cq))}
                                    className="scale-75"
                                  />
                                  Required
                                </label>
                                <Button variant="ghost" size="icon" onClick={() => setCustomQuestions(prev => prev.filter((_, idx) => idx !== i))} className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            </div>
                            <Input
                              value={q.question}
                              onChange={e => setCustomQuestions(prev => prev.map((cq, idx) => idx === i ? { ...cq, question: e.target.value } : cq))}
                              placeholder="e.g. Why do you want to join this trip?"
                            />
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                              {([
                                { value: "short", label: "Short text" },
                                { value: "long", label: "Long text" },
                                { value: "single_select", label: "Single select" },
                                { value: "multiple_choice", label: "Multi choice" },
                              ] as { value: ApplicationQuestionType; label: string }[]).map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setCustomQuestions(prev => prev.map((cq, idx) => idx === i ? { ...cq, type: opt.value } : cq))}
                                  className={cn(
                                    "rounded-md border px-2 py-1.5 text-xs transition-all",
                                    q.type === opt.value ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-muted-foreground hover:border-primary/40"
                                  )}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                            {(q.type === "single_select" || q.type === "multiple_choice") && (
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Options (comma-separated)</Label>
                                <Input
                                  value={(q.options || []).join(", ")}
                                  onChange={e => setCustomQuestions(prev => prev.map((cq, idx) => idx === i ? { ...cq, options: e.target.value.split(",").map(o => o.trim()).filter(Boolean) } : cq))}
                                  placeholder="Option 1, Option 2, Option 3"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Approval Settings */}
                      <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                        <p className="text-sm font-medium text-foreground">Approval Settings</p>
                        <label className="flex items-center justify-between cursor-pointer">
                          <div>
                            <p className="text-sm text-foreground">Auto-approve applications</p>
                            <p className="text-xs text-muted-foreground">Automatically accept all applicants (not recommended for curated trips)</p>
                          </div>
                          <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
                        </label>
                        {!autoApprove && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Shield className="h-3 w-3" /> You'll manually review and approve each application
                          </p>
                        )}
                      </div>

                      {/* Capacity note */}
                      <div className="rounded-lg bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                        <Sparkles className="inline h-4 w-4 mr-1.5 text-primary" />
                        Only approved applicants count toward seat capacity. Pending applications do not block seats.
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}

              {/* 11. FAQs (with reorder) */}
              <Card id="faqs" ref={(el) => { sectionRefs.current.faqs = el; }}>
                {renderSectionHeader("faqs", HelpCircle, "FAQs", "Answer common questions upfront.")}
                {!collapsedSections.has("faqs") && (
                  <CardContent className="space-y-4 pt-0">
                    {faqs.map((faq, i) => (
                      <div key={faq.id} className="group rounded-lg border bg-card p-4 space-y-3 transition-all hover:border-primary/30 hover:shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                              <GripVertical className="h-5 w-5" />
                            </div>
                            <Badge variant="secondary" className="text-xs">Q{i + 1}</Badge>
                          </div>
                          {faqs.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeFAQ(i)} className="opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>}
                        </div>
                        <Input placeholder="e.g. Is this trip beginner-friendly?" value={faq.question} onChange={e => updateFAQ(i, "question", e.target.value)} />
                        <RichTextEditor value={faq.answer} onChange={(val) => updateFAQ(i, "answer", val)} placeholder="Your answer..." minHeight="60px" />
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addFAQ}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add FAQ</Button>
                  </CardContent>
                )}
              </Card>

              {/* 12. HOST INFO */}
              <Card id="host" ref={(el) => { sectionRefs.current.host = el; }}>
                {renderSectionHeader("host", UserCircle, "Host Information", "Your profile and contact preferences.")}
                {!collapsedSections.has("host") && (
                  <CardContent className="space-y-4 pt-0">
                    {user ? (
                      <div className="flex items-center gap-4 rounded-lg border bg-muted/20 p-4">
                        <img src={user.avatar} alt={user.name} className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/20" />
                        <div>
                          <p className="text-xs text-muted-foreground">Posted by</p>
                          <p className="font-semibold text-foreground">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.bio || "Travel enthusiast"}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border bg-muted/20 p-4 text-center">
                        <p className="text-sm text-muted-foreground">Log in to auto-populate your profile</p>
                      </div>
                    )}
                    <div>
                      <Label className="mb-2 block text-sm font-medium">Contact Preference <span className="text-xs text-muted-foreground">(multi-select)</span></Label>
                      <div className="flex flex-wrap gap-2">
                        {CONTACT_OPTIONS.map(opt => (
                          <Badge key={opt} variant={contactPreferences.includes(opt) ? "default" : "outline"} className="cursor-pointer transition-colors" onClick={() => toggleArrayItem(setContactPreferences, opt)}>{opt}</Badge>
                        ))}
                      </div>
                    </div>
                    <Field label="Hosts" hint="Add additional hosts (comma-separated names)">
                      <Input value={hosts} onChange={e => setHosts(e.target.value)} placeholder="e.g. @priya, @ravi" />
                    </Field>
                  </CardContent>
                )}
              </Card>

              {/* Bottom Actions */}
              <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">{completedSections.length} of {SECTIONS.length} sections • {progressPercent}%</div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSaveDraft} disabled={savedDraft}><Save className="mr-1.5 h-4 w-4" />{savedDraft ? "Saved!" : "Save Draft"}</Button>
                  <Button variant="outline"><Eye className="mr-1.5 h-4 w-4" />Preview</Button>
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
