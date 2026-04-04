import { Badge } from "@/components/ui/badge";

const FILTERS = ["Backpacking", "Treks", "Chill", "Social", "Workations", "Beach", "Cultural", "Adventure"];

interface QuickFiltersProps {
  active: string | null;
  onSelect: (filter: string | null) => void;
}

const QuickFilters = ({ active, onSelect }: QuickFiltersProps) => (
  <div className="mx-auto max-w-6xl px-4 py-4">
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {FILTERS.map((f) => (
        <Badge
          key={f}
          variant={active === f ? "default" : "outline"}
          className="shrink-0 cursor-pointer rounded-full px-4 py-1.5 text-sm transition-colors hover:bg-primary/10"
          onClick={() => onSelect(active === f ? null : f)}
        >
          {f}
        </Badge>
      ))}
    </div>
  </div>
);

export default QuickFilters;
