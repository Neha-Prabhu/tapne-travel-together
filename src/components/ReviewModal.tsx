import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Star, Camera, ArrowLeft, ArrowRight, Check, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Trip } from "@/data/mockData";

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
  trip: Trip;
}

const ReviewModal = ({ open, onOpenChange, trip }: ReviewModalProps) => {
  const [step, setStep] = useState(0);

  // Step 1
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);

  // Step 2
  const [loved, setLoved] = useState("");
  const [improve, setImprove] = useState("");
  const [travelAgain, setTravelAgain] = useState<string>("");

  // Step 3
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Step 4
  const [photos, setPhotos] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handlePhotoUpload = () => {
    // Mock — in real app, open file picker
    const mockUrls = [
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=200&q=60",
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=200&q=60",
    ];
    const next = mockUrls[photos.length % mockUrls.length];
    setPhotos(prev => [...prev, next]);
    toast.success("Photo added!");
  };

  const handleSubmit = () => {
    toast.success("Thanks for sharing your experience ❤️");
    onOpenChange(false);
    // reset
    setStep(0);
    setRating(0);
    setLoved("");
    setImprove("");
    setTravelAgain("");
    setSelectedTags([]);
    setPhotos([]);
  };

  const canProceed = () => {
    if (step === 1) return rating > 0;
    if (step === 2) return loved.trim().length >= 10;
    return true;
  };

  const ratingLabels = ["", "Bad", "Okay", "Good", "Great", "Amazing!"];

  const totalSteps = 5; // 0=intro, 1=rating, 2=feedback, 3=tags, 4=photos, then summary on submit

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        {/* Progress bar */}
        {step > 0 && (
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        )}

        <div className="p-6">
          {/* ─── Step 0: Intro ─── */}
          {step === 0 && (
            <div className="text-center py-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">How was your trip?</h2>
              <p className="text-muted-foreground mb-1">{trip.title}</p>
              <p className="text-sm text-muted-foreground mb-8">
                Your experience helps others find the right people and trips.
              </p>
              <Button size="lg" onClick={() => setStep(1)} className="px-8">
                Write Review <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* ─── Step 1: Rating ─── */}
          {step === 1 && (
            <div className="text-center py-4">
              <h3 className="text-xl font-semibold text-foreground mb-2">Overall Experience</h3>
              <p className="text-sm text-muted-foreground mb-6">Don't overthink it — just your gut feeling</p>

              <div className="flex justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoveredStar(s)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "h-10 w-10 transition-colors",
                        (hoveredStar || rating) >= s
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      )}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm font-medium text-primary">{ratingLabels[rating]}</p>
              )}
            </div>
          )}

          {/* ─── Step 2: Structured Feedback ─── */}
          {step === 2 && (
            <div className="space-y-5">
              <h3 className="text-xl font-semibold text-foreground">Tell us more</h3>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  What did you love the most? <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g., The group vibes were incredible..."
                  value={loved}
                  onChange={e => setLoved(e.target.value)}
                />
                {loved.length > 0 && loved.length < 10 && (
                  <p className="text-xs text-destructive mt-1">At least 10 characters</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  What could have been better? <span className="text-xs text-muted-foreground">(optional)</span>
                </label>
                <Input
                  placeholder="e.g., More free time would've been nice"
                  value={improve}
                  onChange={e => setImprove(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Would you travel with this group again?
                </label>
                <div className="flex gap-2">
                  {["Yes", "Maybe", "No"].map(opt => (
                    <Button
                      key={opt}
                      variant={travelAgain === opt ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTravelAgain(opt)}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 3: Tags ─── */}
          {step === 3 && (
            <div className="space-y-5">
              <h3 className="text-xl font-semibold text-foreground">Quick tags</h3>
              <p className="text-sm text-muted-foreground -mt-3">Select all that apply</p>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">What went well</p>
                <div className="flex flex-wrap gap-2">
                  {POSITIVE_TAGS.map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all text-sm px-3 py-1.5",
                        selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-primary/10"
                      )}
                      onClick={() => toggleTag(tag)}
                    >
                      {selectedTags.includes(tag) && <Check className="h-3 w-3 mr-1" />}
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">What could improve</p>
                <div className="flex flex-wrap gap-2">
                  {NEGATIVE_TAGS.map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "destructive" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all text-sm px-3 py-1.5",
                        selectedTags.includes(tag)
                          ? ""
                          : "hover:bg-destructive/10"
                      )}
                      onClick={() => toggleTag(tag)}
                    >
                      {selectedTags.includes(tag) && <Check className="h-3 w-3 mr-1" />}
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 4: Photos ─── */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Add photos</h3>
              <p className="text-sm text-muted-foreground -mt-2">Show others what this trip looked like</p>

              <div className="grid grid-cols-3 gap-2">
                {photos.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handlePhotoUpload}
                  className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <Camera className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add</span>
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 5: Summary ─── */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Review Summary</h3>

              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={cn("h-4 w-4", s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{ratingLabels[rating]}</span>
                </div>

                {loved && (
                  <div>
                    <p className="text-xs text-muted-foreground">Loved</p>
                    <p className="text-sm">{loved}</p>
                  </div>
                )}

                {improve && (
                  <div>
                    <p className="text-xs text-muted-foreground">Could improve</p>
                    <p className="text-sm">{improve}</p>
                  </div>
                )}

                {travelAgain && (
                  <div>
                    <p className="text-xs text-muted-foreground">Travel again</p>
                    <p className="text-sm">{travelAgain}</p>
                  </div>
                )}

                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}

                {photos.length > 0 && (
                  <div className="flex gap-2">
                    {photos.map((url, i) => (
                      <img key={i} src={url} alt="" className="h-12 w-12 rounded-md object-cover" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Navigation ─── */}
          {step > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(s => s - 1)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>

              {step < 5 ? (
                <Button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canProceed()}
                >
                  {step === 4 ? "Review" : "Next"} <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit}>
                  Submit Review <Check className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Skip for optional steps */}
          {(step === 3 || step === 4) && (
            <div className="text-center mt-2">
              <button
                onClick={() => setStep(s => s + 1)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip this step
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
