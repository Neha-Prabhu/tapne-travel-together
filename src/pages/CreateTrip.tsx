import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TRIP_TYPES } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const CreateTrip = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", destination: "", startDate: "", endDate: "",
    budget: "", tripType: "", description: "", maxGroupSize: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.destination.trim()) e.destination = "Destination is required";
    if (!form.startDate) e.startDate = "Start date is required";
    if (!form.endDate) e.endDate = "End date is required";
    if (form.startDate && form.endDate && form.endDate <= form.startDate)
      e.endDate = "End date must be after start date";
    if (!form.budget || isNaN(Number(form.budget)) || Number(form.budget) <= 0)
      e.budget = "Enter a valid budget";
    if (!form.tripType) e.tripType = "Select a trip type";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.maxGroupSize || isNaN(Number(form.maxGroupSize)) || Number(form.maxGroupSize) < 2)
      e.maxGroupSize = "Min group size is 2";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.info("Please log in first"); navigate("/login"); return; }
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    toast.success("Trip created successfully! 🎉");
    navigate("/trips");
    setLoading(false);
  };

  const update = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Create a Trip</h1>
          <p className="mb-8 text-muted-foreground">Share your adventure and find travel buddies</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Trip Title" error={errors.title}>
              <Input placeholder="e.g. Goa Backpacking Adventure" value={form.title} onChange={(e) => update("title", e.target.value)} />
            </Field>
            <Field label="Destination" error={errors.destination}>
              <Input placeholder="e.g. Goa, India" value={form.destination} onChange={(e) => update("destination", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start Date" error={errors.startDate}>
                <Input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
              </Field>
              <Field label="End Date" error={errors.endDate}>
                <Input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Budget (INR)" error={errors.budget}>
                <Input type="number" placeholder="15000" value={form.budget} onChange={(e) => update("budget", e.target.value)} />
              </Field>
              <Field label="Max Group Size" error={errors.maxGroupSize}>
                <Input type="number" placeholder="8" value={form.maxGroupSize} onChange={(e) => update("maxGroupSize", e.target.value)} />
              </Field>
            </div>
            <Field label="Trip Type" error={errors.tripType}>
              <Select value={form.tripType} onValueChange={(v) => update("tripType", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {TRIP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Description" error={errors.description}>
              <Textarea rows={5} placeholder="Tell travelers what to expect..." value={form.description} onChange={(e) => update("description", e.target.value)} />
            </Field>

            <Button type="submit" className="w-full transition-transform hover:scale-[1.02]" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Trip"}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <Label className="mb-1.5 block text-sm font-medium">{label}</Label>
    {children}
    {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
  </div>
);

export default CreateTrip;
