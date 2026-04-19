import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, MapPin, Users, Star, CheckCircle2, XCircle, Backpack } from "lucide-react";

interface TripPreviewViewProps {
  data: any;
  hostName?: string;
  hostBio?: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", THB: "฿", IDR: "Rp",
};

const TripPreviewView = ({ data, hostName, hostBio }: TripPreviewViewProps) => {
  const sym = CURRENCY_SYMBOLS[data.currency] || (data.currency ? `${data.currency} ` : "");
  const duration = data.startDate && data.endDate
    ? Math.max(0, Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 86400000))
    : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {data.heroImage && (
        <div className="mb-6 overflow-hidden rounded-2xl">
          <img src={data.heroImage} alt={data.title} className="aspect-[21/9] w-full object-cover" />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {data.category && <Badge variant="secondary">{data.category}</Badge>}
        {data.destination && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />{data.destination}
          </span>
        )}
      </div>

      <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">{data.title || "Untitled trip"}</h1>
      {data.summary && <p className="mb-6 text-lg text-muted-foreground">{data.summary}</p>}

      <div className="mb-8 grid grid-cols-2 gap-4 rounded-xl border bg-card p-4 sm:grid-cols-4">
        <div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />Duration</div>
          <div className="mt-1 text-sm font-medium text-foreground">{duration > 0 ? `${duration} days` : "—"}</div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" />Group size</div>
          <div className="mt-1 text-sm font-medium text-foreground">{data.totalSeats || "—"}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Starts</div>
          <div className="mt-1 text-sm font-medium text-foreground">
            {data.startDate ? new Date(data.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Price</div>
          <div className="mt-1 text-sm font-medium text-foreground">{data.totalPrice ? `${sym}${data.totalPrice}` : "—"}</div>
        </div>
      </div>

      {data.highlights?.some((h: string) => h.trim()) && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold"><Star className="h-5 w-5 text-primary" />Highlights</h2>
          <ul className="space-y-2">
            {data.highlights.filter((h: string) => h.trim()).map((h: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{h}
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.itinerary?.some((d: any) => d.title?.trim()) && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Itinerary</h2>
          <div className="space-y-3">
            {data.itinerary.filter((d: any) => d.title?.trim()).map((d: any, i: number) => (
              <div key={d.id || i} className="rounded-lg border bg-card p-4">
                <div className="mb-1 text-xs font-medium text-primary">Day {i + 1}</div>
                <div className="font-medium text-foreground">{d.title}</div>
                {d.description && <p className="mt-1 text-sm text-muted-foreground">{d.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {(data.includedItems?.length > 0 || data.notIncludedItems?.length > 0) && (
        <section className="mb-8 grid gap-6 sm:grid-cols-2">
          {data.includedItems?.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-base font-semibold"><CheckCircle2 className="h-4 w-4 text-primary" />Included</h3>
              <ul className="space-y-1.5 text-sm text-foreground">
                {data.includedItems.map((it: string, i: number) => <li key={i}>• {it}</li>)}
              </ul>
            </div>
          )}
          {data.notIncludedItems?.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-base font-semibold"><XCircle className="h-4 w-4 text-muted-foreground" />Not Included</h3>
              <ul className="space-y-1.5 text-sm text-foreground">
                {data.notIncludedItems.map((it: string, i: number) => <li key={i}>• {it}</li>)}
              </ul>
            </div>
          )}
        </section>
      )}

      {data.thingsToCarry?.length > 0 && (
        <section className="mb-8">
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold"><Backpack className="h-4 w-4" />Things to Carry</h3>
          <div className="flex flex-wrap gap-2">
            {data.thingsToCarry.map((t: string, i: number) => (
              <Badge key={i} variant="secondary">{t}</Badge>
            ))}
          </div>
        </section>
      )}

      {hostName && (
        <section className="mb-8 rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-base font-semibold">Hosted by</h3>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{hostName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium text-foreground">{hostName}</div>
              {hostBio && <div className="text-xs text-muted-foreground">{hostBio}</div>}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default TripPreviewView;
