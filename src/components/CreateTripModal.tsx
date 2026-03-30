import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDrafts } from "@/contexts/DraftContext";
import { Plus, FileText, ArrowRight, Clock, MapPin } from "lucide-react";

interface CreateTripModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateTripModal = ({ open, onOpenChange }: CreateTripModalProps) => {
  const navigate = useNavigate();
  const { drafts, createDraft } = useDrafts();

  const recentDrafts = drafts.filter(d => d.status === "draft").slice(0, 3);

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const handleNewTrip = () => {
    const id = createDraft();
    onOpenChange(false);
    navigate(`/create-trip?draft=${id}`);
  };

  const handleContinueDraft = (id: string) => {
    onOpenChange(false);
    navigate(`/create-trip?draft=${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a Trip</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* New Trip */}
          <Button onClick={handleNewTrip} className="w-full justify-start gap-3 h-14 text-base">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/20">
              <Plus className="h-5 w-5" />
            </div>
            Start a New Trip
          </Button>

          {/* Recent Drafts */}
          {recentDrafts.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Continue a Draft</p>
              <div className="space-y-2">
                {recentDrafts.map(draft => (
                  <Card
                    key={draft.id}
                    className="cursor-pointer transition-all hover:shadow-sm hover:border-primary/30"
                    onClick={() => handleContinueDraft(draft.id)}
                  >
                    <CardContent className="flex items-center gap-3 p-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {draft.title || "Untitled Trip"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          {draft.destination && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" /> {draft.destination}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" /> {timeAgo(draft.lastEditedAt)}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {drafts.filter(d => d.status === "draft").length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full text-primary"
                  onClick={() => { onOpenChange(false); navigate("/my-trips"); }}
                >
                  View All Drafts <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTripModal;
