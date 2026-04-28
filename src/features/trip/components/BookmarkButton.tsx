import { useState } from "react";
import { Bookmark } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBookmarks } from "@/contexts/BookmarksContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  tripId: number;
  /** @deprecated state now comes from BookmarksContext */
  initialBookmarked?: boolean;
  className?: string;
  size?: "sm" | "md";
}

const BookmarkButton = ({ tripId, className, size = "md" }: BookmarkButtonProps) => {
  const { isAuthenticated, requireAuth } = useAuth();
  const { isBookmarked, add, remove } = useBookmarks();
  const bookmarked = isBookmarked(tripId);
  const [animating, setAnimating] = useState(false);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      requireAuth(() => toggle(e));
      return;
    }

    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    if (bookmarked) {
      remove(tripId).catch(() => {});
      toast("Removed from saved");
    } else {
      add(tripId).catch(() => {});
      toast("Saved!");
    }
  };

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center justify-center rounded-full transition-all duration-200",
        size === "sm" ? "h-8 w-8" : "h-9 w-9",
        "bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm",
        animating && "scale-125",
        className
      )}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark trip"}
    >
      <Bookmark
        className={cn(
          iconSize,
          "transition-colors duration-200",
          bookmarked ? "fill-primary text-primary" : "text-foreground/70"
        )}
      />
    </button>
  );
};

export default BookmarkButton;
