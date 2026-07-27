import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import type { TripData } from "@/types/api";

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: TripData;
  tripId: number;
  onReviewSubmitted?: () => void;
  initialReview?: { rating?: number; headline?: string; body?: string } | null;
}

const ReviewModal = ({ open, onOpenChange, trip, tripId, onReviewSubmitted, initialReview }: ReviewModalProps) => {
  const [step, setStep] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [headline, setHeadline] = useState("");
  const [loved, setLoved] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && initialReview) {
      setRating(initialReview.rating || 0);
      setHeadline(initialReview.headline || "");
      setLoved(initialReview.body || "");
    }
  }, [open, initialReview]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      const data = await apiPost<{ ok: boolean; error?: string }>(
        `${cfg.api.trip_reviews}${tripId}/reviews/`,
        { rating, body: loved, headline }
      );
      if (data.ok === false && data.error) {
        toast.error(data.error);
        return;
      }
      toast.success("Thanks for sharing your experience ❤️");
      onOpenChange(false);
      resetForm();
      onReviewSubmitted?.();
    } catch (err: any) {
      toast.error(err?.error || "Could not submit review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(0);
    setRating(0);
    setHeadline("");
    setLoved("");
  };

  const ratingLabels = ["", "Poor", "Fair", "Good", "Great", "Amazing"];

  const totalSteps = 2;
  const currentProgress = step + 1;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Progress indicator */}
        <div className="flex gap-1.5 mb-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i < currentProgress ? "bg-primary" : "bg-muted")} />
          ))}
        </div>

        {/* Step 0: Rating */}
        {step === 0 && (
          <div className="space-y-6 py-2">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">How was your overall experience?</h3>
              <p className="text-xs text-muted-foreground mt-1">Don't overthink it — just your gut feeling</p>
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
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
              <Button onClick={() => setStep(1)} disabled={rating === 0} className="flex-1">Continue <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 1: Feedback */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Headline <span className="text-xs text-muted-foreground">(optional)</span></label>
              <input type="text" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Sum it up in a few words"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">What did you love the most? *</label>
              <Textarea rows={3} value={loved} onChange={e => setLoved(e.target.value)} placeholder="The people, the places, the vibe..." />
              <p className="text-xs text-muted-foreground">{loved.length < 10 ? `${10 - loved.length} more chars needed` : "✓"}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
              <Button onClick={handleSubmit} disabled={loading || loved.length < 10} className="flex-1">
                {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
                {loading ? "Submitting..." : "Post Review"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
