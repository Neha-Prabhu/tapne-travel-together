import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle, CheckCircle2, Loader2, ShieldOff } from "lucide-react";
import { apiPost } from "@/lib/api";
import { toast } from "sonner";

export type ReportTargetType =
  | "profile"
  | "trip"
  | "story"
  | "review"
  | "message"
  | "comment"
  | "reply";

export interface ReportTarget {
  type: ReportTargetType;
  id: string | number;
  /** Human-visible summary of the reported item (e.g. "Priya's profile", "Goa Backpacking"). */
  label: string;
  /** Owner of the reported item, used for the optional post-success Block CTA. */
  ownerUsername?: string;
  ownerDisplayName?: string;
  /** True when reporter and owner share an active trip commitment (host or approved). */
  hasActiveSharedCommitment?: boolean;
}

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  target: ReportTarget | null;
}

const REASONS: { value: string; label: string }[] = [
  { value: "harassment", label: "Harassment or threats" },
  { value: "spam", label: "Spam or scam" },
  { value: "impersonation", label: "Impersonation" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "hate", label: "Hate or discrimination" },
  { value: "unsafe", label: "Unsafe trip or conduct" },
  { value: "other", label: "Other" },
];

const MAX_DETAIL = 2000;

const ReportDialog = ({ open, onOpenChange, target }: ReportDialogProps) => {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"form" | "submitting" | "success" | "error">("form");
  const [errorText, setErrorText] = useState("");
  const [blockPending, setBlockPending] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setReason(""); setDetails(""); setState("form"); setErrorText("");
      setBlockPending(false); setBlockConfirmOpen(false);
    }
  }, [open]);

  const canSubmit = useMemo(
    () => !!reason && details.length <= MAX_DETAIL && !!target,
    [reason, details, target]
  );

  const submit = async () => {
    if (!target || !canSubmit) return;
    setState("submitting"); setErrorText("");
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      const url = cfg.api.reports || `${cfg.api.base}/reports/`;
      await apiPost(url, {
        target_type: target.type,
        target_id: target.id,
        reason,
        details: details.trim() || undefined,
      });
      setState("success");
    } catch (err: any) {
      setErrorText(err?.error || "Couldn't submit your report. Please try again.");
      setState("error");
    }
  };

  const startBlock = () => setBlockConfirmOpen(true);

  const confirmBlock = async () => {
    if (!target?.ownerUsername) return;
    setBlockPending(true);
    try {
      const cfg = window.TAPNE_RUNTIME_CONFIG;
      await apiPost(`${cfg.api.blocks}${target.ownerUsername}/`, {});
      toast.success(`Blocked ${target.ownerDisplayName || target.ownerUsername}.`);
      setBlockConfirmOpen(false);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.error || "Could not block. Please try again.");
    } finally {
      setBlockPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (state !== "submitting" && !blockPending) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {state === "success" ? <><CheckCircle2 className="h-5 w-5 text-primary" /> Report received</> : <>Report {target?.type ?? "content"}</>}
          </DialogTitle>
          <DialogDescription>
            {state === "success"
              ? "Thanks — our team will take a look. We won't share your name with the reported member."
              : target
                ? <>Reporting <span className="font-medium text-foreground">{target.label}</span>. Pick a reason and add optional details.</>
                : ""}
          </DialogDescription>
        </DialogHeader>

        {state !== "success" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reason</Label>
              <RadioGroup value={reason} onValueChange={setReason} className="space-y-1.5">
                {REASONS.map((r) => (
                  <label key={r.value} htmlFor={`rr-${r.value}`} className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-2.5 hover:bg-muted/40">
                    <RadioGroupItem value={r.value} id={`rr-${r.value}`} />
                    <span className="text-sm">{r.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Details <span className="text-xs font-normal text-muted-foreground">(optional)</span></Label>
                <span className="text-xs text-muted-foreground">{details.length}/{MAX_DETAIL}</span>
              </div>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value.slice(0, MAX_DETAIL))}
                placeholder="Add any context that could help us investigate."
                rows={4}
                disabled={state === "submitting"}
              />
            </div>

            {state === "error" && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorText}</span>
              </div>
            )}
          </div>
        )}

        {state === "success" && target?.ownerUsername && (
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
            <p className="font-medium text-foreground">Also block {target.ownerDisplayName || target.ownerUsername}?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              You can block them so they can't message you or view your profile.
              {target.hasActiveSharedCommitment && " You currently share an active trip — that trip will move to a read-only safety state until it ends."}
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>Not now</Button>
              <Button size="sm" variant="outline" onClick={startBlock}>
                <ShieldOff className="mr-1.5 h-3.5 w-3.5" />Block this member
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {state === "success" ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={state === "submitting"}>Cancel</Button>
              <Button onClick={submit} disabled={!canSubmit || state === "submitting"}>
                {state === "submitting" && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                {state === "error" ? "Retry" : "Submit report"}
              </Button>
            </>
          )}
        </DialogFooter>

        {/* Nested block confirmation */}
        <Dialog open={blockConfirmOpen} onOpenChange={(o) => { if (!blockPending) setBlockConfirmOpen(o); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Block {target?.ownerDisplayName || target?.ownerUsername}?</DialogTitle>
              <DialogDescription>
                They won't be able to message you or view your profile.
                {target?.hasActiveSharedCommitment && " Your shared active trip will become read-only until it ends."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setBlockConfirmOpen(false)} disabled={blockPending}>Cancel</Button>
              <Button onClick={confirmBlock} disabled={blockPending}>
                {blockPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Block
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
