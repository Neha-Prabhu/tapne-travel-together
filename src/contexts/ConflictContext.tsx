import React, { createContext, useCallback, useContext, useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Copy, RefreshCw, Check } from "lucide-react";

interface ConflictPayload {
  label: string;
  unsavedText: string;
  onReload: () => void | Promise<void>;
}

interface Ctx {
  openConflict: (p: ConflictPayload) => void;
}

const ConflictContext = createContext<Ctx | undefined>(undefined);

export const ConflictProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [payload, setPayload] = useState<ConflictPayload | null>(null);
  const [copied, setCopied] = useState(false);
  const [reloading, setReloading] = useState(false);

  const openConflict = useCallback((p: ConflictPayload) => {
    setCopied(false);
    setReloading(false);
    setPayload(p);
  }, []);

  const copy = async () => {
    if (!payload) return;
    try { await navigator.clipboard.writeText(payload.unsavedText); setCopied(true); }
    catch { /* ignore */ }
  };

  const reload = async () => {
    if (!payload) return;
    setReloading(true);
    try { await payload.onReload(); } finally {
      setReloading(false);
      setPayload(null);
    }
  };

  return (
    <ConflictContext.Provider value={{ openConflict }}>
      {children}
      <AlertDialog open={!!payload} onOpenChange={(v) => { if (!v) setPayload(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              This {payload?.label} changed elsewhere
            </AlertDialogTitle>
            <AlertDialogDescription>
              Someone else (or another tab) updated this {payload?.label} while you were editing.
              Your unsaved changes are shown below. Copy them if you'd like to keep them, then
              reload to see the latest version before editing again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            readOnly
            value={payload?.unsavedText || ""}
            className="max-h-56 text-xs"
            rows={8}
          />
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={copy}>
              {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
              {copied ? "Copied" : "Copy unsaved content"}
            </Button>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); reload(); }} disabled={reloading}>
              <RefreshCw className={`mr-1.5 h-4 w-4 ${reloading ? "animate-spin" : ""}`} />
              Reload latest
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConflictContext.Provider>
  );
};

export function useConflict(): Ctx {
  const ctx = useContext(ConflictContext);
  if (!ctx) return { openConflict: () => {} };
  return ctx;
}

/** Returns true if the error is a 409 edit_conflict. */
export function isEditConflict(err: any): boolean {
  return !!err && (err.status === 409) && (err.code === "edit_conflict" || err.reason === "edit_conflict");
}
