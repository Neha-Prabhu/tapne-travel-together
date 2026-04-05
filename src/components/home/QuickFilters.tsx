import { Badge } from "@/components/ui/badge";

const FILTERS: { value: string; label: string }[] = [
  { value: "city", label: "City Break" },
  { value: "trekking", label: "Trekking" },
  { value: "coastal", label: "Beach & Coastal" },
  { value: "culture-heritage", label: "Culture & Heritage" },
  { value: "food-culture", label: "Food & Culinary" },
  { value: "road-trip", label: "Road Trip" },
  { value: "wildlife", label: "Wildlife & Safari" },
  { value: "camping", label: "Camping" },
  { value: "wellness", label: "Wellness" },
  { value: "adventure-sports", label: "Adventure Sports" },
  { value: "desert", label: "Desert Expedition" },
];

interface QuickFiltersProps {
  active: string | null;
  onSelect: (filter: string | null) => void;
}

const QuickFilters = ({ active, onSelect }: QuickFiltersProps) => (
  <div className="mb-4">
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {FILTERS.map((f) => (
        <Badge
          key={f.value}
          variant={active === f.value ? "default" : "outline"}
          className="shrink-0 cursor-pointer rounded-full px-4 py-1.5 text-sm transition-colors hover:bg-primary/10"
          onClick={() => onSelect(active === f.value ? null : f.value)}
        >
          {f.label}
        </Badge>
      ))}
    </div>
  </div>
);

export default QuickFilters;
