import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HorizontalCarouselProps {
  children: React.ReactNode;
  className?: string;
}

const HorizontalCarousel = ({ children, className }: HorizontalCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className={`group/carousel relative ${className || ""}`}>
      <button
        onClick={() => scroll("left")}
        className="absolute -left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border bg-card shadow-md transition-opacity group-hover/carousel:flex hover:bg-muted"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
        {children}
      </div>
      <button
        onClick={() => scroll("right")}
        className="absolute -right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border bg-card shadow-md transition-opacity group-hover/carousel:flex hover:bg-muted"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default HorizontalCarousel;
