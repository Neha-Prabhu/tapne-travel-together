import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trip, ApplicationQuestion } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ArrowRight, ArrowLeft, Loader2, Send, CheckCircle2, ClipboardList
} from "lucide-react";

interface ApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip;
}

const STEPS = ["Your Details", "Questions", "Submit"];

const ApplicationModal = ({ open, onOpenChange, trip }: ApplicationModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Auto fields
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  // Custom question answers
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const questions = trip.applicationConfig?.customQuestions || [];
  const hasQuestions = questions.length > 0;

  const updateAnswer = (qId: string, val: string | string[]) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const toggleMultiAnswer = (qId: string, option: string) => {
    setAnswers(prev => {
      const current = (prev[qId] as string[]) || [];
      const updated = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
      return { ...prev, [qId]: updated };
    });
  };

  const canProceedStep1 = name.trim() && email.trim() && phone.trim() && age.trim();

  const canProceedStep2 = questions.every(q => {
    if (!q.required) return true;
    const a = answers[q.id];
    if (Array.isArray(a)) return a.length > 0;
    return a && (a as string).trim().length > 0;
  });

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setStep(hasQuestions ? 3 : 2); // success
    toast.success("Application submitted! 🎉");
  };

  const resetAndClose = () => {
    setStep(0);
    setAnswers({});
    onOpenChange(false);
  };

  const successStep = hasQuestions ? 3 : 2;

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {step < successStep && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Apply to Join</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                {(hasQuestions ? STEPS : ["Your Details", "Submit"]).map((s, i) => (
                  <span key={s} className={cn("font-medium", i <= step ? "text-primary" : "")}>{s}</span>
                ))}
              </div>
              <Progress value={((step + 1) / (hasQuestions ? STEPS.length : 2)) * 100} className="h-1.5" />
            </div>
            <div className="rounded-lg bg-muted/30 px-3 py-2 text-sm">
              <span className="font-medium">{trip.title}</span>
              <span className="text-muted-foreground ml-2">• {trip.destination}</span>
            </div>
          </>
        )}

        {/* Step 1: Personal Details */}
        {step === 0 && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Full Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Email *</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Phone *</Label>
                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Age *</Label>
                <Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="25" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Gender <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue placeholder="Prefer not to say" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="prefer-not">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => setStep(1)} disabled={!canProceedStep1}>
              {hasQuestions ? (
                <>Continue <ArrowRight className="ml-1.5 h-4 w-4" /></>
              ) : (
                <>Review & Submit <ArrowRight className="ml-1.5 h-4 w-4" /></>
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Custom Questions (only if questions exist) */}
        {step === 1 && hasQuestions && (
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {q.question} {q.required && <span className="text-destructive">*</span>}
                </Label>
                {q.type === "short" && (
                  <Input
                    value={(answers[q.id] as string) || ""}
                    onChange={e => updateAnswer(q.id, e.target.value)}
                    placeholder="Your answer..."
                  />
                )}
                {q.type === "long" && (
                  <Textarea
                    rows={3}
                    value={(answers[q.id] as string) || ""}
                    onChange={e => updateAnswer(q.id, e.target.value)}
                    placeholder="Your answer..."
                  />
                )}
                {q.type === "single_select" && q.options && (
                  <Select value={(answers[q.id] as string) || ""} onValueChange={v => updateAnswer(q.id, v)}>
                    <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                    <SelectContent>
                      {q.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {q.type === "multiple_choice" && q.options && (
                  <div className="flex flex-wrap gap-2">
                    {q.options.map(opt => {
                      const selected = ((answers[q.id] as string[]) || []).includes(opt);
                      return (
                        <Badge
                          key={opt}
                          variant={selected ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleMultiAnswer(q.id, opt)}
                        >
                          {opt}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep(2)} disabled={!canProceedStep2} className="flex-1">
                Review <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Submit review step */}
        {((step === 1 && !hasQuestions) || (step === 2 && hasQuestions)) && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{phone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Age</span><span className="font-medium">{age}</span></div>
              {gender && <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span className="font-medium capitalize">{gender}</span></div>}
            </div>

            {hasQuestions && Object.keys(answers).length > 0 && (
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Your Answers</p>
                {questions.map(q => {
                  const a = answers[q.id];
                  if (!a || (Array.isArray(a) && a.length === 0)) return null;
                  return (
                    <div key={q.id}>
                      <p className="text-xs text-muted-foreground">{q.question}</p>
                      <p className="font-medium">{Array.isArray(a) ? a.join(", ") : a}</p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="rounded-lg bg-primary/5 p-3 text-sm text-muted-foreground">
              <ClipboardList className="inline h-4 w-4 mr-1.5 text-primary" />
              The host will review your application and get back to you.
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(hasQuestions ? 1 : 0)} className="flex-1">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
                Submit Application
              </Button>
            </div>
          </div>
        )}

        {/* Success */}
        {step === successStep && (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Application Submitted!</h3>
              <p className="mt-1 text-sm text-muted-foreground">The host will review your application and get back to you.</p>
            </div>
            <p className="text-xs text-muted-foreground">You'll receive a notification when the host responds.</p>
            <Button onClick={resetAndClose} className="w-full">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationModal;
