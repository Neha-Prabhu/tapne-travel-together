import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { TripData } from "@/types/api";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Calendar, MapPin, Users, IndianRupee, CheckCircle2, Loader2,
  ArrowRight, ArrowLeft, Shield, PartyPopper
} from "lucide-react";

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: TripData;
}

const STEPS = ["Summary", "Your Details", "Confirm"];

const BookingModal = ({ open, onOpenChange, trip }: BookingModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");

  const price = trip.price_per_person || trip.total_trip_price || 0;
  const isPartial = trip.payment_terms === "partial";
  const payableNow = price; // server handles partial logic
  const duration = trip.duration_days || (trip.starts_at && trip.ends_at
    ? Math.max(0, Math.ceil((new Date(trip.ends_at).getTime() - new Date(trip.starts_at).getTime()) / 86400000))
    : 0);
  const spotsLeft = trip.spots_left ?? (trip.total_seats || 0);

  const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      await apiPost(`${cfg.api.trips}${trip.id}/join-request/`, {
        message: `${name} | ${phone}`,
      });
      setStep(3);
      toast.success("Booking confirmed! 🎉");
    } catch (err: any) {
      if (err?.error === "already_requested") {
        toast.error("You already have a pending application");
      } else {
        toast.error(err?.error || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep2 = name.trim() && email.trim() && phone.trim();

  const resetAndClose = () => {
    setStep(0);
    setAgreed(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {step < 3 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Book Your Trip</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                {STEPS.map((s, i) => (
                  <span key={s} className={cn("font-medium", i <= step ? "text-primary" : "")}>{s}</span>
                ))}
              </div>
              <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />
            </div>
          </>
        )}

        {/* Step 1: Summary */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <h3 className="font-semibold text-foreground">{trip.title}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />{trip.destination}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />{duration}D / {Math.max(0, duration - 1)}N
                </div>
                {trip.starts_at && trip.ends_at && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />{fmtDate(trip.starts_at)} – {fmtDate(trip.ends_at)}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />{spotsLeft} spots left
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price per person</span>
                <span className="font-semibold">₹{price.toLocaleString()}</span>
              </div>
              {isPartial ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment type</span>
                    <Badge variant="secondary" className="text-xs">Partial advance</Badge>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="font-medium">Total payable</span>
                  <span className="font-bold text-primary">₹{price.toLocaleString()}</span>
                </div>
              )}
            </div>

            <Button className="w-full" onClick={() => setStep(1)}>
              Continue <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Traveler Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Full Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Email *</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Phone *</Label>
                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(2)} disabled={!canProceedStep2} className="flex-1">
                Continue <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Trip</span><span className="font-medium">{trip.title}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Traveler</span><span className="font-medium">{name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{email}</span></div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Amount to pay</span>
                <span className="font-bold text-primary">₹{payableNow.toLocaleString()}</span>
              </div>
            </div>

            {trip.cancellation_policy && (
              <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 mb-1 font-medium text-foreground">
                  <Shield className="h-3.5 w-3.5" /> Cancellation Policy
                </div>
                {trip.cancellation_policy}
              </div>
            )}

            <label className="flex items-start gap-2.5 cursor-pointer">
              <Checkbox checked={agreed} onCheckedChange={v => setAgreed(!!v)} className="mt-0.5" />
              <span className="text-sm text-muted-foreground">I agree to the trip policies and cancellation terms</span>
            </label>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleConfirm} disabled={!agreed || loading} className="flex-1">
                {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
                Confirm & Pay
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 3 && (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <PartyPopper className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Booking Confirmed!</h3>
              <p className="mt-1 text-sm text-muted-foreground">You're going to {trip.destination}!</p>
            </div>
            <div className="rounded-lg border p-4 text-sm text-left space-y-1.5">
              <div className="flex justify-between"><span className="text-muted-foreground">Trip</span><span className="font-medium">{trip.title}</span></div>
              {trip.starts_at && trip.ends_at && (
                <div className="flex justify-between"><span className="text-muted-foreground">Dates</span><span className="font-medium">{fmtDate(trip.starts_at)} – {fmtDate(trip.ends_at)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Amount paid</span><span className="font-bold text-primary">₹{payableNow.toLocaleString()}</span></div>
            </div>
            <p className="text-xs text-muted-foreground">A confirmation has been sent to your email.</p>
            <Button onClick={resetAndClose} className="w-full">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
