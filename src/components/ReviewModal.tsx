import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Star, Camera, ArrowLeft, ArrowRight, Check, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { TripData } from "@/types/api";

const POSITIVE_TAGS = [
  "Well organized", "Great people", "Worth the money",
  "Amazing itinerary", "Good vibes", "Helpful host",
];
const NEGATIVE_TAGS = [
  "Poor planning", "Miscommunication", "Not worth the price",
  "Felt rushed", "Safety concerns", "Uncomfortable stay",
];

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: TripData;
}

const ReviewModal = ({ open, onOpenChange, trip }: ReviewModalProps) => {
  const [step, setStep] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loved, setLoved] = useState("");
  const [improve, setImprove] = useState("");
  const [travelAgain, setTravelAgain] = useState<"Yes" | "Maybe" | "No" | "">("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = () => {
    toast.success("Thanks for sharing your experience ❤️");
    onOpenChange(false);
    setStep(0);
    setRating(0);
    setLoved("");
    setImprove("");
    setTravelAgain("");
    setSelectedTags([]);
    setPhotos([]);
  };

  const ratingLabels = ["", "Poor", "Fair", "Good", "Great", "Amazing"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Step 0: Intro */}
        {step === 0 && (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">How was your trip?</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Your experience helps others find the right people and trips.
            </p>
            <Button onClick={() => setStep(1)} className="w-full">Write Review</Button>
          </div>
        )}

        {/* Step 1: Rating */}
        {step === 1 && (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-1">How was your overall experience?</h3>
              <p className="text-xs text-muted-foreground">Don't overthink it — just your gut feeling</p>
            </div>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)} className="transition-transform hover:scale-110">
                  <Star className={cn("h-10 w-10 transition-colors", (hoverRating || rating) >= s ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                </button>
              ))}
            </div>
            {rating > 0 && <p className="text-center text-sm font-medium text-primary">{ratingLabels[rating]}</p>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(2)} disabled={rating === 0} className="flex-1">Continue <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 2: Feedback */}
        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">What did you love the most? *</label>
              <Textarea rows={3} value={loved} onChange={e => setLoved(e.target.value)} placeholder="The people, the places, the vibe..." />
              <p className="text-xs text-muted-foreground">{loved.length < 10 ? `${10 - loved.length} more chars needed` : "✓"}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">What could have been better? <span className="text-xs text-muted-foreground">(optional)</span></label>
              <Textarea rows={2} value={improve} onChange={e => setImprove(e.target.value)} placeholder="Anything you'd improve..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Would you travel with this group again?</label>
              <div className="flex gap-2">
                {(["Yes", "Maybe", "No"] as const).map(opt => (
                  <Button key={opt} variant={travelAgain === opt ? "default" : "outline"} size="sm" onClick={() => setTravelAgain(opt)} className="flex-1">{opt}</Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(3)} disabled={loved.length < 10} className="flex-1">Continue <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 3: Tags */}
        {step === 3 && (
          <div className="space-y-4 py-4">
            <h3 className="text-lg font-semibold text-center">Quick tags</h3>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Positive</p>
              <div className="flex flex-wrap gap-2">
                {POSITIVE_TAGS.map(tag => (
                  <Badge key={tag} variant={selectedTags.includes(tag) ? "default" : "outline"} className="cursor-pointer transition-colors" onClick={() => toggleTag(tag)}>{tag}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Could improve</p>
              <div className="flex flex-wrap gap-2">
                {NEGATIVE_TAGS.map(tag => (
                  <Badge key={tag} variant={selectedTags.includes(tag) ? "destructive" : "outline"} className="cursor-pointer transition-colors" onClick={() => toggleTag(tag)}>{tag}</Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(4)} className="flex-1">Continue <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 4: Photos */}
        {step === 4 && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <Camera className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <h3 className="text-lg font-semibold">Add photos from your trip</h3>
              <p className="text-xs text-muted-foreground">Optional — builds authenticity</p>
            </div>
            <div className="flex gap-3 justify-center">
              {photos.map((url, i) => (
                <div key={i} className="relative h-20 w-20">
                  <img src={url} alt="" className="h-full w-full rounded-lg object-cover" />
                  <button onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5"><X className="h-3 w-3 text-white" /></button>
                </div>
              ))}
              <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary/50">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(5)} className="flex-1">Review <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 5: Summary */}
        {step === 5 && (
          <div className="space-y-4 py-4">
            <h3 className="text-lg font-semibold text-center">Review Summary</h3>
            <div className="rounded-lg border p-4 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Rating:</span>
                <div className="flex">{[1, 2, 3, 4, 5].map(s => <Star key={s} className={cn("h-4 w-4", s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />)}</div>
              </div>
              <div><span className="text-muted-foreground">Loved:</span> <span>{loved}</span></div>
              {improve && <div><span className="text-muted-foreground">Improve:</span> <span>{improve}</span></div>}
              {travelAgain && <div><span className="text-muted-foreground">Travel again:</span> <span>{travelAgain}</span></div>}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1">{selectedTags.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(4)} className="flex-1"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
              <Button onClick={handleSubmit} className="flex-1"><Check className="mr-1.5 h-4 w-4" /> Submit Review</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
