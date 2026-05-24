import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HorizontalCarouselProps {
  children: React.ReactNode;
  className?: string;
}

const HorizontalCarousel = ({ children, className }: HorizontalCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [arrowTop, setArrowTop] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const overflow = el.scrollWidth > el.clientWidth + 1;
      setHasOverflow(overflow);
      const first = el.firstElementChild as HTMLElement | null;
      const h = first?.offsetHeight ?? el.clientHeight;
      setArrowTop(h / 2);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c as Element));
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [children]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className={`group/carousel relative ${className || ""}`}>
      {hasOverflow && (
        <button
          onClick={() => scroll("left")}
          style={arrowTop != null ? { top: arrowTop } : undefined}
          className="absolute -left-3 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border bg-card shadow-md transition-opacity group-hover/carousel:flex hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      <div
        ref={scrollRef}
        className={`flex items-stretch gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth ${
          hasOverflow ? "" : "justify-center"
        }`}
      >
        {children}
      </div>
      {hasOverflow && (
        <button
          onClick={() => scroll("right")}
          style={arrowTop != null ? { top: arrowTop } : undefined}
          className="absolute -right-3 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border bg-card shadow-md transition-opacity group-hover/carousel:flex hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default HorizontalCarousel;
