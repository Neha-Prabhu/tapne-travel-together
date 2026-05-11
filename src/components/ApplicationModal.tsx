import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import type { TripData, ApplicationQuestionData } from "@/types/api";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ArrowRight, ArrowLeft, Loader2, Send, CheckCircle2, ClipboardList
} from "lucide-react";

interface ApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: TripData;
  onSubmitted?: () => void;
}

const ApplicationModal = ({ open, onOpenChange, trip, onSubmitted }: ApplicationModalProps) => {
  const { user } = useAuth();
  const questions: ApplicationQuestionData[] = trip.application_questions || [];
  const hasQuestions = questions.length > 0;

  const STEPS = useMemo(
    () => hasQuestions ? ["Your Details", "Questions", "Submit"] : ["Your Details", "Submit"],
    [hasQuestions]
  );

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  // Answer state: id → string | string[]
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const setAnswer = (id: string, val: string | string[]) =>
    setAnswers(prev => ({ ...prev, [id]: val }));

  const canProceedDetails = name.trim() && email.trim() && phone.trim() && age.trim();

  const requiredAnswered = questions.every(q => {
    if (!q.required) return true;
    const a = answers[q.id];
    if (q.type === "multiple_choice") return Array.isArray(a) && a.length > 0;
    return typeof a === "string" && a.trim().length > 0;
  });

  const submitStep = STEPS.length - 1; // last step before success
  const reviewStep = submitStep; // same — review/submit step
  const successStep = STEPS.length;

  const goNext = () => setStep(s => s + 1);
  const goBack = () => setStep(s => Math.max(0, s - 1));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const lines: string[] = [
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Age: ${age}`,
        `Gender: ${gender || "Not specified"}`,
      ];
      if (hasQuestions) {
        lines.push("", "— Application Answers —");
        questions.forEach(q => {
          const a = answers[q.id];
          const display = Array.isArray(a) ? a.join(", ") : (a || "—");
          lines.push(`${q.question}: ${display}`);
        });
      }
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      await apiPost(`${cfg.api.trips}${trip.id}/join-request/`, {
        message: lines.join("\n"),
        answers,
      });
      setStep(successStep);
      toast.success("Application submitted! 🎉");
      onSubmitted?.();
    } catch (err: any) {
      if (err?.error === "already_requested") {
        toast.error("You already have a pending application");
      } else {
        toast.error(err?.error || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep(0);
    onOpenChange(false);
  };

  // Step indices for the question / review steps depend on hasQuestions
  const detailsIdx = 0;
  const questionsIdx = hasQuestions ? 1 : -1;
  const reviewIdx = hasQuestions ? 2 : 1;

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
                {STEPS.map((s, i) => (
                  <span key={s} className={cn("font-medium", i <= step ? "text-primary" : "")}>{s}</span>
                ))}
              </div>
              <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />
            </div>
            <div className="rounded-lg bg-muted/30 px-3 py-2 text-sm">
              <span className="font-medium">{trip.title}</span>
              <span className="text-muted-foreground ml-2">• {trip.destination}</span>
            </div>
          </>
        )}

        {/* Step: Personal Details */}
        {step === detailsIdx && (
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
            <Button className="w-full" onClick={goNext} disabled={!canProceedDetails}>
              {hasQuestions ? "Continue to Questions" : "Review & Submit"} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step: Custom Questions */}
        {hasQuestions && step === questionsIdx && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">The host has a few questions for applicants.</p>
            {questions.map((q, i) => {
              const a = answers[q.id];
              const aStr = typeof a === "string" ? a : "";
              const aArr = Array.isArray(a) ? a : [];
              return (
                <div key={q.id} className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    {i + 1}. {q.question}
                    {q.required && <span className="text-destructive"> *</span>}
                  </Label>
                  {q.type === "short" && (
                    <Input value={aStr} onChange={e => setAnswer(q.id, e.target.value)} placeholder="Your answer" />
                  )}
                  {q.type === "long" && (
                    <Textarea rows={4} value={aStr} onChange={e => setAnswer(q.id, e.target.value)} placeholder="Your answer" />
                  )}
                  {q.type === "single_select" && (
                    <Select value={aStr} onValueChange={v => setAnswer(q.id, v)}>
                      <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                      <SelectContent>
                        {(q.options || []).map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {q.type === "multiple_choice" && (
                    <div className="space-y-1.5">
                      {(q.options || []).map(opt => {
                        const checked = aArr.includes(opt);
                        return (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => {
                                const next = v
                                  ? [...aArr, opt]
                                  : aArr.filter(o => o !== opt);
                                setAnswer(q.id, next);
                              }}
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex gap-2">
              <Button variant="outline" onClick={goBack} className="flex-1">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
              <Button onClick={goNext} disabled={!requiredAnswered} className="flex-1">
                Review & Submit <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
            {!requiredAnswered && (
              <p className="text-xs text-destructive">Please answer all required questions to continue.</p>
            )}
          </div>
        )}

        {/* Step: Review & Submit */}
        {step === reviewIdx && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{phone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Age</span><span className="font-medium">{age}</span></div>
              {gender && <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span className="font-medium capitalize">{gender}</span></div>}
            </div>

            {hasQuestions && (
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <p className="font-medium text-foreground">Your answers</p>
                {questions.map(q => {
                  const a = answers[q.id];
                  const display = Array.isArray(a) ? a.join(", ") : (a || "—");
                  return (
                    <div key={q.id}>
                      <p className="text-xs text-muted-foreground">{q.question}</p>
                      <p className="font-medium whitespace-pre-wrap">{display}</p>
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
              <Button variant="outline" onClick={goBack} className="flex-1">
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
